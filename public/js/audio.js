// Audio 100 % synthétisé (WebAudio). Aucun fichier. Débloqué au premier geste.
let ctx = null, master = null, musicBus = null, sfxBus = null, noiseBuf = null;
let muted = false, unlocked = false, musicOn = false, tension = 0, musicTimer = 0, step = 0, nextT = 0;
try { muted = localStorage.getItem('capcha.mute') === '1'; } catch {}
const listeners = new Set();

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  try {
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = muted ? 0 : 0.9;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    master.connect(comp).connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.9; sfxBus.connect(master);
    musicBus = ctx.createGain(); musicBus.gain.value = 0.5; musicBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  } catch { ctx = null; }
  return ctx;
}
const live = () => ctx && ctx.state === 'running' && !muted;

export function unlock() {
  if (!ensure()) return;
  if (ctx.state !== 'running') ctx.resume?.().catch(() => {});
  if (!unlocked) { unlocked = true; if (musicOn) startMusicLoop(); }
}
export function installUnlock() {
  const go = () => { unlock(); if (unlocked && ctx.state === 'running') ['pointerdown', 'keydown', 'touchstart'].forEach((e) => removeEventListener(e, go, true)); };
  ['pointerdown', 'keydown', 'touchstart'].forEach((e) => addEventListener(e, go, { capture: true, passive: true }));
  document.addEventListener('visibilitychange', () => { if (!ctx) return; document.hidden ? ctx.suspend?.() : unlocked && ctx.resume?.(); });
}

export const isMuted = () => muted;
export function setMuted(m) {
  muted = !!m;
  try { localStorage.setItem('capcha.mute', muted ? '1' : '0'); } catch {}
  if (master) master.gain.setTargetAtTime(muted ? 0 : 0.9, ctx.currentTime, 0.03);
  listeners.forEach((f) => f(muted));
}
export const toggleMute = () => (setMuted(!muted), muted);
export const onMuteChange = (f) => (listeners.add(f), () => listeners.delete(f));

// --- briques ---
function tone({ f = 440, f2, type = 'sine', dur = 0.15, vol = 0.1, delay = 0, attack = 0.005, bus, detune = 0, lp }) {
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); o.detune.value = detune;
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let node = o;
  if (lp) { const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; o.connect(fl); node = fl; }
  node.connect(g).connect(bus || sfxBus);
  o.start(t); o.stop(t + dur + 0.05);
}
function noise({ dur = 0.1, vol = 0.1, delay = 0, type = 'bandpass', f = 1000, f2, q = 1, bus }) {
  const t = ctx.currentTime + delay;
  const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
  const fl = ctx.createBiquadFilter(); fl.type = type; fl.Q.value = q; fl.frequency.setValueAtTime(f, t);
  if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
  const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(fl).connect(g).connect(bus || sfxBus); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
}
const N = (semi, base = 440) => base * Math.pow(2, semi / 12);

const SFX = {
  click: () => { tone({ f: 1100, f2: 700, type: 'square', dur: 0.05, vol: 0.04 }); },
  pop: () => { tone({ f: 380, f2: 980, dur: 0.1, vol: 0.12 }); },
  tick: () => { tone({ f: 2200, type: 'triangle', dur: 0.03, vol: 0.06 }); },
  good: () => { [0, 4, 7, 12].forEach((s, i) => tone({ f: N(s, 523), type: 'triangle', dur: 0.22, vol: 0.09, delay: i * 0.07 })); },
  bad: () => { tone({ f: 190, f2: 70, type: 'sawtooth', dur: 0.35, vol: 0.14, lp: 900 }); noise({ dur: 0.25, vol: 0.12, type: 'lowpass', f: 700 }); },
  whoosh: () => { noise({ dur: 0.35, vol: 0.08, f: 300, f2: 3000, q: 1.5 }); },
  stamp: () => { tone({ f: 140, f2: 38, dur: 0.22, vol: 0.28 }); noise({ dur: 0.08, vol: 0.18, type: 'lowpass', f: 1500 }); },
  strike: () => { SFX.stamp(); SFX.bad(); tone({ f: 70, f2: 50, type: 'square', dur: 0.5, vol: 0.06, lp: 300, delay: 0.05 }); },
  blip: () => { tone({ f: 260 + Math.random() * 120 + tension * 60, type: 'square', dur: 0.04, vol: 0.018, lp: 1800 }); },
  heart: () => { tone({ f: 70, f2: 40, dur: 0.14, vol: 0.34 }); tone({ f: 62, f2: 38, dur: 0.16, vol: 0.26, delay: 0.17 }); },
  alarm: () => { tone({ f: 880, type: 'square', dur: 0.12, vol: 0.05 }); tone({ f: 660, type: 'square', dur: 0.12, vol: 0.05, delay: 0.14 }); },
  win: () => { [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => tone({ f: N(s, 392), type: 'triangle', dur: 0.4, vol: 0.1, delay: i * 0.1 })); tone({ f: N(0, 196), type: 'sawtooth', dur: 1.4, vol: 0.05, delay: 0.7, lp: 800 }); },
  lose: () => { [0, -1, -2, -4].forEach((s, i) => tone({ f: N(s, 220), f2: N(s - 1, 220), type: 'sawtooth', dur: i === 3 ? 1.1 : 0.4, vol: 0.09, delay: i * 0.38, lp: 700 })); },
  confetti: () => { noise({ dur: 0.18, vol: 0.09, type: 'highpass', f: 3000, q: 0.5 }); },
  level: () => { tone({ f: 300, f2: 600, type: 'square', dur: 0.12, vol: 0.05, lp: 1200 }); tone({ f: 450, f2: 900, type: 'square', dur: 0.12, vol: 0.04, delay: 0.1, lp: 1200 }); }
};

