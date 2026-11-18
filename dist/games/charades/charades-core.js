/* 超級比一比的題庫與洗牌。不碰 DOM，tests/charades.test.cjs 直接載入。

   挑題規則（改題庫時請一起遵守）：
   1. 4-5 歲演得出來：動物、日常動作、交通工具，不要抽象詞。
   2. 不用看字：小孩不識字，卡片以大 Emoji 為主，詞只是給大人看的。
   3. 別太像：兩張演起來幾乎一樣就只留一張（例如「小狗」「狼」只留小狗）。 */
(function (Kid) {
  'use strict';

  const ITEMS = [
    // 動物
    { id: 'cat',      word: '貓咪',     emoji: '🐱' },
    { id: 'dog',      word: '小狗',     emoji: '🐶' },
    { id: 'rabbit',   word: '兔子',     emoji: '🐰' },
    { id: 'elephant', word: '大象',     emoji: '🐘' },
    { id: 'monkey',   word: '猴子',     emoji: '🐒' },
    { id: 'lion',     word: '獅子',     emoji: '🦁' },
    { id: 'frog',     word: '青蛙',     emoji: '🐸' },
    { id: 'penguin',  word: '企鵝',     emoji: '🐧' },
    { id: 'bird',     word: '小鳥',     emoji: '🐦' },
    { id: 'fish',     word: '魚',       emoji: '🐟' },
    { id: 'snake',    word: '蛇',       emoji: '🐍' },
    { id: 'dino',     word: '恐龍',     emoji: '🦖' },
    { id: 'crab',     word: '螃蟹',     emoji: '🦀' },
    { id: 'chicken',  word: '小雞',     emoji: '🐥' },
    // 日常動作
    { id: 'teeth',    word: '刷牙',     emoji: '🪥' },
    { id: 'noodle',   word: '吃麵',     emoji: '🍜' },
    { id: 'icecream', word: '吃冰淇淋', emoji: '🍦' },
    { id: 'sleep',    word: '睡覺',     emoji: '😴' },
    { id: 'bath',     word: '洗澡',     emoji: '🛁' },
    { id: 'swim',     word: '游泳',     emoji: '🏊' },
    { id: 'umbrella', word: '撐雨傘',   emoji: '☔' },
    { id: 'dance',    word: '跳舞',     emoji: '💃' },
    { id: 'photo',    word: '拍照',     emoji: '📷' },
    { id: 'drum',     word: '打鼓',     emoji: '🥁' },
    { id: 'piano',    word: '彈鋼琴',   emoji: '🎹' },
    { id: 'soccer',   word: '踢足球',   emoji: '⚽' },
    // 交通工具
    { id: 'car',      word: '開車',     emoji: '🚗' },
    { id: 'plane',    word: '飛機',     emoji: '✈️' },
    { id: 'bike',     word: '騎腳踏車', emoji: '🚲' },
    { id: 'firetruck', word: '消防車',  emoji: '🚒' },
  ];

  /* Fisher-Yates；core.js 也有一份，這裡自帶一份讓測試不必載入 DOM 相關的檔案 */
  function shuffle(arr, rand) {
    const r = rand || Math.random;
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* 洗一袋新的：30 張抽完才重洗，不會連續抽到同一張、也不會有的一直不出現。
     last 是上一袋最後一張，新袋子的第一張避開它，接縫處不會連兩張一樣。 */
  function newBag(last, rand) {
    const bag = shuffle(ITEMS.map(function (it) { return it.id; }), rand);
    if (last && bag[0] === last) { bag[0] = bag[1]; bag[1] = last; }
    return bag;
  }

  const byId = {};
  ITEMS.forEach(function (it) { byId[it.id] = it; });

  Kid.charades = { ITEMS: ITEMS, newBag: newBag, item: function (id) { return byId[id]; } };
})(window.Kid = window.Kid || {});
