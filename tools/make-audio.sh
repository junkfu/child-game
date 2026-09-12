#!/bin/bash
# 產生注音遊戲的所有音檔（macOS 專用，用系統內建的台灣中文語音）。
#
# 為什麼是預先產檔而不是瀏覽器即時語音合成：
#   1. 發音可以在出貨前逐一聽過驗收，不用賭使用者裝置上裝了什麼語音。
#   2. 跨瀏覽器/跨平台一致，Windows、Android、iPad 聽到的完全一樣。
#   3. file:// 直接開也能播（HTMLAudioElement 可以，Web Audio 的
#      decodeAudioData 不行，所以播放端一律用 <audio>）。
#
# 已驗證的重要事實：Apple 的中文語音「原生看得懂注音符號」。
#   say "ㄅ"  的輸出與 say "玻" 位元組完全相同（教育部呼讀音）
#   say "ㄍ"  === say "哥"
#   say "ㄅㄚ" === say "八"     ← 大部分二拼會融成一個完整音節
#   ㄈ ㄝ ㄟ ㄥ（找不到同音漢字的那四個）也都唸得出來
# 所以「單個符號」不需要任何代讀漢字對照表，直接餵注音字串就好。
#
# 但「拼讀音節」是例外：捲舌／舌尖前聲母配 ㄨ 不會融合，
#   ㄓㄨ 0.486s vs 豬 0.324s（被唸成 ㄓ－ㄨ 兩段）
# 所以音節一律用 syllables.js 裡的代表字產生，每個都保證是單音節。
#
# 用法：  ./tools/make-audio.sh          產生全部
#         ./tools/make-audio.sh --check  只驗證、不寫檔
set -euo pipefail

VOICE="${VOICE:-Meijia}"          # 台灣中文女聲；say -v '?' 可看其他選擇
RATE="${RATE:-150}"               # 放慢一點，幼兒比較聽得清楚
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/dist/games/zhuyin/audio"
CHECK_ONLY=0
[ "${1:-}" = "--check" ] && CHECK_ONLY=1

if ! command -v say >/dev/null 2>&1; then
  echo "錯誤：找不到 say 指令，這個腳本只能在 macOS 上跑。" >&2; exit 1
fi
if ! say -v '?' | grep -q "^$VOICE "; then
  echo "錯誤：系統沒有安裝語音 '$VOICE'。" >&2
  echo "可用的中文語音：" >&2; say -v '?' | grep -E 'zh_(TW|CN|HK)' >&2; exit 1
fi

# say 出來的 aiff 很大，轉成 m4a 讓 repo 不要腫。
emit() { # emit <文字> <輸出路徑>
  local text="$1" dest="$2" tmp
  [ "$CHECK_ONLY" = 1 ] && return 0
  mkdir -p "$(dirname "$dest")"
  tmp="$(mktemp -t zhuyin).aiff"
  say -v "$VOICE" -r "$RATE" -o "$tmp" "$text"
  afconvert -f m4af -d aac -b 48000 "$tmp" "$dest" >/dev/null
  rm -f "$tmp"
}

# 把資料檔裡的清單抽出來，避免在兩個地方各維護一份。
list() { node -e '
  global.window = {};
  ["symbols","words","syllables"].forEach(f =>
    require(process.argv[1] + "/dist/games/zhuyin/data/" + f + ".js"));
  const K = global.window.Kid.zhuyin;
  const out = [];
  K.SYMBOLS.forEach(s => out.push(["sym/" + s.id, s.zhuyin, s.zhuyin]));
  // 音節用代表字產生，不用注音字串 —— 見 syllables.js 的說明。
  K.SYLLABLES.forEach(s => out.push(["syl/" + s.id, s.char, K.syllableText(s)]));
  Object.keys(K.WORDS).forEach(id => ["girl","boy"].forEach(d =>
    out.push(["word/" + d + "/" + id, K.WORDS[id][d].word, ""])));
  out.forEach(r => console.log(r.join("\t")));
' "$ROOT"; }

# 介面語音：小朋友不識字，每一句指令都要唸得出來。
UI="listen	聽聽看，這是哪一個？
picture	這個東西，是什麼音開頭的？
blend	拼拼看，它們合起來唸什麼？
trace	跟著虛線描描看
right	答對了，好棒！
wrong	沒關係，再試一次
again	再聽一次
unit_done	這一關完成囉
pick_girl	女孩版
pick_boy	男孩版"

echo "語音：${VOICE}  語速：${RATE}"
[ "$CHECK_ONLY" = 1 ] && echo "（--check：只驗證，不寫檔）"

n=0
while IFS=$'\t' read -r path text expect; do
  [ -z "${path:-}" ] && continue
  emit "$text" "$OUT/$path.m4a"
  n=$((n+1))
  printf '\r  產生中 %3d …' "$n"
done < <(list)

while IFS=$'\t' read -r name text; do
  [ -z "${name:-}" ] && continue
  emit "$text" "$OUT/ui/$name.m4a"
  n=$((n+1))
  printf '\r  產生中 %3d …' "$n"
done <<< "$UI"

printf '\r  完成 %d 個音檔%s\n' "$n" "$( [ "$CHECK_ONLY" = 1 ] && echo '（未寫入）' || echo '' )"
[ "$CHECK_ONLY" = 1 ] || echo "輸出目錄：$OUT"
[ "$CHECK_ONLY" = 1 ] || du -sh "$OUT"
