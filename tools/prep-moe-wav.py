#!/usr/bin/env python3
"""把教育部手冊的注音音檔整理成適合遊戲使用的樣子。

原始檔是 44.1kHz 立體聲 WAV，每個約 0.8 秒。直接用有兩個問題：

1. 比 say 合成的語詞／介面音檔安靜很多（rms 約 0.064 對 0.168），
   混在一起播時最重要的符號發音反而最小聲。
2. 37 個檔彼此音量也不齊（rms 0.045 ~ 0.115，差 2.5 倍）。

所以這裡做三件事：轉單聲道、切掉頭尾靜音、統一響度。
響度用 rms 對齊而不是峰值對齊 —— 峰值對齊會被單一個爆音帶偏，
rms 比較接近人耳感覺到的大小聲。再用峰值上限避免削波。

用法： prep-moe-wav.py <輸入.WAV> <輸出.wav>
"""
import struct
import sys
import wave

TARGET_RMS = 0.16   # 對齊 say 合成音檔的響度
PEAK_CEIL = 0.95    # 峰值上限，留一點空間避免削波
SILENCE = 0.02      # 低於峰值這個比例就當作靜音
PAD_MS = 40         # 頭尾各保留一點餘裕，不要切得太緊


def read_mono(path):
    with wave.open(path, 'rb') as w:
        if w.getsampwidth() != 2:
            raise SystemExit('只支援 16-bit WAV：' + path)
        rate, ch, n = w.getframerate(), w.getnchannels(), w.getnframes()
        data = struct.unpack('<%dh' % (n * ch), w.readframes(n))
    if ch > 1:  # 取平均而不是只取左聲道，免得剛好挑到比較小聲的那邊
        data = [sum(data[i:i + ch]) // ch for i in range(0, len(data), ch)]
    return list(data), rate


def trim(samples, rate):
    peak = max((abs(s) for s in samples), default=0)
    if peak == 0:
        return samples
    floor = peak * SILENCE
    first = next((i for i, s in enumerate(samples) if abs(s) > floor), 0)
    last = len(samples) - next(
        (i for i, s in enumerate(reversed(samples)) if abs(s) > floor), 0)
    pad = int(rate * PAD_MS / 1000)
    return samples[max(0, first - pad):min(len(samples), last + pad)]


def normalise(samples):
    if not samples:
        return samples
    rms = (sum(s * s for s in samples) / len(samples)) ** 0.5 / 32768.0
    peak = max(abs(s) for s in samples) / 32768.0
    if rms == 0:
        return samples
    gain = TARGET_RMS / rms
    if peak * gain > PEAK_CEIL:      # 別為了追響度而削波
        gain = PEAK_CEIL / peak
    return [max(-32768, min(32767, int(s * gain))) for s in samples]


def main():
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    samples, rate = read_mono(sys.argv[1])
    samples = normalise(trim(samples, rate))
    with wave.open(sys.argv[2], 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(struct.pack('<%dh' % len(samples), *samples))


if __name__ == '__main__':
    main()
