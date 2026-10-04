// Layout gate (touch emulation). node tools/layout-gate.mjs [--quick (390x800, geometry+fonts+targets only, ~2 min)] [--port N] [--only id1,id2] [--skip-cls] [--skip-online] [--skip-drag]
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
const onlyList = opt('only') ? opt('only').split(',') : null, quick = a.includes('--quick'), skipCls = quick || a.includes('--skip-cls'), skipOnline = quick || a.includes('--skip-online'), skipDrag = quick || a.includes('--skip-drag');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let port = +(opt('port', process.env.PORT || 0)), srv = null;
if (!port) {
  port = await new Promise((res) => { const s = net.createServer().listen(0, () => { const p = s.address().port; s.close(() => res(p)); }); });
  srv = spawn('node', ['server/index.js'], { env: { ...process.env, PORT: String(port) }, stdio: 'ignore' });
  for (let i = 0; i < 40; i++) { try { if ((await fetch(`http://localhost:${port}/healthz`)).ok) break; } catch { /* */ } await sleep(150); }
}
const base = `http://localhost:${port}/`;
const VPS = (quick ? [[360, 640], [390, 800]] : [[360, 640], [390, 800], [1280, 800]]).filter(([w, h]) => !opt('vp') || opt('vp') === `${w}x${h}`);
// click-to-solve captchas: no final button, so they must fit without internal scrolling.
// Layout bugs owned by the captcha builders, reported but not blocking the shell gate.
const KNOWN = {}; // no excuses: every captcha must pass
const NO_ACTION = new Set(['a_checkbox', 'b_flip', 'b_hunt', 'b_memory', 'b_robot', 'b_boss']);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const CLS_INIT = () => { window.__cls = 0; window.__clsSrc = []; try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) { window.__cls += e.value; window.__clsSrc.push([e.value, (e.sources || []).map((s) => (s.node && (s.node.className || s.node.nodeName)) + '').join('|') + ':' + e.value.toFixed(3) + '@' + Math.round(performance.now())]); } }).observe({ type: 'layout-shift', buffered: true }); } catch { /* */ } };
const page = async (w, h) => { const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true }); await ctx.addInitScript(CLS_INIT); const p = await ctx.newPage(); p.setDefaultTimeout(60000); p.errs = []; p.on('pageerror', (e) => p.errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && !/CERT|fonts\.g/.test(m.text()) && p.errs.push(m.text())); return p; };

const CONTRAST = (rootSel) => {
  const parse = (c) => (c.match(/[\d.]+/g) || []).map(Number);
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const bgOf = (e) => { for (let x = e; x; x = x.parentElement) { const cs = getComputedStyle(x); if (cs.backgroundImage !== 'none') return null; const c = parse(cs.backgroundColor); const a = c.length > 3 ? c[3] : 1; if (a >= 0.95) return c; if (a > 0.02) return null; } return [255, 255, 255]; };
  const out = []; const root = document.querySelector(rootSel); if (!root) return ['no ' + rootSel];
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    if (!n.textContent.trim()) continue; const e = n.parentElement; if (!e || e.closest('svg,script,style')) continue; const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
    if (r.width < 2 || r.height < 2 || cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < 0.9) continue;
    const bg = bgOf(e); if (!bg) continue; const fg = parse(cs.color); if (fg.length > 3 && fg[3] < 0.95) continue;
    const L1 = lum(fg), L2 = lum(bg), ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const big = parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.66 && +cs.fontWeight >= 700);
    if (ratio < (big ? 3 : 4.5)) out.push(`${n.textContent.trim().slice(0, 22)} ${ratio.toFixed(2)}`);
  }
  return [...new Set(out)];
};
const go = async (p, url) => { for (let i = 0; i < 3; i++) { try { return await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }); } catch (e) { if (i === 2) throw e; await sleep(1500); } } };

