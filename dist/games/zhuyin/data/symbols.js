/* 37 個注音符號。id 是 ASCII 檔名用的代號，zhuyin 是符號本身。
   cls: initial 聲母 / medial 介母 / final 韻母
   unit: 1-10，見 UNITS。順序刻意讓單韻母排在單元 2，
   這樣「拼拼看」從單元 2 就能玩（ㄅ+ㄚ），不必等到最後。 */
(function (Kid) {
  'use strict';

  const SYMBOLS = [
    // 單元 1 — 聲母，語詞素材最豐富，適合當第一次體驗
    { id: 'b',  zhuyin: 'ㄅ', cls: 'initial', unit: 1 },
    { id: 'p',  zhuyin: 'ㄆ', cls: 'initial', unit: 1 },
    { id: 'm',  zhuyin: 'ㄇ', cls: 'initial', unit: 1 },
    { id: 'f',  zhuyin: 'ㄈ', cls: 'initial', unit: 1 },
    // 單元 2 — 單韻母，拼讀在此解鎖
    { id: 'a',  zhuyin: 'ㄚ', cls: 'final',   unit: 2 },
    { id: 'o',  zhuyin: 'ㄛ', cls: 'final',   unit: 2 },
    { id: 'e',  zhuyin: 'ㄜ', cls: 'final',   unit: 2 },
    { id: 'eh', zhuyin: 'ㄝ', cls: 'final',   unit: 2 },
    // 單元 3
    { id: 'd',  zhuyin: 'ㄉ', cls: 'initial', unit: 3 },
    { id: 't',  zhuyin: 'ㄊ', cls: 'initial', unit: 3 },
    { id: 'n',  zhuyin: 'ㄋ', cls: 'initial', unit: 3 },
    { id: 'l',  zhuyin: 'ㄌ', cls: 'initial', unit: 3 },
    // 單元 4
    { id: 'g',  zhuyin: 'ㄍ', cls: 'initial', unit: 4 },
    { id: 'k',  zhuyin: 'ㄎ', cls: 'initial', unit: 4 },
    { id: 'h',  zhuyin: 'ㄏ', cls: 'initial', unit: 4 },
    // 單元 5 — 複韻母
    { id: 'ai', zhuyin: 'ㄞ', cls: 'final',   unit: 5 },
    { id: 'ei', zhuyin: 'ㄟ', cls: 'final',   unit: 5 },
    { id: 'ao', zhuyin: 'ㄠ', cls: 'final',   unit: 5 },
    { id: 'ou', zhuyin: 'ㄡ', cls: 'final',   unit: 5 },
    // 單元 6
    { id: 'j',  zhuyin: 'ㄐ', cls: 'initial', unit: 6 },
    { id: 'q',  zhuyin: 'ㄑ', cls: 'initial', unit: 6 },
    { id: 'x',  zhuyin: 'ㄒ', cls: 'initial', unit: 6 },
    // 單元 7
    { id: 'zh', zhuyin: 'ㄓ', cls: 'initial', unit: 7 },
    { id: 'ch', zhuyin: 'ㄔ', cls: 'initial', unit: 7 },
    { id: 'sh', zhuyin: 'ㄕ', cls: 'initial', unit: 7 },
    { id: 'r',  zhuyin: 'ㄖ', cls: 'initial', unit: 7 },
    // 單元 8
    { id: 'z',  zhuyin: 'ㄗ', cls: 'initial', unit: 8 },
    { id: 'c',  zhuyin: 'ㄘ', cls: 'initial', unit: 8 },
    { id: 's',  zhuyin: 'ㄙ', cls: 'initial', unit: 8 },
    // 單元 9 — 聲隨韻母
    { id: 'an',  zhuyin: 'ㄢ', cls: 'final',  unit: 9 },
    { id: 'en',  zhuyin: 'ㄣ', cls: 'final',  unit: 9 },
    { id: 'ang', zhuyin: 'ㄤ', cls: 'final',  unit: 9 },
    { id: 'eng', zhuyin: 'ㄥ', cls: 'final',  unit: 9 },
    { id: 'er',  zhuyin: 'ㄦ', cls: 'final',  unit: 9 },
    // 單元 10 — 介母，在聽覺上最難單獨辨認，放最後
    { id: 'i',  zhuyin: 'ㄧ', cls: 'medial',  unit: 10 },
    { id: 'u',  zhuyin: 'ㄨ', cls: 'medial',  unit: 10 },
    { id: 'v',  zhuyin: 'ㄩ', cls: 'medial',  unit: 10 },
  ];

  const UNITS = [
    { n: 1,  title: 'ㄅㄆㄇㄈ',   sub: '從最熟悉的開始' },
    { n: 2,  title: 'ㄚㄛㄜㄝ',   sub: '把嘴巴張開' },
    { n: 3,  title: 'ㄉㄊㄋㄌ',   sub: '舌頭頂一頂' },
    { n: 4,  title: 'ㄍㄎㄏ',     sub: '喉嚨深處的聲音' },
    { n: 5,  title: 'ㄞㄟㄠㄡ',   sub: '兩個音黏在一起' },
    { n: 6,  title: 'ㄐㄑㄒ',     sub: '嘴角往兩邊拉' },
    { n: 7,  title: 'ㄓㄔㄕㄖ',   sub: '舌頭捲起來' },
    { n: 8,  title: 'ㄗㄘㄙ',     sub: '牙齒輕輕碰' },
    { n: 9,  title: 'ㄢㄣㄤㄥㄦ', sub: '尾巴有鼻音' },
    { n: 10, title: 'ㄧㄨㄩ',     sub: '最後三個好朋友' },
  ];

  /* 聽力上容易混淆的組，抽誘答項時要避開（見 listen.js）。 */
  const CONFUSABLE_SOUND = [
    ['b', 'p'], ['d', 't'], ['g', 'k'], ['j', 'q'], ['z', 'c'],
    ['zh', 'z'], ['ch', 'c'], ['sh', 's'], ['en', 'eng'], ['an', 'ang'],
    ['l', 'n'], ['f', 'h'], ['zh', 'ch'], ['e', 'o'],
  ];

  /* 視覺上容易混淆的組。 */
  const CONFUSABLE_SHAPE = [
    ['n', 'en'], ['m', 'r'], ['f', 'h'], ['u', 'x'],
    ['t', 'ch'], ['d', 'sh'], ['o', 'c'], ['i', 'a'],
  ];

  const byId = {};
  SYMBOLS.forEach(function (s) { byId[s.id] = s; });

  Kid.zhuyin = Kid.zhuyin || {};
  Kid.zhuyin.SYMBOLS = SYMBOLS;
  Kid.zhuyin.UNITS = UNITS;
  Kid.zhuyin.CONFUSABLE_SOUND = CONFUSABLE_SOUND;
  Kid.zhuyin.CONFUSABLE_SHAPE = CONFUSABLE_SHAPE;
  Kid.zhuyin.symbol = function (id) { return byId[id]; };
  Kid.zhuyin.unitSymbols = function (n) {
    return SYMBOLS.filter(function (s) { return s.unit === n; });
  };
  /* 到某單元為止（含）已經學過的符號 */
  Kid.zhuyin.learnedThrough = function (n) {
    return SYMBOLS.filter(function (s) { return s.unit <= n; });
  };
})(window.Kid = window.Kid || {});
