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
    { id: 'bear',     word: '熊',       emoji: '🐻' },
    { id: 'pig',      word: '豬',       emoji: '🐷' },
    { id: 'cow',      word: '牛',       emoji: '🐮' },
    { id: 'horse',    word: '馬',       emoji: '🐴' },
    { id: 'sheep',    word: '羊',       emoji: '🐑' },
    { id: 'duck',     word: '鴨子',     emoji: '🦆' },
    { id: 'owl',      word: '貓頭鷹',   emoji: '🦉' },
    { id: 'giraffe',  word: '長頸鹿',   emoji: '🦒' },
    { id: 'kangaroo', word: '袋鼠',     emoji: '🦘' },
    { id: 'turtle',   word: '烏龜',     emoji: '🐢' },
    { id: 'octopus',  word: '章魚',     emoji: '🐙' },
    { id: 'shark',    word: '鯊魚',     emoji: '🦈' },
    { id: 'butterfly', word: '蝴蝶',    emoji: '🦋' },
    { id: 'bee',      word: '蜜蜂',     emoji: '🐝' },
    { id: 'mouse',    word: '老鼠',     emoji: '🐭' },
    { id: 'croc',     word: '鱷魚',     emoji: '🐊' },
    { id: 'koala',    word: '無尾熊',   emoji: '🐨' },
    { id: 'worm',     word: '毛毛蟲',   emoji: '🐛' },
    { id: 'snail',    word: '蝸牛',     emoji: '🐌' },
    { id: 'bat',      word: '蝙蝠',     emoji: '🦇' },
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
    { id: 'wash',     word: '洗手',     emoji: '🧼' },
    { id: 'drink',    word: '喝水',     emoji: '🥤' },
    { id: 'rice',     word: '吃飯',     emoji: '🍚' },
    { id: 'banana',   word: '吃香蕉',   emoji: '🍌' },
    { id: 'melon',    word: '吃西瓜',   emoji: '🍉' },
    { id: 'balloon',  word: '吹氣球',   emoji: '🎈' },
    { id: 'candle',   word: '吹蠟燭',   emoji: '🎂' },
    { id: 'haircut',  word: '剪頭髮',   emoji: '💇' },
    { id: 'shirt',    word: '穿衣服',   emoji: '👕' },
    { id: 'shoes',    word: '穿鞋子',   emoji: '👟' },
    { id: 'phone',    word: '打電話',   emoji: '📱' },
    { id: 'read',     word: '看書',     emoji: '📖' },
    { id: 'paint',    word: '畫畫',     emoji: '🎨' },
    { id: 'sing',     word: '唱歌',     emoji: '🎤' },
    { id: 'cry',      word: '哭哭',     emoji: '😭' },
    { id: 'laugh',    word: '大笑',     emoji: '😂' },
    { id: 'sneeze',   word: '打噴嚏',   emoji: '🤧' },
    { id: 'yawn',     word: '打哈欠',   emoji: '🥱' },
    { id: 'angry',    word: '生氣',     emoji: '😠' },
    { id: 'cold',     word: '好冷',     emoji: '🥶' },
    { id: 'hot',      word: '好熱',     emoji: '🥵' },
    { id: 'sweep',    word: '掃地',     emoji: '🧹' },
    { id: 'cook',     word: '煮飯',     emoji: '🍳' },
    { id: 'water',    word: '澆花',     emoji: '🌷' },
    { id: 'clap',     word: '拍手',     emoji: '👏' },
    { id: 'hug',      word: '抱抱',     emoji: '🤗' },
    // 運動、玩耍、樂器
    { id: 'basketball', word: '打籃球', emoji: '🏀' },
    { id: 'baseball', word: '打棒球',   emoji: '⚾' },
    { id: 'slide',    word: '溜滑梯',   emoji: '🛝' },
    { id: 'kite',     word: '放風箏',   emoji: '🪁' },
    { id: 'skate',    word: '溜冰',     emoji: '⛸️' },
    { id: 'ski',      word: '滑雪',     emoji: '⛷️' },
    { id: 'fishing',  word: '釣魚',     emoji: '🎣' },
    { id: 'boxing',   word: '拳擊',     emoji: '🥊' },
    { id: 'lift',     word: '舉重',     emoji: '🏋️' },
    { id: 'guitar',   word: '彈吉他',   emoji: '🎸' },
    { id: 'trumpet',  word: '吹喇叭',   emoji: '🎺' },
    // 交通工具
    { id: 'car',      word: '開車',     emoji: '🚗' },
    { id: 'plane',    word: '飛機',     emoji: '✈️' },
    { id: 'bike',     word: '騎腳踏車', emoji: '🚲' },
    { id: 'firetruck', word: '消防車',  emoji: '🚒' },
    { id: 'train',    word: '火車',     emoji: '🚂' },
    { id: 'boat',     word: '划船',     emoji: '🚣' },
    { id: 'rocket',   word: '火箭',     emoji: '🚀' },
    { id: 'heli',     word: '直升機',   emoji: '🚁' },
    { id: 'ambulance', word: '救護車',  emoji: '🚑' },
    { id: 'moto',     word: '騎機車',   emoji: '🛵' },
    // 人物、角色
    { id: 'doctor',   word: '醫生',     emoji: '🩺' },
    { id: 'police',   word: '警察',     emoji: '👮' },
    { id: 'hero',     word: '超人',     emoji: '🦸' },
    { id: 'robot',    word: '機器人',   emoji: '🤖' },
    { id: 'ghost',    word: '鬼',       emoji: '👻' },
    { id: 'king',     word: '國王',     emoji: '👑' },
    { id: 'princess', word: '公主',     emoji: '👸' },
    { id: 'magic',    word: '魔術師',   emoji: '🪄' },
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

  /* 洗一袋新的：整副抽完才重洗，不會連續抽到同一張、也不會有的一直不出現。
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
