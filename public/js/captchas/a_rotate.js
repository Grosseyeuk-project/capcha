import { css, frame } from './a_kit.js';
css('rot', `
.ar-st{position:relative;border-radius:4px;overflow:hidden;background:linear-gradient(180deg,#232a3a,#141824);touch-action:none;cursor:grab}
.ar-st canvas{display:block;width:100%;height:auto}
.ar-lb{position:absolute;top:6px;font:700 10px system-ui;letter-spacing:.12em;color:#9fb0d0;pointer-events:none;text-transform:uppercase}
.ar-dv{position:absolute;left:50%;top:10px;bottom:10px;width:1px;background:rgba(255,255,255,.18)}
.ar-bt{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin-top:8px}
.ar-bt button{height:40px;border:1px solid #c9ccd1;border-radius:4px;background:#fff;font-size:17px;cursor:pointer;color:#1a3d7c;transition:background .12s,transform .08s,border-color .12s;padding:0}
.ar-bt button:hover{background:#e8f0fe;border-color:#1a73e8}.ar-bt button:active{transform:scale(.92)}
`);
// orientation = 3x3 int matrix (row-major). Rotations about world axes by 90deg.
const mul = (a, b) => { const r = Array(9).fill(0); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) r[i * 3 + j] += a[i * 3 + k] * b[k * 3 + j]; return r; };
const RX = [1, 0, 0, 0, 0, -1, 0, 1, 0], RY = [0, 0, 1, 0, 1, 0, -1, 0, 0], RZ = [0, -1, 0, 1, 0, 0, 0, 0, 1];
const T = (m) => [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];
const MOVES = [RX, T(RX), RY, T(RY), RZ, T(RZ)];
const I = [1, 0, 0, 0, 1, 0, 0, 0, 1];
const key = (m) => m.join(',');
const CELLS = [[0, 0, 0, '#e53935'], [1, 0, 0, '#fdd835'], [2, 0, 0, '#43a047'], [2, 1, 0, '#1e88e5'], [0, 1, 0, '#8e24aa'], [0, 0, 1, '#fb8c00']];
export default {
  id: 'a_rotate', tier: 2, title: 'Rotation 3D', time: 50000,
  mount(host, api) {
    const { h, THREE } = api, W = 360, H = 180;
    // all 24 orientations via BFS with distances
    const dist = new Map([[key(I), 0]]), q = [I]; while (q.length) { const m = q.shift(); for (const mv of MOVES) { const n = mul(mv, m), k = key(n); if (!dist.has(k)) { dist.set(k, dist.get(key(m)) + 1); q.push(n); } } }
    const all = [...dist.keys()].map((k) => k.split(',').map(Number));
    const tgt = api.pick(all.filter((m) => dist.get(key(m)) >= 2)); let cur;
    do cur = api.pick(all); while (key(cur) === key(tgt) || distBetween(cur, tgt) < 2);
    function distBetween(a, b) { // number of moves a -> b = dist of (b * a^-1)
      return dist.get(key(mul(b, T(a))));
    }
    let renderer, raf = 0, dead = false;
    const cv = h('canvas', { width: W * 2, height: H * 2, role: 'img', 'aria-label': 'À gauche le modèle cible, à droite votre objet à faire pivoter' });
    const stage = h('div', { class: 'ar-st', tabindex: 0, 'aria-label': 'Zone de rotation : flèches pour pivoter, Q et E pour incliner' }, cv, h('div', { class: 'ar-dv' }), h('span', { class: 'ar-lb', style: { left: '10px' } }, 'Modèle'), h('span', { class: 'ar-lb', style: { right: '10px' } }, 'Votre objet'));
    const bt = h('div', { class: 'ar-bt' });
    const defs = [['↑', 0, 'Basculer vers le haut'], ['↓', 1, 'Basculer vers le bas'], ['←', 2, 'Tourner à gauche'], ['→', 3, 'Tourner à droite'], ['↺', 4, 'Incliner à gauche'], ['↻', 5, 'Incliner à droite']];
    defs.forEach(([t, i, l]) => bt.append(h('button', { type: 'button', 'aria-label': l, title: l, onclick: () => rot(i) }, t)));
    const fr = frame(h, { small: 'Faites pivoter l’objet de droite', title: 'Même orientation', note: 'Chaque cube a sa couleur, donc une seule pose est la bonne. Par quarts de tour.', body: [stage, bt], onVerify: check });
    host.append(fr.el);
    if (/cheat=1/.test(location.search)) { // BFS path for tests
      const par = new Map([[key(cur), null]]), qq = [cur]; let hit = null;
      while (qq.length && !hit) { const m = qq.shift(); if (key(m) === key(tgt)) { hit = m; break; } MOVES.forEach((mv, i) => { const n = mul(mv, m), k = key(n); if (!par.has(k)) { par.set(k, [key(m), i]); qq.push(n); } }); }
      const path = []; let k = key(tgt); while (par.get(k)) { path.unshift(par.get(k)[1]); k = par.get(k)[0]; } host.dataset.answer = path.join(',');
    }
    try {
      renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); renderer.setPixelRatio(1); renderer.setSize(W * 2, H * 2, false); renderer.setScissorTest(true);
    } catch (e) { stage.append(h('div', { style: { color: '#fff', padding: '60px 10px', textAlign: 'center' } }, 'WebGL indisponible.')); }
    const scene = new THREE.Scene(); scene.add(new THREE.AmbientLight(0xffffff, 1.1)); const dl = new THREE.DirectionalLight(0xffffff, 2.2); dl.position.set(3, 5, 4); scene.add(dl);
    const cam = new THREE.PerspectiveCamera(35, 1, 0.1, 50); cam.position.set(3.6, 3.2, 7.4); cam.lookAt(0, 0, 0);
    const geo = new THREE.BoxGeometry(.94, .94, .94), eg = new THREE.EdgesGeometry(geo), mats = [], lm = new THREE.LineBasicMaterial({ color: 0x111111 });
    const mk = () => { const g = new THREE.Group(); const inner = new THREE.Group(); inner.position.set(-.83, -.33, -.17); CELLS.forEach(([x, y, z, c]) => { const m = new THREE.MeshStandardMaterial({ color: c, roughness: .45 }); mats.push(m); const b = new THREE.Mesh(geo, m); b.position.set(x, y, z); b.add(new THREE.LineSegments(eg, lm)); inner.add(b); }); g.add(inner); scene.add(g); return g; };
    const gT = mk(), gP = mk();
    const toQ = (m) => new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().set(m[0], m[1], m[2], 0, m[3], m[4], m[5], 0, m[6], m[7], m[8], 0, 0, 0, 0, 1));
    const qT = toQ(tgt); gT.quaternion.copy(qT); gP.quaternion.copy(toQ(cur));
    let anim = null;
    function frame1() {
      raf = 0; if (dead || !renderer) return;
      if (anim) { const k = Math.min(1, (performance.now() - anim.t0) / (api.reducedMotion ? 1 : 200)), e = 1 - Math.pow(1 - k, 3); gP.quaternion.copy(anim.a).slerp(anim.b, e); if (k >= 1) anim = null; }
      renderer.setViewport(0, 0, W, H * 2); renderer.setScissor(0, 0, W, H * 2); gT.visible = true; gP.visible = false; renderer.render(scene, cam);
      renderer.setViewport(W, 0, W, H * 2); renderer.setScissor(W, 0, W, H * 2); gT.visible = false; gP.visible = true; renderer.render(scene, cam);
      if (anim) raf = requestAnimationFrame(frame1);
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame1); };
    function rot(i) { cur = mul(MOVES[i], cur); anim = { a: gP.quaternion.clone(), b: toQ(cur), t0: performance.now() }; api.sfx('tick'); kick(); }
    kick();
    // drag rotation: every ~44px = one quarter turn
    let dg = null;
    stage.addEventListener('pointerdown', (e) => { dg = { x: e.clientX, y: e.clientY }; stage.setPointerCapture(e.pointerId); });
    stage.addEventListener('pointermove', (e) => { if (!dg) return; const dx = e.clientX - dg.x, dy = e.clientY - dg.y; if (Math.max(Math.abs(dx), Math.abs(dy)) > 40) { if (Math.abs(dx) > Math.abs(dy)) rot(dx > 0 ? 3 : 2); else rot(dy > 0 ? 1 : 0); dg = { x: e.clientX, y: e.clientY }; } });
    stage.addEventListener('pointerup', () => { dg = null; }); stage.addEventListener('pointercancel', () => { dg = null; });
    stage.addEventListener('keydown', (e) => { const k = { ArrowUp: 0, ArrowDown: 1, ArrowLeft: 2, ArrowRight: 3, q: 4, Q: 4, e: 5, E: 5 }[e.key]; if (k != null) { rot(k); e.preventDefault(); } else if (e.key === 'Enter') check(); });
    function check() {
      const n = distBetween(cur, tgt);
      if (n === 0) { fr.el.classList.add('ak-ok'); return api.solve(); }
      fr.shake();
      api.fail(n === 1 ? 'À un seul quart de tour près ! Un. Un seul. C’est presque insultant.' : `Il vous reste au moins ${n} quarts de tour à faire. Cet objet n’est pas dans la bonne pose, et vous non plus.`);
    }
    return { destroy() { dead = true; cancelAnimationFrame(raf); geo.dispose(); eg.dispose(); lm.dispose(); mats.forEach((m) => m.dispose()); renderer && renderer.dispose(); renderer && renderer.forceContextLoss && renderer.forceContextLoss(); } };
  }
};
