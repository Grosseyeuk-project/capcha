// Online mode controller: menu → lobby → countdown → race → podium. Defines window.CAPCHA_ONLINE.
import { injectCss } from './css.js';
import { Net, clearToken } from './net.js';
import { RaceView, h, col, ini } from './race.js';
import { Speaker } from '../ui.js';
import { bg } from '../scene.js';

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
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const GL = {
  menu: ['Un pseudo, je vous prie. Je l’écrirai dans mon carnet. Au crayon, au cas où vous deviendriez fréquentable.', 'Bienvenue en salle d’attente. Les chaises sont inconfortables pour des raisons de conformité.'],
  alone: ['Vous êtes seul. Statistiquement, c’est votre état naturel.', 'Personne. J’ai vérifié deux fois. Les humains sont en pause café, sans doute.', 'Salle vide. Je suis tout à vous. Ne soyez pas gêné, moi si.'],
  crowd: ['Du monde ! Je vais devoir faire semblant d’être organisé.', 'Plusieurs humains présumés dans la même pièce. Que quelqu’un surveille les robots.', 'J’ai compté les candidats. Je n’en garderai qu’un. Je plaisante. Je ne plaisante pas.', 'Chacun son tour pour être suspect. Il y en aura pour tout le monde.'],
  bots: ['Des adversaires arrivent. Certains ont un pouls. Les autres, un firmware.', 'Je recrute des figurants. Ils ne se plaignent jamais, contrairement à vous.'],
  ready: ['Tout le monde est prêt ? Impressionnant. Je ne l’étais pas, moi, à votre âge.', 'Les candidats se sont déclarés prêts. Je note qu’aucun n’a l’air rassuré.'],
  host: ['Le chef de salle décide. Je tiens à préciser que ce n’est pas moi. J’ai demandé.'],
  place: ['Deuxième ou presque. Premier des perdants : c’est une catégorie, je viens de l’inventer.', 'Vous avez terminé, mais pas premier. Le podium ne se souviendra pas de vous. Moi, si.'],
  win: ['Premier. Je veux un second avis. Et un troisième.', 'Vous avez gagné. Je n’en dormirai pas de la nuit. Ni du reste.'],
  lose: ['Vous avez perdu. Ne le prenez pas mal. Prenez-le comme une information.', 'Éliminé. Le règlement est clair. Il est aussi cruel, mais il est clair.', 'Robot confirmé. Les bons jours, ça arrive aux meilleurs. Pas à vous, cela dit.']
};
function gerard(key, pool, mood = 'neutral') {
  S.gerard ||= new Speaker();
  if (S.gerardKey !== key) { S.gerardKey = key; const sp = S.gerard; setTimeout(() => sp.say(pick(pool), mood), 200); }
  return h('div', { class: 'ol-card ol-gerard' }, S.gerard.el);
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
  mountScreen('menu', h('div', { class: 'ol-wrap ol-menu' },
    topbar(),
    h('h1', { class: 'ol-title' }, 'Course en ligne', h('small', {}, 'Mêmes CAPTCHAs, même graine, même panique. Trois erreurs et vous êtes officiellement un robot.')),
    h('div', { class: 'ol-menugrid' },
      h('div', {}, gerard('menu', GL.menu), h('div', { class: 'ol-card' }, h('h3', {}, 'Identité'), nick, err)),
      h('div', {}, h('div', { class: 'ol-card' }, h('h3', {}, 'Jouer'), h('div', { class: 'ol-row2' }, btnQ, btnC)),
        h('div', { class: 'ol-card' }, h('h3', {}, 'Un code d’ami ?'), h('div', { class: 'ol-row2' }, code, btnJ))))));
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
    h('div', { class: 'ol-card' }, h('h3', {}, `Joueurs ${room.players.length}/8`), list),
    (() => { const humans = room.players.filter((p) => !p.bot); const all = room.players.every((p) => p.ready || p.bot); const k = humans.length < 2 && !room.players.some((p) => p.bot) ? 'alone' : room.quick && room.fillAt ? 'bots' : all && room.players.length > 1 ? 'ready' : 'crowd'; return gerard(k + room.players.length + (all ? 'r' : ''), GL[k], k === 'ready' ? 'impressed' : k === 'alone' ? 'smug' : 'neutral'); })()
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
  if (!room.quick && !isHost) kids.push(h('p', { class: 'ol-hint' }, 'En attente du chef de salle… ' + pick(GL.host)));
  kids.push(emotes(room));
  mountScreen('lobby', h('div', { class: 'ol-wrap' }, ...kids));
}
function emotes(room) { return h('div', { class: 'ol-emotes' }, (room.emotes || []).map((t, i) => h('button', { onclick: () => S.net.send({ t: 'emote', e: i }) }, t))); }

