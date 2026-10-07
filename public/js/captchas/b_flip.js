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

// Un animal par tableau : la consigne est annoncée AVANT le tableau et ne change pas pendant.
const ANIMALS = [
  { e: '🐱', name: 'chats', one: 'un chat', decoys: ['🐯', '🦁', '🐶', '🐭', '🐰', '🦊', '🐻', '🐼'], note: 'Les tigres et les lions ne sont pas des chats : ils sont juste très grands.' },
  { e: '🐶', name: 'chiens', one: 'un chien', decoys: ['🐺', '🐱', '🐭', '🐰', '🦊', '🐻', '🐼', '🐷'], note: 'Les loups ne sont pas des chiens : ils ont refusé le contrat.' },
  { e: '🐰', name: 'lapins', one: 'un lapin', decoys: ['🐭', '🐹', '🐱', '🐶', '🦊', '🐻', '🐼', '🐷'], note: 'Les souris et les hamsters ne sont pas des lapins. Ils ont les oreilles trop modestes.' },
  { e: '🐸', name: 'grenouilles', one: 'une grenouille', decoys: ['🐢', '🐊', '🐱', '🐶', '🐰', '🦊', '🐻', '🐼'], note: 'Les tortues et les crocodiles ne sont pas des grenouilles, malgré leur air vert.' },
  { e: '🐷', name: 'cochons', one: 'un cochon', decoys: ['🐮', '🐗', '🐱', '🐶', '🐰', '🦊', '🐻', '🐼'], note: 'Les sangliers et les vaches ne sont pas des cochons. Ils sont jaloux.' },
  { e: '🐼', name: 'pandas', one: 'un panda', decoys: ['🐻', '🐨', '🐱', '🐶', '🐰', '🦊', '🐷', '🐸'], note: 'Les ours et les koalas ne sont pas des pandas : le panda est noir ET blanc.' },
];
export default {
  id: 'b_flip', tier: 3, title: 'Cliquez les animaux', time: 40000,
  mount(host, api) {
    const { h } = api; let stage = 0, alive = true, busy = false; const tm = [];
    const NR = 3; const picks = api.shuffle(ANIMALS).slice(0, NR);
    const ruleBox = h('div', { class: 'bk-rule bf-rule', role: 'status', 'aria-live': 'polite' });
    const grid = h('div', { class: 'bf-grid' });
    const pips = h('div', { class: 'bk-pips' }, [0, 1, 2].map(() => h('i', {})));
    const count = h('span', {}, '');
    const meta = h('div', { class: 'bk-meta' }, h('span', {}, 'Dossier n° ' + String(api.int(10, 99)) + '/B'), count, pips);
    const root = h('div', { class: 'bk' }, ruleBox, grid, meta); host.append(root);
    let tiles = [], need = 0, got = 0;
    const A = () => picks[stage];
    const setCount = () => { count.textContent = `Tableau ${stage + 1}/${NR} · ${got}/${need} ${A().name}`; };
    function build(n) {
      const a = picks[n], nc = [3, 4, 5][n];
      ruleBox.replaceChildren(h('div', {}, h('small', {}, `Tableau ${n + 1}/${NR} — consigne (elle ne change pas pendant le tableau)`), 'Cliquez sur tous les ', h('b', {}, `${a.name} ${a.e}`), '. ' + a.note));
      const others = api.shuffle(a.decoys).slice(0, 12 - nc); const list = api.shuffle([...Array(nc).fill(a.e), ...others]);
      grid.replaceChildren(); tiles = list.map((e, i) => { const b = h('button', { class: 'bf-t pop', type: 'button', 'aria-label': e === a.e ? a.one : 'pas ' + a.one, style: { animationDelay: i * 25 + 'ms' }, onclick: () => hit(i) }, e); grid.append(b); return { b, e, on: false }; });
      need = nc; got = 0;
    }
    function start(n) { stage = n; busy = false; api.timer(30000); [...pips.children].forEach((p, i) => p.classList.toggle('on', i < n)); build(n); setCount(); if (n) api.say(`Tableau ${n + 1}. Nouvel animal, nouvelle consigne : les ${picks[n].name}. Elle ne changera pas en cours de route, promis.`, 'smug'); }
    function hit(i) {
      if (busy) return; const t = tiles[i]; if (t.on) return; const a = A();
      if (t.e !== a.e) { shake(root); return api.fail(`${t.e} n’est pas ${a.one}. Ce tableau, c’étaient les ${a.name}. Relisez la consigne, elle est juste au-dessus.`); }
      t.on = true; t.b.classList.add('ok'); got++; api.sfx('pop'); setCount();
      if (got >= need) { busy = true; api.sfx('good'); if (stage >= NR - 1) { pips.children[2].classList.add('on'); tm.push(setTimeout(() => alive && api.solve(), 350)); } else tm.push(setTimeout(() => alive && start(stage + 1), 900)); }
    }
    start(0);
    if (/cheat=1/.test(location.search)) host.dataset.answer = 'animals';
    return { destroy() { alive = false; tm.forEach(clearTimeout); } };
  }
};
