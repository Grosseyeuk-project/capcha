// UI : helper DOM, portrait de Gérard (SVG à humeurs), bulle qui tape son texte, confettis, écrans titre / fin.
import { sfx, isMuted, toggleMute, onMuteChange } from './audio.js';

export function h(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else if (k === 'class') e.className = v;
    else e.setAttribute(k, v);
  }
  for (const kid of kids.flat()) if (kid != null) e.append(kid.nodeType ? kid : document.createTextNode(kid));
  return e;
}
const NS = 'http://www.w3.org/2000/svg';
export function s(tag, attrs = {}, ...kids) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  for (const k of kids.flat()) if (k) e.append(k);
  return e;
}
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const fmtTime = (ms) => { const t = Math.max(0, Math.round(ms / 100) / 10); const m = Math.floor(t / 60); const sec = (t - m * 60); return m ? `${m}:${sec.toFixed(1).padStart(4, '0')}` : `${sec.toFixed(1).replace('.', ',')} s`; };
export const fmtSec = (ms) => (ms / 1000).toFixed(1).replace('.', ',') + ' s';
const safe = (f, d) => { try { return f(); } catch { return d; } };
export const loadBest = () => safe(() => JSON.parse(localStorage.getItem('capcha.best') || 'null'), null);
export const saveBest = (b) => safe(() => localStorage.setItem('capcha.best', JSON.stringify(b)));

// ---------- portrait ----------
const MOOD = {
  neutral: { bl: 0, br: 0, by: 0, mouth: 'M50 83 H70', pupil: 1, brows: 0 },
  smug: { bl: -10, br: 6, by: -1, mouth: 'M49 82 Q60 87 72 77', pupil: 1, brows: 0 },
  angry: { bl: 22, br: -22, by: 3, mouth: 'M50 85 Q60 76 70 85', pupil: 0.8 },
  worried: { bl: -18, br: 18, by: -3, mouth: 'M50 83 Q54 79 58 83 T66 83 T71 82', pupil: 0.8, sweat: 1 },
  impressed: { bl: -4, br: 4, by: -6, mouth: 'M55 80 a5 5.5 0 1 0 10 0 a5 5.5 0 1 0 -10 0', pupil: 1.5 }
};
export const MOODS = Object.keys(MOOD);

