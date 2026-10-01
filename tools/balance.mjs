// Monte Carlo balance check for captchas-b. node tools/balance.mjs
// Models a human as: intended action time + bias + N(0, sd). Numbers mirror the constants in the modules.
const randn = () => { let u = 0, v = 0; while (!u) u = Math.random(); v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.2832 * v); };
const pct = (x) => (100 * x).toFixed(0) + '%';

// ---- b_boss phase 2 : stop-the-cursor (ZW, V identical to b_boss.js) ----
{
  const ZW = [0.16, 0.14, 0.12, 0.10, 0.09], V = [0.70, 0.72, 0.75, 0.78, 0.80], NH = 5, LIMIT = 60;
  for (const [name, bias, sd, vscale] of [['humain typique desktop', 0.06, 0.09, 1], ['humain typique tactile (x0.9)', 0.08, 0.10, 0.9], ['rapide', 0.03, 0.05, 1], ['lent/maladroit', 0.10, 0.14, 1]]) {
    let wins = 0, att = 0, atts = 0, N = 20000, tsum = 0;
    for (let n = 0; n < N; n++) {
      let hits = 0, t = 0, tries = 0, floor = 0;
      while (hits < NH && t < LIMIT) {
        const w = ZW[Math.min(hits, NH - 1)], v = V[Math.min(hits, NH - 1)] * vscale; const e = bias + sd * randn();
        const ok = Math.abs(v * e) <= w / 2; tries++; t += 0.5 / v + 0.9; // attente moyenne + temps de réaction à la nouvelle zone
        if (ok) { hits++; if (hits >= 3) floor = 2; } else hits = Math.max(floor, hits - 1);
      }
      if (hits >= NH) wins++; atts += tries; tsum += t;
    }
    // per-attempt success (moyenne sur les 5 niveaux)
    let ps = 0; for (let k = 0; k < NH; k++) { let ok = 0; for (let i = 0; i < 20000; i++) { const e = bias + sd * randn(); if (Math.abs(V[k] * vscale * e) <= ZW[k] / 2) ok++; } ps += ok / 20000; }
    console.log(`boss P2 | ${name.padEnd(30)} succès/essai ${pct(ps / NH)} | finit en <${LIMIT}s : ${pct(wins / N)} | essais moy ${(atts / N).toFixed(1)} | durée moy ${(tsum / N).toFixed(0)}s`);
  }
}

// ---- b_robot : N cibles, vie par cible, 3 ratés tolérés ----
{
  const N = 10, MISS = 3;
  const lifeDesk = (i) => Math.max(1.25, 1.5 - i * 0.03), lifeTouch = () => 1.6;
  for (const [name, m, cv] of [['rapide (700 ms)', 0.70, 0.18], ['moyen (990 ms)', 0.99, 0.18], ['lent (1,2 s)', 1.2, 0.18], ['très lent (1,4 s)', 1.4, 0.18]]) {
    for (const [dev, life] of [['desktop', lifeDesk], ['tactile', lifeTouch]]) {
      let win = 0, T = 30000;
      for (let n = 0; n < T; n++) {
        let misses = 0, i = 0, ok = true;
        while (i < N) { const t = m * (1 + cv * randn()); if (t <= life(i)) i++; else { misses++; if (misses > MISS) { ok = false; break; } } }
        if (ok) win++;
      }
      console.log(`robot  | ${name.padEnd(20)} ${dev.padEnd(8)} réussite ${pct(win / T)}`);
    }
  }
}
