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

  /* ── 卡片音效 ───────────────────────────────────────
     抽卡、翻牌、洗牌用的。一樣即時合成、不用音檔：
     「刷」的一聲是一小段白噪音過帶通濾波、頻率往上掃；
     「叮」是兩個短正弦音。時間點對齊 CSS 的發牌動畫（.4s）。 */
  let noiseBuf = null;
  function noise() {
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return noiseBuf;
  }
  /* 一聲「刷」：at 秒後開始，持續 dur，濾波中心頻率從 f0 掃到 f1 */
  function swish(at, dur, f0, f1, gain) {
    const src = ctx.createBufferSource();
    src.buffer = noise();
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.Q.value = 1.2;
    const g = ctx.createGain();
    const t = ctx.currentTime + at;
    bp.frequency.setValueAtTime(f0, t);
    bp.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + dur * 0.3);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(bp); bp.connect(g); g.connect(ctx.destination);
    src.start(t); src.stop(t + dur + 0.02);
  }
  function tone(at, freq, dur, gain, type) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const t = ctx.currentTime + at;
    o.type = type || 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }
  const sfxs = {
    /* 抽一張：刷——叮咚，牌落下時亮一聲 */
    draw: function () {
      swish(0, 0.22, 900, 4200, 0.22);
      tone(0.26, 1047, 0.25, 0.05);
      tone(0.34, 1568, 0.35, 0.045);
    },
    /* 翻牌／偷看：短促的「啪」加一點上揚 */
    flip: function () {
      swish(0, 0.12, 2400, 1200, 0.16);
      tone(0.06, 880, 0.12, 0.035, 'triangle');
    },
    /* 蓋回去：比翻開低一點，聽得出是相反的動作 */
    cover: function () {
      swish(0, 0.12, 1600, 700, 0.14);
      tone(0.06, 523, 0.12, 0.03, 'triangle');
    },
    /* 洗牌：一串快速的「嗒嗒嗒」，像撥牌 */
    /* 抽牌動畫期間：約一秒的連續撥牌聲，配 shared/deal.js */
    riffle: function () {
      for (let i = 0; i < 16; i++) swish(i * 0.06, 0.05, 2200 + (i % 4) * 500, 1300, 0.13);
    },
    shuffle: function () {
      for (let i = 0; i < 9; i++) swish(i * 0.055, 0.05, 2500 + (i % 3) * 600, 1500, 0.15);
    },
  };
  function sfx(name) {
    if (!enabled() || !sfxs[name]) return;
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctx.resume();
      sfxs[name]();
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

  /* 用瀏覽器內建的語音合成唸一段字，給沒有錄音檔的內容用（例如比一比的 500 個詞）。
     優先挑台灣中文的聲音；iPad、Mac 內建「美佳」，Android、Chrome 也有中文聲音，離線也能唸。 */
  const synth = window.speechSynthesis || null;
  function zhVoice() {
    const vs = synth.getVoices();
    const norm = function (v) { return v.lang.replace('_', '-').toLowerCase(); };
    return vs.find(function (v) { return norm(v) === 'zh-tw'; }) ||
      vs.find(function (v) { return /^zh-(hant|hk)/.test(norm(v)); }) ||
      vs.find(function (v) { return /^(zh|cmn)/.test(norm(v)); }) || null;
  }
  function speak(text) {
    if (!enabled() || !synth) return false;
    stop();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-TW';
    const v = zhVoice();
    if (v) u.voice = v;
    u.rate = 0.85;   /* 放慢一點，小朋友聽得清楚 */
    synth.speak(u);
    return true;
  }

  function stop() {
    if (synth) synth.cancel();
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

  Kid.audio = { chime: chime, sfx: sfx, say: say, sayAll: sayAll, speak: speak, canSpeak: !!synth, stop: stop, unlock: unlock, cues: cues };
})(window.Kid = window.Kid || {});
