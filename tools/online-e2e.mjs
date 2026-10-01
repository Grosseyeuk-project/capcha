// Two real Chromium pages through a full match. node tools/online-e2e.mjs  (server on :8083 must run: PORT=8083 node server/index.js)
import { chromium } from 'playwright-core';
const port = process.env.PORT || 8083, dir = process.env.OUT || '/tmp/olshots'; import fs from 'node:fs'; fs.mkdirSync(dir, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const mk = async (w, h, name) => { const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage(); p.on('pageerror', (e) => console.log(`[${name} pageerror]`, e.message)); p.on('console', (m) => m.type() === 'error' && console.log(`[${name} err]`, m.text())); await p.goto(`http://localhost:${port}/js/online/harness.html?n=6`); await p.waitForTimeout(500); await p.evaluate(() => window.CAPCHA_ONLINE.open()); return p; };
const shot = (p, n) => p.screenshot({ path: `${dir}/${n}.png` });
const A = await mk(1280, 800, 'A'), B = await mk(390, 780, 'B');
await A.fill('input[aria-label=Pseudo]', 'Alice'); await B.fill('input[aria-label=Pseudo]', 'Bob');
await shot(A, '1-menu-desktop'); await shot(B, '1-menu-mobile');
await A.click('text=Créer une salle'); await A.waitForSelector('.ol-code b'); const code = await A.textContent('.ol-code b');
await B.fill('input[aria-label="Code de salle"]', code); await B.click('text=Rejoindre'); await B.waitForSelector('.ol-code b');
await A.click('text=+ Ajouter un bot'); await A.click('text=+ Ajouter un bot'); await B.click('text=Je suis prêt'); await sleep(400);
await shot(A, '2-lobby-desktop'); await shot(B, '2-lobby-mobile');
await A.click('text=Lancer la partie'); await sleep(1500); await shot(A, '3-countdown');
await A.waitForSelector('.ol-rail', { timeout: 9000 }); await sleep(1500);
const solve = (p) => p.evaluate(() => window.CAPCHA_ONLINE.game?.cur?.api.solve());
const fail = (p) => p.evaluate(() => window.CAPCHA_ONLINE.game?.cur?.api.fail('test'));
await solve(A); await sleep(1500); await fail(B); await sleep(900); await solve(A); await sleep(1000);
await shot(A, '4-race-desktop'); await shot(B, '4-race-mobile');
for (let i = 0; i < 4; i++) { await fail(B); await sleep(1300); } await sleep(1500); await shot(B, '5-ghost-mobile');
await fail(A); await sleep(1000); await shot(A, '5-race-fail-desktop');
for (let i = 0; i < 160; i++) { await sleep(800); await solve(A); if (await A.$('.ol-podium')) break; } // solve until the match ends (any length)
await sleep(3000); await shot(A, '6-after-finish');
await A.waitForSelector('.ol-podium', { timeout: 40000 }); await sleep(4000);
await shot(A, '7-end-desktop'); await shot(B, '7-end-mobile');
await A.click('text=Rejouer'); await sleep(800); await shot(A, '8-rematch-lobby');
await b.close(); console.log('done', code);
