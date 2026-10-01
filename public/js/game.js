import * as THREE from 'three';
import { CAPTCHAS } from './captchas/index.js';
import { h, Speaker, confetti, clearConfetti, soundButton, endScreen, fmtSec, reducedMotion, loadBest, saveBest } from './ui.js';
import { sfx, setTension, startMusic } from './audio.js';
import { say, moodFor, rankFor } from './narrator.js';
import { bg } from './scene.js';

export function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const TIER_TIME = { 1: 20000, 2: 25000, 3: 30000, 4: 35000, 5: 45000 };
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const pad = (n) => String(n).padStart(2, '0');
const RM = () => reducedMotion();

export class Game {
  constructor({ root, seedFor = (l) => l * 7919 + 13, mode = 'solo', onEvent = () => {}, startLevel = 1, onReplay, onMenu }) {
    Object.assign(this, { root, seedFor, mode, onEvent, level: startLevel, startLevel, onReplay, onMenu, strikes: 0, cur: null, phase: 'idle' });
    this.stats = { solves: 0, sumMs: 0, fastest: 0, streak: 0, maxStreak: 0, strikes: 0, reached: startLevel, totalMs: 0 };
    this.dossier = []; this.past = { fast: null, slow: null, strikes: [] }; this.timeouts = new Set(); this.idleN = 0; this.lastAct = performance.now(); this.lastTier = 0; this.sayTok = 0;
  }
  charge(t) { const e = this.dossier.find((d) => d.t === t); if (e) e.n++; else this.dossier.push({ t, n: 1 }); }
  dossierLine() { const n = this.dossier.length; if (!n) return ''; return `Dossier : ${n} charge${n > 1 ? 's' : ''} · suspicion ${Math.round((this.susp || 0) * 100)} %`; }
  callback() {
    const q = this.past, sec = (ms) => fmtSec(ms), pick = (a) => a[Math.floor(Math.random() * a.length)];
    const opts = [];
    if (q.strikes.length) { const t = pick(q.strikes); opts.push(`Je repense à « ${t} ». Une erreur pareille, ça se garde en mémoire. La mienne, pas la vôtre.`, `« ${t} » : c’est classé. Sous « Anecdotes pour la retraite ».`); }
    if (q.fast) opts.push(`Votre « ${q.fast.t} » en ${sec(q.fast.ms)} ? J’ai demandé une expertise. Les experts rient encore.`);
    if (q.slow) opts.push(`« ${q.slow.t} », ${sec(q.slow.ms)}. J’ai eu le temps de refaire mon CV.`);
    if (this.dossier.length >= 3) opts.push(`Votre dossier compte ${this.dossier.length} charges. Je les relis le soir. C’est mon Netflix.`);
    return opts.length ? pick(opts) : null;
  }
  get total() { return CAPTCHAS.length; }
  get progress() { return clamp01((this.level - 1) / Math.max(1, this.total)); }
  later(fn, ms) { const id = setTimeout(() => { this.timeouts.delete(id); fn(); }, ms); this.timeouts.add(id); return id; }
  ctx() { return { progress: this.progress, level: this.level, strikes: this.strikes }; }

