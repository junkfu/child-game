/* 認識一下：把這個單元的符號一個一個介紹過。

   這一段沒有對錯，只是讓小朋友先看過、聽過、知道長什麼樣子，
   再進到後面要作答的關卡。教學上這叫「先接觸再練習」，
   直接丟題目給沒看過的符號是不合理的。 */
(function (Kid) {
  'use strict';
  const Z = Kid.zhuyin;

  function build(ctx) {
    return ctx.symbols.map(function (s) { return { mode: 'meet', symbol: s.id }; });
  }

  function render(q, host, done) {
    const sym = Z.symbol(q.symbol);
    const word = Z.word(q.symbol, ctxDeck(host));

    host.innerHTML = '';
    const wrap = Kid.el('div', 'meet');

    const big = Kid.el('div', 'meet-glyph pop');
    big.appendChild(Z.glyph(q.symbol));
    wrap.appendChild(big);

    const say = Kid.el('button', 'btn btn-primary meet-say');
    say.innerHTML = '<span aria-hidden="true">🔊</span> 再聽一次';
    say.addEventListener('click', function () { speak(); });
    wrap.appendChild(say);

    if (word) {
      const card = Kid.el('div', 'meet-word');
      card.appendChild(picture(word));
      const label = Kid.el('div', 'meet-word-text');
      label.appendChild(Kid.el('strong', null, word.word));
      label.appendChild(Kid.el('span', 'meet-word-zhuyin', word.zhuyin));
      card.appendChild(label);
      card.addEventListener('click', function () { Kid.audio.say(word.audio); });
      wrap.appendChild(card);
    }

    const next = Kid.el('button', 'btn meet-next', '好，下一個 →');
    next.addEventListener('click', function () { done(true); });
    wrap.appendChild(next);

    host.appendChild(wrap);

    function speak() {
      const list = ['audio/sym/' + q.symbol + '.m4a'];
      if (word) list.push(word.audio);
      Kid.audio.sayAll(list);
    }
    speak();
  }

  /* 題目圖：有圖檔就用圖，沒有就用大 Emoji。
     這讓遊戲在產圖之前就能完整玩。 */
  function picture(word) {
    const box = Kid.el('div', 'pic');
    const em = Kid.el('span', 'pic-emoji', word.emoji);
    em.setAttribute('aria-hidden', 'true');
    box.appendChild(em);
    const img = new Image();
    img.alt = word.word;
    img.className = 'pic-img';
    img.addEventListener('load', function () { box.classList.add('has-img'); box.appendChild(img); });
    img.src = word.img;
    return box;
  }

  function ctxDeck(host) { return host.dataset.deck || 'girl'; }

  Z.modes = Z.modes || {};
  Z.modes.meet = { build: build, render: render, picture: picture, passive: true };
})(window.Kid = window.Kid || {});
