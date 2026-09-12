/* 把注音符號畫出來。

   刻意不用字型文字（<span>ㄅ</span>）而是用 data/strokes.js 的輪廓：
     - 字型的注音字形常和教育部標準字體有出入，小朋友在學「怎麼寫」時
       這個差異是有意義的。
     - 描寫關卡的底圖與引導線一定要和判定用的中線來自同一份資料，
       不然看到的形狀和判定的位置會對不起來。
     - 順便讓這一頁不依賴 Google Fonts，離線與 file:// 都正常。 */
(function (Kid) {
  'use strict';

  const Z = Kid.zhuyin;

  /* 純粹把符號畫成一個實心字形。size 只是 CSS 尺寸，
     內部座標永遠是 1024x1024。 */
  function glyph(id, opts) {
    const o = opts || {};
    const strokes = Z.strokesFor(id);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 ' + Z.VIEWBOX + ' ' + Z.VIEWBOX);
    svg.setAttribute('class', 'glyph' + (o.className ? ' ' + o.className : ''));
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', '注音符號 ' + Z.symbol(id).zhuyin);
    if (!strokes) return svg;
    strokes.forEach(function (s) {
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', s.o);
      p.setAttribute('fill', 'currentColor');
      svg.appendChild(p);
    });
    return svg;
  }

  /* 折線轉成 SVG path 字串 */
  function pathOf(points) {
    return 'M' + points.map(function (p) { return p[0] + ' ' + p[1]; }).join('L');
  }

  Z.glyph = glyph;
  Z.pathOf = pathOf;
})(window.Kid = window.Kid || {});
