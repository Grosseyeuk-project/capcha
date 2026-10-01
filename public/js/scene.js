import * as THREE from 'three';
export function startScene(canvas) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  const s = new THREE.Scene(), c = new THREE.PerspectiveCamera(60, 1, 0.1, 100); c.position.z = 6;
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 1), new THREE.MeshNormalMaterial({ wireframe: true }));
  s.add(m);
  const rs = () => { r.setSize(innerWidth, innerHeight); c.aspect = innerWidth / innerHeight; c.updateProjectionMatrix(); };
  addEventListener('resize', rs); rs();
  r.setAnimationLoop((t) => { m.rotation.y = t / 4000; m.rotation.x = t / 6000; r.render(s, c); });
  return { pulse() {}, mood() {} };
}
