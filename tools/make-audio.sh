#!/bin/bash
# 產生注音遊戲的所有音檔。
#
# 音源有兩個，刻意分開：
#
#   1. 37 個注音符號  -> 教育部《國語注音符號手冊》的真人錄音
#      https://language.moe.gov.tw/001/Upload/files/site_content/M0001/juyin/index.html
#      手冊本體是 CC BY-ND，但音檔另採「創用CC 姓名標示 4.0 國際版本」提供，
#      可改作、可商用，標示出處即可。對照表見 tools/moe-audio-map.tsv。
#
#   2. 拼讀音節 / 語詞 / 介面語音 -> macOS 內建的台灣中文語音合成
#      這些沒有現成的官方錄音，只能合成。
#
# 為什麼符號要用真人錄音：那是整個遊戲的核心（「聽音找符號」整個玩法就靠它），
# 標準度最值得投資，而且教育部版唸得比合成音慢、對幼兒比較清楚。
# 音色不同反而變成一種提示：真人聲＝要仔細聽的題目，合成聲＝旁白說明。
#
# 為什麼不用瀏覽器即時語音合成（兩種音源都不用）：
#   speechSynthesis 唸不出注音字元（U+3105-U+3129 是注音符號區、不是漢字，
#   TTS 前端會當成未知符號丟掉），而想用同音漢字代讀又補不齊 ——
#   ㄈ ㄝ ㄟ ㄥ 在現代國語裡沒有任何一聲的字可以代讀。
#   預先產檔還有一個好處：發音可以在出貨前逐一聽過（tools/audio-check.html）。
#
# 合成音節時有一個坑：捲舌／舌尖前聲母配 ㄨ 不會融合成一個音節
#   （say "ㄓㄨ" 0.486s vs say "豬" 0.324s，被唸成「ㄓ－ㄨ」兩段）
# 那正是拼讀最不能犯的錯，所以音節一律用 syllables.js 裡的代表字產生。
#
# 用法：  ./tools/make-audio.sh                產生全部
#         ./tools/make-audio.sh --check        只列出要產什麼，不寫檔
#         ./tools/make-audio.sh --say-symbols  符號也用合成（沒網路或非 macOS 時的退路）
set -euo pipefail

VOICE="${VOICE:-Meijia}"          # 台灣中文女聲；say -v '?' 可看其他選擇
RATE="${RATE:-150}"               # 放慢一點，幼兒比較聽得清楚
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/dist/games/zhuyin/audio"
CACHE="$ROOT/tools/.cache"
MAP="$ROOT/tools/moe-audio-map.tsv"
ZIP_URL="https://language.moe.gov.tw/001/Upload/files/site_content/M0001/juyin/bopomofo_materials_20170213.zip"
ZIP="$CACHE/bopomofo_materials_20170213.zip"

CHECK_ONLY=0; USE_MOE=1
for a in "$@"; do
  case "$a" in
    --check) CHECK_ONLY=1 ;;
    --say-symbols) USE_MOE=0 ;;
    *) echo "不認得的參數：$a" >&2; exit 1 ;;
  esac
done

command -v say >/dev/null 2>&1 || { echo "錯誤：找不到 say，這個腳本只能在 macOS 上跑。" >&2; exit 1; }
if ! say -v '?' | grep -q "^$VOICE "; then
  echo "錯誤：系統沒有安裝語音 '$VOICE'。可用的中文語音：" >&2
  say -v '?' | grep -E 'zh_(TW|CN|HK)' >&2; exit 1
fi

# ── 教育部音檔 ────────────────────────────────────────
fetch_moe() {
  mkdir -p "$CACHE"
  if [ ! -s "$ZIP" ]; then
    echo "  下載教育部音檔包…"
    curl -fsS --max-time 180 -A "Mozilla/5.0" "$ZIP_URL" -o "$ZIP" \
      || { echo "  下載失敗，改用合成音（--say-symbols）"; return 1; }
  fi
  rm -rf "$CACHE/moe"; mkdir -p "$CACHE/moe"
  unzip -q -o "$ZIP" 'audio/*' -d "$CACHE/moe" || return 1
  return 0
}

emit_say() {   # emit_say <文字> <輸出路徑>
  [ "$CHECK_ONLY" = 1 ] && return 0
  local tmp; tmp="$(mktemp -t zhuyin).aiff"
  mkdir -p "$(dirname "$2")"
  say -v "$VOICE" -r "$RATE" -o "$tmp" "$1"
  afconvert -f m4af -d aac -b 48000 "$tmp" "$2" >/dev/null
  rm -f "$tmp"
}

emit_moe() {   # emit_moe <來源WAV> <輸出路徑>
  [ "$CHECK_ONLY" = 1 ] && return 0
  local tmp; tmp="$(mktemp -t zhuyin).wav"
  mkdir -p "$(dirname "$2")"
  # 轉單聲道、切頭尾靜音、把響度對齊到跟合成音檔一致
  python3 "$ROOT/tools/prep-moe-wav.py" "$1" "$tmp"
  afconvert -f m4af -d aac -b 48000 "$tmp" "$2" >/dev/null
  rm -f "$tmp"
}

