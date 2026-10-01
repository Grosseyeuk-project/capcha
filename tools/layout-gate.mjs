// Layout gate (touch emulation). node tools/layout-gate.mjs [--port N] [--only id] [--skip-cls] [--skip-online] [--skip-drag]
// Starts its own server on a free port unless --port / PORT env is given. Exit code != 0 on any failure.
// For EVERY captcha at 360x640 / 390x800 / 1280x800 (hasTouch), without scrolling the page:
//   - no zoom anywhere in the host, no page scroll, no horizontal overflow
//   - primary action present, visible, uncovered, above the card footer (NO_ACTION lists the click-to-solve captchas, each must then fit with no internal scroll)
//   - effective font size >= 12px for every visible text; tap targets >= 40px (min side) for interactive elements
//   - drag accuracy (finger delta vs element delta within 8%) for a_slider / a_order / a_bins
// Then: ledger sheet (Escape / tap-out), CLS over mount+strike+solve, online race at 390.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import net from 'node:net';
const a = process.argv.slice(2);
const opt = (k, d) => { const i = a.indexOf('--' + k); return i > -1 ? a[i + 1] : d; };
const only = opt('only'), skipCls = a.includes('--skip-cls'), skipOnline = a.includes('--skip-online'), skipDrag = a.includes('--skip-drag');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let port = +(opt('port', process.env.PORT || 0)), srv = null;
if (!port) {
  port = await new Promise((res) => { const s = net.createServer().listen(0, () => { const p = s.address().port; s.close(() => res(p)); }); });
  srv = spawn('node', ['server/index.js'], { env: { ...process.env, PORT: String(port) }, stdio: 'ignore' });
  for (let i = 0; i < 40; i++) { try { if ((await fetch(`http://localhost:${port}/healthz`)).ok) break; } catch { /* */ } await sleep(150); }
}
const base = `http://localhost:${port}/`;
const VPS = [[360, 640], [390, 800], [1280, 800]];
// click-to-solve captchas: no final button, so they must fit without internal scrolling.
const NO_ACTION = new Set(['a_checkbox', 'b_flip', 'b_hunt', 'b_memory', 'b_robot', 'b_boss']);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const CLS_INIT = () => { window.__cls = 0; window.__clsSrc = []; try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) { window.__cls += e.value; window.__clsSrc.push((e.sources || []).map((s) => (s.node && (s.node.className || s.node.nodeName)) + '').join('|') + ':' + e.value.toFixed(3)); } }).observe({ type: 'layout-shift', buffered: true }); } catch { /* */ } };
const page = async (w, h) => { const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true }); await ctx.addInitScript(CLS_INIT); const p = await ctx.newPage(); p.errs = []; p.on('pageerror', (e) => p.errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && !/CERT|fonts\.g/.test(m.text()) && p.errs.push(m.text())); return p; };
const fails = []; const bad = (m) => { fails.push(m); console.log('  FAIL', m); };

const p0 = await page(1280, 800); await p0.goto(base + '?cheat=1'); await p0.waitForTimeout(1500);
const ids = await p0.evaluate(async () => (await import('/js/captchas/index.js')).CAPTCHAS.map((c) => c.id)); await p0.close();
const list = only ? ids.filter((i) => i === only) : ids;
console.log('captchas:', list.join(' '), ' port', port);

