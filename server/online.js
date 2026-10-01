// ONLINE PIECE — authoritative rooms over ws. attachOnline(server) → { close() }
import { WebSocketServer } from 'ws';
import crypto from 'node:crypto';

const ENV = process.env;
const CFG = {
  MAX_PLAYERS: 8,
  QUICK_TARGET: 4,                       // quick match is topped up with bots to this many players
  FILL_MS: +ENV.OL_FILL_MS || 8000,      // wait before bots fill a quick lobby
  CD_PRIVATE: 3600, CD_QUICK: 3600,
  LAST_CALL_MS: +ENV.OL_LAST_CALL_MS || 15000, // after first finisher
  HUMANS_OUT_MS: 9000,                   // all humans out/done: let bots finish this long
  GRACE_RACE_MS: 15000, GRACE_LOBBY_MS: 4000,
  MIN_SOLVE_MS: +ENV.OL_MIN_SOLVE_MS || 600, // impossible below this since previous solve
  MAX_ROOMS: 300, MAX_CONNS: 2000, MAX_PER_IP: 30,
  MAX_PAYLOAD: 1024,
  BOT_SPEED: +ENV.OL_BOT_SPEED || 1
};

const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const EMOTES = ['Facile.', 'Vous êtes un robot ?', 'Pas mal pour un humain.', 'Aïe.', 'GG', 'Je vous vois 👀'];

const FAIL = [
  (n) => `${n} a cliqué avec assurance. Dans le vide.`,
  (n) => `${n} confond un feu rouge et une mangue.`,
  (n) => `${n} vient de se faire recaler. Le comité prend des notes.`,
  (n) => `${n} doute de sa propre humanité.`,
  (n) => `Erreur de ${n}. L'algorithme sourit.`,
  (n) => `${n} a cru que c'était facultatif.`,
  (n) => `${n} : humain à 62 %. Marge d'erreur : oui.`,
  (n) => `${n} a échoué. Un robot l'aurait fait.`
];
const FAIL2 = [
  (n) => `Plus qu'une erreur pour ${n}. La suspicion monte.`,
  (n) => `${n} est sur la liste. Une seule erreur de plus.`
];
const OUT = [
  (n) => `${n} est éliminé. Humanité révoquée.`,
  (n) => `${n} est confirmé robot. Veuillez circuler.`,
  (n) => `${n} quitte le portique, escorté par un vigile imaginaire.`
];

const rooms = new Map();
const conns = new Set();
const byToken = new Map();
let pid = 0;

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const now = () => Date.now();
const rnd = (a, b) => a + Math.random() * (b - a);

function cleanNick(x) {
  let s = String(x ?? '').normalize('NFKC').replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 14).trim();
  if (s.length < 2) s = 'Humain' + Math.floor(rnd(10, 99));
  if (/^bot[-\s]?\d*$/i.test(s)) s = 'Vrai ' + s.slice(0, 8);
  return s;
}
function uniqueNick(room, nick) {
  const names = new Set([...room.players.values()].map((p) => p.nick.toLowerCase()));
  let n = nick, i = 2;
  while (names.has(n.toLowerCase())) n = nick.slice(0, 11) + ' ' + i++;
  return n;
}

function send(ws, obj) {
  if (ws && ws.readyState === 1) { try { ws.send(JSON.stringify(obj)); } catch { /* closed */ } }
}
const humans = (room) => [...room.players.values()].filter((p) => !p.bot);
const livePresent = (room) => humans(room).filter((p) => p.connected || p.graceTimer);

function newCode() {
  for (let k = 0; k < 200; k++) {
    let c = ''; for (let i = 0; i < 4; i++) c += LETTERS[crypto.randomInt(LETTERS.length)];
    if (!rooms.has(c)) return c;
  }
  return null;
}

function newPlayer(room, nick, bot) {
  const used = new Set([...room.players.values()].map((p) => p.c));
  let c = 0; while (used.has(c)) c++;
  const p = {
    id: 'p' + (++pid), token: bot ? null : crypto.randomBytes(12).toString('hex'),
    nick: uniqueNick(room, nick), bot, ws: null, ready: bot, c,
    level: 1, solved: 0, strikes: 0, status: 'lobby', reason: null,
    outAt: 0, doneAt: 0, lvlStart: 0, reachedAt: 0, lastStrikeAt: 0, times: [],
    connected: !bot, graceTimer: null, timer: null, room, left: false,
    skill: rnd(0.75, 1.45), sloppy: rnd(0.6, 1.5), lastEmote: 0
  };
  room.players.set(p.id, p);
  if (!bot) byToken.set(p.token, p);
  return p;
}

