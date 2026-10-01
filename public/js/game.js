import * as THREE from 'three';
import { CAPTCHAS } from './captchas/index.js';
import { h } from './ui.js';
import { sfx } from './audio.js';
import { say } from './narrator.js';

export function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const TIER_TIME = { 1: 20000, 2: 25000, 3: 30000, 4: 35000, 5: 45000 };

export class Game {
  constructor({ root, seedFor = (l) => l * 7919 + 13, mode = 'solo', onEvent = () => {}, startLevel = 1 }) {
    Object.assign(this, { root, seedFor, mode, onEvent, level: startLevel, strikes: 0, cur: null });
  }
  start() { this.root.replaceChildren(); this.ui(); this.load(); }
  ui() {
    this.hud = h('div', { class: 'hud' });
    this.bubble = h('p', { class: 'bubble' });
    this.card = h('section', { class: 'card' });
    this.bar = h('div', { class: 'bar' });
    this.root.append(this.hud, this.bubble, this.card, this.bar);
  }
  speak(t) { this.bubble.textContent = t; }
  load(seedOverride) {
    this.cur?.inst?.destroy?.(); cancelAnimationFrame(this.raf);
    const def = CAPTCHAS[this.level - 1];
    if (!def) { this.onEvent({ type: 'win' }); this.speak(say('win', Math.random)); return; }
    const seed = seedOverride ?? this.seedFor(this.level);
    const rng = mulberry32(seed);
    this.hud.textContent = `Vérification ${this.level}/${CAPTCHAS.length} — erreurs ${this.strikes}/3`;
    this.card.replaceChildren(h('h2', {}, def.title));
    const host = h('div', { class: 'cap-host' }); this.card.append(host);
    let done = false, tickers = [], limit = def.time ?? TIER_TIME[def.tier], t0 = performance.now();
    const api = {
      rng, seed, level: this.level, THREE, h, reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      int: (a, b) => a + Math.floor(rng() * (b - a + 1)), pick: (a) => a[Math.floor(rng() * a.length)],
      shuffle: (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
      say: (t) => this.speak(t), sfx,
      timer: (ms) => { limit = ms; t0 = performance.now(); },
      onTick: (fn) => tickers.push(fn),
      solve: () => { if (done) return; done = true; sfx('good'); this.onEvent({ type: 'solve', level: this.level, ms: performance.now() - t0 }); this.speak(say('solve', rng)); this.level++; setTimeout(() => this.load(), 700); },
      fail: (msg, o = {}) => { if (done) return; this.strike(msg || say('strike', rng)); if (!done && !o.retry && this.strikes < 3) { done = true; setTimeout(() => this.load(seed + 1000 * this.strikes + 1), 900); } }
    };
    this.cur = { def, api, inst: def.mount(host, api) };
    const loop = () => {
      const left = limit - (performance.now() - t0);
      this.bar.style.width = Math.max(0, left / limit * 100) + '%';
      tickers.forEach((f) => f(left));
      if (left <= 0 && !done) { done = true; this.strike('Temps écoulé. Les humains sont lents, c’est connu.'); if (this.strikes < 3) setTimeout(() => this.load(seed + 77), 900); return; }
      if (!done) this.raf = requestAnimationFrame(loop);
    };
    loop();
    this.onEvent({ type: 'level', level: this.level });
  }
  strike(msg) {
    this.strikes++; sfx('bad'); this.speak(msg); this.onEvent({ type: 'strike', strikes: this.strikes });
    this.hud.textContent = `Vérification ${this.level}/${CAPTCHAS.length} — erreurs ${this.strikes}/3`;
    if (this.strikes >= 3) { this.cur.inst?.destroy?.(); this.onEvent({ type: 'over', level: this.level }); this.speak(say('over', Math.random)); }
  }
  destroy() { cancelAnimationFrame(this.raf); this.cur?.inst?.destroy?.(); this.root.replaceChildren(); }
}