const measure = () => {
  const host = document.querySelector('.cap-host'); const vw = innerWidth, vh = innerHeight; const o = {};
  if (!host) return { err: 'no .cap-host' };
  const slot = document.querySelector('.cap-slot'), card = document.querySelector('.card'), sr = slot.getBoundingClientRect();
  o.page = document.documentElement.scrollHeight - vh; o.hx = document.documentElement.scrollWidth - vw; o.hostX = host.scrollWidth - host.clientWidth; o.scroll = slot.scrollHeight - slot.clientHeight;
  o.zoom = [host, ...host.querySelectorAll('*')].filter((e) => (e.style.zoom && e.style.zoom !== '1') || (getComputedStyle(e).zoom && getComputedStyle(e).zoom !== '1')).length;
  const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 2 && r.height > 2 && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0'; };
  const inSlot = (e) => { const r = e.getBoundingClientRect(); return r.bottom > sr.top && r.top < sr.bottom; };
  // primary
  const btns = [...host.querySelectorAll('[data-primary],.cap-go,button,[role=button],input[type=submit]')].filter(vis);
  const re = /v[ée]rifier|valider|confirmer|envoyer|continuer|suivant|terminer|soumettre|^ok$/i;
  const prim = btns.find((x) => x.matches('[data-primary],.cap-go')) || btns.find((x) => re.test(x.textContent || x.value || ''));
  if (prim) {
    const r = prim.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2; const el = document.elementFromPoint(cx, cy);
    const cr = card.getBoundingClientRect(), foot = document.querySelector('.card-foot').getBoundingClientRect();
    o.btn = (prim.textContent || '').trim().slice(0, 14); o.top = Math.round(r.top); o.bottom = Math.round(r.bottom);
    o.inView = r.top >= 0 && r.bottom <= vh && r.left >= 0 && r.right <= vw && r.bottom <= foot.top + 1 && r.top >= cr.top;
    o.uncovered = !!el && (el === prim || prim.contains(el)); o.h = Math.round(r.height);
  }
  // fonts
  const fonts = []; const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.textContent.trim()) continue; const e = n.parentElement; if (!e || ['SCRIPT', 'STYLE', 'OPTION'].includes(e.tagName) || !vis(e) || !inSlot(e)) continue;
    let sz = parseFloat(getComputedStyle(e).fontSize); let k = 1; for (let x = e; x && x !== document.body; x = x.parentElement) { const t = getComputedStyle(x).transform; if (t && t !== 'none') { const m = new DOMMatrix(t); k *= Math.hypot(m.a, m.b); } }
    sz *= k; if (sz < 11.95) fonts.push(`${n.textContent.trim().slice(0, 18)}=${sz.toFixed(1)}`);
  }
  o.fonts = [...new Set(fonts)];
  // tap targets
  const tsel = 'button,a[href],input:not([type=hidden]),select,textarea,[role=button],[role=checkbox],[role=slider],[role=switch],[tabindex]:not([tabindex="-1"]),[draggable=true]';
  const small = [];
  const cands = new Set([...host.querySelectorAll(tsel)]);
  host.querySelectorAll('*').forEach((e) => { const c = getComputedStyle(e).cursor; if ((c === 'pointer' || c === 'grab') && !e.closest(tsel.split(',').filter((x) => !x.includes('tabindex')).join(','))) cands.add(e); });
  for (const e of cands) {
    if (!vis(e) || !inSlot(e) || e.tagName === 'CANVAS' && false) continue;
    // ignore wrappers whose descendants are the real targets
    if ([...cands].some((o) => o !== e && e.contains(o))) continue;
    let r = e.getBoundingClientRect(); const lab = e.closest('label,button,[role=button]'); if (lab && lab !== e) { const lr = lab.getBoundingClientRect(); if (Math.min(lr.width, lr.height) > Math.min(r.width, r.height)) r = lr; }
    if (Math.min(r.width, r.height) < 39.5) small.push(`${(e.tagName + '.' + (e.className || '')).toString().slice(0, 22)}[${(e.textContent || '').trim().slice(0, 8)}] ${Math.round(r.width)}x${Math.round(r.height)}`);
  }
  o.small = [...new Set(small)];
  return o;
};