function snapPlayer(room, p, rankOf) {
  const t = p.times;
  return {
    id: p.id, nick: p.nick, bot: p.bot, c: p.c, ready: p.ready, level: p.level, solved: p.solved,
    strikes: p.strikes, status: p.status, reason: p.reason, connected: p.connected || p.bot, left: p.left,
    rank: rankOf.get(p.id) || 0,
    best: t.length ? Math.round(Math.min(...t)) : null,
    avg: t.length ? Math.round(t.reduce((a, b) => a + b, 0) / t.length) : null,
    finishMs: p.doneAt ? p.doneAt - room.raceStart : null
  };
}
function ranking(room) {
  const cmp = (a, b) => {
    if (room.winnerId) { if (a.id === room.winnerId) return -1; if (b.id === room.winnerId) return 1; }
    const da = a.reason === 'dq', db = b.reason === 'dq';
    if (da !== db) return da ? 1 : -1;
    const fa = a.status === 'done', fb = b.status === 'done';
    if (fa !== fb) return fa ? -1 : 1;
    if (fa) return a.doneAt - b.doneAt;
    if (a.solved !== b.solved) return b.solved - a.solved;
    const oa = a.status === 'out', ob = b.status === 'out';
    if (oa !== ob) return oa ? 1 : -1;
    if (oa) return b.outAt - a.outAt;
    return a.reachedAt - b.reachedAt || (a.id < b.id ? -1 : 1);
  };
  const arr = [...room.players.values()].sort(cmp);
  const m = new Map(); arr.forEach((p, i) => m.set(p.id, i + 1));
  return m;
}
function snap(room) {
  const rankOf = (room.state === 'race' || room.state === 'done') ? ranking(room) : new Map();
  const live = room.state === 'race' || room.state === 'done';
  return {
    code: room.code, state: room.state, quick: room.quick, hostId: room.hostId, total: room.total,
    seed: live ? room.seed : null, startAt: room.startAt, fillAt: room.fillAt, lastCallAt: room.lastCallAt,
    raceStart: room.raceStart, winnerId: room.winnerId, endReason: room.endReason, now: now(), emotes: EMOTES,
    players: [...room.players.values()].map((p) => snapPlayer(room, p, rankOf))
  };
}
function broadcast(room, evt) {
  const msg = { t: 'room', room: snap(room) };
  if (evt) msg.evt = evt;
  for (const p of room.players.values()) if (!p.bot && p.connected) send(p.ws, msg);
}

function createRoom(quick, total) {
  if (rooms.size >= CFG.MAX_ROOMS) return null;
  const code = newCode(); if (!code) return null;
  const room = {
    code, quick, total: Math.max(1, Math.min(60, Math.floor(+total) || 10)), players: new Map(), hostId: null,
    state: 'lobby', seed: 0, startAt: 0, fillAt: 0, lastCallAt: 0, raceStart: 0, winnerId: null, endReason: null,
    timers: new Set(), created: now(), touched: now(), botN: new Set()
  };
  rooms.set(code, room);
  if (quick) armFill(room);
  return room;
}
function later(room, ms, fn) {
  const t = setTimeout(() => { room.timers.delete(t); fn(); }, ms);
  room.timers.add(t); return t;
}
function clearTimers(room) {
  for (const t of room.timers) clearTimeout(t);
  room.timers.clear();
  for (const p of room.players.values()) { clearTimeout(p.timer); p.timer = null; }
}
function destroyRoom(room) {
  clearTimers(room);
  for (const p of room.players.values()) { if (p.token) byToken.delete(p.token); clearTimeout(p.graceTimer); if (p.ws?.ctx?.player === p) p.ws.ctx.player = null; }
  rooms.delete(room.code);
}

