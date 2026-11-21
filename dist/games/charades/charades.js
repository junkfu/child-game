/* 超級比一比：抽一張圖，自己演、讓別人猜。這一頁只負責「抽」。

   抽到的卡片先蓋著：平板常常是大家一起看，表演的人點一下才偷看，
   再點一下又蓋回去，猜的人才不會先看到答案。
   猜對、計分這些交給現場的人，頁面不插手。 */
(function (Kid) {
  'use strict';
  const C = Kid.charades;
  const GAME_ID = 'charades';

  const saved = Kid.store.game(GAME_ID);
  if (!saved.seen) saved.seen = {};

  let bag = [];
  let current = null;
  let shown = false;
  let dealing = false;   /* 抽牌動畫進行中，這段時間不接受再抽或偷看 */

  const card = Kid.$('card');
  const face = Kid.$('card-face');
  const hint = Kid.$('hint');
  const left = Kid.$('left');
  const speakBtn = Kid.$('speak');

  /* 抽一張：先跑一秒「很多張跳來跳去」的動畫，再落下一張蓋著的卡。
     飛卡一律畫背面 —— 這一頁的卡片要保密，不能在動畫裡閃過答案。 */
  function draw() {
    if (dealing) return;
    dealing = true;
    Kid.audio.unlock();
    Kid.audio.stop();
    if (!bag.length) {
      if (current) Kid.toast(C.ITEMS.length + ' 張都抽過了，重新洗牌！');
      bag = C.newBag(current);
    }
    current = bag.shift();
    shown = false;
    saved.seen[current] = true;
    Kid.store.saveGame(GAME_ID, saved);

    const btn = Kid.$('draw');
    btn.disabled = true;
    card.classList.add('dealing');
    Kid.audio.sfx('riffle');
    Kid.deal(card, { cls: 'charades-fly' }).then(function () {
      dealing = false;
      btn.disabled = false;
      card.classList.remove('dealing');
      Kid.audio.sfx('draw');
      render(true);
    });
  }

  function peek() {
    if (dealing) return;
    if (!current) return draw();
    Kid.audio.unlock();
    shown = !shown;
    if (!shown) Kid.audio.stop();
    Kid.audio.sfx(shown ? 'flip' : 'cover');
    render(false);
  }

  function render(fresh) {
    face.replaceChildren();
    if (!current) {
      face.appendChild(Kid.el('span', 'card-emoji', '🎭'));
      card.setAttribute('aria-label', '抽一張');
      hint.textContent = '按「抽一張」開始';
    } else if (!shown) {
      face.appendChild(Kid.el('span', 'card-emoji', '🙈'));
      face.appendChild(Kid.el('strong', 'card-word', '點我偷看'));
      card.setAttribute('aria-label', '卡片蓋著，點一下偷看');
      hint.textContent = '表演的人點卡片偷看，別讓大家看到喔！';
    } else {
      const it = C.item(current);
      face.appendChild(Kid.el('span', 'card-emoji', it.emoji));
      face.appendChild(Kid.el('strong', 'card-word', it.word));
      card.setAttribute('aria-label', it.word + '。點一下蓋起來');
      hint.textContent = '記住了嗎？點一下蓋起來，開始比！';
    }
    /* 小朋友不識字：偷看時多一顆「唸給我聽」。只在翻開時出現，蓋著時不會不小心唸出答案。 */
    speakBtn.hidden = !(shown && Kid.audio.canSpeak);
    card.classList.toggle('covered', !!current && !shown);
    card.setAttribute('aria-pressed', String(shown));
    left.textContent = current ? '還有 ' + bag.length + ' 張沒抽' : '共 ' + C.ITEMS.length + ' 張';
    if (fresh) {
      card.classList.remove('deal');
      void card.offsetWidth;   /* 強制 reflow，動畫才會重播 */
      card.classList.add('deal');
    }
  }

  Kid.wireSoundButton(Kid.$('sound'));
  card.addEventListener('click', peek);
  Kid.$('draw').addEventListener('click', draw);
  speakBtn.addEventListener('click', function () {
    if (!current || !shown) return;
    if (!Kid.audio.speak(C.item(current).word)) Kid.toast('聲音關著喔，按右上角 ♫ 打開');
  });
  render(false);
})(window.Kid = window.Kid || {});
