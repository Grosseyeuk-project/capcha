import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
p.on('pageerror', e => console.log('PAGEERR', e.message));
await p.goto('http://localhost:8095/?cap=a_checkbox&cheat=1', { waitUntil: 'domcontentloaded' });
await p.waitForSelector('.ac-box', { timeout: 60000 }); await p.waitForTimeout(1500);
await p.evaluate(() => { setInterval(() => { const c = window.__game.cur; if (c) c.limit = 1e9; }, 40); window.__log = []; window.addEventListener('pointermove', e => window.__log.push(e.pointerType), true); });
let bb = await p.locator('.ac-box').boundingBox(); let x = bb.x + 15, y = bb.y + 15;
for (let i = 1; i <= 30; i++) { const t = i / 30; await p.mouse.move(300 + (x - 400 - 300) * t + Math.sin(t * 7) * 45, 600 + (y - 600) * t); }
await p.waitForTimeout(800); bb = await p.locator('.ac-box').boundingBox(); x = bb.x + 15; y = bb.y + 15; console.log('box x', bb.x);
for (let i = 1; i <= 30; i++) { const t = i / 30; await p.mouse.move(x - 150 + 150 * t + Math.sin(t * 7) * 40, y + 80 - 80 * t); }
console.log('events', await p.evaluate(() => window.__log.length));
await p.mouse.click(x, y); await p.waitForTimeout(3500);
console.log(await p.evaluate(() => document.querySelector('.ac-st span').textContent), await p.evaluate(() => window.__game.stats.solves));
await b.close();
