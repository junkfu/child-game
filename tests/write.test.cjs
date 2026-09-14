const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '../dist/games/zhuyin');
global.window = {};
require('../dist/shared/core.js');
['data/symbols.js', 'write.js'].forEach(f => require(path.join(root, f)));
const Z = window.Kid.zhuyin;

test('寫字表照注音符號歌的順序涵蓋全部 37 個符號，不重複、不漏', () => {
  assert.equal(Z.write.ORDER.length, 37);
  assert.equal(new Set(Z.write.ORDER).size, 37);
  assert.deepEqual([...Z.write.ORDER].sort(), Z.SYMBOLS.map(s => s.id).sort());
  const zhuyin = Z.write.ORDER.map(id => Z.symbol(id).zhuyin).join('');
  assert.equal(zhuyin, 'ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙㄧㄨㄩㄚㄛㄜㄝㄞㄟㄠㄡㄢㄣㄤㄥㄦ');
});
