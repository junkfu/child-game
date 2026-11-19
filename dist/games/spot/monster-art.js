/* 口袋怪獸篇的畫圖元件：原創小怪獸 + 場景小物，全部輸出 SVG 字串。

   座標系統：每個場景 viewBox 300 × 200（3:2，和原本的圖集格子一樣）。
   每個元件以「底部中心」為原點，k 是縮放倍數。
   純字串、不碰 DOM，tests/ 可以直接在 node 裡載入。

   怪獸是這個專案原創的造型（圓滾滾的身體、豆豆眼），
   不要畫成任何現有作品的角色。 */
(function (Kid) {
  'use strict';

  const INK = '#3d3348';
  const OL = ' stroke="' + INK + '" stroke-width="1.6" stroke-linejoin="round"';

  function n(v) { return Math.round(v * 10) / 10; }

  /* amt < 0 變暗、> 0 變亮 */
  function shade(hex, amt) {
    const h = hex.replace('#', '');
    return '#' + [0, 2, 4].map(function (i) {
      const v = parseInt(h.substr(i, 2), 16);
      const o = amt < 0 ? v * (1 + amt) : v + (255 - v) * amt;
      return Math.max(0, Math.min(255, Math.round(o))).toString(16).padStart(2, '0');
    }).join('');
  }

  /* ── 基本形狀 ─────────────────────────────────────── */
  function g(x, y, k, inner, extra) {
    return '<g transform="translate(' + n(x) + ' ' + n(y) + ')' + (k && k !== 1 ? ' scale(' + k + ')' : '') + '"' +
      (extra || '') + '>' + inner + '</g>';
  }
  function circ(x, y, r, f, e) { return '<circle cx="' + n(x) + '" cy="' + n(y) + '" r="' + n(r) + '" fill="' + f + '"' + (e || '') + '/>'; }
  function ell(x, y, rx, ry, f, e) {
    return '<ellipse cx="' + n(x) + '" cy="' + n(y) + '" rx="' + n(rx) + '" ry="' + n(ry) + '" fill="' + f + '"' + (e || '') + '/>';
  }
  function rect(x, y, w, h, f, rx, e) {
    return '<rect x="' + n(x) + '" y="' + n(y) + '" width="' + n(w) + '" height="' + n(h) + '"' +
      (rx ? ' rx="' + rx + '"' : '') + ' fill="' + f + '"' + (e || '') + '/>';
  }
  function path(d, f, e) { return '<path d="' + d + '" fill="' + (f || 'none') + '"' + (e || '') + '/>'; }
  function line(x1, y1, x2, y2, c, w) {
    return '<line x1="' + n(x1) + '" y1="' + n(y1) + '" x2="' + n(x2) + '" y2="' + n(y2) + '" stroke="' + c +
      '" stroke-width="' + (w || 2) + '" stroke-linecap="round"/>';
  }
  function stroke(c, w) { return ' stroke="' + c + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"'; }
  function poly(pts, f, e) { return '<polygon points="' + pts.map(n).join(' ') + '" fill="' + f + '"' + (e || '') + '/>'; }

  function starPts(r, inner, spikes) {
    const pts = [], m = spikes || 5;
    for (let i = 0; i < m * 2; i++) {
      const a = Math.PI / m * i - Math.PI / 2, rr = i % 2 ? r * (inner || 0.45) : r;
      pts.push(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    return pts;
  }
  function star(x, y, r, c, e) { return g(x, y, 1, poly(starPts(r), c, e)); }
  /* 以中心為原點的愛心，s 約等於半寬 */
  function heart(x, y, s, c, e) {
    return g(x, y, s / 8, path('M0 7 C-9 0 -9 -7 -4.5 -8 C-2 -8.6 0 -6 0 -4.5 C0 -6 2 -8.6 4.5 -8 C9 -7 9 0 0 7Z', c, e));
  }

  /* ── 原創小怪獸 ───────────────────────────────────
     o.c       身體顏色
     o.shape   round 圓滾滾 / bean 豆子 / drop 水滴
     o.ears    none / round / pointy / horn / bunny / antenna
     o.tip     天線頂端：ball / star；o.tipC 頂端顏色
     o.top     頭上的東西：leaf / flower / bow / cap / crown / party / nightcap / towel / duck
     o.face    open / happy / sleep / wink
     o.mouth   smile / open
     o.pattern none / spots / stripes
     o.wings、o.scarf（顏色）、o.glasses（'round' / 'sun'）、o.tail（curl / puff） */
  function mon(x, y, k, o) {
    const c = o.c, dark = shade(c, -0.25), light = shade(c, 0.5);
    const shape = o.shape || 'round';
    const top = shape === 'round' ? -39 : -44;
    const eY = shape === 'round' ? -23 : shape === 'bean' ? -27 : -18;
    let s = '';

    /* 身體後面：尾巴、翅膀、耳朵 */
    if (o.tail === 'curl') {
      s += path('M15 -9 C29 -8 32 -22 24 -25 C19 -27 17 -21 21 -19', 'none', stroke(INK, 6.4));
      s += path('M15 -9 C29 -8 32 -22 24 -25 C19 -27 17 -21 21 -19', 'none', stroke(c, 3.6));
    }
    if (o.tail === 'puff') s += circ(-19, -8, 6.5, light, OL);
    if (o.wings) {
      [-1, 1].forEach(function (sx) {
        s += ell(sx * 21, -25, 10, 5.5, '#ffffff', OL + ' transform="rotate(' + (sx * -28) + ' ' + sx * 21 + ' -25)"');
      });
    }
    const ears = o.ears || 'none';
    [-1, 1].forEach(function (sx) {
      if (ears === 'round') {
        s += circ(sx * 13, top + 5, 7.5, c, OL) + circ(sx * 13, top + 5, 3.8, shade(c, 0.4));
      } else if (ears === 'pointy') {
        s += path('M' + sx * 17 + ' ' + (top + 12) + ' L' + sx * 14 + ' ' + (top - 9) + ' L' + sx * 4 + ' ' + (top + 3) + 'Z', c, OL);
      } else if (ears === 'horn') {
        s += path('M' + sx * 10 + ' ' + (top + 6) + ' Q' + sx * 12 + ' ' + (top - 7) + ' ' + sx * 5 + ' ' + (top - 10) +
          ' Q' + sx * 7 + ' ' + (top - 1) + ' ' + sx * 3 + ' ' + (top + 4) + 'Z', '#fff0b3', OL);
      } else if (ears === 'bunny') {
        s += ell(sx * 7, top - 7, 4.6, 13, c, OL + ' transform="rotate(' + sx * 12 + ' ' + sx * 7 + ' ' + (top - 7) + ')"');
      }
    });
    if (ears === 'antenna') {
      s += line(0, top + 3, 0, top - 11, INK, 1.8);
      s += o.tip === 'star' ? star(0, top - 14, 6, '#ffd84d', OL) : circ(0, top - 14, 4, o.tipC || '#ffd84d', OL);
    }

    /* 身體 */
    if (shape === 'round') s += ell(0, -20, 20, 19, c, OL);
    else if (shape === 'bean') s += ell(0, -22, 16.5, 22, c, OL);
    else s += path('M0 -44 C10 -32 21 -24 21 -14 C21 -3 12 2 0 2 C-12 2 -21 -3 -21 -14 C-21 -24 -10 -32 0 -44Z', c, OL);
    s += ell(0, shape === 'drop' ? -7 : -11, shape === 'bean' ? 9.5 : 11, 7.5, light);

    if (o.pattern === 'spots') {
      s += circ(-11, eY - 6, 3, dark) + circ(12, eY - 4, 2.4, dark) + circ(-14, eY + 11, 2.2, dark) + circ(14, eY + 12, 2.8, dark);
    } else if (o.pattern === 'stripes') {
      [0, 4, 8].forEach(function (d) {
        s += path('M-7 ' + (top + 5 + d) + ' Q0 ' + (top + 8 + d) + ' 7 ' + (top + 5 + d), 'none', stroke(dark, 2.2));
      });
    }

    /* 臉 */
    function eye(ex, kind) {
      if (kind === 'happy') return path('M' + (ex - 3) + ' ' + (eY + 1) + ' Q' + ex + ' ' + (eY - 3.5) + ' ' + (ex + 3) + ' ' + (eY + 1), 'none', stroke(INK, 1.8));
      if (kind === 'sleep') return path('M' + (ex - 3) + ' ' + eY + ' Q' + ex + ' ' + (eY + 3) + ' ' + (ex + 3) + ' ' + eY, 'none', stroke(INK, 1.8));
      return circ(ex, eY, 3.1, INK) + circ(ex + 1, eY - 1.1, 1.1, '#fff');
    }
    const face = o.face || 'open';
    s += eye(-7, face === 'wink' ? 'open' : face) + eye(7, face === 'wink' ? 'happy' : face);
    s += ell(-12, eY + 5, 3.2, 1.9, '#ff8fa8', ' opacity=".6"') + ell(12, eY + 5, 3.2, 1.9, '#ff8fa8', ' opacity=".6"');
    const m = eY + 6;
    s += o.mouth === 'open'
      ? ell(0, m + 1.5, 3.2, 3.4, INK) + ell(0, m + 3, 2, 1.3, '#ff7f9a')
      : path('M-3.5 ' + m + ' Q0 ' + (m + 3.5) + ' 3.5 ' + m, 'none', stroke(INK, 1.6));

    if (o.glasses === 'round') {
      s += circ(-7, eY, 5.5, 'none', stroke(INK, 1.5)) + circ(7, eY, 5.5, 'none', stroke(INK, 1.5)) + line(-1.5, eY, 1.5, eY, INK, 1.5);
    } else if (o.glasses === 'sun') {
      s += ell(-7, eY, 6, 4.5, INK) + ell(7, eY, 6, 4.5, INK) + line(-2, eY - 1, 2, eY - 1, INK, 2);
    }
    if (o.scarf) {
      const sy = shape === 'round' ? -9 : shape === 'bean' ? -11 : -7;
      s += rect(-17, sy - 3.5, 34, 7, o.scarf, 3.5, OL) + rect(6, sy, 6.5, 12, o.scarf, 2.5, OL);
      if (o.scarfStripes) s += line(-10, sy - 3, -10, sy + 3, '#fff', 2) + line(-2, sy - 3, -2, sy + 3, '#fff', 2) + line(7, sy + 5, 12, sy + 5, '#fff', 2);
    }

    /* 頭上 */
    const t = top;
    switch (o.top) {
      case 'leaf':
        s += path('M0 ' + (t + 3) + ' C-3 ' + (t - 9) + ' 5 ' + (t - 15) + ' 13 ' + (t - 13) + ' C11 ' + (t - 4) + ' 5 ' + (t) + ' 0 ' + (t + 3) + 'Z', '#5fbf5a', OL);
        break;
      case 'flower':
        for (let i = 0; i < 5; i++) {
          const a = i / 5 * Math.PI * 2;
          s += circ(Math.cos(a) * 4.6, t - 5 + Math.sin(a) * 4.6, 3.6, '#ff8fb8', OL);
        }
        s += circ(0, t - 5, 2.8, '#ffd84d');
        break;
      case 'bow':
        s += path('M0 ' + (t + 1) + ' L-10 ' + (t - 6) + ' L-10 ' + (t + 7) + 'Z', '#ff6f9f', OL) +
          path('M0 ' + (t + 1) + ' L10 ' + (t - 6) + ' L10 ' + (t + 7) + 'Z', '#ff6f9f', OL) + circ(0, t + 1, 3, '#ff9fc0', OL);
        break;
      case 'cap':
        s += path('M-13 ' + (t + 8) + ' Q-13 ' + (t - 6) + ' 0 ' + (t - 6) + ' Q13 ' + (t - 6) + ' 13 ' + (t + 8) + 'Z', o.capC || '#ff6b5b', OL) +
          rect(4, t + 5, 17, 4, o.capC || '#ff6b5b', 2, OL);
        break;
      case 'crown':
        s += poly([-11, t + 5, -12, t - 8, -5, t - 2, 0, t - 11, 5, t - 2, 12, t - 8, 11, t + 5], '#ffcf3d', OL) + circ(0, t - 1, 1.8, '#ff6f9f');
        break;
      case 'party':
        s += poly([-8, t + 4, 0, t - 18, 8, t + 4], '#7ec8ff', OL) + line(-4, t - 4, 4, t - 6, '#fff', 2) + circ(0, t - 19, 3, '#ffd84d', OL);
        break;
      case 'nightcap':
        s += path('M-14 ' + (t + 7) + ' Q-10 ' + (t - 10) + ' 6 ' + (t - 14) + ' Q20 ' + (t - 16) + ' 24 ' + (t - 4) + ' Q12 ' + (t - 6) + ' 14 ' + (t + 7) + 'Z', '#8f7ef0', OL) +
          circ(24, t - 3, 4, '#fff', OL);
        break;
      case 'towel':
        s += rect(-12, t - 3, 24, 9, '#ffffff', 4, OL) + line(-6, t - 2, -6, t + 5, '#7cc6ff', 2.2) + line(4, t - 2, 4, t + 5, '#7cc6ff', 2.2);
        break;
      case 'duck':
        s += ell(0, t - 4, 8, 6, '#ffd84d', OL) + circ(5, t - 10, 4.5, '#ffd84d', OL) + path('M9 ' + (t - 10) + ' l5 1.5 l-5 1.5Z', '#ff9a3d') + circ(6, t - 11, 1, INK);
        break;
    }

    /* 腳 */
    s += ell(-8, 0, 6.5, 3.4, dark, OL) + ell(8, 0, 6.5, 3.4, dark, OL);
    return g(x, y, k, s);
  }

  /* ── 場景小物（以底部中心為原點）──────────────────── */
  const art = {
    tree: function (x, y, k, o) {
      o = o || {};
      const c = o.c || '#6cc35a';
      let s = rect(-3.5, -24, 7, 24, '#a8754f', 2);
      s += circ(0, -38, 16, c) + circ(-12, -28, 11, c) + circ(12, -28, 11, c);
      if (o.fruit) s += circ(-8, -40, 3.2, o.fruit) + circ(7, -33, 3.2, o.fruit) + circ(-12, -26, 3.2, o.fruit) + circ(10, -45, 3.2, o.fruit) + circ(13, -25, 3.2, o.fruit);
      return g(x, y, k, s);
    },
    pine: function (x, y, k, o) {
      o = o || {};
      const c = o.c || '#3f9d6a';
      let s = rect(-3, -10, 6, 10, '#946446', 1);
      s += poly([0, -30, -17, -8, 17, -8], c) + poly([0, -44, -14, -22, 14, -22], c) + poly([0, -56, -10, -36, 10, -36], c);
      if (o.snow) s += poly([0, -56, -5, -46, 0, -48, 5, -46], '#fff') + poly([0, -44, -7, -32, 7, -32], '#fff', ' opacity=".9"') + poly([-17, -8, -10, -14, 17, -8], '#fff', ' opacity=".85"');
      if (o.star) s += star(0, -58, 6, '#ffd84d', OL);
      return g(x, y, k, s);
    },
    cloud: function (x, y, k, shape) {
      if (shape === 'heart') return heart(x, y, 15 * k, '#ffffff');
      return g(x, y, k, ell(0, 0, 18, 8, '#fff') + circ(-8, -5, 9, '#fff') + circ(6, -7, 11, '#fff'));
    },
    sun: function (x, y, r, face) {
      let s = '';
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * Math.PI * 2;
        s += line(Math.cos(a) * (r + 3), Math.sin(a) * (r + 3), Math.cos(a) * (r + 8), Math.sin(a) * (r + 8), '#ffc93d', 2.5);
      }
      s += circ(0, 0, r, '#ffd84d');
      if (face) s += circ(-r * 0.35, -r * 0.15, r * 0.12, INK) + circ(r * 0.35, -r * 0.15, r * 0.12, INK) +
        path('M' + n(-r * 0.35) + ' ' + n(r * 0.25) + ' Q0 ' + n(r * 0.6) + ' ' + n(r * 0.35) + ' ' + n(r * 0.25), 'none', stroke(INK, 1.6));
      return g(x, y, 1, s);
    },
    moon: function (x, y, r, full) {
      if (full) return g(x, y, 1, circ(0, 0, r, '#fff1b0') + circ(-r * 0.3, -r * 0.2, r * 0.18, '#f0dd8c') + circ(r * 0.3, r * 0.3, r * 0.13, '#f0dd8c'));
      return g(x, y, 1, path('M0 ' + -r + ' A' + r + ' ' + r + ' 0 1 0 0 ' + r + ' A' + n(r * 0.72) + ' ' + r + ' 0 1 1 0 ' + -r + 'Z', '#fff1b0'));
    },
    flower: function (x, y, k, c) {
      let s = line(0, 0, 0, -14, '#4fa84a', 2);
      for (let i = 0; i < 5; i++) {
        const a = i / 5 * Math.PI * 2 - Math.PI / 2;
        s += circ(Math.cos(a) * 4.2, -16 + Math.sin(a) * 4.2, 3.4, c);
      }
      return g(x, y, k, s + circ(0, -16, 2.6, '#ffd84d'));
    },
    mushroom: function (x, y, k, c, dots) {
      let s = rect(-4, -10, 8, 10, '#fff4e0', 3) + path('M-13 -9 Q-13 -24 0 -24 Q13 -24 13 -9Z', c);
      if (dots !== false) s += circ(-6, -16, 2.4, '#fff') + circ(5, -19, 2, '#fff') + circ(7, -12, 1.6, '#fff');
      return g(x, y, k, s);
    },
    rock: function (x, y, k, c) {
      return g(x, y, k, path('M-14 0 Q-16 -10 -6 -13 Q2 -18 10 -11 Q16 -6 14 0Z', c || '#b9b2c4'));
    },
    snail: function (x, y, k) {
      return g(x, y, k, path('M-14 0 Q-14 -4 -8 -4 L10 -4 Q16 -4 16 0Z', '#ffd9a0') + circ(-1, -11, 9, '#e99a6b') +
        path('M-1 -11 m-5 0 a5 5 0 1 1 5 5', 'none', stroke('#b86a44', 1.6)) + line(12, -4, 14, -12, INK, 1.2) + line(14, -4, 18, -11, INK, 1.2));
    },
    butterfly: function (x, y, k, c) {
      return g(x, y, k, ell(-5, -3, 5, 6, c) + ell(5, -3, 5, 6, c) + ell(-4, 4, 3.5, 4, c) + ell(4, 4, 3.5, 4, c) + rect(-1, -6, 2, 12, INK, 1));
    },
    bee: function (x, y, k) {
      return g(x, y, k, ell(-3, -7, 4, 5, '#ffffff', ' opacity=".85"') + ell(3, -7, 4, 5, '#ffffff', ' opacity=".85"') +
        ell(0, 0, 8, 5.5, '#ffd84d') + rect(-3, -5, 2.4, 10, INK) + rect(2, -5, 2.4, 10, INK) + circ(6, -1, 1, INK));
    },
    bird: function (x, y, k, c) {
      return g(x, y, k, ell(0, 0, 7, 5.5, c || '#7ec8ff') + circ(5, -3, 3.8, c || '#7ec8ff') + path('M8.5 -3.5 l4 1.2 l-4 1.2Z', '#ff9a3d') +
        circ(6, -4, 0.9, INK) + path('M-3 -2 Q-8 -9 -1 -5Z', shade(c || '#7ec8ff', -0.2)));
    },
    gull: function (x, y, k) { return g(x, y, k, path('M-9 0 Q-4.5 -6 0 0 Q4.5 -6 9 0', 'none', stroke(INK, 1.6))); },
    fence: function (x1, x2, y, c) {
      let s = rect(x1, y - 11, x2 - x1, 3, c || '#f3dcc0') + rect(x1, y - 5, x2 - x1, 3, c || '#f3dcc0');
      for (let x = x1 + 3; x < x2; x += 12) s += path('M' + x + ' ' + y + ' v-16 l3 -3 l3 3 v16Z', c || '#f3dcc0');
      return s;
    },
    tent: function (x, y, k, c, o) {
      o = o || {};
      let s = poly([-26, 0, 0, -38, 26, 0], c) + poly([-7, 0, 0, -12, 7, 0], shade(c, -0.35));
      if (o.stripes) s += poly([-17, -13, 0, -38, -12, -13], '#fff', ' opacity=".55"') + poly([12, -13, 0, -38, 17, -13], '#fff', ' opacity=".55"');
      if (o.flag) s += line(0, -38, 0, -50, INK, 1.4) + poly([0, -50, 10, -46.5, 0, -43], '#ff6f9f');
      return g(x, y, k, s);
    },
    campfire: function (x, y, k, pot) {
      let s = rect(-12, -4, 24, 4, '#8a5a3c', 2) + path('M-8 -3 Q-9 -14 0 -22 Q9 -14 8 -3Z', '#ff8a3d') + path('M-4 -3 Q-4 -10 0 -14 Q4 -10 4 -3Z', '#ffd84d');
      if (pot) s += line(-14, -30, 14, -30, INK, 1.6) + line(0, -30, 0, -26, INK, 1.4) + path('M-8 -26 h16 v6 q0 5 -8 5 q-8 0 -8 -5Z', '#6b6f8a');
      return g(x, y, k, s);
    },
    log: function (x, y, k) {
      return g(x, y, k, rect(-16, -8, 32, 8, '#a8754f', 4) + ell(14, -4, 3.2, 4, '#e6c39a'));
    },
    lantern: function (x, y, k, c) {
      return g(x, y, k, line(0, -6, 0, 0, INK, 1.2) + rect(-5, -2, 10, 3, INK, 1) + rect(-6, 1, 12, 13, c, 5) + rect(-5, 13, 10, 3, INK, 1));
    },
    house: function (x, y, k, o) {
      let s = rect(-22, -30, 44, 30, o.wall || '#ffe8c7');
      s += o.roof === 'dome' ? path('M-26 -29 Q0 -64 26 -29Z', o.roofC || '#ff8a7a') : poly([-27, -29, 0, -52, 27, -29], o.roofC || '#ff8a7a');
      s += rect(-6, -18, 12, 18, o.door || '#b8835a', 3);
      const wc = o.winC || '#bfe6ff';
      s += o.win === 'round' ? circ(-14, -19, 5.5, wc) + circ(14, -19, 5.5, wc) : rect(-19.5, -24, 11, 10, wc, 1.5) + rect(8.5, -24, 11, 10, wc, 1.5);
      if (o.box) s += rect(7, -13.5, 14, 3.5, '#a8754f', 1) + circ(10, -15, 2, '#ff6f9f') + circ(14, -15.5, 2, '#ffd84d') + circ(18, -15, 2, '#ff6f9f');
      if (o.chimney) s += rect(10, -50, 7, 14, '#c4776a');
      if (o.smoke) s += circ(14, -55, 3.5, '#eef0f4') + circ(18, -61, 4.5, '#eef0f4') + circ(14, -68, 5, '#eef0f4');
      return g(x, y, k, s);
    },
    umbrella: function (x, y, k, c, pattern) {
      let s = line(0, 0, 0, -36, '#8a5a3c', 2.2) + path('M-24 -32 Q0 -56 24 -32Z', c);
      if (pattern === 'stripe') s += path('M-8 -32 Q-6 -46 0 -45 Q-2 -40 -1 -32Z', '#fff') + path('M8 -32 Q10 -40 15 -42 Q19 -38 17 -32Z', '#fff');
      else s += circ(-12, -37, 2.6, '#fff') + circ(0, -43, 2.6, '#fff') + circ(12, -37, 2.6, '#fff');
      return g(x, y, k, s);
    },
    sandcastle: function (x, y, k, flag) {
      let s = rect(-16, -14, 32, 14, '#f0c987') + rect(-10, -24, 20, 10, '#f0c987') + rect(-16, -18, 5, 4, '#f0c987') + rect(11, -18, 5, 4, '#f0c987') +
        rect(-3, -9, 6, 9, '#d9a95e', 3) + line(0, -24, 0, -36, INK, 1.2);
      s += flag === 'star' ? star(5, -33, 5, '#ff6f9f') : poly([0, -36, 9, -33, 0, -30], '#ff6f9f');
      return g(x, y, k, s);
    },
    boat: function (x, y, k, c) {
      return g(x, y, k, path('M-16 -6 h32 l-5 6 h-22Z', '#a8754f') + line(0, -6, 0, -30, INK, 1.4) + poly([1, -30, 1, -8, 16, -8], c || '#fff'));
    },
    whale: function (x, y, k) {
      return g(x, y, k, path('M-18 -2 Q-18 -16 0 -16 Q14 -16 16 -6 L24 -12 L22 -2Z', '#6fa8ff') + circ(-9, -9, 1.4, INK) +
        path('M-6 -16 q-2 -6 -6 -8 M-6 -16 q2 -6 6 -8', 'none', stroke('#9fd3ff', 1.6)));
    },
    shell: function (x, y, k) {
      return g(x, y, k, path('M-8 0 Q-9 -10 0 -12 Q9 -10 8 0Z', '#ffc0cf') + line(0, -11, 0, -1, '#ff8fa8', 1) + line(-4, -10, -3, -1, '#ff8fa8', 1) + line(4, -10, 3, -1, '#ff8fa8', 1));
    },
    starfish: function (x, y, k, c) { return star(x, y - 7 * k, 8 * k, c || '#ff9a5a'); },
    ring: function (x, y, k, c) {
      return g(x, y, k, ell(0, -6, 15, 6.5, c) + ell(0, -6.5, 6.5, 2.6, '#7cc6ff') + rect(-3, -12.5, 6, 13, '#fff', 0, ' opacity=".8"'));
    },
    bucket: function (x, y, k, c) {
      return g(x, y, k, path('M-7 -13 h14 l-2 13 h-10Z', c) + path('M-7 -13 Q0 -22 7 -13', 'none', stroke(INK, 1.2)));
    },
    palm: function (x, y, k, coco) {
      let s = path('M-2 0 Q-4 -24 2 -44 L5 -43 Q0 -24 3 0Z', '#b8835a');
      [[-1, -1], [1, -1], [-1, 0.2], [1, 0.2]].forEach(function (d) {
        s += path('M3 -44 Q' + (3 + d[0] * 12) + ' ' + (-54 + d[1] * 4) + ' ' + (3 + d[0] * 24) + ' ' + (-40 + d[1] * 6), 'none', stroke('#4fb35a', 4));
      });
      if (coco) s += circ(0, -40, 3.4, '#8a5a3c') + circ(6, -39, 3.4, '#8a5a3c');
      return g(x, y, k, s);
    },
    snowman: function (x, y, k, o) {
      o = o || {};
      let s = circ(0, -10, 11, '#fff', OL) + circ(0, -28, 8, '#fff', OL) + circ(-2.8, -30, 1.2, INK) + circ(2.8, -30, 1.2, INK) +
        poly([0, -28, 7, -26.5, 0, -25.5], '#ff9a3d') + circ(0, -14, 1.3, INK) + circ(0, -8, 1.3, INK);
      s += line(-10, -16, -20, -22, '#8a5a3c', 1.6);
      if (o.arms !== 1) s += line(10, -16, 20, -22, '#8a5a3c', 1.6);
      s += o.hat === 'bucket' ? path('M-7 -35 h14 l-2 -10 h-10Z', '#ff6f6f', OL) : rect(-8, -37, 16, 2.5, INK) + rect(-5.5, -46, 11, 9.5, INK);
      return g(x, y, k, s);
    },
    igloo: function (x, y, k, door) {
      let s = path('M-26 0 Q-26 -28 0 -28 Q26 -28 26 0Z', '#f4fbff', OL) + path('M-24 -9 H24 M-21 -18 H21', 'none', stroke('#cfe3f2', 1.2));
      s += door === 'square' ? rect(-7, -13, 14, 13, '#6d87a6') : path('M-8 0 V-6 Q-8 -14 0 -14 Q8 -14 8 -6 V0Z', '#6d87a6');
      return g(x, y, k, s);
    },
    sled: function (x, y, k, c) {
      return g(x, y, k, rect(-16, -9, 32, 5, c, 2) + path('M-16 -1 H14 Q20 -1 20 -6', 'none', stroke(INK, 1.6)) + line(-10, -4, -10, -1, INK, 1.4) + line(8, -4, 8, -1, INK, 1.4));
    },
    snowflake: function (x, y, r) {
      let s = '';
      for (let i = 0; i < 3; i++) {
        const a = i / 3 * Math.PI;
        s += line(Math.cos(a) * r, Math.sin(a) * r, -Math.cos(a) * r, -Math.sin(a) * r, '#fff', 1.6);
      }
      return g(x, y, 1, s);
    },
    steam: function (x, y, k, isHeart) {
      if (isHeart) return heart(x, y - 10 * k, 8 * k, '#ffffff', ' opacity=".9"');
      return g(x, y, k, path('M0 0 Q-6 -5 0 -10 Q6 -15 0 -20', 'none', stroke('#ffffff', 2.6) + ' opacity=".9"'));
    },
    sign: function (x, y, k, round) {
      return g(x, y, k, rect(-1.6, -22, 3.2, 22, '#8a5a3c') + (round ? circ(0, -26, 10, '#ffe0a8', OL) : rect(-12, -34, 24, 15, '#ffe0a8', 2, OL)) +
        path('M-5 ' + (round ? -27 : -27) + ' Q0 -31 5 -27', 'none', stroke('#e88a3d', 2)));
    },
    crystal: function (x, y, k, c, shape) {
      if (shape === 'gem') return g(x, y, k, poly([-9, -14, -5, -20, 5, -20, 9, -14, 0, 0], c) + poly([-5, -20, 0, -14, 5, -20], '#fff', ' opacity=".45"'));
      return g(x, y, k, poly([-6, 0, -7, -18, 0, -30, 7, -18, 6, 0], c) + poly([0, -30, 0, 0, -6, 0, -7, -18], '#fff', ' opacity=".3"'));
    },
    chest: function (x, y, k, open) {
      let s = rect(-14, -14, 28, 14, '#b8835a', 2) + rect(-14, -9, 28, 2.5, '#ffcf3d');
      s += open
        ? path('M-14 -14 L-12 -26 H12 L14 -14Z', '#9a6a45') + circ(-5, -16, 3, '#ffcf3d') + circ(1, -17, 3, '#ffcf3d') + circ(6, -16, 3, '#ffcf3d')
        : path('M-14 -14 Q0 -24 14 -14Z', '#9a6a45') + rect(-2, -16, 4, 5, '#ffcf3d', 1);
      return g(x, y, k, s);
    },
    bat: function (x, y, k) {
      return g(x, y, k, path('M0 0 Q-6 -6 -14 -3 Q-10 0 -11 4 Q-6 1 0 4 Q6 1 11 4 Q10 0 14 -3 Q6 -6 0 0Z', '#241a36') + circ(-1.6, -1, 0.9, '#ffd84d') + circ(1.6, -1, 0.9, '#ffd84d'));
    },
    firefly: function (x, y, k) {
      return g(x, y, k, circ(0, 0, 8, '#fff7a0', ' opacity=".35"') + circ(0, 0, 3.5, '#fff27a') + ell(-3, -3, 2.5, 1.6, '#fff', ' opacity=".7"'));
    },
    stalactite: function (x, y, k, c) { return g(x, y, k, poly([-6, 0, 0, 22, 6, 0], c || '#5d4a86')); },
    egg: function (x, y, k, c, pattern) {
      let s = path('M0 -24 C9 -24 12 -10 12 -6 C12 1 6 0 0 0 C-6 0 -12 1 -12 -6 C-12 -10 -9 -24 0 -24Z', c || '#fff8ec', OL);
      if (pattern === 'zig') s += path('M-11 -10 l4 -4 l4 4 l4 -4 l4 4 l4 -4', 'none', stroke('#7ec8ff', 1.8));
      else s += circ(-4, -15, 2.2, '#7ec8ff') + circ(4, -8, 2.6, '#7ec8ff');
      return g(x, y, k, s);
    },
    rainbow: function (x, y, r, colors) {
      let s = '';
      (colors || ['#ff8a8a', '#ffcf6b', '#9be07a', '#7ec8ff']).forEach(function (c, i) {
        const rr = r - i * 5;
        s += path('M' + -rr + ' 0 A' + rr + ' ' + rr + ' 0 0 1 ' + rr + ' 0', 'none', ' stroke="' + c + '" stroke-width="5"');
      });
      return g(x, y, 1, s);
    },
    balloon: function (x, y, k, c, shape) {
      const body = shape === 'heart' ? heart(0, -28, 9, c) : ell(0, -28, 8, 10, c);
      return g(x, y, k, path('M0 -18 Q-3 -10 0 -4 Q3 2 0 6', 'none', stroke(INK, 1)) + body + ell(-3, -31, 2, 3, '#fff', ' opacity=".5"'));
    },
    kite: function (x, y, k, c, bows) {
      let s = poly([0, -16, 10, 0, 0, 18, -10, 0], c) + line(0, -16, 0, 18, '#fff', 1) + line(-10, 0, 10, 0, '#fff', 1) + path('M0 18 Q-6 26 2 32 Q8 38 2 44', 'none', stroke(INK, 1));
      if (bows) s += poly([-4, 25, 0, 27, -4, 29], '#ff6f9f') + poly([8, 34, 4, 36, 8, 38], '#ffd84d') + poly([-1, 42, 3, 44, -1, 46], '#7ec8ff');
      return g(x, y, k, s);
    },
    plane: function (x, y, k) {
      return g(x, y, k, poly([-14, 0, 14, -6, -4, 6], '#ffffff', OL) + line(-4, 6, 14, -6, INK, 1));
    },
    owl: function (x, y, k) {
      return g(x, y, k, ell(0, -10, 9, 11, '#a8754f') + poly([-8, -18, -6, -24, -3, -19], '#a8754f') + poly([8, -18, 6, -24, 3, -19], '#a8754f') +
        circ(-3.5, -13, 3.4, '#fff') + circ(3.5, -13, 3.4, '#fff') + circ(-3.5, -13, 1.5, INK) + circ(3.5, -13, 1.5, INK) + poly([-1.5, -9, 1.5, -9, 0, -6], '#ffb347'));
    },
    cat: function (x, y, k) {
      return g(x, y, k, ell(0, -8, 9, 8, '#ffb37a') + circ(0, -18, 7, '#ffb37a') + poly([-6, -22, -5, -29, -1, -24], '#ffb37a') + poly([6, -22, 5, -29, 1, -24], '#ffb37a') +
        path('M-4 -18 q1 -1.5 2 0 M2 -18 q1 -1.5 2 0', 'none', stroke(INK, 1.1)) + path('M8 -4 Q16 -6 14 -14', 'none', stroke('#ffb37a', 3)));
    },
    lamp: function (x, y, k, shape) {
      return g(x, y, k, rect(-1.6, -40, 3.2, 40, '#5b6b84') + rect(-5, -2, 10, 2, '#5b6b84') +
        (shape === 'star' ? star(0, -45, 8, '#ffe27a', OL) : circ(0, -45, 6, '#ffe27a', OL)));
    },
    mailbox: function (x, y, k) {
      return g(x, y, k, rect(-1.5, -14, 3, 14, '#8a5a3c') + path('M-8 -14 V-24 Q-8 -30 0 -30 Q8 -30 8 -24 V-14Z', '#5b8de0') + rect(8, -28, 2, 8, '#ff6b5b'));
    },
    hydrant: function (x, y, k) {
      return g(x, y, k, rect(-6, -16, 12, 16, '#ff6b5b', 2) + path('M-6 -16 Q0 -24 6 -16Z', '#ff6b5b') + rect(-9, -12, 18, 4, '#e0503f', 2));
    },
    cone: function (x, y, k) { return g(x, y, k, poly([-7, 0, 0, -18, 7, 0], '#ff9a3d') + rect(-4, -9, 8, 2.6, '#fff')); },
    ball: function (x, y, k, c) { return g(x, y, k, circ(0, -7, 7, c || '#7ec8ff') + path('M-7 -7 Q0 -3 7 -7', 'none', stroke('#fff', 1.6))); },
    awning: function (x, y, w, c1, c2) {
      let s = '';
      const m = Math.round(w / 8);
      for (let i = 0; i < m; i++) s += path('M' + (x + i * w / m) + ' ' + y + ' h' + n(w / m) + ' v8 q' + n(-w / m / 2) + ' 5 ' + n(-w / m) + ' 0Z', i % 2 ? c2 : c1);
      return s;
    },
    bunting: function (x1, x2, y, shapes, colors) {
      let s = path('M' + x1 + ' ' + y + ' Q' + (x1 + x2) / 2 + ' ' + (y + 10) + ' ' + x2 + ' ' + y, 'none', stroke(INK, 1));
      const count = shapes.length;
      shapes.forEach(function (sh, i) {
        const t = (i + 0.5) / count, fx = x1 + (x2 - x1) * t, fy = y + 20 * t * (1 - t) + 1;
        const c = colors[i % colors.length];
        s += sh === 'heart' ? heart(fx, fy + 6, 6, c) : poly([fx - 6, fy, fx + 6, fy, fx, fy + 12], c);
      });
      return s;
    },
    cake: function (x, y, k, candles) {
      let s = rect(-20, -16, 40, 16, '#ffd1e0', 3) + rect(-15, -28, 30, 12, '#fff4e0', 3) + path('M-20 -12 q5 4 10 0 q5 4 10 0 q5 4 10 0 q5 4 10 0', 'none', stroke('#ff8fb8', 2));
      const xs = candles === 4 ? [-10, -3.5, 3.5, 10] : [-8, 0, 8];
      xs.forEach(function (cx) { s += rect(cx - 1.4, -36, 2.8, 8, '#7ec8ff') + ell(cx, -38, 1.6, 2.6, '#ffb347'); });
      return g(x, y, k, s);
    },
    gift: function (x, y, k, c, rib) {
      return g(x, y, k, rect(-10, -18, 20, 18, c, 2) + rect(-2, -18, 4, 18, rib) + rect(-12, -21, 24, 5, c, 1.5) +
        path('M0 -21 q-8 -8 -8 -2 q0 3 8 2 q8 1 8 -2 q0 -6 -8 2', rib));
    },
    bear: function (x, y, k) {
      return g(x, y, k, ell(0, -9, 9, 9, '#c99a6e') + circ(0, -22, 8, '#c99a6e') + circ(-6, -28, 3.2, '#c99a6e') + circ(6, -28, 3.2, '#c99a6e') +
        circ(-3, -23, 1.1, INK) + circ(3, -23, 1.1, INK) + ell(0, -19, 3, 2, '#f0d5b8'));
    },
    note: function (x, y, k, c) {
      return g(x, y, k, ell(-3, 0, 4, 3, c || INK) + rect(0, -16, 1.8, 16, c || INK) + path('M0 -16 q6 2 6 8', 'none', stroke(c || INK, 2)));
    },
    saturn: function (x, y, r) {
      return g(x, y, 1, circ(0, 0, r, '#ffcf8a') + ell(0, 0, r * 1.8, r * 0.45, 'none', ' stroke="#ffe7b8" stroke-width="2" transform="rotate(-18)"'));
    },
    shooting: function (x, y, k) {
      return g(x, y, k, line(-22, 9, -4, 1, '#fff6c8', 2) + line(-18, 13, -4, 3, '#fff6c8', 1.2) + star(0, 0, 6, '#fff1a8'));
    },
    candle: function (x, y, k) {
      return g(x, y, k, rect(-3, -12, 6, 12, '#fff4e0', 1.5) + ell(0, -15, 2, 3.2, '#ffb347') + ell(0, 0, 7, 2, '#c9b8a0'));
    },
    duck: function (x, y, k) {
      return g(x, y, k, ell(0, -4, 8, 5, '#ffd84d') + circ(5, -10, 4.5, '#ffd84d') + path('M9 -10 l5 1.5 l-5 1.5Z', '#ff9a3d') + circ(6, -11, 1, INK));
    },
    bucketWood: function (x, y, k, c) {
      return g(x, y, k, path('M-8 -12 h16 l-2 12 h-12Z', c || '#d9a066') + line(-7, -8, 7, -8, '#8a5a3c', 1.4));
    },
    bush: function (x, y, k, c) { return g(x, y, k, circ(-8, -7, 8, c || '#5fb35a') + circ(4, -9, 10, c || '#5fb35a') + circ(13, -6, 7, c || '#5fb35a')); },
    bamboo: function (x, y, h, c) {
      let s = '';
      for (let i = 0; i < 6; i++) s += rect(x + i * 7, y - h, 6, h, c, 2) + rect(x + i * 7, y - h * 0.55, 6, 1.6, shade(c, -0.25));
      return s;
    },
    sparkle: function (x, y, r, c) { return star(x, y, r, c || '#fff6c8', '') ; },
    tulip: function (x, y, k, c) {
      return g(x, y, k, line(0, 0, 0, -12, '#4fa84a', 2) + path('M-5 -12 V-20 L-2.5 -17 L0 -21 L2.5 -17 L5 -20 V-12 Q0 -9 -5 -12Z', c));
    },
    flag: function (x, y, k, c) { return g(x, y, k, line(0, 0, 0, -26, INK, 1.4) + poly([0, -26, 12, -22, 0, -18], c)); },
    disco: function (x, y, r) {
      return g(x, y, 1, line(0, -r - 10, 0, -r, INK, 1) + circ(0, 0, r, '#c9d3e6') + path('M' + -r + ' 0 H' + r + ' M0 ' + -r + ' V' + r, 'none', stroke('#fff', 1)) + circ(-r * 0.4, -r * 0.4, r * 0.2, '#fff'));
    },
  };

  Kid.monsterArt = {
    INK: INK, n: n, shade: shade, g: g, circ: circ, ell: ell, rect: rect, path: path, line: line, poly: poly,
    star: star, heart: heart, stroke: stroke, mon: mon, art: art,
  };
})(window.Kid = window.Kid || {});
