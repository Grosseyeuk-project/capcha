import { startScene, bg } from './scene.js';
import { Game } from './game.js';
import { CAPTCHAS } from './captchas/index.js';
import { Speaker, titleScreen, loadBest, soundButton, installMuteKey } from './ui.js';
import { installUnlock, startMusic, setTension, sfx } from './audio.js';
import { say } from './narrator.js';

const q = new URLSearchParams(location.search);
const root = document.getElementById('app');
installUnlock(); installMuteKey();
startScene(document.getElementById('bg'));

let game = null, titleSpeaker = null, plays = 0;
const baseSeed = q.get('seed') ? +q.get('seed') : Math.floor(Math.random() * 1e6);
const seedFor = q.get('seed') ? () => +q.get('seed') : (l) => baseSeed + l * 7919 + 13;

const onlineReady = () => typeof window.CAPCHA_ONLINE?.open === 'function';

function showTitle() {
  game?.destroy(); game = null; titleSpeaker?.destroy();
  bg.set({ suspicion: 0.05, pressure: 0, mood: 'neutral' }); setTension(0.05);
  titleSpeaker = new Speaker({ big: true });
  const el = titleScreen({
    best: loadBest(), speaker: titleSpeaker, onlineReady,
    onSolo: () => startSolo(),
    onOnline: (ok) => {
      if (ok) { try { window.CAPCHA_ONLINE.open({ showTitle, startSolo }); } catch (e) { console.error(e); } }
      else titleSpeaker.say(say('online', Math.random), 'worried');
    }
  });
  root.className = 'title-root'; root.replaceChildren(el, h_sound());
  setTimeout(() => titleSpeaker.say(say(plays ? 'again' : 'start', Math.random), plays ? 'smug' : 'neutral'), 350);
}
const h_sound = () => { const d = document.createElement('div'); d.className = 'corner'; d.append(soundButton()); return d; };

function startSolo(opts = {}) {
  game?.destroy(); titleSpeaker?.destroy(); plays++; root.className = '';
  const lvl = opts.level ?? (+q.get('level') || 1);
  game = new Game({ root, seedFor, mode: 'solo', startLevel: lvl, onReplay: () => startSolo({ level: 1 }), onMenu: showTitle, onEvent: (e) => window.dispatchEvent(new CustomEvent('capcha:event', { detail: e })) });
  window.__game = game;
  game.start();
}
window.CAPCHA_SHELL = { startSolo, showTitle, bg, get game() { return game; } };

// Les modules en ligne peuvent s'enregistrer plus tard (window.CAPCHA_ONLINE = { open(ctx) }).
import('./online/boot.js').catch(() => {});

// ?level / ?cap / ?autostart sautent l'écran titre.
if (q.get('cap')) { const i = CAPTCHAS.findIndex((c) => c.id === q.get('cap')); if (i >= 0) q.set('level', String(i + 1)); }
if (q.get('level') || q.get('cap') || q.has('autostart')) startSolo(); else showTitle();

if (q.get('cheat')) {
  const when = (fn, n = 40) => { const go = () => { const c = game?.cur; if (c && game.phase === 'play') fn(c); else if (n-- > 0) setTimeout(go, 100); }; go(); };
  window.__cap = {
    solve: () => when((c) => c.api.solve()), fail: (m = 'cheat') => when((c) => c.api.fail(m)),
    get game() { return game; }, start: () => startSolo(), title: showTitle,
    left: (ms) => game?.debugLeft(ms), win: () => game?.debugEnd('win'), over: () => game?.debugEnd('over'), bg
  };
}