  start() {
    this.root.replaceChildren(); this.root.classList.add('game-root');
    document.body.classList.remove('end-open'); this.runT0 = performance.now(); this.ui();
    startMusic();
    this.act = () => { this.lastAct = performance.now(); };
    ['pointerdown', 'keydown'].forEach((e) => this.card.addEventListener(e, this.act, true));
    this.idleIv = setInterval(() => this.idleCheck(), 1500);
    this.onKey = (e) => { if (e.key === 'Escape' && this.ledger.classList.contains('open')) { this.toggleLedger(false); this.lbBar.focus?.(); } };
    this.onDown = (e) => { if (this.ledger.classList.contains('open') && !this.list.contains(e.target) && !this.lbBar.contains(e.target)) this.toggleLedger(false); };
    this.onResize = () => this.fitSoon();
    addEventListener('keydown', this.onKey); addEventListener('pointerdown', this.onDown, true); addEventListener('resize', this.onResize);
    this.host.addEventListener('scroll', () => this.slotMore(), { passive: true });
    this.raf = requestAnimationFrame((n) => this.frame(n));
    this.syncMood();
    this.load({ first: true });
  }
  // Point d'entrée des transitions (l'orchestrateur en ligne peut le neutraliser : game.load = () => {}).
  load(o = {}) {
    if (o.leave && !RM()) { this.card.classList.add('leaving'); this.later(() => { this.card.classList.remove('leaving'); this.beginLevel(o); }, 260); }
    else this.beginLevel(o);
  }
  ui() {
    const pips = h('ol', { class: 'pips', 'aria-hidden': 'true' });
    for (let i = 0; i < this.total; i++) pips.append(h('li', {}));
    this.pips = pips;
    this.levelLabel = h('span', { class: 'lvl-num' }); this.levelN = h('span', { class: 'ch-n' }); this.levelTitle = h('span', { class: 'lvl-title' });
    this.strikeEls = [0, 1, 2].map(() => h('span', { class: 'strike' }, h('b', {}, '♥')));
    this.clock = h('span', { class: 'clock-val' }, '--'); this.clockBox = h('div', { class: 'clock', role: 'timer', 'aria-label': 'Temps restant' }, h('span', { class: 'clock-lbl', 'aria-hidden': 'true' }, 'Temps'), this.clock);
    this.hud = h('header', { class: 'hud' },
      h('div', { class: 'hud-l' }, h('span', { class: 'brand', 'aria-hidden': 'true' }, 'CAPCHA™'), h('div', { class: 'lvl' }, this.levelLabel)),
      h('div', { class: 'hud-c' }, pips),
      h('div', { class: 'hud-r' }, this.lbBar = h('button', { class: 'icon-btn ledger-btn', type: 'button', 'aria-expanded': 'false', 'aria-label': 'Registre de conformité', title: 'Registre de conformité', onclick: () => this.toggleLedger() }, h('span', { 'aria-hidden': 'true' }, '§'), this.lbCount = h('i', { class: 'lb-count', 'aria-hidden': 'true' }, '0')), h('div', { class: 'strikes', role: 'img', 'aria-label': 'Vies restantes : 3 sur 3' }, h('span', { class: 'strikes-lbl', 'aria-hidden': 'true' }, 'Vies'), h('span', { class: 'strike-row' }, this.strikeEls)), this.clockBox, soundButton()));
    this.strikesBox = this.hud.querySelector('.strikes');
    this.speaker = new Speaker();
    this.nOk = 0; this.nBad = 0;
    this.lbText = { textContent: '' };
    this.list = h('ol', { class: 'ledger-list', 'aria-label': 'Registre des vérifications' }, h('li', { class: 'rule-head', 'aria-hidden': 'true' }, 'Registre de conformité'));
    this.ledger = h('section', { class: 'ledger' + (this.mode === 'solo' ? ' ledger-wide' : ''), 'aria-label': 'Registre de conformité' }, this.list);
    this.stamp = h('div', { class: 'stamp', 'aria-hidden': 'true' });
    this.cardHead = h('div', { class: 'card-head' }, this.levelN, h('span', { class: 'ch-title' }, this.levelTitle), h('span', { class: 'threat', 'aria-hidden': 'true' }));
    this.host = h('div', { class: 'cap-slot' });
    this.footBase = this.footDefault = 'Protégé par CAPCHA™ · Vos erreurs sont consignées · Confidentialité (non)';
    this.foot = h('div', { class: 'card-foot', 'aria-hidden': 'true' }, this.footDefault);
    this.srEl = h('div', { class: 'sr-only', role: 'status', 'aria-live': 'polite' });
    this.card = h('section', { class: 'card', 'aria-label': 'Vérification en cours' }, this.cardHead, this.host, this.stamp, this.foot);
    this.bar = h('div', { class: 'bar' }, h('i', {}));
    this.barFill = this.bar.firstChild;
    this.flashEl = h('div', { class: 'flash', 'aria-hidden': 'true' });
    this.banner = h('div', { class: 'banner', 'aria-hidden': 'true' });
    this.hud.append(this.bar);
    this.stage = h('div', { class: 'stage' }, this.hud, this.speaker.el, this.card);
    this.root.append(this.stage, this.ledger, this.flashEl, this.srEl);
    if (this.mode !== 'solo') this.root.classList.add('online');
    this.card.append(this.banner);
  }
  speak(t, mood = 'neutral', force = false) { this.sayTok++; this.speaker.say(t, mood, { force }); }
  narrate(key, extra) { const t = say(key, Math.random, { ...this.ctx(), ...extra }); this.speak(t, moodFor(key, this.ctx())); return t; }
  syncMood() {
    const susp = clamp01(this.strikes / 3 * 0.7 + this.progress * 0.3);
    this.susp = susp; bg.set({ suspicion: susp });
    this.speaker.setStage(this.strikes >= 2 || this.progress > 0.66 ? 2 : this.strikes >= 1 || this.progress > 0.33 ? 1 : 0);
    this.root.dataset.susp = String(Math.round(susp * 3));
  }
  hudRefresh() {
    const def = CAPTCHAS[this.level - 1];
    this.levelLabel.replaceChildren(h('span', { class: 'lv-w' }, 'Vérification '), `${pad(Math.min(this.level, this.total))}/${pad(this.total)}`, h('span', { class: 'lv-t' }, ' · ' + (CAPTCHAS[this.level - 1]?.title || ''))); this.levelN.textContent = pad(Math.min(this.level, this.total));
    if (def) { this.levelTitle.textContent = def.title; this.card.querySelector('.threat').textContent = '●'.repeat(def.tier || 1) + '○'.repeat(Math.max(0, 5 - (def.tier || 1))); this.card.querySelector('.threat').title = 'Niveau de menace'; }
    [...this.pips.children].forEach((li, i) => { li.className = i < this.level - 1 ? 'done' : i === this.level - 1 ? 'now' : ''; });
    this.strikeEls.forEach((el, i) => el.classList.toggle('on', i < this.strikes));
    this.strikesBox.setAttribute('aria-label', `Vies restantes : ${3 - this.strikes} sur 3`);
  }

