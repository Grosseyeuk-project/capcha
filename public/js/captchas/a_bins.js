import { css, frame } from './a_kit.js';
css('bins', `
.ab-bins{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.ab-bin{position:relative;height:178px;border:2px dashed #b8c0cc;border-radius:6px;padding:30px 5px 5px;display:flex;flex-direction:column;gap:3px;overflow:hidden;background:#fafbfc;transition:border-color .15s,background .15s,transform .15s}
.ab-bin::before{content:attr(data-l);position:absolute;left:0;right:0;top:0;height:25px;line-height:25px;text-align:center;font:800 11px system-ui;letter-spacing:.12em;color:#fff;background:var(--c)}
.ab-bin.over,.ab-bin.tgt{border-style:solid;border-color:var(--c);background:#f0f6ff;transform:scale(1.015)}
.ab-w{width:min(100%,440px)}.ab-pool{margin-top:8px;height:136px;border-radius:6px;background:#f1f3f5;padding:6px;display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:min-content;gap:5px;align-content:start}
.ab-c{font:600 11.5px/1.15 system-ui,sans-serif;padding:6px 9px;border-radius:4px;background:#fff;border:1px solid #c9ccd1;box-shadow:0 1px 2px rgba(0,0,0,.15);cursor:grab;touch-action:none;text-align:left;color:#202124;transition:box-shadow .15s,transform .15s,border-color .15s;animation:ak-pop .3s both}
.ab-c:hover{box-shadow:0 3px 8px rgba(0,0,0,.2)}
.ab-c.sel{border-color:#1a73e8;box-shadow:0 0 0 3px rgba(26,115,232,.3)}
.ab-c.in{font-size:10.5px;padding:3px 6px;width:100%;box-shadow:none;flex:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ab-c.gh{position:fixed;z-index:99999;pointer-events:none;transform:rotate(-3deg) scale(1.05);box-shadow:0 10px 24px rgba(0,0,0,.35);cursor:grabbing;animation:none}
.ab-c.dim{opacity:.35}
`);
const HUM = ['Soupirer devant une imprimante', 'Oublier pourquoi on est entré dans la pièce', 'Dire « ça va » en allant très mal', 'Chercher ses lunettes sur son front', 'Cliquer sur « Plus tard » 14 fois', 'Pleurer devant un dessin animé', 'Avoir peur d’un pigeon', 'Faire semblant de connaître la chanson', 'Regarder son frigo en espérant mieux'];
const ROB = ['Calculer π à mille décimales en 0,2 s', 'Ne jamais dormir', 'Répondre « 01001000 »', 'Fonctionner sur batterie 5 V', 'Avoir un numéro de série gravé', 'Ne jamais se tromper de mot de passe', 'Compter les feux tricolores sans s’ennuyer', 'Rouiller à la pluie', 'Obéir à la première instruction reçue'];
export default {
  id: 'a_bins', tier: 2, title: 'Tri sélectif', time: 45000,
  mount(host, api) {
    const { h } = api, nH = api.int(2, 4), items = api.shuffle([...api.shuffle(HUM).slice(0, nH).map((t) => ({ t, k: 'h' })), ...api.shuffle(ROB).slice(0, 6 - nH).map((t) => ({ t, k: 'r' }))]);
    const place = items.map(() => 'p'); let selected = -1, ghost = null;
    const binH = h('div', { class: 'ab-bin', 'data-l': 'HUMAIN', 'data-b': 'h' }), binR = h('div', { class: 'ab-bin', 'data-l': 'ROBOT', 'data-b': 'r' }); binH.style.setProperty('--c', '#2e7d32'); binR.style.setProperty('--c', '#c62828'); const pool = h('div', { class: 'ab-pool', 'data-b': 'p' });
    const bins = { h: binH, r: binR, p: pool };
    const cards = items.map((it, i) => {
      const c = h('div', { class: 'ab-c', tabindex: 0, role: 'button', 'aria-label': it.t, title: it.t }, it.t);
      c.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') { mv(i, 'h'); e.preventDefault(); } else if (e.key === 'ArrowRight') { mv(i, 'r'); e.preventDefault(); } else if (e.key === 'ArrowDown' || e.key === 'Backspace' || e.key === 'Delete') { mv(i, 'p'); e.preventDefault(); } else if (e.key === 'Enter' || e.key === ' ') { pick(i); e.preventDefault(); } });
      c.addEventListener('pointerdown', (e) => {
        if (e.button) return; const r = c.getBoundingClientRect(), sx = e.clientX, sy = e.clientY, ox = sx - r.left, oy = sy - r.top; let moved = false;
        c.setPointerCapture(e.pointerId);
        const move = (ev) => {
          if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return;
          if (!moved) { moved = true; ghost = c.cloneNode(true); ghost.classList.remove('in'); ghost.classList.add('gh'); ghost.style.width = Math.max(r.width, 150) + 'px'; document.body.append(ghost); c.classList.add('dim'); api.sfx('tick'); }
          ghost.style.left = ev.clientX - ox + 'px'; ghost.style.top = ev.clientY - oy + 'px';
          const t = under(ev); Object.values(bins).forEach((b) => b.classList.toggle('over', b === t && b !== pool));
        };
        const up = (ev) => {
          c.removeEventListener('pointermove', move); c.removeEventListener('pointerup', up); c.removeEventListener('pointercancel', up);
          if (moved) { const t = under(ev); ghost.remove(); ghost = null; c.classList.remove('dim'); Object.values(bins).forEach((b) => b.classList.remove('over')); if (t) mv(i, t.dataset.b); } else pick(i);
        };
        c.addEventListener('pointermove', move); c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
      });
      return c;
    });
    function under(ev) { const e = document.elementFromPoint(ev.clientX, ev.clientY); return e && e.closest && e.closest('[data-b]') && Object.values(bins).includes(e.closest('[data-b]')) ? e.closest('[data-b]') : null; }
    function pick(i) { selected = selected === i ? -1 : i; api.sfx('click'); render(); }
    for (const b of [binH, binR]) b.addEventListener('click', (e) => { if (selected >= 0 && !e.target.closest('.ab-c')) { mv(selected, b.dataset.b); } });
    pool.addEventListener('click', (e) => { if (selected >= 0 && !e.target.closest('.ab-c')) mv(selected, 'p'); });
    function mv(i, to) { place[i] = to; selected = -1; api.sfx('pop'); render(); }
    function render() {
      cards.forEach((c, i) => { c.classList.toggle('in', place[i] !== 'p'); c.classList.toggle('sel', selected === i); c.style.animation = 'none'; bins[place[i]].append(c); });
      binH.classList.toggle('tgt', selected >= 0); binR.classList.toggle('tgt', selected >= 0);
      fr.btn.disabled = place.includes('p');
    }
    const fr = frame(h, { small: 'Glissez chaque carte vers', title: 'Humain ou robot ?', note: 'Glisser-déposer, ou toucher une carte puis un bac. Clavier : ← humain, → robot, ↓ retour.', body: [h('div', { class: 'ab-bins' }, binH, binR), pool], onVerify: check });
    fr.el.classList.add('ab-w'); host.append(fr.el); render();
    if (/cheat=1/.test(location.search)) host.dataset.answer = items.map((x) => x.k).join('');
    function check() {
      const wrong = items.map((it, i) => place[i] !== it.k ? i : -1).filter((i) => i >= 0);
      if (!wrong.length) { fr.el.classList.add('ak-ok'); return api.solve(); }
      fr.shake(); const w = items[wrong[0]]; const who = w.k === 'h' ? 'très humain' : 'très robotique';
      api.fail(`« ${w.t} » ? Franchement, c’est ${who}.` + (wrong.length > 1 ? ` Et ${wrong.length - 1} autre${wrong.length > 2 ? 's' : ''} erreur${wrong.length > 2 ? 's' : ''} du même genre. Vous vous cherchez ?` : ' Une seule erreur, mais c’est la bonne.'));
    }
    return { destroy() { ghost && ghost.remove(); } };
  }
};
