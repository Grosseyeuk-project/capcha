// Fond Three.js : couloir de portiques de sécurité, tuiles CAPTCHA qui dérivent, poussière, faisceau de scan
// et un Grand Œil au fond. Réagit à la suspicion (erreurs / progression) et à la pression (chrono).
import * as THREE from 'three';

const st = { suspicion: 0, pressure: 0, mood: 'neutral', eyeNy: 0.04, eyeScale: 1, flash: 0, flashCol: new THREE.Color(0x2de2c0), boost: 0, shake: 0, beat: 0, blink: 0 };
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
  // place le Grand Œil dans un rectangle d'écran (écran titre) ; null = position par défaut derrière la carte
  eyeTo(rect) { if (!rect) { st.eyeNy = 0.04; st.eyeScale = 1; return; } const hh = Math.tan(35 * Math.PI / 180) * 42; st.eyeNy = 1 - (rect.top + rect.height / 2) / innerHeight * 2; st.eyeScale = Math.max(0.25, rect.height / innerHeight * hh / 9); },
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

  const ptr = { x: 0, y: 0, sx: 0, sy: 0 };
  addEventListener('pointermove', (e) => { ptr.x = e.clientX / innerWidth * 2 - 1; ptr.y = -(e.clientY / innerHeight * 2 - 1); }, { passive: true });
  const rs = () => {
    r.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5)); r.setSize(innerWidth, innerHeight, false);
    cam.aspect = innerWidth / innerHeight; cam.fov = innerWidth < innerHeight ? 85 : 70; cam.updateProjectionMatrix();
  };
  addEventListener('resize', rs); rs();

  const rootStyle = document.documentElement.style;
  let last = performance.now(), tAcc = 0, frame = 0, sx = 0, sy = 0, pup = 1, lid = 0;
  r.setAnimationLoop((now) => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; tAcc += dt; frame++;
    const m = clamp01(Math.max(st.suspicion * 0.9, st.pressure));
    // couleur
    const base = new THREE.Color().copy(C_CALM).lerp(C_WARN, clamp01(m * 2)).lerp(C_BAD, clamp01(m * 2 - 1));
    tint.copy(base).lerp(st.flashCol, st.flash * 0.7);
    st.flash = Math.max(0, st.flash - dt * 2.2); st.boost = Math.max(0, st.boost - dt * 1.4); st.shake = Math.max(0, st.shake - dt * 2.4); st.beat = Math.max(0, st.beat - dt * 5);
    const k = reduced ? 0.2 : 1;
    const speed = (2.2 + m * 5 + st.boost * 18) * k;
    gates.forEach((g, i) => {
      g.position.z += speed * dt; if (g.position.z > 3) g.position.z -= DEPTH;
      g.rotation.z = Math.sin(tAcc * 0.6 + i * 0.5) * st.suspicion * 0.22 * k;
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
    const targetLid = st.mood === 'impressed' ? 0 : clamp01(0.08 + st.suspicion * 0.55 + (st.mood === 'angry' ? 0.2 : 0));
    lid = lerp(lid, targetLid + (st.blink > 0 ? 0.9 : 0), dt * 8);
    if (st.blink > 0) st.blink -= dt; else if (Math.random() < dt * 0.18) st.blink = 0.12;
    lidT.position.y = 25.5 - lid * 9.5;
    lidB.position.y = -25.5 + lid * 9.5;
    ptr.sx = lerp(ptr.sx, ptr.x, dt * 3); ptr.sy = lerp(ptr.sy, ptr.y, dt * 3);
    iris.position.x = ptr.sx * 6 + (st.suspicion > 0.6 && !reduced ? Math.sin(tAcc * 23) * 0.15 : 0); iris.position.y = ptr.sy * 2.6;
    const pt = st.mood === 'impressed' ? 1.5 : 1.1 - st.pressure * 0.5 + st.beat * 0.2;
    pup = lerp(pup, pt, dt * 6); pupil.scale.setScalar(pup);
    { const ez = -42, hh = Math.tan(cam.fov * Math.PI / 360) * -ez; eye.position.y = lerp(eye.position.y, st.eyeNy * hh, dt * 5); eye.position.x = 0; const k2 = lerp(eye.scale.x, st.eyeScale, dt * 5); eye.scale.setScalar(k2); }
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