function armFill(room) {
  room.fillAt = now() + CFG.FILL_MS;
  room.fillTimer = later(room, CFG.FILL_MS, () => fillAndStart(room));
}
function addBot(room) {
  let n; do { n = Math.floor(rnd(1, 100)); } while (room.botN.has(n)); room.botN.add(n);
  const p = newPlayer(room, 'Bot-' + n, true); p.nick = 'Bot-' + n; return p;
}
function fillAndStart(room) {
  if (room.state !== 'lobby' || !room.quick) return;
  if (!humans(room).length) return;
  while (room.players.size < CFG.QUICK_TARGET) addBot(room);
  startCountdown(room, CFG.CD_QUICK);
}
function checkQuickReady(room) {
  if (!room.quick || room.state !== 'lobby') return;
  const hs = humans(room);
  if (hs.length >= CFG.QUICK_TARGET || (hs.length && hs.every((p) => p.ready))) fillAndStart(room);
}

function startCountdown(room, ms) {
  if (room.state !== 'lobby') return;
  room.state = 'countdown'; room.startAt = now() + ms; room.fillAt = 0;
  later(room, ms, () => startRace(room));
  broadcast(room, { k: 'countdown' });
}
function startRace(room) {
  if (room.state !== 'countdown') return;
  const t = now();
  room.state = 'race'; room.seed = crypto.randomInt(1, 2 ** 31); room.raceStart = t; room.lastCallAt = 0;
  room.winnerId = null; room.endReason = null; room.humansOutTimer = null;
  for (const p of room.players.values()) {
    Object.assign(p, { status: p.left ? 'out' : 'racing', reason: p.left ? 'left' : null, level: 1, solved: 0, strikes: 0, lvlStart: t, reachedAt: t, outAt: p.left ? t : 0, doneAt: 0, times: [] });
  }
  later(room, Math.min(25 * 60000, room.total * 60000 + 60000), () => endRace(room, 'timeout'));
  for (const p of room.players.values()) if (p.bot && p.status === 'racing') botStep(room, p, true);
  broadcast(room, { k: 'go' });
}

// ---- race events
function emit(room, evt) { room.touched = now(); broadcast(room, evt); }

function acceptSolve(room, p, ms) {
  const lvl = p.level;
  p.times.push(Math.max(0, ms)); p.solved++; p.reachedAt = now(); p.lvlStart = p.reachedAt;
  if (p.solved >= room.total) { finish(room, p); return; }
  p.level++;
  emit(room, { k: 'solve', id: p.id, nick: p.nick, level: lvl, ms: Math.round(ms), text: `${p.nick} passe le niveau ${lvl}.` });
}
function strikeP(room, p) {
  p.strikes++; p.lastStrikeAt = now();
  const text = p.strikes === 2 ? pick(FAIL2)(p.nick) : pick(FAIL)(p.nick);
  if (p.strikes >= 3) { eliminate(room, p, 'strikes', { k: 'strike', id: p.id, nick: p.nick, level: p.level, strikes: p.strikes, text }); return; }
  emit(room, { k: 'strike', id: p.id, nick: p.nick, level: p.level, strikes: p.strikes, text });
}
function eliminate(room, p, reason, first) {
  if (p.status !== 'racing') return;
  p.status = 'out'; p.reason = reason; p.outAt = now(); clearTimeout(p.timer);
  const text = reason === 'dq' ? `${p.nick} : vitesse surhumaine détectée. Disqualifié pour excès de talent.`
    : reason === 'left' ? `${p.nick} a quitté la file. Lâche.` : pick(OUT)(p.nick);
  if (first) emit(room, first);
  emit(room, { k: 'out', id: p.id, nick: p.nick, level: p.level, reason, text });
  checkEnd(room);
}
function finish(room, p) {
  p.status = 'done'; p.doneAt = now(); clearTimeout(p.timer);
  const first = !room.finishCount; room.finishCount = (room.finishCount || 0) + 1;
  emit(room, { k: 'finish', id: p.id, nick: p.nick, place: room.finishCount, text: first ? `${p.nick} franchit le portique en premier !` : `${p.nick} franchit le portique (#${room.finishCount}).` });
  if (first && [...room.players.values()].some((q) => q.status === 'racing')) {
    room.lastCallAt = now() + CFG.LAST_CALL_MS;
    later(room, CFG.LAST_CALL_MS, () => endRace(room, 'lastcall'));
    emit(room, { k: 'lastcall', text: 'Dernier appel : le portique ferme bientôt.' });
  }
  checkEnd(room);
}
function checkEnd(room) {
  if (room.state !== 'race') return;
  const all = [...room.players.values()];
  const racing = all.filter((p) => p.status === 'racing');
  if (!racing.length) { endRace(room, 'all'); return; }
  const finishers = all.filter((p) => p.status === 'done').length;
  if (!finishers && racing.length === 1 && all.length >= 2) { room.winnerId = racing[0].id; endRace(room, 'last'); return; }
  if (!racing.some((p) => !p.bot) && !room.humansOutTimer) {
    room.humansOutTimer = later(room, CFG.HUMANS_OUT_MS, () => endRace(room, 'humansout'));
  }
}
function endRace(room, reason) {
  if (room.state !== 'race') return;
  room.state = 'done'; room.endReason = reason;
  for (const t of room.timers) clearTimeout(t);
  room.timers.clear();
  for (const p of room.players.values()) clearTimeout(p.timer);
  const r = ranking(room); const w = [...room.players.values()].find((p) => r.get(p.id) === 1);
  emit(room, { k: 'end', id: w?.id, nick: w?.nick, reason, text: w ? `${w.nick} remporte la partie.` : 'Partie terminée.' });
}