export function sfx(name) {
  try {
    if (!ctx || !live()) { if (ctx && ctx.state === 'suspended' && unlocked) ctx.resume?.(); return; }
    (SFX[name] || SFX.click)();
  } catch {}
}

// --- musique d'ambiance : bourdon + basse pulsée + rares notes de métallophone ---
let drone = null;
function startDrone() {
  if (drone) return;
  const g = ctx.createGain(); g.gain.value = 0.0001; g.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 3);
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 260; lp.Q.value = 3;
  const os = [55, 55.4, 82.5].map((f, i) => { const o = ctx.createOscillator(); o.type = i === 2 ? 'triangle' : 'sawtooth'; o.frequency.value = f; o.connect(lp); o.start(); return o; });
  const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.12; lg.gain.value = 90; lfo.connect(lg).connect(lp.frequency); lfo.start();
  lp.connect(g).connect(musicBus);
  drone = { g, lp, os, lfo };
}
const SCALE = [0, 3, 5, 7, 10, 12, 15];
function musicStep() {
  if (!ctx || !live()) { musicTimer = setTimeout(musicStep, 250); nextT = ctx ? ctx.currentTime : 0; return; }
  const bpm = 64 + tension * 70, spb = 60 / bpm / 2; // croche
  if (nextT < ctx.currentTime) nextT = ctx.currentTime + 0.05;
  while (nextT < ctx.currentTime + 0.4) {
    const t = nextT - ctx.currentTime;
    if (drone) drone.lp.frequency.setTargetAtTime(220 + tension * 700, ctx.currentTime, 0.4);
    const beat = step % 8;
    if (beat === 0 || (tension > 0.45 && beat === 4)) tone({ f: tension > 0.7 ? 49 : 55, f2: 41, type: 'sine', dur: 0.4, vol: 0.2, delay: t, bus: musicBus });
    if (tension > 0.25 && step % 2 === 1) noise({ dur: 0.03, vol: 0.02 + tension * 0.03, type: 'highpass', f: 7000, delay: t, bus: musicBus });
    if (tension > 0.5 && beat % 2 === 0) tone({ f: N(SCALE[(step >> 1) % 3] - 24, 220), type: 'square', dur: 0.1, vol: 0.02 + tension * 0.02, delay: t, lp: 700, bus: musicBus });
    if (Math.random() < 0.09 + (1 - tension) * 0.05 && beat % 2 === 0) {
      const n = SCALE[Math.floor(Math.random() * SCALE.length)] + (tension > 0.6 && Math.random() < 0.4 ? 1 : 0);
      tone({ f: N(n, 523), type: 'sine', dur: 1.2, vol: 0.03, delay: t, bus: musicBus });
      tone({ f: N(n + 12, 523), type: 'sine', dur: 0.5, vol: 0.012, delay: t, bus: musicBus });
    }
    step++; nextT += spb;
  }
  musicTimer = setTimeout(musicStep, 120);
}
function startMusicLoop() {
  if (!ensure() || musicTimer) return;
  startDrone(); nextT = ctx.currentTime + 0.1; musicStep();
}
export function startMusic() { musicOn = true; if (unlocked) startMusicLoop(); }
export function stopMusic() { musicOn = false; clearTimeout(musicTimer); musicTimer = 0; if (drone) { try { drone.g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.3); const d = drone; setTimeout(() => { d.os.forEach((o) => o.stop()); d.lfo.stop(); }, 1500); } catch {} drone = null; } }
export function setTension(t) { tension = Math.max(0, Math.min(1, t)); }
export const heartbeat = () => sfx('heart');