const TEXT_OVERLAP = (rootSel) => {
  const root = document.querySelector(rootSel); if (!root) return ['no ' + rootSel];
  const items = []; const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) { if (!n.textContent.trim()) continue; const e = n.parentElement; if (!e || e.closest('svg,script,style,.sr-only,[aria-hidden="true"]')) continue; const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < 0.5) continue;
    const rg = document.createRange(); rg.selectNodeContents(n); const clip = e.closest('.vc-body, .cap-slot, .ol-root'); const cr = clip ? clip.getBoundingClientRect() : null;
    for (const r0 of rg.getClientRects()) { let r = r0; if (cr) { const L = Math.max(r.left, cr.left), T = Math.max(r.top, cr.top), R = Math.min(r.right, cr.right), B = Math.min(r.bottom, cr.bottom); if (R - L < 4 || B - T < 4) continue; r = { left: L, top: T, right: R, bottom: B, width: R - L, height: B - T }; } if (r.width > 4 && r.height > 4) items.push({ e, r, t: n.textContent.trim().slice(0, 16) }); } }
  const out = [];
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) { const A = items[i], B = items[j]; if (A.e === B.e || A.e.contains(B.e) || B.e.contains(A.e)) continue;
    const ix = Math.min(A.r.right, B.r.right) - Math.max(A.r.left, B.r.left), iy = Math.min(A.r.bottom, B.r.bottom) - Math.max(A.r.top, B.r.top); if (ix > 3 && iy > 3 && ix * iy > 14) out.push(`"${A.t}" x "${B.t}"`); }
  return [...new Set(out)];
};
const fails = []; const bad = (m) => { fails.push(m); console.log('  FAIL', m); };

const p0 = await page(1280, 800); await go(p0, base + '?cheat=1'); await p0.waitForTimeout(1500);
const ids = await p0.evaluate(async () => (await import('/js/captchas/index.js')).CAPTCHAS.map((c) => c.id)); await p0.close();
const list = onlyList ? ids.filter((i) => onlyList.includes(i)) : ids;
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
  const btns = [...host.querySelectorAll('[data-primary],.cap-go,.ak-btn,.bk-btn,button,[role=button],input[type=submit]')].filter(vis);
  const re = /v[ée]rifier|valider|confirmer|envoyer|continuer|suivant|terminer|soumettre|^ok$/i;
  const prim = btns.find((x) => x.matches('[data-primary],.cap-go,.ak-btn,.bk-btn')) || btns.find((x) => re.test(x.textContent || x.value || ''));
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
    if (!n.textContent.trim()) continue; const e = n.parentElement; if (e && e.closest('svg')) continue; if (!e || ['SCRIPT', 'STYLE', 'OPTION'].includes(e.tagName) || !vis(e) || !inSlot(e)) continue;
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
    const lw = e.offsetWidth || r.width, lh = e.offsetHeight || r.height; /* layout size: ignores transient scale animations */ if (Math.min(Math.max(r.width, lw), Math.max(r.height, lh)) < 39.5) small.push(`${(e.tagName + '.' + (e.className || '')).toString().slice(0, 22)}[${(e.textContent || '').trim().slice(0, 8)}] ${Math.round(r.width)}x${Math.round(r.height)}`);
  }
  o.small = [...new Set(small)];
  const ell = []; document.querySelectorAll('.stage *, .ledger *, .cap-host *').forEach((e) => { const cs = getComputedStyle(e); const lc = cs.webkitLineClamp; if (((cs.textOverflow === 'ellipsis' && e.scrollWidth > e.clientWidth + 1) || (lc && lc !== 'none' && e.scrollHeight > e.clientHeight + 1)) && cs.display !== 'none' && e.getBoundingClientRect().width > 0 && !e.classList.contains('bubble-text')) ell.push((e.className || e.tagName).toString().slice(0, 20) + ':' + (e.textContent || '').trim().slice(0, 22)); });
  o.ell = [...new Set(ell)];
  return o;
};