// ---- bots
function botStep(room, p, first) {
  if (room.state !== 'race' || p.status !== 'racing') return;
  const lvl = p.level;
  const base = (2800 + lvl * 650) * (first ? 1.15 : 1);
  const t = Math.max(900, base * rnd(0.55, 1.5) * p.skill / CFG.BOT_SPEED);
  p.timer = setTimeout(() => {
    if (room.state !== 'race' || p.status !== 'racing') return;
    const failP = Math.min(0.3, 0.06 + lvl * 0.012) * p.sloppy;
    if (Math.random() < failP) strikeP(room, p); else acceptSolve(room, p, t);
    botStep(room, p);
  }, t);
}

// ---- membership
function snapshotTo(p) { if (p.room) send(p.ws, { t: 'room', room: snap(p.room) }); }

function joinRoom(ws, room, nick) {
  const p = newPlayer(room, nick, false);
  p.ws = ws; ws.ctx.player = p; p.status = 'lobby';
  if (!room.hostId || !room.players.has(room.hostId) || room.players.get(room.hostId).bot) room.hostId = p.id;
  if (room.quick) {
    const bots = [...room.players.values()].filter((q) => q.bot);
    if (bots.length) removePlayer(room, bots[bots.length - 1], true);
  }
  send(ws, { t: 'joined', id: p.id, token: p.token, code: room.code });
  emit(room, { k: 'join', id: p.id, nick: p.nick, text: `${p.nick} rejoint la file.` });
  checkQuickReady(room);
  return p;
}
function removePlayer(room, p, silent) {
  clearTimeout(p.graceTimer); clearTimeout(p.timer); p.graceTimer = null;
  if (room.state === 'race' && !p.bot && p.status === 'racing') eliminate(room, p, 'left');
  const keep = room.state === 'race' || (room.state === 'done' && false);
  if (p.token) byToken.delete(p.token);
  p.connected = false; p.left = true;
  if (p.ws?.ctx?.player === p) p.ws.ctx.player = null;
  p.ws = null;
  if (!keep) room.players.delete(p.id);
  if (p.bot) room.botN.delete(+p.nick.slice(4));
  if (!livePresent(room).length) { destroyRoom(room); return; }
  if (room.hostId === p.id) {
    const h = livePresent(room).find((q) => q.connected) || livePresent(room)[0];
    room.hostId = h.id;
    if (!silent) emit(room, { k: 'host', id: h.id, nick: h.nick, text: `${h.nick} devient chef de salle.` });
  }
  if (room.state === 'countdown' && room.players.size < 1) { room.state = 'lobby'; }
  if (!silent) emit(room, { k: 'leave', id: p.id, nick: p.nick, text: `${p.nick} quitte la file.` });
  else broadcast(room);
  if (room.state === 'lobby') checkQuickReady(room);
}
function onDisconnect(ws) {
  conns.delete(ws);
  const p = ws.ctx.player;
  if (!p || p.ws !== ws) return;
  const room = p.room;
  p.connected = false; p.ws = null;
  const grace = room.state === 'race' || room.state === 'countdown' ? CFG.GRACE_RACE_MS : CFG.GRACE_LOBBY_MS;
  broadcast(room);
  p.graceTimer = setTimeout(() => { p.graceTimer = null; if (rooms.has(room.code) && !p.connected) removePlayer(room, p); }, grace);
}
function resume(ws, p) {
  clearTimeout(p.graceTimer); p.graceTimer = null;
  if (p.ws && p.ws !== ws) { p.ws.ctx.player = null; try { p.ws.close(4000, 'replaced'); } catch { /* */ } }
  p.ws = ws; p.connected = true; ws.ctx.player = p;
  if (p.status === 'racing') p.lvlStart = now();
  send(ws, { t: 'joined', id: p.id, token: p.token, code: p.room.code, resume: true });
  emit(p.room, { k: 'back', id: p.id, nick: p.nick, text: `${p.nick} est de retour.` });
}
function findQuick() {
  for (const r of rooms.values()) {
    if (!r.quick || r.players.size >= CFG.MAX_PLAYERS) continue;
    if (r.state === 'lobby' || (r.state === 'countdown' && r.startAt - now() > 1800)) {
      if (humans(r).length < CFG.MAX_PLAYERS) return r;
    }
  }
  return null;
}

