/* 所有遊戲共用的進度儲存。

   為什麼要命名空間：所有 file:// 頁面共用同一個 null origin 的 localStorage，
   多個遊戲如果各自用扁平的 key 一定會撞在一起。

   結構：
     kid-games-v1 = {
       sound: true,                  跨遊戲的設定
       games: { spot: {...}, zhuyin: {...} }
     } */
(function (Kid) {
  'use strict';

  const KEY = 'kid-games-v1';
  const LEGACY_KEY = 'huntrix-detectives-v2';

  let state = null;

  function blank() { return { sound: true, games: {} }; }

  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return {
            sound: parsed.sound !== false,
            games: (parsed.games && typeof parsed.games === 'object') ? parsed.games : {},
          };
        }
      }
    } catch (e) { /* 無痕視窗、封鎖 cookie、file:// 都可能丟例外 */ }
    return blank();
  }

  /* 舊版找碴遊戲的存檔搬進新結構。
     刻意不刪舊 key —— 萬一使用者換回舊版本，進度不會消失。 */
  function migrate(next) {
    if (next.games.spot) return false;
    let legacy;
    try {
      legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || 'null');
    } catch (e) { return false; }
    if (!legacy || typeof legacy !== 'object') return false;
    next.games.spot = {
      current: Number.isInteger(legacy.current) ? legacy.current : 0,
      found: Array.isArray(legacy.found) ? legacy.found : [],
    };
    if (legacy.sound === false) next.sound = false;
    return true;
  }

  function load() {
    if (state) return state;
    state = read();
    if (migrate(state)) save();
    return state;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { /* 存不了就算了，遊戲照常能玩，只是這次的進度留不住 */ }
  }

  Kid.store = {
    app: function () { return load(); },
    sound: function () { return load().sound !== false; },
    setSound: function (on) { load().sound = !!on; save(); },
    game: function (id) {
      const s = load();
      if (!s.games[id]) s.games[id] = {};
      return s.games[id];
    },
    saveGame: function (id, data) {
      const s = load();
      s.games[id] = data;
      save();
    },
    flush: save,
  };
})(window.Kid = window.Kid || {});