const cdpDrag = async (p, x, y, dx, dy, probe, start) => {
  const c = await p.context().newCDPSession(p); const T = (type, pts) => c.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
  await T('touchStart', [{ x, y }]); const out = { before: await p.evaluate(probe), start: start ? await p.evaluate(start) : null };
  for (let i = 1; i <= 8; i++) { await T('touchMove', [{ x: x + dx * i / 8, y: y + dy * i / 8 }]); await sleep(30); }
  out.during = await p.evaluate(probe); await T('touchEnd', []); await c.detach(); return out;
};
const DRAGS = {
  a_slider: { sel: '.as-hd', dx: 90, dy: 0, probe: () => { const e = document.querySelector('.as-hd'); const r = e.getBoundingClientRect(); return r.left + r.width / 2; }, axis: 'dx' },
  a_order: { sel: '.ao-r .ao-gp', dx: 0, dy: 60, probe: () => { const e = document.querySelector('.ao-r.d'); if (!e) return null; const r = e.getBoundingClientRect(), l = document.querySelector('.ao-l').getBoundingClientRect(); return r.top + r.height / 2 - l.top; }, start: () => { const r = document.querySelector('.ao-r').getBoundingClientRect(), l = document.querySelector('.ao-l').getBoundingClientRect(); return r.top + r.height / 2 - l.top; }, axis: 'dy' },
  a_bins: { sel: '.ab-c', dx: 70, dy: 90, probe: () => { const g = document.querySelector('.ab-c.gh'); if (!g) return null; const r = g.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, axis: 'xy' },
};

for (const [w, h] of VPS) {
  console.log(`\n== ${w}x${h}`);
  const p = await page(w, h);
  for (const id of list) {
    await go(p, `${base}?cap=${id}&cheat=1&seed=7`); await p.waitForSelector('.cap-host', { timeout: 15000 }).catch(() => {}); await p.waitForTimeout(1300);
    const m = await p.evaluate(measure); const tag = `${w}x${h} ${id}`;
    console.log(`${id.padEnd(11)} zoom=${m.zoom} page+${m.page} hx+${m.hx} scroll+${m.scroll} ${m.btn ? `btn="${m.btn}" ${m.top}-${m.bottom} h${m.h} inView=${m.inView} free=${m.uncovered}` : '(no btn)'} fonts<12:${m.fonts?.length} small:${m.small?.length}`);
    if (m.err) { bad(`${tag} ${m.err}`); continue; }
    if (m.zoom) bad(`${tag} uses zoom on ${m.zoom} elements`);
    if (m.page > 1) bad(`${tag} page scrolls by ${m.page}px`);
    if (m.hx > 1) bad(`${tag} horizontal page overflow ${m.hx}px`);
    if ((w === 390 || w === 1280) && m.scroll > 8) bad(`${tag} card content scrolls internally by ${m.scroll}px (budget 8)`);
    if (m.hostX > 3) bad(`${tag} host horizontal overflow ${m.hostX}px`);
    if (m.btn) { if (!m.inView) bad(`${tag} primary "${m.btn}" not fully visible above footer (${m.top}-${m.bottom})`); else if (!m.uncovered) bad(`${tag} primary "${m.btn}" covered`); if (m.h < 40) bad(`${tag} primary "${m.btn}" only ${m.h}px tall`); }
    else if (!NO_ACTION.has(id)) bad(`${tag} no primary action found (declare data-primary or add to NO_ACTION)`);
    else if (m.scroll > 2) bad(`${tag} click-to-solve captcha scrolls internally by ${m.scroll}px`);
    if (m.fonts.length) bad(`${tag} text < 12px: ${m.fonts.slice(0, 5).join(', ')}`);
    if (m.ell.length) bad(`${tag} text truncated with ellipsis: ${m.ell.slice(0, 3).join(' | ')}`);
    if (m.small.length) bad(`${tag} tap targets < 40px: ${m.small.slice(0, 4).join(', ')}`);
    {
      const r = await p.evaluate(async () => {
        const host = document.querySelector('.cap-host'), slot = document.querySelector('.cap-slot'); const out = { unreach: [], hud: [], ui: [] };
        const vis = (e) => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 2 && r.height > 2 && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0'; };
        const tsel = 'button,a[href],input:not([type=hidden]),select,textarea,[role=button],[role=slider],[tabindex]:not([tabindex="-1"])';
        const set = new Set([...host.querySelectorAll(tsel)].filter(vis)); host.querySelectorAll('*').forEach((e) => { const c = getComputedStyle(e).cursor; if ((c === 'pointer' || c === 'grab') && !e.closest(tsel) && vis(e) && e.getBoundingClientRect().width < slot.clientWidth * 0.95) set.add(e); });
        const pin = host.querySelector('.pin-action');
        const p0 = new Map([...set].map((e) => { const r = e.getBoundingClientRect(); return [e, r.left + r.top]; })); await new Promise((r) => setTimeout(r, 160));
        for (const e of set) {
          if (pin && (pin === e || pin.contains(e))) continue;
          { const r = e.getBoundingClientRect(); if (Math.abs(r.left + r.top - p0.get(e)) > 2) continue; /* moving target (animated), not a layout problem */ }
          let ok = false; for (const blk of ['nearest', 'center', 'start']) {
            e.scrollIntoView({ block: blk }); const r = e.getBoundingClientRect(), sr = slot.getBoundingClientRect(); const pr = pin ? pin.getBoundingClientRect() : null;
            const inside = r.top >= sr.top - 1 && r.bottom <= sr.bottom + 1 && (!pr || r.bottom <= pr.top + 1 || r.top >= pr.bottom - 1 || pr.top >= sr.bottom);
            const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
            if (inside && el && (el === e || e.contains(el) || el.contains(e) || (host.contains(el) && !el.closest('.pin-action')))) { ok = true; break; }
          }
          if (!ok) out.unreach.push(((e.className || e.tagName) + '').toString().slice(0, 18) + '[' + (e.textContent || e.value || '').trim().slice(0, 8) + ']');
        }
        slot.scrollTop = 0;
        for (const e of document.querySelectorAll('.hud .icon-btn, .ol-ghostbtn')) { const r = e.getBoundingClientRect(); if (r.width && Math.min(r.width, r.height) < 41.5) out.hud.push(`${e.className.toString().slice(0, 14)} ${Math.round(r.width)}x${Math.round(r.height)}`); }
        const w = document.createTreeWalker(document.querySelector('.game-root') || document.body, NodeFilter.SHOW_TEXT);
        for (let n = w.nextNode(); n; n = w.nextNode()) { if (!n.textContent.trim()) continue; const e = n.parentElement; if (!e || e.closest('.cap-host,svg,.sr-only,[hidden]')) continue; if (!vis(e)) continue; const fs = parseFloat(getComputedStyle(e).fontSize); if (fs < 11.95) out.ui.push(`${n.textContent.trim().slice(0, 16)}=${fs.toFixed(1)}`); }
        out.ui = [...new Set(out.ui)]; return out;
      });
      if (r.unreach.length && KNOWN[id]) console.log(`   KNOWN ISSUE (${KNOWN[id]}): ${r.unreach.slice(0, 3).join(', ')}`); else if (r.unreach.length) bad(`${tag} controls not reachable / covered by the pinned bar: ${r.unreach.slice(0, 4).join(', ')}`);
      if (r.hud.length) bad(`${tag} HUD touch targets < 42px: ${r.hud.join(', ')}`);
      if (r.ui.length) bad(`${tag} UI text < 12px outside the captcha: ${r.ui.slice(0, 5).join(', ')}`);
    }
    const d = DRAGS[id];
    if (d && !skipDrag) {
      const box = await p.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, d.sel);
      if (!box) { bad(`${tag} drag: ${d.sel} not found`); continue; }
      const res = await cdpDrag(p, box.x, box.y, d.dx, d.dy, d.probe, d.start);
      let ok = true, msg = '';
      if (d.axis === 'xy') { if (!res.during) { ok = false; msg = 'no ghost during drag'; } else { const dxm = res.during[0] - box.x, dym = res.during[1] - box.y; ok = (Math.abs(dxm - d.dx) <= Math.max(10, 0.08 * d.dx)) && (Math.abs(dym - d.dy) <= Math.max(10, 0.08 * d.dy)); /* 10px slack: the ghost is content-sized, so its centre sits a few px off the card's */ msg = `finger (${d.dx},${d.dy}) ghost (${dxm.toFixed(0)},${dym.toFixed(0)})`; } }
      else { if (res.during == null) { bad(`${tag} drag: no dragged row`); continue; } const del = res.during - (d.start ? res.start : res.before); const want = d[d.axis]; ok = Math.abs(del - want) / want <= 0.08; msg = `finger ${want} element ${del.toFixed(0)}`; }
      console.log(`   drag ${msg} ${ok ? 'ok' : 'DRIFT'}`); if (!ok) bad(`${tag} drag accuracy: ${msg}`);
    }
  }
  if (!quick) { // narrator bubble must never clip the longest lines; solo end screen must keep its actions reachable + contrasted
    await go(p, `${base}?cap=a_checkbox&cheat=1&seed=7`); await p.waitForSelector('.cap-host'); await p.waitForTimeout(1200);
    const longest = await p.evaluate(async () => { const m = await import('/js/narrator.js'); const all = []; for (const v of Object.values(m.LINES)) (Array.isArray(v) ? v : Object.values(v).flat()).forEach((x) => all.push(x)); return all.sort((x, y) => y.length - x.length).slice(0, 8); });
    let worst = 0; for (const t of longest) {
      const r = await p.evaluate((t) => { window.__game.speaker.say(t, 'neutral', { force: true, instant: true }); const tx = document.querySelector('.game-root .bubble-text'), bu = document.querySelector('.game-root .bubble'); return { over: tx.scrollHeight - tx.clientHeight, gap: bu.getBoundingClientRect().bottom - tx.getBoundingClientRect().bottom }; }, t);
      worst = Math.max(worst, r.over); if (r.gap < 0) bad(`${w}x${h} narrator bubble clips ${t.length}-char line (over ${r.over}px, gap ${r.gap.toFixed(1)}): "${t.slice(0, 30)}…"`);
    }
    console.log(`   narrator longest-8 lines clip=${worst}px`);
    await p.evaluate(() => { __cap.game.charge('Échec à « Pièce de puzzle » (pièce à conviction n° 03)'); __cap.game.charge('Échec à « Pièce de puzzle » (pièce à conviction n° 03)'); __cap.game.charge('Rapidité suspecte sur « Texte tordu » (1,2 s)'); __cap.game.charge('Respiration jugée trop régulière'); __cap.over(); });
    await p.waitForFunction(() => document.body.dataset.slam || document.querySelector('.screen.end'), null, { timeout: 30000 }).catch(() => {}); if (!(await p.evaluate(() => document.body.dataset.slam))) bad(`${w}x${h} game-over cinematic stamp never slammed`); await p.waitForFunction(() => { const b = document.querySelector('.slam b'); return !b || b.getAnimations().filter((a) => a.animationName === 'slamin').every((a) => a.playState === 'finished'); }, null, { timeout: 20000 }).catch(() => {}); await p.waitForTimeout(700);
    { const sl = await p.evaluate(() => { const b = document.querySelector('.slam b'); if (!b) return null; const r = b.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, vw: innerWidth, vh: innerHeight }; });
      if (sl && (sl.l < -1 || sl.t < -1 || sl.r > sl.vw + 1 || sl.b > sl.vh + 1)) bad(`${w}x${h} cinematic stamp clipped by the viewport (${Math.round(sl.l)},${Math.round(sl.t)} - ${Math.round(sl.r)},${Math.round(sl.b)})`); }
    await p.mouse.click(5, 5); await p.waitForSelector('.screen.end .verdict-card', { timeout: 15000 }); await p.waitForFunction(() => document.getAnimations().filter((a) => a.effect?.target?.closest?.('.screen.end')).every((a) => a.playState !== 'running'), null, { timeout: 15000 }).catch(() => {}); await p.waitForTimeout(400);
    { const st = await p.evaluate(() => { const b = document.querySelector('.screen.end .big-stamp'), v = document.querySelector('.screen.end .vc-body'); const rb = b.getBoundingClientRect(), rv = v.getBoundingClientRect(); const c = document.querySelector('.screen.end .verdict-card').getBoundingClientRect(); return { top: rb.top - rv.top, topCard: rb.top - c.top, right: c.right - rb.right, left: rb.left - c.left }; });
      if (st.top < 0 || st.topCard < 0 || st.right < 0 || st.left < 0) bad(`${w}x${h} end-card stamp clipped by its card (top ${Math.round(st.top)}, left ${Math.round(st.left)}, right ${Math.round(st.right)})`); }
    const e = await p.evaluate((CONTRAST) => { const f = eval(CONTRAST); const vh = innerHeight; const b = [...document.querySelectorAll('.screen.end .actions .btn')].map((x) => x.getBoundingClientRect().bottom); const stat = [...document.querySelectorAll('.screen.end .stat')].map((x) => x.textContent).join('|'); return { btnBottom: Math.max(...b), vh, contrast: f('.screen.end .verdict-card'), stat }; }, `(${CONTRAST.toString()})`);
    console.log(`   solo game-over: actions bottom ${Math.round(e.btnBottom)}/${e.vh}; ${e.contrast.length} contrast issues`);
    { const ov = await p.evaluate(`(${TEXT_OVERLAP.toString()})('.screen.end .verdict-card')`); if (ov.length) bad(`${w}x${h} game-over text overlaps: ${ov.slice(0, 3).join(', ')}`); }
    if (e.btnBottom > e.vh + 1) bad(`${w}x${h} game-over actions below fold (${Math.round(e.btnBottom)} > ${e.vh})`);
    if (e.contrast.length) bad(`${w}x${h} game-over contrast < 4.5: ${e.contrast.slice(0, 4).join(', ')}`);
    if (/\d\s*\/\s*3/.test(e.stat.split('|')[2] || '')) bad(`${w}x${h} game-over shows an "n / 3" error count that can exceed 3: ${e.stat}`);
  }
  if (p.errs.length) bad(`${w}x${h} console errors: ${[...new Set(p.errs)].slice(0, 3).join(' / ')}`);
  await p.context().close();
}

