const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '../dist/games/zhuyin');
global.window = {};
require('../dist/shared/core.js');
['data/symbols.js', 'data/words.js', 'cards.js'].forEach(f => require(path.join(root, f)));
const Z = window.Kid.zhuyin;

test('聲母卡剛好是 21 個聲母，照注音符號歌的順序，每張都有語詞', () => {
  const initials = Z.SYMBOLS.filter(s => s.cls === 'initial').map(s => s.id);
  assert.deepEqual([...Z.cards.INITIALS].sort(), initials.sort());
  assert.equal(Z.cards.INITIALS.map(id => Z.symbol(id).zhuyin).join(''), 'ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙ');
  Z.cards.INITIALS.forEach(id => assert.ok(Z.word(id, 'girl') && Z.word(id, 'boy'), id));
});

test('一袋 21 張不重複，換袋時第一張不會和上一張相同', () => {
  for (let n = 0; n < 200; n++) {
    const bag = Z.cards.newBag();
    assert.equal(new Set(bag).size, 21);
    assert.notEqual(Z.cards.newBag(bag[20])[0], bag[20]);
  }
});
