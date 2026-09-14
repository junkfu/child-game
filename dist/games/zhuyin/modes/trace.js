/* 描寫筆順。

   判定模型：弧長推進，不是「依序通過每個路徑點」。
   後者對 4-5 歲來說會一直失敗 —— 這個年紀的手部控制還不穩，
   拖曳本來就是他們最不擅長的操作。

   怎麼運作：
     - 把手指位置投影到這一筆的中線上，得到「走到弧長多少」。
     - 只記錄 maxS（走過的最遠處），單調不遞減 —— 手抖不會倒退。
     - 落在走廊內（中線兩側 13% 字框）才推進；
       跑出走廊就「停住不動」，這就是判定：偏太多就推不完，得重描。
     - 走到 85% 就算完成，不要求 100%，也不要求碰到每個點。
     - 允許中途放開手指再接上（4 歲一定會放）。
     - 起筆點必須對，這是筆順的重點。

   不會有「失敗」：卡住會先提示，再卡住就用動畫幫他描完，一樣給星星。
   星星只反映描了幾次，不扣分、不倒數、不出現紅色。 */
(function (Kid) {
  'use strict';
  const Z = Kid.zhuyin;
  const NS = 'http://www.w3.org/2000/svg';
  const VB = 1024;

  const CORRIDOR = VB * 0.13;   /* 走廊半徑，320px 的符號約 42px */
  const START_R  = VB * 0.17;   /* 起筆點的容許範圍，稍微寬一點 */
  const DONE_AT  = 0.85;        /* 走到 85% 就算完成 */
  const MAX_JUMP = VB * 0.22;   /* 一次最多前進這麼多，防止直接跳到終點 */
  const HINT_MS  = 8000;
  /* 墨跡用 dash 收合。要注意單寫 stroke-dasharray:len 會被展開成
     「len 實線 + len 空白」，週期是 2*len；配 dashoffset:len 時，
     空白剛好用完在筆畫末端，下一段實線以零長度落在那裡，
     而 stroke-linecap:round 會把它畫成半徑 110 的圓點 ——
     還沒開始描就先有一塊墨（ㄎ ㄓ 特別明顯）。
     把空白設得比筆畫本身長，空白就蓋過整條路徑，實線永遠排不進來。 */
  const GAP_PAD = 24;
  const CIRCLED = ['①', '②', '③', '④', '⑤'];
  const ASSIST_MS = 20000;

  function el(tag, attrs) {
    const n = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }

  /* 折線的累積長度表，投影時要用 */
  function cumulative(pts) {
    const cum = [0];
    for (let i = 1; i < pts.length; i++) {
      cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    }
    return cum;
  }

  /* 把 (x,y) 投影到折線，回傳最近點的距離與弧長位置 */
  function project(pts, cum, x, y) {
    let bestD = Infinity, bestS = 0;
    for (let i = 1; i < pts.length; i++) {
      const x1 = pts[i - 1][0], y1 = pts[i - 1][1];
      const dx = pts[i][0] - x1, dy = pts[i][1] - y1;
      const L2 = dx * dx + dy * dy;
      let t = L2 ? ((x - x1) * dx + (y - y1) * dy) / L2 : 0;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const d = Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
      if (d < bestD) { bestD = d; bestS = cum[i - 1] + t * Math.sqrt(L2); }
    }
    return { d: bestD, s: bestS };
  }

  function build(ctx) {
    return ctx.symbols.map(function (s) { return { mode: 'trace', symbol: s.id }; });
  }

  function render(q, host, done) {
    const strokes = Z.strokesFor(q.symbol);
    const sym = Z.symbol(q.symbol);
    host.innerHTML = '';

    const wrap = Kid.el('div', 'q trace');
    const hintText = Kid.el('p', 'q-hint', '');
    wrap.appendChild(hintText);

    const stage = Kid.el('div', 'trace-stage');
    const svg = el('svg', { viewBox: '0 0 ' + VB + ' ' + VB, class: 'trace-svg' });
    svg.setAttribute('role', 'application');
    svg.setAttribute('aria-label', '描寫注音符號 ' + sym.zhuyin);

    const defs = el('defs');
    strokes.forEach(function (s, i) {
      const cp = el('clipPath', { id: 'tc' + q.symbol + i });
      cp.appendChild(el('path', { d: s.o }));
      defs.appendChild(cp);
    });
    svg.appendChild(defs);

    /* 灰色底圖：整個符號的形狀 */
    strokes.forEach(function (s) {
      svg.appendChild(el('path', { d: s.o, class: 'trace-base' }));
    });

    /* 墨跡：每一筆用自己的輪廓 clip，描到哪裡就露出到哪裡。
       跟 animCJK 動畫同樣的做法，所以形狀一定對得上。 */
    const inks = strokes.map(function (s, i) {
      const g = el('g', { 'clip-path': 'url(#tc' + q.symbol + i + ')' });
      const p = el('path', { d: Z.pathOf(s.m), class: 'trace-ink' });
      const len = Z.strokeLength(s.m);
      p.style.strokeDasharray = len + ' ' + (len + GAP_PAD);
      p.style.strokeDashoffset = len;
      g.appendChild(p);
      svg.appendChild(g);
      return p;
    });

    const guide = el('path', { class: 'trace-guide' });
    svg.appendChild(guide);
    const startDot = el('circle', { class: 'trace-start', r: 62 });
    svg.appendChild(startDot);
    const startNum = el('text', { class: 'trace-startnum', 'text-anchor': 'middle' });
    svg.appendChild(startNum);

    stage.appendChild(svg);
    wrap.appendChild(stage);

    const bar = Kid.el('div', 'trace-bar');
    const replay = Kid.el('button', 'btn btn-ghost');
    replay.innerHTML = '<span aria-hidden="true">👀</span> 看我畫一次';
    replay.addEventListener('click', function () { demo(); });
    bar.appendChild(replay);
    wrap.appendChild(bar);

    host.appendChild(wrap);

    /* ── 狀態 ─────────────────────────────────────── */
    let idx = 0;            /* 現在描第幾筆 */
    let maxS = 0;           /* 這一筆走到的最遠弧長 */
    let drawing = false;
    let retries = 0;        /* 整個符號總共重描幾次 */
    let stalls = 0;
    let pts, cum, total;
    let hintTimer, assistTimer;

    /* 這個畫面還在不在。換符號或回地圖時 host 會被清空，但 8 秒／20 秒的
       計時器和示範動畫還排在那裡；不擋下來的話，會在別的畫面上跳出
       「我先幫你畫一次」、唸出早就不在畫面上的符號。 */
    function alive() { return svg.isConnected; }

    function loadStroke() {
      const s = strokes[idx];
      pts = s.m;
      cum = cumulative(pts);
      total = cum[cum.length - 1];
      maxS = 0;
      guide.setAttribute('d', Z.pathOf(pts));
      startDot.setAttribute('cx', pts[0][0]);
      startDot.setAttribute('cy', pts[0][1]);
      startNum.setAttribute('x', pts[0][0]);
      startNum.setAttribute('y', pts[0][1] + 30);
      startNum.textContent = idx + 1;
      /* 提示裡的編號要跟著目前這一筆走。寫死 ① 的話，
         描到第二筆時畫面顯示 ② 而字還寫著 ①，孩子會找不到起點。 */
      hintText.textContent = strokes.length > 1
        ? '第 ' + (idx + 1) + ' 筆，從 ' + CIRCLED[idx] + ' 開始描'
        : '跟著虛線描描看，從 ' + CIRCLED[idx] + ' 開始';
      guide.style.display = '';
      startDot.style.display = '';
      startNum.style.display = '';
      paint();
      armTimers();
    }

    function paint() {
      const p = inks[idx];
      const len = Z.strokeLength(strokes[idx].m);
      p.style.strokeDashoffset = Math.max(0, len - maxS);
    }

    function armTimers() {
      clearTimeout(hintTimer); clearTimeout(assistTimer);
      /* 停 8 秒：讓起筆點閃一下當提示。連續卡三次就直接幫忙，
         不用等滿 20 秒 —— 卡三次代表他真的描不動了。 */
      hintTimer = setTimeout(function () {
        if (!alive()) return;
        startDot.classList.add('nudge');
        stalls++;
        if (stalls >= 3) assist();
      }, HINT_MS);
      assistTimer = setTimeout(assist, ASSIST_MS);
    }

    /* 卡太久就幫他描完這一筆，一樣往下走，不當作失敗 */
    function assist() {
      clearTimeout(hintTimer); clearTimeout(assistTimer);
      if (!alive()) return;
      Kid.toast('我先幫你畫一次，換你囉 ♡');
      animateStroke(idx, maxS, function () { retries++; finishStroke(); });
    }

    function animateStroke(i, fromS, cb) {
      const len = Z.strokeLength(strokes[i].m);
      const p = inks[i];
      const t0 = performance.now();
      const dur = 700;
      (function step(now) {
        if (!alive()) return;
        const k = Math.min(1, (now - t0) / dur);
        const s = fromS + (len - fromS) * k;
        p.style.strokeDashoffset = Math.max(0, len - s);
        if (k < 1) requestAnimationFrame(step); else if (cb) cb();
      })(t0);
    }

    /* 「看我畫一次」：把整個符號依筆順示範一遍 */
    function demo() {
      clearTimeout(hintTimer); clearTimeout(assistTimer);
      inks.forEach(function (p, i) {
        if (i >= idx) { p.style.strokeDashoffset = Z.strokeLength(strokes[i].m); }
      });
      let i = idx;
      (function next() {
        if (i >= strokes.length) { loadStroke(); return; }
        const j = i++;
        animateStroke(j, 0, function () {
          if (j >= idx) setTimeout(next, 140);
        });
      })();
    }

    function finishStroke() {
      inks[idx].style.strokeDashoffset = 0;
      Kid.audio.chime('tap');
      idx++;
      if (idx >= strokes.length) return finishSymbol();
      loadStroke();
    }

    function finishSymbol() {
      clearTimeout(hintTimer); clearTimeout(assistTimer);
      guide.style.display = 'none';
      startDot.style.display = 'none';
      startNum.style.display = 'none';
      svg.classList.add('trace-done');
      Kid.audio.chime('right');
      Kid.audio.say('audio/sym/' + q.symbol + '.m4a');
      setTimeout(function () { done(retries === 0); }, 700);
    }

    /* ── 指標事件 ─────────────────────────────────── */
    function toLocal(e) {
      const r = svg.getBoundingClientRect();
      return {
        x: (e.clientX - r.left) / r.width * VB,
        y: (e.clientY - r.top) / r.height * VB,
      };
    }

    svg.addEventListener('pointerdown', function (e) {
      if (idx >= strokes.length) return;
      const p = toLocal(e);
      const hit = project(pts, cum, p.x, p.y);
      const nearStart = Math.hypot(p.x - pts[0][0], p.y - pts[0][1]) <= START_R;
      /* 還沒起步時必須從起筆點開始；描到一半放開手，可以就近接回去 */
      if (maxS === 0 ? !nearStart : hit.d > CORRIDOR) {
        startDot.classList.add('nudge');
        return;
      }
      drawing = true;
      svg.setPointerCapture(e.pointerId);
      startDot.classList.remove('nudge');
      clearTimeout(hintTimer); clearTimeout(assistTimer);
      e.preventDefault();
    });

    svg.addEventListener('pointermove', function (e) {
      if (!drawing) return;
      const p = toLocal(e);
      const hit = project(pts, cum, p.x, p.y);
      /* 跑出走廊就停住不推進 —— 不變色、不出聲、不算錯，只是不前進 */
      if (hit.d > CORRIDOR) return;
      if (hit.s > maxS && hit.s - maxS <= MAX_JUMP) {
        maxS = hit.s;
        paint();
        if (maxS >= total * DONE_AT) { drawing = false; finishStroke(); }
      }
      e.preventDefault();
    });

    function release(e) {
      if (!drawing) return;
      drawing = false;
      try { svg.releasePointerCapture(e.pointerId); } catch (err) {}
      if (maxS < total * DONE_AT) {
        /* 沒描完就放手：留著進度，讓他接回去繼續，不歸零 */
        armTimers();
      }
    }
    svg.addEventListener('pointerup', release);
    svg.addEventListener('pointercancel', release);

    /* 鍵盤/讀螢幕的替代路徑：這個玩法本質上是手部動作練習，
       沒辦法用鍵盤真的「描」，所以提供一鍵示範並通過。 */
    const skip = Kid.el('button', 'btn btn-ghost trace-skip', '用動畫看完這個字');
    skip.addEventListener('click', function () {
      clearTimeout(hintTimer); clearTimeout(assistTimer);
      retries++;
      let i = idx;
      (function next() {
        if (i >= strokes.length) { idx = strokes.length; finishSymbol(); return; }
        animateStroke(i++, 0, function () { setTimeout(next, 140); });
      })();
    });
    bar.appendChild(skip);

    loadStroke();
    announce();

    /* 開場語音。練習串裡每題都唸一次「跟著虛線描描看」；寫字頁換符號很頻繁，
       只在第一次唸指令（announce: false 略過），之後只唸符號本身（sayName），
       小孩才知道自己點到的是哪個音。中途換了符號就不再接下一段。 */
    async function announce() {
      const clips = q.announce === false ? [] : ['audio/ui/trace.m4a'];
      if (q.sayName) clips.push('audio/sym/' + q.symbol + '.m4a');
      for (const clip of clips) {
        if (!alive()) return;
        await Kid.audio.say(clip);
      }
    }
  }

  Z.modes = Z.modes || {};
  Z.modes.trace = { build: build, render: render };
})(window.Kid = window.Kid || {});
