import * as THREE from 'three';
import { CAPTCHAS } from './captchas/index.js';
import { h, Speaker, confetti, soundButton, endScreen, fmtSec, reducedMotion, loadBest, saveBest } from './ui.js';
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
    this.timeouts = new Set(); this.idleN = 0; this.lastAct = performance.now(); this.lastTier = 0; this.sayTok = 0;
  }
  get total() { return CAPTCHAS.length; }
  get progress() { return clamp01((this.level - 1) / Math.max(1, this.total)); }
  later(fn, ms) { const id = setTimeout(() => { this.timeouts.delete(id); fn(); }, ms); this.timeouts.add(id); return id; }
  ctx() { return { progress: this.progress, level: this.level, strikes: this.strikes }; }

  start() {
    this.root.replaceChildren(); this.root.classList.add('game-root');
    this.runT0 = performance.now(); this.ui();
    startMusic();
    this.act = () => { this.lastAct = performance.now(); };
    ['pointerdown', 'keydown'].forEach((e) => this.card.addEventListener(e, this.act, true));
    this.idleIv = setInterval(() => this.idleCheck(), 1500);
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
    this.levelLabel = h('span', { class: 'lvl-num' }); this.levelTitle = h('span', { class: 'lvl-title' });
    this.strikeEls = [0, 1, 2].map(() => h('span', { class: 'strike' }, h('b', {}, '✕')));
    this.clock = h('span', { class: 'clock-val' }, '--'); this.clockBox = h('div', { class: 'clock', role: 'timer', 'aria-label': 'Temps restant' }, h('span', { class: 'clock-lbl', 'aria-hidden': 'true' }, 'Temps'), this.clock);
    this.hud = h('header', { class: 'hud' },
      h('div', { class: 'hud-l' }, h('span', { class: 'brand', 'aria-hidden': 'true' }, 'CAPCHA™'), h('div', { class: 'lvl' }, this.levelLabel)),
      h('div', { class: 'hud-c' }, pips),
      h('div', { class: 'hud-r' }, h('div', { class: 'strikes', role: 'img', 'aria-label': 'Erreurs : 0 sur 3' }, h('span', { class: 'strikes-lbl', 'aria-hidden': 'true' }, 'Erreurs'), h('span', { class: 'strike-row' }, this.strikeEls)), this.clockBox, soundButton()));
    this.strikesBox = this.hud.querySelector('.strikes');
    this.speaker = new Speaker();
    this.ledger = h('ol', { class: 'ledger', 'aria-label': 'Registre des vérifications' }, h('li', { class: 'rule-head', 'aria-hidden': 'true' }, 'Registre de conformité'));
    this.ruleN = 0;
    this.stamp = h('div', { class: 'stamp', 'aria-hidden': 'true' });
    this.cardHead = h('div', { class: 'card-head' }, h('span', { class: 'ch-title' }, this.levelTitle), h('span', { class: 'threat', 'aria-hidden': 'true' }));
    this.host = h('div', { class: 'cap-slot' });
    this.card = h('section', { class: 'card', 'aria-label': 'Vérification en cours' }, this.cardHead, this.host, this.stamp, h('div', { class: 'card-foot', 'aria-hidden': 'true' }, 'Protégé par CAPCHA™ · Vos erreurs sont consignées · ', h('u', {}, 'Confidentialité (non)')));
    this.bar = h('div', { class: 'bar' }, h('i', {}));
    this.barFill = this.bar.firstChild;
    this.flashEl = h('div', { class: 'flash', 'aria-hidden': 'true' });
    this.banner = h('div', { class: 'banner', 'aria-hidden': 'true' });
    this.stage = h('div', { class: 'stage' }, this.hud, this.speaker.el, this.card, this.bar);
    this.root.append(this.ledger);
    this.root.append(this.stage, this.flashEl);
    this.card.append(this.banner);
  }
  speak(t, mood = 'neutral') { this.sayTok++; this.speaker.say(t, mood); }
  narrate(key, extra) { const t = say(key, Math.random, { ...this.ctx(), ...extra }); this.speak(t, moodFor(key, this.ctx())); return t; }
  syncMood() {
    const susp = clamp01(this.strikes / 3 * 0.7 + this.progress * 0.3);
    this.susp = susp; bg.set({ suspicion: susp });
    this.speaker.setStage(this.strikes >= 2 || this.progress > 0.66 ? 2 : this.strikes >= 1 || this.progress > 0.33 ? 1 : 0);
    this.root.dataset.susp = String(Math.round(susp * 3));
  }
  hudRefresh() {
    const def = CAPTCHAS[this.level - 1];
    this.levelLabel.textContent = `Vérification ${pad(Math.min(this.level, this.total))}/${pad(this.total)}`;
    if (def) { this.levelTitle.textContent = def.title; this.card.querySelector('.threat').textContent = '●'.repeat(def.tier || 1) + '○'.repeat(Math.max(0, 5 - (def.tier || 1))); this.card.querySelector('.threat').title = 'Niveau de menace'; }
    [...this.pips.children].forEach((li, i) => { li.className = i < this.level - 1 ? 'done' : i === this.level - 1 ? 'now' : ''; });
    this.strikeEls.forEach((el, i) => el.classList.toggle('on', i < this.strikes));
    this.strikesBox.setAttribute('aria-label', `Erreurs : ${this.strikes} sur 3`);
  }

  beginLevel({ retry = false, seed, first = false } = {}) {
    this.destroyCur(); this.phase = 'intro'; this.stamp.className = 'stamp';
    const def = CAPTCHAS[this.level - 1];
    if (!def) { this.finish('win'); return; }
    this.stats.reached = Math.max(this.stats.reached, this.level);
    this.hudRefresh(); this.syncMood();
    this.root.dataset.pressure = 'low'; this.root.style.setProperty('--pressure', '0'); this.clock.textContent = '--';
    const tier = def.tier || 1;
    this.card.classList.remove('struck', 'solved'); this.card.dataset.tier = tier;
    const delay = RM() ? 120 : retry ? 360 : 640;
    this.banner.replaceChildren(h('div', { class: 'bn-in' }, h('span', { class: 'bn-k' }, retry ? 'Nouvel essai' : 'Vérification'), h('span', { class: 'bn-n' }, retry ? `n° ${pad(this.level)}` : pad(this.level)), h('span', { class: 'bn-t' }, def.title)));
    this.banner.className = 'banner show'; this.card.classList.add('entering');
    this.host.replaceChildren(); this.host.classList.remove('ready');
    if (!retry) { sfx('level'); bg.pulse('level'); }
    // narration
    if (!retry) {
      if (first && this.level === this.startLevel && this.startLevel === 1) this.narrate('begin');
      else if (tier > this.lastTier && this.lastTier && LINES_TIER(tier)) this.narrate('tier' + tier);
      else if (first || Math.random() < 0.33) this.narrate('level');
      this.lastTier = tier;
    }
    this.later(() => this.mount(def, seed ?? this.seedFor(this.level)), delay);
  }

  mount(def, seed) {
    this.card.classList.remove('entering'); this.banner.className = 'banner';
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
  }

  destroyCur() { const c = this.cur; this.cur = null; if (c) { try { c.inst?.destroy?.(); } catch (e) { console.error(e); } } }

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
    this.stamp.append(h('b', {}, 'VALIDÉ'), h('i', {}, fmtSec(ms)));
    this.flash('good');
    const r = this.card.getBoundingClientRect(); const fast = ms < c.limit * 0.3;
    sfx('confetti'); confetti(r.left + r.width / 2, r.top + r.height / 3, fast ? 110 : 55);
    this.root.style.setProperty('--pressure', '0'); this.root.dataset.pressure = 'low'; setTension(this.susp * 0.5); bg.set({ pressure: 0 });
    this.rule('ok', `Règle ${pad(this.level)} respectée`, c.def.title, fmtSec(ms));
    this.onEvent({ type: 'solve', level: this.level, ms });
    const key = st.streak === 5 ? 'streak5' : st.streak === 3 ? 'streak3' : fast ? 'solveFast' : ms > c.limit * 0.78 ? 'solveSlow' : 'solve';
    this.narrate(key);
    this.level++;
    this.later(() => { if (this.level > this.total) { this.finish('win'); return; } this.load({ leave: true }); }, RM() ? 400 : 1000);
  }

  rule(kind, title, text, meta) {
    const li = h('li', { class: 'rule ' + kind }, h('span', { class: 'rule-ic', 'aria-hidden': 'true' }, kind === 'ok' ? '✓' : '✕'),
      h('div', { class: 'rule-b' }, h('b', {}, title), text ? h('span', {}, text) : null), meta ? h('em', {}, meta) : null);
    const head = this.ledger.firstChild; head.after(li);
    while (this.ledger.childElementCount > 9) this.ledger.lastChild.remove();
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
    this.stamp.className = 'stamp bad show'; this.stamp.innerHTML = ''; this.stamp.append(h('b', {}, timeout ? 'TEMPS ÉCOULÉ' : 'REFUSÉ'), h('i', {}, `erreur ${this.strikes}/3`));
    const over = this.strikes >= 3;
    const line = timeout ? say('timeout', Math.random, this.ctx()) : (msg && msg !== 'cheat') ? msg : say(this.strikes === 1 ? 'strike1' : 'strike2', Math.random, this.ctx());
    const why = timeout ? 'Le chronomètre a expiré avant votre réponse.' : (msg && msg !== 'cheat' ? msg : 'Réponse incorrecte : elle ne respecte pas la règle affichée.');
    this.rule('bad', `Règle ${pad(this.level)} enfreinte`, why, `erreur ${this.strikes}/3`);
    this.speak(line, timeout ? moodFor('timeout', this.ctx()) : this.strikes >= 2 ? 'angry' : 'smug');
    // petite réplique de Gérard en plus quand le captcha a donné sa propre explication
    const tok = this.sayTok;
    if (msg && !over && !timeout) this.later(() => { if (tok === this.sayTok && this.phase !== 'ended') this.narrate(this.strikes === 1 ? 'strike1' : 'strike2'); }, 2800 + line.length * 22);
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
    if (win) { const r = this.card.getBoundingClientRect(); confetti(innerWidth / 2, innerHeight / 3, 220); this.later(() => confetti(innerWidth * 0.2, innerHeight * 0.4, 100), 350); this.later(() => confetti(innerWidth * 0.8, innerHeight * 0.4, 100), 600); }
    if (this.mode === 'solo') { const b = loadBest(); if (!b || lvlDone > (b.level ?? 0) || (win && !b.win)) saveBest({ level: lvlDone, total: this.total, rank, win }); }
    if (this.mode !== 'solo') { this.onEvent({ type: kind, level: this.level, rank, stats: { ...st } }); return; } // en ligne : l'orchestrateur affiche ses propres écrans
    const sp = new Speaker(); const key = win ? 'win' : 'over';
    const el = endScreen({ kind, stats: st, rank, total: this.total, speaker: sp, onReplay: this.onReplay, onMenu: this.onMenu });
    this.later(() => { this.stage.classList.add('dim'); this.root.append(el); sp.say(say(key, Math.random, this.ctx()), win ? 'impressed' : 'smug'); }, win ? 500 : 100);
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
  debugEnd(kind) { if (kind === 'win') { this.level = this.total + 1; this.stats.solves = this.total; } this.finish(kind); }

  destroy() {
    cancelAnimationFrame(this.raf); clearInterval(this.idleIv); this.timeouts.forEach(clearTimeout); this.timeouts.clear();
    this.destroyCur(); this.speaker?.destroy(); this.endSp?.destroy(); this.over = true;
    bg.set({ pressure: 0, suspicion: 0, mood: 'neutral' }); setTension(0);
    this.root.replaceChildren(); this.root.classList.remove('game-root'); delete this.root.dataset.pressure; delete this.root.dataset.susp; this.root.style.removeProperty('--pressure');
  }
}
function LINES_TIER(t) { return t >= 2 && t <= 5; }