export function makeWarden() {
  const skin = '#e8c7a3', ink = '#10202a';
  const eye = (cx) => s('g', { class: 'w-eye' },
    s('circle', { cx, cy: 57, r: 8.5, fill: '#fff', stroke: ink, 'stroke-width': 1.5 }),
    s('circle', { class: 'w-pupil', cx, cy: 57, r: 3.4, fill: ink }));
  const browL = s('rect', { x: 38, y: 43, width: 18, height: 3.6, rx: 1.8, fill: '#2a1d14', class: 'w-brow' });
  const browR = s('rect', { x: 64, y: 43, width: 18, height: 3.6, rx: 1.8, fill: '#2a1d14', class: 'w-brow' });
  const mouth = s('path', { d: MOOD.neutral.mouth, fill: 'none', stroke: '#5a2a24', 'stroke-width': 3, 'stroke-linecap': 'round' });
  const mouthFill = s('path', { d: '', fill: '#5a2a24', stroke: 'none' });
  const sweat = s('path', { d: 'M90 46 q4 7 0 10 q-4 -3 0 -10z', fill: '#7fd4ff', stroke: '#2a7ca3', 'stroke-width': 1, class: 'w-sweat' });
  const svg = s('svg', { viewBox: '0 0 120 120', class: 'warden', role: 'img', 'aria-label': 'Gérard, Agent de Vérification', 'data-mood': 'neutral' },
    s('path', { d: 'M8 122 C10 94 34 86 60 86 C86 86 110 94 112 122Z', fill: '#16303b', stroke: ink, 'stroke-width': 2 }),
    s('path', { d: 'M46 86 L60 104 L74 86 L68 84 L60 92 L52 84Z', fill: '#f4efe4', stroke: ink, 'stroke-width': 1.5 }),
    s('path', { d: 'M57 94 L63 94 L65 116 L60 120 L55 116Z', fill: '#d6303f', stroke: ink, 'stroke-width': 1.5 }),
    s('rect', { x: 46, y: 18, width: 6, height: 3, fill: '#ffd23f', transform: 'rotate(-20 49 20)', opacity: 0 }),
    s('rect', { x: 51, y: 78, width: 18, height: 12, fill: '#d9b48f', stroke: ink, 'stroke-width': 1.5 }),
    s('circle', { cx: 31, cy: 58, r: 5.5, fill: skin, stroke: ink, 'stroke-width': 1.5 }),
    s('circle', { cx: 89, cy: 58, r: 5.5, fill: skin, stroke: ink, 'stroke-width': 1.5 }),
    s('ellipse', { cx: 60, cy: 58, rx: 28, ry: 30, fill: skin, stroke: ink, 'stroke-width': 2 }),
    s('g', { class: 'w-dark' }, s('ellipse', { cx: 47, cy: 66, rx: 7, ry: 2.5, fill: '#7a5b8a', opacity: 0.55 }), s('ellipse', { cx: 73, cy: 66, rx: 7, ry: 2.5, fill: '#7a5b8a', opacity: 0.55 })),
    s('path', { d: 'M30 44 C28 14 92 14 90 44 Z', fill: '#1a3a5c', stroke: ink, 'stroke-width': 2 }),
    s('rect', { x: 29, y: 38, width: 62, height: 7, fill: '#0f2742', stroke: ink, 'stroke-width': 1.5 }),
    s('path', { d: 'M26 45 H94 C98 45 100 49 96 51 H24 C20 49 22 45 26 45Z', fill: '#102f50', stroke: ink, 'stroke-width': 1.5 }),
    s('path', { d: 'M60 20 l2.6 5.4 5.8 .8 -4.2 4 1 5.8 -5.2 -2.8 -5.2 2.8 1 -5.8 -4.2 -4 5.8 -.8z', fill: '#ffd23f', stroke: ink, 'stroke-width': 1 }),
    s('g', { class: 'w-eyes' }, eye(47), eye(73)),
    s('circle', { cx: 47, cy: 57, r: 10.5, fill: 'rgba(160,220,255,.18)', stroke: ink, 'stroke-width': 2 }),
    s('circle', { cx: 73, cy: 57, r: 10.5, fill: 'rgba(160,220,255,.18)', stroke: ink, 'stroke-width': 2 }),
    s('path', { d: 'M57.5 57 H62.5', stroke: ink, 'stroke-width': 2 }),
    browL, browR,
    s('path', { d: 'M60 62 q-3 8 0 9', fill: 'none', stroke: '#b98a62', 'stroke-width': 2, 'stroke-linecap': 'round' }),
    s('path', { d: 'M44 76 Q60 70 76 76 Q68 82 60 77 Q52 82 44 76Z', fill: '#3a2618' }),
    mouthFill, mouth, sweat,
    s('ellipse', { cx: 40, cy: 72, rx: 4, ry: 2.4, fill: '#e58a7a', opacity: 0.35 }), s('ellipse', { cx: 80, cy: 72, rx: 4, ry: 2.4, fill: '#e58a7a', opacity: 0.35 })
  );
  let talkTimer = 0, cur = 'neutral', open = false;
  const api = {
    svg,
    mood(m = 'neutral') {
      const c = MOOD[m] || MOOD.neutral; cur = MOODS.includes(m) ? m : 'neutral';
      svg.dataset.mood = cur;
      browL.setAttribute('transform', `translate(0 ${c.by}) rotate(${c.bl} 47 45)`);
      browR.setAttribute('transform', `translate(0 ${c.by}) rotate(${c.br} 73 45)`);
      mouth.setAttribute('d', c.mouth); mouthFill.setAttribute('d', cur === 'impressed' ? c.mouth : '');
      svg.style.setProperty('--pupil', c.pupil); sweat.style.opacity = c.sweat ? 1 : 0;
    },
    stage(n) { svg.dataset.stage = n; }, // 0 serein, 1 irrité, 2 instable
    talk(on) {
      clearInterval(talkTimer);
      const apply = () => { if (cur === 'impressed') return; if (open) { mouth.setAttribute('d', 'M52 81 H68'); mouthFill.setAttribute('d', 'M52 80 Q60 92 68 80Z'); } else { mouth.setAttribute('d', MOOD[cur].mouth); mouthFill.setAttribute('d', ''); } };
      if (on && !reducedMotion()) talkTimer = setInterval(() => { open = !open; apply(); }, 110);
      else { open = false; apply(); }
    }
  };
  api.mood('neutral');
  return api;
}

