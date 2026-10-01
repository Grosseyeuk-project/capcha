// Online mode controller: menu → lobby → countdown → race → podium. Defines window.CAPCHA_ONLINE.
import { injectCss } from './css.js';
import { Net, clearToken } from './net.js';
import { RaceView, h, col, ini } from './race.js';

const LS = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* */ } }
};
let audio = null; import('../audio.js').then((m) => { audio = m; }).catch(() => {});
const sfx = (n) => { try { audio?.sfx?.(n); } catch { /* */ } };
const wsUrl = () => (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws';

const S = { root: null, net: null, room: null, me: null, nick: LS.get('ol-nick') || '', online: null, up: false, view: null, race: null, tick: null, endTimer: null, err: '', lastCd: null, raceStarted: false, opts: {} };

function toast(text, kind = '', ms = 3600) {
  if (!S.toasts) return;
  const t = h('div', { class: 'ol-toast ' + kind }, text);
  S.toasts.append(t); while (S.toasts.childElementCount > 4) S.toasts.firstChild.remove();
  setTimeout(() => t.classList.add('out'), ms); setTimeout(() => t.remove(), ms + 400);
}
const me = () => S.room?.players.find((p) => p.id === S.me);
const validNick = (n) => n.trim().length >= 2;

function mountScreen(name, node) { S.view = name; S.main.replaceChildren(node); S.tick = S.pendingTick || null; S.pendingTick = null; S.root.scrollTo?.(0, 0); }
function topbar(extra) {
  S.liveEl = h('span', { class: 'ol-live' + (S.up ? '' : ' off') }, h('i'), h('span', {}, ''));
  paintOnline();
  return h('div', { class: 'ol-top' }, S.liveEl, extra || h('button', { class: 'ol-ghostbtn', onclick: close }, '← Retour'));
}
function paintOnline() {
  if (!S.liveEl) return;
  S.liveEl.classList.toggle('off', !S.up);
  S.liveEl.lastChild.textContent = !S.up ? 'Connexion…' : S.online == null ? '' : `${S.online} joueur${S.online > 1 ? 's' : ''} en ligne`;
}

// ---------------- menu
function menu() {
  const nick = h('input', { class: 'ol-field', maxlength: '14', placeholder: 'Votre pseudo d’humain', value: S.nick, autocomplete: 'off', 'aria-label': 'Pseudo' });
  const code = h('input', { class: 'ol-field ol-code-in', maxlength: '4', placeholder: 'CODE', autocomplete: 'off', 'aria-label': 'Code de salle', value: S.opts.code || '' });
  const err = h('p', { class: 'ol-err', role: 'alert' }, S.err); S.errEl = err;
  const go = (t, extra) => {
    S.nick = nick.value.trim(); if (!validNick(S.nick)) { err.textContent = 'Un pseudo d’au moins 2 caractères. Même les robots en ont un.'; nick.focus(); return; }
    LS.set('ol-nick', S.nick); err.textContent = ''; S.net.nick = S.nick;
    S.net.send({ t, nick: S.nick, total: window.CAPCHA_ONLINE.total?.() || 10, ...extra }); sfx('click');
  };
  const btnQ = h('button', { class: 'ol-btn pri', onclick: () => go('quick') }, 'Partie rapide', h('small', {}, 'Adversaires trouvés, ou bots recrutés'));
  const btnC = h('button', { class: 'ol-btn', onclick: () => go('create') }, 'Créer une salle', h('small', {}, 'Code à partager'));
  const btnJ = h('button', { class: 'ol-btn', onclick: () => go('join', { code: code.value }) }, 'Rejoindre');
  code.addEventListener('input', () => { code.value = code.value.toUpperCase().replace(/[^A-Z]/g, ''); });
  code.addEventListener('keydown', (e) => { if (e.key === 'Enter') btnJ.click(); });
  nick.addEventListener('keydown', (e) => { if (e.key === 'Enter') btnQ.click(); });
  S.menuBtns = [btnQ, btnC, btnJ]; paintMenuState();
  mountScreen('menu', h('div', { class: 'ol-wrap' },
    topbar(),
    h('h1', { class: 'ol-title' }, 'Course en ligne', h('small', {}, 'Mêmes CAPTCHAs, même graine, même panique. Trois erreurs et vous êtes officiellement un robot.')),
    h('div', { class: 'ol-card' }, h('h3', {}, 'Identité'), nick, err),
    h('div', { class: 'ol-card' }, h('h3', {}, 'Jouer'), h('div', { class: 'ol-row2' }, btnQ, btnC)),
    h('div', { class: 'ol-card' }, h('h3', {}, 'Un code d’ami ?'), h('div', { class: 'ol-row2' }, code, btnJ))));
  if (!S.nick) setTimeout(() => nick.focus(), 50);
}
function paintMenuState() { (S.menuBtns || []).forEach((b) => { b.disabled = !S.up; }); }

// ---------------- lobby
function lobby(room) {
  const mp = me(); const isHost = room.hostId === S.me;
  const list = h('div', { class: 'ol-plist' }, room.players.map((p) => h('div', { class: 'ol-pl' + (p.id === S.me ? ' me' : ''), style: `--c:${col(p)}` },
    h('span', { class: 'ol-av' }, ini(p)),
    h('span', { class: 'nm' }, p.nick, p.id === S.me && h('em', {}, 'vous'), p.id === room.hostId && h('em', {}, '♛ chef')),
    p.bot ? h('span', { class: 'ol-chip' }, 'Bot')
      : !p.connected ? h('span', { class: 'ol-chip warn' }, 'Reconnexion…')
      : h('span', { class: 'ol-chip ' + (p.ready ? 'ok' : '') }, p.ready ? 'Prêt' : 'En attente'))));
  const link = location.origin + location.pathname + '?room=' + room.code;
  const copy = h('button', { class: 'ol-ghostbtn', onclick: async () => { try { await navigator.clipboard.writeText(link); toast('Lien copié. Envoyez-le à un humain présumé.', 'good'); } catch { toast(link); } } }, 'Copier le lien');
  const ready = h('button', { class: 'ol-btn ' + (mp?.ready ? '' : 'good'), onclick: () => { S.net.send({ t: 'ready', v: !mp.ready }); sfx('click'); } }, mp?.ready ? 'Pas prêt…' : 'Je suis prêt');
  const kids = [
    topbar(h('button', { class: 'ol-ghostbtn', onclick: leave }, 'Quitter la salle')),
    h('div', { class: 'ol-card' }, h('div', { class: 'ol-code' },
      h('div', {}, h('h3', {}, room.quick ? 'Partie rapide' : 'Salle privée'), h('b', { 'aria-label': 'Code ' + room.code.split('').join(' ') }, room.code)),
      h('span', { class: 'ol-badge acc' }, `${room.total} vérifications`), copy)),
    h('div', { class: 'ol-card' }, h('h3', {}, `Joueurs ${room.players.length}/8`), list)
  ];
  if (room.quick && room.fillAt) {
    const m = h('i'), t = h('span', {});
    kids.push(h('div', { class: 'ol-card' }, h('h3', {}, 'Recherche d’adversaires'), t, h('div', { class: 'ol-meter' }, m)));
    const total = S.fillTotal || (S.fillTotal = Math.max(1000, room.fillAt - S.net.now()));
    S.pendingTick = () => { const left = Math.max(0, room.fillAt - S.net.now()); t.textContent = left > 0 ? `Les bots arrivent dans ${Math.ceil(left / 1000)} s — ou lancez dès que tout le monde est prêt.` : 'Recrutement de figurants…'; m.style.width = (100 - left / total * 100) + '%'; };
    S.pendingTick();
  }
  const act = h('div', { class: 'ol-row2' }, ready);
  if (!room.quick && isHost) {
    act.append(h('button', { class: 'ol-btn pri', onclick: () => S.net.send({ t: 'start' }) }, 'Lancer la partie', h('small', {}, `${room.players.filter((p) => p.ready || p.id === S.me || p.bot).length}/${room.players.length} prêts`)));
  }
  kids.push(h('div', { class: 'ol-card' }, act));
  if (!room.quick && isHost) kids.push(h('div', { class: 'ol-row2' },
    h('button', { class: 'ol-btn', disabled: room.players.length >= 8 ? '' : null, onclick: () => S.net.send({ t: 'addbot' }) }, '+ Ajouter un bot'),
    h('button', { class: 'ol-btn', onclick: () => S.net.send({ t: 'rmbot' }) }, '− Retirer un bot')));
  if (!room.quick && !isHost) kids.push(h('p', { class: 'ol-hint' }, 'En attente du chef de salle…'));
  kids.push(emotes(room));
  mountScreen('lobby', h('div', { class: 'ol-wrap' }, ...kids));
}
function emotes(room) { return h('div', { class: 'ol-emotes' }, (room.emotes || []).map((t, i) => h('button', { onclick: () => S.net.send({ t: 'emote', e: i }) }, t))); }

function countdown(room) {
  let el = S.root.querySelector('.ol-count');
  if (!el) { el = h('div', { class: 'ol-count', role: 'status' }, h('span', {}, 'La vérification commence'), h('b', {}, ''), h('span', {}, 'Même graine pour tous. Bonne chance.')); S.root.append(el); }
  S.cdEl = el;
  S.cdTick = () => {
    const left = room.startAt - S.net.now(); const n = Math.max(1, Math.ceil(left / 1000));
    const b = el.querySelector('b');
    if (S.lastCd !== n) { S.lastCd = n; b.textContent = n; b.style.animation = 'none'; void b.offsetWidth; b.style.animation = ''; sfx('tick'); }
  };
  S.cdTick();
}
function dropCountdown() { S.root?.querySelector('.ol-count')?.remove(); S.cdTick = null; S.lastCd = null; }

// ---------------- race
function race(room) {
  if (S.view !== 'race') {
    dropCountdown();
    const mount = h('div', {});
    mountScreen('race', mount);
    S.race?.destroy();
    S.race = new RaceView({ mount, me: S.me, net: S.net, toast, sfx, leave, emote: (i) => S.net.send({ t: 'emote', e: i }) });
    S.race.setPing(S.net.ping, S.up);
    sfx('whoosh'); toast('C’est parti. Ne cliquez pas n’importe où.', 'good');
  }
  S.race.update(room, S.lastEvt); S.lastEvt = null;
  if (!S.race.game && !S.race.started) S.race.startGame(room);
}

// ---------------- end
function end(room) {
  S.race?.destroy(); S.race = null;
  const sorted = [...room.players].sort((a, b) => a.rank - b.rank);
  const mp = me(); const win = mp && mp.rank === 1;
  const fastest = Math.min(...room.players.map((p) => p.best ?? Infinity));
  const sec = (ms) => ms == null || ms === Infinity ? '–' : (ms / 1000).toFixed(1) + ' s';
  const head = !mp ? 'Partie terminée' : win ? 'Humain certifié.' : mp.status === 'done' ? `Vous finissez ${mp.rank}${mp.rank === 1 ? 'er' : 'e'}.` : mp.reason === 'dq' ? 'Disqualifié.' : mp.status === 'out' ? 'Robot confirmé.' : 'Trop lent.';
  const sub = win ? 'Le comité est (très) légèrement impressionné.' : room.endReason === 'last' ? 'Dernier debout : la victoire par attrition.' : room.endReason === 'lastcall' ? 'Le portique a fermé.' : 'Le comité a pris des notes.';
  const slot = (p, n, d) => p ? h('div', { class: `ol-pod p${n}`, style: `--c:${col(p)};--d:${d}ms` }, h('div', { class: 'av' }, ini(p)), h('div', { class: 'nm' }, p.nick), h('div', { class: 'sub' }, p.status === 'done' ? sec(p.finishMs) : `${p.solved}/${room.total}`), h('div', { class: 'blk' }, n)) : h('div', {});
  const pod = h('div', { class: 'ol-podium' }, slot(sorted[1], 2, 500), slot(sorted[0], 1, 900), slot(sorted[2], 3, 100));
  const tbl = h('table', { class: 'ol-tbl' }, h('thead', {}, h('tr', {}, ...['#', 'Joueur', 'Niveaux', 'Erreurs', 'Meilleur', 'Moyen'].map((x, i) => h('th', { class: i > 3 ? 'hm' : '' }, x)))),
    h('tbody', {}, sorted.map((p) => h('tr', { class: p.id === S.me ? 'me' : '' },
      h('td', {}, p.rank), h('td', {}, p.nick, p.best != null && p.best === fastest ? ' ⚡' : ''), h('td', {}, p.status === 'done' ? '✓ ' + p.solved + '/' + room.total : `${p.solved}/${room.total}${p.reason === 'dq' ? ' DQ' : ''}`), h('td', {}, p.strikes + '/3'),
      h('td', { class: 'hm' }, sec(p.best)), h('td', { class: 'hm' }, sec(p.avg))))));
  mountScreen('end', h('div', { class: 'ol-wrap ol-end' },
    topbar(h('button', { class: 'ol-ghostbtn', onclick: leave }, 'Quitter')),
    h('div', {}, h('h1', { class: win ? 'win' : 'lose' }, head), h('p', { class: 'ol-hint' }, sub)),
    h('div', { class: 'ol-card' }, pod),
    h('div', { class: 'ol-card' }, h('h3', {}, 'Résultats'), tbl),
    h('div', { class: 'ol-row2' }, h('button', { class: 'ol-btn pri', onclick: () => S.net.send({ t: 'rematch' }) }, 'Rejouer'), h('button', { class: 'ol-btn', onclick: leave }, 'Retour à l’accueil'))));
  if (win) confetti();
  sfx(win ? 'good' : 'bad');
}
function confetti() {
  const c = h('div', { class: 'ol-conf' });
  for (let i = 0; i < 60; i++) c.append(h('i', { style: `left:${Math.random() * 100}%;background:hsl(${Math.random() * 360} 90% 60%);animation-duration:${2 + Math.random() * 2.5}s;animation-delay:${Math.random() * 0.8}s` }));
  S.root.append(c); setTimeout(() => c.remove(), 5200);
}

// ---------------- state machine
function render() {
  const room = S.room;
  if (!S.root) return;
  if (!room) { if (S.view !== 'menu') menu(); return; }
  if (room.state === 'lobby') { dropCountdown(); S.fillTotal = room.fillAt ? S.fillTotal : 0; lobby(room); }
  else if (room.state === 'countdown') { if (S.view !== 'lobby') lobby(room); countdown(room); }
  else if (room.state === 'race') race(room);
  else if (room.state === 'done') {
    if (S.view === 'race' && S.race) {
      S.race.update(room, S.lastEvt); S.lastEvt = null;
      if (!S.endTimer) { toast('Partie terminée — résultats…', 'warn'); S.endTimer = setTimeout(() => { S.endTimer = null; if (S.room?.state === 'done') end(S.room); }, 1500); }
    } else if (S.view !== 'end') end(room);
  }
}
function onRoom(m) {
  const prev = S.room; S.room = m.room;
  if (!S.me) S.me = S.net.me;
  S.lastEvt = m.evt || null;
  if (prev && prev.state !== 'lobby' && m.room.state === 'lobby') { clearTimeout(S.endTimer); S.endTimer = null; S.view = null; }
  const e = m.evt;
  if (e) {
    if (S.view === 'lobby' || S.view === 'menu') {
      if (e.id !== S.me && ['join', 'leave', 'host', 'back', 'emote', 'rematch'].includes(e.k)) toast(e.text, e.k === 'leave' ? 'warn' : '');
    }
    if (S.view === 'race' || S.view === 'lobby') {
      if (e.k === 'emote' && S.view === 'race') toast(`${e.nick} : ${e.text}`);
      if (e.k === 'strike' && e.id === S.me) { toast(`Erreur enregistrée (${e.strikes}/3).`, 'bad'); }
      if (e.k === 'strike' && e.id !== S.me) { toast(e.text, 'warn'); sfx('pop'); }
      if (e.k === 'out') { toast(e.text, 'bad'); if (e.id !== S.me) sfx('bad'); }
      if (e.k === 'finish') { toast(e.text, e.id === S.me ? 'good' : 'warn'); sfx(e.id === S.me ? 'good' : 'whoosh'); }
      if (e.k === 'lastcall') toast(e.text, 'bad');
      if (e.k === 'back') toast(e.text, 'good');
    }
  }
  render();
}

function leave() {
  if (S.room?.state === 'race' && me()?.status === 'racing' && !confirm('Quitter la course en cours ? Vous serez éliminé.')) return;
  S.net.send({ t: 'leave' }); clearToken(); S.net.token = null; reset();
}
function reset() {
  S.race?.destroy(); S.race = null; S.room = null; S.me = null; S.fillTotal = 0; clearTimeout(S.endTimer); S.endTimer = null; dropCountdown(); S.view = null; S.err = '';
  render();
}
function close() {
  if (S.room && S.room.state !== 'done' && S.room.state !== 'lobby' && me()?.status === 'racing') { leave(); if (S.room) return; }
  if (S.room) { S.net.send({ t: 'leave' }); clearToken(); S.net.token = null; }
  teardown();
}
function teardown() {
  S.race?.destroy(); S.race = null; clearInterval(S.ti); document.removeEventListener('keydown', S.onKey);
  S.net?.close(); S.net = null; S.root?.remove(); S.root = null; S.room = null; S.me = null; S.view = null;
  delete window.CAPCHA_ONLINE.game;
  window.dispatchEvent(new CustomEvent('capcha-online-close'));
  window.CAPCHA_ONLINE.onclose?.();
}

function open(opts = {}) {
  if (S.root) return;
  injectCss(); S.opts = opts; S.up = false; S.online = null;
  S.root = h('div', { class: 'ol-root', role: 'dialog', 'aria-label': 'Course en ligne' });
  S.main = h('div', {}); S.toasts = h('div', { class: 'ol-toasts', 'aria-live': 'polite' });
  S.root.append(S.main, S.toasts); document.body.append(S.root);
  const net = S.net = new Net(() => S.nick || 'Humain');
  net.on('status', (up) => { S.up = up; paintOnline(); paintMenuState(); S.race?.setPing(net.ping, up); if (!up && S.room) toast('Connexion perdue… tentative de reconnexion.', 'warn'); if (up && S.room) toast('Reconnecté.', 'good'); });
  net.on('welcome', (m) => { S.online = m.online; paintOnline(); if (!m.resume) { if (S.room) { reset(); toast('La salle n’existe plus.', 'warn'); } net.setToken(null); clearToken(); } });
  net.on('online', (m) => { S.online = m.online; paintOnline(); });
  net.on('pong', (m) => { S.online = m.online; paintOnline(); S.race?.setPing(net.ping, true); });
  net.on('joined', (m) => { S.me = net.me = m.id; });
  net.on('room', onRoom);
  net.on('error', (m) => { if (S.view === 'menu' && S.errEl) S.errEl.textContent = m.text; else toast(m.text, 'bad'); });
  net.on('dq', (m) => toast(m.text, 'bad'));
  net.connect();
  S.ti = setInterval(() => { S.tick?.(); S.cdTick?.(); S.race?.tick(); }, 100);
  S.onKey = (e) => { if (e.key === 'Escape' && (S.view === 'menu' || S.view === 'lobby' || S.view === 'end')) { e.preventDefault(); S.view === 'menu' ? close() : leave(); } };
  document.addEventListener('keydown', S.onKey);
  render();
}

// Count without opening the UI (title screen can show "N joueurs en ligne").
function peek() {
  return new Promise((res) => {
    let done = false; const fin = (n) => { if (!done) { done = true; res(n); try { ws.close(); } catch { /* */ } } };
    let ws; try { ws = new WebSocket(wsUrl()); } catch { return res(null); }
    ws.onmessage = (e) => { try { const m = JSON.parse(e.data); if (m.t === 'online') fin(m.online); } catch { /* */ } };
    ws.onerror = () => fin(null); setTimeout(() => fin(null), 2500);
  });
}

window.CAPCHA_ONLINE = Object.assign(window.CAPCHA_ONLINE || {}, {
  open, peek, close: () => S.root && close(), isOpen: () => !!S.root,
  total: () => CAPS?.length || null
});
let CAPS = null; // number of captchas = race length
import('../captchas/index.js').then((m) => { CAPS = m.CAPTCHAS; }).catch(() => {});

// deep link ?room=ABCD opens straight into join
try {
  const code = new URLSearchParams(location.search).get('room');
  if (code && /^[A-Za-z]{4}$/.test(code)) setTimeout(() => window.CAPCHA_ONLINE.open({ code: code.toUpperCase() }), 600);
} catch { /* */ }
