const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const root = path.resolve(__dirname, '../dist/games/zhuyin');
global.window = {};
require('../dist/shared/core.js');
['data/symbols.js', 'data/words.js', 'quiz.js', 'modes/adventure.js'].forEach(f => require(path.join(root, f)));
const Z = window.Kid.zhuyin;

test('每關維持 5–7 題，37 個符號皆先示範再進入聽音挑戰', () => {
  const covered = new Set();
  for (const unit of Z.UNITS) {
    const symbols = Z.unitSymbols(unit.n);
    for (let run = 0; run < 30; run++) {
      const queue = Z.modes.adventure.build({unit:unit.n, symbols, deck:'girl'});
      assert.ok(queue.length >= 5 && queue.length <= 7);
      const seen = new Set();
      for (const q of queue) {
        assert.equal(new Set(q.options).size, q.options.length);
        assert.equal(q.options.filter(id => id === q.answer).length, 1);
        assert.ok(q.options.every(id => Z.learnedThrough(unit.n).some(s => s.id === id)));
        if (q.guided) { assert.equal(q.options.length, 2); seen.add(q.answer); covered.add(q.answer); }
        else { assert.equal(q.options.length, 3); assert.ok(seen.has(q.answer)); }
      }
      assert.deepEqual([...seen].sort(), symbols.map(s => s.id).sort());
      assert.ok(queue.slice(-2).every(q => !q.guided));
    }
  }
  assert.equal(covered.size, 37);
});

test('兩套題庫 56 格插畫與既有語音一一對應，檔案皆存在', () => {
  for (const deck of ['girl','boy']) {
    const words = Object.values(Z.WORDS).map(w => w[deck]);
    assert.equal(words.length, 28);
    assert.equal(new Set(words.map(w => w.atlasIndex)).size, 28);
    for (const word of words) {
      assert.ok(word.atlasIndex >= 0 && word.atlasIndex < 28);
      assert.ok(fs.existsSync(path.join(root, word.img)));
      assert.ok(fs.existsSync(path.join(root, word.audio)));
    }
  }
  for (const clip of ['feed','treasure']) assert.ok(fs.statSync(path.join(root,'audio/ui',clip+'.m4a')).size > 1000);
  assert.equal(Z.friends.names.length, 10);
});