// pupilles qui suivent le pointeur
const wardens = new Set();
let trackInstalled = false;
function installTrack() {
  if (trackInstalled) return; trackInstalled = true;
  addEventListener('pointermove', (e) => {
    wardens.forEach((w) => {
      if (!w.svg.isConnected) { wardens.delete(w); return; }
      const r = w.svg.getBoundingClientRect(); if (!r.width) return;
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 200) * 3.2;
      w.svg.style.setProperty('--px', (dx / d * k).toFixed(2) + 'px'); w.svg.style.setProperty('--py', (dy / d * k).toFixed(2) + 'px');
    });
  }, { passive: true });
}

// ---------- narrateur : portrait + bulle qui tape ----------
export class Speaker {
  constructor({ big = false } = {}) {
    this.w = makeWarden(); wardens.add(this.w); installTrack();
    this.text = h('p', { class: 'bubble-text', 'aria-hidden': 'true' }, '…');
    this.live = h('div', { class: 'sr-only', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' });
    this.bubble = h('div', { class: 'bubble', 'aria-hidden': 'true', onclick: () => this.skip() },
      h('span', { class: 'nameplate', 'aria-hidden': 'true' }, 'GÉRARD', h('i', {}, ' · Agent de Vérification n° 4471')), this.text);
    this.el = h('div', { class: 'speaker' + (big ? ' big' : ''), 'data-mood': 'neutral' }, h('div', { class: 'avatar' }, this.w.svg), this.bubble, this.live);
    this.tok = 0; this.full = ''; this.timer = 0;
  }
  skip() { if (this.typing) { clearTimeout(this.timer); this.finish(); } }
  finish() { const pend = this.pending; this.pending = null; if (pend) { const my = this.tok; setTimeout(() => { if (my === this.tok && !this.typing) this.say(pend[0], pend[1], { force: true }); }, 900); }
    this.text.textContent = this.full; this.typing = false; this.el.classList.remove('talking'); this.w.talk(false); this.bubble.classList.remove('typing'); }
  say(text, mood = 'neutral', { instant = false, force = false } = {}) {
    if (this.typing && !force) { this.pending = [text, mood]; return; }
    this.pending = null; clearTimeout(this.timer); this.tok++;
    this.full = text; this.text.classList.remove('fit'); this.text.textContent = text; if (this.text.scrollHeight > this.text.clientHeight + 2) this.text.classList.add('fit'); this.w.mood(mood); this.el.dataset.mood = mood; this.live.textContent = text;
    this.bubble.classList.remove('pop'); void this.bubble.offsetWidth; this.bubble.classList.add('pop');
    if (instant || reducedMotion()) { this.finish(); return; }
    this.typing = true; this.el.classList.add('talking'); this.bubble.classList.add('typing'); this.w.talk(true);
    this.text.textContent = ''; let i = 0; const my = this.tok;
    const stepFn = () => {
      if (my !== this.tok) return;
      const ch = text[i++]; this.text.textContent = text.slice(0, i);
      if (i % 3 === 1 && ch !== ' ') sfx('blip');
      if (i >= text.length) { this.finish(); return; }
      this.timer = setTimeout(stepFn, /[.!?…]/.test(ch) ? 190 : /[,:;]/.test(ch) ? 90 : 20);
    };
    stepFn();
  }
  setStage(n) { this.w.stage(n); }
  destroy() { clearTimeout(this.timer); wardens.delete(this.w); this.tok++; }
}

// ---------- confettis ----------
let cv, cx, parts = [], raf = 0;
export function clearConfetti() { parts = []; if (cx) cx.clearRect(0, 0, innerWidth, innerHeight); }
export function confetti(x, y, n = 60, colors = ['#ffd23f', '#2de2c0', '#ff4757', '#fff', '#7aa8ff']) {
  if (reducedMotion()) return;
  if (!cv) { cv = h('canvas', { class: 'confetti', 'aria-hidden': 'true' }); document.body.append(cv); cx = cv.getContext('2d'); }
  const dpr = Math.min(devicePixelRatio || 1, 2); cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = 4 + Math.random() * 9; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 5, r: Math.random() * 6.3, vr: (Math.random() - 0.5) * 0.4, w: 5 + Math.random() * 6, hh: 3 + Math.random() * 5, c: colors[i % colors.length], life: 1 }); }
  if (!raf) raf = requestAnimationFrame(tick);
}
function tick() {
  cx.clearRect(0, 0, innerWidth, innerHeight);
  parts = parts.filter((p) => p.life > 0 && p.y < innerHeight + 30);
  for (const p of parts) { p.vy += 0.38; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life -= 0.016; cx.save(); cx.globalAlpha = Math.min(1, p.life * 2); cx.translate(p.x, p.y); cx.rotate(p.r); cx.fillStyle = p.c; cx.fillRect(-p.w / 2, -p.hh / 2, p.w, p.hh); cx.restore(); }
  raf = parts.length ? requestAnimationFrame(tick) : 0;
  if (!parts.length) cx.clearRect(0, 0, innerWidth, innerHeight);
}

