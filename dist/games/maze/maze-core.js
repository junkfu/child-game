/* 迷宮的純邏輯：產生、查牆、朝手指走一步、找路。沒有 DOM，tests/ 直接 require。

   格子座標 (x, y)，x 往右、y 往下。每格一個位元遮罩記「哪幾面有牆」：
     N=1 上、E=2 右、S=4 下、W=8 左
   兩格之間的牆在兩邊都記一份（開通道時同時清掉），查牆只看自己這一格。

   出口是外牆上的一個缺口：exit 這格朝 exitDir 那一面沒有牆，
   走到外面那一格 out 就算走出迷宮。除了這個缺口，外牆全部封閉。 */
(function (Kid) {
  'use strict';

  const N = 1, E = 2, S = 4, W = 8;
  const DIRS = [
    { bit: N, dx: 0, dy: -1, opp: S, name: 'N' },
    { bit: E, dx: 1, dy: 0, opp: W, name: 'E' },
    { bit: S, dx: 0, dy: 1, opp: N, name: 'S' },
    { bit: W, dx: -1, dy: 0, opp: E, name: 'W' },
  ];

  /* mulberry32。同一個 seed 一定長出同一座迷宮：重新整理不會換題，
     「換一座迷宮」只是把存檔裡的 seed 計數 +1。 */
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function inside(m, x, y) { return x >= 0 && y >= 0 && x < m.w && y < m.h; }

  /* 從 (x, y) 朝 bit 那一面走得過去嗎。只看這一格的牆：
     外牆只有出口那一面是開的，所以走出格子範圍的唯一可能就是走出出口。 */
  function open(m, x, y, bit) {
    if (!inside(m, x, y)) return false;
    return (m.walls[y * m.w + x] & bit) === 0;
  }

  /* BFS 距離表（-1 = 到不了）。產生時挑出口用，提示找路也用。 */
  function distances(m, from) {
    const dist = new Int32Array(m.w * m.h).fill(-1);
    const queue = [[from.x, from.y]];
    dist[from.y * m.w + from.x] = 0;
    for (let i = 0; i < queue.length; i++) {
      const x = queue[i][0], y = queue[i][1];
      DIRS.forEach(function (d) {
        const nx = x + d.dx, ny = y + d.dy;
        if (!open(m, x, y, d.bit) || !inside(m, nx, ny)) return;
        if (dist[ny * m.w + nx] !== -1) return;
        dist[ny * m.w + nx] = dist[y * m.w + x] + 1;
        queue.push([nx, ny]);
      });
    }
    return dist;
  }

  function generate(w, h, seed) {
    const rand = rng((seed * 7919 + w * 131 + h) >>> 0);
    const m = { w: w, h: h, seed: seed, walls: new Array(w * h).fill(N | E | S | W) };
    const idx = function (x, y) { return y * w + x; };

    /* 遞迴回溯（用堆疊）：走廊長、彎多、分岔少。對小孩來說是「一條路慢慢走」，
       不是一堆岔路要選。完美迷宮：任兩格之間剛好一條路。 */
    const visited = new Uint8Array(w * h);
    const stack = [[0, 0]];
    visited[0] = 1;
    while (stack.length) {
      const x = stack[stack.length - 1][0], y = stack[stack.length - 1][1];
      const options = DIRS.filter(function (d) {
        return inside(m, x + d.dx, y + d.dy) && !visited[idx(x + d.dx, y + d.dy)];
      });
      if (!options.length) { stack.pop(); continue; }
      const d = options[Math.floor(rand() * options.length)];
      const nx = x + d.dx, ny = y + d.dy;
      m.walls[idx(x, y)] &= ~d.bit;
      m.walls[idx(nx, ny)] &= ~d.opp;
      visited[idx(nx, ny)] = 1;
      stack.push([nx, ny]);
    }

    /* 起點固定在左上角。出口挑「走起來離起點最遠」的邊界格，缺口開在朝外那一面。
       用路程不用直線距離：出口就算在地圖上看起來很近，也得繞一大圈才到。 */
    m.start = { x: 0, y: 0 };
    const dist = distances(m, m.start);
    let best = null;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (x !== 0 && y !== 0 && x !== w - 1 && y !== h - 1) continue;
        if (x === 0 && y === 0) continue;
        if (!best || dist[idx(x, y)] > dist[idx(best.x, best.y)]) best = { x: x, y: y };
      }
    }
    m.exit = best;
    m.exitDir = best.x === w - 1 ? E : best.y === h - 1 ? S : best.x === 0 ? W : N;
    const d = DIRS.find(function (k) { return k.bit === m.exitDir; });
    m.walls[idx(best.x, best.y)] &= ~m.exitDir;
    m.out = { x: best.x + d.dx, y: best.y + d.dy };
    return m;
  }

  /* 從 from 到出口外面的路徑（含頭尾）。提示的虛線就是這條。 */
  function solve(m, from) {
    if (!inside(m, from.x, from.y)) return null;
    const dist = distances(m, m.exit);
    const path = [{ x: from.x, y: from.y }];
    let x = from.x, y = from.y;
    let guard = m.w * m.h + 1;
    while ((x !== m.exit.x || y !== m.exit.y) && guard-- > 0) {
      const here = dist[y * m.w + x];
      const d = DIRS.find(function (k) {
        const nx = x + k.dx, ny = y + k.dy;
        return open(m, x, y, k.bit) && inside(m, nx, ny) && dist[ny * m.w + nx] === here - 1;
      });
      if (!d) return null;
      x += d.dx; y += d.dy;
      path.push({ x: x, y: y });
    }
    path.push({ x: m.out.x, y: m.out.y });
    return path;
  }

  /* 朝手指所在的格子走一步。先走差距大的那個軸，被牆擋住就試另一軸；
     兩邊都擋住就回傳 null —— 這就是「撞牆」。不會穿牆，也不會自己繞路找出口，
     不然把手指放在出口上就破關了。每走一步離目標一定更近，所以不會來回抖。 */
  function stepToward(m, from, target) {
    const dx = target.x - from.x, dy = target.y - from.y;
    if (!dx && !dy) return null;
    const horiz = dx > 0 ? DIRS[1] : DIRS[3];
    const vert = dy > 0 ? DIRS[2] : DIRS[0];
    const order = Math.abs(dx) >= Math.abs(dy) ? [dx ? horiz : null, dy ? vert : null] : [dy ? vert : null, dx ? horiz : null];
    for (let i = 0; i < order.length; i++) {
      const d = order[i];
      if (d && open(m, from.x, from.y, d.bit)) return d;
    }
    return null;
  }

  Kid.maze = {
    N: N, E: E, S: S, W: W, DIRS: DIRS,
    rng: rng, generate: generate, inside: inside, open: open,
    distances: distances, solve: solve, stepToward: stepToward,
  };
})(window.Kid = window.Kid || {});