// ---- message handling
const E = (ws, text, code) => send(ws, { t: 'error', text, code });

function handle(ws, m) {
  const ctx = ws.ctx;
  if (m.t === 'ping') { send(ws, { t: 'pong', c: m.c, now: now(), online: onlineCount() }); return; }
  if (m.t === 'hello') {
    ctx.nick = cleanNick(m.nick); ctx.hello = true;
    const p = typeof m.token === 'string' ? byToken.get(m.token) : null;
    send(ws, { t: 'welcome', online: onlineCount(), now: now(), nick: ctx.nick, resume: !!(p && rooms.has(p.room.code)) });
    if (p && rooms.has(p.room.code)) resume(ws, p);
    return;
  }
  if (!ctx.hello) return;
  const p = ctx.player, room = p?.room;
  switch (m.t) {
    case 'quick': case 'create': case 'join': {
      if (p) return E(ws, 'Vous êtes déjà dans une salle.');
      if (m.nick != null) ctx.nick = cleanNick(m.nick);
      let r;
      if (m.t === 'join') {
        r = rooms.get(String(m.code || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4));
        if (!r) return E(ws, 'Salle introuvable. Le code est-il bien orthographié par un humain ?', 'nf');
        if (r.state !== 'lobby') return E(ws, 'Cette partie est déjà lancée. Revenez plus tard, comme tout le monde.', 'started');
        if (r.players.size >= CFG.MAX_PLAYERS) return E(ws, 'Salle pleine. Le portique est saturé.', 'full');
      } else if (m.t === 'quick') {
        r = findQuick() || createRoom(true, m.total);
      } else r = createRoom(false, m.total);
      if (!r) return E(ws, 'Serveur surchargé. Réessayez dans un instant.', 'busy');
      joinRoom(ws, r, ctx.nick);
      return;
    }
    case 'leave': if (p) removePlayer(room, p); return;
  }
  if (!p) return;
  const t = now();
  switch (m.t) {
    case 'ready':
      if (room.state !== 'lobby') return;
      p.ready = !!m.v; broadcast(room); checkQuickReady(room); return;
    case 'start':
      if (room.state !== 'lobby' || room.hostId !== p.id || room.quick) return;
      startCountdown(room, CFG.CD_PRIVATE); return;
    case 'addbot':
      if (room.state !== 'lobby' || room.hostId !== p.id || room.quick || room.players.size >= CFG.MAX_PLAYERS) return;
      addBot(room); broadcast(room); return;
    case 'rmbot': {
      if (room.state !== 'lobby' || room.hostId !== p.id || room.quick) return;
      const b = [...room.players.values()].reverse().find((q) => q.bot);
      if (b) removePlayer(room, b, true); return;
    }
    case 'emote':
      if (t - p.lastEmote < 1200 || !Number.isInteger(m.e) || !EMOTES[m.e]) return;
      p.lastEmote = t; emit(room, { k: 'emote', id: p.id, nick: p.nick, text: EMOTES[m.e] }); return;
    case 'rematch':
      if (room.state !== 'done') return;
      resetRoom(room, p); return;
    case 'solve': {
      if (room.state !== 'race' || p.status !== 'racing') return;
      if (m.level !== p.level) return; // stale
      const elapsed = t - p.lvlStart, ms = +m.ms;
      if (!Number.isFinite(ms) || ms < 0 || elapsed < CFG.MIN_SOLVE_MS || ms > elapsed + 2000) {
        eliminate(room, p, 'dq'); send(ws, { t: 'dq', text: 'Vitesse surhumaine détectée.' }); return;
      }
      acceptSolve(room, p, ms); return;
    }
    case 'strike':
      if (room.state !== 'race' || p.status !== 'racing' || m.level !== p.level) return;
      if (t - p.lastStrikeAt < 350) return;
      strikeP(room, p); return;
  }
}
function resetRoom(room, by) {
  clearTimers(room);
  for (const p of [...room.players.values()]) {
    if (p.bot && room.quick) { room.players.delete(p.id); room.botN.delete(+p.nick.slice(4)); continue; }
    if (!p.bot && (!p.connected || p.left)) { clearTimeout(p.graceTimer); if (p.token) byToken.delete(p.token); room.players.delete(p.id); continue; }
    Object.assign(p, { ready: p.bot, status: 'lobby', reason: null, level: 1, solved: 0, strikes: 0, times: [], doneAt: 0, outAt: 0 });
  }
  Object.assign(room, { state: 'lobby', winnerId: null, endReason: null, startAt: 0, lastCallAt: 0, raceStart: 0, finishCount: 0, humansOutTimer: null, seed: 0 });
  if (!room.players.has(room.hostId)) room.hostId = humans(room)[0]?.id;
  if (room.quick) armFill(room);
  emit(room, { k: 'rematch', id: by.id, nick: by.nick, text: `${by.nick} relance une partie.` });
}

