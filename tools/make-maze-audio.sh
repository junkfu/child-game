#!/bin/bash
# 迷宮遊戲的介面語音。跟 make-audio.sh 同一套合成設定（Meijia、語速 150），
# 分開寫是因為那支腳本綁著注音的清單與數量檢查。
#
# 用法：  ./tools/make-maze-audio.sh
set -euo pipefail

VOICE="${VOICE:-Meijia}"
RATE="${RATE:-150}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/dist/games/maze/audio/ui"

command -v say >/dev/null 2>&1 || { echo "錯誤：找不到 say，這個腳本只能在 macOS 上跑。" >&2; exit 1; }
say -v '?' | grep -q "^$VOICE " || { echo "錯誤：系統沒有語音 '$VOICE'。" >&2; exit 1; }
mkdir -p "$OUT"

# 小朋友不識字，每一句指令都要唸得出來。
while IFS=$'\t' read -r name text; do
  [ -z "${name:-}" ] && continue
  tmp="$(mktemp -t maze).aiff"
  say -v "$VOICE" -r "$RATE" -o "$tmp" "$text"
  afconvert -f m4af -d aac -b 48000 "$tmp" "$OUT/$name.m4a" >/dev/null
  rm -f "$tmp"
  echo "  $name	$text"
done <<'LIST'
start	用手指帶著小怪獸，走出迷宮回家
win	走出來了，好棒！
hint	跟著虛線走，就找得到路
grab	先摸摸小怪獸，再帶著牠走
LIST
echo "輸出目錄：$OUT"