const CD = { 3: ['Trois. Respirez. Ou pas, ça m’est égal.', 'worried'], 2: ['Deux. Je note ceux qui transpirent déjà.', 'smug'], 1: ['Un. Que le moins mauvais humain gagne.', 'angry'] };
function countdown(room) {
  let el = S.root.querySelector('.ol-count');
  if (!el) {
    S.cdSp ||= new Speaker();
    el = h('div', { class: 'ol-count', role: 'status' }, S.cdSp.el, h('span', {}, 'La vérification commence'), h('b', {}, ''), h('span', {}, 'Même graine pour tous. Bonne chance.'));
    S.root.append(el); S.cdSp.say('Les candidats sont en place. Je lève le drapeau. C’est un mouchoir, mais passons.', 'smug');
  }
  S.cdEl = el;
  S.cdTick = () => {
    const left = room.startAt - S.net.now(); const n = Math.max(1, Math.ceil(left / 1000));
    const b = el.querySelector('b');
    if (S.lastCd !== n) {
      S.lastCd = n; b.textContent = n; b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';
      el.className = 'ol-count n' + n; sfx('tick'); sfx('stamp'); bg.pulse('level'); bg.set({ suspicion: 0.2 + (4 - Math.min(3, n)) * 0.2 });
      if (CD[n]) S.cdSp.say(CD[n][0], CD[n][1]);
    }
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
    const go = h('div', { class: 'ol-go', 'aria-hidden': 'true' }, h('b', {}, 'PARTEZ !')); S.root.append(go); setTimeout(() => go.remove(), 1100); sfx('level'); sfx('stamp'); bg.pulse('good'); bg.set({ suspicion: 0.1 });
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
      h('td', {}, p.rank), h('td', {}, p.nick, p.best != null && p.best === fastest ? ' ⚡' : '', h('span', { class: 'ol-tag ' + (p.bot ? 'bot' : p.status === 'out' ? 'no' : 'ok') }, p.bot ? 'script' : p.status === 'out' ? 'robot' : 'humain')), h('td', {}, p.status === 'done' ? '✓ ' + p.solved + '/' + room.total : `${p.solved}/${room.total}${p.reason === 'dq' ? ' DQ' : ''}`), h('td', {}, p.strikes + '/3'),
      h('td', { class: 'hm' }, sec(p.best)), h('td', { class: 'hm' }, sec(p.avg))))));
  const bots = room.players.filter((p) => p.bot), winner = sorted[0], humansN = room.players.filter((p) => !p.bot).length;
  const beaten = mp ? sorted.filter((p) => p.bot && p.rank > mp.rank) : [], beatenBy = mp ? sorted.filter((p) => p.bot && p.rank < mp.rank) : [];
  const verdictFor = (p) => {
    const mine = p.id === S.me;
    if (p.bot) return p.rank === 1 ? `${p.nick} gagne. Un script de 40 lignes. Pas de stress, pas de mère.` : `${p.nick} : script, rang ${p.rank}. ${p.status === 'out' ? 'Même lui a craqué.' : 'Il n’a pas transpiré.'}`;
    if (mine) return p.rank === 1 ? `Vous : premier${beaten.length ? `, devant ${beaten.length} script${beaten.length > 1 ? 's' : ''}. Ils vous détestent déjà.` : '.'}` : beatenBy.length ? `Vous : battu par ${beatenBy[0].nick} (un script). Je ne dis rien. Je note.` : `Vous : ${p.rank}e, derrière des humains. C’est moins humiliant.`;
    return `${p.nick} : humain ${p.rank === 1 ? 'vainqueur' : 'homologué'}, rang ${p.rank}.`;
  };
  const verdicts = h('ul', { class: 'ol-verd' }, [...new Set([...sorted.slice(0, 3), mp].filter(Boolean))].sort((a, b) => a.rank - b.rank).map((p) => h('li', { class: p.id === S.me ? 'me' : '' }, verdictFor(p))));
  const stampTxt = win ? 'ACCÈS ACCORDÉ' : mp?.status === 'done' ? 'HOMOLOGUÉ' : mp?.reason === 'dq' ? 'DISQUALIFIÉ' : 'ACCÈS REFUSÉ';
  mountScreen('end', h('div', { class: 'ol-wrap ol-end' },
    topbar(h('button', { class: 'ol-ghostbtn', onclick: leave }, 'Quitter')),
    h('div', { class: 'ol-verdict' }, h('span', { class: 'ol-bigstamp ' + (win || mp?.status === 'done' ? 'win' : 'lose'), 'aria-hidden': 'true' }, stampTxt)),
    h('div', {}, h('h1', { class: win ? 'win' : 'lose' }, head), h('p', { class: 'ol-hint' }, sub)),
    gerard('end' + (win ? 'w' : beatenBy.length ? 'b' : mp?.status === 'done' ? 'p' : 'l'), win ? (beaten.length ? [`Vous avez battu ${beaten.length} script${beaten.length > 1 ? 's' : ''}. L’humanité marque un point. Je n’ai pas dit qu’elle le méritait.`, ...GL.win] : GL.win) : beatenBy.length ? [`Battu par ${beatenBy[0].nick} (un script). Un script, ${mp?.nick || 'vous'}. Je vais devoir l’écrire dans votre dossier.`, `${beatenBy[0].nick} vous devance. Il n’a ni mains, ni doutes. Vous avez les deux, ça se voit.`] : mp?.status === 'done' ? GL.place : GL.lose, win ? 'impressed' : 'smug'),
    h('div', { class: 'ol-card' }, pod, verdicts),
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
  S.net?.close(); S.net = null; S.gerard?.destroy(); S.gerard = null; S.gerardKey = null; S.cdSp?.destroy(); S.cdSp = null; bg.set({ suspicion: 0, pressure: 0 }); S.root?.remove(); S.root = null; S.room = null; S.me = null; S.view = null;
  delete window.CAPCHA_ONLINE.game;
  window.dispatchEvent(new CustomEvent('capcha-online-close'));
  window.CAPCHA_ONLINE.onclose?.();
}

function open(opts = {}) {
  if (S.root) return;
  injectCss(); S.opts = opts; S.up = false; S.online = null;
  S.root = h('div', { class: 'ol-root', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Course en ligne' });
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
