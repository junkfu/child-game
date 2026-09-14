/* 遊戲清單。要加第 N 個遊戲，就在這裡加一筆，主選單會自動長出卡片。

   progress(state) 回傳 { done, total }，state 是 Kid.store.game(store || id) 的內容；
   幾個入口共用同一份進度時，用 store 指到同一格。
   各遊戲的進度形狀不一樣，所以換算方式寫在各自這一筆裡，主選單不需要知道細節。

   href 一律寫到 index.html，不要只寫目錄 ——
   file:// 下沒有伺服器幫忙解析目錄索引。 */
(function (Kid) {
  'use strict';

  Kid.catalog = [
    {
      id: 'spot',
      title: '閃亮找碴派對',
      sub: '兩張圖比一比，找出藏起來的小秘密',
      icon: '🔎',
      href: 'games/spot/index.html',
      tint: '#8156d9',
      progress: function (s) {
        const found = Array.isArray(s.found) ? s.found : [];
        const done = found.filter(function (f) { return Array.isArray(f) && f.length >= 10; }).length;
        return { done: done, total: 10, unit: '關' };
      },
    },
    {
      id: 'zhuyin',
      title: '注音大冒險',
      sub: '餵注音餅乾、找寶石，收集 10 位小怪獸',
      icon: '🦕',
      art: 'games/zhuyin/assets/adventure/friends.png',
      href: 'games/zhuyin/index.html',
      tint: '#e8833a',
      progress: function (s) {
        const units = (s && s.units) || {};
        const done = Object.keys(units).filter(function (k) { return units[k] && units[k].stars > 0; }).length;
        return { done: done, total: 10, unit: '關' };
      },
    },
    {
      /* 注音大冒險裡的寫字頁，直接用 #write 開進去。進度和注音大冒險存在同一格，
         所以用 store 指過去，不另開一份。 */
      id: 'zhuyin-write',
      store: 'zhuyin',
      title: 'ㄅㄆㄇ寫字',
      sub: '37 個符號排成一張表，點哪個描哪個',
      icon: '✏️',
      href: 'games/zhuyin/index.html#write',
      tint: '#4c9a6a',
      progress: function (s) {
        const written = (s && s.written) || {};
        return { done: Object.keys(written).length, total: 37, unit: '個' };
      },
    },
  ];
})(window.Kid = window.Kid || {});
