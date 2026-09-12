/* 注音拼讀：聲母 + 韻母 = 一個音節。

   台灣教的是直接拼讀法，ㄅ+ㄚ 直接讀成 "ba"。
   所以題目播的一定是「整個音節的音檔」，不是把 ㄅ 的呼讀音（ㄅㄛ）
   和 ㄚ 接在一起播 —— 那樣小朋友聽到的是「ㄅㄛ－ㄚ」，會學錯。
   音檔由 syllables.js 的代表字產生，每個都保證是真正的單音節。

   只做二拼，不做三拼；全部一聲，這一版不教聲調。 */
(function (Kid) {
  'use strict';
  const Z = Kid.zhuyin;

  function build(ctx, n) {
    const pool = Z.availableSyllables(ctx.unit).filter(function (s) {
      /* 至少要有一個符號是本單元剛學的，才有練習的意義 */
      return ctx.symbols.some(function (x) { return x.id === s.initial || x.id === s.final; });
    });
    const use = pool.length ? pool : Z.availableSyllables(ctx.unit);
    if (!use.length) return [];
    return Kid.sample(use, Math.min(n, use.length)).map(function (syl) {
      const finals = Z.learnedThrough(ctx.unit)
        .filter(function (s) { return s.cls !== 'initial' && s.id !== syl.final; })
        .map(function (s) { return s.id; });
      return {
        mode: 'blend',
        syllable: syl,
        options: Kid.shuffle([syl.final].concat(Kid.sample(finals, Math.min(2, finals.length)))),
      };
    });
  }

  function render(q, host, done) {
    const syl = q.syllable;
    host.innerHTML = '';
    const wrap = Kid.el('div', 'q');

    const prompt = Kid.el('div', 'q-prompt blend-prompt');
    const eq = Kid.el('div', 'blend-eq');
    const ini = Kid.el('span', 'blend-part');
    ini.appendChild(Z.glyph(syl.initial));
    eq.appendChild(ini);
    eq.appendChild(Kid.el('span', 'blend-plus', '+'));
    const slot = Kid.el('span', 'blend-part blend-slot', '?');
    eq.appendChild(slot);
    prompt.appendChild(eq);

    const play = Kid.el('button', 'speaker');
    play.innerHTML = '<span aria-hidden="true">🔊</span>';
    play.setAttribute('aria-label', '再聽一次');
    play.addEventListener('click', speak);
    prompt.appendChild(play);
    prompt.appendChild(Kid.el('p', 'q-hint', '合起來唸什麼？選出後面那個音'));
    wrap.appendChild(prompt);

    wrap.appendChild(Z.optionGrid(q.options, syl.final, function (ok) {
      if (ok) {
        /* 答對了才把兩個符號合體，再唸一次完整音節 */
        slot.textContent = '';
        slot.appendChild(Z.glyph(syl.final));
        slot.classList.remove('blend-slot');
        slot.classList.add('pop');
        eq.appendChild(Kid.el('span', 'blend-eq-sign', '='));
        const res = Kid.el('span', 'blend-result', Z.syllableText(syl));
        eq.appendChild(res);
        setTimeout(function () { Kid.audio.say('audio/syl/' + syl.id + '.m4a'); }, 260);
      }
      done(ok);
    }));
    host.appendChild(wrap);

    function speak() { Kid.audio.say('audio/syl/' + syl.id + '.m4a'); }
    Kid.audio.say('audio/ui/blend.m4a').then(speak);
  }

  Z.modes = Z.modes || {};
  Z.modes.blend = { build: build, render: render };
})(window.Kid = window.Kid || {});
