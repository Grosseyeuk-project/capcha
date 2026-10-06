import { css, shake, pad2 } from './b_kit.js';
css('flip', `
.bf-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.bf-t{appearance:none;aspect-ratio:1.9;border:2px solid var(--ink);background:#fff;font-size:clamp(28px,8vw,44px);line-height:1;cursor:pointer;position:relative;display:grid;place-items:center;box-shadow:3px 3px 0 var(--ink);transition:transform .1s,box-shadow .1s,background .15s;font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif;padding:0}
.bf-t:hover:not(.ok):not(.lock){transform:translate(-1px,-1px);box-shadow:4px 4px 0 var(--ink);background:#fffbe0}
.bf-t:active:not(.ok){transform:translate(2px,2px);box-shadow:1px 1px 0 var(--ink)}
.bf-t.ok{background:var(--green);transform:translate(2px,2px);box-shadow:1px 1px 0 var(--ink)}
.bf-t.ok::after{content:'✓';position:absolute;right:4px;top:0;font:800 16px var(--display);color:var(--ink)}
.bf-t.lock{background:#ddd6c1;opacity:.7;cursor:default}
.bf-t.pop{animation:bf-pop .35s both}
@keyframes bf-pop{0%{transform:scale(.4);opacity:0}70%{transform:scale(1.1)}100%{transform:none;opacity:1}}

`);
const OTH = ['🐶', '🐭', '🐰', '🦊', '🐻', '🐼', '🐸', '🐵', '🐷', '🐮', '🐔', '🐧', '🐯', '🦁'];
// 🐯 et 🦁 : de gros félins, mais pas des chats (l'énoncé le dit)
export default {
  id: 'b_flip', tier: 3, title: 'Cliquez les chats', time: 40000,
  mount(host, api) {
    const { h } = api; let stage = 0, alive = true, busy = false; const tm = [];
    const NR = 3;
    const rule = h('div', { class: 'bk-rule bf-rule', role: 'status', 'aria-live': 'polite' }, h('div', {}, h('small', {}, 'Consigne (elle ne changera pas)'), 'Cliquez sur tous les ', h('b', {}, 'chats 🐱'), '. Les tigres et les lions ne sont pas des chats : ils sont juste très grands.'));
    const grid = h('div', { class: 'bf-grid' });
    const pips = h('div', { class: 'bk-pips' }, [0, 1, 2].map(() => h('i', {})));
    const count = h('span', {}, '');
    const meta = h('div', { class: 'bk-meta' }, h('span', {}, 'Dossier n° ' + String(api.int(10, 99)) + '/B'), count, pips);
    const root = h('div', { class: 'bk' }, rule, grid, meta); host.append(root);
    let tiles = [], need = 0, got = 0;
    const setCount = () => { count.textContent = `Tableau ${stage + 1}/${NR} · ${got}/${need} chats`; };
    function build(n) {
      const nc = [3, 4, 5][n]; const others = api.shuffle(OTH).slice(0, 12 - nc); const list = api.shuffle([...Array(nc).fill('🐱'), ...others]);
      grid.replaceChildren(); tiles = list.map((e, i) => { const b = h('button', { class: 'bf-t pop', type: 'button', 'aria-label': e === '🐱' ? 'chat' : 'pas un chat', style: { animationDelay: i * 25 + 'ms' }, onclick: () => hit(i) }, e); grid.append(b); return { b, e, on: false }; });
      need = nc; got = 0;
    }
    function start(n) { stage = n; busy = false; api.timer(30000); [...pips.children].forEach((p, i) => p.classList.toggle('on', i < n)); build(n); setCount(); if (n) api.say(`Tableau ${n + 1}. Même consigne : les chats. Il y en a plus, c’est tout.`, 'smug'); }
    function hit(i) {
      if (busy) return; const t = tiles[i]; if (t.on) return;
      if (t.e !== '🐱') { shake(root); const big = t.e === '🐯' || t.e === '🦁'; return api.fail(big ? `Ça ressemble à un chat, mais c’est ${t.e === '🐯' ? 'un tigre' : 'un lion'}. L’énoncé le disait. Les moustaches ne font pas le chat.` : `${t.e} n’est pas un chat. Le chat, lui, a des moustaches et du mépris.`); }
      t.on = true; t.b.classList.add('ok'); got++; api.sfx('pop'); setCount();
      if (got >= need) { busy = true; api.sfx('good'); if (stage >= NR - 1) { pips.children[2].classList.add('on'); tm.push(setTimeout(() => alive && api.solve(), 350)); } else tm.push(setTimeout(() => alive && start(stage + 1), 700)); }
    }
    start(0);
    if (/cheat=1/.test(location.search)) host.dataset.answer = 'cats';
    return { destroy() { alive = false; tm.forEach(clearTimeout); } };
  }
};
