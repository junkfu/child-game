/* 找碴遊戲。

   從單一頁面的版本搬過來時做的改動：
     - 包成 IIFE，不再污染全域（原本 levels / current / progress / render / $
       全都掛在 window 上，多一個遊戲就會撞名）。
     - 原本硬寫在十幾個地方的 10 改成 levels.length 與 diffCount()，
       關卡數與每關差異數現在都由資料決定。
     - 進度與音效改走 shared/ 的 Kid.store 與 Kid.audio，和其他遊戲共用。
     - 拿掉每一關那組 emoji（levels[i][3]）—— CSS 早就用
       .object{color:transparent;font-size:0} 把它們藏起來了，是死資料。
       但 .objects 那層透明按鈕要留著：它們是鍵盤與讀螢幕的操作路徑
       （滑鼠走的是座標命中判定，鍵盤走的是這些按鈕）。
     - 命中判定仍然是百分比座標，所以版面縮放不影響答案位置。 */
(function (Kid) {
  'use strict';

  const GAME_ID = 'spot';

  /* [關卡名稱, 副標, 圖示] */
  const levels = [
    ['閃亮出道舞台', '屋頂上的小派對', '🎤'],
    ['甜甜點心時光', '今天吃一口幸福', '🧁'],
    ['女團練習日', '跟著音樂動一動', '🎧'],
    ['海底星光旅行', '和魚兒打個招呼', '🐠'],
    ['花園野餐趣', '把好心情裝進籃子', '🌷'],
    ['糖果遊樂園', '今天的快樂加倍', '🎠'],
    ['月光睡衣派對', '和星星說晚安', '🌙'],
    ['海邊的假期', '收集一口袋陽光', '🏖️'],
    ['魔法圖書館', '故事裡的小秘密', '📚'],
    ['彩虹安可演唱會', '把閃亮帶給全世界', '🌈'],  ];

  /* 每關的差異範圍，格式 [中心x%, 中心y%, 水平半徑%, 垂直半徑%]。
     畫面變化、點擊判定、提示圈圈共用同一份資料。 */
  const regions = [[[18.5, 4, 3, 4], [55, 28, 5, 6], [93, 51, 7, 10], [95, 67, 7, 9], [2, 66, 5, 14], [4, 37, 3, 10], [26, 70, 7, 9], [36, 81, 3, 4], [50, 80, 6, 6], [67, 85, 4, 4]], [[45, 4, 7, 5], [47, 15, 4, 5], [75, 25, 4, 4], [12, 85, 5, 12], [35, 91, 7, 7], [56, 93, 8, 7], [83, 84, 5, 13], [89, 61, 8, 13], [23, 80, 5, 10], [74, 80, 6, 10]], [[49, 28, 12, 10], [40, 8, 6, 6], [80, 10, 4, 5], [22, 27, 4, 6], [7, 42, 9, 5], [93, 42, 9, 5], [35, 70, 4, 6], [51, 68, 6, 6], [67, 75, 4, 5], [53, 91, 7, 12]], [[14, 10, 7, 5], [36, 20, 13, 9], [83, 27, 6, 6], [73, 14, 4, 4], [10, 32, 6, 14], [95, 29, 5, 11], [25, 83, 6, 11], [49, 85, 5, 7], [81, 73, 7, 12], [63, 86, 5, 8]], [[8, 65, 5, 8], [80, 69, 6, 5], [87, 93, 12, 6], [19, 5, 9, 5], [94, 75, 7, 12], [67, 35, 3, 7], [29, 74, 6, 12], [64, 73, 8, 12], [33, 65, 3, 4], [84, 15, 9, 6]], [[25, 20, 6, 7], [50, 7, 4, 7], [66, 20, 5, 10], [94, 4, 10, 5], [17, 36, 3, 7], [58, 40, 5, 7], [26, 83, 6, 10], [53, 81, 6, 6], [76, 83, 8, 10], [83, 36, 5, 6]], [[59, 10, 6, 7], [18, 34, 6, 8], [91, 28, 6, 10], [91, 66, 7, 12], [25, 81, 7, 11], [43, 79, 7, 10], [66, 83, 8, 11], [49, 94, 11, 6], [88, 89, 9, 5], [5, 46, 4, 5]], [[92, 31, 14, 11], [35, 9, 8, 5], [94, 88, 8, 11], [96, 64, 6, 14], [12, 54, 3, 5], [28, 67, 7, 8], [52, 74, 6, 6], [76, 70, 7, 10], [23, 93, 9, 7], [85, 83, 4, 4]], [[9, 82, 10, 5], [92, 85, 9, 5], [32, 76, 4, 5], [67, 76, 4, 5], [97, 16, 3, 8], [42, 10, 7, 9], [26, 78, 6, 12], [50, 70, 5, 6], [72, 78, 7, 12], [49, 90, 4, 10]], [[49, 19, 21, 18], [18, 9, 7, 12], [85, 10, 7, 12], [7, 90, 5, 9], [86, 90, 3, 7], [49, 63, 3, 6], [26, 62, 7, 10], [51, 70, 5, 6], [69, 76, 4, 5], [73, 90, 5, 6]]];

  const $ = Kid.$;
  const praises = [
    '好眼力！找到一個小不同！',
    '哇，你的眼睛會發光耶！',
    '女孩們為你拍拍手！',
    '又收集到一顆小星星！',
    '小小觀察家，就是你！',
  ];

  function diffCount(level) { return regions[level].length; }
  function puzzle(level) {
    return regions[level].map(function (p, i) {
      return { x: p[0], y: p[1], rx: p[2], ry: p[3], diff: i };
    });
  }
  function isComplete(i) { return progress[i].size >= diffCount(i); }
  function completedCount() {
    return progress.reduce(function (n, _, i) { return n + (isComplete(i) ? 1 : 0); }, 0);
  }

  /* ── 狀態 ─────────────────────────────────────────── */
  const saved = Kid.store.game(GAME_ID);
  let current = Number.isInteger(saved.current) && saved.current >= 0 && saved.current < levels.length
    ? saved.current : 0;
  const progress = levels.map(function (_, i) {
    const raw = Array.isArray(saved.found && saved.found[i]) ? saved.found[i] : [];
    return new Set(raw.filter(function (v) {
      return Number.isInteger(v) && v >= 0 && v < diffCount(i);
    }));
  });
  let hintTimer, winTimer, missTimer;

  function save() {
    Kid.store.saveGame(GAME_ID, {
      current: current,
      found: progress.map(function (s) { return Array.from(s); }),
    });
  }

  /* ── 畫面 ─────────────────────────────────────────── */
  function clearHint() {
    clearTimeout(hintTimer);
    document.querySelectorAll('.hint-mark').forEach(function (el) { el.remove(); });
  }

  function render() {
    clearHint();
    clearTimeout(winTimer);
    const level = levels[current];
    const found = progress[current];

    $('level-title').textContent = level[0];
    $('level-kicker').textContent = 'LEVEL ' + String(current + 1).padStart(2, '0') + ' · ' + level[1];
    $('level-icon').textContent = level[2];

    $('levels').innerHTML = levels.map(function (l, i) {
      return '<button class="level-btn' + (i === current ? ' active' : '') +
        (isComplete(i) ? ' complete' : '') + '"' +
        ' aria-label="第' + (i + 1) + '關：' + l[0] + (isComplete(i) ? '，已完成' : '') + '"' +
        (i === current ? ' aria-current="step"' : '') +
        ' data-level="' + i + '">' + (i + 1) + '</button>';
    }).join('');

    ['a', 'b'].forEach(function (side) {
      const scene = $('scene-' + side);
      scene.style.setProperty('--bg-x', current % 2 ? '100%' : '0%');
      scene.style.setProperty('--bg-y', Math.floor(current / 2) * 25 + '%');
      /* 只有 B 面疊上編修圖的局部遮罩，遮罩外仍是原圖，
         這樣圖片生成工具的改動不會引入沒列入答案的差異。 */
      /* 透明的可聚焦按鈕：滑鼠用不到（滑鼠走座標判定），
         但鍵盤 Tab 與讀螢幕靠它們才能作答。 */
      scene.querySelector('.objects').innerHTML = puzzle(current).map(function (item, i) {
        const got = found.has(item.diff);
        return '<button class="object" style="--x:' + item.x + ';--y:' + item.y +
          ';--rx:' + item.rx + ';--ry:' + item.ry + '" data-index="' + i + '"' +
          ' aria-label="圖片' + side.toUpperCase() + '，觀察區域' + (i + 1) + (got ? '，已找到' : '') + '"' +
          (got ? ' disabled' : '') + '></button>';
      }).join('');
      scene.querySelector('.changes').innerHTML = side === 'b'
        ? puzzle(current).map(function (item) {
            return '<div class="scene-change" style="--x:' + item.x + '%;--y:' + item.y +
              '%;--rx:' + item.rx + '%;--ry:' + item.ry + '%"></div>';
          }).join('')
        : '';
      scene.querySelector('.marks').innerHTML = '';
    });

    updateProgress();
    puzzle(current).forEach(function (item) { if (found.has(item.diff)) mark(item); });
    save();
  }

  function updateProgress() {
    const n = progress[current].size;
    const total = diffCount(current);
    $('found-count').textContent = n;
    $('found-total').textContent = total;
    $('found-total-2').textContent = total;
    Kid.stars($('stars'), n, total);
    $('journey-count').textContent = '已完成 ' + completedCount() + ' / ' + levels.length + ' 關';
    $('hint').disabled = n === total;
    $('encouragement').textContent =
      n === total ? '全部找到了！你是閃亮觀察家！'
      : n === 0 ? '看看衣服、髮飾和背景，小不同藏在畫裡喔！'
      : (total - n) <= 3 ? '再找到 ' + (total - n) + ' 個，就集滿星星囉！'
      : praises[n % praises.length];
  }

  function mark(item, hint) {
    ['a', 'b'].forEach(function (side) {
      const m = document.createElement('span');
      m.className = 'found-mark' + (hint ? ' hint-mark' : '');
      m.style.cssText = '--x:' + item.x + ';--y:' + item.y + ';--rx:' + item.rx + ';--ry:' + item.ry;
      $('scene-' + side).querySelector('.marks').appendChild(m);
    });
  }

  function miss(x, y) {
    Kid.audio.chime('wrong');
    Kid.toast('這裡一樣喔，再仔細看看衣服和背景 ♡');
    clearTimeout(missTimer);
    document.querySelectorAll('.miss-mark').forEach(function (el) { el.remove(); });
    ['a', 'b'].forEach(function (side) {
      const m = document.createElement('span');
      m.className = 'miss-mark';
      m.style.cssText = '--x:' + x + ';--y:' + y;
      $('scene-' + side).querySelector('.marks').appendChild(m);
    });
    missTimer = setTimeout(function () {
      document.querySelectorAll('.miss-mark').forEach(function (el) { el.remove(); });
    }, 700);
  }

  function select(index) {
    const item = puzzle(current)[index];
    if (!item) return false;
    if (progress[current].has(item.diff)) return false;   /* 點已找到的地方不出聲，避免被當成答錯 */
    clearHint();
    progress[current].add(item.diff);
    mark(item);
    ['a', 'b'].forEach(function (side) {
      const b = $('scene-' + side).querySelector('[data-index="' + index + '"]');
      if (b) {
        b.disabled = true;
        b.setAttribute('aria-label', '圖片' + side.toUpperCase() + '，觀察區域' + (index + 1) + '，已找到');
      }
    });
    updateProgress();
    save();
    Kid.audio.chime('right');
    if (isComplete(current)) {
      const btn = $('levels').querySelector('[data-level="' + current + '"]');
      if (btn) btn.classList.add('complete');
      winTimer = setTimeout(showWin, 550);
    }
    return true;
  }

  function chooseLevel(index) {
    if (!Number.isInteger(index) || index < 0 || index >= levels.length) {
      throw new Error('請選擇第 1 至 ' + levels.length + ' 關');
    }
    if ($('win-dialog').open) $('win-dialog').close();
    current = index;
    render();
  }

  function showHint() {
    if (isComplete(current)) return null;
    clearHint();
    const item = puzzle(current).find(function (p) { return !progress[current].has(p.diff); });
    mark(item, true);
    Kid.toast('看看黃色圈圈裡，顏色或小細節有沒有改變？');
    hintTimer = setTimeout(clearHint, 4500);
    return { level: current + 1, x: item.x, y: item.y };
  }

  function showWin() {
    Kid.audio.chime('win');
    const all = progress.every(function (_, i) { return isComplete(i); });
    const total = diffCount(current);
    $('win-title').textContent = all ? '全部的關卡，都被你破解了！' : '太棒了！全都找到了！';
    $('win-copy').textContent = all
      ? levels.length + ' 顆過關星星，送給最閃亮的小小觀察家！'
      : total + ' 個小不同，都逃不過你的眼睛。';
    $('next').textContent = all ? '再玩一次這一關 ↻'
      : current === levels.length - 1 ? '繼續收集星星 →' : '下一關，出發！ →';
    $('win-dialog').showModal();
  }

  /* ── 事件 ─────────────────────────────────────────── */
  $('levels').addEventListener('click', function (e) {
    const b = e.target.closest('[data-level]');
    if (b) chooseLevel(Number(b.dataset.level));
  });

  /* 命中判定：把點擊位置換成百分比座標，再找最近的範圍。
     用正規化的橢圓距離，加一點寬容值，小朋友不用點得很準。 */
  ['a', 'b'].forEach(function (side) {
    $('scene-' + side).addEventListener('click', function (e) {
      /* 鍵盤按 Enter/空白鍵觸發時 detail 是 0，直接用按鈕的索引，
         不要去算座標（鍵盤沒有座標）。 */
      const b = e.target.closest('[data-index]');
      if (b && e.detail === 0) { select(Number(b.dataset.index)); return; }
      const r = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width * 100;
      const y = (e.clientY - r.top) / r.height * 100;
      let best = -1, bestD = Infinity;
      puzzle(current).forEach(function (p, i) {
        const d = Math.pow((p.x - x) / (p.rx + 1.2), 2) + Math.pow((p.y - y) / (p.ry + 1.8), 2);
        if (d <= 1 && d < bestD) { bestD = d; best = i; }
      });
      if (best >= 0) select(best); else miss(x, y);
    });
  });

  $('hint').addEventListener('click', showHint);
  $('restart').addEventListener('click', function () {
    progress[current] = new Set();
    render();
    Kid.toast('星星準備好了，一起重新找！');
  });
  $('help').addEventListener('click', function () { $('help-dialog').showModal(); });
  document.querySelectorAll('[data-close]').forEach(function (b) {
    b.addEventListener('click', function () { b.closest('dialog').close(); });
  });
  $('stay').addEventListener('click', function () { $('win-dialog').close(); });
  $('next').addEventListener('click', function () {
    const all = progress.every(function (_, i) { return isComplete(i); });
    if (all) { progress[current] = new Set(); chooseLevel(current); return; }
    if (current < levels.length - 1) { chooseLevel(current + 1); return; }
    chooseLevel(progress.findIndex(function (_, i) { return !isComplete(i); }));
  });

  /* 點對話框外面關閉 */
  document.querySelectorAll('dialog').forEach(function (dialog) {
    dialog.addEventListener('click', function (e) {
      if (e.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
        dialog.close();
      }
    });
  });

  Kid.wireSoundButton($('sound'));
  render();

  /* OpenAI Apps 的工具註冊。名稱加了 spot_ 前綴，
     之後其他遊戲要註冊自己的工具才不會撞名。 */
  const context = document.modelContext;
  if (context && context.registerTool) {
    [
      {
        name: 'spot_get_progress',
        description: 'Read current level, found differences, and completed levels.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true },
        execute: function () {
          return {
            level: current + 1,
            found: progress[current].size,
            totalDifferences: diffCount(current),
            totalLevels: levels.length,
            completed: progress.map(function (_, i) { return isComplete(i) ? i + 1 : null; }).filter(Boolean),
          };
        },
      },
      {
        name: 'spot_choose_level',
        description: 'Choose a level, keeping progress.',
        inputSchema: {
          type: 'object',
          properties: { level: { type: 'integer', minimum: 1, maximum: levels.length } },
          required: ['level'], additionalProperties: false,
        },
        execute: function (input) {
          chooseLevel(input.level - 1);
          return { level: current + 1, found: progress[current].size };
        },
      },
      {
        name: 'spot_show_hint',
        description: 'Temporarily highlight an unfound difference in both pictures without marking it found.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        execute: function () { return showHint(); },
      },
    ].forEach(function (tool) {
      try { Promise.resolve(context.registerTool(tool)).catch(function () {}); } catch (e) {}
    });
  }
})(window.Kid = window.Kid || {});
