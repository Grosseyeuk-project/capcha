// touch/mobile pass: node tools/a_touch.mjs [--port 8095] [--shots dir]
import { chromium } from 'playwright-core';
const a = process.argv.slice(2); const opt = (k, d) => { const i = a.indexOf('--' + k); return i > -1 ? a[i + 1] : d; };
const port = opt('port', 8096), shots = opt('shots', '/tmp/claude-0/sh');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ids = (a.filter((x) => x.startsWith('a_')).length ? a.filter((x) => x.startsWith('a_')) : ['a_checkbox', 'a_wavy', 'a_grid', 'a_math', 'a_slider', 'a_bins', 'a_order', 'a_rotate']);
for (const id of ids) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 800 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(`http://localhost:${port}/?cap=${id}&cheat=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForFunction((id) => window.__game?.phase === 'play' && window.__game.cur?.def.id === id && document.querySelector('.cap-host')?.children.length, id, { timeout: 60000 });
  await p.evaluate(() => setInterval(() => { const c = window.__game.cur; if (c && !c.done) c.limit = 1e9; }, 40)); await sleep(2600);
  const cdp = await ctx.newCDPSession(p);
  const tap = async (sel, n = 0) => { await p.locator(sel).nth(n).scrollIntoViewIfNeeded(); const bb = await p.locator(sel).nth(n).boundingBox(); await p.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); await sleep(150); };
  const ans = () => p.evaluate(() => document.querySelector('.cap-host').dataset.answer);
  await p.screenshot({ path: `${shots}/m_${id}.png` });
  let ok = false;
  try {
    if (id === 'a_checkbox') { const bb = await p.locator('.ac-box').boundingBox(); const x = bb.x + 15, y = bb.y + 15; await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await sleep(500); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(400); console.log('  early release msg:', await p.locator('.ac-st span').innerText());
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await sleep(1500); await p.screenshot({ path: `${shots}/m_${id}_hold.png` }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
    if (id === 'a_wavy') { await p.locator('.aw-in').fill((await ans()).toLowerCase()); await tap('.ak-btn'); }
    if (id === 'a_grid') { await sleep(6500); for (const i of (await ans()).split(',').map(Number)) await tap('.ag-t', i); await p.screenshot({ path: `${shots}/m_${id}_rule.png` }); await tap('.ak-btn'); }
    if (id === 'a_math') { await p.locator('.am-n').fill(await ans()); await sleep(2300); await tap('.ak-btn'); }
    if (id === 'a_slider') { const tx = +(await ans()); const hb = await p.locator('.as-hd').boundingBox(); const trw = (await p.locator('.as-tr').boundingBox()).width - 46; const x = hb.x + 23, y = hb.y + 22, dx = tx * trw / (340 - 46); await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); for (let k = 1; k <= 10; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + dx * k / 10, y }] }); await sleep(30); } await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(2300); await tap('.ak-btn'); }
    if (id === 'a_bins') { const a = await ans(); const orig0 = await p.locator('.ab-c').allInnerTexts(); for (let i = 0; i < 6; i++) { const card = p.locator('.ab-pool .ab-c').first(); const t = await card.innerText(); const orig = (await p.evaluate(() => 0)); void orig; const k = a[orig0.indexOf(t)]; await card.tap(); await sleep(100); await tap(`.ab-bin[data-b="${k}"]`); await sleep(200); } await p.screenshot({ path: `${shots}/m_${id}_done.png` }); await sleep(2300); await tap('.ak-btn'); }
    if (id === 'a_order') { await p.locator('.ao-r').first().focus(); await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowUp'); await sleep(300); const truth = (await ans()).split('|'); for (let i = 0; i < truth.length; i++) { const cur = await p.evaluate(() => [...document.querySelectorAll('.ao-r')].sort((a, b) => parseFloat(a.style.top) - parseFloat(b.style.top)).map((r) => r.getAttribute('aria-label'))); let j = cur.indexOf(truth[i]); while (j > i) { const row = p.locator('.ao-r').filter({ has: p.locator(`xpath=.`) }).nth(0); void row; const idx = await p.evaluate((n) => [...document.querySelectorAll('.ao-r')].findIndex((r) => r.getAttribute('aria-label') === n), truth[i]); const btn = p.locator('.ao-r').nth(idx).locator('.ao-ab button').first(); await btn.scrollIntoViewIfNeeded(); const bb = await btn.boundingBox(); await p.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); await sleep(250); j--; } } await sleep(2300); await tap('.ak-btn'); }
    if (id === 'a_rotate') { const path = (await ans()).split(',').filter(Boolean).map(Number); for (const m of path) await tap('.ar-bt button', m); await sleep(2300); await tap('.ak-btn'); await sleep(1200); await p.screenshot({ path: `${shots}/m_${id}_pose2.png` }); for (const m of (await ans()).split(',').filter(Boolean).map(Number)) await tap('.ar-bt button', m); await tap('.ak-btn'); }
    await p.waitForFunction(() => window.__game.stats.solves > 0, null, { timeout: 15000 }); ok = true;
  } catch (e) { console.log('  ERR', e.message.split('\n')[0]); }
  console.log(id, ok ? 'SOLVED by touch' : 'NOT solved', errs.length ? errs : '');
  await ctx.close();
}
await b.close();
