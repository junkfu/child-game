const { test } = require('node:test');
const assert = require('node:assert/strict');
global.window = {};
require('../dist/games/maze/maze-core.js');
const M = window.Kid.maze;

const SIZES = [[4, 3], [5, 3], [5, 4], [6, 4], [7, 4], [7, 5], [8, 5], [9, 5], [10, 6], [11, 6], [3, 4], [6, 11]];

function passages(m) {
  let n = 0;
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    for (const d of M.DIRS) {
      const nx = x + d.dx, ny = y + d.dy;
      if (!M.inside(m, nx, ny)) continue;
      const a = M.open(m, x, y, d.bit), b = M.open(m, nx, ny, d.opp);
      assert.equal(a, b, `牆兩邊不一致 (${x},${y}) ${d.name}`);
      if (a) n++;
    }
  }
  return n / 2;
}

test('每個尺寸、多個 seed 都是完美迷宮：全部連通、通道數剛好 格數-1、外牆只有出口一個缺口', () => {
  for (const [w, h] of SIZES) for (let seed = 1; seed <= 40; seed++) {
    const m = M.generate(w, h, seed);
    assert.equal(passages(m), w * h - 1);
    const dist = M.distances(m, m.start);
    assert.ok(Array.from(dist).every(d => d >= 0), '有格子到不了');
    let gaps = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const b = m.walls[y * w + x];
      if (y === 0 && !(b & M.N)) gaps++;
      if (y === h - 1 && !(b & M.S)) gaps++;
      if (x === 0 && !(b & M.W)) gaps++;
      if (x === w - 1 && !(b & M.E)) gaps++;
    }
    assert.equal(gaps, 1);
    assert.ok(!M.inside(m, m.out.x, m.out.y), '出口外面那一格要在迷宮外');
    assert.ok(M.open(m, m.exit.x, m.exit.y, m.exitDir));
    assert.ok(dist[m.exit.y * w + m.exit.x] >= Math.max(w, h) - 1, '出口離起點太近');
  }
});

test('同一個 seed 長出同一座迷宮，seed 換了就不同', () => {
  const a = M.generate(7, 5, 3), b = M.generate(7, 5, 3), c = M.generate(7, 5, 4);
  assert.deepEqual(a.walls, b.walls);
  assert.notDeepEqual(a.walls, c.walls);
});

test('solve 從任何一格都走得到出口外面，每一步相鄰且沒有穿牆', () => {
  for (const [w, h] of SIZES) {
    const m = M.generate(w, h, 11);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const path = M.solve(m, { x, y });
      assert.ok(path && path.length >= 2);
      assert.deepEqual(path[0], { x, y });
      assert.deepEqual(path[path.length - 1], m.out);
      for (let i = 1; i < path.length; i++) {
        const d = M.DIRS.find(k => path[i - 1].x + k.dx === path[i].x && path[i - 1].y + k.dy === path[i].y);
        assert.ok(d, '不相鄰');
        assert.ok(M.open(m, path[i - 1].x, path[i - 1].y, d.bit), '穿牆');
      }
    }
    assert.equal(M.solve(m, m.out), null);
  }
});

test('stepToward 從不穿牆、每一步都更靠近目標、目標在同一格時不動', () => {
  const rand = M.rng(99);
  for (const [w, h] of SIZES) {
    const m = M.generate(w, h, 5);
    for (let i = 0; i < 300; i++) {
      const from = { x: Math.floor(rand() * w), y: Math.floor(rand() * h) };
      const target = { x: Math.floor(rand() * (w + 2)) - 1, y: Math.floor(rand() * (h + 2)) - 1 };
      const d = M.stepToward(m, from, target);
      if (from.x === target.x && from.y === target.y) { assert.equal(d, null); continue; }
      if (!d) continue;
      assert.ok(M.open(m, from.x, from.y, d.bit));
      const before = Math.abs(target.x - from.x) + Math.abs(target.y - from.y);
      const after = Math.abs(target.x - from.x - d.dx) + Math.abs(target.y - from.y - d.dy);
      assert.equal(after, before - 1);
    }
    /* 站在出口格、手指在外面：走得出去；站在別的邊界格、手指在外面：走不出去 */
    assert.ok(M.stepToward(m, m.exit, m.out));
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (x === m.exit.x && y === m.exit.y) continue;
      if (x === 0) assert.equal(M.stepToward(m, { x, y }, { x: -1, y }), null);
      if (y === 0) assert.equal(M.stepToward(m, { x, y }, { x, y: -1 }), null);
    }
  }
});