const onlineCount = () => [...conns].filter((w) => w.ctx.hello).length;

export function attachOnline(server) {
  const wss = new WebSocketServer({ server, path: '/ws', maxPayload: CFG.MAX_PAYLOAD });
  const ipCount = new Map();
  let lastOnline = -1;

  wss.on('connection', (ws, req) => {
    const ip = req.socket.remoteAddress || '?';
    const n = (ipCount.get(ip) || 0) + 1;
    if (conns.size >= CFG.MAX_CONNS || n > CFG.MAX_PER_IP) { ws.close(1013, 'busy'); return; }
    ipCount.set(ip, n);
    ws.ctx = { ip, alive: true, hello: false, player: null, nick: '', tokens: 30, last: now(), abuse: 0, errAt: 0 };
    conns.add(ws);
    ws.on('pong', () => { ws.ctx.alive = true; });
    ws.on('message', (data, isBinary) => {
      const c = ws.ctx; c.alive = true;
      const t = now(); c.tokens = Math.min(30, c.tokens + (t - c.last) * 0.015); c.last = t;
      if (c.tokens < 1) {
        if (++c.abuse > 60) { ws.close(1008, 'rate'); return; }
        if (t - c.errAt > 1500) { c.errAt = t; E(ws, 'Doucement. Même les robots font une pause.'); }
        return;
      }
      c.tokens -= 1;
      if (isBinary) return;
      let m; try { m = JSON.parse(data.toString()); } catch { return; }
      if (!m || typeof m !== 'object' || typeof m.t !== 'string') return;
      try { handle(ws, m); } catch (e) { console.error('[online]', e); }
    });
    ws.on('close', () => {
      const k = (ipCount.get(ip) || 1) - 1; if (k <= 0) ipCount.delete(ip); else ipCount.set(ip, k);
      onDisconnect(ws);
    });
    ws.on('error', () => {});
    send(ws, { t: 'online', online: onlineCount() });
  });

  const hb = setInterval(() => {
    for (const ws of conns) {
      if (!ws.ctx.alive) { ws.terminate(); continue; }
      ws.ctx.alive = false; try { ws.ping(); } catch { /* */ }
    }
  }, 10000);
  const counter = setInterval(() => {
    const n = onlineCount();
    if (n === lastOnline) return; lastOnline = n;
    const playing = [...rooms.values()].filter((r) => r.state === 'race').reduce((a, r) => a + humans(r).length, 0);
    for (const ws of conns) send(ws, { t: 'online', online: n, playing });
  }, 2500);
  const sweep = setInterval(() => {
    const t = now();
    for (const r of rooms.values()) {
      if (!livePresent(r).length) destroyRoom(r);
      else if (r.state === 'done' && t - r.touched > 10 * 60000) destroyRoom(r);
      else if (r.state === 'lobby' && t - r.touched > 30 * 60000 && !r.quick) destroyRoom(r);
    }
  }, 20000);
  for (const i of [hb, counter, sweep]) i.unref?.();
  wss.on('close', () => { clearInterval(hb); clearInterval(counter); clearInterval(sweep); });
  return { wss, rooms, close() { for (const r of [...rooms.values()]) destroyRoom(r); wss.close(); } };
}
