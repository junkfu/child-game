/* 注音大冒險 —— 流程控制。

   畫面：封面（選版本）→ 單元地圖 → 單元進行中 → 單元結算
   單元內固定四段：認識一下 → 描一描 → 玩一玩 → 拼拼看
   一個單元大約 3-5 分鐘、10 題上下，有明確的結尾與星星。
   這個年紀專注力約 7-10 分鐘，不要把四種玩法串成一長串。 */
(function (Kid) {
  'use strict';
  const Z = Kid.zhuyin;
  const GAME_ID = 'zhuyin';

  const PLAY_Q = 4;    /* 玩一玩：聽音 + 看圖混合幾題 */
  const BLEND_Q = 2;   /* 拼拼看幾題 */

  let state = Kid.store.game(GAME_ID);
  if (!state.units) state.units = {};
  let deck = state.profile === 'boy' ? 'boy' : 'girl';

  function persist() { Kid.store.saveGame(GAME_ID, state); }

  /* ── 封面：選版本 ─────────────────────────────────── */
  function initCover() {
    document.querySelectorAll('[data-profile]').forEach(function (b) {
      b.addEventListener('click', function () {
        Kid.audio.unlock();           /* iOS 只在手勢裡准播聲音，這裡暖機 */
        setProfile(b.dataset.profile);
        showMap();
      });
    });
  }

  function setProfile(p) {
    deck = p === 'boy' ? 'boy' : 'girl';
    state.profile = deck;
    document.documentElement.dataset.theme = deck;
    persist();
    const sw = Kid.$('switch-profile');
    if (sw) sw.textContent = deck === 'boy' ? '換成女孩版' : '換成男孩版';
  }

  /* ── 單元地圖 ─────────────────────────────────────── */
  function unitStars(n) { return (state.units[n] && state.units[n].stars) || 0; }

  function showMap() {
    const host = Kid.$('unit-map');
    host.innerHTML = '';
    Z.UNITS.forEach(function (u) {
      const stars = unitStars(u.n);
      const b = Kid.el('button', 'unit' + (stars ? ' done' : ''));
      b.setAttribute('aria-label', '第 ' + u.n + ' 關 ' + u.title +
        (stars ? '，已完成，得到 ' + stars + ' 顆星' : ''));

      const num = Kid.el('span', 'unit-n', String(u.n));
      b.appendChild(num);
      const glyphs = Kid.el('span', 'unit-glyphs');
      Z.unitSymbols(u.n).forEach(function (s) { glyphs.appendChild(Z.glyph(s.id)); });
      b.appendChild(glyphs);
      b.appendChild(Kid.el('span', 'unit-sub', u.sub));
      const st = Kid.el('span', 'stars unit-stars');
      Kid.stars(st, stars, 3);
      b.appendChild(st);

      b.addEventListener('click', function () { Kid.audio.unlock(); startUnit(u.n); });
      host.appendChild(b);
    });
    const total = Z.UNITS.filter(function (u) { return unitStars(u.n) > 0; }).length;
    Kid.$('map-progress').textContent = '已完成 ' + total + ' / ' + Z.UNITS.length + ' 關';
    Kid.screens.show('map');
  }

  /* ── 單元進行 ─────────────────────────────────────── */
  let queue = [], step = 0, scored = 0, right = 0, unitNo = 0;

  function startUnit(n) {
    unitNo = n;
    const ctx = { unit: n, symbols: Z.unitSymbols(n), deck: deck };
    queue = []
      .concat(Z.modes.meet.build(ctx))
      .concat(Z.modes.trace.build(ctx))
      .concat(Kid.shuffle(
        Z.modes.listen.build(ctx, PLAY_Q - Math.min(2, countWordable(ctx)))
          .concat(Z.modes.picture.build(ctx, Math.min(2, countWordable(ctx))))
      ))
      .concat(Z.modes.blend.build(ctx, BLEND_Q));
    step = 0; scored = 0; right = 0;
    Kid.$('unit-title').textContent = '第 ' + n + ' 關 · ' + Z.UNITS[n - 1].title;
    Kid.screens.show('play');
    next();
  }

  function countWordable(ctx) {
    return ctx.symbols.filter(function (s) { return Z.hasWord(s.id); }).length;
  }

  function next() {
    if (step >= queue.length) return finishUnit();
    const q = queue[step];
    const mode = Z.modes[q.mode];
    const host = Kid.$('stage');
    host.dataset.deck = deck;
    Kid.$('step-count').textContent = (step + 1) + ' / ' + queue.length;
    Kid.$('step-fill').style.width = Math.round(step / queue.length * 100) + '%';
    mode.render(q, host, function (ok) {
      if (!mode.passive) { scored++; if (ok) right++; }
      step++;
      next();
    });
  }

  function finishUnit() {
    const ratio = scored ? right / scored : 1;
    const stars = ratio >= 0.9 ? 3 : ratio >= 0.7 ? 2 : 1;
    const prev = unitStars(unitNo);
    state.units[unitNo] = { stars: Math.max(prev, stars) };   /* 只升不降，重玩不會被扣 */
    persist();

    Kid.$('done-title').textContent = '第 ' + unitNo + ' 關完成！';
    Kid.$('done-copy').textContent = scored
      ? '答對 ' + right + ' / ' + scored + ' 題，' + Z.UNITS[unitNo - 1].title + ' 你認識了！'
      : Z.UNITS[unitNo - 1].title + ' 都看過一遍了！';
    Kid.stars(Kid.$('done-stars'), stars, 3);
    const more = unitNo < Z.UNITS.length;
    Kid.$('done-next').textContent = more ? '下一關，出發！ →' : '回到關卡地圖';
    Kid.$('done-next').onclick = function () {
      if (more) startUnit(unitNo + 1); else showMap();
    };
    Kid.audio.chime('win');
    Kid.audio.say('audio/ui/unit_done.m4a');
    Kid.screens.show('done');
  }

  /* ── 啟動 ─────────────────────────────────────────── */
  Kid.wireSoundButton(Kid.$('sound'));
  initCover();
  Kid.$('to-map').addEventListener('click', showMap);
  Kid.$('quit').addEventListener('click', function () {
    Kid.audio.stop();
    showMap();
  });
  Kid.$('switch-profile').addEventListener('click', function () {
    setProfile(deck === 'boy' ? 'girl' : 'boy');
    showMap();
  });

  if (state.profile) { setProfile(state.profile); showMap(); }
  else Kid.screens.show('cover');
})(window.Kid = window.Kid || {});
