/* 注音大冒險：預設 5–7 題點心任務；完整認讀、描寫、拼讀為自選練習。 */
(function (Kid) {
  'use strict';
  const Z = Kid.zhuyin;
  const GAME_ID = 'zhuyin';

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
        if (wantWrite()) showWrite(); else showMap();
      });
    });
  }

  function setProfile(p) {
    deck = p === 'boy' ? 'boy' : 'girl';
    state.profile = deck;
    document.documentElement.dataset.theme = deck;
    persist();
    const sw = Kid.$('switch-profile');
    if (sw) sw.textContent = deck === 'boy' ? '換成點心花園' : '換成太空樂園';
  }

  /* ── 單元地圖 ─────────────────────────────────────── */
  function unitStars(n) { return (state.units[n] && state.units[n].stars) || 0; }

  let run = 0;
  function showMap() {
    run++;
    Kid.audio.stop();
    Kid.$('stage').replaceChildren();
    Z.write.close();
    setHash('');
    const host = Kid.$('unit-map');
    host.innerHTML = '';
    Z.UNITS.forEach(function (u) {
      const stars = unitStars(u.n);
      const b = Kid.el('button', 'unit' + (stars ? ' done' : ''));
      b.setAttribute('aria-label', '第 ' + u.n + ' 關 ' + u.title + '，' + Z.friends.names[u.n - 1] +
        (stars ? '，已完成，得到 ' + stars + ' 顆星' : ''));

      const num = Kid.el('span', 'unit-n', String(u.n));
      b.appendChild(num);
      b.appendChild(Z.friends.art(u.n - 1, 'map-friend'));
      b.appendChild(Kid.el('strong', 'friend-name', Z.friends.names[u.n - 1]));
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
    Kid.$('map-progress').textContent = '已邀請 ' + total + ' / ' + Z.UNITS.length + ' 位夥伴來野餐';
    Kid.screens.show('map');
  }

  /* ── 寫字 ─────────────────────────────────────────── */
  /* 網址帶 #write 就直接進寫字頁：主選單的「ㄅㄆㄇ寫字」卡片走這條路，
     重新整理也會留在原頁。在頁內切換時只換 hash，不堆歷史紀錄。 */
  function wantWrite() { return location.hash === '#write'; }
  function setHash(h) {
    try { history.replaceState(null, '', location.pathname + location.search + (h ? '#' + h : '')); }
    catch (e) { /* 某些 file:// 環境不給改，沒關係 */ }
  }
  function showWrite() {
    run++;
    Kid.audio.stop();
    Kid.$('stage').replaceChildren();
    setHash('write');
    Z.write.show();
  }

  /* ── 單元進行 ─────────────────────────────────────── */
  let queue = [], step = 0, unitNo = 0;

  function startUnit(n, practice) {
    run++;
    Kid.audio.stop();
    state.lastUnit = n;
    persist();
    unitNo = n;
    const ctx = { unit: n, symbols: Z.unitSymbols(n), deck: deck };
    queue = practice ? []
      .concat(Z.modes.meet.build(ctx))
      .concat(Z.modes.trace.build(ctx))
      .concat(Z.modes.listen.build(ctx, 2))
      .concat(Z.modes.picture.build(ctx, Math.min(2, countWordable(ctx))))
      .concat(Z.modes.blend.build(ctx, BLEND_Q))
      : Z.modes.adventure.build(ctx);
    Kid.$('play').dataset.practice = String(!!practice);
    step = 0;
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
    host.dataset.friend = String(unitNo - 1);
    const token = run;
    let advanced = false;
    const trail = Kid.$('snack-trail');
    trail.replaceChildren();
    queue.forEach(function (_, i) { trail.appendChild(Kid.el('span', i < step ? 'earned' : '', i < step ? '★' : '·')); });
    trail.setAttribute('aria-label', '已收集 ' + step + ' / ' + queue.length + ' 顆星星');
    Kid.$('step-count').textContent = (step + 1) + ' / ' + queue.length;
    Kid.$('step-fill').style.width = Math.round(step / queue.length * 100) + '%';
    mode.render(q, host, function () {
      if (token !== run || advanced || Kid.screens.current() !== 'play') return;
      advanced = true;
      step++;
      next();
    });
  }

  function finishUnit() {
    const stars = 3;  /* 完成就給滿星，鼓勵嘗試與使用提示。 */
    const prev = unitStars(unitNo);
    state.units[unitNo] = { stars: Math.max(prev, stars) };   /* 只升不降，重玩不會被扣 */
    persist();

    Kid.$('done-art').replaceChildren(Z.friends.art(unitNo - 1, 'reward-friend'));
    Kid.$('done-title').textContent = Z.friends.names[unitNo - 1] + '加入野餐！';
    Kid.$('done-copy').textContent = '你幫夥伴找到所有點心了！再玩一次，會遇到不同順序的符號喔。';
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
  Kid.$('quick-start').addEventListener('click', function () {
    Kid.audio.unlock();
    startUnit((Z.UNITS.find(function (u) { return !unitStars(u.n); }) || Z.UNITS[0]).n);
  });
  Kid.$('practice').addEventListener('click', function () { Kid.audio.unlock(); startUnit(state.lastUnit || 1, true); });
  Kid.$('replay-unit').addEventListener('click', function () { Kid.audio.unlock(); startUnit(unitNo); });
  document.querySelectorAll('[data-friend-art]').forEach(function (el) { el.replaceChildren(Z.friends.art(Number(el.dataset.friendArt))); });
  Kid.$('to-map').addEventListener('click', showMap);
  Kid.$('write-all').addEventListener('click', function () { Kid.audio.unlock(); showWrite(); });
  Kid.$('write-back').addEventListener('click', showMap);
  Kid.$('quit').addEventListener('click', function () {
    Kid.audio.stop();
    showMap();
  });
  Kid.$('switch-profile').addEventListener('click', function () {
    setProfile(deck === 'boy' ? 'girl' : 'boy');
    /* 在寫字頁換版本只是換配色，不用把人踢回地圖 */
    if (Kid.screens.current() !== 'write') showMap();
  });

  if (state.profile) { setProfile(state.profile); if (wantWrite()) showWrite(); else showMap(); }
  else Kid.screens.show('cover');
})(window.Kid = window.Kid || {});
