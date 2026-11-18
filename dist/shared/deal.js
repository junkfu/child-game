/* 抽牌動畫：一疊卡片從主卡位置飛出來、到處亂跳，最後收回中間。
   聲母卡、超級比一比共用。

   Kid.deal(card, opts) → Promise，動畫結束時 resolve。
     card       主卡元素，飛出來的卡片照它的位置與大小生出來
     opts.count 幾張（預設 7）
     opts.face  function(i) → 節點或 null；null 就是畫背面（「?」）
     opts.cls   額外加在每張飛卡上的 class，讓各遊戲自己配色

   飛卡放在一層 position:fixed、overflow:hidden 的圖層上，
   飛到畫面外也不會撐出捲軸，不影響版面。
   系統開了「減少動態效果」就直接跳過。 */
(function (Kid) {
  'use strict';

  const DUR = 1100;   /* 整段動畫的毫秒數，音效的時間點也照這個排 */

  function reduced() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch (e) { return false; }
  }

  function rand(a, b) { return a + Math.random() * (b - a); }

  function deal(card, opts) {
    const o = opts || {};
    if (reduced() || !card.animate) return Promise.resolve();

    const r = card.getBoundingClientRect();
    const layer = document.createElement('div');
    layer.className = 'deal-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);

    /* 能跳多遠：不超出畫面太多，手機上也看得到 */
    const spanX = Math.min(window.innerWidth * 0.38, 320);
    const spanY = Math.min(window.innerHeight * 0.22, 180);
    const n = o.count || 7;
    const anims = [];

    for (let i = 0; i < n; i++) {
      const fly = document.createElement('div');
      fly.className = 'deal-fly' + (o.cls ? ' ' + o.cls : '');
      fly.style.left = r.left + 'px';
      fly.style.top = r.top + 'px';
      fly.style.width = r.width + 'px';
      fly.style.height = r.height + 'px';
      const f = o.face && o.face(i);
      if (f) fly.appendChild(f); else fly.appendChild(Kid.el('span', 'deal-q', '?'));
      layer.appendChild(fly);

      /* 每張跳三下，位置、角度都亂數；最後回到原點、縮小淡出 */
      const frames = [{ transform: 'translate(0,0) rotate(0deg) scale(.6)', opacity: 0, offset: 0 }];
      const hops = 3;
      for (let h = 1; h <= hops; h++) {
        frames.push({
          transform: 'translate(' + rand(-spanX, spanX) + 'px,' + rand(-spanY, spanY) + 'px) rotate(' +
            rand(-35, 35) + 'deg) scale(' + rand(.55, .8) + ')',
          opacity: 1,
          offset: h / (hops + 1.4),
        });
      }
      frames.push({ transform: 'translate(0,0) rotate(0deg) scale(.9)', opacity: 1, offset: .9 });
      frames.push({ transform: 'translate(0,0) rotate(0deg) scale(1)', opacity: 0, offset: 1 });

      const a = fly.animate(frames, {
        duration: DUR - i * 25, delay: i * 25,
        easing: 'cubic-bezier(.45,.05,.35,1)', fill: 'forwards',
      });
      anims.push(a.finished.catch(function () {}));
    }

    return Promise.all(anims).then(function () { layer.remove(); });
  }

  deal.DUR = DUR;
  Kid.deal = deal;
})(window.Kid = window.Kid || {});