# 清單從資料檔抽出來，避免在兩個地方各維護一份。
list_say() { node -e '
  global.window = {};
  ["symbols","words","syllables"].forEach(f =>
    require(process.argv[1] + "/dist/games/zhuyin/data/" + f + ".js"));
  const K = global.window.Kid.zhuyin;
  const out = [];
  // 音節用代表字產生，不用注音字串 —— 見檔頭說明。
  K.SYLLABLES.forEach(s => out.push(["syl/" + s.id, s.char]));
  Object.keys(K.WORDS).forEach(id => ["girl","boy"].forEach(d =>
    out.push(["word/" + d + "/" + id, K.WORDS[id][d].word])));
  out.forEach(r => console.log(r.join("\t")));
' "$ROOT"; }

list_symbols() { node -e '
  global.window = {};
  require(process.argv[1] + "/dist/games/zhuyin/data/symbols.js");
  global.window.Kid.zhuyin.SYMBOLS.forEach(s => console.log(s.id + "\t" + s.zhuyin));
' "$ROOT"; }

# 介面語音：小朋友不識字，每一句指令都要唸得出來。
#
# ⚠ feed / treasure 這兩句的文字是「重建」的，不是原本那版。
#   這個檔在 2026-09-12 被覆寫過一次，原本 adventure 模式加的那兩行沒留下來。
#   dist/.../audio/ui/feed.m4a 與 treasure.m4a 還在（3.56s / 2.86s），
#   但如果重跑這個腳本，會用下面這兩句蓋掉它們。
#   確認過措辭正確再重跑，或直接把下面兩行改成原本的句子。
UI="listen	聽聽看，這是哪一個？
picture	這個東西，是什麼音開頭的？
blend	拼拼看，它們合起來唸什麼？
trace	跟著虛線描描看
right	答對了，好棒！
wrong	沒關係，再試一次
again	再聽一次
unit_done	這一關完成囉
pick_girl	女孩版
pick_boy	男孩版
feed	聽聽看是哪一個音，把點心送給對的好朋友
treasure	聽聽看，這個音藏在哪裡呢"

# 先把清單算出來。放在 process substitution 裡的話，node 失敗不會中斷腳本，
# 會安靜地少產一堆音檔（問過一次了），所以先落地再檢查筆數。
SYMS="$(list_symbols)" || { echo "產生符號清單失敗" >&2; exit 1; }
SAYS="$(list_say)"     || { echo "產生語詞清單失敗" >&2; exit 1; }
n_sym=$(printf '%s\n' "$SYMS" | grep -c .)
n_say=$(printf '%s\n' "$SAYS" | grep -c .)
n_ui=$(printf '%s\n' "$UI" | grep -c .)
[ "$n_sym" -eq 37 ] || { echo "符號數不對：$n_sym（應為 37）" >&2; exit 1; }
[ "$n_say" -gt 0 ] || { echo "語詞清單是空的" >&2; exit 1; }
EXPECT=$(( n_sym + n_say + n_ui ))

echo "語音：${VOICE}  語速：${RATE}"
[ "$CHECK_ONLY" = 1 ] && echo "（--check：只驗證，不寫檔）"

MOE_OK=0
if [ "$USE_MOE" = 1 ]; then
  if [ "$CHECK_ONLY" = 1 ] || fetch_moe; then MOE_OK=1; fi
fi

n=0
# 37 個符號
while IFS=$'\t' read -r id zh; do
  [ -z "${id:-}" ] && continue
  if [ "$MOE_OK" = 1 ]; then
    f=$(awk -v want="$id" '$1!~/^#/ && $2==want {print $1}' "$MAP")
    [ -n "$f" ] || { echo "對照表裡找不到 $id ($zh)" >&2; exit 1; }
    src="$CACHE/moe/audio/$f.WAV"
    if [ "$CHECK_ONLY" = 1 ]; then :; else
      [ -s "$src" ] || { echo "缺少音檔 $src" >&2; exit 1; }
      emit_moe "$src" "$OUT/sym/$id.m4a"
    fi
  else
    emit_say "$zh" "$OUT/sym/$id.m4a"
  fi
  n=$((n+1)); printf '\r  產生中 %3d …' "$n"
done <<< "$SYMS"

# 音節與語詞
while IFS=$'\t' read -r path text; do
  [ -z "${path:-}" ] && continue
  emit_say "$text" "$OUT/$path.m4a"
  n=$((n+1)); printf '\r  產生中 %3d …' "$n"
done <<< "$SAYS"

# 介面語音
while IFS=$'\t' read -r name text; do
  [ -z "${name:-}" ] && continue
  emit_say "$text" "$OUT/ui/$name.m4a"
  n=$((n+1)); printf '\r  產生中 %3d …' "$n"
done <<< "$UI"

printf '\r  完成 %d 個音檔%s\n' "$n" "$([ "$CHECK_ONLY" = 1 ] && echo '（未寫入）' || echo '')"
[ "$n" -eq "$EXPECT" ] || { echo "數量不對：產了 $n 個，應該是 $EXPECT 個" >&2; exit 1; }
echo "  符號音源：$([ "$MOE_OK" = 1 ] && echo '教育部手冊真人錄音' || echo 'macOS 語音合成')"
[ "$CHECK_ONLY" = 1 ] || { echo "輸出目錄：$OUT"; du -sh "$OUT"; }