  beginLevel({ retry = false, seed, first = false } = {}) {
    this.destroyCur(); this.phase = 'intro'; if (!retry) this.stamp.className = 'stamp';
    const def = CAPTCHAS[this.level - 1];
    if (!def) { this.finish('win'); return; }
    this.stats.reached = Math.max(this.stats.reached, this.level);
    this.hudRefresh(); this.syncMood();
    this.root.dataset.pressure = 'low'; this.root.style.setProperty('--pressure', '0'); this.clock.textContent = '--';
    const tier = def.tier || 1;
    if (!retry) { this.card.classList.remove('struck', 'solved'); this.footDefault = matchMedia('(max-width: 640px) and (max-height: 720px)').matches ? `${pad(this.level)} · ${def.title} · CAPCHA™` : this.footBase; this.foot.className = 'card-foot'; this.foot.textContent = this.footDefault; } this.card.dataset.tier = tier;
    const fast = this.mode !== 'solo';
    const delay = retry ? 0 : RM() ? 120 : fast ? 260 : 640;
    if (!retry) this.banner.replaceChildren(h('div', { class: 'bn-in' }, h('span', { class: 'bn-k' }, retry ? 'Nouvel essai' : 'Vérification'), h('span', { class: 'bn-n' }, retry ? `n° ${pad(this.level)}` : pad(this.level)), h('span', { class: 'bn-t' }, def.title), this.dossier.length ? h('span', { class: 'bn-d' }, this.dossierLine(), h('i', {}, '« ' + this.dossier[this.dossier.length - 1].t + ' »')) : null));
    if (!retry) { this.banner.className = 'banner show'; this.card.classList.add('entering'); this.host.replaceChildren(); this.host.classList.remove('ready'); }
    if (!retry) { sfx('level'); bg.pulse('level'); }
    // narration
    if (!retry) {
      if (first && this.level === 1 && this.strikes === 0 && !this.stats.solves) this.narrate('begin');
      else if (tier > this.lastTier && this.lastTier && LINES_TIER(tier)) this.narrate('tier' + tier);
      else if (!first && this.level >= 3 && Math.random() < 0.4 && this.callback()) this.speak(this.callback(), 'smug');
      else if (first || Math.random() < 0.33) this.narrate('level');
      this.lastTier = tier;
    }
    this.later(() => this.mount(def, seed ?? this.seedFor(this.level)), delay);
  }

