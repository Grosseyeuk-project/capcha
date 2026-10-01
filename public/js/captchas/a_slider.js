import { css, frame, S, ruleHit, hasRule, coarse, zap } from './a_kit.js';
css('slider', `
.as-st{position:relative;width:100%;aspect-ratio:340/142;border-radius:3px;overflow:hidden;background:#cde}
.as-st canvas{position:absolute;left:0;top:0;width:100%;height:100%;display:block}
.as-pc{will-change:transform;filter:drop-shadow(0 2px 4px rgba(0,0,0,.45))}
.as-rd{display:flex;align-items:center;gap:8px;margin-top:10px;min-height:52px;padding:0 4px;border:1px dashed #c9ccd1;border-radius:6px;font-size:12px;color:#80868b}
.as-rd.on{border-style:solid;border-color:#f9ab00;background:#fff8e1;color:#664d03;animation:ak-pop .3s both}
.as-rm{flex:1;line-height:1.25;padding:4px}
.as-ri{width:34%;min-width:110px;height:44px;border:2px solid #c9ccd1;border-radius:4px;font:700 15px ui-monospace,Menlo,monospace;padding:0 8px;background:#fff;color:#202124}.as-ri:disabled{opacity:.4}.as-ri:focus{outline:0;border-color:#1a73e8}
.as-tr{position:relative;height:44px;margin-top:10px;background:#eef0f3;border:1px solid #d5d8dd;border-radius:22px;touch-action:none}
.as-tr span{position:absolute;inset:0;padding-left:50px;display:grid;place-items:center;font-size:12px;color:#7b8089;pointer-events:none;transition:opacity .2s}
.as-fl{position:absolute;left:0;top:0;bottom:0;border-radius:22px;background:rgba(26,115,232,.18);width:0}
.as-hd{position:absolute;left:0;top:-1px;width:46px;height:44px;border-radius:50%;background:#fff;border:2px solid #1a73e8;display:grid;place-items:center;cursor:grab;touch-action:none;box-shadow:0 2px 6px rgba(0,0,0,.25);transition:box-shadow .15s,background .15s;color:#1a73e8;font-size:18px;font-weight:700;padding:0}
.as-hd:hover{background:#e8f0fe}.as-hd.drag{cursor:grabbing;background:#1a73e8;color:#fff;box-shadow:0 4px 12px rgba(26,115,232,.5)}
`);
export default {
  id: 'a_slider', tier: 2, title: 'Pièce de puzzle', time: 30000,
  mount(host, api) {
    const { h } = api, W = 340, H = 142, P = 46, TAB = 8, tol = 7;
    let tx = api.int(130, W - P - 18); const ty = api.int(30, H - P - 24);
    const scene = document.createElement('canvas'); scene.width = W * 2; scene.height = H * 2; const s = scene.getContext('2d'); s.scale(2, 2);
    const sky = s.createLinearGradient(0, 0, 0, H), hue = api.int(190, 300); sky.addColorStop(0, `hsl(${hue} 70% 62%)`); sky.addColorStop(1, `hsl(${hue - 140} 80% 82%)`); s.fillStyle = sky; s.fillRect(0, 0, W, H);
    s.fillStyle = '#fff8c8'; s.beginPath(); s.arc(api.int(40, 300), api.int(25, 55), 16, 0, 7); s.fill();
    for (let i = 0; i < 5; i++) { s.fillStyle = 'rgba(255,255,255,.75)'; const cx = api.int(0, W), cy = api.int(15, 90); for (let k = 0; k < 4; k++) { s.beginPath(); s.arc(cx + k * 12, cy + (k % 2) * -5, api.int(9, 15), 0, 7); s.fill(); } }
    for (let l = 0; l < 3; l++) { s.fillStyle = `hsl(${hue - 20 + l * 20} ${50 - l * 8}% ${62 - l * 11}%)`; s.beginPath(); s.moveTo(0, H); let x = 0; while (x <= W + 40) { s.lineTo(x, H - 40 - l * 20 - api.rng() * 50); x += api.int(25, 50); } s.lineTo(W, H); s.fill(); }
    for (let i = 0; i < 12; i++) { s.fillStyle = `hsla(${api.int(0, 360)} 80% 60% / .55)`; s.beginPath(); s.arc(api.rng() * W, api.rng() * H, api.int(2, 6), 0, 7); s.fill(); }
    const path = (c, ox, oy) => { c.beginPath(); c.moveTo(ox, oy); c.lineTo(ox + P / 2 - 7, oy); c.arc(ox + P / 2, oy, 7, Math.PI, Math.PI * 2); c.lineTo(ox + P, oy); c.lineTo(ox + P, oy + P); c.lineTo(ox, oy + P); c.closePath(); };
    const bg = h('canvas', { width: W * 2, height: H * 2 }), pc = h('canvas', { class: 'as-pc', width: W * 2, height: H * 2 });
    const g = bg.getContext('2d'), q = pc.getContext('2d');
    function paint() {
      g.clearRect(0, 0, W * 2, H * 2); q.clearRect(0, 0, W * 2, H * 2);
      g.drawImage(scene, 0, 0); g.save(); g.scale(2, 2); path(g, tx, ty); g.fillStyle = 'rgba(0,0,0,.42)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1.5; g.stroke(); g.restore();
      q.save(); q.scale(2, 2); path(q, tx, ty); q.clip(); q.drawImage(scene, 0, 0, W, H); q.restore();
      q.save(); q.scale(2, 2); path(q, tx, ty); q.strokeStyle = 'rgba(255,255,255,.95)'; q.lineWidth = 2; q.stroke(); q.restore();
    }
    paint();
    // piece canvas holds the clipped content at x=tx; shift it to start at 0 via translate offset
    let val = 0; const max = W - P - 0; // slider range in canvas px: offset applied to canvas translateX = val - tx
    const stage = h('div', { class: 'as-st' }, bg, pc);
    const hd = h('button', { class: 'as-hd', type: 'button', role: 'slider', 'aria-label': 'Faire glisser la pièce', 'aria-valuemin': 0, 'aria-valuemax': W - P, 'aria-valuenow': 0, 'aria-orientation': 'horizontal' }, '→');
    const fill = h('div', { class: 'as-fl' }), hint = h('span', {}, 'Faites glisser pour compléter le puzzle');
    const tr = h('div', { class: 'as-tr' }, fill, hint, hd);
    const wordRev = [...(S.word || 'PUZZLE')].reverse().join('').toLowerCase();
    const redoMsg = h('span', { class: 'as-rm' }, 'Le greffier prépare un rectificatif…');
    const redoIn = h('input', { class: 'as-ri', type: 'text', autocomplete: 'off', autocapitalize: 'none', autocorrect: 'off', spellcheck: 'false', disabled: '', 'aria-label': 'Mot retapé à l’envers', placeholder: '…', oninput: () => { const b = /[A-ZÀ-Ý]/.test(redoIn.value); redoIn.classList.toggle('ak-viol', b); if (b) zap(h, redoIn, 'MAJUSCULE !'); fr.rule('R1', b ? 'bad' : 'ok'); } });
    const redo = h('div', { class: 'as-rd' }, redoMsg, redoIn);
    let twisted = false, tmr = 0;
    function twist() {
      if (twisted) return; twisted = true; clearTimeout(tmr);
      const old = tx; do tx = api.int(110, W - P - 18); while (Math.abs(tx - old) < 50); paint(); set(val);
      stage.animate([{ filter: 'brightness(1.8)' }, { filter: 'none' }], { duration: 500 });
      redo.classList.add('on'); redoIn.disabled = false; redoMsg.textContent = 'Pièce 2 annulée. Retapez « ' + (S.word || 'PUZZLE').toLowerCase() + ' » à l’envers :';
      fr.addChip('R★ pièce 2 annulée', 'bad'); fr.banner('Rectificatif : travaux sur le puzzle, le trou a bougé. Et votre réponse à la pièce 2 est annulée : retapez le mot à l’envers, en minuscules.', 'warn', 8000); api.say('Rectificatif de dernière minute. Le trou a déménagé, et la pièce 2 est invalidée. Je suis désolé. Non, en fait.', 'smug'); api.sfx('whoosh');
      if (/cheat=1/.test(location.search)) { host.dataset.answer = tx; host.dataset.redo = wordRev; }
    }
    tmr = setTimeout(twist, 9000);
    const fr = frame(h, { api, id: 'a_slider', small: 'Complétez l’image', title: 'Replacez la pièce', note: 'Précision : ±' + tol + ' px. Un robot ferait ±0. Soyez humain, pas trop.', body: [stage, tr, redo], onVerify: check });
    fr.el.style.maxWidth = '400px'; host.append(fr.el);
    const cheatOn = /cheat=1/.test(location.search); if (cheatOn) host.dataset.answer = tx;
    function set(v) { const k = stage.clientWidth / W; val = Math.max(0, Math.min(W - P, v)); pc.style.transform = `translateX(${(val - tx) * k}px)`; const trw = tr.clientWidth - 46; hd.style.left = (val / (W - P)) * trw + 'px'; fill.style.width = (val / (W - P)) * trw + 23 + 'px'; hd.setAttribute('aria-valuenow', Math.round(val)); if (val > 4) hint.style.opacity = 0; }
    set(0);
    let drag = null;
    hd.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, v: val }; hd.setPointerCapture(e.pointerId); hd.classList.add('drag'); api.sfx('tick'); });
    hd.addEventListener('pointermove', (e) => { if (!drag) return; if (!twisted && Math.abs(e.clientX - drag.x) > 14) twist(); const trw = tr.clientWidth - 46; set(drag.v + (e.clientX - drag.x) / trw * (W - P)); });
    const up = () => { drag = null; hd.classList.remove('drag'); };
    hd.addEventListener('pointerup', up); hd.addEventListener('pointercancel', up);
    hd.addEventListener('keydown', (e) => { const st = e.shiftKey ? 12 : 2; if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { set(val + st); e.preventDefault(); } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { set(val - st); e.preventDefault(); } else if (e.key === 'Enter') check(); });
    tr.addEventListener('pointerdown', (e) => { if (e.target === hd) return; const r = tr.getBoundingClientRect(); set((e.clientX - r.left - 23) / (r.width - 46) * (W - P)); });
    function check() {
      if (!twisted) twist();
      const rv = redoIn.value.trim();
      if (rv && rv !== rv.toLowerCase()) return void ruleHit(api, fr, 'R1', 'Règle 1 : minuscules, même à l’envers.');
      const d = val - tx;
      if (Math.abs(d) <= tol && rv.normalize('NFD').replace(/[\u0300-\u036f]/g, '') !== wordRev) { fr.shake(); return api.fail(!rv ? 'Le rectificatif ! Il fallait retaper « ' + (S.word || 'PUZZLE').toLowerCase() + ' » à l’envers. Les rectificatifs, on les lit.' : `« ${rv} » ? À l’envers, « ${(S.word || 'PUZZLE').toLowerCase()} » donne « ${wordRev} ». Lisez de droite à gauche, comme en hébreu, mais en français.`); }
      if (Math.abs(d) <= tol) { fr.el.classList.add('ak-ok'); return api.solve(); }
      fr.shake(); const a = Math.round(Math.abs(d));
      let m;
      if (val < 3) m = 'La pièce n’a pas bougé. Vous espériez qu’elle se range seule ? Ce n’est pas un robot, c’est un puzzle.';
      else if (a <= 12) m = `${a} px ${d < 0 ? 'trop à gauche' : 'trop à droite'}. C’est le genre d’erreur qu’un humain fait. Trop humain, même.`;
      else if (d < 0) m = `Pièce ${a} px trop à gauche. Le trou est plus loin, il vous attend avec impatience.`;
      else m = `Pièce ${a} px trop à droite. Vous l’avez rangée dans le mur d’à côté.`;
      api.fail(m);
    }
    const ro = new ResizeObserver(() => set(val)); ro.observe(stage);
    return { destroy() { ro.disconnect(); clearTimeout(tmr); } };
  }
};
