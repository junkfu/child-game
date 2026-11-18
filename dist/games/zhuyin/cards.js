/* 抽聲母卡：按一下抽一張，看小朋友唸不唸得出來，翻過來對答案。

   玩法刻意分兩拍：
     1. 抽到時只亮出符號、不出聲 —— 讓小朋友（或陪玩的大人）先自己唸。
     2. 點卡片翻面，才播符號的音和開頭語詞，順便看圖對答案。
   不計對錯、不倒數，唸錯了翻面聽一次就好。

   抽法是「一袋 21 張洗好，抽完再洗」，不是每次獨立亂數：
   獨立亂數常常連續抽到同一張、有的很久都不出現，小孩會覺得怪。
   換新的一袋時也避開剛抽到的那張，接縫處不會連兩張一樣。 */
(function (Kid) {
  'use strict';
  const Z = Kid.zhuyin;
  const GAME_ID = 'zhuyin';

  /* 注音符號歌的順序，只拿聲母那一段 */
  const INITIALS = ['b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h',
    'j', 'q', 'x', 'zh', 'ch', 'sh', 'r', 'z', 'c', 's'];

  /* 洗一袋新的。last 是上一張，新袋子的第一張不會是它。 */
  function newBag(last) {
    const bag = Kid.shuffle(INITIALS);
    if (last && bag[0] === last) { bag[0] = bag[1]; bag[1] = last; }
    return bag;
  }

  let bag = [];          /* 這一輪還沒抽的 */
  let drawn = [];        /* 這一輪抽過的，依序 */
  let current = null;
  let flipped = false;
  let wired = false;
  let deck = 'girl';
  let dealing = false;   /* 抽牌動畫進行中，這段時間不接受再抽或翻牌 */

  function state() {
    const s = Kid.store.game(GAME_ID);
    if (!s.cardsSeen) s.cardsSeen = {};
    return s;
  }

  /* 抽一張：先跑一秒「很多張跳來跳去」的動畫（飛卡上閃過隨機的聲母），
     動畫收回中間時才亮出抽到的那張 */
  function draw() {
    if (dealing) return;
    dealing = true;
    Kid.audio.stop();
    if (!bag.length) {
      if (drawn.length) Kid.toast(INITIALS.length + ' 張都抽過了，重新洗牌！');
      bag = newBag(current);
      drawn = [];
    }
    current = bag.shift();
    drawn.push(current);
    state().cardsSeen[current] = true;
    Kid.store.flush();
    flipped = false;

    const card = Kid.$('flash-card');
    const btn = Kid.$('flash-draw');
    btn.disabled = true;
    card.classList.add('dealing');
    Kid.audio.sfx('riffle');
    Kid.deal(card, {
      face: function () {
        const s = Kid.el('span', 'deal-glyph');
        s.appendChild(Z.glyph(Kid.pick(INITIALS)));
        return s;
      },
    }).then(function () {
      dealing = false;
      btn.disabled = false;
      card.classList.remove('dealing');
      Kid.audio.sfx('draw');
      render(true);
    });
  }

  function flip() {
    if (dealing) return;
    if (!current) return draw();
    flipped = !flipped;
    render(false);
    Kid.audio.stop();
    Kid.audio.sfx(flipped ? 'flip' : 'cover');
    if (flipped) {
      const w = Z.word(current, deck);
      Kid.audio.sayAll(['audio/sym/' + current + '.m4a'].concat(w ? [w.audio] : []));
    }
  }

  function render(fresh) {
    const card = Kid.$('flash-card');
    const front = Kid.$('flash-front');
    const back = Kid.$('flash-back');
    front.replaceChildren();
    back.replaceChildren();

    if (!current) {
      front.appendChild(Kid.el('span', 'flash-empty', '?'));
      card.setAttribute('aria-label', '抽一張注音卡');
    } else {
      front.appendChild(Z.glyph(current));
      back.appendChild(Z.glyph(current));
      const w = Z.word(current, deck);
      if (w) {
        back.appendChild(Z.modes.meet.picture(w));
        back.appendChild(Kid.el('strong', 'flash-word', w.word));
      }
      card.setAttribute('aria-label', flipped
        ? Z.symbol(current).zhuyin + '，' + (w ? w.word : '') + '。點一下翻回去'
        : '點一下翻過來，聽聽看是什麼音');
    }
    card.classList.toggle('flipped', flipped);
    card.setAttribute('aria-pressed', String(flipped));

    /* 每抽一張就重播一次「發牌」動畫：先拿掉 class、強制 reflow、再加回去 */
    if (fresh) {
      card.classList.remove('deal');
      void card.offsetWidth;
      card.classList.add('deal');
    }

    const trail = Kid.$('flash-trail');
    trail.replaceChildren();
    drawn.forEach(function (id) {
      const b = Kid.el('span', 'flash-mini' + (id === current ? ' current' : ''));
      b.appendChild(Z.glyph(id));
      trail.appendChild(b);
    });
    Kid.$('flash-count').textContent = '這一輪 ' + drawn.length + ' / ' + INITIALS.length;
    Kid.$('flash-hint').textContent = !current ? '按「抽一張」開始'
      : flipped ? '再抽一張吧！' : '先唸唸看，再點卡片翻過來';
  }

  function show(d) {
    deck = d === 'boy' ? 'boy' : 'girl';
    if (!wired) {
      wired = true;
      Kid.$('flash-card').addEventListener('click', function () { Kid.audio.unlock(); flip(); });
      Kid.$('flash-draw').addEventListener('click', function () { Kid.audio.unlock(); draw(); });
    }
    Kid.screens.show('cards');
    render(false);
  }

  /* 切換版本時換掉背面的圖，不用重抽 */
  function setDeck(d) {
    deck = d === 'boy' ? 'boy' : 'girl';
    if (Kid.screens.current() === 'cards') render(false);
  }

  Z.cards = { INITIALS: INITIALS, newBag: newBag, show: show, setDeck: setDeck };
})(window.Kid = window.Kid || {});
