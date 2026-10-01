import { css, shake } from './b_kit.js';
css('loading', `
.bl-box{border:2px solid var(--ink);background:#fff;padding:14px;box-shadow:4px 4px 0 var(--ink);display:flex;flex-direction:column;gap:10px}
.bl-title{font:800 15px var(--display);display:flex;justify-content:space-between;gap:8px}
.bl-title span{font:600 12px var(--mono);opacity:.7;white-space:nowrap}
.bl-bar{height:34px;border:2px solid var(--ink);background:#e9e2cd;position:relative;overflow:hidden}
.bl-bar i{position:absolute;left:0;top:0;bottom:0;width:100%;transform-origin:0 0;background:repeating-linear-gradient(135deg,#2a6df4 0 12px,#4a86ff 12px 24px);background-size:34px 34px}
.bl-bar.fake i{background:repeating-linear-gradient(135deg,#f0b400 0 12px,#ffd23f 12px 24px)}
.bl-bar.real i{background:var(--green);animation:bl-glow .25s infinite alternate}
@keyframes bl-glow{to{filter:brightness(1.25)}}
.bl-bar b{position:absolute;inset:0;display:grid;place-items:center;font:800 15px var(--mono);mix-blend-mode:normal;color:var(--ink);text-shadow:0 0 4px #fff,0 0 4px #fff}
.bl-log{height:64px;overflow:hidden;font:12px/1.35 var(--mono);color:#556;display:flex;flex-direction:column;justify-content:flex-end;border-top:1px dashed #bbb;padding-top:6px}
.bl-log div{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bl-log div:last-child{color:var(--ink);font-weight:700}
.bl-btns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}.bl-go{min-width:150px}.bl-cancel{background:#fff;color:var(--ink)}.bl-cancel:hover:not(:disabled){background:#eee}
.bl-go.ready{background:#0b8a5f;border-color:#0b8a5f;box-shadow:0 0 0 4px rgba(45,226,192,.6)}
.bl-flag{font:800 11px var(--mono);letter-spacing:.08em;text-transform:uppercase;min-width:10ch;text-align:right}
`);
const LOG = ['Téléchargement de votre personnalité…', 'Décompression de vos opinions…', 'Recherche de votre libre arbitre… introuvable', 'Calibrage du sourire social', 'Vérification des cookies émotionnels', 'Désinstallation du doute', 'Ajout d’un peu de nostalgie (facultatif)', 'Estimation du temps restant : oui', 'Réticulation des splines humaines', 'Recompilation de votre enfance', 'Mise en cache de la peur du lundi', 'Négociation avec le pare-feu de la raison'];
export default {
  id: 'b_loading', tier: 4, title: 'Installation en cours', time: 30000,
  mount(host, api) {
    const { h } = api; let stage = 0, alive = true, busy = false;
    const fill = h('i', {}), pct = h('b', {}, '0 %'), bar = h('div', { class: 'bl-bar', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100 }, fill, pct);
    const flag = h('span', { class: 'bl-flag' }, ''), logEl = h('div', { class: 'bl-log', 'aria-hidden': 'true' });
    const btn = h('button', { class: 'bk-btn bl-go', type: 'button', onclick: click }, 'Continuer');
    const cancel = h('button', { class: 'bk-btn bl-go bl-cancel', type: 'button', style: { display: 'none' }, onclick: () => { if (busy) return; shake(box); api.fail('Vous avez cliqué sur « Annuler » : 99 % de votre humanité à la poubelle. Les boutons ont changé de place, c’était écrit nulle part.'); } }, 'Annuler');
    const btns = h('div', { class: 'bl-btns' }, btn, cancel);
    const pips = h('div', { class: 'bk-pips' }, [0, 1].map(() => h('i', {})));
    const rule = h('div', { class: 'bk-rule' }, h('div', {}, h('small', {}, 'Attendez… puis cliquez'), 'Cliquez sur « Continuer » quand l’installation est ', h('b', {}, 'vraiment'), ' terminée (barre ', h('b', {}, 'verte'), '). Surveillez aussi vos boutons.'));
    const box = h('div', { class: 'bl-box' }, h('div', { class: 'bl-title' }, 'Installation de votre humanité', h('span', {}, 'v' + api.int(2, 9) + '.' + api.int(0, 9) + '.' + api.int(0, 9))), bar, h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, h('span', { class: 'bk-meta' }, 'Ne fermez pas cette fenêtre'), flag), logEl, btns);
    const root = h('div', { class: 'bk' }, rule, box, h('div', { class: 'bk-meta' }, h('span', {}, 'Étape ' + 1 + '/2'), pips)); host.append(root);
    const metaStep = root.querySelector('.bk-meta span');
    let swapped = false, lastKind = '', segs = [], total = 0, t0 = 0, curKind = 'move', logIdx = 0, lastLog = 0;
    function build(n) {
      const r = (a, b) => a + api.rng() * (b - a); segs = [];
      const add = (to, dur, kind = 'move') => segs.push({ to, dur, kind });
      add(r(48, 66), r(0.9, 1.3)); add(0, r(0.5, 0.9), 'hold'); add(r(81, 92), r(1.6, 2.2));
      if (n === 1) { add(r(12, 22), 0.4); add(100, 0.9, 'move'); add(100, 0.9, 'fake'); add(r(25, 35), 0.3); add(99, 1.4); add(99, r(0.9, 1.4), 'hold'); }
      else { add(99, 1.0); add(99, r(0.7, 1.1), 'hold'); }
      add(100, n === 1 ? 1.0 : 1.2, 'real'); add(0, 0.25, 'move');
      let c = 0; segs.forEach((s) => { s.t = c; c += s.dur; }); total = c;
    }
    const ease = (x) => x * x * (3 - 2 * x);
    function sample(t) {
      t %= total;
      for (let i = 0; i < segs.length; i++) { const s = segs[i]; if (t < s.t + s.dur) { const from = i ? segs[i - 1].to : 0; const f = Math.min(1, (t - s.t) / s.dur); const v = s.kind === 'hold' ? from : s.kind === 'move' ? from + (s.to - from) * ease(f) : s.to; return { v, kind: s.kind }; } }
      return { v: 0, kind: 'move' };
    }
    function prep() { let prev = 0; segs.forEach((s) => { if (s.kind === 'hold') s.to = prev; prev = s.to; }); }
    function begin(n) { stage = n; busy = false; cancel.style.display = n ? '' : 'none'; btn.style.order = 0; cancel.style.order = 1; swapped = false; build(n === 0 ? 2 : 1); prep(); t0 = performance.now(); api.timer(n ? 26000 : 24000); pips.children[0].classList.toggle('on', n > 0); metaStep.textContent = `Étape ${n + 1}/2`; }
    function click() {
      if (busy) return; const s = sample((performance.now() - t0) / 1000);
      if (s.kind === 'real') {
        busy = true; api.sfx('good'); if (stage === 1) { pips.children[1].classList.add('on'); setTimeout(() => alive && api.solve(), 250); return; }
        api.say('Étape un terminée. L’étape deux est exactement comme la première, mais méchante.', 'smug'); flag.textContent = 'OK ✓';
        setTimeout(() => { if (alive) begin(1); }, 800); return;
      }
      shake(box); const p = Math.round(s.v);
      if (s.kind === 'fake') return api.fail('100 % jaune, c’est une estimation. Une promesse. Vous avez cru un chargement : votre première erreur.');
      if (p >= 98) return api.fail(`${p} %… tout près ! Mais « près » n’a jamais installé personne. Attendez le vert.`);
      if (p < 15) return api.fail('Vous cliquez à ' + p + ' %. L’installation vient de commencer, et vous aussi, visiblement.');
      api.fail(`Cliqué à ${p} %. Le chargement n’est pas fini, et vous non plus. Patience, c’est l’humain qui perd.`);
    }
    begin(0);
    let raf;
    const loop = (now) => {
      raf = requestAnimationFrame(loop); const s = sample((now - t0) / 1000); curKind = s.kind; if (stage === 1 && lastKind !== s.kind && ((lastKind === 'fake') || (lastKind === 'move' && s.kind === 'hold'))) { swapped = !swapped; btn.style.order = swapped ? 1 : 0; cancel.style.order = swapped ? 0 : 1; api.sfx('whoosh'); } lastKind = s.kind;
      fill.style.transform = `scaleX(${s.v / 100})`; const p = Math.round(s.v); pct.textContent = s.kind === 'fake' ? '100 % (estimation)' : s.kind === 'real' ? '100 % — PRÊT' : p + ' %';
      bar.setAttribute('aria-valuenow', p); bar.classList.toggle('fake', s.kind === 'fake'); bar.classList.toggle('real', s.kind === 'real');
      btn.classList.toggle('ready', s.kind === 'real'); if (!busy) flag.textContent = s.kind === 'real' ? 'MAINTENANT' : s.kind === 'fake' ? 'menteur' : '';
      if (now - lastLog > 950) { lastLog = now; const L = LOG[logIdx++ % LOG.length]; logEl.append(h('div', {}, '> ' + L)); while (logEl.children.length > 4) logEl.firstChild.remove(); }
    };
    raf = requestAnimationFrame(loop);
    if (/cheat=1/.test(location.search)) host.dataset.answer = 'wait-green';
    return { destroy() { alive = false; cancelAnimationFrame(raf); } };
  }
};
