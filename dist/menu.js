/* 主選單。卡片完全由 Kid.catalog 驅動，加遊戲不用動這個檔。 */
(function (Kid) {
  'use strict';

  function card(game) {
    const state = Kid.store.game(game.id);
    const p = game.progress(state);
    const pct = p.total ? Math.round(p.done / p.total * 100) : 0;

    const a = Kid.el('a', 'game-card');
    a.href = game.href;
    a.style.setProperty('--tint', game.tint);
    a.setAttribute('aria-label', game.title + '，已完成 ' + p.done + ' / ' + p.total + ' ' + p.unit);

    const head = Kid.el('div', 'game-head');
    const icon = Kid.el('span', 'game-icon', game.icon);
    icon.setAttribute('aria-hidden', 'true');
    const text = Kid.el('div');
    text.appendChild(Kid.el('h2', null, game.title));
    text.appendChild(Kid.el('p', 'sub', game.sub));
    head.appendChild(icon);
    head.appendChild(text);

    const foot = Kid.el('div', 'game-foot');
    const meter = Kid.el('div', 'meter');
    const fill = Kid.el('i');
    fill.style.width = pct + '%';
    meter.appendChild(fill);
    foot.appendChild(meter);
    foot.appendChild(Kid.el('span', 'count', p.done + ' / ' + p.total + ' ' + p.unit));

    a.appendChild(head);
    a.appendChild(foot);
    a.appendChild(Kid.el('span', 'go', (p.done > 0 ? '繼續玩' : '開始玩') + ' →'));
    return a;
  }

  function render() {
    const host = Kid.$('games');
    host.innerHTML = '';
    Kid.catalog.forEach(function (g) { host.appendChild(card(g)); });

    const soon = Kid.el('div', 'soon');
    soon.appendChild(Kid.el('span', null, '✦'));
    soon.appendChild(Kid.el('div', null, '更多遊戲，敬請期待'));
    host.appendChild(soon);
  }

  Kid.wireSoundButton(Kid.$('sound'));
  render();
})(window.Kid = window.Kid || {});
