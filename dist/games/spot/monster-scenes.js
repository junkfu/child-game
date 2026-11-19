/* 口袋怪獸篇：10 個 SVG 場景，每個場景 10 個不同。

   每個場景是一串圖層，依序疊上去：
     - 字串：A、B 兩張圖都一樣的部分。
     - D(說明, 類型, [中心x, 中心y, 水平半徑, 垂直半徑], A 版, B 版)：
       一個「不同」。範圍用 viewBox（300 × 200）的單位寫，
       spot.js 要的百分比座標由 regions() 換算，畫面和命中判定共用同一份資料。

   類型沿用原本找碴的分類：shape 形狀 / object 換東西 / addition 多出來 /
   pattern 花紋 / color 顏色。每關至少 6 個不是顏色的變化，小朋友才找得到。

   改了任何一個場景，跑一次 tools/check-monster-scenes.cjs：
   它會把 A、B 兩張圖算繪出來逐點比對，確認每個有變的地方都在某個答案圈裡、
   每個答案圈裡也真的有東西變了。 */
(function (Kid) {
  'use strict';
  const M = Kid.monsterArt, A = M.art, mon = M.mon;
  const { g, circ, ell, rect, path, line, poly, star, heart, INK } = M;

  function D(label, kind, box, a, b) { return { label: label, kind: kind, box: box, a: a, b: b }; }
  function bg(c) { return rect(0, 0, 300, 200, c); }

  const SCENES = [
    /* 1 ─ 草原 */
    {
      title: '草原大相遇', sub: '和小怪獸打招呼', icon: '🌱',
      layers: [
        bg('#cdeeff'),
        ell(80, 168, 150, 58, '#a6dc7f'), ell(245, 172, 130, 52, '#95d16f'), rect(0, 152, 300, 48, '#9bd47a'),
        A.cloud(120, 30, 1),
        D('太陽露出笑臉', 'addition', [40, 35, 17, 17], A.sun(40, 35, 15, false), A.sun(40, 35, 15, true)),
        D('雲變成愛心', 'shape', [200, 37, 22, 19], A.cloud(200, 40, 1), A.cloud(200, 40, 1, 'heart')),
        A.fence(165, 232, 152),
        D('樹上長出蘋果', 'addition', [262, 108, 27, 23], A.tree(262, 150, 1.2), A.tree(262, 150, 1.2, { fruit: '#ff5a5a' })),
        A.flower(45, 192, 1, '#ff8fb8'), A.tulip(272, 190, 1, '#ff6f9f'), A.tulip(287, 182, 1, '#ffd84d'),
        D('頭上的葉子變成花', 'object', [74, 112, 21, 18],
          mon(70, 170, 1.3, { c: '#8fdc7a', top: 'leaf' }), mon(70, 170, 1.3, { c: '#8fdc7a', top: 'flower' })),
        D('圓耳朵變成尖耳朵', 'shape', [150, 128, 39, 20],
          mon(150, 178, 1.3, { c: '#ffb3c7', ears: 'round' }), mon(150, 178, 1.3, { c: '#ffb3c7', ears: 'pointy' })),
        D('身上多了斑點', 'pattern', [238, 164, 29, 21],
          mon(238, 182, 1.2, { c: '#8ec5ff', shape: 'drop' }), mon(238, 182, 1.2, { c: '#8ec5ff', shape: 'drop', pattern: 'spots' })),
        D('蝴蝶變成蜜蜂', 'object', [115, 95, 14, 12], A.butterfly(115, 95, 1.2, '#ff9fd0'), A.bee(115, 95, 1.2)),
        D('香菇變成藍色', 'color', [25, 161, 17, 14], A.mushroom(25, 175, 1.2, '#ff6b6b'), A.mushroom(25, 175, 1.2, '#6fa8ff')),
        D('小花變成紫色', 'color', [105, 167, 11, 11], A.flower(105, 185, 1.1, '#ff8fb8'), A.flower(105, 185, 1.1, '#b58cff')),
        D('石頭變成蝸牛', 'object', [180, 179, 27, 17], A.rock(178, 190, 1.1), A.snail(178, 190, 1.1)),
      ],
    },

    /* 2 ─ 森林露營 */
    {
      title: '森林露營趣', sub: '一起搭帳篷', icon: '⛺',
      layers: [
        bg('#d6f0ff'), rect(0, 140, 300, 60, '#a7d98a'),
        A.cloud(95, 32, 1), A.pine(20, 142, 1.3), A.pine(52, 140, 1.0),
        D('松樹變成圓圓的樹', 'shape', [284, 105, 26, 36], A.pine(285, 138, 1.1), A.tree(285, 138, 1.1)),
        D('帳篷多了條紋', 'pattern', [160, 120, 31, 23], A.tent(160, 150, 1.4, '#ff9a5a'), A.tent(160, 150, 1.4, '#ff9a5a', { stripes: true })),
        D('帳篷頂上多了旗子', 'addition', [166, 84, 12, 12], '',
          g(160, 150, 1.4, line(0, -38, 0, -50, INK, 1.4) + poly([0, -50, 10, -46.5, 0, -43], '#ff6f9f'))),
        D('營火上多了鍋子', 'addition', [218, 145, 29, 16], A.campfire(218, 175, 1.3, false), A.campfire(218, 175, 1.3, true)),
        line(92, 150, 92, 104, '#8a5a3c', 2.4),
        D('燈籠變成藍色', 'color', [92, 112, 10, 14], A.lantern(92, 104, 1.2, '#ffd84d'), A.lantern(92, 104, 1.2, '#7ec8ff')),
        D('角變成圓耳朵', 'shape', [48, 126, 37, 21],
          mon(48, 182, 1.3, { c: '#ffb36b', shape: 'bean', ears: 'horn' }), mon(48, 182, 1.3, { c: '#ffb36b', shape: 'bean', ears: 'round' })),
        D('天線變成星星', 'shape', [110, 121, 10, 11],
          mon(110, 185, 1.2, { c: '#c3a6ff', ears: 'antenna' }), mon(110, 185, 1.2, { c: '#c3a6ff', ears: 'antenna', tip: 'star' })),
        D('戴上了帽子', 'addition', [266, 150, 26, 13],
          mon(262, 188, 1.0, { c: '#ffe27a', ears: 'round' }), mon(262, 188, 1.0, { c: '#ffe27a', ears: 'round', top: 'cap' })),
        D('木頭變成香菇', 'object', [159, 178, 26, 18], A.log(160, 190, 1.0),
          A.mushroom(154, 190, 1.0, '#ffb347') + A.mushroom(167, 190, 0.8, '#ffb347')),
        D('天空飛來小鳥', 'addition', [202, 43, 14, 10], '', A.bird(200, 45, 1.3, '#ff9fd0')),
      ],
    },

    /* 3 ─ 海邊 */
    {
      title: '海邊玩水趣', sub: '踩踩浪花真好玩', icon: '🌊',
      layers: [
        bg('#c9ecff'), rect(0, 80, 300, 50, '#6cc7f0'),
        path('M0 122 Q40 112 80 122 T160 122 T240 122 T320 122 V200 H0Z', '#ffe3a8'),
        A.sun(265, 30, 13),
        D('雨傘的條紋變成點點', 'pattern', [47, 114, 31, 14], A.umbrella(45, 165, 1.3, '#ff6f6f', 'stripe'), A.umbrella(45, 165, 1.3, '#ff6f6f', 'dot')),
        D('旗子變成星星', 'shape', [158, 126, 10, 9], A.sandcastle(150, 175, 1.5, 'tri'), A.sandcastle(150, 175, 1.5, 'star')),
        D('帆船變成小鯨魚', 'object', [112, 82, 27, 22], A.boat(110, 100, 1.3, '#ffffff'), A.whale(110, 100, 1.3)),
        D('貝殼變成海星', 'object', [235, 176, 13, 12], A.shell(235, 185, 1.3), A.starfish(235, 185, 1.3, '#ff9a5a')),
        mon(200, 108, 1.1, { c: '#8ec5ff', shape: 'drop' }),
        D('泳圈變成黃色', 'color', [200, 104, 21, 10], A.ring(200, 112, 1.3, '#ff6f9f'), A.ring(200, 112, 1.3, '#ffd84d')),
        D('耳朵變成兔子耳朵', 'shape', [110, 128, 39, 29],
          mon(110, 185, 1.3, { c: '#ffb3c7', ears: 'round' }), mon(110, 185, 1.3, { c: '#ffb3c7', ears: 'bunny' })),
        D('戴上了太陽眼鏡', 'addition', [265, 158, 17, 9],
          mon(265, 190, 1.2, { c: '#9be07a', shape: 'bean', ears: 'pointy' }), mon(265, 190, 1.2, { c: '#9be07a', shape: 'bean', ears: 'pointy', glasses: 'sun' })),
        D('天空多了海鷗', 'addition', [185, 38, 16, 9], '', A.gull(185, 40, 1.6)),
        D('水桶變成綠色', 'color', [180, 181, 11, 11], A.bucket(180, 190, 1.3, '#7ec8ff'), A.bucket(180, 190, 1.3, '#9be07a')),
        D('椰子樹長出椰子', 'addition', [289, 78, 11, 9], A.palm(285, 130, 1.3, false), A.palm(285, 130, 1.3, true)),
      ],
    },

    /* 4 ─ 雪地 */
    {
      title: '雪地堆雪人', sub: '冷冷的也好開心', icon: '⛄',
      layers: [
        bg('#b9dcf5'),
        ell(70, 172, 150, 50, '#ffffff'), ell(250, 176, 120, 45, '#f4fbff'), rect(0, 162, 300, 38, '#ffffff'),
        A.snowflake(30, 30, 6), A.snowflake(160, 22, 5), A.snowflake(250, 62, 6), A.snowflake(282, 24, 5), A.snowflake(72, 72, 4),
        D('雲變成愛心', 'shape', [200, 37, 22, 19], A.cloud(200, 40, 1), A.cloud(200, 40, 1, 'heart')),
        D('雪花變成愛心', 'shape', [110, 40, 11, 11], A.snowflake(110, 40, 8), heart(110, 40, 8, '#ffffff')),
        D('樹頂多了星星', 'addition', [40, 84, 11, 10], A.pine(40, 165, 1.4, { snow: true }), A.pine(40, 165, 1.4, { snow: true, star: true })),
        D('雪人的帽子變成水桶', 'object', [150, 110, 18, 14], A.snowman(150, 170, 1.5, { hat: 'top' }), A.snowman(150, 170, 1.5, { hat: 'bucket' })),
        D('冰屋的門變成方形', 'shape', [240, 160, 18, 16], A.igloo(240, 170, 1.4, 'round'), A.igloo(240, 170, 1.4, 'square')),
        D('雪橇變成藍色', 'color', [77, 181, 26, 7], A.sled(80, 190, 1.4, '#ff6f6f'), A.sled(80, 190, 1.4, '#7ec8ff')),
        D('角變成天線', 'shape', [110, 118, 23, 23],
          mon(110, 185, 1.3, { c: '#c3a6ff', shape: 'bean', ears: 'horn' }), mon(110, 185, 1.3, { c: '#c3a6ff', shape: 'bean', ears: 'antenna' })),
        D('圍巾變成綠色', 'color', [195, 180, 29, 9],
          mon(195, 190, 1.3, { c: '#a9d8ff', ears: 'round', scarf: '#ff6f6f' }), mon(195, 190, 1.3, { c: '#a9d8ff', ears: 'round', scarf: '#9be07a' })),
        D('圍巾多了條紋', 'pattern', [263, 182, 9, 8],
          mon(270, 190, 1.1, { c: '#ffe27a', shape: 'drop', scarf: '#7ec8ff' }), mon(270, 190, 1.1, { c: '#ffe27a', shape: 'drop', scarf: '#7ec8ff', scarfStripes: true })),
        D('多了一堆雪球', 'addition', [20, 182, 13, 11], '',
          circ(14, 186, 5, '#fff', M.stroke(INK, 1.2)) + circ(25, 186, 5, '#fff', M.stroke(INK, 1.2)) + circ(19.5, 177.5, 5, '#fff', M.stroke(INK, 1.2))),
      ],
    },

    /* 5 ─ 溫泉 */
    {
      title: '暖呼呼溫泉', sub: '泡泡澡放輕鬆', icon: '♨️',
      layers: [
        bg('#f6a97f'),
        A.bamboo(0, 122, 58, '#9fd27a'), A.bamboo(42, 122, 58, '#9fd27a'), A.bamboo(84, 122, 58, '#9fd27a'), A.bamboo(126, 122, 58, '#9fd27a'),
        D('竹子變成黃色', 'color', [188, 92, 31, 41], A.bamboo(168, 122, 58, '#9fd27a'), A.bamboo(168, 122, 58, '#ffcf6b')),
        A.bamboo(210, 122, 58, '#9fd27a'), A.bamboo(252, 122, 58, '#9fd27a'),
        rect(0, 120, 300, 80, '#cdb9a6'),
        ell(150, 165, 140, 34, '#8fd6e8'),
        D('天空多了月亮', 'addition', [250, 30, 13, 13], '', A.moon(250, 30, 12)),
        D('多了一盞燈籠', 'addition', [40, 31, 11, 45], '', line(40, 0, 40, 34, INK, 1.2) + A.lantern(40, 40, 1.4, '#ff8a7a')),
        D('招牌變成圓形', 'shape', [275, 106, 22, 19], A.sign(275, 140, 1.3, false), A.sign(275, 140, 1.3, true)),
        D('頭上的毛巾變成小鴨', 'object', [90, 122, 23, 20],
          mon(90, 178, 1.3, { c: '#ffb36b', ears: 'round', top: 'towel', face: 'happy' }), mon(90, 178, 1.3, { c: '#ffb36b', ears: 'round', top: 'duck', face: 'happy' })),
        D('身上多了斑點', 'pattern', [205, 142, 18, 9],
          mon(205, 180, 1.2, { c: '#9be07a', shape: 'bean', ears: 'pointy' }), mon(205, 180, 1.2, { c: '#9be07a', shape: 'bean', ears: 'pointy', pattern: 'spots' })),
        D('頭上多了小花', 'addition', [40, 124, 11, 11],
          mon(40, 182, 1.2, { c: '#ffb3c7', shape: 'drop' }), mon(40, 182, 1.2, { c: '#ffb3c7', shape: 'drop', top: 'flower' })),
        ell(150, 174, 136, 24, '#8fd6e8', ' opacity=".92"'),
        D('熱氣變成愛心', 'shape', [125, 116, 12, 14], A.steam(125, 128, 1.2, false), A.steam(125, 128, 1.2, true)),
        A.steam(178, 126, 1.1), A.steam(250, 132, 1),
        D('小鴨變成小船', 'object', [151, 155, 17, 15], A.duck(150, 168, 1.4), A.boat(150, 168, 0.9, '#ff9fd0')),
        A.rock(18, 200, 1.6), A.rock(280, 200, 1.5), A.rock(200, 202, 1.2),
        D('木桶變成藍色', 'color', [95, 190, 11, 9], A.bucketWood(95, 198, 1.2, '#d9a066'), A.bucketWood(95, 198, 1.2, '#8fc9ff')),
      ],
    },

    /* 6 ─ 寶石洞窟 */
    {
      title: '寶石洞窟', sub: '亮晶晶的大冒險', icon: '💎',
      layers: [
        bg('#4a3a6b'), ell(150, 110, 170, 95, '#5a4880'), path('M0 150 Q150 135 300 150 V200 H0Z', '#6b5a8f'),
        A.stalactite(30, 0, 1.3, '#7a68a6'), A.stalactite(80, 0, 1.0, '#7a68a6'), A.stalactite(140, 0, 1.4, '#7a68a6'), A.stalactite(250, 0, 1.2, '#7a68a6'),
        D('多了一根鐘乳石', 'addition', [200, 14, 13, 21], '', A.stalactite(200, 0, 1.3, '#7a68a6')),
        D('水晶變成藍色', 'color', [40, 127, 14, 28], A.crystal(40, 150, 1.4, '#d39cff'), A.crystal(40, 150, 1.4, '#7ed6ff')),
        D('尖尖的水晶變成寶石', 'shape', [268, 129, 17, 27], A.crystal(268, 150, 1.4, '#7affc8', 'point'), A.crystal(268, 150, 1.4, '#7affc8', 'gem')),
        D('蝙蝠變成螢火蟲', 'object', [110, 45, 20, 13], A.bat(110, 45, 1.4), A.firefly(110, 45, 1.4)),
        D('天線的燈變成粉紅色', 'color', [95, 106, 9, 9],
          mon(95, 182, 1.4, { c: '#7fe0d0', ears: 'antenna' }), mon(95, 182, 1.4, { c: '#7fe0d0', ears: 'antenna', tipC: '#ff6f9f' })),
        D('角變成皇冠', 'object', [155, 119, 26, 18],
          mon(155, 178, 1.4, { c: '#ffb36b', ears: 'horn' }), mon(155, 178, 1.4, { c: '#ffb36b', top: 'crown' })),
        mon(215, 184, 1.2, { c: '#ffb3c7', shape: 'bean', ears: 'bunny' }),
        D('手上多了寶石', 'addition', [234, 163, 9, 9], '', A.crystal(234, 170, 0.7, '#ff6f9f', 'gem')),
        D('寶箱打開了', 'shape', [42, 174, 23, 14], A.chest(42, 196, 1.2, false), A.chest(42, 196, 1.2, true)),
        D('石頭變成怪獸蛋', 'object', [125, 183, 23, 21], A.rock(125, 196, 1.1, '#8e84a8'), A.egg(125, 196, 1.1, '#fff8ec', 'dots')),
        D('香菇多了點點', 'pattern', [285, 181, 13, 10], A.mushroom(285, 196, 1.1, '#7ec8ff', false), A.mushroom(285, 196, 1.1, '#7ec8ff', true)),
      ],
    },

    /* 7 ─ 雲上 */
    {
      title: '雲上散步', sub: '跟著風一起飛', icon: '☁️',
      layers: [
        bg('#9fd6ff'),
        D('彩虹的綠色變成紫色', 'color', [150, 77, 57, 30], A.rainbow(150, 100, 45), A.rainbow(150, 100, 45, ['#ff8a8a', '#ffcf6b', '#c58cff', '#7ec8ff'])),
        ell(70, 188, 95, 30, '#ffffff'), ell(230, 192, 100, 28, '#ffffff'), ell(150, 196, 60, 18, '#ffffff'),
        D('氣球變成愛心', 'shape', [40, 51, 14, 16], A.balloon(40, 90, 1.4, '#ff6f9f'), A.balloon(40, 90, 1.4, '#ff6f9f', 'heart')),
        D('風箏尾巴多了蝴蝶結', 'addition', [257, 92, 12, 18], A.kite(255, 50, 1.2, '#ffd84d', false), A.kite(255, 50, 1.2, '#ffd84d', true)),
        D('小鳥變成蝴蝶', 'object', [121, 29, 20, 16], A.bird(120, 30, 1.3, '#ff9fd0'), A.butterfly(120, 30, 1.4, '#ffd84d')),
        D('天空多了星星', 'addition', [200, 25, 9, 9], '', star(200, 25, 7, '#fff6c8')),
        D('多了一架紙飛機', 'addition', [60, 18, 23, 11], '', A.plane(60, 18, 1)),
        D('雲變成愛心', 'shape', [284, 127, 20, 18], A.cloud(285, 130, 0.9), A.cloud(285, 130, 0.9, 'heart')),
        D('耳朵變成兔子耳朵', 'shape', [60, 118, 39, 29],
          mon(60, 175, 1.3, { c: '#ffe27a', ears: 'round', wings: true }), mon(60, 175, 1.3, { c: '#ffe27a', ears: 'bunny', wings: true })),
        D('頭上多了條紋', 'pattern', [150, 141, 15, 11],
          mon(150, 182, 1.2, { c: '#ffb3c7', shape: 'drop' }), mon(150, 182, 1.2, { c: '#ffb3c7', shape: 'drop', pattern: 'stripes' })),
        D('頭上多了蝴蝶結', 'addition', [235, 125, 21, 15],
          mon(235, 182, 1.3, { c: '#9be0c8', shape: 'bean', ears: 'pointy' }), mon(235, 182, 1.3, { c: '#9be0c8', shape: 'bean', ears: 'pointy', top: 'bow' })),
      ],
    },

    /* 8 ─ 星空 */
    {
      title: '星空晚安', sub: '小怪獸要睡覺了', icon: '🌙',
      layers: [
        bg('#2d3561'), path('M0 150 Q80 130 160 148 T300 145 V200 H0Z', '#3f6b5a'),
        star(20, 20, 3, '#fff1a8'), star(90, 25, 3, '#fff1a8'), star(180, 70, 3, '#fff1a8'), star(282, 72, 3, '#fff1a8'),
        star(205, 14, 2.5, '#fff1a8'), star(28, 92, 2.5, '#fff1a8'),
        D('彎月變成滿月', 'shape', [50, 40, 18, 18], A.moon(50, 40, 16, false), A.moon(50, 40, 16, true)),
        D('多了一顆流星', 'addition', [139, 35, 23, 16], '', A.shooting(150, 30, 1.2)),
        D('星星變成愛心', 'shape', [110, 60, 9, 9], star(110, 60, 6, '#fff1a8'), heart(110, 60, 7, '#ffb3c7')),
        D('多了一顆土星', 'addition', [250, 40, 18, 10], '', A.saturn(250, 40, 9)),
        A.tree(70, 155, 1.3, { c: '#2f7a5a' }),
        D('多了一隻螢火蟲', 'addition', [88, 110, 11, 11], '', A.firefly(88, 110, 1.3)),
        D('窗戶變成圓形', 'shape', [235, 129, 41, 12],
          A.house(235, 158, 1.5, { wall: '#ffe8c7', winC: '#ffe27a', roofC: '#c46a8a' }), A.house(235, 158, 1.5, { wall: '#ffe8c7', winC: '#ffe27a', roofC: '#c46a8a', win: 'round' })),
        D('貓頭鷹變成貓咪', 'object', [34, 152, 21, 25], A.owl(30, 170, 1.3), A.cat(30, 170, 1.3)),
        D('戴上了睡帽', 'addition', [128, 130, 40, 21],
          mon(120, 185, 1.3, { c: '#c3a6ff', face: 'sleep', ears: 'round' }), mon(120, 185, 1.3, { c: '#c3a6ff', face: 'sleep', ears: 'round', top: 'nightcap' })),
        D('身上多了斑點', 'pattern', [185, 170, 29, 21],
          mon(185, 188, 1.2, { c: '#8ec5ff', shape: 'drop' }), mon(185, 188, 1.2, { c: '#8ec5ff', shape: 'drop', pattern: 'spots' })),
        mon(262, 192, 1.1, { c: '#ffe27a', shape: 'bean', face: 'happy' }),
        line(290, 194, 290, 152, '#8a5a3c', 2.2),
        D('燈籠變成藍色', 'color', [290, 160, 9, 13], A.lantern(290, 152, 1.2, '#ffb347'), A.lantern(290, 152, 1.2, '#7ec8ff')),
      ],
    },

    /* 9 ─ 小鎮 */
    {
      title: '怪獸小鎮', sub: '今天去哪裡逛逛', icon: '🏘️',
      layers: [
        bg('#cfeeff'), rect(0, 155, 300, 12, '#efe9f6'), rect(0, 166, 300, 34, '#d9d4e6'),
        A.sun(28, 28, 12), A.cloud(240, 32, 1),
        A.house(55, 155, 1.5, { wall: '#ffe8c7', roofC: '#ff8a7a', chimney: true }),
        D('煙囪冒煙了', 'addition', [79, 62, 14, 21], '', g(55, 155, 1.5, circ(14, -55, 3.5, '#9aa3b5') + circ(18, -61, 4.5, '#9aa3b5') + circ(14, -68, 5, '#9aa3b5'))),
        D('門變成藍色', 'color', [55, 141, 13, 19], '', g(55, 155, 1.5, rect(-6, -18, 12, 18, '#7ec8ff', 3))),
        D('尖屋頂變成圓屋頂', 'shape', [155, 105, 47, 20],
          A.house(155, 155, 1.2, { wall: '#d8f0ff', roofC: '#7ec8ff' }), A.house(155, 155, 1.2, { wall: '#d8f0ff', roofC: '#7ec8ff', roof: 'dome' })),
        D('窗戶多了花盆', 'addition', [172, 138, 11, 8], '',
          g(155, 155, 1.2, rect(7, -13.5, 14, 3.5, '#a8754f', 1) + circ(10, -15, 2, '#ff6f9f') + circ(14, -15.5, 2, '#ffd84d') + circ(18, -15, 2, '#ff6f9f'))),
        A.house(245, 155, 1.5, { wall: '#fff0d6', roofC: '#9be07a' }),
        D('遮雨棚變成藍色', 'color', [241, 113, 29, 9], A.awning(222, 108, 46, '#ff6f6f', '#ffffff'), A.awning(222, 108, 46, '#7ec8ff', '#ffffff')),
        D('路燈變成星星', 'shape', [95, 101, 11, 11], A.lamp(95, 160, 1.3, 'round'), A.lamp(95, 160, 1.3, 'star')),
        D('郵筒變成消防栓', 'object', [200, 150, 18, 28], A.mailbox(200, 170, 1.3), A.hydrant(200, 170, 1.3)),
        D('帽子變成皇冠', 'object', [130, 145, 31, 19],
          mon(125, 193, 1.2, { c: '#ff9a8a', top: 'cap', capC: '#7ec8ff' }), mon(125, 193, 1.2, { c: '#ff9a8a', top: 'crown' })),
        mon(245, 195, 1.1, { c: '#9be07a', shape: 'bean', ears: 'pointy' }),
        D('手上多了氣球', 'addition', [266, 163, 12, 31], '', A.balloon(266, 180, 1.1, '#ff6f9f')),
        D('三角錐變成球', 'object', [80, 184, 14, 16], A.cone(80, 195, 1.2), A.ball(80, 195, 1.2, '#ffd84d')),
      ],
    },

    /* 10 ─ 慶典 */
    {
      title: '好朋友慶典', sub: '大家一起來跳舞', icon: '🎉',
      layers: [
        bg('#ffe9f3'), rect(0, 150, 300, 50, '#ffd6a8'),
        star(30, 40, 4, '#7ec8ff'), circ(80, 55, 3, '#ff6f9f'), star(180, 70, 4, '#9be07a'), circ(262, 30, 3, '#ffd84d'), circ(122, 75, 2.5, '#7ec8ff'),
        D('三角旗變成愛心', 'shape', [105, 30, 9, 9],
          A.bunting(0, 300, 18, ['t', 't', 't', 't', 't', 't', 't', 't', 't', 't'], ['#ff8a8a', '#ffcf6b', '#9be07a', '#7ec8ff', '#c58cff']),
          A.bunting(0, 300, 18, ['t', 't', 't', 'heart', 't', 't', 't', 't', 't', 't'], ['#ff8a8a', '#ffcf6b', '#9be07a', '#7ec8ff', '#c58cff'])),
        A.disco(150, 50, 12),
        D('多了一顆氣球', 'addition', [270, 59, 14, 36], '', A.balloon(270, 80, 1.3, '#7ec8ff')),
        D('多了音符', 'addition', [45, 60, 14, 20], '', A.note(45, 70, 1.4, '#c58cff')),
        D('彩色星星變成愛心', 'shape', [220, 40, 9, 9], star(220, 40, 6, '#ffd84d'), heart(220, 40, 7, '#ff6f9f')),
        rect(110, 150, 80, 6, '#c99a6e', 2), rect(116, 156, 5, 20, '#c99a6e'), rect(179, 156, 5, 20, '#c99a6e'),
        D('蛋糕多了一根蠟燭', 'addition', [150, 98, 26, 15], A.cake(150, 150, 1.5, 3), A.cake(150, 150, 1.5, 4)),
        D('禮物的緞帶變成黃色', 'color', [205, 155, 17, 21], A.gift(205, 175, 1.4, '#7ec8ff', '#ff6f9f'), A.gift(205, 175, 1.4, '#7ec8ff', '#ffd84d')),
        D('禮物變成小熊', 'object', [95, 155, 21, 27], A.gift(95, 175, 1.3, '#ffd84d', '#9be07a'), A.bear(95, 175, 1.3)),
        D('戴上了皇冠', 'addition', [40, 145, 22, 16],
          mon(40, 195, 1.2, { c: '#ffb3c7', ears: 'round' }), mon(40, 195, 1.2, { c: '#ffb3c7', ears: 'round', top: 'crown' })),
        D('頭上多了條紋', 'pattern', [150, 159, 16, 12],
          mon(150, 197, 1.3, { c: '#8ec5ff', ears: 'antenna' }), mon(150, 197, 1.3, { c: '#8ec5ff', ears: 'antenna', pattern: 'stripes' })),
        D('尖耳朵變成圓耳朵', 'shape', [250, 144, 35, 20],
          mon(250, 195, 1.2, { c: '#ffb36b', shape: 'bean', ears: 'pointy' }), mon(250, 195, 1.2, { c: '#ffb36b', shape: 'bean', ears: 'round' })),
      ],
    },
  ];

  function diffs(level) { return SCENES[level].layers.filter(function (l) { return typeof l !== 'string'; }); }

  function svg(level, side) {
    return '<svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      SCENES[level].layers.map(function (l) { return typeof l === 'string' ? l : l[side]; }).join('') + '</svg>';
  }

  /* viewBox 單位 → spot.js 用的百分比 [x%, y%, rx%, ry%, 說明, 類型] */
  function regions() {
    return SCENES.map(function (_, i) {
      return diffs(i).map(function (d) {
        const b = d.box;
        return [M.n(b[0] / 3), M.n(b[1] / 2), M.n(b[2] / 3), M.n(b[3] / 2), d.label, d.kind];
      });
    });
  }

  Kid.spotPack = {
    id: 'spot-monster',
    edition: 'monster-1',
    levels: SCENES.map(function (s) { return [s.title, s.sub, s.icon]; }),
    regions: regions(),
    svg: svg,
    scenes: SCENES,
    copy: {
      start: '看看小怪獸的耳朵、頭上和身上的花紋，還有背景喔！',
      miss: '這裡一樣喔，再看看小怪獸和旁邊的東西 ♡',
      done: '全部找到了！你是怪獸觀察家！',
      praises: ['好眼力！找到一個小不同！', '小怪獸開心得跳起來了！', '又收集到一顆小星星！', '你的眼睛跟老鷹一樣厲害！', '小小觀察家，就是你！'],
    },
  };
})(window.Kid = window.Kid || {});
