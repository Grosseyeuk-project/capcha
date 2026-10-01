import { css, shake } from './b_kit.js';
css('memory', `
.bm-pads{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.bm-p{appearance:none;border:2px solid var(--ink);height:clamp(60px,14vw,76px);cursor:pointer;font:800 15px var(--display);color:var(--ink);position:relative;display:flex;align-items:center;justify-content:center;gap:10px;background:var(--c);filter:saturate(.55) brightness(.85);box-shadow:4px 4px 0 var(--ink);transition:transform .08s,box-shadow .08s,filter .08s;padding:0}
.bm-p span{font-size:30px;line-height:1}.bm-p kbd{position:absolute;right:6px;top:3px;font:600 11px var(--mono);opacity:.6}
.bm-p:hover:not(:disabled){filter:saturate(.8) brightness(.95)}
.bm-p.lit{filter:saturate(1.4) brightness(1.25);transform:translate(2px,2px);box-shadow:1px 1px 0 var(--ink);outline:5px solid #fff;outline-offset:-9px}
.bm-p:disabled{cursor:default}
.bm-seq{display:flex;gap:6px;flex-wrap:wrap;min-height:26px}
.bm-seq i{width:22px;height:22px;border:2px solid var(--ink);background:transparent;transition:background .15s,transform .15s}
.bm-seq i.ok{background:var(--ink);transform:scale(1.1)}
.bm-state{font:800 13px var(--mono);text-transform:uppercase;letter-spacing:.08em}
.bm-state.go{background:var(--ink);color:var(--yellow);padding:2px 8px}
`);
const PADS = [{ n: 'Rouge', s: '▲', c: '#ff6b6b' }, { n: 'Jaune', s: '●', c: '#ffd23f' }, { n: 'Vert', s: '■', c: '#43d9a3' }, { n: 'Bleu', s: '◆', c: '#5aa0ff' }];
export default {
  id: 'b_memory', tier: 4, title: 'Mémoire de poisson', time: 40000,
  mount(host, api) {
    const { h } = api; let alive = true, stage = 0, seq = [], pos = 0, accept = false; const tm = [];
    const state = h('span', { class: 'bm-state', role: 'status', 'aria-live': 'polite' }, '');
    const rule = h('div', { class: 'bk-rule' }); const dots = h('div', { class: 'bm-seq', 'aria-hidden': 'true' });
    const pads = PADS.map((p, i) => h('button', { class: 'bm-p', type: 'button', 'aria-label': p.n, disabled: true, onclick: () => press(i) }, h('span', {}, p.s), p.n, h('kbd', {}, String(i + 1))));
    pads.forEach((el, i) => el.style.setProperty('--c', PADS[i].c));
    const pips = h('div', { class: 'bk-pips' }, [0, 1].map(() => h('i', {})));
    const root = h('div', { class: 'bk' }, rule, h('div', { class: 'bm-pads' }, pads), dots, h('div', { class: 'bk-meta' }, state, pips)); host.append(root);
    const T = (fn, ms) => tm.push(setTimeout(() => alive && fn(), ms));
    const lit = (i, on) => pads[i].classList.toggle('lit', on);
    function setRule(small, ...k) { rule.replaceChildren(h('div', {}, h('small', {}, small), ...k)); }
    function begin(n) {
      stage = n; pos = 0; accept = false; const len = n === 0 ? 5 : 6;
      seq = []; for (let i = 0; i < len; i++) { let v; do { v = api.int(0, 3); } while (i && v === seq[i - 1] && api.rng() < 0.7); seq.push(v); }
      if (/cheat=1/.test(location.search)) host.dataset.answer = JSON.stringify(n === 0 ? seq : [...seq].reverse());
      dots.replaceChildren(...seq.map(() => h('i', {})));
      if (n === 0) setRule('Phase 1', 'Regardez la séquence, puis ', h('b', {}, 'répétez-la'), ' (clic ou touches 1-4).');
      else setRule('Phase 2 — mise à jour', 'Même chose, mais ', h('b', {}, 'À L’ENVERS'), ', et les pads vont ', h('b', {}, 'changer de place'), '. Oui, c’est méchant.');
      pads.forEach((p) => { p.disabled = true; p.style.order = ''; }); state.className = 'bm-state'; state.textContent = 'Observez… (ça commence)';
      const step = api.reducedMotion ? 800 : 620; let t = 500; pads.forEach((p) => p.classList.add('lit')); T(() => pads.forEach((p) => p.classList.remove('lit')), 260);
      seq.forEach((v) => { T(() => { lit(v, true); api.sfx('pop'); }, t); T(() => lit(v, false), t + step * 0.62); t += step; });
      T(() => { accept = true; pads.forEach((p) => (p.disabled = false)); state.className = 'bm-state go'; state.textContent = n ? 'À l’envers !' : 'À vous !'; api.timer(n ? 16000 : 13000); api.sfx('whoosh'); if (n) { const o = api.shuffle([0, 1, 2, 3]); pads.forEach((p, i) => (p.style.order = o[i])); api.say('Les pads ont changé de place. Fiez-vous à la couleur, pas à la position.', 'smug'); } }, t + 100);
      api.timer(5000 + seq.length * step + 14000);
    }
    function press(i) {
      if (!accept) return; lit(i, true); T(() => lit(i, false), 140);
      const want = stage ? seq[seq.length - 1 - pos] : seq[pos];
      if (i !== want) {
        accept = false; shake(root); const nth = pos + 1; pads[i].classList.remove('lit');
        const m = pos === 0 ? `Dès le premier signal : ${PADS[i].n} au lieu de ${PADS[want].n}. Ça commence fort.` : stage ? `Signal n° ${nth} (à l’envers) : vous avez tapé ${PADS[i].n}, il fallait ${PADS[want].n}. L’envers, c’est dur, hein ?` : `Au signal n° ${nth}, c’était ${PADS[want].n}, pas ${PADS[i].n}. Votre mémoire a la durée de vie d’un poisson rouge.`;
        return api.fail(m);
      }
      api.sfx('click'); dots.children[pos].classList.add('ok'); pos++;
      if (pos >= seq.length) {
        accept = false; pads.forEach((p) => (p.disabled = true));
        if (stage === 1) { pips.children[1].classList.add('on'); api.sfx('good'); T(() => api.solve(), 300); } else { pips.children[0].classList.add('on'); api.say('Phase 1 validée. Vous vous croyiez fini ? Rien n’est fini ici.', 'smug'); T(() => begin(1), 900); }
      }
    }
    const key = (e) => { const k = '1234'.indexOf(e.key); if (k > -1 && !e.repeat && !e.ctrlKey && !e.metaKey) press(k); };
    window.addEventListener('keydown', key);
    begin(0);
    return { destroy() { alive = false; tm.forEach(clearTimeout); window.removeEventListener('keydown', key); } };
  }
};
