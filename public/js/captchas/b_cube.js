import { css, shake } from './b_kit.js';
css('cube', `
.bc-wrap{position:relative;border:2px solid var(--ink);background:radial-gradient(circle at 50% 45%,#27485a,#0d1b24);box-shadow:4px 4px 0 var(--ink);height:clamp(250px,60vw,300px);touch-action:none;cursor:grab;overflow:hidden;outline-offset:3px}
.bc-wrap.drag{cursor:grabbing}
.bc-wrap canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.bc-ring{position:absolute;left:50%;top:50%;width:min(76%,230px);aspect-ratio:1;transform:translate(-50%,-50%);border-radius:14px;border:3px dashed rgba(255,255,255,.55);pointer-events:none;transition:border-color .15s,box-shadow .15s}
.bc-ring::before{content:'▲ HAUT';position:absolute;left:50%;top:-22px;transform:translateX(-50%);font:700 10px var(--mono);color:rgba(255,255,255,.7);letter-spacing:.1em;white-space:nowrap}
.bc-wrap.ok .bc-ring{border-color:var(--green);border-style:solid;box-shadow:0 0 22px var(--green),inset 0 0 22px rgba(45,226,192,.35)}
.bc-wrap.ok .bc-ring::before{color:var(--green);content:'▲ VERROUILLÉ'}
.bc-ctl{display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap}
.bc-roll{display:flex;gap:6px}.bc-roll .bk-btn{padding:6px 12px;min-height:40px;font-size:18px}
.bc-read{font:600 11px var(--mono);min-height:16px;text-transform:uppercase;letter-spacing:.06em}
.bc-fallback{padding:30px 14px;font:700 14px var(--display);text-align:center;color:#fff}
`);
const LET = ['F', 'R', 'G', 'J', 'P', 'Q', 'L', 'K'];
// face order of BoxGeometry: +x,-x,+y,-y,+z,-z ; local normal and texture-up
const FN = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const FU = [[0, 1, 0], [0, 1, 0], [0, 0, -1], [0, 0, 1], [0, 1, 0], [0, 1, 0]];
const COL = ['#ffd23f', '#9ee7d0', '#ff9a8b', '#a9c8ff', '#e8c2ff', '#ffe0a3'];
export default {
  id: 'b_cube', tier: 5, title: 'Dé truqué en 3D', time: 45000,
  mount(host, api) {
    const { h, THREE } = api;
    const letters = api.shuffle(LET).slice(0, 5), target = letters[0];
    const assign = api.shuffle([target, target + '!', ...letters.slice(1, 5)]); // face index -> label ('!' = miroir)
    const tIdx = assign.indexOf(target), dIdx = assign.indexOf(target + '!');
    const read = h('div', { class: 'bc-read', 'aria-live': 'polite' }, 'Faites tourner le dé.');
    const wrap = h('div', { class: 'bc-wrap', tabindex: 0, role: 'application', 'aria-label': 'Dé 3D. Flèches pour tourner, Q et E pour pivoter.' });
    const rule = h('div', { class: 'bk-rule' }, h('div', {}, h('small', {}, 'Vérification volumétrique'), 'Placez la face « ', h('b', {}, target), ' » ', h('b', {}, 'à l’endroit'), ', face à vous, dans le cadre. Pas la version miroir.'));
    const btn = h('button', { class: 'bk-btn', type: 'button', onclick: check }, 'Valider');
    const rl = h('button', { class: 'bk-btn', type: 'button', 'aria-label': 'Pivoter à gauche', onclick: () => roll(1) }, '↺'), rr = h('button', { class: 'bk-btn', type: 'button', 'aria-label': 'Pivoter à droite', onclick: () => roll(-1) }, '↻');
    const ctl = h('div', { class: 'bc-ctl' }, h('div', { class: 'bc-roll' }, rl, rr), read, btn);
    const root = h('div', { class: 'bk' }, rule, wrap, ctl); host.append(root);
    let renderer, scene, cam, cube, geo, mats = [], texs = [], alive = true, dirty = true, raf;
    const q = new THREE.Quaternion();
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
      wrap.append(renderer.domElement, h('div', { class: 'bc-ring' }));
    } catch (e) { wrap.append(h('div', { class: 'bc-fallback' }, 'Votre carte graphique a refusé le dé. Gérard est vexé et vous laisse passer.')); setTimeout(() => api.solve(), 1800); return { destroy() { alive = false; } }; }
    scene = new THREE.Scene(); cam = new THREE.PerspectiveCamera(34, 1, 0.1, 50); cam.position.set(0, 0, 6.2);
    scene.add(new THREE.AmbientLight(0xffffff, 0.85)); const dl = new THREE.DirectionalLight(0xffffff, 0.7); dl.position.set(2, 3, 5); scene.add(dl);
    const mk = (label, i) => {
      const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
      g.fillStyle = COL[i]; g.fillRect(0, 0, 256, 256); g.strokeStyle = '#10202a'; g.lineWidth = 12; g.strokeRect(6, 6, 244, 244);
      g.fillStyle = '#10202a'; g.font = '800 190px "Bricolage Grotesque",Arial Black,Arial,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      const mir = label.endsWith('!'); g.save(); g.translate(128, 138); if (mir) g.scale(-1, 1); g.fillText(label[0], 0, 0); g.restore();
      const t = new THREE.CanvasTexture(c); t.anisotropy = 4; if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace; texs.push(t);
      const m = new THREE.MeshLambertMaterial({ map: t }); mats.push(m); return m;
    };
    geo = new THREE.BoxGeometry(2, 2, 2); cube = new THREE.Mesh(geo, assign.map(mk)); scene.add(cube);
    // initial orientation: far from solution
    const solved = () => { const s = solveQuat(); return s; };
    function faceAxes() { const n = new THREE.Vector3(...FN[tIdx]), u = new THREE.Vector3(...FU[tIdx]); return { n, u }; }
    function solveQuat() { // quaternion that puts target face toward +z with up=+y
      const { n, u } = faceAxes(); const m = new THREE.Matrix4(); const r = new THREE.Vector3().crossVectors(u, n); // basis: local (r,u,n) -> world (x,y,z)
      m.makeBasis(r, u, n).transpose(); return new THREE.Quaternion().setFromRotationMatrix(m);
    }
    const S = solveQuat();
    do { q.set(api.rng() - .5, api.rng() - .5, api.rng() - .5, api.rng() - .5).normalize(); } while (q.angleTo(S) < 1.6);
    function metrics() {
      const { n, u } = faceAxes(); const nw = n.clone().applyQuaternion(q), uw = u.clone().applyQuaternion(q);
      const face = Math.acos(Math.max(-1, Math.min(1, nw.z))) * 57.2958;
      const up = Math.abs(Math.atan2(uw.x, uw.y)) * 57.2958;
      return { face, up, okFace: face < 14, okUp: up < 14 };
    }
    function visible() { // which face points to camera
      let best = -2, bi = 0; FN.forEach((f, i) => { const z = new THREE.Vector3(...f).applyQuaternion(q).z; if (z > best) { best = z; bi = i; } }); return bi;
    }
    function apply() {
      cube.quaternion.copy(q); dirty = true; const m = metrics(); wrap.classList.toggle('ok', m.okFace && m.okUp);
      const vi = visible(), lab = assign[vi];
      read.textContent = (m.okFace && m.okUp) ? 'Cadre verrouillé — validez.' : `Face visible : ${lab[0]}${lab.endsWith('!') ? ' (miroir)' : ''}`;
    }
    const rot = (ax, ay, az, ang) => { const d = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(ax, ay, az).normalize(), ang); q.premultiply(d); q.normalize(); apply(); };
    const roll = (s) => { rot(0, 0, 1, s * 0.2618); api.sfx('tick'); };
    let drag = null;
    wrap.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY }; wrap.setPointerCapture(e.pointerId); wrap.classList.add('drag'); wrap.focus({ preventScroll: true }); });
    wrap.addEventListener('pointermove', (e) => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag = { x: e.clientX, y: e.clientY }; const L = Math.hypot(dx, dy); if (L) rot(dy, dx, 0, L * 0.012); });
    const up = () => { drag = null; wrap.classList.remove('drag'); }; wrap.addEventListener('pointerup', up); wrap.addEventListener('pointercancel', up);
    const key = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return; const st = 0.2618; let ok = true;
      if (e.key === 'ArrowLeft') rot(0, -1, 0, st); else if (e.key === 'ArrowRight') rot(0, 1, 0, st); else if (e.key === 'ArrowUp') rot(-1, 0, 0, st); else if (e.key === 'ArrowDown') rot(1, 0, 0, st);
      else if (e.key === 'q' || e.key === 'Q') roll(1); else if (e.key === 'e' || e.key === 'E') roll(-1); else ok = false;
      if (ok) { e.preventDefault(); }
    };
    window.addEventListener('keydown', key);
    function size() { const w = wrap.clientWidth, hh = wrap.clientHeight; renderer.setSize(w, hh, false); cam.aspect = w / hh; cam.updateProjectionMatrix(); dirty = true; }
    const ro = new ResizeObserver(size); ro.observe(wrap); size(); apply();
    const loop = () => { raf = requestAnimationFrame(loop); if (dirty) { dirty = false; renderer.render(scene, cam); } }; raf = requestAnimationFrame(loop);
    function check() {
      const m = metrics(); const vi = visible(), lab = assign[vi];
      if (m.okFace && m.okUp) { api.sfx('good'); return api.solve(); }
      shake(root);
      if (lab[0] === target && lab.endsWith('!')) return api.fail(`C’est le « ${target} » en MIROIR. Regardez la boucle : elle est à l’envers. Le dé a un jumeau maléfique, vous venez de le valider.`);
      if (lab[0] !== target || m.face > 45) return api.fail(`Face visible : « ${lab[0]} ». Vous deviez montrer le « ${target} ». Le dé n’est pas un décor, il a un avis sur la question.`);
      if (!m.okUp) return api.fail(`Bonne face, mauvais sens : ${Math.round(m.up)}° de travers. Un « ${target} » couché, c’est un autre caractère. Penchez la tête si vous voulez, pas le dé.`);
      api.fail(`Face à ${Math.round(m.face)}° du cadre. Presque ! Presque, ça ne se valide pas. Même au pays du dé.`);
    }
    if (/cheat=1/.test(location.search)) { host.dataset.answer = target; host.__solve = () => { q.copy(S); apply(); }; host.__qget = () => q.toArray(); host.__mirror = () => { q.copy(S); const dq = new THREE.Quaternion(); const nn = new THREE.Vector3(...FN[dIdx]), uu = new THREE.Vector3(...FU[dIdx]); const r = new THREE.Vector3().crossVectors(uu, nn); const m = new THREE.Matrix4().makeBasis(r, uu, nn).transpose(); q.setFromRotationMatrix(m); apply(); }; }
    return { destroy() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener('keydown', key); try { geo.dispose(); mats.forEach((m) => m.dispose()); texs.forEach((t) => t.dispose()); renderer.dispose(); renderer.forceContextLoss?.(); } catch (e) { /* ignore */ } } };
  }
};