if (!quick) {
  console.log('\n== ledger sheet');
  const p = await page(390, 800); await go(p, `${base}?cap=a_checkbox&cheat=1`); await p.waitForSelector('.cap-host'); await p.waitForTimeout(1200);
  const open = () => p.evaluate(() => document.querySelector('.ledger').classList.contains('open'));
  await p.click('.ledger-btn'); if (!(await open())) bad('ledger did not open'); await p.keyboard.press('Escape'); if (await open()) bad('ledger still open after Escape');
  await p.click('.ledger-btn'); await p.mouse.click(190, 20); await p.waitForTimeout(150); if (await open()) bad('ledger still open after tap-out');
  const t0 = await p.evaluate(() => document.querySelector('.clock-val').textContent); await p.click('.ledger-btn'); await p.waitForTimeout(1500); const t1 = await p.evaluate(() => document.querySelector('.clock-val').textContent);
  console.log(`  open/Escape/tap-out ok; timer while open: ${t0} -> ${t1}`); if (t0 === t1) bad('timer frozen while ledger open');
  await p.context().close();
}

for (const [cw, ch] of (quick ? [[360, 640]] : [[360, 640], [390, 800]])) {
  console.log(`\n== cinematics (${cw}x${ch})`);
  const p = await page(cw, ch); await go(p, `${base}?cap=a_checkbox&cheat=1&seed=7`); await p.waitForSelector('.cap-host'); await p.waitForTimeout(1200);
  await p.evaluate(() => { const g = __cap.game; g.lastTier = 1; g.level = 10; g.beginLevel(); });
  await p.waitForSelector('.tier-beat', { timeout: 10000 }).catch(() => bad('tier change: .tier-beat overlay never appeared')); await p.waitForTimeout(600);
  const so = await p.evaluate(() => document.querySelector('.game-root').classList.contains('cine')); if (!so) bad('tier change: card not hidden (.cine missing) during the 3D beat');
  await p.mouse.click(5, 5); await p.waitForSelector('.cap-host', { timeout: 8000 }).catch(() => bad('tier change: skip did not resume the level')); 
  { const gone = await p.evaluate(() => !document.querySelector('.tier-beat')); if (!gone) bad('tier change: overlay still present after skip'); }
  await p.evaluate(() => __cap.win()); await p.waitForFunction(() => document.body.dataset.slam || document.querySelector('.screen.end'), null, { timeout: 30000 }).catch(() => {}); if (!(await p.evaluate(() => document.body.dataset.slam))) bad('win: stamp never slammed');
  const sw = await p.evaluate(() => document.querySelector('.stage').classList.contains('dim')); if (!sw) bad('win: card not hidden (.stage.dim missing) during the gate beat');
  await p.mouse.click(5, 5); await p.waitForSelector('.screen.end', { timeout: 10000 }).catch(() => bad('win: skip did not reveal the stat card'));
  if (p.errs.length) bad(`cinematics console errors: ${[...new Set(p.errs)].slice(0, 3).join(' / ')}`); else console.log('  tier beat + win beat: card hidden, skip works, no console errors');
  await p.context().close();
}
if (!skipCls) {
  console.log('\n== CLS (mount + strike + solve)');
  for (const [w, h] of VPS) for (const id of ['a_checkbox', 'a_grid']) {
    const p = await page(w, h); await go(p, `${base}?cap=${id}&cheat=1&seed=7`); await p.waitForSelector('.cap-host'); await p.waitForTimeout(1500);
    await p.evaluate(() => __cap.fail('La réponse ne respecte pas la règle affichée : relisez la consigne.')); await p.waitForTimeout(2600);
    { const v = await p.evaluate(() => document.querySelector('.card-foot').className); if (v.includes('v-bad')) bad(`${w}x${h} ${id} stale strike verdict still shown after retry mount`); }
    await p.evaluate(() => window.__cap.solve()); await p.waitForTimeout(2200);
    const cls = await p.evaluate(() => window.__cls), src = await p.evaluate(() => window.__clsSrc.slice().sort((a, b) => b[0] - a[0]).slice(0, 4).map((x) => x[1]));
    console.log(`  ${w}x${h} ${id.padEnd(11)} CLS=${cls.toFixed(3)} ${cls > 0.05 ? src.join(' ; ') : ''}`);
    if (cls >= 0.05) bad(`${w}x${h} ${id} CLS ${cls.toFixed(3)} >= 0.05`);
    await p.context().close();
  }
  { const p = await page(390, 800); await go(p, base + '?cheat=1'); await p.waitForTimeout(1500); await p.click('.btn.primary'); await p.waitForTimeout(2500);
    await p.evaluate(() => document.querySelector('.ledger-btn')?.click()); await p.waitForTimeout(800);
    const cls = await p.evaluate(() => window.__cls); console.log(`  390x800 title->play(+ledger) CLS=${cls.toFixed(3)}`);
    if (cls >= 0.05) bad(`title->play CLS ${cls.toFixed(3)} >= 0.05`); await p.context().close(); }
}

