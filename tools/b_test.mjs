// Scripted solve/fail test for captchas-b.  node tools/b_test.mjs [id...] [--port 8084] [--w 1280 --h 800] [--shots dir] [--touch]
import { chromium } from 'playwright-core';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i > -1 ? args[i + 1] : d; };
const port = opt('port', 8084), W = +opt('w', 1280), H = +opt('h', 800), shots = opt('shots', '/tmp');
const ALL = ['b_flip', 'b_hunt', 'b_loading', 'b_memory', 'b_robot', 'b_cube', 'b_pwd', 'b_boss'];
const ids = args.filter((a, i) => !a.startsWith('--') && !(i && args[i - 1].startsWith('--') && args[i - 1] !== '--touch'));
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function run(id) {
  const ctx = await b.newContext({ viewport: { width: W, height: H }, hasTouch: args.includes('--touch') });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && !/CERT|404/.test(m.text()) && errs.push(m.text()));
  await p.goto(`http://localhost:${port}/?cap=${id}&cheat=1`, { waitUntil: 'domcontentloaded' });
  const hook = () => p.evaluate(() => { const g = window.__game; if (!g.__hooked) { g.__hooked = 1; window.__msgs = []; const o = g.strike.bind(g); g.strike = (m, ...r) => { window.__msgs.push(m); return o(m, ...r); }; } });
  const ready = async (extra) => { await p.waitForFunction((id) => window.__game && window.__game.phase === 'play' && window.__game.cur?.def.id === id && document.querySelector('.cap-host')?.children.length, id, { timeout: 15000 }); await sleep(400); await hook(); };
  await ready();
  const ans = () => p.evaluate(() => document.querySelector('.cap-host').dataset.answer);
  const st = () => p.evaluate(() => ({ strikes: window.__game.strikes, solves: window.__game.stats.solves, msgs: window.__msgs }));
  const shot = async (n) => p.screenshot({ path: `${shots}/bt_${id}_${n}.png` });
  let nS = 0;
  const waitStrike = async (label = '') => { nS++; await p.waitForFunction((n) => window.__game.strikes >= n, nS, { timeout: 9000 }); const s = await st(); console.log(`  [${id}] FAIL ${label}:`, s.msgs.at(-1)); };
  const waitSolve = async () => { await p.waitForFunction(() => window.__game.stats.solves > 0, null, { timeout: 12000 }); console.log(`  [${id}] SOLVED`); };
  const remount = async () => { await p.evaluate(() => { window.__old = window.__game.cur?.seed; }); await sleep(900); await p.waitForFunction(() => window.__game.phase === 'play' && window.__game.cur.seed !== window.__old && document.querySelector('.cap-host')?.children.length, null, { timeout: 9000 }); await sleep(500); await hook(); };
  const ctr = (bb) => [bb.x + bb.width / 2, bb.y + bb.height / 2];
  const clickEl = async (loc) => { const bb = await loc.boundingBox(); const [x, y] = ctr(bb); await p.mouse.click(x, y); };
  if (id === 'b_flip') {
    const tiles = () => p.$$eval('.bf-t', (els) => els.map((e) => e.textContent.replace('✓', '')));
    const clickIdx = async (i) => p.locator('.bf-t').nth(i).click();
    let t = await tiles(); for (let i = 0; i < 12; i++) if (t[i] === '🐱') await clickIdx(i); await sleep(1100); await shot('stage2');
    t = await tiles(); const cat = t.findIndex((e) => e === '🐱'); await clickIdx(cat); await waitStrike('chat en stage2'); await remount();
    // reach stage 2 again fast
    t = await tiles(); for (let i = 0; i < 12; i++) if (t[i] === '🐱') await clickIdx(i); await sleep(1100);
    t = await tiles(); for (let i = 0; i < 12; i++) if (t[i] !== '🐱') await clickIdx(i); await sleep(1100); await shot('stage3');
    t = await tiles(); const dogs = t.map((e, i) => e === '🐶' ? i : -1).filter((i) => i >= 0); await clickIdx(dogs[0]); await clickIdx(dogs[1]); await sleep(300); await shot('flip');
    await clickIdx(dogs[2]); await waitStrike('chien après demi-tour'); await remount();
    t = await tiles(); for (let i = 0; i < 12; i++) if (t[i] === '🐱') await clickIdx(i); await sleep(1100);
    t = await tiles(); for (let i = 0; i < 12; i++) if (t[i] !== '🐱') await clickIdx(i); await sleep(1100);
    t = await tiles(); const d2 = t.map((e, i) => e === '🐶' ? i : -1).filter((i) => i >= 0); await clickIdx(d2[0]); await clickIdx(d2[1]); await sleep(200);
    t = await tiles(); for (let i = 0; i < 12; i++) if (t[i] === '🐱') await clickIdx(i); await waitSolve();
  } else if (id === 'b_hunt') {
    const king = () => p.evaluate(() => [...document.querySelectorAll('.bh-d')].findIndex((e) => e.querySelector('i')?.textContent === '👑'));
    const realClick = async (i) => { const bb = await p.locator('.bh-d').nth(i).boundingBox(); await p.mouse.click(bb.x + 23, bb.y + 23); };
    const bad = async () => { const k = await king(); const i = (k + 1) % 13; await p.evaluate((i) => document.querySelectorAll('.bh-d')[i].click(), i); };
    await bad(); await waitStrike('civil'); await remount();
    await realClick(await king()); await sleep(900); await shot('r2'); await realClick(await king()); await sleep(900); await shot('r3');
    // hatted decoy
    const hat = await p.evaluate(() => [...document.querySelectorAll('.bh-d')].findIndex((e) => e.querySelector('i') && e.querySelector('i').textContent !== '👑'));
    await p.evaluate((i) => document.querySelectorAll('.bh-d')[i].click(), hat); await waitStrike('chapeau'); await remount();
    for (let r = 0; r < 3; r++) { await p.evaluate(() => [...document.querySelectorAll('.bh-d')].find((e) => e.querySelector('i')?.textContent === '👑').click()); await sleep(900); }
    await waitSolve();
  } else if (id === 'b_loading') {
    const when = (cls) => p.evaluate((cls) => new Promise((res) => { const f = () => { const el = document.querySelector('.bl-bar.' + cls); if (el) { document.querySelector('.bl-go').click(); res(el.textContent); } else requestAnimationFrame(f); }; f(); }), cls);
    await p.click('.bl-go'); await waitStrike('trop tôt'); await remount();
    await when('real'); await sleep(1200); await shot('stage2');
    await when('fake'); await waitStrike('decoy');
    await remount();
    await when('real'); await sleep(1200); await shot('stage2b');
    await when('real'); await waitSolve();
  } else if (id === 'b_memory') {
    const play = async (rev) => { await p.waitForSelector('.bm-state.go', { timeout: 12000 }); const a = JSON.parse(await ans()); return a; };
    await p.waitForSelector('.bm-state.go', { timeout: 12000 }); let a = JSON.parse(await ans()); await p.keyboard.press(String(((a[0] + 1) % 4) + 1)); await waitStrike('mauvais pad'); await remount();
    await p.waitForSelector('.bm-state.go', { timeout: 12000 }); await shot('p1'); a = JSON.parse(await ans()); for (const v of a) { await p.keyboard.press(String(v + 1)); await sleep(60); }
    await sleep(1200); await p.waitForFunction(() => /envers/i.test(document.querySelector('.bm-state').textContent) && document.querySelector('.bm-state.go'), null, { timeout: 15000 }); await shot('p2'); a = JSON.parse(await ans());
    await p.keyboard.press(String(a[a.length - 1] + 1)); // forward instead of reverse? a already reversed; first = a[0]; pressing a last is wrong unless equal
    await sleep(300);
    const s = await st(); if (s.strikes === nS) { console.log('  (lucky: pressed correct)'); }
    else { await waitStrike('sens inverse'); await remount(); await p.waitForSelector('.bm-state.go', { timeout: 12000 }); a = JSON.parse(await ans()); for (const v of a) await p.keyboard.press(String(v + 1)); await sleep(1300); await p.waitForFunction(() => document.querySelector('.bm-state.go') && /envers/i.test(document.querySelector('.bm-state').textContent), null, { timeout: 15000 }); a = JSON.parse(await ans()); for (const v of a) { await p.mouse.click(...ctr(await p.locator('.bm-p').nth(v).boundingBox())); await sleep(60); } await waitSolve(); return end(); }
    for (const v of a) await p.keyboard.press(String(v + 1)); await waitSolve();
  } else if (id === 'b_robot') {
    const pd = (sel, dx = 0, dy = 0) => p.evaluate(([sel, dx, dy]) => { const el = document.querySelector(sel); const r = el.getBoundingClientRect(); const x = r.left + (dx || r.width / 2), y = r.top + (dy || r.height / 2); el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: x, clientY: y })); }, [sel, dx, dy]);
    const go = () => p.evaluate(() => document.querySelector('.br-start button').click());
    await go(); await pd('.br-arena', 6, 290); await waitStrike('raté'); await remount();
    await go();
    await p.evaluate(() => new Promise((res) => { let n = 0, last = null; const f = () => { const el = document.querySelector('.br-t'); if (el && el !== last) { last = el; n++; if (n % 2) { const r = el.getBoundingClientRect(); el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: r.left + 26, clientY: r.top + 26 })); } else window.dispatchEvent(new KeyboardEvent('keydown', { key: document.querySelector('.cap-host').dataset.answer.toLowerCase() })); } if (n >= 10 && !document.querySelector('.br-t')) return res(); requestAnimationFrame(f); }; f(); }));
    console.log('  state', JSON.stringify(await st()), await p.textContent('.br-hud')); await waitSolve();
  } else if (id === 'b_cube') {
    const before = await p.textContent('.bc-read'); await p.locator('.bc-wrap').focus(); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight'); await sleep(200);
    const after = await p.textContent('.bc-read'); console.log('  read before/after keys:', before, '|', after);
    await p.mouse.move(640, 450); await p.mouse.down(); await p.mouse.move(700, 470, { steps: 5 }); await p.mouse.up(); await shot('rotated');
    await p.click('.bk-btn:has-text("Valider")'); await waitStrike('initial'); await remount();
    await p.evaluate(() => document.querySelector('.cap-host').__mirror()); await sleep(300); await shot('mirror'); await p.click('.bk-btn:has-text("Valider")'); await waitStrike('miroir'); await remount();
    await p.evaluate(() => document.querySelector('.cap-host').__solve()); await sleep(300); await shot('solved'); await p.click('.bk-btn:has-text("Valider")'); await waitSolve();
  } else if (id === 'b_pwd') {
    const rules = () => p.$$eval('.bp-r', (e) => e.length);
    const answer = await ans();
    await p.click('.bp-field input'); await p.keyboard.type('janvier', { delay: 10 }); await sleep(200);
    console.log('  rules after "janvier":', await rules());
    await p.fill('.bp-field input', ''); await p.keyboard.type(answer, { delay: 8 }); await sleep(300); console.log('  rules after answer:', await rules(), 'btn disabled', await p.$eval('.bk-btn', (b) => b.disabled)); await shot('rules');
    const pw = await p.inputValue('.bp-field input'); await p.fill('.bp-field:nth-of-type(2) input', pw + 'x'); await sleep(200); console.log('  btn disabled w/ bad confirm', await p.$eval('.bk-btn', (b) => b.disabled));
    await p.fill('.bp-field:nth-of-type(2) input', pw); await sleep(300); await shot('ok'); await p.click('.bk-btn'); await waitSolve();
  } else if (id === 'b_boss') {
    await p.waitForSelector('.bb-orb', { timeout: 5000 });
    const orbHit = async (sel) => { await sleep(150); const bb = await p.locator(sel).first().boundingBox(); await p.mouse.click(bb.x + 27, bb.y + 27); };
    await sleep(300); await shot('p1'); await orbHit('.bb-orb'); await sleep(900); await shot('p1b'); // decoys now
    await p.evaluate(() => document.querySelector('.bb-orb[aria-label="leurre"]').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))); await waitStrike('leurre'); await remount();
    for (let k = 0; k < 3; k++) { await p.waitForSelector('.bb-orb[aria-label="œil du boss"]:not(.boom)', { timeout: 5000 }); await orbHit('.bb-orb[aria-label="œil du boss"]:not(.boom)'); await sleep(900); }
    await p.waitForSelector('.bb-pad:not([disabled])', { timeout: 12000 }); await shot('p2'); let a = JSON.parse(await ans());
    a = JSON.parse(await ans()); for (const v of a) await p.keyboard.press(String(v + 1));
    await p.waitForSelector('.bb-type input', { timeout: 5000 }); await shot('p3'); const rev = await ans();
    await p.fill('.bb-type input', rev.slice(0, -1) + '?'); await p.keyboard.press('Enter'); await waitStrike('typo'); await remount();
    for (let k = 0; k < 3; k++) { await p.waitForSelector('.bb-orb[aria-label="œil du boss"]:not(.boom)', { timeout: 5000 }); await orbHit('.bb-orb[aria-label="œil du boss"]:not(.boom)'); await sleep(900); }
    await p.waitForSelector('.bb-pad:not([disabled])', { timeout: 12000 }); a = JSON.parse(await ans()); for (const v of a) await p.keyboard.press(String(v + 1));
    await p.waitForSelector('.bb-type input', { timeout: 5000 }); const rev2 = await ans();
    await p.fill('.bb-type input', rev2); await shot('p3typed'); await p.keyboard.press('Enter'); await sleep(700); await shot('erratum');
    const fwd = [...rev2].reverse().join(''); await p.fill('.bb-type input', fwd); await p.keyboard.press('Enter'); await sleep(500); await shot('end'); await waitSolve();
  }
  end();
  async function end() { await sleep(300); if (errs.length) console.log(`  [${id}] ERRORS:`, errs.slice(0, 4)); await ctx.close(); }
}
for (const id of ids.length ? ids : ALL) { console.log('==', id); try { await run(id); } catch (e) { console.log('  TEST ERROR', id, e.message.split('\n')[0], (e.stack.match(/b_test.mjs:(\d+)/)||[])[1]); } }
await b.close();
