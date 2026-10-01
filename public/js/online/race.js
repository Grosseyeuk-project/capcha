// Race view: live game + side rail (FLIP-sorted), ghost/spectator panel.
import { bg } from '../scene.js';
export const COLORS = ['#5b8cff', '#ff6b6b', '#ffd166', '#4ee39b', '#c792ff', '#ff9f43', '#2ee6e6', '#ff7eb6'];
export const col = (p) => COLORS[p.c % COLORS.length];
export const ini = (p) => (p.bot ? '⚙' : (p.nick[0] || '?').toUpperCase());

export function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'style') e.setAttribute('style', v);
    else if (k === 'class') e.className = v;
    else e.setAttribute(k, v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(k));
  return e;
}
const flash = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); setTimeout(() => el.classList.remove(cls), 1000); };

export class RaceView {
  constructor(c) { // {mount, me, net, toast, sfx, leave, emote}
    Object.assign(this, c);
    this.rows = new Map(); this.local = { solved: 0, strikes: 0 }; this.game = null; this.mode = 'play'; this.prevRank = 0; this.feed = []; this.lanes = new Map();
    this.build();
  }
  build() {
    const h_ = h;
    this.rankEl = h_('span', { class: 'pill ol-rank' }, 'Rang ', h_('b', {}, '–'));
    this.lvlEl = h_('span', { class: 'pill' }, 'Niveau ', h_('b', {}, '–'));
    this.pingEl = h_('span', { class: 'ol-live' }, h_('i'), h_('span', {}, '…'));
    this.lastEl = h_('div', { class: 'ol-last', hidden: '' });
    this.gapEl = h_('div', { class: 'ol-gap'}, 'Rang – ');
    this.gameEl = h_('div', { class: 'ol-game' });
    this.stage = h_('div', { class: 'ol-stage' }, this.gameEl);
    this.rowsEl = h_('div', { class: 'ol-rows' });
    this.railEmotes = h_('div', { class: 'ol-emotes' });
    this.rail = h_('aside', { class: 'ol-rail', 'aria-label': 'Classement en direct' }, h_('h3', {}, h_('span', {}, 'Classement en direct'), this.countEl = h_('span', {}, '')), this.rowsEl, this.railEmotes);
    this.mount.replaceChildren(h_('div', { class: 'ol-wrap ol-wide' },
      h_('div', { class: 'ol-rtop' }, h_('span', { class: 'pill ol-racing' }, '● Course'), this.rankEl, this.lvlEl, h_('span', { class: 'sp' }), this.pingEl, h_('button', { class: 'ol-ghostbtn', onclick: () => this.leave() }, 'Quitter')),
      this.lastEl, this.gapEl,
      h_('div', { class: 'ol-race' }, this.stage, this.rail)));
  }
  setEmotes(list) {
    if (this.railEmotes.childElementCount || !list) return;
    list.forEach((t, i) => this.railEmotes.append(h('button', { onclick: () => this.emote(i) }, t)));
  }
  tick() {
    const r = this.room; if (!r) return;
    const now = performance.now(); this.quipAt ||= now + 20000;
    if (this.mode === 'play' && now > this.quipAt) {
      const Q = ['Gérard : ne regardez pas les autres, ils trichent.', 'Gérard : respirez. Les scripts, eux, n’en ont pas besoin.', 'Gérard : je note vos hésitations. Au crayon.', 'Gérard : un humain concentré, c’est beau. Un peu long, mais beau.', 'Gérard : le classement ne ment pas. Moi, si.'];
      this.quipTxt = Q[Math.floor(Math.random() * Q.length)]; this.quipUntil = now + 5200; this.quipAt = now + 26000 + Math.random() * 14000; this.gapEl.classList.add('quip'); this.gapEl.textContent = this.quipTxt;
    }
    if (this.quipUntil && now > this.quipUntil) { this.quipUntil = 0; this.gapEl.classList.remove('quip'); this.paint(); }
    if (r.lastCallAt) {
      const s = Math.max(0, Math.ceil((r.lastCallAt - this.net.now()) / 1000));
      this.lastEl.hidden = false; this.lastEl.textContent = `DERNIER APPEL — le portique ferme dans ${s} s`;
    } else this.lastEl.hidden = true;
  }
  setPing(p, up) { this.pingEl.classList.toggle('off', !up); this.pingEl.lastChild.textContent = up ? (p == null ? '…' : p + ' ms') : 'reconnexion…'; }

