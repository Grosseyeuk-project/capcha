// Layout gate. node tools/layout-gate.mjs [--port 8081] [--only a_grid] [--skip-cls] [--skip-online]
// For every captcha id at 360x640, 390x800, 1280x800 it asserts, WITHOUT scrolling the page:
//  - the primary action button (Vérifier/Valider/...) is fully inside the viewport and not covered (elementFromPoint)
//  - no page scroll, no horizontal overflow
// Then: CLS over a mount+strike+solve cycle, ledger sheet close (Escape / tap-out), and an online race at 390.
import { chromium } from 'playwright-core';
const a = process.argv.slice(2);
const opt = (k, d) => { const i = a.indexOf('--' + k); return i > -1 ? a[i + 1] : d; };
const port = opt('port', 8081), only = opt('only'), skipCls = a.includes('--skip-cls'), skipOnline = a.includes('--skip-online');
const base = `http://localhost:${port}/`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const VPS = [[360, 640], [390, 800], [1280, 800]];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const CLS_INIT = () => { window.__cls = 0; window.__clsSrc = []; try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) { window.__cls += e.value; window.__clsSrc.push((e.sources || []).map((s) => (s.node && (s.node.className || s.node.nodeName)) + '').join('|') + ':' + e.value.toFixed(3)); } }).observe({ type: 'layout-shift', buffered: true }); } catch {} };
const page = async (w, h) => { const ctx = await b.newContext({ viewport: { width: w, height: h } }); await ctx.addInitScript(CLS_INIT); const p = await ctx.newPage(); p.errs = []; p.on('pageerror', (e) => p.errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && !/CERT|fonts\.g/.test(m.text()) && p.errs.push(m.text())); return p; };
const fails = []; const rows = []; const bad = (m) => { fails.push(m); console.log('  FAIL', m); };

// ---- ids
const p0 = await page(1280, 800); await p0.goto(base + '?cheat=1'); await p0.waitForTimeout(1500);
const ids = await p0.evaluate(async () => (await import('/js/captchas/index.js')).CAPTCHAS.map((c) => c.id)); await p0.close();
const list = only ? ids.filter((i) => i === only) : ids;
console.log('captchas:', list.join(' '));

// ---- geometry
const measure = () => {
  const host = document.querySelector('.cap-host'); const vw = innerWidth, vh = innerHeight; const o = { id: 'none' };
  if (!host) return { err: 'no .cap-host' };
  o.page = document.documentElement.scrollHeight - vh; o.hx = document.documentElement.scrollWidth - vw; o.hostX = host.scrollWidth - host.clientWidth;
  const slot = document.querySelector('.cap-slot'); o.zoom = host.style.zoom || '1'; o.scroll = slot.scrollHeight - slot.clientHeight;
  const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 8 && r.height > 8 && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0'; };
  const btns = [...host.querySelectorAll('button,[role=button],input[type=submit]')].filter(vis);
  const re = /v[ée]rifier|valider|confirmer|envoyer|continuer|suivant|terminer|soumettre|^ok$/i;
  const prim = btns.find((x) => re.test(x.textContent || x.value || ''));
  if (prim) {
    const r = prim.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const el = document.elementFromPoint(cx, cy); o.btn = (prim.textContent || '').trim().slice(0, 14); o.bottom = Math.round(r.bottom); o.top = Math.round(r.top);
    o.inView = r.top >= 0 && r.bottom <= vh && r.left >= 0 && r.right <= vw; o.uncovered = !!el && (el === prim || prim.contains(el));
    const cr = document.querySelector('.card').getBoundingClientRect(); o.inCard = r.bottom <= cr.bottom - 36 + 1 && r.top >= cr.top;
  }
  return o;
};
for (const [w, h] of VPS) {
  console.log(`\n== ${w}x${h}`);
  const p = await page(w, h);
  for (const id of list) {
    await p.goto(`${base}?cap=${id}&cheat=1&seed=7`); await p.waitForSelector('.cap-host', { timeout: 15000 }).catch(() => {}); await p.waitForTimeout(1300);
    const m = await p.evaluate(measure);
    const tag = `${w}x${h} ${id}`;
    const line = `${id.padEnd(12)} zoom=${m.zoom} page+${m.page} hx+${m.hx} slotScroll+${m.scroll}${m.btn ? ` btn="${m.btn}" top=${m.top} bottom=${m.bottom} inView=${m.inView} free=${m.uncovered} inCard=${m.inCard}` : ' (no primary btn)'}`;
    console.log(line); rows.push({ w, h, id, ...m });
    if (m.err) bad(`${tag} ${m.err}`);
    if (m.page > 1) bad(`${tag} page scrolls by ${m.page}px`);
    if (m.hx > 1) bad(`${tag} horizontal page overflow ${m.hx}px`);
    if (m.hostX > 2) bad(`${tag} host horizontal overflow ${m.hostX}px`);
    if (m.btn && !m.inView) bad(`${tag} primary button "${m.btn}" outside viewport (top ${m.top}, bottom ${m.bottom})`);
    if (m.btn && m.inView && !m.uncovered) bad(`${tag} primary button "${m.btn}" covered`);
    if (m.btn && !m.inCard) bad(`${tag} primary button "${m.btn}" overlaps card footer/clipped`);
  }
  if (p.errs.length) bad(`${w}x${h} console errors: ${[...new Set(p.errs)].slice(0, 3).join(' / ')}`);
  await p.context().close();
}

