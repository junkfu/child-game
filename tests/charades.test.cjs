const { test } = require('node:test');
const assert = require('node:assert/strict');
global.window = {};
require('../dist/games/charades/charades-core.js');
const C = window.Kid.charades;

test('比一比題庫有 100 張，id 與詞都不重複', () => {
  assert.equal(C.ITEMS.length, 100);
  assert.equal(new Set(C.ITEMS.map(i => i.id)).size, 100);
  assert.equal(new Set(C.ITEMS.map(i => i.word)).size, 100);
  C.ITEMS.forEach(i => assert.ok(i.emoji && i.word, i.id));
});

test('一袋剛好每張一次，換袋時第一張不會和上一張相同', () => {
  for (let n = 0; n < 200; n++) {
    const bag = C.newBag();
    assert.equal(bag.length, 100);
    assert.equal(new Set(bag).size, 100);
    const next = C.newBag(bag[bag.length - 1]);
    assert.notEqual(next[0], bag[bag.length - 1]);
  }
});
