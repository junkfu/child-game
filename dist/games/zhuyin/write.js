/* 寫字：37 個符號排成一張表，點哪個就描哪個。

   為什麼要另外做一頁：描寫原本只出現在「練習」的題目串裡，一次一關、
   照順序來。小孩想描別的符號，得先回地圖再進去。這裡把選符號和描寫放在
   同一個畫面，換符號不用離開；描完自動接下一個，也可以隨時點表上任一個。

   描寫本身仍是 modes/trace.js，這裡只負責選符號、記進度、排下一個。 */
(function (Kid) {
  'use strict';
  const Z = Kid.zhuyin;
  const GAME_ID = 'zhuyin';

  /* 注音符號歌的順序：聲母 → 介母 → 韻母。data/symbols.js 的單元順序是為了
     拼讀教學排的（單韻母提前到單元 2），寫字表要照小朋友背的順序才對得上。 */
  const ORDER = [
    'b', 'p', 'm', 'f',  'd', 't', 'n', 'l',  'g', 'k', 'h',  'j', 'q', 'x',
    'zh', 'ch', 'sh', 'r',  'z', 'c', 's',  'i', 'u', 'v',
    'a', 'o', 'e', 'eh',  'ai', 'ei', 'ao', 'ou',  'an', 'en', 'ang', 'eng',  'er',
  ];

  let current = null;    /* 目前描的符號 */
  let seq = 0;           /* 每換一個符號 +1；上一個符號遲到的 done 用這個認出來忽略 */
  let announced = false; /* 進到這一頁後，「跟著虛線描描看」唸過了沒 */
  let keys = null;       /* id → 表上的按鈕 */

  function state() {
    const s = Kid.store.game(GAME_ID);
    if (!s.written) s.written = {};
    return s;
  }
  function writtenCount() {
    const written = state().written;
    return ORDER.filter(function (id) { return written[id]; }).length;
  }
  function firstUnwritten() {
    const written = state().written;
    return ORDER.find(function (id) { return !written[id]; });
  }

  function buildBoard() {
    const board = Kid.$('write-board');
    board.replaceChildren();
    keys = {};
    ORDER.forEach(function (id) {
      const b = Kid.el('button', 'write-key');
      b.setAttribute('aria-label', '描寫 ' + Z.symbol(id).zhuyin);
      b.appendChild(Z.glyph(id));
      b.addEventListener('click', function () { Kid.audio.unlock(); open(id); });
      keys[id] = b;
      board.appendChild(b);
    });
  }

  function refresh() {
    const written = state().written;
    ORDER.forEach(function (id) {
      const b = keys[id];
      b.classList.toggle('current', id === current);
      b.classList.toggle('written', !!written[id]);
      b.setAttribute('aria-pressed', String(id === current));
    });
    Kid.$('write-progress').textContent = '已描 ' + writtenCount() + ' / ' + ORDER.length;
  }

  /* 描完 ㄦ 之後回頭找還沒描過的；全部都描過了就從 ㄅ 再來一輪 */
  function after(id) {
    const i = ORDER.indexOf(id);
    if (i < ORDER.length - 1) return ORDER[i + 1];
    return firstUnwritten() || ORDER[0];
  }

  function open(id) {
    const token = ++seq;
    current = id;
    state().writeAt = id;
    Kid.store.flush();
    Kid.audio.stop();
    const q = { mode: 'trace', symbol: id, announce: !announced, sayName: true };
    Z.modes.trace.render(q, Kid.$('write-stage'), function () {
      const s = state();
      const allBefore = writtenCount() === ORDER.length;
      s.written[id] = true;
      Kid.store.flush();
      /* 描完的瞬間就換了符號：進度照記，但不要搶著跳到別頁 */
      if (token !== seq) return;
      refresh();
      if (!allBefore && writtenCount() === ORDER.length) {
        Kid.toast('37 個都描完了，好厲害！');
        setTimeout(function () { Kid.audio.chime('win'); }, 400);
      }
      setTimeout(function () {
        if (token !== seq || Kid.screens.current() !== 'write') return;
        open(after(id));
      }, 1000);
    });
    announced = true;
    refresh();
  }

  function step(delta) {
    const i = ORDER.indexOf(current);
    open(ORDER[(i + delta + ORDER.length) % ORDER.length]);
  }

  function show(id) {
    if (!keys) {
      buildBoard();
      Kid.$('write-prev').addEventListener('click', function () { Kid.audio.unlock(); step(-1); });
      Kid.$('write-next').addEventListener('click', function () { Kid.audio.unlock(); step(1); });
      Kid.$('write-say').addEventListener('click', function () {
        Kid.audio.unlock();
        Kid.audio.say('audio/sym/' + current + '.m4a');
      });
    }
    announced = false;
    Kid.screens.show('write');
    /* 接著上次描到的那個；第一次進來就從第一個還沒描的開始 */
    open(id || state().writeAt || firstUnwritten() || ORDER[0]);
  }

  /* 離開這一頁：把描寫畫面清掉，trace.js 裡排好的提示計時器才會自己停下 */
  function close() {
    seq++;
    const host = Kid.$('write-stage');
    if (host) host.replaceChildren();
  }

  Z.write = { ORDER: ORDER, show: show, open: open, step: step, close: close };
})(window.Kid = window.Kid || {});