// ---- ledger sheet
{
  console.log('\n== ledger sheet');
  const p = await page(390, 800); await p.goto(`${base}?cap=a_checkbox&cheat=1`); await p.waitForSelector('.cap-host'); await p.waitForTimeout(1200);
  const open = () => p.evaluate(() => document.querySelector('.ledger').classList.contains('open'));
  await p.click('.ledger-btn'); if (!(await open())) bad('ledger did not open'); await p.keyboard.press('Escape'); if (await open()) bad('ledger still open after Escape');
  await p.click('.ledger-btn'); await p.mouse.click(190, 20); await p.waitForTimeout(150); if (await open()) bad('ledger still open after tap-out');
  const t0 = await p.evaluate(() => document.querySelector('.clock-val').textContent); await p.click('.ledger-btn'); await p.waitForTimeout(1500); const t1 = await p.evaluate(() => document.querySelector('.clock-val').textContent);
  console.log(`  open/Escape/tap-out ok; timer keeps running while open: ${t0} -> ${t1}`); if (t0 === t1) bad('timer frozen while ledger open (should keep running visibly)');
  await p.context().close();
}

// ---- CLS
const clsRes = [];
if (!skipCls) {
  console.log('\n== CLS (mount + strike + solve)');
  for (const [w, h] of VPS) for (const id of ['a_checkbox', 'a_grid']) {
    const p = await page(w, h); await p.goto(`${base}?cap=${id}&cheat=1&seed=7`); await p.waitForSelector('.cap-host'); await p.waitForTimeout(1500);
    await p.evaluate(() => __cap.fail('La réponse ne respecte pas la règle affichée : relisez la consigne.')); await p.waitForTimeout(2600);
    await p.evaluate(() => { window.__cap.solve(); }); await p.waitForTimeout(2200);
    const cls = await p.evaluate(() => window.__cls), src = await p.evaluate(() => window.__clsSrc.slice(0, 4));
    console.log(`  ${w}x${h} ${id.padEnd(11)} CLS=${cls.toFixed(3)} ${cls > 0.05 ? src.join(' ; ') : ''}`); clsRes.push({ w, h, id, cls });
    if (cls >= 0.05) bad(`${w}x${h} ${id} CLS ${cls.toFixed(3)} >= 0.05`);
    await p.context().close();
  }
  { const p = await page(390, 800); await p.goto(base + '?cheat=1'); await p.waitForTimeout(1500); await p.click('.btn.primary'); await p.waitForTimeout(2500);
    await p.evaluate(() => document.querySelector('.ledger-btn')?.click()); await p.waitForTimeout(800);
    const cls = await p.evaluate(() => window.__cls), src = await p.evaluate(() => window.__clsSrc.slice(0, 4));
    console.log(`  390x800 title->play(+ledger open) CLS=${cls.toFixed(3)} ${cls > 0.05 ? src.join(' ; ') : ''}`); clsRes.push({ id: 'title-play', cls });
    if (cls >= 0.05) bad(`title->play CLS ${cls.toFixed(3)} >= 0.05`); await p.context().close(); }
}

// ---- online race at 390
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
  const o = await B.evaluate(() => { const card = document.querySelector('.ol-game .card').getBoundingClientRect(); const sp = document.querySelector('.ol-game .speaker'); return { cardTop: Math.round(card.top), speaker: sp ? getComputedStyle(sp).display : 'none', toastPE: getComputedStyle(document.querySelector('.ol-toasts')).pointerEvents, cls: window.__cls, src: window.__clsSrc.slice(0, 4), page: document.querySelector('.ol-root').scrollHeight - innerHeight }; });
  console.log(`  card top=${o.cardTop}px  Gérard display=${o.speaker}  CLS=${o.cls.toFixed(3)}  rootScroll=${o.page}  ${o.cls > 0.1 ? o.src.join(' ; ') : ''}`);
  if (o.cardTop > 150) bad(`online 390: chrome above card is ${o.cardTop}px (> 150)`);
  if (o.speaker !== 'none') bad('online 390: Gérard visible during race');
  if (o.cls >= 0.1) bad(`online 390 CLS ${o.cls.toFixed(3)} >= 0.1`);
  if (o.page > 1) bad(`online 390 page scrolls by ${o.page}px`);
  await b.close();
} else await b.close();

console.log('\n' + (fails.length ? `GATE FAILED (${fails.length})\n- ` + fails.join('\n- ') : 'GATE PASSED'));
process.exit(fails.length ? 1 : 0);