  mount(def, seed) {
    clearConfetti(); this.card.classList.remove('entering', 'struck', 'solved'); this.banner.className = 'banner'; this.stamp.className = 'stamp';
    this.foot.className = 'card-foot'; this.foot.textContent = this.footDefault; /* le verdict d'une tentative précédente ne survit pas au nouvel essai */
    const rng = mulberry32(seed);
    this.host.classList.add('ready');
    const host = h('div', { class: 'cap-host' }); this.host.replaceChildren(host);
    const tickers = [];
    const t0 = performance.now();
    const c = { def, seed, host, limit: def.time ?? TIER_TIME[def.tier] ?? 25000, t0, mountT0: t0, tickers, done: false };
    const api = {
      rng, seed, level: this.level, THREE, h, reducedMotion: RM(),
      int: (a, b) => a + Math.floor(rng() * (b - a + 1)), pick: (a) => a[Math.floor(rng() * a.length)],
      shuffle: (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
      say: (t, mood) => this.speak(t, mood || 'neutral'), sfx,
      timer: (ms) => { c.limit = ms; c.t0 = performance.now(); },
      onTick: (fn) => tickers.push(fn),
      solve: () => { if (c.done || this.cur !== c || this.phase !== 'play') return; c.done = true; this.onSolved(c); },
      fail: (msg, o = {}) => {
        if (c.done || this.cur !== c || this.phase !== 'play') return;
        this.strike(msg, { retry: !!o.retry });
        if (this.strikes < 3 && !o.retry) { c.done = true; this.phase = 'struck'; this.later(() => this.load({ retry: true, seed: seed + 1000 * this.strikes + 1 }), RM() ? 700 : 1300); }
      }
    };
    c.api = api; this.cur = c; this.phase = 'play'; this.lastAct = performance.now(); this.nextBeat = 0;
    try { c.inst = def.mount(host, api); }
    catch (e) { console.error('captcha mount failed', def.id, e); host.append(h('p', { class: 'mount-err' }, 'Cette vérification a eu un malaise (' + def.id + '). Gérard prétend que c’est volontaire.')); this.later(() => api.solve(), 1500); }
    this.onEvent({ type: 'level', level: this.level });
    this.hudRefresh();
    this.fit();
    this.fitMO = new MutationObserver(() => this.fitSoon()); this.fitMO.observe(host, { childList: true, subtree: true, characterData: true });
  }

  // Pas de zoom : le contenu défile dans .cap-slot et l'action principale reste collée en bas du défileur (sticky).
  findPrimary(host) {
    const ok = (e) => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 8 && r.height > 8 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
    const all = [...host.querySelectorAll('[data-primary],.cap-go,.ak-btn,.bk-btn,button,[role=button],input[type=submit]')].filter(ok);
    return all.find((e) => e.matches('[data-primary],.cap-go,.ak-btn,.bk-btn')) || all.find((e) => /v[ée]rifier|valider|confirmer|envoyer|continuer|suivant|terminer|soumettre|^ok$/i.test(e.textContent || e.value || ''));
  }
  // Plancher de lisibilité tactile : texte >= 12 px effectifs, cibles interactives >= 40 px (aucun zoom, aucune transformation).
  legible(host) {
    const tsel = 'button,a[href],input:not([type=hidden]):not([type=checkbox]):not([type=radio]),select,textarea,[role=button],[role=slider]';
    const skip = new Set(['SCRIPT', 'STYLE', 'CANVAS', 'OPTION', 'svg', 'path']);
    host.querySelectorAll('*').forEach((e) => {
      if (skip.has(e.tagName)) return;
      const cs = getComputedStyle(e);
      if (cs.display === 'none') return;
      if ((cs.cursor === 'grab' || cs.cursor === 'pointer') && !e.matches(tsel) && !e.closest(tsel) && e.getBoundingClientRect().height > 8 && e.getBoundingClientRect().height < 40 && ![...e.children].some((k) => ['grab', 'pointer'].includes(getComputedStyle(k).cursor))) e.style.setProperty('min-height', '40px', 'important');
      if (parseFloat(cs.fontSize) < 12 && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) e.style.setProperty('font-size', '12px', 'important');
    });
    // texte tronqué par une ellipse : on autorise le retour à la ligne plutôt que de cacher des mots
    host.querySelectorAll('*').forEach((e) => {
      const cs = getComputedStyle(e);
      const lc = cs.webkitLineClamp; if (lc && lc !== 'none' && e.scrollHeight > e.clientHeight + 1) { e.style.setProperty('-webkit-line-clamp', 'unset', 'important'); e.style.setProperty('display', 'block', 'important'); e.style.setProperty('overflow', 'visible', 'important'); e.style.setProperty('max-height', 'none', 'important'); }
      if (cs.textOverflow === 'ellipsis' && e.scrollWidth > e.clientWidth + 1) { e.style.setProperty('white-space', 'normal', 'important'); e.style.setProperty('text-overflow', 'clip', 'important'); e.style.setProperty('overflow-wrap', 'anywhere', 'important'); }
    });
    host.querySelectorAll(tsel).forEach((e) => {
      const r = e.getBoundingClientRect(); if (!r.width || !r.height) return;
      if (r.height < 42) { e.style.setProperty('min-height', '42px', 'important'); }
      if (r.width < 42) { e.style.setProperty('min-width', '42px', 'important'); }
      if ((r.height < 42 || r.width < 42) && getComputedStyle(e).display === 'inline') { e.style.setProperty('display', 'inline-flex', 'important'); e.style.setProperty('align-items', 'center', 'important'); e.style.setProperty('justify-content', 'center', 'important'); }
    });
  }
  fit() {
    const c = this.cur, slot = this.host; if (!c || !c.host || !slot) return;
    const host = c.host; this.legible(host);
    host.querySelectorAll('.pin-action').forEach((e) => e.classList.remove('pin-action'));
    if (slot.scrollHeight > slot.clientHeight + 2) {
      const prim = this.findPrimary(host);
      if (prim) {
        let A = null;
        for (let e = prim; e && e !== host; e = e.parentElement) { const par = e.parentElement; if (par && par.getBoundingClientRect().height > slot.clientHeight - 30 && e.offsetHeight < slot.clientHeight * 0.45) { A = e; break; } }
        if (A) {
          A.classList.add('pin-action');
          if (getComputedStyle(A).backgroundColor === 'rgba(0, 0, 0, 0)') A.style.background = '#fff';
          for (let e = A.parentElement; e && e !== slot; e = e.parentElement) { const o = getComputedStyle(e).overflow; if (o === 'hidden' || o === 'auto' || o === 'scroll') e.style.overflow = 'clip'; }
        }
      }
    }
    this.slotMore();
  }
  fitSoon() { clearTimeout(this.fitT); this.fitT = setTimeout(() => this.fit(), 90); }
  slotMore() { const s = this.host; s.classList.toggle('more', s.scrollHeight > s.clientHeight + 4 && s.scrollTop + s.clientHeight < s.scrollHeight - 4); }
  destroyCur() {
    this.fitMO?.disconnect(); this.fitMO = null; const c = this.cur; this.cur = null; if (c) { try { c.inst?.destroy?.(); } catch (e) { console.error(e); } } }

  frame(now) {
    this.raf = requestAnimationFrame((n) => this.frame(n));
    const c = this.cur;
    if (this.phase !== 'play' || !c) return;
    const left = c.limit - (now - c.t0);
    const frac = clamp01(left / c.limit);
    const lowAbs = left < 8000 ? 1 - left / 8000 : 0;
    const pressure = clamp01(Math.max((1 - frac) * 0.7, lowAbs));
    this.barFill.style.transform = `scaleX(${frac})`;
    const sec = Math.max(0, left) / 1000;
    this.clock.textContent = sec < 10 ? sec.toFixed(1).replace('.', ',') : String(Math.ceil(sec));
    const lvl = pressure < 0.3 ? 'low' : pressure < 0.6 ? 'mid' : 'high';
    if (this.root.dataset.pressure !== lvl) this.root.dataset.pressure = lvl;
    this.root.style.setProperty('--pressure', pressure.toFixed(3));
    bg.set({ pressure });
    setTension(Math.max(pressure, this.susp * 0.7));
    if (left < 8000 && now > this.nextBeat) {
      sfx('heart'); bg.beat(); this.clockBox.classList.remove('beat'); void this.clockBox.offsetWidth; this.clockBox.classList.add('beat');
      this.nextBeat = now + 380 + 620 * (left / 8000);
      if (left < 3000 && Math.ceil(left / 1000) !== this.lastSec) { this.lastSec = Math.ceil(left / 1000); sfx('tick'); }
    }
    for (const f of c.tickers) { try { f(left); } catch (e) { console.error(e); } }
    if (left <= 0 && !c.done) {
      c.done = true; this.phase = 'struck';
      this.strike(null, { timeout: true });
      if (this.strikes < 3) this.later(() => this.load({ retry: true, seed: c.seed + 77 }), RM() ? 700 : 1300);
    }
  }

  onSolved(c) {
    const now = performance.now(), ms = now - c.mountT0;
    this.phase = 'solved';
    const st = this.stats; st.solves++; st.sumMs += ms; st.streak++; st.maxStreak = Math.max(st.maxStreak, st.streak); if (!st.fastest || ms < st.fastest) st.fastest = ms;
    sfx('good'); sfx('stamp'); bg.pulse('good');
    this.card.classList.add('solved'); this.stamp.className = 'stamp ok show'; this.stamp.innerHTML = '';
    this.stamp.append(h('b', {}, 'VALIDÉ'));
    this.flash('good');
    const r = this.card.getBoundingClientRect(); const fast = ms < c.limit * 0.3;
    sfx('confetti'); confetti(r.left, r.top + 40, fast ? 30 : 16); confetti(r.right, r.top + 40, fast ? 30 : 16);
    this.root.style.setProperty('--pressure', '0'); this.root.dataset.pressure = 'low'; setTension(this.susp * 0.5); bg.set({ pressure: 0 });
    const pettyPool = ['Respiration jugée trop régulière', 'Sourcil gauche suspect', 'A souri pendant un test (prémédité ?)', 'Possède un pouce opposable', 'A cligné des yeux 4 fois en 10 secondes', 'Posture trop humaine pour être honnête', 'Soupçon de clavier mécanique'];
    if (!this.past.fast || ms < this.past.fast.ms) this.past.fast = { t: c.def.title, ms };
    if (!this.past.slow || ms > this.past.slow.ms) this.past.slow = { t: c.def.title, ms };
    if (fast) this.charge(`Rapidité suspecte sur « ${c.def.title} » (${fmtSec(ms)})`);
    else if (ms > c.limit * 0.78) this.charge(`Hésitation prolongée devant « ${c.def.title} »`);
    else if (st.streak === 3) this.charge('Série de bonnes réponses : trop régulière');
    else if (Math.random() < 0.45) this.charge(pettyPool[Math.floor(Math.random() * pettyPool.length)]);
    this.rule('ok', `Règle ${pad(this.level)} respectée`, c.def.title, fmtSec(ms));
    this.onEvent({ type: 'solve', level: this.level, ms });
    const key = st.streak === 5 ? 'streak5' : st.streak === 3 ? 'streak3' : fast && st.strikes === 0 ? 'solveFast' : ms > c.limit * 0.78 ? 'solveSlow' : 'solve';
    this.narrate(key);
    // Économie de vies (solo) : un point de suspicion effacé tous les 4 niveaux réussis.
    if (this.mode === 'solo' && this.strikes > 0 && st.solves % 4 === 0) {
      this.strikes--; this.charge('Un point de suspicion effacé (erreur administrative)');
      this.hudRefresh(); this.syncMood(); sfx('good');
      const el = this.strikeEls[this.strikes]; el.classList.remove('hit', 'heal'); void el.offsetWidth; el.classList.add('heal');
      const lines = ['Un point de suspicion effacé… par erreur administrative. Ne vous y habituez pas.', 'J’ai effacé une de vos erreurs. Le formulaire était mal rempli. Par moi. C’est confidentiel.', 'Une erreur en moins. Ne cherchez pas à comprendre : moi non plus.'];
      this.speak(lines[Math.floor(Math.random() * lines.length)], 'worried');
    }
    this.level++;
    this.later(() => { if (this.level > this.total) { this.finish('win'); return; } this.load({ leave: this.mode === 'solo' }); }, RM() ? 400 : this.mode === 'solo' ? 1100 : 380);
  }

  toggleLedger(force) { const o = force ?? !this.ledger.classList.contains('open'); this.ledger.classList.toggle('open', o); this.lbBar.setAttribute('aria-expanded', String(o)); }
  rule(kind, title, text, meta) {
    kind === 'ok' ? this.nOk++ : this.nBad++;
    this.lbCount.textContent = String(this.nOk + this.nBad);
    this.lbBar.dataset.kind = kind; this.lbBar.classList.remove('new'); void this.lbBar.offsetWidth; this.lbBar.classList.add('new');
    const li = h('li', { class: 'rule ' + kind }, h('span', { class: 'rule-ic', 'aria-hidden': 'true' }, kind === 'ok' ? '✓' : '✕'),
      h('div', { class: 'rule-b' }, h('b', {}, title), text ? h('span', {}, text) : null), meta ? h('em', {}, meta) : null);
    this.list.firstChild.after(li);
    const msg = kind === 'ok' ? `✓ ${title.split(' ').slice(0, 2).join(' ')} · ${text} · ${meta}` : `✕ ${title} · ${meta}${/chronom/i.test(text) ? ' · temps écoulé' : ''}`;
    this.foot.className = 'card-foot v-' + kind; this.foot.textContent = msg; this.srEl.textContent = (kind === 'ok' ? '' : title + ' : ') + msg;
    const cap = this.mode === 'solo' ? 9 : 3;
    while (this.list.childElementCount > cap) this.list.lastChild.remove();
    return li;
  }
  flash(kind) { const f = this.flashEl; f.className = 'flash'; void f.offsetWidth; f.className = 'flash ' + kind; }

  strike(msg, { timeout = false, retry = false } = {}) {
    this.strikes++; this.stats.strikes++; this.stats.streak = 0;
    sfx('strike'); bg.pulse('bad'); this.flash('bad');
    this.hudRefresh(); this.syncMood();
    const idx = this.strikes - 1; this.strikeEls[idx]?.classList.add('hit');
    this.stage.classList.remove('shake'); void this.stage.offsetWidth; if (!RM()) this.stage.classList.add('shake');
    this.card.classList.add('struck');
    this.stamp.className = 'stamp bad show'; this.stamp.innerHTML = ''; this.stamp.append(h('b', {}, timeout ? 'TEMPS ÉCOULÉ' : 'REFUSÉ'));
    const over = this.strikes >= 3;
    const tt = CAPTCHAS[this.level - 1]?.title || 'une vérification'; this.past.strikes.push(tt); this.charge(timeout ? `A laissé expirer « ${tt} »` : `Échec à « ${tt} » (pièce à conviction n° ${pad(this.level)})`);
    const why = timeout ? 'Le chronomètre a expiré avant votre réponse.' : (msg && msg !== 'cheat' ? msg : 'Réponse incorrecte : elle ne respecte pas la règle affichée.');
    this.rule('bad', `Règle ${pad(this.level)} enfreinte`, why, `${this.strikes}/3`);
    if (!over) {
      const key = timeout ? 'timeout' : this.strikes === 1 ? 'strike1' : 'strike2';
      this.speak(say(key, Math.random, this.ctx()), timeout ? moodFor('timeout', this.ctx()) : this.strikes >= 2 ? 'angry' : 'smug', true);
    }
    this.onEvent({ type: 'strike', strikes: this.strikes });
    if (over) { this.phase = 'ended'; if (this.cur) this.cur.done = true; this.later(() => { this.destroyCur(); this.finish('over'); }, RM() ? 600 : 1500); }
  }

  finish(kind) {
    if (this.over) return; this.over = true; this.phase = 'ended'; this.destroyCur();
    clearInterval(this.idleIv);
    const st = this.stats; st.totalMs = performance.now() - this.runT0;
    const win = kind === 'win';
    st.reached = win ? this.total + 1 : this.level;
    const lvlDone = win ? this.total : Math.max(0, this.level - 1);
    const progress = lvlDone / Math.max(1, this.total);
    const fast = st.solves > 2 && st.sumMs / st.solves < 5000;
    const rank = rankFor({ kind, progress, strikes: st.strikes, fast });
    bg.set({ pressure: 0, suspicion: win ? 0 : 1, mood: win ? 'impressed' : 'angry' }); setTension(win ? 0.1 : 0.9);
    this.root.dataset.pressure = 'low'; this.root.style.setProperty('--pressure', '0');
    this.hudRefresh();
    sfx(win ? 'win' : 'lose');
    document.body.classList.add('end-open'); this.foot.className = 'card-foot'; this.foot.textContent = this.footDefault; this.stamp.className = 'stamp'; this.srEl.textContent = '';
    if (win) { confetti(innerWidth / 2, innerHeight / 3, 220); this.later(() => confetti(innerWidth * 0.2, innerHeight * 0.4, 100), 350); this.later(() => confetti(innerWidth * 0.8, innerHeight * 0.4, 100), 600); }
    if (this.mode === 'solo') { const b = loadBest(); if (!b || lvlDone > (b.level ?? 0) || (win && !b.win)) saveBest({ level: lvlDone, total: this.total, rank, win }); }
    if (this.mode !== 'solo') { this.onEvent({ type: kind, level: this.level, rank, stats: { ...st } }); return; } // en ligne : l'orchestrateur affiche ses propres écrans
    const sp = new Speaker(); const key = win ? 'win' : 'over';
    const el = endScreen({ kind, dossier: this.dossier, stats: st, rank, total: this.total, speaker: sp, onReplay: this.onReplay, onMenu: this.onMenu });
    this.later(() => { this.stage.classList.add('dim'); this.root.append(el); sp.say((!win && this.callback()) || say(key, Math.random, this.ctx()), win ? 'impressed' : 'smug', { force: true, instant: true }); }, win ? 500 : 100);
    this.endEl = el; this.endSp = sp;
    this.onEvent({ type: kind, level: this.level, rank, stats: { ...st } });
  }

  idleCheck() {
    if (this.phase !== 'play' || document.hidden) return;
    if (performance.now() - this.lastAct > 15000 && this.speaker.typing !== true) {
      this.lastAct = performance.now(); this.idleN++;
      this.narrate(this.idleN >= 2 && this.idleN % 2 === 0 ? 'idle2' : 'idle');
    }
  }

  // --- debug / cheat (utilisé par window.__cap) ---
  debugLeft(ms) { const c = this.cur; if (c) c.t0 = performance.now() - (c.limit - ms); }
  debugEnd(kind) { if (kind === 'win' && !this.stats.solves) { const st = this.stats; this.level = this.total + 1; st.solves = this.total; st.sumMs = this.total * 6200; st.fastest = 2400; st.maxStreak = this.total; } this.finish(kind); }

  destroy() {
    removeEventListener('keydown', this.onKey); removeEventListener('pointerdown', this.onDown, true); removeEventListener('resize', this.onResize); clearTimeout(this.fitT);
    document.body.classList.remove('end-open');
    cancelAnimationFrame(this.raf); clearInterval(this.idleIv); this.timeouts.forEach(clearTimeout); this.timeouts.clear();
    this.destroyCur(); this.speaker?.destroy(); this.endSp?.destroy(); this.over = true;
    bg.set({ pressure: 0, suspicion: 0, mood: 'neutral' }); setTension(0);
    this.root.replaceChildren(); this.root.classList.remove('game-root'); delete this.root.dataset.pressure; delete this.root.dataset.susp; this.root.style.removeProperty('--pressure');
  }
}
function LINES_TIER(t) { return t >= 2 && t <= 5; }
