// WebSocket link: auto-reconnect, latency + server clock offset.
const TK = 'ol-token';
const store = {
  get: (k) => { try { return sessionStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { v == null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v); } catch { /* */ } }
};
export class Net {
  constructor(getNick) {
    this.getNick = getNick; this.h = new Map(); this.ws = null; this.up = false; this.closed = false;
    this.ping = null; this.offset = 0; this.tries = 0; this.token = store.get(TK);
  }
  on(t, fn) { (this.h.get(t) || this.h.set(t, []).get(t)).push(fn); return this; }
  emit(t, m) { for (const f of this.h.get(t) || []) { try { f(m); } catch (e) { console.error(e); } } }
  now() { return Date.now() + this.offset; }
  setToken(t) { this.token = t; store.set(TK, t); }
  connect() {
    this.closed = false;
    if (this.ws && this.ws.readyState <= 1) return;
    const ws = this.ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws');
    ws.onopen = () => {
      this.tries = 0;
      ws.send(JSON.stringify({ t: 'hello', nick: this.getNick(), token: this.token || undefined }));
      this.pinger(); clearInterval(this.pi); this.pi = setInterval(() => this.pinger(), 2500);
    };
    ws.onmessage = (e) => {
      let m; try { m = JSON.parse(e.data); } catch { return; }
      if (m.t === 'pong') { this.ping = Math.round(performance.now() - m.c); this.offset = m.now + this.ping / 2 - Date.now(); this.emit('ping', this.ping); }
      if (m.t === 'welcome') { this.up = true; this.emit('status', true); }
      if (m.t === 'joined') this.setToken(m.token);
      this.emit(m.t, m);
    };
    ws.onclose = () => {
      clearInterval(this.pi);
      if (this.up) { this.up = false; this.emit('status', false); }
      if (this.closed) return;
      const d = Math.min(5000, 400 * 2 ** this.tries++);
      this.rt = setTimeout(() => this.connect(), d);
    };
    ws.onerror = () => {};
  }
  pinger() { this.send({ t: 'ping', c: performance.now() }); }
  send(o) { if (this.ws?.readyState === 1) this.ws.send(JSON.stringify(o)); }
  close() { this.closed = true; clearTimeout(this.rt); clearInterval(this.pi); try { this.ws?.close(); } catch { /* */ } this.up = false; }
}
export const clearToken = () => store.set(TK, null);
