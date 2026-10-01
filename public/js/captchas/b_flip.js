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
.bf-rule b.no{background:var(--red);color:#fff;padding:0 5px;box-shadow:2px 2px 0 var(--ink)}
`);
const CATS = ['🐱'], OTH = ['🐶', '🐭', '🐰', '🦊', '🐻', '🐼', '🐸', '🐵', '🐷', '🐮', '🐔', '🐧'];
export default {
  id: 'b_flip', tier: 3, title: 'Cliquez… enfin non', time: 22000,
  mount(host, api) {
    const { h } = api; let stage = 0, alive = true, busy = false; const tm = [];
    // stages: 0 chats / 1 PAS chats (erratum) / 2 chiens puis demi-tour -> chats
    const rule = h('div', { class: 'bk-rule bf-rule', role: 'status', 'aria-live': 'polite' });
    const grid = h('div', { class: 'bf-grid' });
    const pips = h('div', { class: 'bk-pips' }, [0, 1, 2].map(() => h('i', {})));
    const count = h('span', {}, '');
    const meta = h('div', { class: 'bk-meta' }, h('span', {}, 'Dossier n° ' + pad2(api.int(10, 99)) + '/B'), count, pips);
    const root = h('div', { class: 'bk' }, rule, grid, meta); host.append(root);
    let tiles = [], mode = 'cat', flipped = false, need = 0, got = 0;
    const R = (small, html) => { rule.className = 'bk-rule bf-rule flip'; rule.replaceChildren(h('div', {}, h('small', {}, small), ...html)); };
    const setCount = () => { count.textContent = `${got}/${need} validés`; };
    function build(kinds) { // kinds: array of 12 emoji
      grid.replaceChildren(); tiles = kinds.map((e, i) => {
        const b = h('button', { class: 'bf-t pop', type: 'button', 'aria-label': e === '🐱' ? 'chat' : e === '🐶' ? 'chien' : 'autre animal', style: { animationDelay: i * 25 + 'ms' }, onclick: () => hit(i) }, e);
        grid.append(b); return { b, e, on: false };
      });
    }
    const isTarget = (e) => mode === 'cat' ? e === '🐱' : mode === 'notcat' ? e !== '🐱' : mode === 'dog' ? e === '🐶' : false;
    function layout(nTargetKind, nT) { // build board with nT target emoji
      let list = [];
      if (nTargetKind === 'cat') { list = [...Array(nT).fill('🐱'), ...api.shuffle(OTH).slice(0, 12 - nT)]; }
      else if (nTargetKind === 'notcat') { const m = 12 - nT; list = [...Array(m).fill(0).map(() => '🐱'), ...api.shuffle(OTH.filter((x) => x !== '🐶').concat(['🐶'])).slice(0, 12 - m)]; }
      return api.shuffle(list);
    }
    function start(n) {
      stage = n; busy = false; got = 0; flipped = false; api.timer(n === 2 ? 26000 : 20000);
      [...pips.children].forEach((p, i) => p.classList.toggle('on', i < n));
      if (n === 0) { mode = 'cat'; need = api.int(3, 4); build(layout('cat', need)); R('Consigne n° 1', ['Cliquez sur tous les ', h('b', {}, 'chats'), ' 🐱']); }
      else if (n === 1) {
        mode = 'notcat'; build(layout('cat', api.int(3, 4)));
        need = tiles.filter((t) => t.e !== '🐱').length;
        R('Erratum n° 1', ['En fait, cliquez sur ceux qui ', h('b', { class: 'no' }, 'NE SONT PAS'), ' des chats.']); api.say('Un erratum. Oui, nous en avons. Lisez.', 'smug'); api.sfx('whoosh');
      } else {
        mode = 'dog'; const nd = 4; build(api.shuffle([...Array(nd).fill('🐶'), ...Array(3).fill('🐱'), ...api.shuffle(OTH.filter((x) => x !== '🐶')).slice(0, 5)]));
        need = nd; R('Consigne n° 3', ['Cliquez sur tous les ', h('b', {}, 'chiens'), ' 🐶']);
      }
      setCount();
    }
    function done() {
      busy = true; api.sfx('good');
      if (stage === 2) { tm.push(setTimeout(() => alive && api.solve(), 350)); return; }
      tm.push(setTimeout(() => { if (alive) start(stage + 1); }, 650));
    }
    function hit(i) {
      if (busy) return; const t = tiles[i]; if (t.on || t.lock) return;
      if (mode === 'cat' && t.e !== '🐱') { if (flipped) { shake(root); return api.fail(t.e === '🐶' ? 'Un chien. Je viens de dire « les CHATS ». Oui, j’ai changé d’avis. Non, vous n’aviez pas le droit de ne pas suivre.' : 'Ni chat ni chien. Un figurant. Il fallait suivre l’erratum, pas improviser.'); } shake(root); return api.fail(`Ceci est ${t.e === '🐶' ? 'un chien' : 'un animal'}. Vous avez cliqué sur ${t.e}. Le chat, lui, a des moustaches et du mépris.`); }
      if (mode === 'notcat' && t.e === '🐱') { shake(root); return api.fail('C’est un chat. Il était écrit « NE SONT PAS ». En majuscules. Pour vous.'); }
      if (mode === 'dog' && t.e !== '🐶') { shake(root); return api.fail(flipped ? 'Un chien. Mais enfin, je venais de corriger : « les CHATS ». Suivez le dossier.' : `Pas un chien (${t.e}). Les chiens sont ceux qui vous aiment, vous.`); }
      if (mode === 'cat' && flipped) {}
      t.on = true; t.b.classList.add('ok'); got++; api.sfx('pop'); setCount();
      if (stage === 2 && !flipped && got === 2) { // demi-tour
        flipped = true; mode = 'cat'; tiles.forEach((x) => { if (x.on) { x.lock = true; x.b.classList.add('lock'); } });
        got = 0; need = tiles.filter((x) => x.e === '🐱').length; setCount(); api.timer(14000);
        R('Rectificatif n° 3', ['Pardon, mauvais dossier. Cliquez plutôt sur les ', h('b', {}, 'CHATS'), '. Les chiens déjà cliqués sont ', h('b', { class: 'no' }, 'perdus'), '.']); api.say('Les deux chiens déjà cliqués ? Désormais, ils sont des pièces à conviction.', 'smug'); api.sfx('bad');
        return;
      }
      if (got >= need) done();
    }
    start(0);
    if (/cheat=1/.test(location.search)) host.dataset.answer = 'dynamic';
    return { destroy() { alive = false; tm.forEach(clearTimeout); } };
  }
};
