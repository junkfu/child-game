/* 出題用的共同邏輯：誘答項怎麼抽、題目怎麼排。

   誘答項刻意和「單元」脫鉤。單元是照發音部位分組的，而那正好是
   最容易混淆的分組 —— 單元 1 就要小朋友在平板喇叭上分辨 ㄅ/ㄆ
   （國語裡最難的送氣對比），單元 3 是 ㄉ/ㄊ、單元 4 是 ㄍ/ㄎ。
   每一關都由最小對立組成，等於一開始就給最難的。

   所以：前面幾題從「已學過的符號裡差異最大的」抽誘答項，
   只有最後的挑戰題才刻意放進最小對立。 */
(function (Kid) {
  'use strict';

  const Z = Kid.zhuyin;

  /* 兩個符號是不是容易混淆（音近或形近） */
  function confusable(a, b) {
    const pairs = Z.CONFUSABLE_SOUND.concat(Z.CONFUSABLE_SHAPE);
    return pairs.some(function (p) {
      return (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a);
    });
  }

  /* 抽 count 個誘答項。
     hard=false 優先挑「不容易混淆」的，hard=true 優先挑容易混淆的。
     兩種情況都以「已經學過的符號」為範圍，不會出現還沒教的。 */
  function distractors(answerId, unit, count, hard) {
    const pool = Z.learnedThrough(unit)
      .map(function (s) { return s.id; })
      .filter(function (id) { return id !== answerId; });

    const near = pool.filter(function (id) { return confusable(id, answerId); });
    const far = pool.filter(function (id) { return !confusable(id, answerId); });

    const first = hard ? near : far;
    const rest = hard ? far : near;
    const out = Kid.shuffle(first).slice(0, count);
    if (out.length < count) {
      out.push.apply(out, Kid.shuffle(rest).slice(0, count - out.length));
    }
    /* 已學符號還不夠多時（單元 1 只有 4 個），退而求其次用全部符號補滿，
       否則第一關根本湊不出四個選項。 */
    if (out.length < count) {
      const all = Z.SYMBOLS.map(function (s) { return s.id; })
        .filter(function (id) { return id !== answerId && out.indexOf(id) < 0; });
      out.push.apply(out, Kid.shuffle(all).slice(0, count - out.length));
    }
    return out;
  }

  /* 組一題的選項：答案 + 誘答項，打散。 */
  function options(answerId, unit, total, hard) {
    return Kid.shuffle([answerId].concat(distractors(answerId, unit, total - 1, hard)));
  }

  /* 選項格：listen / picture / blend 共用。
     放在這裡而不是流程控制裡，因為玩法模組不應該反過來依賴流程控制
     （preview.html 只載入模組、不載入 zhuyin.js，也要能跑）。 */
  function optionGrid (options, answer, done) {
    const grid = Kid.el('div', 'q-options');
    let wrong = false;
    options.forEach(function (id) {
      const b = Kid.el('button', 'opt');
      b.appendChild(Z.glyph(id));
      b.setAttribute('aria-label', '注音符號 ' + Z.symbol(id).zhuyin);
      b.addEventListener('click', function () {
        if (b.disabled) return;
        if (id === answer) {
          b.classList.add('right');
          Kid.audio.chime('right');
          grid.querySelectorAll('button').forEach(function (x) { x.disabled = true; });
          Kid.audio.say('audio/sym/' + answer + '.m4a');
          setTimeout(function () { done(!wrong); }, 620);
        } else {
          /* 答錯不結束、不扣分，只是這一題不算滿分。
             暗掉選錯的，讓他繼續找 —— 一定要讓他看到正確答案。

             先唸出「他點到的那一個」再放答錯音效，不要只放音效：
             不然孩子只知道「錯了」，不知道自己按到的是什麼。
             點錯本來就是認識符號的好時機。 */
          wrong = true;
          b.classList.add('nope');
          b.disabled = true;
          b.classList.add('shake');
          Kid.audio.say('audio/sym/' + id + '.m4a').then(function () {
            Kid.audio.chime('wrong');
          });
        }
      });
      grid.appendChild(b);
    });
    return grid;
  }

  Z.optionGrid = optionGrid;
  Z.confusable = confusable;
  Z.distractors = distractors;
  Z.options = options;
})(window.Kid = window.Kid || {});
