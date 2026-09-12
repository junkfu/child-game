/* 聽音找符號：播放發音，從幾個大符號卡片裡選一個。

   對還不識字的 4-5 歲來說這是最直接的玩法 —— 不需要讀任何文字。
   誘答項怎麼抽見 quiz.js（刻意和單元脫鉤，避免一開始就是最小對立）。 */
(function (Kid) {
  'use strict';
  const Z = Kid.zhuyin;

  function build(ctx, n) {
    const picks = [];
    for (let i = 0; i < n; i++) picks.push(ctx.symbols[i % ctx.symbols.length].id);
    return Kid.shuffle(picks).map(function (id, i) {
      /* 最後三分之一出挑戰題，誘答項改用容易混淆的 */
      const hard = i >= Math.floor(n * 0.66);
      return {
        mode: 'listen',
        answer: id,
        options: Z.options(id, ctx.unit, Math.min(4, Z.learnedThrough(ctx.unit).length), hard),
      };
    });
  }

  function render(q, host, done) {
    host.innerHTML = '';
    const wrap = Kid.el('div', 'q');

    const prompt = Kid.el('div', 'q-prompt');
    const play = Kid.el('button', 'speaker');
    play.innerHTML = '<span aria-hidden="true">🔊</span>';
    play.setAttribute('aria-label', '再聽一次');
    play.addEventListener('click', speak);
    prompt.appendChild(play);
    prompt.appendChild(Kid.el('p', 'q-hint', '聽聽看，這是哪一個？'));
    wrap.appendChild(prompt);

    wrap.appendChild(Z.optionGrid(q.options, q.answer, done));
    host.appendChild(wrap);

    function speak() { Kid.audio.say('audio/sym/' + q.answer + '.m4a'); }
    Kid.audio.say('audio/ui/listen.m4a').then(speak);
  }

  Z.modes = Z.modes || {};
  Z.modes.listen = { build: build, render: render };
})(window.Kid = window.Kid || {});
