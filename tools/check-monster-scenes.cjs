/* 檢查口袋怪獸篇的 10 個 SVG 場景：答案圈和實際畫面對不對得上。

   做法：對每個「不同」，把它單獨換成 B 版，和全 A 版的圖逐點比對，
   找出它真正改到的像素，然後確認：
     1. 有改到東西（不然 B 圖看不出來）
     2. 改到的像素都在它自己的答案圈裡（不然小朋友點了沒反應）
     3. 不會改到別的答案圈裡（兩個答案疊在一起會搶判定）
   有問題的會印出建議的範圍 [cx, cy, rx, ry]（viewBox 單位）。

   需要 Playwright（全域安裝即可）：
     NODE_PATH=$(npm root -g) node tools/check-monster-scenes.cjs */
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '../dist/games/spot');
const SCALE = 2;          /* 600 × 400 算繪，抗鋸齒邊緣比較不會誤判 */
const SLACK = 1.5;        /* 允許超出答案圈的距離（viewBox 單位） */
/* 邊緣抗鋸齒和細線難免擦到一點；這麼少的點（2 倍算繪下約 3 × 3 單位）點不到也沒關係。
   重疊時點擊判定會挑距離最近的答案，所以小重疊不會搶錯題。 */
const MAX_OUTSIDE = 20;
const MAX_INTRUDE = 40;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent('<!doctype html><body></body>');
  await page.addScriptTag({ path: path.join(root, 'monster-art.js') });
  await page.addScriptTag({ path: path.join(root, 'monster-scenes.js') });

  const report = await page.evaluate(async ({ SCALE, SLACK }) => {
    const pack = window.Kid.spotPack;
    const W = 300 * SCALE, H = 200 * SCALE;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    async function pixels(layers, pick) {
      const svg = '<svg viewBox="0 0 300 200" width="' + W + '" height="' + H + '" xmlns="http://www.w3.org/2000/svg">' +
        layers.map((l, i) => typeof l === 'string' ? l : l[pick(i)]).join('') + '</svg>';
      const img = new Image();
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      await img.decode();
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(img, 0, 0, W, H);
      return ctx.getImageData(0, 0, W, H).data;
    }
    function inside(b, x, y, slack) {
      const dx = (x - b[0]) / (b[2] + slack), dy = (y - b[1]) / (b[3] + slack);
      return dx * dx + dy * dy <= 1;
    }

    const out = [];
    for (let level = 0; level < pack.scenes.length; level++) {
      const layers = pack.scenes[level].layers;
      const base = await pixels(layers, () => 'a');
      const diffIdx = layers.map((l, i) => typeof l === 'string' ? -1 : i).filter(i => i >= 0);
      for (let d = 0; d < diffIdx.length; d++) {
        const li = diffIdx[d], item = layers[li];
        const px = await pixels(layers, i => i === li ? 'b' : 'a');
        let count = 0, outside = 0, intrude = 0;
        let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
        const pts = [];
        for (let p = 0; p < base.length; p += 4) {
          const delta = Math.abs(base[p] - px[p]) + Math.abs(base[p + 1] - px[p + 1]) + Math.abs(base[p + 2] - px[p + 2]);
          if (delta < 60) continue;
          const x = (p / 4 % W) / SCALE, y = Math.floor(p / 4 / W) / SCALE;
          count++;
          pts.push([x, y]);
          x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
          if (!inside(item.box, x, y, SLACK)) outside++;
          diffIdx.forEach((oi, od) => { if (od !== d && inside(layers[oi].box, x, y, 0)) intrude++; });
        }
        /* 建議範圍：以實際變動的外框中心為圓心，放大到剛好包住所有變動點，再留 2 單位 */
        let suggest = null;
        if (count) {
          const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
          const hx = Math.max((x1 - x0) / 2, 4), hy = Math.max((y1 - y0) / 2, 4);
          let m = 0;
          pts.forEach(([x, y]) => { m = Math.max(m, Math.hypot((x - cx) / hx, (y - cy) / hy)); });
          suggest = [cx, cy, hx * m + 2, hy * m + 2].map(v => Math.round(v));
        }
        out.push({ level: level + 1, n: d + 1, label: item.label, box: item.box, count, outside, intrude, suggest });
      }
    }
    return out;
  }, { SCALE, SLACK });

  let bad = 0;
  report.forEach(r => {
    const problems = [];
    if (r.count < 30) problems.push('幾乎看不出變化（' + r.count + ' 點）');
    if (r.outside > MAX_OUTSIDE) problems.push(r.outside + ' 點在答案圈外');
    if (r.intrude > MAX_INTRUDE) problems.push(r.intrude + ' 點落在別的答案圈');
    if (problems.length) {
      bad++;
      console.log(`第 ${r.level} 關 #${r.n} ${r.label}：${problems.join('、')}　目前 ${JSON.stringify(r.box)} 建議 ${JSON.stringify(r.suggest)}`);
    }
  });
  console.log(bad ? `\n${bad} 個答案需要調整` : `\n${report.length} 個答案都對得上 ✓`);
  if (process.argv.includes('--json')) console.log(JSON.stringify(report));
  await browser.close();
  process.exit(bad ? 1 : 0);
})();