  // ---- game
  async startGame(room) {
    const me = room.players.find((p) => p.id === this.me);
    if (this.game || this.started || !me || me.status !== 'racing') return;
    this.started = true;
    const [{ Game }, { CAPTCHAS }] = await Promise.all([import('../game.js'), import('../captchas/index.js')]);
    if (this.dead) return;
    const seed = room.seed, total = room.total;
    const seedFor = (l) => (seed ^ Math.imul(l, 0x9E3779B1)) >>> 0;
    this.local = { solved: me.solved, strikes: me.strikes };
    const game = this.game = new Game({
      root: this.gameEl, seedFor, mode: 'online', startLevel: me.level,
      onEvent: (e) => this.onGame(e, total)
    });
    game.strikes = me.strikes;
    window.CAPCHA_ONLINE.game = game;
    this.setMode('play');
    game.start();
    this.total = Math.min(total, CAPTCHAS.length || total);
  }
  onGame(e, total) {
    if (e.type === 'solve') {
      this.net.send({ t: 'solve', level: e.level, ms: Math.round(e.ms) });
      this.local.solved = e.level; this.paint();
      if (e.level >= total) { this.freeze(); this.ghost('done'); }
    } else if (e.type === 'strike') {
      this.net.send({ t: 'strike', level: this.game.level });
      this.local.strikes = e.strikes; this.paint();
    } else if (e.type === 'over') {
      setTimeout(() => { if (this.mode === 'play') { this.stopGame(); this.ghost('out'); } }, 1700);
    }
  }
  freeze() { if (this.game) { this.game.load = () => {}; } }
  stopGame() { try { this.game?.destroy(); } catch { /* */ } this.game = null; }
  destroy() { this.dead = true; this.stopGame(); }
  setMode(m) { this.mode = m; }

  // ---- ghost panel
  ghost(kind) {
    if (this.mode === kind) return;
    this.mode = kind; this.stopGameSoft(kind);
    const me = this.room?.players.find((p) => p.id === this.me);
    const why = me?.reason === 'dq' ? 'Disqualifié : vitesse surhumaine.' : me?.reason === 'left' ? 'Vous avez quitté la file.' : 'Trois erreurs. Le comité vous a vu.';
    const stamp = kind === 'done' ? h('div', { class: 'ol-stamp ok' }, 'Portique franchi') : h('div', { class: 'ol-stamp' }, 'Éliminé');
    this.lanesEl = h('div', { class: 'ol-lanes' }); this.lanes.clear();
    this.feedEl = h('div', { class: 'ol-feed' });
    this.stage.replaceChildren(h('div', { class: 'ol-ghost' }, stamp,
      h('p', { class: 'ol-hint', style: 'margin:0' }, kind === 'done' ? 'Vous avez terminé. Mode fantôme : regardez les autres suer, en direct.' : why + ' Mode fantôme activé : vous regardez la course en direct.'),
      this.lanesEl, this.feedEl));
    this.feed.slice(0, 7).forEach((f) => this.feedEl.append(f.cloneNode(true)));
    if (this.room) this.paintLanes();
  }
  stopGameSoft(kind) { if (kind === 'done') { this.freeze(); try { this.game?.destroy(); } catch { /* */ } this.game = null; } else this.stopGame(); }
  paintLanes() {
    if (!this.lanesEl) return;
    const { players, total } = this.room;
    for (const p of players) {
      let l = this.lanes.get(p.id);
      if (!l) {
        const dot = h('i', { style: `--c:${col(p)}` }, ini(p)); const t = h('div', { class: 't' });
        if (total <= 30) for (let k = 1; k < total; k++) t.append(h('s', { style: `left:${k / total * 100}%` }));
        t.append(dot);
        l = { el: h('div', { class: 'ol-lane' }, h('span', { class: 'n' }, p.nick), t), dot }; this.lanes.set(p.id, l); this.lanesEl.append(l.el);
      }
      l.el.classList.toggle('out', p.status === 'out');
      const pos = p.status === 'done' ? 1 : p.solved / total;
      l.dot.style.left = (3 + pos * 94) + '%';
    }
  }
  logFeed(evt) {
    if (!evt?.text || !['strike', 'out', 'finish', 'lastcall', 'emote', 'solve'].includes(evt.k)) return;
    const cls = evt.k === 'finish' || evt.k === 'solve' ? 'good' : evt.k === 'emote' ? '' : 'bad';
    const p = h('p', { class: cls }, evt.text);
    this.feed.unshift(p); this.feed.length = Math.min(this.feed.length, 12);
    if (this.feedEl) { this.feedEl.prepend(p.cloneNode(true)); while (this.feedEl.childElementCount > 7) this.feedEl.lastChild.remove(); }
  }

