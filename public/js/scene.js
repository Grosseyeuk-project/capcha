// Fond Three.js : couloir de portiques de sécurité, tuiles CAPTCHA qui dérivent, poussière, faisceau de scan
// et un Grand Œil au fond. Réagit à la suspicion (erreurs / progression) et à la pression (chrono).
import * as THREE from 'three';

const st = { suspicion: 0, pressure: 0, mood: 'neutral', eyeNy: 0.04, eyeNx: 0, tierBias: 0, tierT: 0, doorMode: 'hidden', doorT: 0, eyeMode: 'normal', eyeLockT: 0, doorFired: false, ts: 1, stepQ: 0, tanHalf: 0.7002, lockRing: 0, eyeScale: 1, flash: 0, flashCol: new THREE.Color(0x2de2c0), boost: 0, shake: 0, beat: 0, blink: 0 };
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const C_CALM = new THREE.Color(0x2de2c0), C_WARN = new THREE.Color(0xffb02e), C_BAD = new THREE.Color(0xff3b4e);
const BG = 0x070b0f;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (x) => Math.max(0, Math.min(1, x));

export const bg = {
  ready: false, get state() { return st; },
  set(o = {}) { Object.assign(st, o); },
  pulse(kind) {
    if (kind === 'good') { st.flashCol.set(0x58ff9c); st.flash = 1; st.boost = 1; }
    else if (kind === 'bad') { st.flashCol.set(0xff2b3d); st.flash = 1; st.shake = 1; }
    else if (kind === 'level') { st.boost = 0.7; st.flashCol.set(0xffd23f); st.flash = 0.5; }
  },
  beat() { st.beat = 1; },
  // Moments de cinéma : changement de palier, victoire (le portail s'ouvre), défaite (l'Œil vous verrouille, le portail se ferme).
  tier(n) { st.tierBias = (Math.max(1, Math.min(5, n)) - 1) / 4; st.tierT = 1; st.flashCol.set(0xffd23f); st.flash = 0.6; st.boost = Math.max(st.boost, 1); },
  win() { st.doorMode = 'opening'; st.doorT = 0; st.doorFired = false; st.eyeMode = 'closed'; st.flashCol.set(0xffffff); st.boost = 1; },
  over() { st.eyeMode = 'lock'; st.eyeLockT = 0; st.doorMode = 'wait'; st.doorT = 0; st.doorFired = false; },
  timeScale(v) { st.ts = v; }, step(sec) { st.stepQ += sec; },
  reset() { st.doorMode = 'hidden'; st.ts = 1; st.stepQ = 0; st.eyeMode = 'normal'; st.tierBias = 0; st.tierT = 0; },
  // place le Grand Œil dans un rectangle d'écran (écran titre) ; null = position par défaut derrière la carte
  eyeTo(rect) { if (!rect) { st.eyeNy = 0.04; st.eyeNx = 0; st.eyeScale = 1; return; } st.eyeNx = (rect.left + rect.width / 2) / innerWidth * 2 - 1; const hh = st.tanHalf * 42; st.eyeNy = 1 - (rect.top + rect.height / 2) / innerHeight * 2; st.eyeScale = Math.max(0.25, rect.height / innerHeight * hh / 9); },
  shake(v = 1) { st.shake = Math.max(st.shake, v); }
};