// ---------- bouton son ----------
export function soundButton() {
  const b = h('button', { class: 'icon-btn sound', type: 'button', 'aria-pressed': String(isMuted()), 'aria-label': 'Couper le son', title: 'Son (M)' });
  const paint = (m) => { b.setAttribute('aria-pressed', String(m)); b.setAttribute('aria-label', m ? 'Réactiver le son' : 'Couper le son'); b.innerHTML = m
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'; };
  paint(isMuted());
  b.addEventListener('click', () => { toggleMute(); sfx('click'); });
  onMuteChange(paint);
  return b;
}
let mKey = false;
export function installMuteKey() { if (mKey) return; mKey = true; addEventListener('keydown', (e) => { if ((e.key === 'm' || e.key === 'M') && !e.ctrlKey && !e.metaKey && !e.altKey && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '')) toggleMute(); }); }

// ---------- écran titre ----------
export function titleScreen({ best, speaker, onSolo, onOnline, onlineReady }) {
  const online = h('button', { class: 'btn ghost', type: 'button' }, 'Mode en ligne', h('small', {}, ''));
  const sub = online.querySelector('small');
  const refresh = () => { const ok = !!onlineReady(); online.classList.toggle('disabled', !ok); online.setAttribute('aria-disabled', String(!ok)); sub.textContent = ok ? 'défiez d’autres humains (présumés)' : !/(^|; )capcha_srv=1/.test(document.cookie) ? 'hors ligne ici : serveur requis' : 'bientôt — un stagiaire y travaille'; };
  refresh();
  online.addEventListener('click', () => { if (online.getAttribute('aria-disabled') === 'true') { sfx('bad'); onOnline(false); } else { sfx('click'); onOnline(true); } });
  const poll = setInterval(() => { if (!online.isConnected) return clearInterval(poll); refresh(); }, 600);
  setTimeout(() => clearInterval(poll), 12000);
  const start = h('button', { class: 'btn primary', type: 'button', onclick: () => { sfx('stamp'); onSolo(); } }, h('span', { class: 'box', 'aria-hidden': 'true' }), 'Commencer la vérification');
  const el = h('section', { class: 'screen title', 'aria-labelledby': 'logo' },
    h('div', { class: 'ticket', 'aria-hidden': 'true' }, 'FORMULAIRE H-1 · PORTAIL DE CONFORMITÉ HUMAINE · N° 000 417'),
    h('h1', { id: 'logo', class: 'logo' }, h('span', { class: 'lg' }, 'CAP'), h('span', { class: 'lg y' }, 'CHA'), h('sup', {}, '™')),
    h('p', { class: 'tag' }, 'Prouvez que vous êtes humain.'),
    h('p', { class: 'typo' }, '(Oui, il manque un T. Ne le dites pas à Gérard.)'),
    h('div', { class: 'eye-slot', 'aria-hidden': 'true' }),
    speaker.el,
    h('div', { class: 'actions' }, start, online),
    best ? h('p', { class: 'best' }, h('span', {}, 'Dossier précédent'), ` niveau ${best.level}${best.total ? '/' + best.total : ''} · ${best.rank}`) : null,
    h('p', { class: 'fine' }, 'En cliquant, vous acceptez que Gérard vous juge, vous chronomètre et note vos erreurs dans un carnet. Aucun humain n’a été blessé. Plusieurs ont été vexés.')
  );
  return el;
}

