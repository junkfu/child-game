/* 短回合：示範 → 配對餵點心 → 聽音尋寶。每個符號都會出場。 */
(function (Kid) {
  'use strict';
  const Z = Kid.zhuyin;
  const names = ['布丁龍', '草莓兔', '泡泡龍', '星星貓', '橘子狐', '布啾', '花花龜', '啵啵', '皇冠熊', '毛毛'];
  function friend(index, className) {
    const art = Kid.el('span', 'friend-art ' + (className || ''));
    art.style.backgroundPosition = (index % 5 * 25) + '% ' + (index < 5 ? 0 : 100) + '%';
    art.setAttribute('role', 'img');
    art.setAttribute('aria-label', names[index]);
    return art;
  }
  function build(ctx) {
    const first = Kid.shuffle(ctx.symbols).map(function (s, index) {
      return { mode: 'adventure', answer: s.id, guided: true, announceInstruction: index === 0,
        options: Z.options(s.id, ctx.unit, 2, false) };
    });
    const review = Kid.sample(ctx.symbols, 2).map(function (s) {
      return { mode: 'adventure', answer: s.id, guided: false,
        options: Z.options(s.id, ctx.unit, 3, false) };
    });
    return first.concat(review);
  }
  function render(q, host, done) {
    host.innerHTML = '';
    const wrap = Kid.el('div', 'adventure-round');
    const index = Number(host.dataset.friend || 0);
    const word = Z.word(q.answer, host.dataset.deck || 'girl');
    let complete = false, voice = 0;
    const alive = function () { return wrap.isConnected; };
    const scene = Kid.el('div', 'snack-scene');
    const buddy = Kid.el('button', 'buddy');
    buddy.setAttribute('aria-label', '摸摸' + names[index] + '，再聽一次');
    buddy.appendChild(friend(index));
    const bubble = Kid.el('div', 'buddy-bubble');
    bubble.appendChild(Kid.el('strong', null, q.guided ? '餵我一塊注音餅乾！' : '幫我找到聲音寶石！'));
    const clue = Kid.el('div', 'snack-clue');
    if (q.guided) clue.appendChild(Z.glyph(q.answer));
    else clue.appendChild(Kid.el('span', null, '♪'));
    bubble.appendChild(clue);
    scene.appendChild(buddy); scene.appendChild(bubble);
    wrap.appendChild(scene);
    const controls = Kid.el('div', 'snack-controls');
    const replay = Kid.el('button', 'btn btn-primary', '🔊 再聽一次');
    replay.addEventListener('click', function () { speak(false); });
    buddy.addEventListener('click', function () {
      buddy.classList.remove('wiggle'); void buddy.offsetWidth; buddy.classList.add('wiggle'); speak(false);
    });
    controls.appendChild(replay);
    const hint = Kid.el('button', 'btn btn-ghost', '💡 幫幫我');
    hint.addEventListener('click', function () {
      clue.innerHTML = ''; clue.appendChild(Z.glyph(q.answer));
      grid.querySelector('[data-answer="true"]').classList.add('help-glow');
      speak(false);
    });
    controls.appendChild(hint); wrap.appendChild(controls);
    const status = Kid.el('p', 'snack-status', q.guided ? '找一樣的符號，點一下餵給牠' : '聽聲音，點一下寶石');
    status.setAttribute('aria-live', 'polite'); wrap.appendChild(status);
    const grid = Kid.el('div', 'snack-options');
    q.options.forEach(function (id) {
      const button = Kid.el('button', 'snack ' + (q.guided ? 'cookie' : 'gem'));
      button.dataset.answer = String(id === q.answer);
      button.setAttribute('aria-label', (q.guided ? '餵餅乾 ' : '選寶石 ') + Z.symbol(id).zhuyin);
      button.appendChild(Z.glyph(id));
      button.addEventListener('click', function () {
        if (complete || button.disabled) return;
        if (id !== q.answer) {
          status.textContent = '這個是 ' + Z.symbol(id).zhuyin + ' 喔，再找找看！';
          button.classList.add('tried');
          clue.innerHTML = ''; clue.appendChild(Z.glyph(q.answer));
          speakWrong(id); return;
        }
        complete = true; voice++; Kid.audio.stop();
        grid.querySelectorAll('button').forEach(function (b) { b.disabled = true; });
        button.classList.add('delivered'); buddy.classList.add('celebrate');
        bubble.innerHTML = '<strong>啊嗚！謝謝你！</strong><span class="snack-heart">♥</span>';
        status.textContent = q.guided ? '餅乾送到了！' : '找到寶石了！';
        Kid.audio.chime('right');
        if (word) {
          const sticker = Z.modes.meet.picture(word); sticker.classList.add('snack-sticker');
          bubble.replaceChildren(sticker, Kid.el('strong', null, word.word));
        }
        speak(false);
        const next = Kid.el('button', 'btn btn-primary snack-next', '收下星星，繼續 →');
        next.addEventListener('click', function () { if (!wrap.isConnected) return; next.disabled = true; done(true); });
        controls.replaceChildren(next); next.focus({ preventScroll: true });
      });
      grid.appendChild(button);
    });
    wrap.appendChild(grid); host.appendChild(wrap);
    /* 點錯的時候，先唸出「他點到的那一個」，再放答錯音效，最後把正確的再唸一次。
       原本是直接重播正確答案，孩子聽不到自己按到的是什麼，
       就少了「喔，原來那個是ㄆ」這個學習機會 —— 點錯本來就是認識符號的好時機。 */
    async function speakWrong(id) {
      const token = ++voice;
      await Kid.audio.say('audio/sym/' + id + '.m4a');
      if (!alive() || token !== voice) return;
      Kid.audio.chime('wrong');
      await new Promise(function (r) { setTimeout(r, 420); });
      if (!alive() || token !== voice) return;
      await Kid.audio.say('audio/sym/' + q.answer + '.m4a');
    }
    async function speak(instruction) {
      const token = ++voice;
      const clips = instruction ? ['audio/ui/' + (q.guided ? 'feed' : 'treasure') + '.m4a'] : [];
      clips.push('audio/sym/' + q.answer + '.m4a');
      /* 答對及答對後摸角色重播：符號唸完，才接單詞。 */
      if (complete && word) clips.push(word.audio);
      for (const clip of clips) {
        if (!alive() || token !== voice) return;
        await Kid.audio.say(clip);
      }
    }
    speak(!q.guided || q.announceInstruction === true);
  }
  Z.friends = { names: names, art: friend };
  Z.modes = Z.modes || {};
  Z.modes.adventure = { build: build, render: render };
})(window.Kid = window.Kid || {});
