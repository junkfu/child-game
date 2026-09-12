/* 注音拼讀（拼拼看）的音節表。

   範圍限制，刻意保守：
   - 只做二拼（聲母 + 韻母），不做三拼（聲母 + 介母 + 韻母）。
   - 全部一聲，這一版不教聲調，畫面也不出現聲調符號。
   - 手選幼兒熟悉的音節，不做窮舉的四百個音節。

   char 是這個音節對應的常用字，一律取一聲。它有兩個用途：
   一是當「拼出來是什麼」的圖示說明（不要求小朋友認字），
   二是拿來產生音檔 —— 這點很重要，原因見下。

   音檔為什麼用 char 而不是注音字串產生：
   macOS 的中文語音看得懂注音，大部分二拼也會正確融成一個音節
   （say "ㄅㄚ" 與 say "八" 位元組完全相同）。但實測發現
   捲舌／舌尖前聲母配 ㄨ 時不會融合：
       ㄓㄨ 0.486s vs 豬 0.324s     ㄕㄨ 0.554s vs 書 0.403s
       ㄗㄨ 0.541s vs 租 0.344s
   也就是被唸成「ㄓ－ㄨ」兩段，正是拼讀最不能犯的錯。
   改用 char 產生，每個音節都保證是真正的單音節。 */
(function (Kid) {
  'use strict';

  const SYLLABLES = [
    { id: 'ba',   initial: 'b',  final: 'a',   char: '八', emoji: '8️⃣' },
    { id: 'bao',  initial: 'b',  final: 'ao',  char: '包', emoji: '🥟' },
    { id: 'bei',  initial: 'b',  final: 'ei',  char: '杯', emoji: '🥤' },
    { id: 'pa',   initial: 'p',  final: 'a',   char: '趴', emoji: '' },
    { id: 'ma',   initial: 'm',  final: 'a',   char: '媽', emoji: '👩' },
    { id: 'mao',  initial: 'm',  final: 'ao',  char: '貓', emoji: '🐱' },
    { id: 'fa',   initial: 'f',  final: 'a',   char: '發', emoji: '' },
    { id: 'feng', initial: 'f',  final: 'eng', char: '風', emoji: '🌬️' },
    { id: 'da',   initial: 'd',  final: 'a',   char: '搭', emoji: '' },
    { id: 'dao',  initial: 'd',  final: 'ao',  char: '刀', emoji: '🔪' },
    { id: 'deng', initial: 'd',  final: 'eng', char: '燈', emoji: '💡' },
    { id: 'tang', initial: 't',  final: 'ang', char: '湯', emoji: '🍲' },
    { id: 'la',   initial: 'l',  final: 'a',   char: '拉', emoji: '' },
    { id: 'gao',  initial: 'g',  final: 'ao',  char: '高', emoji: '' },
    { id: 'gang', initial: 'g',  final: 'ang', char: '鋼', emoji: '' },
    { id: 'ka',   initial: 'k',  final: 'a',   char: '咖', emoji: '☕' },
    { id: 'kai',  initial: 'k',  final: 'ai',  char: '開', emoji: '' },
    { id: 'he',   initial: 'h',  final: 'e',   char: '喝', emoji: '' },
    { id: 'ji',   initial: 'j',  final: 'i',   char: '雞', emoji: '🐔' },
    { id: 'qi',   initial: 'q',  final: 'i',   char: '七', emoji: '7️⃣' },
    { id: 'xi',   initial: 'x',  final: 'i',   char: '西', emoji: '' },
    { id: 'zhu',  initial: 'zh', final: 'u',   char: '豬', emoji: '🐷' },
    { id: 'che',  initial: 'ch', final: 'e',   char: '車', emoji: '🚗' },
    { id: 'shu',  initial: 'sh', final: 'u',   char: '書', emoji: '📖' },
    { id: 'shan', initial: 'sh', final: 'an',  char: '山', emoji: '⛰️' },
    { id: 'zu',   initial: 'z',  final: 'u',   char: '租', emoji: '' },
    { id: 'san',  initial: 's',  final: 'an',  char: '三', emoji: '3️⃣' },
  ];

  Kid.zhuyin = Kid.zhuyin || {};
  Kid.zhuyin.SYLLABLES = SYLLABLES;

  /* 拼出來的注音字串，例如 { initial:'b', final:'a' } -> 'ㄅㄚ' */
  Kid.zhuyin.syllableText = function (syl) {
    return Kid.zhuyin.symbol(syl.initial).zhuyin + Kid.zhuyin.symbol(syl.final).zhuyin;
  };

  /* 到某單元為止，聲母與韻母都已經學過的音節才能出題。 */
  Kid.zhuyin.availableSyllables = function (unit) {
    const learned = {};
    Kid.zhuyin.learnedThrough(unit).forEach(function (s) { learned[s.id] = true; });
    return SYLLABLES.filter(function (s) {
      return learned[s.initial] && learned[s.final];
    });
  };
})(window.Kid = window.Kid || {});
