/* 看圖配注音的語詞題庫，girl / boy 兩副牌。

   挑選規則（很重要，改資料時請一起遵守）：
   1. 目標音必須在「第一個音節的開頭」。
   2. 排除有常見「小X／大X」說法、且換了開頭音的詞。
      例：🐶 可能被叫成「狗」(ㄍ) 或「小狗」(ㄒ) — 所以不用狗。
   3. 優先雙音節具體名詞，4-5 歲說得出口的。
   4. 每一筆的 zhuyin 欄都要對照實際注音，不要憑印象。

   img 有對應檔案就顯示圖，沒有就 fallback 到大 Emoji，
   所以在產圖之前遊戲就能完整玩。

   韻母幾乎沒有「以它開頭」的語詞（沒有詞以 ㄜ 或 ㄥ 開頭），
   湊得到的才收，湊不到的符號不出看圖題，改出聽音題與描寫題。 */
(function (Kid) {
  'use strict';

  const WORDS = {
    // ── 聲母 ──────────────────────────────────────────
    b:  { girl: { word: '包子', zhuyin: 'ㄅㄠ˙ㄗ',      emoji: '🥟' },
          boy:  { word: '棒球', zhuyin: 'ㄅㄤˋㄑㄧㄡˊ',  emoji: '⚾' } },
    p:  { girl: { word: '蘋果', zhuyin: 'ㄆㄧㄥˊㄍㄨㄛˇ', emoji: '🍎' },
          boy:  { word: '皮球', zhuyin: 'ㄆㄧˊㄑㄧㄡˊ',  emoji: '🏀' } },
    m:  { girl: { word: '貓咪', zhuyin: 'ㄇㄠㄇㄧ',      emoji: '🐱' },
          boy:  { word: '帽子', zhuyin: 'ㄇㄠˋ˙ㄗ',     emoji: '🧢' } },
    f:  { girl: { word: '房子', zhuyin: 'ㄈㄤˊ˙ㄗ',     emoji: '🏠' },
          boy:  { word: '飛機', zhuyin: 'ㄈㄟㄐㄧ',      emoji: '✈️' } },
    d:  { girl: { word: '蛋糕', zhuyin: 'ㄉㄢˋㄍㄠ',     emoji: '🎂' },
          boy:  { word: '電車', zhuyin: 'ㄉㄧㄢˋㄔㄜ',   emoji: '🚋' } },
    t:  { girl: { word: '兔子', zhuyin: 'ㄊㄨˋ˙ㄗ',     emoji: '🐰' },
          boy:  { word: '太陽', zhuyin: 'ㄊㄞˋㄧㄤˊ',    emoji: '☀️' } },
    n:  { girl: { word: '牛奶', zhuyin: 'ㄋㄧㄡˊㄋㄞˇ',  emoji: '🥛' },
          boy:  { word: '鳥',   zhuyin: 'ㄋㄧㄠˇ',       emoji: '🐦' } },
    l:  { girl: { word: '蘿蔔', zhuyin: 'ㄌㄨㄛˊ˙ㄅㄛ',  emoji: '🥕' },
          boy:  { word: '龍',   zhuyin: 'ㄌㄨㄥˊ',       emoji: '🐉' } },
    g:  { girl: { word: '果汁', zhuyin: 'ㄍㄨㄛˇㄓ',     emoji: '🧃' },
          boy:  { word: '鋼琴', zhuyin: 'ㄍㄤㄑㄧㄣˊ',   emoji: '🎹' } },
    k:  { girl: { word: '卡片', zhuyin: 'ㄎㄚˇㄆㄧㄢˋ',  emoji: '💌' },
          boy:  { word: '恐龍', zhuyin: 'ㄎㄨㄥˇㄌㄨㄥˊ', emoji: '🦖' } },
    h:  { girl: { word: '蝴蝶', zhuyin: 'ㄏㄨˊㄉㄧㄝˊ',  emoji: '🦋' },
          boy:  { word: '火箭', zhuyin: 'ㄏㄨㄛˇㄐㄧㄢˋ', emoji: '🚀' } },
    j:  { girl: { word: '雞蛋', zhuyin: 'ㄐㄧㄉㄢˋ',     emoji: '🥚' },
          boy:  { word: '積木', zhuyin: 'ㄐㄧㄇㄨˋ',     emoji: '🧱' } },
    q:  { girl: { word: '裙子', zhuyin: 'ㄑㄩㄣˊ˙ㄗ',    emoji: '👗' },
          boy:  { word: '汽車', zhuyin: 'ㄑㄧˋㄔㄜ',     emoji: '🚗' } },
    x:  { girl: { word: '西瓜', zhuyin: 'ㄒㄧㄍㄨㄚ',     emoji: '🍉' },
          boy:  { word: '星星', zhuyin: 'ㄒㄧㄥㄒㄧㄥ',   emoji: '⭐' } },
    zh: { girl: { word: '蜘蛛', zhuyin: 'ㄓㄓㄨ',        emoji: '🕷️' },
          boy:  { word: '章魚', zhuyin: 'ㄓㄤㄩˊ',       emoji: '🐙' } },
    ch: { girl: { word: '蟲',   zhuyin: 'ㄔㄨㄥˊ',       emoji: '🐛' },
          boy:  { word: '長頸鹿', zhuyin: 'ㄔㄤˊㄐㄧㄥˇㄌㄨˋ', emoji: '🦒' } },
    sh: { girl: { word: '獅子', zhuyin: 'ㄕ˙ㄗ',        emoji: '🦁' },
          boy:  { word: '書',   zhuyin: 'ㄕㄨ',         emoji: '📖' } },
    r:  { girl: { word: '肉',   zhuyin: 'ㄖㄡˋ',        emoji: '🍖' },
          boy:  { word: '熱狗', zhuyin: 'ㄖㄜˋㄍㄡˇ',    emoji: '🌭' } },
    z:  { girl: { word: '嘴巴', zhuyin: 'ㄗㄨㄟˇㄅㄚ',   emoji: '👄' },
          boy:  { word: '足球', zhuyin: 'ㄗㄨˊㄑㄧㄡˊ',  emoji: '⚽' } },
    c:  { girl: { word: '草莓', zhuyin: 'ㄘㄠˇㄇㄟˊ',    emoji: '🍓' },
          boy:  { word: '刺蝟', zhuyin: 'ㄘˋㄨㄟˋ',     emoji: '🦔' } },
    s:  { girl: { word: '森林', zhuyin: 'ㄙㄣㄌㄧㄣˊ',   emoji: '🌲' },
          boy:  { word: '松鼠', zhuyin: 'ㄙㄨㄥㄕㄨˇ',   emoji: '🐿️' } },

    // ── 介母 ──────────────────────────────────────────
    i:  { girl: { word: '椅子', zhuyin: 'ㄧˇ˙ㄗ',      emoji: '🪑' },
          boy:  { word: '衣服', zhuyin: 'ㄧㄈㄨˊ',      emoji: '👕' } },
    u:  { girl: { word: '娃娃', zhuyin: 'ㄨㄚˊ˙ㄨㄚ',   emoji: '🧸' },
          boy:  { word: '烏龜', zhuyin: 'ㄨㄍㄨㄟ',      emoji: '🐢' } },
    v:  { girl: { word: '雨傘', zhuyin: 'ㄩˇㄙㄢˇ',     emoji: '☂️' },
          boy:  { word: '魚',   zhuyin: 'ㄩˊ',         emoji: '🐟' } },

    // ── 韻母 ── 只有這四個湊得到以它開頭的語詞 ──────────
    e:  { girl: { word: '鵝',   zhuyin: 'ㄜˊ',         emoji: '🦢' },
          boy:  { word: '鵝',   zhuyin: 'ㄜˊ',         emoji: '🦢' } },
    ai: { girl: { word: '愛心', zhuyin: 'ㄞˋㄒㄧㄣ',    emoji: '❤️' },
          boy:  { word: '愛心', zhuyin: 'ㄞˋㄒㄧㄣ',    emoji: '💙' } },
    an: { girl: { word: '安全帽', zhuyin: 'ㄢㄑㄩㄢˊㄇㄠˋ', emoji: '⛑️' },
          boy:  { word: '安全帽', zhuyin: 'ㄢㄑㄩㄢˊㄇㄠˋ', emoji: '⛑️' } },
    er: { girl: { word: '耳朵', zhuyin: 'ㄦˇㄉㄨㄛ',    emoji: '👂' },
          boy:  { word: '耳朵', zhuyin: 'ㄦˇㄉㄨㄛ',    emoji: '👂' } },
    // 湊不到語詞的：ㄛ ㄝ ㄟ ㄠ ㄡ ㄣ ㄤ ㄥ — 不出看圖題
  };

  /* 每一筆自動補上圖檔路徑，省得手寫 74 次。 */
  Object.keys(WORDS).forEach(function (id) {
    ['girl', 'boy'].forEach(function (deck) {
      WORDS[id][deck].img = 'assets/' + deck + '/' + id + '.png';
      WORDS[id][deck].audio = 'audio/word/' + deck + '/' + id + '.m4a';
    });
  });

  Kid.zhuyin = Kid.zhuyin || {};
  Kid.zhuyin.WORDS = WORDS;
  Kid.zhuyin.word = function (id, deck) {
    return WORDS[id] ? WORDS[id][deck] : null;
  };
  Kid.zhuyin.hasWord = function (id) { return !!WORDS[id]; };
})(window.Kid = window.Kid || {});
