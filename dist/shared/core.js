/* 共用的小工具。刻意保持很薄 —— 這不是框架，只是把每個遊戲都會重寫一次的
   那幾件事收在一個地方。 */
(function (Kid) {
  'use strict';

  function $(id) { return document.getElementById(id); }

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* 畫面切換。每個「畫面」是一個帶 data-screen="名字" 的元素，
     同一時間只有一個是顯示的。用 hidden 屬性而不是 style.display，
     shell.css 裡的 [hidden] 規則會處理，也不會跟其他樣式打架。 */
  const screens = {
    show: function (name) {
      const all = document.querySelectorAll('[data-screen]');
      let found = null;
      all.forEach(function (n) {
        const on = n.dataset.screen === name;
        n.hidden = !on;
        if (on) found = n;
      });
      if (found) {
        window.scrollTo(0, 0);
        /* 換頁後把焦點移到新畫面，鍵盤與讀螢幕都需要 */
        /* 把焦點移到新畫面的標題，讀螢幕才會唸出換頁了。
           這是程式移過去的、不是使用者 Tab 過去的，所以不畫焦點框
           （focus-quiet 在 shell.css 裡把 outline 關掉）。 */
        const target = found.querySelector('[autofocus], h1, h2') || found;
        if (target.focus) {
          target.setAttribute('tabindex', '-1');
          target.classList.add('focus-quiet');
          target.focus({ preventScroll: true });
        }
      }
      return found;
    },
    current: function () {
      const n = document.querySelector('[data-screen]:not([hidden])');
      return n ? n.dataset.screen : null;
    },
  };

  let toastTimer;
  function toast(msg, ms) {
    const box = $('toast');
    if (!box) return;
    box.textContent = msg;
    box.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { box.classList.remove('show'); }, ms || 2400);
  }

  /* 星星列。found 顆亮的，total - found 顆暗的。 */
  function stars(host, found, total) {
    host.innerHTML = '';
    for (let i = 0; i < total; i++) {
      const s = el('span', 'star' + (i < found ? ' on' : ''), '★');
      s.setAttribute('aria-hidden', 'true');
      host.appendChild(s);
    }
    host.setAttribute('aria-label', '已完成 ' + found + ' / ' + total);
  }

  /* Fisher-Yates。出題順序到處都要用。 */
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function sample(arr, n) { return shuffle(arr).slice(0, n); }

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  /* 共用的音效開關按鈕。每個頁面的右上角都有一顆。 */
  function wireSoundButton(btn) {
    if (!btn) return;
    function sync() {
      const on = Kid.store.sound();
      btn.textContent = on ? '♫' : '♪';
      btn.classList.toggle('off', !on);
      btn.setAttribute('aria-pressed', String(on));
      btn.setAttribute('aria-label', on ? '關閉聲音' : '開啟聲音');
    }
    btn.addEventListener('click', function () {
      Kid.store.setSound(!Kid.store.sound());
      sync();
      if (Kid.store.sound()) { Kid.audio.unlock(); Kid.audio.chime('tap'); }
      else Kid.audio.stop();
    });
    sync();
  }

  Kid.$ = $;
  Kid.el = el;
  Kid.screens = screens;
  Kid.toast = toast;
  Kid.stars = stars;
  Kid.shuffle = shuffle;
  Kid.sample = sample;
  Kid.pick = pick;
  Kid.wireSoundButton = wireSoundButton;
})(window.Kid = window.Kid || {});
