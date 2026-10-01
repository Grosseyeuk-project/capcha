// Scripted solve/fail test for captchas-a.  node tools/a_test.mjs [id...] [--port 8082] [--w 1280 --h 800] [--shots dir]
import { chromium } from 'playwright-core';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i > -1 ? args[i + 1] : d; };
const port = opt('port', 8093), W = +opt('w', 1280), H = +opt('h', 800), shots = opt('shots', '');
const ids = args.filter((a, i) => !a.startsWith('--') && !(i && args[i - 1].startsWith('--') && args[i - 1] !== '--mobile'));
const ALL = ['a_checkbox', 'a_wavy', 'a_grid', 'a_math', 'a_slider', 'a_bins', 'a_order', 'a_rotate'];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function run(id) {
  const ctx = await b.newContext({ viewport: { width: W, height: H }, hasTouch: false });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && !/404/.test(m.text()) && errs.push(m.text()));
  await p.goto(`http://localhost:${port}/?cap=${id}&cheat=1`, { waitUntil: 'domcontentloaded' });
  const slow = () => p.evaluate(() => window.__game.cur?.api.timer(180000)).catch(() => {});
  const ready = async () => { await p.waitForFunction((id) => window.__game && window.__game.phase === 'play' && window.__game.cur?.def.id === id && document.querySelector('.cap-host')?.children.length, id, { timeout: 15000 }); await sleep(300); await slow(); };
  await ready();
  await p.evaluate(() => { const g = window.__game; window.__msgs = []; g.__hooked = 1; const o = g.strike.bind(g); g.strike = (m, ...r) => { window.__msgs.push(m); return o(m, ...r); }; });
  const ans = () => p.evaluate(() => document.querySelector('.cap-host').dataset.answer);
  const box = async (sel) => (await p.locator(sel).first().boundingBox());
  const ctr = (bb) => [bb.x + bb.width / 2, bb.y + bb.height / 2];
  const state = () => p.evaluate(() => ({ strikes: window.__game.strikes, solves: window.__game.stats.solves, msgs: window.__msgs }));
  const shot = async (n) => shots && p.screenshot({ path: `${shots}/${id}_${n}.png` });
  let nS = 0; const waitStrike = async () => { nS++; await p.waitForFunction((n) => window.__game.strikes >= n, nS, { timeout: 8000 }); const s = await state(); console.log(`  [${id}] FAIL msg:`, s.msgs.at(-1)); await shot('fail'); };
  const waitSolve = async () => { await p.waitForFunction(() => window.__game.stats.solves > 0, null, { timeout: 8000 }); console.log(`  [${id}] SOLVED`); };
  const remount = async () => { await sleep(800); await p.evaluate(() => { window.__old = window.__game.cur?.seed; }); await p.waitForFunction(() => window.__game.phase === 'play' && window.__game.cur.seed !== window.__old && document.querySelector('.cap-host')?.children.length, null, { timeout: 8000 }).catch(() => {}); await sleep(300); await slow(); await p.evaluate(() => { const g = window.__game; if (!g.__hooked) { g.__hooked = 1; const o = g.strike.bind(g); g.strike = (m, ...r) => { window.__msgs.push(m); return o(m, ...r); }; } }); };
  const click = async (sel) => p.locator(sel).first().click();
  const curve = async (x0, y0, x1, y1) => { for (let i = 1; i <= 30; i++) { const t = i / 30; await p.mouse.move(x0 + (x1 - x0) * t + Math.sin(t * 9) * 14, y0 + (y1 - y0) * t + Math.sin(t * 5) * 9); await sleep(8); } await p.mouse.move(x1, y1); };
  if (id === 'a_checkbox') {
    await shot('init');
    await click('.ac-box'); await waitStrike(); await remount(); // teleport
    await p.mouse.move(5, 5); const near = ctr(await box('.ac-box')); await p.mouse.move(near[0] - 50, near[1], { steps: 8 }); await sleep(3200);
    const bb = await box('.ac-box'); console.log('  box hopped to x', Math.round(bb.x));
    const [cx, cy] = ctr(bb); await p.mouse.move(60, cy + 3); await sleep(3000); await p.mouse.move(60, cy, { steps: 2 }); await sleep(2600);
    await p.mouse.move(cx - 120, cy); await p.mouse.move(cx, cy, { steps: 25 }); await p.mouse.click(cx, cy); await waitStrike().catch((e) => console.log('  straight test did not fail?', e.message.slice(0, 50)));
    await remount(); const bb2 = await box('.ac-box'); let [x, y] = ctr(bb2); await curve(300, 600, x - 100, y); await shot('approach'); const bb3 = await box('.ac-box'); [x, y] = ctr(bb3); await curve(x - 120, y + 60, x, y); await shot('mid'); await p.mouse.click(x, y); await sleep(900); await shot('analyse'); await waitSolve();
  } else if (id === 'a_wavy') {
    await p.fill('.aw-in', 'ZZZZZZZ'); await click('.ak-btn'); await waitStrike(); await remount();
    const a = await ans(); await p.fill('.aw-in', a.slice(0, -1)); await p.keyboard.press('Enter'); await sleep(500); await shot('almost'); // one letter short -> fail (strike 2)
    await remount(); const a2 = await ans(); await p.fill('.aw-in', a2.toLowerCase()); await shot('typed'); await click('.ak-btn'); await waitSolve();
  } else if (id === 'a_grid') {
    await shot('init');
    const clickTiles = async (idx) => { for (const i of idx) await p.locator('.ag-t').nth(i).click(); };
    const a = (await ans()).split(',').map(Number); const wrong = [...Array(9).keys()].find((i) => !a.includes(i));
    await clickTiles([wrong]); await click('.ak-btn'); await waitStrike(); await remount();
    const a2 = (await ans()).split(',').map(Number); await clickTiles(a2.slice(1)); await click('.ak-btn'); await waitStrike(); await remount();
    const a3 = (await ans()).split(',').map(Number); await clickTiles(a3); await shot('sel'); await click('.ak-btn'); await waitSolve();
  } else if (id === 'a_math') {
    await p.fill('.am-n', '3'); await click('.ak-btn'); await waitStrike(); await remount();
    const a = +(await ans()); await p.fill('.am-n', String(a + 1)); await p.keyboard.press('Enter'); await waitStrike(); await remount();
    const a3 = await ans(); await p.fill('.am-n', a3); await shot('typed'); await click('.ak-btn'); await waitSolve();
  } else if (id === 'a_slider') {
    const drag = async (target) => { const hb = await box('.as-hd'); const trw = (await box('.as-tr')).width - 46; const [x, y] = ctr(hb); const dx = target / 340 * 0 + target * trw / (340 - 46); await p.mouse.move(x, y); await p.mouse.down(); await p.mouse.move(x + dx / 2, y + 3, { steps: 6 }); await p.mouse.move(x + dx, y, { steps: 6 }); await p.mouse.up(); };
    await click('.ak-btn'); await waitStrike(); await remount(); // no move
    let a = +(await ans()); await drag(a - 40); await shot('off'); await click('.ak-btn'); await waitStrike(); await remount();
    a = +(await ans()); await drag(a); await shot('aligned'); await click('.ak-btn'); await waitSolve();
  } else if (id === 'a_bins') {
    await shot('init');
    const place = async (a) => { for (let i = 0; i < a.length; i++) { const card = p.locator('.ab-pool .ab-c').first(); const idx = await card.evaluate((c) => [...c.parentElement.children].indexOf(c)); void idx; const t = await card.innerText(); const k = await p.evaluate((t) => window.__order?.find((o) => o.t === t)?.k, t); void k; } };
    void place;
    // Use the hidden answer string + card order (stable order in DOM initially)
    const texts = async () => p.locator('.ab-c').allInnerTexts();
    let a = await ans(); let tx = await texts();
    // wrong: put everything in human via keyboard
    for (let i = 0; i < 6; i++) { await p.locator('.ab-pool .ab-c').first().focus(); await p.keyboard.press('ArrowLeft'); }
    await shot('allh'); await click('.ak-btn'); await waitStrike(); await remount();
    a = await ans(); tx = await texts();
    for (let i = 0; i < 6; i++) { // drag with mouse
      const card = p.locator('.ab-pool .ab-c').first(); const t = await card.innerText(); const orig = tx.indexOf(t); const k = a[orig];
      const cb = await card.boundingBox(); const bin = await box(k === 'h' ? '.ab-bin:nth-child(1)' : '.ab-bin:nth-child(2)');
      await p.mouse.move(...ctr(cb)); await p.mouse.down(); await p.mouse.move(ctr(cb)[0] + 10, ctr(cb)[1] - 20, { steps: 4 }); if (i === 2) await shot('dragging'); await p.mouse.move(...ctr(bin), { steps: 8 }); await p.mouse.up(); await sleep(150);
    }
    await shot('sorted'); await click('.ak-btn'); await waitSolve();
  } else if (id === 'a_order') {
    await shot('init'); await click('.ak-btn'); await waitStrike(); await remount();
    const names = await p.evaluate(() => [...document.querySelectorAll('.ao-r')].map((r) => r.getAttribute('aria-label')));
    const truth = (await ans()).split('|'); // truth order
    // bubble-sort using mouse drag for the first move, keyboard after
    const cur = async () => p.evaluate(() => [...document.querySelectorAll('.ao-r')].sort((a, b) => parseFloat(a.style.top) - parseFloat(b.style.top)).map((r) => r.getAttribute('aria-label')));
    let first = true;
    for (let i = 0; i < truth.length; i++) {
      let c = await cur(); const j = c.indexOf(truth[i]); if (j === i) continue;
      const row = p.locator('.ao-r', { hasText: new RegExp('^\\s*⋮⋮\\s*\\d+\\s*' + truth[i].slice(0, 6), 'i') }).first(); const rb = await row.boundingBox();
      if (first) { first = false; const [x, y] = ctr(rb); await p.mouse.move(x - 60, y); await p.mouse.down(); await p.mouse.move(x - 60, y - 20, { steps: 5 }); await shot('drag'); await p.mouse.move(x - 60, y - (j - i) * 46, { steps: 10 }); await p.mouse.up(); }
      else { await row.focus(); for (let k = 0; k < j - i; k++) await p.keyboard.press('ArrowUp'); }
      await sleep(300);
    }
    console.log('  order now', (await cur()).join(' > ')); await shot('sorted'); await click('.ak-btn'); await waitSolve();
  } else if (id === 'a_rotate') {
    await sleep(500); await shot('init');
    await p.locator('.ar-bt button').nth(3).click(); await sleep(400); await click('.ak-btn'); await waitStrike(); await remount();
    const path = (await ans()).split(',').filter(Boolean).map(Number);
    console.log('  path', path.join(','));
    for (const m of path.slice(0, 1)) { const sb = await box('.ar-st'); const [x, y] = ctr(sb); const d = { 0: [0, -60], 1: [0, 60], 2: [-60, 0], 3: [60, 0] }[m]; if (d) { await p.mouse.move(x + 40, y); await p.mouse.down(); await p.mouse.move(x + 40 + d[0], y + d[1], { steps: 6 }); await p.mouse.up(); } else await p.locator('.ar-bt button').nth(m).click(); await sleep(300); }
    for (const m of path.slice(1)) { await p.locator('.ar-bt button').nth(m).click(); await sleep(260); }
    await sleep(400); await shot('solved'); await click('.ak-btn'); await waitSolve();
  }
  if (errs.length) console.log('  ERRORS', errs);
  await ctx.close();
}
for (const id of ids.length ? ids : ALL) { console.log('==', id); try { await run(id); } catch (e) { console.log('  TEST ERROR', e.message.split('\n')[0]); } }
await b.close();
