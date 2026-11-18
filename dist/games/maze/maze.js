/* 小怪獸迷宮：手指帶著小怪獸走出迷宮。

   操作模型：手指先摸到小怪獸再拖，牠會跟著手指經過的格子走；撞到牆就停在那裡，
   手指得回來接牠。兩個刻意不做的版本：
     - 「點哪裡牠就自己走過去」—— 按一下出口就破關了，迷宮就沒了。
     - 「一定要一格一格慢慢拖」—— 4 歲的手一定會快、會歪。
   所以記下手指經過的格子（麵包屑）讓牠追上去；手指一穿牆麵包屑就作廢，
   改成朝手指的方向試著走一步，走不了就停。

   迷宮本身在 maze-core.js，這裡只管畫面、手指、動畫與進度。 */
(function (Kid) {
  'use strict';
  const M = Kid.maze;
  const $ = Kid.$;
  const GAME_ID = 'maze';
  const NS = 'http://www.w3.org/2000/svg';

  /* 橫放時的寬 x 高。越後面越大，但長邊拉寬、短邊不超過 6：
     平板橫放時高度是稀缺資源，太高就得把格子縮到手指按不準。直放時整座迷宮轉 90 度。 */
  const LEVELS = [[4, 3], [5, 3], [5, 4], [6, 4], [7, 4], [7, 5], [8, 5], [9, 5], [10, 6], [11, 6]];
  /* 跟注音大冒險同一批夥伴、同一張圖集，孩子已經認得牠們 */
  const FRIENDS = ['布丁龍', '草莓兔', '泡泡龍', '星星貓', '橘子狐', '布啾', '花花龜', '啵啵', '皇冠熊', '毛毛'];

  const C = 100;        /* 一格在 SVG 座標裡的邊長 */
  const PAD = 90;       /* 迷宮四周留白，房子放在缺口外面 */
  const SPEED = 7;      /* 格／秒；麵包屑排隊越長跑越快，最多 3 倍 */
  const GRAB = 1.3;     /* 手指離小怪獸中心這麼近（格）才算摸到牠 */

  const saved = Kid.store.game(GAME_ID);
  if (!saved.done || typeof saved.done !== 'object') saved.done = {};
  if (!saved.seeds || typeof saved.seeds !== 'object') saved.seeds = {};
  let current = Number.isInteger(saved.current) && saved.current >= 0 && saved.current < LEVELS.length ? saved.current : 0;
  function save() { saved.current = current; Kid.store.saveGame(GAME_ID, saved); }
  function doneCount() { return LEVELS.filter(function (_, i) { return saved.done[i]; }).length; }

  const board = $('board');
  let maze, cell, pos, next, finger, lastFinger, crumbs, trail, won;
  let W, H, svg, trailEl, hintEl, hero;
  let raf, hintTimer, announced = false;
  let bumpAt = -1e9;   /* 上次抖動的時間；起始值放很久以前，第一次撞牆才不會被節流擋掉 */

  function el(tag, attrs) {
    const n = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }
  function center(x, y) { return { x: PAD + (x + 0.5) * C, y: PAD + (y + 0.5) * C }; }
  function place(node, x, y, size) {
    const c = center(x, y);
    node.style.left = (c.x / W * 100) + '%';
    node.style.top = (c.y / H * 100) + '%';
    node.style.width = (size * C / W * 100) + '%';
  }
  function pathD(cells) {
    return cells.map(function (c, i) {
      const p = center(c.x, c.y);
      return (i ? 'L' : 'M') + p.x + ' ' + p.y;
    }).join('');
  }
  function friendArt(i) {
    const art = Kid.el('span', 'friend-art');
    art.style.backgroundPosition = (i % 5 * 25) + '% ' + (i < 5 ? 0 : 100) + '%';
    return art;
  }
  function portrait() { return window.innerHeight > window.innerWidth; }

  /* ── 蓋迷宮 ───────────────────────────────────────── */
  function build() {
    cancelAnimationFrame(raf); clearTimeout(hintTimer);
    const L = LEVELS[current];
    const flip = portrait();
    const seed = current * 1000 + (saved.seeds[current] || 0) + 1;
    maze = M.generate(flip ? L[1] : L[0], flip ? L[0] : L[1], seed);
    cell = { x: maze.start.x, y: maze.start.y };
    pos = { x: cell.x, y: cell.y };
    next = null; finger = null; crumbs = []; trail = [cell]; won = false;
    W = maze.w * C + 2 * PAD; H = maze.h * C + 2 * PAD;

    board.innerHTML = '';
    board.style.setProperty('--ar', (W / H).toFixed(4));
    board.style.aspectRatio = W + ' / ' + H;
    board.setAttribute('aria-label', '迷宮，' + maze.w + ' 乘 ' + maze.h + ' 格。用手指拖著' + FRIENDS[current] + '走，鍵盤可以用方向鍵');

    svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'maze-svg', 'aria-hidden': 'true' });
    svg.appendChild(el('rect', { x: PAD, y: PAD, width: maze.w * C, height: maze.h * C, rx: 16, class: 'maze-floor' }));
    trailEl = el('path', { class: 'maze-trail', d: pathD(trail) });
    svg.appendChild(trailEl);
    hintEl = el('path', { class: 'maze-hint', d: '' });
    svg.appendChild(hintEl);
    svg.appendChild(el('path', { class: 'maze-walls', d: wallsD() }));
    const hp = center(maze.out.x, maze.out.y);
    const house = el('text', { x: hp.x, y: hp.y + 26, 'text-anchor': 'middle', class: 'maze-house' });
    house.textContent = '🏠';
    svg.appendChild(house);
    board.appendChild(svg);

    hero = Kid.el('div', 'maze-hero');
    hero.appendChild(friendArt(current));
    hero.setAttribute('role', 'img');
    hero.setAttribute('aria-label', FRIENDS[current]);
    place(hero, pos.x, pos.y, 0.8);
    board.appendChild(hero);

    $('instruction').innerHTML = '用手指摸著<b>' + FRIENDS[current] + '</b>，帶牠走到 🏠 回家。撞到牆，就換一條路試試！';
    renderLevels();
    if (!announced) { announced = true; Kid.audio.say('audio/ui/start.m4a'); }
  }

  /* 每格畫上、左兩面；最後一列補下面、最後一欄補右邊。出口那一面的位元已清掉，自然留下缺口。 */
  function wallsD() {
    const d = [];
    for (let y = 0; y < maze.h; y++) {
      for (let x = 0; x < maze.w; x++) {
        const b = maze.walls[y * maze.w + x];
        const x0 = PAD + x * C, y0 = PAD + y * C, x1 = x0 + C, y1 = y0 + C;
        if (b & M.N) d.push('M' + x0 + ' ' + y0 + 'H' + x1);
        if (b & M.W) d.push('M' + x0 + ' ' + y0 + 'V' + y1);
        if (y === maze.h - 1 && (b & M.S)) d.push('M' + x0 + ' ' + y1 + 'H' + x1);
        if (x === maze.w - 1 && (b & M.E)) d.push('M' + x1 + ' ' + y0 + 'V' + y1);
      }
    }
    return d.join('');
  }

  function renderLevels() {
    const host = $('levels');
    host.innerHTML = '';
    LEVELS.forEach(function (_, i) {
      const b = Kid.el('button', 'level-btn' + (i === current ? ' active' : '') + (saved.done[i] ? ' complete' : ''));
      b.dataset.level = String(i);
      b.setAttribute('aria-label', '第 ' + (i + 1) + ' 關，' + FRIENDS[i] + (saved.done[i] ? '，已走出' : ''));
      b.setAttribute('aria-pressed', String(i === current));
      b.appendChild(friendArt(i));
      b.appendChild(Kid.el('span', 'level-n', String(i + 1)));
      host.appendChild(b);
    });
    $('progress').textContent = '已走出 ' + doneCount() + ' / ' + LEVELS.length + ' 座迷宮';
  }

  function chooseLevel(i) {
    if (!Number.isInteger(i) || i < 0 || i >= LEVELS.length) throw new Error('請選擇第 1 至 ' + LEVELS.length + ' 關');
    if ($('win-dialog').open) $('win-dialog').close();
    current = i;
    save();
    build();
  }

  function shuffle() {
    saved.seeds[current] = (saved.seeds[current] || 0) + 1;
    save();
    if ($('win-dialog').open) $('win-dialog').close();
    build();
    Kid.toast('新的迷宮蓋好了，再帶' + FRIENDS[current] + '走一次！');
  }

  /* ── 手指 ─────────────────────────────────────────── */
  function toCell(e) {
    const r = svg.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width * W - PAD) / C,
      y: ((e.clientY - r.top) / r.height * H - PAD) / C,
    };
  }

  board.addEventListener('pointerdown', function (e) {
    if (won || !svg) return;
    const f = toCell(e);
    if (Math.hypot(f.x - (pos.x + 0.5), f.y - (pos.y + 0.5)) > GRAB) { nudge(); return; }
    Kid.audio.unlock();
    finger = f; lastFinger = f; crumbs = [];
    hero.classList.add('held');
    try { board.setPointerCapture(e.pointerId); } catch (err) {}
    e.preventDefault();
    tick();
  });

  board.addEventListener('pointermove', function (e) {
    if (!finger) return;
    const f = toCell(e);
    /* 麵包屑：把上一個點到這一點之間切細，經過的每一格照順序記下來。
       取樣點之間手指可能一次掃過好幾格，不切細會漏掉中間的格子。 */
    const steps = Math.max(1, Math.ceil(Math.hypot(f.x - lastFinger.x, f.y - lastFinger.y) / 0.2));
    let prev = { x: Math.floor(lastFinger.x), y: Math.floor(lastFinger.y) };
    for (let i = 1; i <= steps; i++) {
      const c = {
        x: Math.floor(lastFinger.x + (f.x - lastFinger.x) * i / steps),
        y: Math.floor(lastFinger.y + (f.y - lastFinger.y) * i / steps),
      };
      if (c.x !== prev.x || c.y !== prev.y) { crumbs.push(c); prev = c; }
    }
    if (crumbs.length > 60) crumbs.splice(0, crumbs.length - 60);
    lastFinger = f; finger = f;
    e.preventDefault();
  });

  function release(e) {
    if (!finger) return;
    finger = null; crumbs = [];
    hero.classList.remove('held');
    try { board.releasePointerCapture(e.pointerId); } catch (err) {}
  }
  board.addEventListener('pointerup', release);
  board.addEventListener('pointercancel', release);

  /* 鍵盤：方向鍵一次走一格。手指遊戲本質上是動作練習，這是讀螢幕與鍵盤的替代路徑。 */
  board.addEventListener('keydown', function (e) {
    const map = { ArrowUp: M.N, ArrowRight: M.E, ArrowDown: M.S, ArrowLeft: M.W };
    if (!(e.key in map) || won || next) return;
    e.preventDefault();
    const d = M.DIRS.find(function (k) { return k.bit === map[e.key]; });
    if (!M.open(maze, cell.x, cell.y, d.bit)) { bump(); return; }
    next = { x: cell.x + d.dx, y: cell.y + d.dy };
    tick();
  });

  /* ── 移動 ─────────────────────────────────────────── */
  /* 決定下一步。先消化麵包屑；麵包屑接不上（手指穿牆或跳格）就作廢，改成朝手指試一步。 */
  function decide() {
    while (crumbs.length && crumbs[0].x === cell.x && crumbs[0].y === cell.y) crumbs.shift();
    if (crumbs.length) {
      const c = crumbs[0];
      const d = M.DIRS.find(function (k) { return cell.x + k.dx === c.x && cell.y + k.dy === c.y; });
      if (d && M.open(maze, cell.x, cell.y, d.bit)) return d;
      crumbs = [];
    }
    if (!finger) return null;
    const target = { x: Math.floor(finger.x), y: Math.floor(finger.y) };
    if (target.x === cell.x && target.y === cell.y) return null;
    const d = M.stepToward(maze, cell, target);
    if (!d) bump();
    return d;
  }

  function tick() {
    cancelAnimationFrame(raf);
    let last = performance.now();
    (function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (next) {
        const speed = SPEED * Math.min(3, 1 + crumbs.length * 0.25);
        const ddx = next.x - pos.x, ddy = next.y - pos.y;
        const dist = Math.hypot(ddx, ddy), step = speed * dt;
        if (dist <= step) { pos = { x: next.x, y: next.y }; const c = next; next = null; arrive(c); }
        else pos = { x: pos.x + ddx / dist * step, y: pos.y + ddy / dist * step };
        place(hero, pos.x, pos.y, 0.8);
      }
      if (!next && !won && finger) {
        const d = decide();
        if (d) next = { x: cell.x + d.dx, y: cell.y + d.dy };
      }
      if (next || finger) raf = requestAnimationFrame(frame);
    })(last);
  }

  function arrive(c) {
    cell = c;
    trail.push(c);
    trailEl.setAttribute('d', pathD(trail));
    if (c.x === maze.out.x && c.y === maze.out.y) win();
  }

  /* 撞牆：只是抖一下，不出聲、不變紅 —— 撞牆是找路的一部分，不是做錯 */
  function bump() {
    const now = performance.now();
    if (now - bumpAt < 600) return;
    bumpAt = now;
    hero.classList.remove('bump'); void hero.offsetWidth; hero.classList.add('bump');
  }

  /* 按在離小怪獸太遠的地方：提醒要先摸到牠。不然孩子會以為「點哪裡牠就去哪裡」。 */
  function nudge() {
    const now = performance.now();
    if (now - bumpAt < 1500) return;
    bumpAt = now;
    hero.classList.remove('wiggle'); void hero.offsetWidth; hero.classList.add('wiggle');
    Kid.toast('先摸摸' + FRIENDS[current] + '，再帶著牠走');
    Kid.audio.say('audio/ui/grab.m4a');
  }

  /* ── 提示與過關 ───────────────────────────────────── */
  function showHint() {
    if (won) return null;
    const path = M.solve(maze, cell);
    if (!path) return null;
    hintEl.setAttribute('d', pathD(path));
    hintEl.classList.add('show');
    clearTimeout(hintTimer);
    hintTimer = setTimeout(function () { hintEl.classList.remove('show'); }, 5000);
    Kid.audio.say('audio/ui/hint.m4a');
    return { level: current + 1, steps: path.length - 1 };
  }

  function win() {
    won = true; finger = null; crumbs = [];
    hero.classList.remove('held');
    hero.classList.add('celebrate');
    saved.done[current] = true;
    save();
    renderLevels();
    Kid.audio.chime('win');
    Kid.audio.say('audio/ui/win.m4a');
    setTimeout(function () {
      if (!won) return;
      const all = doneCount() === LEVELS.length;
      $('win-art').replaceChildren(friendArt(current));
      $('win-title').textContent = all ? '10 座迷宮，全部走出來了！' : FRIENDS[current] + '回家了！';
      $('win-copy').textContent = all
        ? '每一位夥伴都回到家了，你是最厲害的帶路小隊長！'
        : '你帶著牠繞過所有的牆壁，找到回家的路。';
      $('next').textContent = all ? '再走一次這一關 ↻'
        : current === LEVELS.length - 1 ? '繼續走還沒走過的 →' : '下一關，出發！ →';
      $('win-dialog').showModal();
    }, 900);
  }

  /* ── 事件 ─────────────────────────────────────────── */
  $('levels').addEventListener('click', function (e) {
    const b = e.target.closest('[data-level]');
    if (b) { Kid.audio.unlock(); chooseLevel(Number(b.dataset.level)); }
  });
  $('hint').addEventListener('click', function () { Kid.audio.unlock(); showHint(); });
  $('shuffle').addEventListener('click', function () { Kid.audio.unlock(); shuffle(); });
  $('again').addEventListener('click', shuffle);
  $('next').addEventListener('click', function () {
    if (doneCount() === LEVELS.length) { shuffle(); return; }
    if (current < LEVELS.length - 1) { chooseLevel(current + 1); return; }
    chooseLevel(LEVELS.findIndex(function (_, i) { return !saved.done[i]; }));
  });
  $('help').addEventListener('click', function () { $('help-dialog').showModal(); });
  document.querySelectorAll('[data-close]').forEach(function (b) {
    b.addEventListener('click', function () { b.closest('dialog').close(); });
  });
  /* 點對話框外面關閉 */
  document.querySelectorAll('dialog').forEach(function (dialog) {
    dialog.addEventListener('click', function (e) {
      if (e.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
    });
  });
  /* 轉成直放／橫放時整座迷宮跟著轉，重蓋一座。玩到一半轉螢幕很少見，接受重來。 */
  try {
    matchMedia('(orientation: portrait)').addEventListener('change', function () { if (!won) build(); });
  } catch (e) {}

  Kid.wireSoundButton($('sound'));
  build();

  /* 給測試與外部工具用的小窗口 */
  Kid.mazeGame = {
    state: function () {
      return { level: current + 1, size: [maze.w, maze.h], cell: { x: cell.x, y: cell.y }, exit: maze.exit, out: maze.out,
        won: won, completed: LEVELS.map(function (_, i) { return saved.done[i] ? i + 1 : null; }).filter(Boolean) };
    },
    maze: function () { return maze; },
    solution: function () { return M.solve(maze, cell); },
    /* 格子中心在畫面上的位置（CSS px），測試模擬手指用 */
    clientPoint: function (x, y) {
      const r = svg.getBoundingClientRect(), c = center(x, y);
      return { x: r.left + c.x / W * r.width, y: r.top + c.y / H * r.height };
    },
    chooseLevel: chooseLevel, showHint: showHint, shuffle: shuffle,
  };

  /* OpenAI Apps 的工具註冊，名稱加 maze_ 前綴，跟找碴遊戲的 spot_ 一樣。 */
  const context = document.modelContext;
  if (context && context.registerTool) {
    [
      { name: 'maze_get_progress', description: 'Read current level, position, and completed levels.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true },
        execute: function () { return Kid.mazeGame.state(); } },
      { name: 'maze_choose_level', description: 'Choose a level, keeping progress.',
        inputSchema: { type: 'object', properties: { level: { type: 'integer', minimum: 1, maximum: LEVELS.length } }, required: ['level'], additionalProperties: false },
        execute: function (input) { chooseLevel(input.level - 1); return Kid.mazeGame.state(); } },
      { name: 'maze_show_hint', description: 'Temporarily draw the path from the character to the exit.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        execute: function () { return showHint(); } },
    ].forEach(function (tool) {
      try { Promise.resolve(context.registerTool(tool)).catch(function () {}); } catch (e) {}
    });
  }
})(window.Kid = window.Kid || {});
