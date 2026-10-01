// Protocol test: node tools/online-proto.mjs  (spawns server on PORT=8083 itself)
import { spawn } from 'node:child_process';
import WebSocket from 'ws';
const port = process.env.PORT || 8083;
const srv = spawn('node', ['server/index.js'], { env: { ...process.env, PORT: port, OL_FILL_MS: '1500', OL_LAST_CALL_MS: '2500', OL_MIN_SOLVE_MS: '300', OL_BOT_SPEED: '6' }, stdio: 'inherit' });
await new Promise((r) => setTimeout(r, 700));
let fails = 0; const ok = (c, m) => { console.log(c ? 'ok  ' : 'FAIL', m); if (!c) fails++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function client(nick) {
  const ws = new WebSocket(`ws://localhost:${port}/ws`); const c = { ws, nick, room: null, evts: [], msgs: [] };
  ws.on('message', (d) => { const m = JSON.parse(d); c.msgs.push(m); if (m.t === 'room') { c.room = m.room; if (m.evt) c.evts.push(m.evt); } if (m.t === 'joined') Object.assign(c, { id: m.id, token: m.token }); if (m.t === 'welcome') c.welcome = m; });
  c.send = (o) => ws.send(JSON.stringify(o));
  c.open = new Promise((r) => ws.on('open', () => { c.send({ t: 'hello', nick }); r(); }));
  c.until = async (f, ms = 8000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (c.room && f(c.room)) return true; await sleep(30); } return false; };
  return c;
}
try {
  const a = client('Alice'), b = client('Bob'); await a.open; await b.open; await sleep(200);
  ok(b.welcome?.online >= 2, 'online counter >=2: ' + b.welcome?.online);
  a.send({ t: 'create', total: 4 }); await a.until((r) => r.code);
  const code = a.room.code; ok(/^[A-Z]{4}$/.test(code), 'room code ' + code);
  b.send({ t: 'join', code: code.toLowerCase() }); ok(await b.until((r) => r.players.length === 2), 'bob joined');
  const x = client('X'); await x.open; x.send({ t: 'join', code: 'ZZZZ' }); await sleep(200); ok(x.msgs.some((m) => m.t === 'error'), 'bad code error');
  b.send({ t: 'start' }); await sleep(200); ok(a.room.state === 'lobby', 'non-host start ignored');
  b.send({ t: 'ready', v: true }); a.send({ t: 'addbot' }); await a.until((r) => r.players.length === 3);
  ok(a.room.players.some((p) => p.bot && /^Bot-\d+$/.test(p.nick)), 'bot added');
  a.send({ t: 'start' }); ok(await a.until((r) => r.state === 'countdown'), 'countdown');
  ok(await a.until((r) => r.state === 'race', 8000), 'race'); ok(a.room.seed > 0, 'seed shared');
  ok(b.room.seed === a.room.seed, 'same seed');
  // impossible solve time -> dq
  a.send({ t: 'solve', level: 1, ms: 5 }); await sleep(150);
  ok(a.room.players.find((p) => p.id === a.id).reason === 'dq', 'instant solve disqualified');
  // bob plays honestly
  for (let l = 1; l <= 2; l++) { await sleep(500); b.send({ t: 'solve', level: l, ms: 400 }); }
  await sleep(200); ok(b.room.players.find((p) => p.id === b.id).solved === 2, 'bob solved 2');
  b.send({ t: 'solve', level: 1, ms: 400 }); // stale ignored
  b.send({ t: 'strike', level: 3 }); await sleep(450); b.send({ t: 'strike', level: 3 }); await sleep(450); b.send({ t: 'strike', level: 3 });
  await sleep(200); ok(b.room.players.find((p) => p.id === b.id).status === 'out', 'bob out after 3 strikes');
  ok(await a.until((r) => r.state === 'done', 30000), 'race ends'); ok(a.room.winnerId, 'winner ' + a.room.winnerId);
  const evk = new Set(a.evts.map((e) => e.k)); ok(['solve', 'strike', 'out', 'end'].every((k) => evk.has(k)), 'events ' + [...evk]);
  // rematch
  b.send({ t: 'rematch' }); ok(await a.until((r) => r.state === 'lobby'), 'rematch → lobby');
  // reconnect
  const tok = a.token; a.ws.close(); await sleep(300);
  const a2 = client('Alice'); a2.ws.on('open', () => a2.send({ t: 'hello', nick: 'Alice', token: tok })); await sleep(500);
  ok(a2.msgs.some((m) => m.t === 'joined' && m.resume), 'reconnect resumed'); 
  // rate limit
  const f = client('Flood'); await f.open; for (let i = 0; i < 200; i++) f.send({ t: 'ping', c: i }); await sleep(300);
  ok(f.msgs.some((m) => m.t === 'error'), 'rate limit error');
  f.ws.send('x'.repeat(5000)); await sleep(200); ok(f.ws.readyState !== 1, 'oversize payload closes');
  // quick match solo -> bots
  const q = client('Solo'); await q.open; q.send({ t: 'quick', total: 3 });
  ok(await q.until((r) => r.players.length >= 4, 4000), 'quick fills with bots'); ok(await q.until((r) => r.state === 'race', 8000), 'quick race starts');
  ok(await q.until((r) => r.state === 'done', 30000), 'bots-only-ish race ends (humans out after timeout)');
} catch (e) { console.error(e); fails++; }
srv.kill(); console.log(fails ? `${fails} FAILED` : 'ALL OK'); process.exit(fails ? 1 : 0);
