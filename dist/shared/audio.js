/* 聲音分兩種，走兩條完全不同的路：

   1. 回饋音效（答對/答錯/過關）—— Web Audio 即時合成，沒有音檔要載入。
      這段是從原本找碴遊戲的 game.js 搬過來的，行為刻意保持一致。

   2. 語音（注音發音、語詞、介面指令）—— 預先產好的 m4a，用 HTMLAudioElement 播。
      為什麼不用 Web Audio 播音檔：file:// 下 fetch + decodeAudioData 會被擋
      （origin 是 null），但 new Audio('./x.m4a').play() 可以。
      這個專案要保留「雙擊 index.html 就能玩」，所以只能用後者。 */
(function (Kid) {
  'use strict';

  const cues = {
    right: { notes: [784, 1047, 1319],            type: 'sine',     step: 0.085, dur: 0.30, gain: 0.06 },
    wrong: { notes: [311, 233],                   type: 'triangle', step: 0.14,  dur: 0.26, gain: 0.05 },
    win:   { notes: [523, 659, 784, 1046, 1319],  type: 'sine',     step: 0.12,  dur: 0.34, gain: 0.06 },
    tap:   { notes: [660],                        type: 'sine',     step: 0.0,   dur: 0.12, gain: 0.04 },
  };

  let ctx;
  let current = null;   // 正在播的語音，同時只播一個

  function enabled() { return Kid.store.sound(); }

  function chime(name) {
    const cue = cues[name || 'right'];
    if (!enabled() || !cue) return;
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctx.resume();
      cue.notes.forEach(function (freq, i) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        const t = ctx.currentTime + i * cue.step;
        o.type = cue.type;
        o.frequency.value = freq;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(cue.gain, t + 0.015);
        g.gain.exponentialRampToValueAtTime(0.001, t + cue.dur);
        o.connect(g); g.connect(ctx.destination);
        o.start(t); o.stop(t + cue.dur + 0.02);
      });
    } catch (e) { /* 沒有音訊裝置也不該讓遊戲壞掉 */ }
  }

  /* 播一段語音。回傳 Promise，結束或失敗都會 resolve，
     這樣呼叫端可以 .then() 接下一段而不用處理錯誤分支。 */
  function say(src) {
    stop();
    if (!enabled()) return Promise.resolve();
    return new Promise(function (resolve) {
      let done = false;
      function finish() { if (!done) { done = true; resolve(); } }
      try {
        const a = new Audio(src);
        current = a;
        a.addEventListener('ended', finish);
        a.addEventListener('error', finish);
        const p = a.play();
        if (p && p.catch) p.catch(finish);
        /* 保險：某些瀏覽器在分頁切到背景時不會發 ended */
        setTimeout(finish, 6000);
      } catch (e) { finish(); }
    });
  }

  /* 依序播放多段語音，例如「ㄅ」→「ㄅㄠ ㄅㄠ」。 */
  function sayAll(list) {
    return list.reduce(function (chain, src) {
      return chain.then(function () { return say(src); });
    }, Promise.resolve());
  }

  function stop() {
    if (current) {
      try { current.pause(); current.currentTime = 0; } catch (e) {}
      current = null;
    }
  }

  /* iOS Safari 只在使用者手勢裡才准播聲音。
     開始按鈕按下去時呼叫一次，把兩條路都「暖機」。 */
  function unlock() {
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctx.resume();
    } catch (e) {}
  }

  Kid.audio = { chime: chime, say: say, sayAll: sayAll, stop: stop, unlock: unlock, cues: cues };
})(window.Kid = window.Kid || {});
