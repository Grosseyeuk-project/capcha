import { css, shake } from './b_kit.js';
css('robot', `
.br-arena{position:relative;height:clamp(250px,56vw,300px);border:2px solid var(--ink);background:#0d1b24;background-image:linear-gradient(rgba(45,226,192,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(45,226,192,.1) 1px,transparent 1px);background-size:25px 25px;overflow:hidden;box-shadow:4px 4px 0 var(--ink);cursor:crosshair;touch-action:manipulation;color:#fff}
.br-t{position:absolute;width:52px;height:52px;margin:-26px 0 0 -26px;border-radius:50%;border:0;background:var(--yellow);color:var(--ink);font:800 20px var(--mono);cursor:pointer;padding:0;display:grid;place-items:center;box-shadow:0 0 0 3px var(--ink),0 0 18px rgba(255,210,63,.8);animation:br-in .12s both;z-index:3}
.br-t::before{content:'';position:absolute;inset:-12px;border-radius:50%;border:3px solid #fff;animation:br-ring var(--life) linear forwards;pointer-events:none}
.br-t:hover{background:#fff}
@keyframes br-in{from{transform:scale(.3)}to{transform:scale(1)}}
@keyframes br-ring{from{transform:scale(2.1);border-color:#ff3b4e}to{transform:scale(1);border-color:#2de2c0}}
.br-n{position:absolute;width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;border:2px dashed rgba(255,255,255,.4);color:rgba(255,255,255,.55);font:700 13px var(--mono);display:grid;place-items:center;pointer-events:none}
.br-hud{position:absolute;left:8px;top:6px;font:600 11px var(--mono);color:#7fe9d4;pointer-events:none;letter-spacing:.06em;z-index:4}
.br-start{position:absolute;inset:0;display:grid;place-items:center;z-index:5;background:rgba(13,27,36,.88)}
.br-pop{position:absolute;pointer-events:none;font:800 13px var(--mono);color:#7fe9d4;animation:br-up .6s forwards;z-index:4}
@keyframes br-up{to{transform:translateY(-26px);opacity:0}}
`);
export default {
  id: 'b_robot', tier: 4, title: 'Prouvez que vous êtes un robot', time: 30000,
  mount(host, api) {
    const { h } = api; let alive = true, idx = 0, tStart = 0, life = 1250, running = false, cur = null, nextEl = null, expiry = 0; const N = 10; let sumMs = 0;
    const W = 'AZERQSDFWX'; const keys = api.shuffle(W.split('')).slice(0, N);
    const arena = h('div', { class: 'br-arena', 'aria-label': 'Zone de test de robotitude' });
    const hud = h('div', { class: 'br-hud' }, 'CIBLE 00/' + N), start = h('div', { class: 'br-start' }, h('button', { class: 'bk-btn', type: 'button', onclick: go, autofocus: true }, 'Je suis prêt (robot)'));
    arena.append(hud, start);
    const pips = h('div', { class: 'bk-pips', style: { flexWrap: 'wrap' } }, keys.map(() => h('i', { style: { width: '10px', height: '10px' } })));
    const avg = h('span', {}, 'Temps de réaction moyen : —');
    const rule = h('div', { class: 'bk-rule' }, h('div', {}, h('small', {}, 'Inversion des rôles'), 'Prouvez que vous êtes un ', h('b', {}, 'ROBOT'), ' : ' + N + ' cibles, chacune en moins de ', h('b', {}, '1,2 s'), '. Clic ou touche indiquée. Aucun raté.'));
    const root = h('div', { class: 'bk' }, rule, arena, h('div', { class: 'bk-meta' }, avg, pips)); host.append(root);
    const pts = []; const rect = () => ({ w: arena.clientWidth, h: arena.clientHeight });
    for (let i = 0; i <= N; i++) pts.push([api.rng(), api.rng()]);
    // spread: ensure consecutive points not too far for fairness (<= 55% of width) and not too near
    for (let i = 1; i <= N; i++) { const [x0, y0] = pts[i - 1]; let [x, y] = pts[i]; x = Math.max(0.1, Math.min(0.9, x0 + Math.max(-0.45, Math.min(0.45, x - x0)))); y = Math.max(0.15, Math.min(0.85, y)); if (Math.hypot((x - x0) * 2, y - y0) < 0.3) x = x0 + (x0 > 0.5 ? -0.35 : 0.35); pts[i] = [Math.max(0.1, Math.min(0.9, x)), y]; }
    pts[0] = [0.5, 0.5];
    const place = (el, i) => { const { w, h: hh } = rect(); el.style.left = 28 + pts[i][0] * (w - 56) + 'px'; el.style.top = 28 + pts[i][1] * (hh - 56) + 'px'; };
    function go() {
      if (running) return; start.remove(); running = true; api.timer(20000);
      api.sfx('whoosh'); show(0);
    }
    function show(i) {
      idx = i; if (nextEl) nextEl.remove(); nextEl = null;
      life = Math.max(750, 1250 - i * 55);
      const el = h('button', { class: 'br-t', type: 'button', style: { '--life': life + 'ms' }, 'aria-label': 'Cible ' + keys[i], onpointerdown: (e) => { e.stopPropagation(); e.preventDefault(); hit(); } }, keys[i]);
      place(el, i); arena.append(el); cur = el; tStart = performance.now(); expiry = tStart + life; hud.textContent = `CIBLE ${String(i + 1).padStart(2, '0')}/${N}`;
      if (i + 1 < N) { nextEl = h('div', { class: 'br-n' }, keys[i + 1]); place(nextEl, i + 1); arena.append(nextEl); }
      if (/cheat=1/.test(location.search)) host.dataset.answer = keys[i];
    }
    function hit() {
      if (!running || !cur) return; const ms = performance.now() - tStart; sumMs += ms; api.sfx('click');
      const pop = h('div', { class: 'br-pop', style: { left: cur.style.left, top: cur.style.top } }, Math.round(ms) + ' ms'); arena.append(pop); setTimeout(() => pop.remove(), 650);
      cur.remove(); cur = null; pips.children[idx].classList.add('on'); avg.textContent = `Temps de réaction moyen : ${Math.round(sumMs / (idx + 1))} ms`;
      if (idx + 1 >= N) { running = false; if (nextEl) nextEl.remove(); api.say('Aucun raté. Soit vous êtes un robot, soit vous êtes un humain très entraîné, soit votre souris vous aide.', 'impressed'); setTimeout(() => alive && api.solve(), 250); return; }
      show(idx + 1);
    }
    arena.addEventListener('pointerdown', (e) => {
      if (!running || !cur) return; const r = cur.getBoundingClientRect(), d = Math.round(Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)));
      running = false; shake(root);
      api.fail(d < 60 ? `Raté de ${d} px. Un robot ne rate pas. Vous venez de saigner un peu de l’honneur de votre espèce.` : `Raté de ${d} px. Un robot aurait visé le centre. Vous avez visé « à peu près », la devise humaine.`);
    });
    const key = (e) => { if (!running || !cur || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return; const k = e.key.toUpperCase(); if (k.length !== 1) return; if (k === keys[idx]) { e.preventDefault(); hit(); } else if (W.includes(k)) { running = false; shake(root); api.fail(`Touche ${k} au lieu de ${keys[idx]}. Les doigts humains sont adorables, mais pas ici.`); } };
    window.addEventListener('keydown', key);
    let raf; const loop = (now) => { raf = requestAnimationFrame(loop); if (running && cur && now > expiry) { running = false; const s = ((now - tStart) / 1000).toFixed(1).replace('.', ','); shake(root); api.fail(`Cible ${idx + 1} trop lente : ${s} s. Un robot aurait mis 4 ms. Vous, vous avez hésité, soupiré, probablement cligné des yeux.`); } };
    raf = requestAnimationFrame(loop);
    return { destroy() { alive = false; cancelAnimationFrame(raf); window.removeEventListener('keydown', key); } };
  }
};
