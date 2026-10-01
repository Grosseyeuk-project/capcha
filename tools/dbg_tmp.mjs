import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const p = await b.newPage(); p.on('pageerror', (e) => console.log('ERR', e.message));
await p.goto('http://localhost:8084/?cap=b_loading&cheat=1'); await p.waitForTimeout(1500);
let done = 0, t0 = Date.now();
await p.exposeFunction('log', (m) => console.log(((Date.now() - t0) / 1000).toFixed(1), m));
await p.evaluate(() => { const bar = document.querySelector('.bl-bar'); let last = ''; const f = () => { const s = bar.className + '|' + bar.textContent + '|' + document.querySelector('.bk-meta span').textContent + '|strikes' + window.__game.strikes; if (s !== last && /real|fake|Étape|strikes[1-9]/.test(s) !== undefined) { if (/real|fake/.test(s) !== /real|fake/.test(last) || s.split('|')[2] !== last.split('|')[2]) window.log(s); last = s; } requestAnimationFrame(f); }; f(); document.querySelector('.bl-go').addEventListener('click', () => window.log('CLICK ' + document.querySelector('.bl-bar').textContent)); });
await p.waitForTimeout(40000);
await b.close();
