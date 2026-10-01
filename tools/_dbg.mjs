import { chromium } from 'playwright-core';
const [,, url, out, w='1280', h='800', ...steps] = process.argv;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
const p = await (await b.newContext({ viewport: { width: +w, height: +h } })).newPage();
p.on('console', m => ['error','warning'].includes(m.type()) && !/CERT|404/.test(m.text()) && console.log('[c]', m.text()));
p.on('pageerror', e => console.log('[pageerror]', e.message));
await p.goto('http://localhost:8081/'+url); await p.waitForTimeout(1500);
for (const st of steps) { if (st.startsWith('w:')) await p.waitForTimeout(+st.slice(2)); else if (st.startsWith('c:')) await p.click(st.slice(2)); else await p.evaluate(st); }
await p.screenshot({path:out});
await b.close();