const cdpDrag = async (p, x, y, dx, dy, probe) => {
  const c = await p.context().newCDPSession(p); const T = (type, pts) => c.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
  await T('touchStart', [{ x, y }]); const out = { before: await p.evaluate(probe) };
  for (let i = 1; i <= 8; i++) { await T('touchMove', [{ x: x + dx * i / 8, y: y + dy * i / 8 }]); await sleep(30); }
  out.during = await p.evaluate(probe); await T('touchEnd', []); await c.detach(); return out;
};
const DRAGS = {
  a_slider: { sel: '.as-hd', dx: 90, dy: 0, probe: () => { const e = document.querySelector('.as-hd'); const r = e.getBoundingClientRect(); return r.left + r.width / 2; }, axis: 'dx' },
  a_order: { sel: '.ao-r .ao-gp', dx: 0, dy: 60, probe: () => { const e = [...document.querySelectorAll('.ao-r')].find((r) => r.classList.contains('dr') || r.classList.contains('dg') || r.style.zIndex > 0) || document.querySelector('.ao-r'); const r = e.getBoundingClientRect(); return r.top + r.height / 2; }, axis: 'dy' },
  a_bins: { sel: '.ab-c', dx: 70, dy: 90, probe: () => { const g = document.querySelector('.ab-c.gh'); if (!g) return null; const r = g.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, axis: 'xy' },
};

for (const [w, h] of VPS) {
  console.log(`\n== ${w}x${h}`);
  const p = await page(w, h);
  for (const id of list) {
    await p.goto(`${base}?cap=${id}&cheat=1&seed=7`); await p.waitForSelector('.cap-host', { timeout: 15000 }).catch(() => {}); await p.waitForTimeout(1300);
    const m = await p.evaluate(measure); const tag = `${w}x${h} ${id}`;
    console.log(`${id.padEnd(11)} zoom=${m.zoom} page+${m.page} hx+${m.hx} scroll+${m.scroll} ${m.btn ? `btn="${m.btn}" ${m.top}-${m.bottom} h${m.h} inView=${m.inView} free=${m.uncovered}` : '(no btn)'} fonts<12:${m.fonts?.length} small:${m.small?.length}`);
    if (m.err) { bad(`${tag} ${m.err}`); continue; }
    if (m.zoom) bad(`${tag} uses zoom on ${m.zoom} elements`);
    if (m.page > 1) bad(`${tag} page scrolls by ${m.page}px`);
    if (m.hx > 1) bad(`${tag} horizontal page overflow ${m.hx}px`);
    if (m.hostX > 2) bad(`${tag} host horizontal overflow ${m.hostX}px`);
    if (m.btn) { if (!m.inView) bad(`${tag} primary "${m.btn}" not fully visible above footer (${m.top}-${m.bottom})`); else if (!m.uncovered) bad(`${tag} primary "${m.btn}" covered`); if (m.h < 40) bad(`${tag} primary "${m.btn}" only ${m.h}px tall`); }
    else if (!NO_ACTION.has(id)) bad(`${tag} no primary action found (declare data-primary or add to NO_ACTION)`);
    else if (m.scroll > 2) bad(`${tag} click-to-solve captcha scrolls internally by ${m.scroll}px`);
    if (m.fonts.length) bad(`${tag} text < 12px: ${m.fonts.slice(0, 5).join(', ')}`);
    if (m.small.length) bad(`${tag} tap targets < 40px: ${m.small.slice(0, 4).join(', ')}`);
    const d = DRAGS[id];
    if (d && !skipDrag) {
      const box = await p.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, d.sel);
      if (!box) { bad(`${tag} drag: ${d.sel} not found`); continue; }
      const res = await cdpDrag(p, box.x, box.y, d.dx, d.dy, d.probe);
      let ok = true, msg = '';
      if (d.axis === 'xy') { if (!res.during) { ok = false; msg = 'no ghost during drag'; } else { const dxm = res.during[0] - box.x, dym = res.during[1] - box.y; ok = Math.abs(dxm - d.dx) / d.dx <= 0.08 && Math.abs(dym - d.dy) / d.dy <= 0.08; msg = `finger (${d.dx},${d.dy}) ghost (${dxm.toFixed(0)},${dym.toFixed(0)})`; } }
      else { const del = res.during - res.before; const want = d[d.axis]; ok = Math.abs(del - want) / want <= 0.08; msg = `finger ${want} element ${del.toFixed(0)}`; }
      console.log(`   drag ${msg} ${ok ? 'ok' : 'DRIFT'}`); if (!ok) bad(`${tag} drag accuracy: ${msg}`);
    }
  }
  if (p.errs.length) bad(`${w}x${h} console errors: ${[...new Set(p.errs)].slice(0, 3).join(' / ')}`);
  await p.context().close();
}

{
  console.log('\n== ledger sheet');
  const p = await page(390, 800); await p.goto(`${base}?cap=a_checkbox&cheat=1`); await p.waitForSelector('.cap-host'); await p.waitForTimeout(1200);
  const open = () => p.evaluate(() => document.querySelector('.ledger').classList.contains('open'));
  await p.click('.ledger-btn'); if (!(await open())) bad('ledger did not open'); await p.keyboard.press('Escape'); if (await open()) bad('ledger still open after Escape');
  await p.click('.ledger-btn'); await p.mouse.click(190, 20); await p.waitForTimeout(150); if (await open()) bad('ledger still open after tap-out');
  const t0 = await p.evaluate(() => document.querySelector('.clock-val').textContent); await p.click('.ledger-btn'); await p.waitForTimeout(1500); const t1 = await p.evaluate(() => document.querySelector('.clock-val').textContent);
  console.log(`  open/Escape/tap-out ok; timer while open: ${t0} -> ${t1}`); if (t0 === t1) bad('timer frozen while ledger open');
  await p.context().close();
}