if (!skipOnline) {
  console.log('\n== online race 390x800 (+ desktop partner)');
  const mk = async (w, h) => { const p = await page(w, h); await go(p, base + '?cheat=1'); await p.waitForTimeout(1500); await p.click('.btn.ghost'); await p.waitForTimeout(900); return p; };
  const A = await mk(1280, 800), B = await mk(390, 800);
  await A.fill('input[aria-label=Pseudo]', 'Alice'); await B.fill('input[aria-label=Pseudo]', 'Bob');
  await A.click('text=Créer une salle'); await A.waitForSelector('.ol-code b'); const code = await A.textContent('.ol-code b');
  await B.fill('input[aria-label="Code de salle"]', code); await B.click('text=Rejoindre'); await B.waitForSelector('.ol-code b');
  await A.click('text=+ Ajouter un bot'); await B.click('text=Je suis prêt'); await sleep(600); await A.click('text=Lancer la partie');
  { const seen = []; for (let i = 0; i < 60; i++) { const t = await B.evaluate(() => { const b = document.querySelector('.ol-count b'); return b ? b.textContent : document.querySelector('.ol-race') ? 'RACE' : null; }); if (t === 'RACE') break; if (t !== null) seen.push(t); await sleep(120); }
    console.log(`  countdown numerals seen: ${[...new Set(seen)].join(' ')}`); if (seen.some((t) => !/^(3|2|1|GO)$/.test(t))) bad(`online countdown shows a non-numeral/blank: ${[...new Set(seen)].map((x) => JSON.stringify(x)).join(',')}`); if (!seen.includes('3')) bad('online countdown never showed 3'); }
  await B.waitForSelector('.ol-race', { timeout: 15000 }); await B.evaluate(() => { window.__cls = 0; window.__clsSrc = []; }); /* CLS counted from race start */ await B.waitForSelector('.cap-host', { timeout: 15000 }); await sleep(2500);
  const solve = (p) => p.evaluate(() => window.CAPCHA_ONLINE.game?.cur?.api.solve());
  const fail = (p) => p.evaluate(() => window.CAPCHA_ONLINE.game?.cur?.api.fail('La case cochée était la mauvaise, selon le règlement.'));
  await solve(B); await sleep(1600); await fail(B); await sleep(2200); await solve(B); await sleep(1500);
  const o = await B.evaluate(() => { const card = document.querySelector('.ol-game .card').getBoundingClientRect(); const sp = document.querySelector('.ol-game .speaker'); return { cardTop: Math.round(card.top), cardBottom: Math.round(card.bottom), vh: innerHeight, speaker: sp ? getComputedStyle(sp).display : 'none', cls: window.__cls, src: window.__clsSrc.slice().sort((a, b) => b[0] - a[0]).slice(0, 4).map((x) => x[1]), page: document.querySelector('.ol-root').scrollHeight - innerHeight }; });
  console.log(`  card ${o.cardTop}-${o.cardBottom} of ${o.vh}  Gérard=${o.speaker}  CLS=${o.cls.toFixed(3)}  rootScroll=${o.page} ${o.cls > 0.1 ? o.src.join(' ; ') : ''}`);
  if (o.cardTop > 150) bad(`online 390: chrome above card is ${o.cardTop}px (> 150)`);
  if (o.vh - o.cardBottom > 70) bad(`online 390: ${o.vh - o.cardBottom}px dead space below card`);
  if (o.speaker !== 'none') bad('online 390: Gérard visible during race');
  if (o.cls >= 0.1) bad(`online 390 CLS ${o.cls.toFixed(3)} >= 0.1`);
  if (o.page > 1) bad(`online 390 page scrolls by ${o.page}px`);
  // finish the match with real solve calls, then audit the results screen (podium, sticky actions, contrast)
  let podium = false; for (let i = 0; i < 220 && !podium; i++) { await solve(A); await solve(B); await sleep(450); podium = !!(await B.$('.ol-podium')); }
  if (!podium) bad('online: match never reached the podium'); else {
    await sleep(2500);
    for (const [P, name] of [[B, '390'], [A, '1280']]) {
      const r = await P.evaluate((C) => { const f = eval(C); const root = document.querySelector('.ol-root'); const desk = innerWidth >= 1000; root.scrollTo(0, desk ? 0 : root.scrollHeight); const acts = [...document.querySelectorAll('.ol-actions .ol-btn')].map((x) => x.getBoundingClientRect()); const rows = [...document.querySelectorAll('.ol-tbl tbody tr')].map((x) => x.getBoundingClientRect().bottom); const bar = document.querySelector('.ol-actions').getBoundingClientRect();
        return { desk, vh: innerHeight, bottom: Math.max(...acts.map((x) => x.bottom)), top: Math.min(...acts.map((x) => x.top)), lastRow: Math.max(...rows), barTop: bar.top, contrast: f('.ol-end') }; }, `(${CONTRAST.toString()})`);
      console.log(`  results ${name}: actions ${Math.round(r.top)}-${Math.round(r.bottom)} of ${r.vh}, last row ${Math.round(r.lastRow)} vs bar top ${Math.round(r.barTop)}, contrast issues ${r.contrast.length}`);
      if (r.bottom > r.vh + 1) bad(`online results ${name}: actions below fold`);
      if (!r.desk && r.lastRow > r.barTop + 1) bad(`online results ${name}: result list hidden under the sticky bar`);
      { const ov = await P.evaluate(`(${TEXT_OVERLAP.toString()})('.ol-end')`); if (ov.length) bad(`online results ${name} text overlaps: ${ov.slice(0, 3).join(', ')}`); }
      if (r.contrast.length) bad(`online results ${name} contrast < 4.5: ${r.contrast.slice(0, 5).join(', ')}`);
    }
  }
}
await b.close(); srv?.kill();
console.log('\n' + (fails.length ? `GATE FAILED (${fails.length})\n- ` + fails.join('\n- ') : 'GATE PASSED'));
process.exit(fails.length ? 1 : 0);
