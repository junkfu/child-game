/* 看圖配注音：看一張圖，選出它是什麼音開頭的。

   關鍵設計：先把整個語詞唸出來，再問。
   一次解決三件事：
     1. 消除圖片的命名歧義 —— 🐶 可能被叫成「狗」(ㄍ) 也可能「小狗」(ㄒ)，
        播了音就不必靠圖猜是哪個詞。
     2. 示範「聽出開頭音」這件事本身，4 歲不會自發做到。
     3. 小朋友不識字，本來就得唸。

   韻母幾乎沒有以它開頭的語詞（沒有詞以 ㄜ 或 ㄥ 開頭），
   所以這個玩法只對 words.js 裡有資料的符號出題，
   湊不到的單元會自動多出聽音題與描寫題補上。 */
(function (Kid) {
  'use strict';
  const Z = Kid.zhuyin;

  function build(ctx, n) {
    const usable = ctx.symbols.filter(function (s) { return Z.hasWord(s.id); });
    if (!usable.length) return [];
    const picks = [];
    for (let i = 0; i < n; i++) picks.push(usable[i % usable.length].id);
    return Kid.shuffle(picks).map(function (id, i) {
      const hard = i >= Math.floor(n * 0.66);
      return {
        mode: 'picture',
        answer: id,
        options: Z.options(id, ctx.unit, Math.min(4, Z.learnedThrough(ctx.unit).length), hard),
      };
    });
  }

  function render(q, host, done) {
    const word = Z.word(q.answer, host.dataset.deck || 'girl');
    host.innerHTML = '';
    const wrap = Kid.el('div', 'q');

    const prompt = Kid.el('div', 'q-prompt');
    const pic = Z.modes.meet.picture(word);
    pic.classList.add('q-pic');
    pic.setAttribute('role', 'button');
    pic.setAttribute('tabindex', '0');
    pic.setAttribute('aria-label', '再聽一次：' + word.word);
    function sayWord() { Kid.audio.say(word.audio); }
    pic.addEventListener('click', sayWord);
    pic.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sayWord(); }
    });
    prompt.appendChild(pic);
    prompt.appendChild(Kid.el('p', 'q-hint', '這個是什麼音開頭的？'));
    wrap.appendChild(prompt);

    wrap.appendChild(Z.optionGrid(q.options, q.answer, done));
    host.appendChild(wrap);

    /* 先唸整個語詞，再唸一次開頭的音當提示 */
    Kid.audio.sayAll([word.audio, 'audio/sym/' + q.answer + '.m4a']);
  }

  Z.modes = Z.modes || {};
  Z.modes.picture = { build: build, render: render };
})(window.Kid = window.Kid || {});