function glyphTexture(text, seed) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 112;
  const x = c.getContext('2d');
  x.fillStyle = 'rgba(255,255,255,0.08)'; x.fillRect(0, 0, 256, 112);
  x.strokeStyle = '#fff'; x.lineWidth = 4; x.strokeRect(4, 4, 248, 104);
  x.fillStyle = '#fff'; x.font = '900 52px "Courier New", monospace'; x.textBaseline = 'middle';
  for (let i = 0; i < text.length; i++) {
    x.save(); x.translate(26 + i * 52, 56 + Math.sin(seed + i * 2) * 8); x.rotate(Math.sin(seed * 3 + i) * 0.45); x.fillText(text[i], 0, 0); x.restore();
  }
  x.lineWidth = 2;
  for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(0, 20 + ((seed * 37 + i * 31) % 70)); x.bezierCurveTo(80, 10 + i * 30, 160, 100 - i * 20, 256, 30 + ((seed * 13 + i * 17) % 60)); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function startScene(canvas) {
  let r;
  try { r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' }); }
  catch (e) { document.documentElement.classList.add('no-gl'); return bg; }
  r.setClearColor(BG, 1);
  const scene = new THREE.Scene(); scene.fog = new THREE.Fog(BG, 10, 62);
  const cam = new THREE.PerspectiveCamera(70, 1, 0.1, 100);
  const tint = new THREE.Color(C_CALM);

  // portiques
  const GATES = 24, GAP = 3.6, DEPTH = GATES * GAP;
  const frameMat = new THREE.LineBasicMaterial({ color: tint, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });
  const hazMat = new THREE.LineBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending });
  const rect = (w, h) => new THREE.BufferGeometry().setFromPoints([[-w, -h], [w, -h], [w, h], [-w, h]].map(([x, y]) => new THREE.Vector3(x, y, 0)));
  const gGeo = rect(7, 4.2), gGeo2 = rect(7.5, 4.6);
  const gates = [];
  for (let i = 0; i < GATES; i++) {
    const g = new THREE.Group();
    g.add(new THREE.LineLoop(gGeo, i % 6 === 0 ? hazMat : frameMat));
    if (i % 3 === 0) g.add(new THREE.LineLoop(gGeo2, frameMat));
    g.position.z = -i * GAP; scene.add(g); gates.push(g);
  }
  const grid = new THREE.GridHelper(90, 45, 0xffffff, 0xffffff); grid.position.y = -5.2;
  const grid2 = grid.clone(); grid2.position.y = 5.2; 
  [grid, grid2].forEach((g, i) => { g.material = g.material.clone(); g.material.transparent = true; g.material.opacity = i ? 0.1 : 0.22; g.material.color.copy(tint); scene.add(g); });
  grid.position.z = -40; grid2.position.z = -40;

  // tuiles CAPTCHA
  const words = ['7KX2', 'mQ9z', 'R4NB', 'hum4', 'B0T?', 'W8fE', 'ok??', '3Gd5'];
  const texs = words.map((w, i) => glyphTexture(w, i + 1));
  const tileGeo = new THREE.PlaneGeometry(3.4, 1.5);
  const tileMat = texs.map((t) => new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0.8, depthWrite: false, color: tint, side: THREE.DoubleSide }));
  const tiles = [];
  for (let i = 0; i < 22; i++) {
    const m = new THREE.Mesh(tileGeo, tileMat[i % tileMat.length]);
    const side = i % 2 ? 1 : -1;
    m.userData = { nx: side * (0.68 + Math.random() * 0.3), y: (Math.random() - 0.5) * 1.6, z: -10 - Math.random() * 34, rz: (Math.random() - 0.5) * 0.6, sp: 0.6 + Math.random() * 0.8, ph: Math.random() * 9 };
    scene.add(m); tiles.push(m);
  }

  // poussière
  const NP = 520, pp = new Float32Array(NP * 3);
  for (let i = 0; i < NP; i++) { pp[i * 3] = (Math.random() - 0.5) * 24; pp[i * 3 + 1] = (Math.random() - 0.5) * 14; pp[i * 3 + 2] = -Math.random() * DEPTH; }
  const pGeo = new THREE.BufferGeometry(); pGeo.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  const pMat = new THREE.PointsMaterial({ color: tint, size: 0.11, transparent: true, opacity: 0.9, depthWrite: false });
  scene.add(new THREE.Points(pGeo, pMat));

  // faisceau de scan
  const beamMat = new THREE.MeshBasicMaterial({ color: tint, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false });
  const beam = new THREE.Mesh(new THREE.PlaneGeometry(40, 0.12), beamMat); beam.position.z = -14; scene.add(beam);
  const beamGlow = new THREE.Mesh(new THREE.PlaneGeometry(40, 1.4), beamMat.clone()); beamGlow.material.opacity = 0.05; beamGlow.position.z = -14.01; scene.add(beamGlow);

  // le Grand Œil
  const eye = new THREE.Group(); eye.position.set(0, 0.3, -42); scene.add(eye);
  const eyeMat = (c, o) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, fog: false, depthWrite: false });
  const sclera = new THREE.Mesh(new THREE.CircleGeometry(9, 48), eyeMat(0x1a2a30, 0.9)); sclera.scale.set(1.9, 1, 1); eye.add(sclera);
  const rim = new THREE.Mesh(new THREE.RingGeometry(8.8, 9.1, 64), eyeMat(0xffffff, 0.25)); rim.scale.set(1.9, 1, 1); rim.position.z = 0.01; eye.add(rim);
  const iris = new THREE.Group(); iris.position.z = 0.1; eye.add(iris);
  const irisMat = eyeMat(0xffffff, 0.8); irisMat.color = tint;
  iris.add(new THREE.Mesh(new THREE.RingGeometry(2.4, 4.4, 48), irisMat));
  const irisFill = new THREE.Mesh(new THREE.CircleGeometry(4.4, 48), eyeMat(0xffffff, 0.15)); irisFill.material.color = tint; iris.add(irisFill);
  const rays = new THREE.Mesh(new THREE.RingGeometry(1.5, 4.2, 24, 1), new THREE.MeshBasicMaterial({ color: tint, wireframe: true, transparent: true, opacity: 0.5, fog: false })); iris.add(rays);
  const pupil = new THREE.Mesh(new THREE.CircleGeometry(1.7, 32), eyeMat(0x020405, 1)); pupil.position.z = 0.02; iris.add(pupil);
  const glint = new THREE.Mesh(new THREE.CircleGeometry(0.5, 16), eyeMat(0xffffff, 0.9)); glint.position.set(-0.9, 0.9, 0.04); iris.add(glint);
  const lidGeo = new THREE.CircleGeometry(16, 64);
  const lidMat = new THREE.MeshBasicMaterial({ color: BG, fog: false });
  const lidT = new THREE.Mesh(lidGeo, lidMat), lidB = new THREE.Mesh(lidGeo, lidMat); lidT.scale.set(1.5, 1, 1); lidB.scale.set(1.5, 1, 1); lidT.position.z = lidB.position.z = 0.3; eye.add(lidT, lidB);

  // veines injectées de sang (apparaissent avec les paliers / la suspicion)
  const vp = []; for (let i = 0; i < 44; i++) { const a = Math.random() * Math.PI * 2; let rr = 8.6; let x = Math.cos(a) * rr * 1.9, y = Math.sin(a) * rr; for (let j = 0; j < 4; j++) { rr -= 0.9 + Math.random() * 0.8; const a2 = a + (Math.random() - 0.5) * 0.18; const nx = Math.cos(a2) * rr * 1.9, ny = Math.sin(a2) * rr; vp.push(x, y, 0.06, nx, ny, 0.06); x = nx; y = ny; } }
  const veinGeo = new THREE.BufferGeometry(); veinGeo.setAttribute('position', new THREE.Float32BufferAttribute(vp, 3));
  const veinMat = new THREE.LineBasicMaterial({ color: 0xff2b3d, transparent: true, opacity: 0, fog: false }); eye.add(new THREE.LineSegments(veinGeo, veinMat));
  // le Grand Portail (deux battants + lumière)
  const doors = new THREE.Group(); doors.position.z = -15; doors.visible = false; scene.add(doors);
  const doorTex = (flip) => { const c = document.createElement('canvas'); c.width = 256; c.height = 512; const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 256, 0); g.addColorStop(0, '#0b1419'); g.addColorStop(1, '#1d333d'); x.fillStyle = g; x.fillRect(0, 0, 256, 512);
    x.strokeStyle = 'rgba(120,200,210,.35)'; x.lineWidth = 3; for (let i = 1; i < 5; i++) { x.beginPath(); x.moveTo(0, i * 102); x.lineTo(196, i * 102); x.stroke(); }
    x.strokeRect(14, 14, 168, 484); x.fillStyle = 'rgba(150,220,230,.5)'; for (let i = 0; i < 6; i++) for (const bx of [28, 168]) { x.beginPath(); x.arc(bx, 40 + i * 86, 5, 0, 7); x.fill(); }
    x.save(); x.beginPath(); x.rect(196, 0, 60, 512); x.clip(); x.fillStyle = '#ffd23f'; x.fillRect(196, 0, 60, 512); x.fillStyle = '#10202a'; for (let i = -10; i < 24; i++) { x.beginPath(); x.moveTo(190, i * 44); x.lineTo(270, i * 44 - 80); x.lineTo(270, i * 44 - 40); x.lineTo(190, i * 44 + 40); x.fill(); } x.restore();
    if (flip) { const f = document.createElement('canvas'); f.width = 256; f.height = 512; const y = f.getContext('2d'); y.translate(256, 0); y.scale(-1, 1); y.drawImage(c, 0, 0); const t = new THREE.CanvasTexture(f); t.colorSpace = THREE.SRGBColorSpace; t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 2); return t; }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 2); return t; };
  const dGeo = new THREE.PlaneGeometry(8.4, 36);
  const dL = new THREE.Mesh(dGeo, new THREE.MeshBasicMaterial({ map: doorTex(false), fog: false, side: THREE.DoubleSide })), dR = new THREE.Mesh(dGeo, new THREE.MeshBasicMaterial({ map: doorTex(true), fog: false, side: THREE.DoubleSide })); doors.add(dL, dR);
  const dEdge = new THREE.LineSegments(new THREE.EdgesGeometry(dGeo), new THREE.LineBasicMaterial({ color: 0xffffff, fog: false })); dL.add(dEdge); dR.add(dEdge.clone());
  const coreTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); const g = x.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,244,200,.85)'); g.addColorStop(0.6, 'rgba(255,200,90,.25)'); g.addColorStop(1, 'rgba(255,200,90,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256); const t = new THREE.CanvasTexture(c); return t; })();
  const add = { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false };
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshBasicMaterial({ map: coreTex, opacity: 0, ...add })); glow.position.z = -2; doors.add(glow);
  const rayGroup = new THREE.Group(); rayGroup.position.z = -1.5; doors.add(rayGroup); const rayGeo = new THREE.PlaneGeometry(1.1, 70); rayGeo.translate(0, 35, 0);
  const rayMats = []; for (let i = 0; i < 18; i++) { const mt = new THREE.MeshBasicMaterial({ color: 0xfff1c0, opacity: 0, ...add }); rayMats.push(mt); const m = new THREE.Mesh(rayGeo, mt); m.rotation.z = i / 18 * Math.PI * 2; m.scale.x = 0.6 + (i % 3) * 0.6; rayGroup.add(m); }
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 64), new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0, ...add })); ring.position.z = -1; doors.add(ring);
  const ease = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const ptr = { x: 0, y: 0, sx: 0, sy: 0 };
  addEventListener('pointermove', (e) => { ptr.x = e.clientX / innerWidth * 2 - 1; ptr.y = -(e.clientY / innerHeight * 2 - 1); }, { passive: true });
  let lowPower = (navigator.hardwareConcurrency || 8) <= 4 || innerWidth < 700, degrade = lowPower ? 1 : 0;
  const rs = () => {
    r.setPixelRatio(degrade ? 1 : Math.min(devicePixelRatio || 1, 1.5)); r.setSize(innerWidth, innerHeight, false);
    cam.aspect = innerWidth / innerHeight; cam.fov = innerWidth < innerHeight ? 85 : 70; cam.updateProjectionMatrix();
  };
  addEventListener('resize', rs); rs();

  const rootStyle = document.documentElement.style;
  let slowT = 0, slowN = 0, skip = 0;
  const applyDegrade = () => { rs(); pGeo.setDrawRange(0, degrade >= 2 ? 120 : degrade ? 260 : NP); tiles.forEach((t, i) => { t.visible = degrade >= 2 ? i < 6 : degrade ? i < 12 : true; }); if (degrade >= 2) { grid2.visible = false; } };
  applyDegrade();
  let last = performance.now(), tAcc = 0, frame = 0, sx = 0, sy = 0, pup = 1, lid = 0;
  r.setAnimationLoop((now) => {
    const raw = (now - last) / 1000;
    if (degrade < 2 && !document.hidden) { slowT += Math.min(raw, 0.5); slowN++; if (slowN >= 90) { const fps = slowN / slowT; if (fps < 22) { degrade++; applyDegrade(); } slowT = 0; slowN = 0; } }
    if (degrade >= 2 && (skip ^= 1)) return;
    let dt = Math.min(0.05, raw); last = now; if (st.ts !== 1) { if (st.ts === 0) { dt = Math.min(st.stepQ, 1 / 30); st.stepQ -= dt; } else dt *= st.ts; } tAcc += dt; frame++;
    const lock = st.eyeMode === 'lock';
    const m = clamp01(Math.max(lock ? 1 : st.suspicion * 0.9, st.pressure) + st.tierBias * 0.35);
    st.tierT = Math.max(0, st.tierT - dt / 1.3);
    // couleur
    const base = new THREE.Color().copy(C_CALM).lerp(C_WARN, clamp01(m * 2)).lerp(C_BAD, clamp01(m * 2 - 1));
    tint.copy(base).lerp(st.flashCol, st.flash * 0.7);
    st.flash = Math.max(0, st.flash - dt * 2.2); st.boost = Math.max(0, st.boost - dt * 1.4); st.shake = Math.max(0, st.shake - dt * 2.4); st.beat = Math.max(0, st.beat - dt * 5);
    const k = reduced ? 0.2 : 1;
    let speed = (2.2 + m * 5 + st.boost * 18 + st.tierT * 22) * k;
    if (st.doorMode === 'closed' || st.doorMode === 'wait') speed *= st.doorMode === 'closed' ? 0.05 : 0.5;
    gates.forEach((g, i) => {
      g.position.z += speed * dt; if (g.position.z > 3) g.position.z -= DEPTH;
      g.rotation.z = Math.sin(tAcc * 0.6 + i * 0.5) * st.suspicion * 0.22 * k + Math.sin(tAcc * 3 + i * 0.7) * st.tierT * 0.5 * k;
      const s = 1 + st.beat * 0.03 * (1 - (g.position.z + DEPTH) / DEPTH);
      g.scale.set(s, s, 1);
    });
    frameMat.opacity = 0.75 + m * 0.2 + st.flash * 0.3;
    grid.position.z = -40 + ((tAcc * speed) % 2); grid2.position.z = grid.position.z;
    tiles.forEach((t, i) => {
      const u = t.userData; u.z += speed * u.sp * 0.5 * dt; if (u.z > -7) { u.z -= 38; u.y = (Math.random() - 0.5) * 1.6; }
      const hh = Math.tan(cam.fov * Math.PI / 360) * -u.z;
      t.position.set(u.nx * hh * cam.aspect, u.y * hh * 0.8 + Math.sin(tAcc * 0.5 + u.ph) * 0.4, u.z); t.rotation.set(Math.sin(tAcc * 0.3 + u.ph) * 0.2, Math.sin(tAcc * 0.2 + u.ph) * 0.5, u.rz + Math.sin(tAcc * 0.4 + u.ph) * 0.1);
    });
    tileMat.forEach((mt) => { mt.opacity = 0.75 + st.flash * 0.25; });
    const pa = pGeo.attributes.position;
    for (let i = 0; i < NP; i++) { let z = pa.array[i * 3 + 2] + speed * 1.3 * dt; if (z > 3) z -= DEPTH; pa.array[i * 3 + 2] = z; }
    pa.needsUpdate = true;
    pMat.size = 0.11 + st.boost * 0.05;
    beam.position.y = Math.sin(tAcc * (0.5 + m * 1.6)) * 4.6; beamGlow.position.y = beam.position.y;
    // œil
    const closed = st.eyeMode === 'closed';
    const targetLid = closed ? 1 : lock ? 0 : st.tierT > 0.2 ? 0 : st.mood === 'impressed' ? 0 : clamp01(0.08 + st.suspicion * 0.55 + (st.mood === 'angry' ? 0.2 : 0));
    lid = lerp(lid, Math.min(1, targetLid + (st.blink > 0 && !lock && !closed ? 0.9 : 0)), dt * (closed ? 2.2 : 8));
    if (st.blink > 0) st.blink -= dt; else if (Math.random() < dt * 0.18) st.blink = 0.12;
    veinMat.opacity = clamp01(st.tierBias * 1.3 + st.suspicion * 0.5 + (lock ? 0.8 : 0)) * 0.85;
    lidT.position.y = 25.5 - lid * 9.5;
    lidB.position.y = -25.5 + lid * 9.5;
    ptr.sx = lerp(ptr.sx, ptr.x, dt * 3); ptr.sy = lerp(ptr.sy, ptr.y, dt * 3);
    iris.position.x = (lock ? 0 : ptr.sx * 6) + (st.suspicion > 0.6 && !reduced ? Math.sin(tAcc * 23) * 0.15 : 0); iris.position.y = lock ? 0 : ptr.sy * 2.6;
    const pt = lock ? 0.55 : st.mood === 'impressed' ? 1.5 : 1.1 - st.pressure * 0.5 + st.beat * 0.2;
    pup = lerp(pup, pt, dt * 6); pupil.scale.setScalar(pup);
    { const ez = -42, hh = Math.tan(cam.fov * Math.PI / 360) * -ez; const ny = lock ? 0.04 : st.eyeNy, nx = lock ? 0 : st.eyeNx, sc = lock ? 1.75 : st.eyeScale * (1 + st.tierBias * 0.22 + st.tierT * 0.3);
      eye.position.y = lerp(eye.position.y, ny * hh, dt * 5); eye.position.x = lerp(eye.position.x, nx * hh * cam.aspect, dt * 5); eye.scale.setScalar(lerp(eye.scale.x, sc, dt * (lock ? 3 : 5))); }
    // portail : victoire (s'ouvre sur la lumière) / défaite (claque)
    { const dm = st.doorMode; let open = 0, gl = 0, rayO = 0, ringS = 0;
      if (dm === 'opening') { st.doorT += dt / 2.0; const T = Math.min(1, st.doorT); open = ease(Math.max(0, (T - 0.12) / 0.72)); gl = Math.pow(Math.max(0, (T - 0.2) / 0.6), 0.8); rayO = Math.sin(Math.min(1, Math.max(0, (T - 0.2) / 0.7)) * Math.PI) * 0.55; ringS = Math.max(0, (T - 0.45)) * 40; if (!st.doorFired && T > 0.45) { st.doorFired = true; st.flashCol.set(0xfff1c0); st.flash = 1; st.shake = 0.6; } st.boost = Math.max(st.boost, Math.sin(T * Math.PI) * 1.4); if (T >= 1) st.doorMode = 'open'; }
      else if (dm === 'open') { open = 1; gl = 1; rayO = 0.12; }
      else if (dm === 'wait') { st.eyeLockT += dt; open = 1; if (st.eyeLockT >= 1.0) { st.doorMode = 'closing'; st.doorT = 0; } }
      else if (dm === 'closing') { st.doorT += dt / 0.28; const e = Math.min(1, st.doorT); open = 1 - e * e; if (e >= 1) { st.doorMode = 'closed'; st.shake = 1; st.flashCol.set(0xff2b3d); st.flash = 1; } }
      else if (dm === 'closed') { open = 0; }
      doors.visible = dm !== 'hidden';
      const x = 4.2 + open * 13; dL.position.x = -x; dR.position.x = x; glow.material.opacity = Math.min(1, gl); const gs = 0.5 + gl * 1.4; glow.scale.set(gs, gs, 1);
      rayGroup.rotation.z += dt * 0.25; rayMats.forEach((mt) => { mt.opacity = rayO; }); ring.scale.setScalar(Math.max(0.001, ringS)); ring.material.opacity = ringS > 0 ? Math.max(0, 0.45 - ringS / 60) : 0;
      dEdge.material.color.copy(tint); dR.children[0] && dR.children[0].material.color.copy(tint); }
    cam.fov = (innerWidth < innerHeight ? 85 : 70) + st.tierT * 12 * k; cam.updateProjectionMatrix(); st.tanHalf = Math.tan(cam.fov * Math.PI / 360);
    rays.rotation.z += dt * (0.2 + m);
    // caméra
    const sh = st.shake * 0.35 * k;
    sx = (Math.random() - 0.5) * sh; sy = (Math.random() - 0.5) * sh;
    cam.position.set(ptr.sx * 1.4 * k + sx, ptr.sy * 0.8 * k + sy, 0);
    cam.rotation.z = Math.sin(tAcc * 0.3) * 0.02 * k + st.suspicion * 0.04 * Math.sin(tAcc * 0.9) * k;
    cam.lookAt(ptr.sx * -0.8 * k, ptr.sy * -0.4 * k, -20);
    r.render(scene, cam);
    if (frame % 3 === 0) { const hex = '#' + tint.getHexString(); rootStyle.setProperty('--tint', hex); }
  });
  bg.ready = true;
  return bg;
}
