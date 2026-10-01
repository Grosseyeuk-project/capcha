// Real-game balance: drives b_boss phase 2 (stop-the-cursor) in the REAL page with an injected human timing model.
// node tools/balance-real.mjs [--port 8084] [--n 30]   (error = bias + SD*N(0,1) ms on top of perfect anticipation; plus 0-150ms jitter on the decision moment)
import { chromium } from 'playwright-core';
const a = process.argv.slice(2); const opt = (k, d) => { const i = a.indexOf('--' + k); return i > -1 ? a[i + 1] : d; };
const port = opt('port', 8084), N = +opt('n', 30);
const PROFILES = [['rapide (40ms, sd 30)', 40, 30], ['typique (60ms, sd 90)', 60, 90], ['maladroit (90ms, sd 120)', 90, 120]];
const ROBOT = a.includes('--robot');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
if (ROBOT) {
  for (const [name, m, touch] of [['moyen 990ms desktop', 990, false], ['lent 1200ms desktop', 1200, false], ['moyen 990ms tactile', 990, true], ['lent 1200ms tactile', 1200, true]]) {
    let win = 0; const R = +opt('runs', 10);
    for (let r = 0; r < R; r++) {
      const ctx = await b.newContext({ viewport: { width: touch ? 390 : 1280, height: 800 }, hasTouch: touch, isMobile: touch }); const p = await ctx.newPage();
      await p.goto(`http://localhost:${port}/?cap=b_robot&cheat=1`); await p.waitForSelector('.br-start button'); await sleep(500);
      await p.evaluate(() => document.querySelector('.br-start button').click());
      const res = await p.evaluate(({ m }) => new Promise((resolve) => { const randn = () => { let u = 0; while (!u) u = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.2832 * Math.random()); }; let last = null, n = 0;
        const f = () => { if (window.__game.stats.solves > 0 || window.__game.strikes > 0) return resolve(window.__game.stats.solves > 0 ? 'win' : 'lose'); const el = document.querySelector('.br-t'); if (el && el !== last) { last = el; n++; const t = Math.max(120, m * (1 + 0.18 * randn())); setTimeout(() => { if (el.isConnected) { const r = el.getBoundingClientRect(); el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: r.left + 26, clientY: r.top + 26 })); } }, t); } requestAnimationFrame(f); }; f(); }), { m });
      if (res === 'win') win++; await ctx.close();
    }
    console.log(`robot REAL | ${name.padEnd(22)} ${win}/${R}`);
  }
  await b.close(); process.exit(0);
}
for (const [name, bias, sd] of PROFILES) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } }); const p = await ctx.newPage();
  let ok = 0, tot = 0;
  while (tot < N) {
    await p.goto(`http://localhost:${port}/?cap=b_boss&cheat=1&bossphase=2`);
    await p.waitForSelector('.bb-sync', { timeout: 15000 }).catch(() => {}); if (!(await p.$('.bb-sync'))) continue; await sleep(400);
    const r = await p.evaluate(({ bias, sd, N }) => new Promise((res) => {
      const randn = () => { let u = 0; while (!u) u = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.2832 * Math.random()); };
      let ok = 0, tot = 0, late = 0, nl = 0; const host = document.querySelector('.cap-host'); const lab = () => +document.querySelector('.bb-s').textContent.match(/(\d)\/5/)[1];
      const eta = (s) => { let x = s.pos, d = s.dir, t = 0; for (let k = 0; k < 5; k++) { const toZ = (s.zc - x) * d; if (toZ > 0) return t + toZ / s.v; const edge = d > 0 ? 1 : 0; t += Math.abs(edge - x) / s.v; x = edge; d = -d; } return t; };
      const one = () => {
        if (!document.querySelector('.bb-sync') || tot >= N) return res({ ok, tot });
        const s = host.__p2(); const h0 = s.hits; let t = eta(s); if (t < 0.3) t += 2 / s.v; // lead time : on vise le passage suivant
        const when = Math.max(0, t * 1000 + bias + sd * randn() - (nl ? late / nl : 0)); const planned = performance.now() + when;
        setTimeout(() => { late += performance.now() - planned; nl++; if (!document.querySelector('.bb-sync')) return res({ ok, tot }); document.querySelector('.bb-stop').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
          setTimeout(() => { const h1 = document.querySelector('.bb-sync') ? lab() : 5; tot++; if (h1 > h0) ok++; setTimeout(one, 300 + 100 * Math.random()); }, 80); }, when);
      }; one();
    }), { bias, sd, N: N - tot });
    ok += r.ok; tot += r.tot;
  }
  console.log(`boss P2 REAL | ${name.padEnd(26)} succès/essai ${(100 * ok / tot).toFixed(0)}%  (${ok}/${tot})`);
  await ctx.close();
}
await b.close();
