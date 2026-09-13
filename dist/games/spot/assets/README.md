# 找碴插畫

- 原圖：`scenes.png`（971 × 1619）。
- 配色變化來源：`scenes-edited.png`（保留原檔）。
- 新增的結構變化來源：`scenes-varied.png`（971 × 1619）。使用內建 imagegen，以原圖作為編輯參考生成；原圖未覆寫。
- 每張皆為 2 欄 × 5 列。各場景只顯示 `../differences.js` 指定的局部變化，遮罩外沿用原圖。
- 生成後已依實際物品位置校準座標；生成提示中的指定位置與最後採用的位置有些不同。以 `differences.js` 為準。

## 生成提示詞

Edit the supplied image atlas IN PLACE. It is a strict TWO COLUMN by FIVE ROW atlas of ten scenes, each scene 3:2. Preserve EXACT composition, panel borders, character poses, faces, positions, proportions, colors, camera, background alignment and all untouched pixels as closely as possible. Do NOT add circles, arrows, labels or text. Do NOT recolor clothes. This is the B version of a spot-the-difference game: change only the listed objects, with structural differences, not just colors. Keep each replacement centered in the same object's bounding box and similar size so local masks can show it. Coordinates mentioned are percentages within the individual panel, not overall atlas. Keep illustration style identical. Full atlas aspect ratio 3:5. Output high resolution. Make all SIX changes in each of all TEN panels as listed:

TOP LEFT rooftop concert: replace the neon heart on far right with a neon five-point star; replace the purple guitar on far left with a small striped umbrella; add a crescent moon in the empty sky above the pink-haired girl's head; change the rectangular belt buckle of purple-haired girl to heart-shaped; add a large fabric bow on pink girl's bodice; replace the motif on black-haired girl's denim chest with a sun emblem.

TOP RIGHT cafe: replace pink layer cake in front of center girl with stack of pancakes; turn the cat-face chair on far right into a bear-face chair (round ears); replace cupcake in front of left girl with ice cream in a waffle cone; replace left pink drink with a snow globe on a base; replace right pink drink with vase of daisies; put a clearly visible crescent-shaped cookie in the upper display shelf at local x75% y25%.

ROW 2 LEFT dance room: replace big neon heart with big neon musical note; replace left wall speaker with round wall clock; make ceiling light at local x40% y8% a star-shaped pendant lamp; make ceiling light at x80% y10% a Saturn-shaped lamp; add fabric bow on center pink girl's chest; add butterfly hair clip on right black-haired girl's upper right hair bun at x76% y39%.

ROW 2 RIGHT aquarium: replace central manta ray with a sea turtle, keeping within same area; replace small top left shark with seahorse; replace whale shark's spot patch at x83% y27% with star shapes; replace left jellyfish with octopus; replace far right jellyfish with a small school of three fish; add heart-shaped bubble at x73% y14%.

ROW 3 LEFT garden: replace flower basket on far left with small wooden treasure chest; replace white puppy in the girls' arms with white kitten with pointed ears and long tail; replace bow decoration on straw hat with sunflower; replace daisy in left girl's hand with round swirl lollipop; add a butterfly-shaped cloud in sky at x65% y14%; turn the pink flowers in the top of the right garden arch at x84% y15% into star-shaped flowers.

ROW 3 RIGHT amusement park: replace heart-shaped wheel center with a sun face; add balloon near x50% y7%; replace castle spire at x66% y20% with short tower with waving flag; replace lantern at x17% y36% with flower-shaped lamp; add fabric bow on center girl's chest; add swirl lollipop by raised hand at x58% y40%.

ROW 4 LEFT bedroom: change crescent moon through window into Saturn with ring; change large hanging star above left girl's head into hanging heart; replace right lampshade with mushroom-cap lampshade; replace rabbit plush on far right with penguin plush; replace popcorn in bowl foreground with round cookies; replace stack of books bottom right with wrapped gift boxes.

ROW 4 RIGHT beach: replace upper right beach umbrella canopy with red spotted mushroom cap, keeping its pole; replace far right deck chair with yellow inflatable duck swim ring; replace small cloud at x35% y9% with diamond kite with ribbon tail; give tiny sandcastle flag a star shape; replace seashell at x85% y83% with starfish; replace flower at far bottom right with colorful pinwheel.

ROW 5 LEFT library: replace low stack of books on far left with wooden treasure chest; replace low stack of books on far right with two round globes on stands; change emblem on left side of open book cover to crescent moon; change emblem on right side of book cover to sun; change gothic top of background window at x42% y10% to round window with circular frame; replace sparkling star on upper far right shelf x97% y16% with glowing butterfly.

ROW 5 RIGHT final concert: replace large background neon crown with neon rainbow; change microphone held by pink girl into a playful ice-cream-cone-shaped microphone; add shooting star at x18% y9%; add musical note at x85% y10%; add bow on center pink girl's bodice; add a flower patch on black-haired girl's blue outfit near x69% y76%.
