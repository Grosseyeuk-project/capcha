// Usage: node tools/shot.mjs "<path?query>" out.png [--w 1280] [--h 800] [--wait 1200] [--js "code run in page before shot"] [--port 8080] [--video]
// Starts nothing: run `npm start` first (PORT env). Also prints console errors.
import { chromium } from 'playwright-core';
const a = process.argv.slice(2);
const url = a[0], out = a[1];
const opt = (k, d) => { const i = a.indexOf('--' + k); return i > -1 ? a[i + 1] : d; };
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await (await b.newContext({ viewport: { width: +opt('w', 1280), height: +opt('h', 800) } })).newPage();
p.on('console', (m) => ['error', 'warning'].includes(m.type()) && console.log('[console.' + m.type() + ']', m.text()));
p.on('pageerror', (e) => console.log('[pageerror]', e.message));
await p.goto(`http://localhost:${opt('port', 8080)}/${url}`);
await p.waitForTimeout(+opt('wait', 1200));
if (opt('js')) { await p.evaluate(opt('js')); await p.waitForTimeout(+opt('wait2', 800)); }
await p.screenshot({ path: out });
await b.close();
console.log('saved', out);