if (!skipCls) {
  console.log('\n== CLS (mount + strike + solve)');
  for (const [w, h] of VPS) for (const id of ['a_checkbox', 'a_grid']) {
    const p = await page(w, h); await p.goto(`${base}?cap=${id}&cheat=1&seed=7`); await p.waitForSelector('.cap-host'); await p.waitForTimeout(1500);
    await p.evaluate(() => __cap.fail('La réponse ne respecte pas la règle affichée : relisez la consigne.')); await p.waitForTimeout(2600);
    await p.evaluate(() => window.__cap.solve()); await p.waitForTimeout(2200);
    const cls = await p.evaluate(() => window.__cls), src = await p.evaluate(() => window.__clsSrc.slice(0, 4));
    console.log(`  ${w}x${h} ${id.padEnd(11)} CLS=${cls.toFixed(3)} ${cls > 0.05 ? src.join(' ; ') : ''}`);
    if (cls >= 0.05) bad(`${w}x${h} ${id} CLS ${cls.toFixed(3)} >= 0.05`);
    await p.context().close();
  }
  { const p = await page(390, 800); await p.goto(base + '?cheat=1'); await p.waitForTimeout(1500); await p.click('.btn.primary'); await p.waitForTimeout(2500);
    await p.evaluate(() => document.querySelector('.ledger-btn')?.click()); await p.waitForTimeout(800);
    const cls = await p.evaluate(() => window.__cls); console.log(`  390x800 title->play(+ledger) CLS=${cls.toFixed(3)}`);
    if (cls >= 0.05) bad(`title->play CLS ${cls.toFixed(3)} >= 0.05`); await p.context().close(); }
}

if (!skipOnline) {
  console.log('\n== online race 390x800 (+ desktop partner)');
  const mk = async (w, h) => { const p = await page(w, h); await p.goto(base + '?cheat=1'); await p.waitForTimeout(1500); await p.click('.btn.ghost'); await p.waitForTimeout(900); return p; };
  const A = await mk(1280, 800), B = await mk(390, 800);
  await A.fill('input[aria-label=Pseudo]', 'Alice'); await B.fill('input[aria-label=Pseudo]', 'Bob');
  await A.click('text=Créer une salle'); await A.waitForSelector('.ol-code b'); const code = await A.textContent('.ol-code b');
  await B.fill('input[aria-label="Code de salle"]', code); await B.click('text=Rejoindre'); await B.waitForSelector('.ol-code b');
  await A.click('text=+ Ajouter un bot'); await B.click('text=Je suis prêt'); await sleep(600); await A.click('text=Lancer la partie');
  await B.waitForSelector('.ol-race', { timeout: 15000 }); await B.waitForSelector('.cap-host', { timeout: 15000 }); await sleep(2500);
  const solve = (p) => p.evaluate(() => window.CAPCHA_ONLINE.game?.cur?.api.solve());
  const fail = (p) => p.evaluate(() => window.CAPCHA_ONLINE.game?.cur?.api.fail('La case cochée était la mauvaise, selon le règlement.'));
  await solve(B); await sleep(1600); await fail(B); await sleep(2200); await solve(B); await sleep(1500);
  const o = await B.evaluate(() => { const card = document.querySelector('.ol-game .card').getBoundingClientRect(); const sp = document.querySelector('.ol-game .speaker'); return { cardTop: Math.round(card.top), cardBottom: Math.round(card.bottom), vh: innerHeight, speaker: sp ? getComputedStyle(sp).display : 'none', cls: window.__cls, src: window.__clsSrc.slice(0, 4), page: document.querySelector('.ol-root').scrollHeight - innerHeight }; });
  console.log(`  card ${o.cardTop}-${o.cardBottom} of ${o.vh}  Gérard=${o.speaker}  CLS=${o.cls.toFixed(3)}  rootScroll=${o.page} ${o.cls > 0.1 ? o.src.join(' ; ') : ''}`);
  if (o.cardTop > 150) bad(`online 390: chrome above card is ${o.cardTop}px (> 150)`);
  if (o.vh - o.cardBottom > 60) bad(`online 390: ${o.vh - o.cardBottom}px dead space below card`);
  if (o.speaker !== 'none') bad('online 390: Gérard visible during race');
  if (o.cls >= 0.1) bad(`online 390 CLS ${o.cls.toFixed(3)} >= 0.1`);
  if (o.page > 1) bad(`online 390 page scrolls by ${o.page}px`);
}
await b.close(); srv?.kill();
console.log('\n' + (fails.length ? `GATE FAILED (${fails.length})\n- ` + fails.join('\n- ') : 'GATE PASSED'));
process.exit(fails.length ? 1 : 0);