  // ---- rail
  update(room, evt) {
    const first = !this.room; this.room = room; this.setEmotes(room.emotes);
    const me = room.players.find((p) => p.id === this.me);
    this.localReconcile(me);
    this.syncRows(room, evt);
    this.paint();
    if (evt) this.logFeed(evt);
    if (me && me.status === 'out' && this.mode === 'play') { this.ghost('out'); }
    if (me && me.status === 'done' && this.mode === 'play') this.ghost('done');
    this.paintLanes(); this.tick();
    if (first && !this.game && me?.status === 'racing') this.startGame(room);
  }
  localReconcile(me) { if (!me) return; this.local.solved = Math.max(this.local.solved, me.solved); this.local.strikes = Math.max(this.local.strikes, me.strikes); if (me.solved < this.local.solved - 1) this.local.solved = me.solved; }
  eff(p) { return p.id === this.me && p.status === 'racing' ? { solved: Math.max(p.solved, this.local.solved), strikes: Math.max(p.strikes, this.local.strikes) } : { solved: p.solved, strikes: p.strikes }; }
  syncRows(room, evt) {
    const { players, total } = room;
    const before = new Map([...this.rows].map(([id, r]) => [id, r.el.getBoundingClientRect().top]));
    const sorted = [...players].sort((a, b) => a.rank - b.rank);
    for (const p of sorted) {
      let r = this.rows.get(p.id);
      if (!r) {
        r = { el: h('div', { class: 'ol-prow' + (p.id === this.me ? ' me' : ''), style: `--c:${col(p)}` }), };
        r.rk = h('span', { class: 'rk' }); r.nm = h('span', { class: 'nm' }, p.nick + (p.id === this.me ? ' (vous)' : '')); r.lv = h('span', { class: 'lv' });
        r.bar = h('span', { class: 'bar' }, r.fill = h('i')); r.st = h('span', { class: 'st' }, h('u'), h('u'), h('u')); r.tt = h('span', { class: 'tt' });
        r.el.append(r.rk, h('span', { class: 'av' }, ini(p)), r.nm, r.lv, r.bar, r.st, r.tt);
        this.rows.set(p.id, r);
      }
      const e = this.eff(p);
      r.rk.textContent = p.rank; r.lv.textContent = p.status === 'done' ? '✓ fini' : `${Math.min(total, e.solved + (p.status === 'racing' ? 1 : 0))}/${total}`;
      r.fill.style.width = (p.status === 'done' ? 100 : e.solved / total * 100) + '%';
      [...r.st.children].forEach((u, i) => u.classList.toggle('x', i < e.strikes));
      r.el.classList.toggle('hide-m', p.rank > 3 && p.id !== this.me);
      r.el.classList.toggle('out', p.status === 'out'); r.el.classList.toggle('done', p.status === 'done'); r.el.classList.toggle('off', !p.connected && !p.bot && p.status !== 'out');
      this.rowsEl.append(r.el);
    }
    this.countEl.textContent = players.filter((p) => p.status === 'racing').length + ' en course';
    // FLIP
    for (const [id, r] of this.rows) {
      const b = before.get(id); if (b == null) continue;
      const d = b - r.el.getBoundingClientRect().top;
      if (Math.abs(d) > 1) { r.el.style.transition = 'none'; r.el.style.transform = `translateY(${d}px)`; requestAnimationFrame(() => requestAnimationFrame(() => { r.el.style.transition = 'transform .5s cubic-bezier(.2,.9,.3,1)'; r.el.style.transform = ''; })); }
    }
    if (evt?.id && this.rows.has(evt.id)) {
      const r = this.rows.get(evt.id);
      if (evt.k === 'solve' || evt.k === 'finish') flash(r.el, 'fgood');
      if (evt.k === 'strike' || evt.k === 'out') {
        flash(r.el, 'fbad');
        if (evt.id !== this.me && evt.text) { r.tt.textContent = evt.text; r.el.classList.add('has-tt'); clearTimeout(r.ttT); r.ttT = setTimeout(() => r.el.classList.remove('has-tt'), 6000); }
      }
    }
  }
  overtake(dir, text) {
    this.ovt?.remove();
    const b = h('div', { class: 'ol-ovt ' + dir, role: 'status' }, h('i', {}, dir === 'up' ? '▲' : '▼'), h('span', {}, text));
    this.ovt = b; this.mount.append(b); setTimeout(() => b.remove(), 2200);
    this.sfx(dir === 'up' ? 'good' : 'bad'); bg.pulse(dir === 'up' ? 'good' : 'bad');
    const race = this.mount.querySelector('.ol-race');
    if (dir === 'down' && race) { race.classList.remove('shake'); void race.offsetWidth; race.classList.add('shake'); }
  }
  paint() {
    const room = this.room; if (!room) return;
    const me = room.players.find((p) => p.id === this.me); if (!me) return;
    const e = this.eff(me);
    this.lvlEl.lastChild.textContent = me.status === 'done' ? 'Terminé' : me.status === 'out' ? 'Éliminé' : `${Math.min(room.total, e.solved + 1)}/${room.total}`;
    const prev = this.prevRank;
    this.rankEl.lastChild.textContent = `#${me.rank}/${room.players.length}`;
    if (prev && me.rank !== prev) {
      this.rankEl.classList.remove('up', 'down', 'pop'); void this.rankEl.offsetWidth;
      this.rankEl.classList.add(me.rank < prev ? 'up' : 'down', 'pop');
      const sorted = [...room.players].sort((a, b) => a.rank - b.rank);
      if (me.status === 'racing' && performance.now() - (this.lastOvt || 0) > 1200) {
        this.lastOvt = performance.now();
        if (me.rank < prev) { const o = sorted[me.rank]; if (o) this.overtake('up', `Vous doublez ${o.nick}`); }
        else { const o = sorted[me.rank - 2]; if (o) this.overtake('down', `${o.nick} vous double`); }
      }
    }
    { const sorted = [...room.players].sort((a, b) => a.rank - b.rank), lead = sorted[0], sc = (p) => this.eff(p).solved;
      const d = me.rank === 1 ? sc(me) - (sorted[1] ? sc(sorted[1]) : 0) : sc(lead) - sc(me);
      const pl = (n) => `${n} niveau${n > 1 ? 'x' : ''}`;
      if (!this.quipUntil) { const pick = [...new Set([...sorted.slice(0, 3), me])].sort((x, y) => x.rank - y.rank);
        this.gapEl.replaceChildren(h('b', {}, `#${me.rank}/${room.players.length}`), ...pick.map((p) => { const pct = p.status === 'done' ? 100 : Math.min(100, this.eff(p).solved / room.total * 100); return h('span', { class: 'ol-chip2' + (p.id === me.id ? ' me' : '') + (p.status === 'out' ? ' out' : ''), style: `--c:${col(p)}`, title: p.nick }, h('i', {}, ini(p)), h('s', {}, h('u', { style: `width:${pct}%` }))); }),
          h('span', { class: 'sr-only' }, me.status !== 'racing' ? 'Course terminée pour vous' : me.rank === 1 ? `Vous menez de ${d > 0 ? pl(d) : '0 niveau'}` : `À ${d > 0 ? pl(d) : 'un souffle'} de ${lead.nick}`)); } }
    this.prevRank = me.rank;
  }
}
