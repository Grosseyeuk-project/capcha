import { css, frame, hasRule, coarse } from './a_kit.js';
css('order', `
.ao-l{position:relative;height:calc(var(--n)*46px)}
.ao-r{position:absolute;left:0;right:0;height:42px;display:flex;align-items:center;gap:8px;padding:0 6px 0 4px;background:#fff;border:1px solid #c9ccd1;border-radius:5px;transition:top .2s cubic-bezier(.3,1.2,.5,1),box-shadow .15s,border-color .15s;touch-action:manipulation;box-shadow:0 1px 2px rgba(0,0,0,.1)}
.ao-r.d{transition:box-shadow .15s;z-index:5;box-shadow:0 8px 20px rgba(0,0,0,.3);border-color:#1a73e8;cursor:grabbing}
.ao-r:focus-visible{border-color:#1a73e8}
.ao-nb{flex:none;width:24px;height:24px;border-radius:50%;background:#e8f0fe;color:#1a73e8;font:700 12px/24px system-ui;text-align:center}
.ao-tx{flex:1;font-weight:600;font-size:14px;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ao-gp{color:#9aa0a6;font-size:18px;letter-spacing:-2px;width:34px;height:40px;display:grid;place-items:center;cursor:grab;touch-action:none;margin-left:-4px;border-radius:5px}.ao-gp:hover{background:#eef0f3;color:#1a73e8}
.ao-ab{display:flex;flex-direction:column}
.ao-ab button{appearance:none;border:0;background:transparent;color:#5f6368;width:30px;height:19px;font-size:9px;cursor:pointer;border-radius:3px;line-height:1}
.ao-ab button:hover:not(:disabled){background:#e8eaed;color:#1a73e8}.ao-ab button:disabled{opacity:.3;cursor:default}
`);
const POOL = [['une baleine bleue', 150000], ['un éléphant', 5000], ['une voiture', 1300], ['un piano à queue', 480], ['un humain adulte', 70], ['un chat', 4], ['un melon', 1.5], ['une baguette', .25], ['un smartphone', .18], ['une souris d’ordinateur', .09], ['une mouche', .00001]];
const fmt = (kg) => kg >= 1 ? (kg.toLocaleString('fr-FR') + ' kg') : kg >= .001 ? Math.round(kg * 1000) + ' g' : '≈ ' + (kg * 1e6).toFixed(0) + ' mg';
export default {
  id: 'a_order', tier: 2, title: 'Classement', time: 40000,
  mount(host, api) {
    const { h } = api, desc = api.rng() < .5, N = 5, RH = 46;
    // choose items with ratio >=3 between neighbours
    let pick; do pick = api.shuffle(POOL).slice(0, N).sort((a, b) => b[1] - a[1]); while (pick.some((x, i) => i && pick[i - 1][1] / x[1] < 3));
    const truth = desc ? pick : [...pick].reverse(); let ord = api.shuffle(pick); if (ord.every((x, i) => x === truth[i])) ord = [...ord].reverse();
    const list = h('div', { class: 'ao-l' }); list.style.setProperty('--n', N);
    const rows = new Map();
    ord.forEach((it, i) => {
      const up = h('button', { type: 'button', 'aria-label': 'Monter', tabindex: -1, onclick: (e) => { e.stopPropagation(); move(it, -1); } }, '▲'), dn = h('button', { type: 'button', 'aria-label': 'Descendre', tabindex: -1, onclick: (e) => { e.stopPropagation(); move(it, 1); } }, '▼');
      const nb = h('span', { class: 'ao-nb' }), r = h('div', { class: 'ao-r', tabindex: 0, role: 'listitem', 'aria-label': it[0] }, h('span', { class: 'ao-gp' }, '⋮⋮'), nb, h('span', { class: 'ao-tx' }, it[0][0].toUpperCase() + it[0].slice(1)), h('div', { class: 'ao-ab' }, up, dn));
      r._nb = nb; r._up = up; r._dn = dn; rows.set(it, r); list.append(r);
      r.addEventListener('keydown', (e) => { if (e.key === 'ArrowUp') { move(it, -1); e.preventDefault(); } else if (e.key === 'ArrowDown') { move(it, 1); e.preventDefault(); } });
      r.addEventListener('pointerdown', (e) => {
        if (!e.target.closest('.ao-gp') || e.button) return; const y0 = e.clientY, i0 = ord.indexOf(it); r.setPointerCapture(e.pointerId); r.classList.add('d'); api.sfx('tick');
        const mm = (ev) => { const dy = ev.clientY - y0; r.style.top = Math.max(-4, Math.min((N - 1) * RH + 4, i0 * RH + dy)) + 'px'; const ni = Math.max(0, Math.min(N - 1, Math.round((i0 * RH + dy) / RH))); const cur = ord.indexOf(it); if (ni !== cur) { ord.splice(cur, 1); ord.splice(ni, 0, it); layout(it); api.sfx('click'); } };
        const uu = () => { r.removeEventListener('pointermove', mm); r.removeEventListener('pointerup', uu); r.removeEventListener('pointercancel', uu); r.classList.remove('d'); layout(); };
        r.addEventListener('pointermove', mm); r.addEventListener('pointerup', uu); r.addEventListener('pointercancel', uu);
      });
    });
    function layout(skip) { ord.forEach((it, i) => { const r = rows.get(it); if (it !== skip) r.style.top = i * RH + 'px'; r._nb.textContent = i + 1; r._up.disabled = i === 0; r._dn.disabled = i === N - 1; }); }
    function move(it, d) { const i = ord.indexOf(it), j = i + d; if (j < 0 || j >= N) return; ord.splice(i, 1); ord.splice(j, 0, it); layout(); api.sfx('click'); rows.get(it).focus(); }
    layout();
    const fr = frame(h, { api, id: 'a_order', small: desc ? 'Du plus lourd (en haut) au plus léger' : 'Du plus léger (en haut) au plus lourd', title: 'Classez par poids', note: 'Glissez les lignes, ou ▲▼ / flèches du clavier. On parle de poids moyen, pas de cas particuliers.', body: list, onVerify: check });
    host.append(fr.el);
    if (/cheat=1/.test(location.search)) host.dataset.answer = truth.map((t) => t[0]).join('|');
    function check() {
      const bad = ord.findIndex((x, i) => x !== truth[i]);
      if (bad < 0) { fr.el.classList.add('ak-ok'); return api.solve(); }
      fr.shake();
      // find an adjacent inversion to report
      let m; const inv = ord.findIndex((x, i) => i && (desc ? ord[i - 1][1] < x[1] : ord[i - 1][1] > x[1]));
      if (inv > 0) { const a = ord[inv - 1], b = ord[inv]; const heavy = a[1] > b[1] ? a : b, light = a[1] > b[1] ? b : a; m = `Vous avez placé ${a[0]} avant ${b[0]}. Or ${heavy[0]} pèse ${fmt(heavy[1])} et ${light[0]} ${fmt(light[1])}. Ça se sent à la main.`; }
      else m = 'Le classement est bancal. Vérifiez : même une balance de cuisine y arriverait.';
      api.fail(m);
    }
    return { destroy() {} };
  }
};