// ---------- écran de fin ----------
export function endScreen({ kind, dossier = [], stats, rank, total, onReplay, onMenu, speaker }) {
  const win = kind === 'win';
  const stat = (k, v) => h('div', { class: 'stat' }, h('dt', {}, k), h('dd', {}, v));
  const lvl = win ? total : Math.max(0, stats.reached - 1);
  const summary = `CAPCHA — ${win ? 'HUMAIN HOMOLOGUÉ' : 'ROBOT CONFIRMÉ'} · ${rank} · ${lvl}/${total} vérifications en ${fmtTime(stats.totalMs)}, ${stats.strikes} erreur${stats.strikes > 1 ? 's' : ''}. Et vous, êtes-vous humain ?`;
  const copy = h('button', { class: 'btn ghost small', type: 'button', onclick: async () => { try { await navigator.clipboard.writeText(summary); copy.textContent = 'Copié. Gérard est flatté.'; } catch { copy.textContent = 'Copie impossible. Recopiez à la main.'; } } }, 'Copier mon dossier');
  const again = h('button', { class: 'btn primary', type: 'button', onclick: () => { sfx('click'); onReplay?.(); } }, 'Rejouer');
  const el = h('section', { class: 'screen end ' + (win ? 'win' : 'over'), role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'endttl' },
    h('div', { class: 'verdict-card' }, h('div', { class: 'vc-body' },
      h('div', { class: 'big-stamp', 'aria-hidden': 'true' }, win ? 'HUMAIN' : 'ROBOT'),
      h('h2', { id: 'endttl' }, win ? 'Accès accordé' : 'Accès refusé'),
      h('p', { class: 'rank-label' }, 'Votre rang officiel'),
      h('p', { class: 'rank' }, rank),
      h('dl', { class: 'stats' },
        stat('Vérifications', `${lvl} / ${total}`), stat('Temps total', fmtTime(stats.totalMs)), stat('Erreurs commises', String(stats.strikes)),
        stat('Plus rapide', stats.fastest ? fmtSec(stats.fastest) : '—'), stat('Meilleure série', String(stats.maxStreak)), stat('Temps moyen', stats.solves ? fmtSec(stats.sumMs / stats.solves) : '—')),
      dossier.length ? h('div', { class: 'dossier' }, h('h3', {}, 'Casier de la partie'), h('ul', {}, dossier.slice(-5).reverse().map((d) => h('li', {}, d.t + (d.n > 1 ? ' ×' + d.n : ''))))) : null,
      speaker ? speaker.el : null),
      h('div', { class: 'actions' }, again, onMenu ? h('button', { class: 'btn ghost', type: 'button', onclick: () => { sfx('click'); onMenu(); } }, 'Menu principal') : null, copy)
    ));
  setTimeout(() => again.focus({ preventScroll: true }), 50);
  return el;
}
