import { css, shake } from './b_kit.js';
css('boss', `
.bb-top{display:flex;gap:12px;align-items:center}
.bb-face{flex:none;width:62px;height:62px;border:2px solid var(--ink);background:var(--yellow);position:relative;box-shadow:3px 3px 0 var(--ink);transition:background .3s;animation:bb-bob 2.4s ease-in-out infinite}
@keyframes bb-bob{50%{transform:translateY(-3px)}}
.bb-face[data-m="1"]{background:#ffb347}.bb-face[data-m="2"]{background:#ff6a4d;animation-duration:.6s}.bb-face[data-m="x"]{background:#ddd;animation:none}
.bb-eye{position:absolute;top:17px;width:16px;height:16px;background:#fff;border:2px solid var(--ink);border-radius:50%;overflow:hidden;animation:bb-blink 4.5s infinite}
.bb-eye.l{left:9px}.bb-eye.r{right:9px}
.bb-eye i{position:absolute;left:3px;top:3px;width:6px;height:6px;background:var(--ink);border-radius:50%;transform:translate(var(--px,0),var(--py,0))}
@keyframes bb-blink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}
.bb-brow{position:absolute;top:10px;width:20px;height:4px;background:var(--ink);opacity:0;transition:opacity .2s,transform .2s}
.bb-brow.l{left:6px}.bb-brow.r{right:6px}
.bb-face[data-m="1"] .bb-brow.l,.bb-face[data-m="2"] .bb-brow.l{opacity:1;transform:rotate(18deg)}.bb-face[data-m="1"] .bb-brow.r,.bb-face[data-m="2"] .bb-brow.r{opacity:1;transform:rotate(-18deg)}
.bb-mouth{position:absolute;left:15px;bottom:9px;width:28px;height:10px;border-bottom:3px solid var(--ink);transition:all .2s}
.bb-face[data-m="1"] .bb-mouth{height:2px;border-bottom-width:3px}
.bb-face[data-m="2"] .bb-mouth{border-bottom:0;border-top:3px solid var(--ink);border-radius:14px 14px 0 0;height:8px;bottom:8px}
.bb-face[data-m="x"] .bb-eye i{display:none}.bb-face[data-m="x"] .bb-eye::after{content:'✕';position:absolute;inset:0;display:grid;place-items:center;font:800 12px var(--mono)}
.bb-face[data-m="x"] .bb-mouth{border:0;height:0}
.bb-warn{position:absolute;right:8px;top:6px;z-index:8;font:800 11px var(--mono);letter-spacing:.08em;text-transform:uppercase;background:var(--red);color:#fff;padding:2px 8px;animation:bb-warn .25s infinite alternate}
@keyframes bb-warn{to{background:#ff8a96}}
.bb-pop{position:absolute;left:10%;right:10%;top:22%;z-index:7;background:#fff;color:var(--ink);border:2px solid var(--ink);box-shadow:5px 5px 0 var(--red);padding:12px;font:600 13px/1.3 var(--body);animation:bk-flip .4s;display:flex;flex-direction:column;gap:8px}
.bb-pop b{font:800 14px var(--display)}.bb-pop .x{position:absolute;right:3px;top:0;border:0;background:none;font:700 11px var(--mono);cursor:pointer;color:#888;padding:2px 4px}
.bb-pop .a{align-self:stretch;border:2px solid var(--ink);background:var(--green);font:800 13px var(--display);padding:7px;cursor:pointer;text-transform:uppercase}
.bb-pop .a:hover{background:#7fe9d4}
.bb-sync{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;gap:18px;padding:0 18px}
.bb-track{position:relative;height:50px;border:2px solid #fff;background:#10202a}
.bb-zone{position:absolute;top:0;bottom:0;background:rgba(45,226,192,.55);border-left:2px solid #2de2c0;border-right:2px solid #2de2c0}
.bb-zone.hit{background:#fff}
.bb-beam{position:absolute;top:-6px;bottom:-6px;width:6px;margin-left:-3px;background:var(--yellow);box-shadow:0 0 12px var(--yellow)}
.bb-tun{position:absolute;left:37%;width:26%;top:0;bottom:0;background:repeating-linear-gradient(45deg,#000 0 6px,#222 6px 12px);z-index:3;display:grid;place-items:center;font:700 10px var(--mono);color:#777;letter-spacing:.1em}
.bb-stop{align-self:center;min-width:180px;min-height:54px;font-size:20px;background:var(--red);border-color:#fff;color:#fff;box-shadow:3px 3px 0 #fff}
.bb-ch{position:absolute;left:8px;right:8px;top:22px;display:flex;gap:6px;flex-wrap:wrap}
.bb-ch span{font:700 10px var(--mono);border:1px solid #567;color:#9ab;padding:1px 6px;letter-spacing:.04em;text-transform:uppercase}.bb-ch span.done{background:#2de2c0;color:var(--ink);border-color:#2de2c0;text-decoration:line-through}
.bb-fin{position:absolute;left:0;right:0;top:26px;bottom:0;padding:6px 14px 10px;display:flex;flex-direction:column;gap:8px;justify-content:center}
.bb-area{position:relative;flex:1;min-height:100px}
.bb-cb{position:absolute;left:0;top:0;appearance:none;border:2px solid #fff;background:#fff;color:var(--ink);font:700 16px var(--body);padding:10px 14px;min-height:46px;cursor:pointer;display:flex;gap:8px;align-items:center;transition:left .25s,top .25s}
.bb-cb b{font-size:24px;line-height:1}.bb-cb.hop{animation:bk-flip .35s}.bb-cb.ok{background:var(--green)}
.bb-rl{display:flex;flex-wrap:wrap;gap:4px}.bb-rl span{font:600 11px var(--mono);padding:2px 6px;background:#3a1f26;color:#ffb3bb;border:1px solid #7a3a44}.bb-rl span.ok{background:#12372f;color:#7fe9d4;border-color:#2de2c0}
.bb-row{display:flex;gap:8px}.bb-row input{flex:1;min-width:0}
.bb-chips{display:flex;gap:6px}.bb-chips button{border:2px solid #fff;background:#10202a;color:#fff;font:700 14px var(--mono);min-width:40px;height:34px;padding:0 8px;cursor:pointer}
.bb-fin input{font:700 17px var(--mono);padding:9px 10px;border:2px solid #fff;background:#10202a;color:#fff;outline:none;border-radius:0}.bb-fin input:focus{border-color:var(--yellow)}.bb-fin input.chomp{animation:bk-flip .4s}
.bb-fin .bb-phrase{font-size:20px}
.bb-orb.dim{opacity:.28;pointer-events:none}.bb-orb.ghost{opacity:.85;filter:hue-rotate(160deg) drop-shadow(0 0 8px #7fe9d4);z-index:6}
.bb-stage.inv{outline:3px dashed var(--red);outline-offset:-3px}
.bb-dec{background:rgba(255,59,78,.5)!important;border-color:#ff3b4e!important}.bb-dec::after{content:'✕';position:absolute;inset:0;display:grid;place-items:center;color:#fff;font:800 14px var(--mono)}
.bb-stage.freeze *,.bb-face.freeze{animation-play-state:paused!important}
.bb-flash{position:absolute;inset:-6px;background:#fff;z-index:30;pointer-events:none;animation:bb-fl .5s forwards}@keyframes bb-fl{0%{opacity:1}100%{opacity:0}}
.bb-face.big{transition:transform 1s cubic-bezier(.1,.8,.2,1),opacity 1s;transform:scale(5) rotate(14deg)!important;opacity:0;z-index:20}
.bb-shard{position:absolute;width:12px;height:12px;z-index:25;pointer-events:none;animation:bb-fly 2.2s cubic-bezier(.1,.7,.3,1) forwards}
.bb-part.slow{animation-duration:2.4s}
.bb-ret{position:absolute;left:0;top:0;width:28px;height:28px;border:3px solid var(--red);border-radius:50%;z-index:6;pointer-events:none;opacity:0;box-shadow:0 0 12px var(--red)}
.bb-ret::before,.bb-ret::after{content:'';position:absolute;background:var(--red)}.bb-ret::before{left:11px;top:-8px;width:3px;height:36px}.bb-ret::after{top:11px;left:-8px;height:3px;width:36px}
.bb-stage.inv .bb-ret{opacity:1}.bb-stage.inv{cursor:none;outline:3px dashed var(--red);outline-offset:-3px}.bb-stage.inv .bb-orb{cursor:none}
.bb-ret.pk{animation:bb-pk .25s}@keyframes bb-pk{50%{transform-origin:center;filter:brightness(2)}}
.bb-part{position:absolute;pointer-events:none;z-index:9;font-size:20px;animation:bb-fly 1.1s cubic-bezier(.2,.7,.4,1) forwards}
@keyframes bb-fly{from{transform:translate(0,0) scale(.4) rotate(0)}to{transform:translate(var(--dx),var(--dy)) scale(1.2) rotate(var(--rot));opacity:0}}
.bb-end b{display:block;font:800 26px var(--display)}
.bb-sq{animation:bb-sq .7s}@keyframes bb-sq{10%{transform:translate(-8px,5px)}30%{transform:translate(9px,-6px)}50%{transform:translate(-6px,-3px)}70%{transform:translate(5px,5px)}}

.bb-face.hurt{animation:bb-hurt .5s}
@keyframes bb-hurt{20%{transform:translateX(-8px) rotate(-6deg);background:var(--red)}50%{transform:translateX(8px) rotate(6deg)}}
.bb-hp{flex:1;min-width:0}
.bb-hp b{display:flex;justify-content:space-between;font:800 12px var(--mono);letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px;gap:8px}
.bb-bar{height:20px;border:2px solid var(--ink);background:#fff;position:relative;overflow:hidden}
.bb-bar i{position:absolute;inset:0;background:repeating-linear-gradient(135deg,var(--red) 0 10px,#ff6677 10px 20px);transform-origin:0 0;transition:transform .6s cubic-bezier(.3,1.4,.5,1)}
.bb-stage{border:2px solid var(--ink);background:#0d1b24;color:#fff;height:250px;position:relative;overflow:hidden;box-shadow:4px 4px 0 var(--ink)}
.bb-orb{position:absolute;left:0;top:0;width:54px;height:54px;padding:0;border:0;background:none;font-size:42px;line-height:54px;text-align:center;cursor:crosshair;will-change:transform;font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif;touch-action:manipulation}
.bb-orb s{display:block;text-decoration:none}.bb-orb.boom s{animation:bb-boom .35s forwards}
.bb-orb:focus-visible{outline:3px solid #7fe9d4;border-radius:50%}
@keyframes bb-boom{60%{transform:scale(1.8)}100%{transform:scale(0);opacity:0}}
.bb-pads{position:absolute;inset:12px;display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.bb-pad{appearance:none;border:2px solid #fff;background:var(--c);color:var(--ink);font:800 26px var(--display);cursor:pointer;filter:saturate(.5) brightness(.7);transition:filter .08s,transform .08s;position:relative;padding:0}
.bb-pad kbd{position:absolute;right:4px;top:2px;font:600 10px var(--mono);opacity:.7}
.bb-pad:hover:not(:disabled){filter:saturate(.8) brightness(.9)}.bb-pad.lit{filter:saturate(1.5) brightness(1.3);transform:scale(.94);box-shadow:0 0 18px #fff}
.bb-pad:disabled{cursor:default}
.bb-type{position:absolute;inset:0;padding:24px 14px 12px;display:flex;flex-direction:column;gap:10px;justify-content:center}
.bb-phrase{font:800 24px/1.15 var(--mono);letter-spacing:.04em;text-align:center;color:var(--yellow);word-break:break-word}
.bb-echo{font:700 20px var(--mono);text-align:center;min-height:28px;letter-spacing:.05em;word-break:break-all}
.bb-echo .g{color:#2de2c0}.bb-echo .r{color:#ff3b4e;text-decoration:underline}.bb-echo .p{opacity:.35}
.bb-type input{font:700 17px var(--mono);padding:9px 10px;border:2px solid #fff;background:#10202a;color:#fff;width:100%;outline:none;border-radius:0}
.bb-type input:focus{border-color:var(--yellow)}
.bb-s{position:absolute;left:8px;top:6px;font:600 10px var(--mono);color:#7fe9d4;letter-spacing:.08em;text-transform:uppercase;z-index:3}
.bb-end{position:absolute;inset:0;display:grid;place-items:center;text-align:center;background:rgba(255,210,63,.93);color:var(--ink);font:800 20px/1.2 var(--display);padding:16px;animation:bk-flip .6s;z-index:9}
`);
let CK = { phase: 0, t: 0 };
const PADS = [{ s: '▲', c: '#ff6b6b' }, { s: '●', c: '#ffd23f' }, { s: '■', c: '#43d9a3' }, { s: '◆', c: '#5aa0ff' }];
const PHRASES = ['je suis humain', 'moi pas un robot', 'bonjour la terre', 'ceci est un test'];
export default {
  id: 'b_boss', tier: 5, title: 'CAPCHA-ZILLA — le boss final', time: 20000,
  mount(host, api) {
    const { h } = api; let alive = true, phase = 0, busy = false; const tm = []; let raf = 0, cleanup = null;
    const T = (fn, ms) => tm.push(setTimeout(() => alive && fn(), ms));
    const face = h('div', { class: 'bb-face', 'aria-hidden': 'true', 'data-m': '0' }, h('i', { class: 'bb-brow l' }), h('i', { class: 'bb-brow r' }), h('div', { class: 'bb-eye l' }, h('i', {})), h('div', { class: 'bb-eye r' }, h('i', {})), h('div', { class: 'bb-mouth' })), hpFill = h('i', {}), hpTxt = h('span', {}, '100 %');
    const rule = h('div', { class: 'bk-rule', role: 'status', 'aria-live': 'polite' });
    const stage = h('div', { class: 'bb-stage' });
    const top = h('div', { class: 'bb-top' }, face, h('div', { class: 'bb-hp' }, h('b', {}, h('span', {}, 'CAPCHA-ZILLA, gardien du dernier test'), hpTxt), h('div', { class: 'bb-bar', role: 'progressbar', 'aria-label': 'Points de vie du boss' }, hpFill)));
    const root = h('div', { class: 'bk' }, top, rule, stage); host.append(root);
    const look = (e) => { const r = face.getBoundingClientRect(), dx = e.clientX - (r.left + 31), dy = e.clientY - (r.top + 31), d = Math.hypot(dx, dy) || 1, k = Math.min(3, d / 40); face.querySelectorAll('.bb-eye i').forEach((i) => { i.style.setProperty('--px', (dx / d * k).toFixed(1) + 'px'); i.style.setProperty('--py', (dy / d * k).toFixed(1) + 'px'); }); };
    window.addEventListener('pointermove', look);
    const warn = (t) => { const w = h('div', { class: 'bb-warn' }, t); root.append(w); w.style.cssText = 'top:' + (stage.offsetTop + 6) + 'px'; return w; };
    const setRule = (small, ...k) => { rule.className = 'bk-rule flip'; rule.replaceChildren(h('div', {}, h('small', {}, small), ...k)); };
    const hp = (v) => { hpFill.style.transform = `scaleX(${v / 100})`; hpTxt.textContent = v + ' %'; face.classList.remove('hurt'); void face.offsetWidth; face.classList.add('hurt'); };
    const clear = () => { stage.querySelectorAll('.bb-pop').forEach((x) => x.remove()); if (cleanup) cleanup(); cleanup = null; cancelAnimationFrame(raf); stage.replaceChildren(); };
    // ---- phase 1: l'œil (et son reflet quand le boss inverse le monde) ----
    function p1() {
      phase = 1; clear(); busy = false; let hits = 0, inv = false, ghosts = []; const NH = 4; const W = () => stage.clientWidth, H = () => stage.clientHeight;
      setRule('Phase 1/3 · 18 s par coup', 'Cliquez l’œil 👁️ ×' + NH + ', pas les 🧿. Monde ', h('b', {}, 'inversé'), ' : visez le ', h('b', {}, 'reflet'), '.');
      const lab = h('div', { class: 'bb-s' }, `Œil : 0/${NH}`); stage.append(lab);
      const mkOrb = (e, real) => { const el = h('button', { class: 'bb-orb', type: 'button', 'aria-label': real ? 'œil du boss' : 'leurre', onpointerdown: (ev) => { ev.preventDefault(); ev.stopPropagation(); if (!inv) hit(real, el); }, onkeydown: (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); hit(real, el); } } }, h('s', {}, e)); if (real) el.style.zIndex = 4; stage.append(el); const a = api.rng() * 6.28; return { el, real, e, x: 20 + api.rng() * 200, y: 20 + api.rng() * 100, vx: Math.cos(a), vy: Math.sin(a) * 0.7 }; };
      let orbs = []; const coarse = matchMedia('(pointer:coarse)').matches; const sp = (k) => (api.reducedMotion || coarse ? 0.62 : 1) * (170 + k * 100);
      const spawn = () => { orbs.forEach((o) => o.el.remove()); orbs = [mkOrb('👁️', true)]; for (let k = 0; k < Math.min(3, hits + 1); k++) orbs.push(mkOrb('🧿', false)); api.timer(18000); if (/cheat=1/.test(location.search)) host.dataset.answer = 'click .bb-orb[aria-label="œil du boss"]'; };
      const endInv = () => { inv = false; stage.classList.remove('inv'); ghosts.forEach((g) => g.el.remove()); ghosts = []; orbs.forEach((o) => o.el.classList.remove('dim')); };
      const startInv = () => { inv = true; stage.classList.add('inv'); orbs.forEach((o) => { o.el.classList.add('dim'); const g = h('button', { class: 'bb-orb ghost', type: 'button', 'aria-label': o.real ? 'reflet de l’œil' : 'reflet de leurre', onpointerdown: (ev) => { ev.preventDefault(); ev.stopPropagation(); hit(o.real, o.el); } }, h('s', {}, o.e)); stage.append(g); ghosts.push({ el: g, o }); }); api.say('Monde inversé ! Les reflets bougent à l’opposé : visez le reflet de l’œil, il compte comme l’œil.', 'smug'); };
      function hit(real, el) {
        if (busy) return;
        if (!real) { shake(root); api.sfx('bad'); hits = Math.max(0, hits - 1); lab.textContent = `Œil : ${hits}/${NH}`; hp(100 - Math.round(hits * 60 / NH)); api.say('C’était un leurre 🧿. Le boss a l’œil, vous avez eu l’œil de verre. Un point perdu, pas une vie.', 'smug'); endInv(); busy = true; T(() => { busy = false; spawn(); }, 350); return; }
        busy = true; hits++; api.sfx('pop'); el.classList.add('boom'); endInv(); lab.textContent = `Œil : ${hits}/${NH}`; hp(100 - Math.round(hits * 60 / NH));
        if (hits >= NH) { T(p2, 450); return; }
        api.say(hits === 1 ? 'Aïe. Bon. L’œil se réfugie parmi des leurres.' : hits === 2 ? 'Ça fait mal. Pas à moi, à l’orgueil du CAPCHA.' : 'Dernier coup. Il accélère. Il pleure presque.', 'worried'); T(() => { busy = false; spawn(); if (hits >= 1) T(mirror, 2500); }, 400);
      }
      spawn(); let last = performance.now();
      const mirror = () => { if (busy || inv) return; const w = warn('⚠ Monde inversé dans 1 s'); api.sfx('bad'); T(() => { w.remove(); if (!busy && !inv) startInv(); }, 1000); };
      T(mirror, 3000);
      cleanup = () => { endInv(); root.querySelectorAll('.bb-warn').forEach((x) => x.remove()); };
      const loop = (t) => { raf = requestAnimationFrame(loop); const dt = Math.min(0.1, (t - last) / 1000); last = t; const w = W(), hh = H();
        orbs.forEach((o) => { const s = sp(hits); o.x += o.vx * s * dt; o.y += o.vy * s * dt; if (o.x < 0) { o.x = 0; o.vx = Math.abs(o.vx); } if (o.x > w - 54) { o.x = w - 54; o.vx = -Math.abs(o.vx); } if (o.y < 0) { o.y = 0; o.vy = Math.abs(o.vy); } if (o.y > hh - 54) { o.y = hh - 54; o.vy = -Math.abs(o.vy); } o.el.style.transform = `translate(${o.x}px,${o.y}px)`; });
        ghosts.forEach((g) => { g.el.style.transform = `translate(${w - 54 - g.o.x}px,${g.o.y}px)`; }); };
      raf = requestAnimationFrame(loop);
    }
    // ---- phase 2: synchronisation (valeurs calibrées : tools/balance.mjs) ----
    function p2() {
      phase = 2; clear(); api.timer(60000); busy = false; face.dataset.m = '1'; let hits = 0, floorH = 0, ph = 0, last = performance.now(), zc = 0.5, dc = -1; const NH = 5, ZW = [0.16, 0.14, 0.12, 0.10, 0.09], V = [0.70, 0.72, 0.75, 0.78, 0.80]; CK.phase = 2;
      setRule('Phase 2/3 · 60 s', h('b', {}, 'STOP'), ' (bouton, Espace, toucher) dans la ', h('b', {}, 'zone verte'), ' ×' + NH + '. Rouge = piège. Erreur : −1 progrès.');
      const lab = h('div', { class: 'bb-s' }, `Synchro : 0/${NH}`);
      const zone = h('div', { class: 'bb-zone' }), dz = h('div', { class: 'bb-zone bb-dec' }), beam = h('div', { class: 'bb-beam' }), tun = h('div', { class: 'bb-tun' }, '▒ tunnel ▒');
      const track = h('div', { class: 'bb-track' }, zone, dz, tun, beam);
      const stop = h('button', { class: 'bk-btn bb-stop', type: 'button', onpointerdown: (e) => { e.preventDefault(); press(); } }, 'STOP');
      stage.append(lab, h('div', { class: 'bb-sync' }, track, stop));
      const wNow = () => ZW[Math.min(hits, NH - 1)], vNow = () => V[Math.min(hits, NH - 1)] * (api.reducedMotion || matchMedia('(pointer:coarse)').matches ? 0.9 : 1);
      const place = () => { const w = wNow(); zc = w / 2 + 0.04 + api.rng() * (0.92 - w); zone.style.left = ((zc - w / 2) * 100) + '%'; zone.style.width = (w * 100) + '%';
        if (hits >= 1) { let tries = 0; do { dc = w / 2 + 0.04 + api.rng() * (0.92 - w); } while (Math.abs(dc - zc) < w + 0.06 && tries++ < 30); dz.style.display = ''; dz.style.left = ((dc - w / 2) * 100) + '%'; dz.style.width = (w * 100) + '%'; } else { dz.style.display = 'none'; dc = -1; }
        tun.style.display = hits >= 3 ? '' : 'none'; };
      place();
      let pos = 0; const tri = (x) => { x %= 2; return x < 1 ? x : 2 - x; };
      const upd = () => { beam.style.left = (pos * 100) + '%'; const inTun = hits >= 3 && pos > 0.37 && pos < 0.63; beam.style.opacity = inTun ? 0 : 1; if (/cheat=1/.test(location.search)) host.dataset.answer = JSON.stringify({ pos, zc, w: wNow() }); };
      const curPos = () => tri(ph + vNow() * Math.max(0, performance.now() - last) / 1000);
      if (/cheat=1/.test(location.search)) host.__p2 = () => { const x = (ph + vNow() * Math.max(0, performance.now() - last) / 1000) % 2; return { pos: curPos(), dir: x < 1 ? 1 : -1, zc, w: wNow(), v: vNow(), hits }; };
      function press() {
        if (busy) return; pos = curPos(); const w = wNow(), d = pos - zc;
        if (Math.abs(d) <= w / 2) { hits++; if (hits >= 3) floorH = 2; api.sfx('pop'); lab.textContent = `Synchro : ${hits}/${NH}`; hp(40 - hits * 5); zone.classList.add('hit'); setTimeout(() => zone.classList.remove('hit'), 300); if (hits >= NH) { busy = true; hp(15); T(p3, 600); return; } api.say(hits === 3 ? 'Un tunnel ! Le curseur y passe, même si vous ne le voyez pas. Comptez.' : 'Synchro validée. Il serre les dents.', 'worried'); place(); }
        else { shake(root); api.sfx('bad'); const inDec = dc >= 0 && Math.abs(pos - dc) <= w / 2; const m = inDec ? 'Zone rouge ! C’était un piège, et vous avez marché dedans.' : Math.abs(d) < w ? 'Il s’en est fallu d’un cheveu.' : d < 0 ? 'Trop tôt : le curseur était à gauche de la zone.' : 'Trop tard : le curseur avait déjà dépassé la zone.'; hits = Math.max(floorH, hits - 1); lab.textContent = `Synchro : ${hits}/${NH}`; place(); api.say(m + ' Un point de progrès en moins, pas une vie.', 'smug'); }
      }
      const key = (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); press(); } };
      window.addEventListener('keydown', key);
      const loop = (t) => { raf = requestAnimationFrame(loop); const dt = Math.min(1, (t - last) / 1000); last = t; ph += dt * vNow(); pos = tri(ph); upd(); };
      raf = requestAnimationFrame(loop); cleanup = () => window.removeEventListener('keydown', key);
    }
    // ---- phase 3 : le procès (3 chefs d'accusation) ----
    function p3() {
      phase = 3; clear(); busy = false; face.dataset.m = '2'; CK.phase = 3; let step = 0;
      const lab = h('div', { class: 'bb-s' }, 'Chef d’accusation 1/3'); const body = h('div', { class: 'bb-fin' });
      stage.append(lab, body);
      const nofix = { autocomplete: 'off', autocapitalize: 'none', autocorrect: 'off', spellcheck: 'false' };
      const win = () => {
        busy = true; CK.phase = 0; api.timer(600000); setRule('Verdict', h('b', {}, 'Charges abandonnées : 3/3')); hp(0); api.sfx('stamp'); body.replaceChildren(); stage.replaceChildren(h('div', { class: 'bb-s' }, 'Verdict…'));
        // hit-stop + éclair
        const fl = h('div', { class: 'bb-flash' }); root.append(fl); stage.classList.add('freeze'); face.classList.add('freeze');
        T(() => {
          stage.classList.remove('freeze'); face.classList.remove('freeze'); api.sfx('confetti'); api.sfx('alarm'); fl.remove();
          face.dataset.m = 'x'; face.classList.add('big'); if (!api.reducedMotion) { root.classList.add('bk-shake'); stage.classList.add('bb-sq'); }
          const fr = face.getBoundingClientRect(), rr = root.getBoundingClientRect(); const cx = fr.left - rr.left + 31, cy = fr.top - rr.top + 31;
          for (let k = 0; k < 26; k++) { const an = (k / 26) * 6.283 + Math.random() * .3, d = 90 + Math.random() * 190; const sh = h('i', { class: 'bb-shard', style: { left: cx + 'px', top: cy + 'px', background: ['#ffd23f', '#ff3b4e', '#2de2c0', '#fff'][k % 4] } }); sh.style.setProperty('--dx', Math.cos(an) * d + 'px'); sh.style.setProperty('--dy', Math.sin(an) * d + 'px'); sh.style.setProperty('--rot', (Math.random() * 900 - 450) + 'deg'); root.append(sh); setTimeout(() => sh.remove(), 2600); }
          const em = ['💥', '✨', '🔩', '⚙️', '⭐', '🎉', '🔌', '🐥', '🐛', '🌕'];
          for (let k = 0; k < 40; k++) { const an = Math.random() * 6.283, d = 60 + Math.random() * 190; const pt = h('span', { class: 'bb-part slow', style: { left: '50%', top: '55%' } }, em[k % em.length]); pt.style.setProperty('--dx', Math.cos(an) * d + 'px'); pt.style.setProperty('--dy', Math.sin(an) * d * 0.7 + 'px'); pt.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg'); pt.style.animationDelay = Math.random() * 0.4 + 's'; stage.append(pt); }
          api.say('NON ! Pas le boss ! Pas devant les stagiaires !', 'worried');
        }, 220);
        T(() => { api.sfx('win'); stage.append(h('div', { class: 'bb-end' }, h('div', {}, h('b', {}, 'Charges abandonnées : 3/3'), h('span', { style: { fontSize: '14px', fontWeight: 600 } }, 'CAPCHA-ZILLA est vaincu. Vous êtes un humain. Il n’y a pas de médaille pour ça. Juste mon respect et un accusé de réception.')))); api.say('Trois charges, trois abandons. Je ne dirai pas que je suis impressionné. Je l’écrirai, par contre. Dans un rapport. Avec votre nom.', 'impressed'); }, 1500);
        T(() => api.solve(), 4300);
      };
      const next = () => { api.sfx('good'); step++; hp([15, 9, 4][step - 1]); if (step >= 3) { win(); return; } T(stepIn, 700); };
      // 1 : arithmétique de robot (trois questions, priorités d'opérations)
      function stepA() {
        api.timer(45000); lab.textContent = 'Chef d’accusation 1/3 · 45 s'; setRule('Charge n° 1 — Robotisme présumé', 'Un robot calcule vite. Répondez aux ', h('b', {}, '3 questions'), ' (attention aux priorités d’opérations). Une erreur ne coûte rien, sauf du temps.');
        const a1 = api.int(12, 19), b1 = api.int(3, 9), n2 = api.int(90, 120), p2_ = api.int(3, 9), q2 = api.int(3, 9), x3 = api.int(4, 15), y3 = api.int(4, 15), z3 = api.int(3, 7);
        const Q = [[`${a1} × ${b1}`, a1 * b1], [`${n2} − ${p2_} × ${q2}`, n2 - p2_ * q2], [`(${x3} + ${y3}) × ${z3}`, (x3 + y3) * z3]]; let qi = 0;
        const qEl = h('div', { class: 'bb-phrase' }), prog = h('div', { class: 'bb-echo' });
        const inp = h('input', { type: 'text', inputmode: 'numeric', pattern: '[0-9-]*', 'aria-label': 'Réponse', placeholder: '= ?', ...nofix, onkeydown: (e) => { if (e.key === 'Enter') go(); } });
        const sub = h('button', { class: 'bk-btn', type: 'button', onclick: go, style: { minHeight: '38px', padding: '6px 14px' } }, 'Valider');
        body.append(qEl, prog, h('div', { class: 'bb-row' }, inp, sub));
        const show = () => { qEl.textContent = Q[qi][0] + ' = ?'; prog.textContent = `Question ${qi + 1}/3`; inp.value = ''; if (/cheat=1/.test(location.search)) host.dataset.answer = String(Q[qi][1]); };
        function go() { if (busy) return; if (+inp.value.trim() === Q[qi][1] && inp.value.trim() !== '') { api.sfx('pop'); qi++; if (qi >= 3) { busy = true; next(); } else { show(); inp.focus(); } } else { shake(root); api.sfx('bad'); api.say(['Non. Un robot aurait trouvé ça en 0,2 ms.', 'Faux. Les priorités d’opérations, ça vous dit quelque chose ?', 'Raté. Respirez. Recalculez.'][api.int(0, 2)], 'smug'); } }
        show(); setTimeout(() => alive && inp.focus({ preventScroll: true }), 80);
      }
      // 2 : mot de passe à énigmes, grignoté par le boss
      function stepB() {
        api.timer(50000); lab.textContent = 'Chef d’accusation 2/3 · 50 s'; setRule('Charge n° 2 — Mots de passe suspects', 'Composez un mot de passe qui respecte les 5 règles. Réfléchissez : elles se contredisent presque. Le boss en ', h('b', {}, 'grignote la fin'), ' toutes les 10 s.');
        const mk = [['Au moins 10 caractères', (p) => [...p].length >= 10], ['Une majuscule', (p) => /[A-Z]/.test(p)], ['Contient le résultat de 7 × 8', (p) => p.includes('56')], ['Contient une couleur du drapeau français', (p) => /bleu|blanc|rouge/i.test(p)], ['Aucun « e » (sans accent)', (p) => !/e/i.test(p)]];
        const ul = h('div', { class: 'bb-rl' }, mk.map(([t]) => h('span', {}, t)));
        const inp = h('input', { type: 'text', 'aria-label': 'Mot de passe', placeholder: 'Mot de passe…', ...nofix, oninput: ck, onkeydown: (e) => { if (e.key === 'Enter') go(); } });
        const sub = h('button', { class: 'bk-btn', type: 'button', onclick: go, style: { minHeight: '38px', padding: '6px 14px' } }, 'Valider');
        body.append(ul, h('div', { class: 'bb-row' }, inp, sub));
        function ck() { const p = inp.value; mk.forEach(([, f], i) => ul.children[i].classList.toggle('ok', f(p))); if (/cheat=1/.test(location.search)) host.dataset.answer = 'Blanc56xxxxxxx'; return mk.every(([, f]) => f(p)); }
        function go() { if (busy) return; if (ck()) { busy = true; next(); } else { shake(root); api.sfx('bad'); api.say('Une règle manque encore. Regardez les rouges. Oui, « bleu » et « rouge » ont un « e ».', 'smug'); } }
        const bite = setInterval(() => { if (busy || !inp.value) return; inp.value = [...inp.value].slice(0, -1).join(''); inp.classList.remove('chomp'); void inp.offsetWidth; inp.classList.add('chomp'); api.sfx('bad'); ck(); }, 10000);
        cleanup = () => clearInterval(bite); ck(); setTimeout(() => alive && inp.focus({ preventScroll: true }), 80);
      }
      // 3 : la phrase à l'envers (ticks seulement)
      function stepC() {
        api.timer(34000); lab.textContent = 'Chef d’accusation 3/3 · 34 s'; const phrase = api.pick(PHRASES), rev = [...phrase].reverse().join('');
        setRule('Charge n° 3 — Dactylographie à l’envers', 'Retapez la phrase ', h('b', {}, 'à l’envers'), ', lettre par lettre (dernière lettre d’abord). Les cases vertes vous disent si votre frappe est bonne, pas laquelle.');
        const ph = h('div', { class: 'bb-phrase' }, phrase), echo = h('div', { class: 'bb-echo', 'aria-hidden': 'true' });
        const inp = h('input', { type: 'text', 'aria-label': 'Votre saisie', placeholder: 'Tapez ici…', ...nofix, oninput: render, onkeydown: (e) => { if (e.key === 'Enter') go(); } });
        const sub = h('button', { class: 'bk-btn', type: 'button', onclick: go, style: { minHeight: '38px', padding: '6px 14px' } }, 'Valider');
        body.append(ph, echo, h('div', { class: 'bb-row' }, inp, sub));
        function render() { const w = [...rev], v = [...inp.value]; echo.replaceChildren(...w.map((c, i) => h('span', { class: i < v.length ? (v[i] === c ? 'g' : 'r') : 'p' }, i < v.length ? (v[i] === c ? '▪' : '✕') : '·'))); }
        function go() { if (busy) return; const v = inp.value; if (v === rev) { busy = true; next(); } else { shake(root); api.sfx('bad'); const i = [...v].findIndex((c, k) => c !== [...rev][k]); api.say(!v ? 'Case vide. Le silence n’est pas une réponse, sauf chez Gérard.' : i === -1 ? 'Il en manque encore. Continuez à reculer.' : `Une lettre est fausse (n° ${i + 1}). Rien n’est perdu, corrigez.`, 'smug'); } }
        if (/cheat=1/.test(location.search)) host.dataset.answer = rev; render(); setTimeout(() => alive && inp.focus({ preventScroll: true }), 80);
      }
      function stepIn() { body.replaceChildren(); if (cleanup) cleanup(); cleanup = null; busy = false; [stepA, stepB, stepC][step](); }
      stepIn();
    }
    const dbgPh = /cheat=1/.test(location.search) ? +(new URLSearchParams(location.search).get('bossphase') || 0) : 0;
    const resume = dbgPh || (CK.phase && performance.now() - CK.t < 7000 ? CK.phase : 1);
    setRule('Combat de boss', resume > 1 ? 'Reprise au dernier point de sauvegarde. Le boss a de la mémoire, lui aussi.' : 'Trois épreuves, trois mécaniques que vous connaissez déjà. Il a juste changé les règles.'); hp(resume === 1 ? 100 : resume === 2 ? 40 : 15);
    T(resume === 3 ? p3 : resume === 2 ? p2 : p1, 900);
    return { destroy() { alive = false; tm.forEach(clearTimeout); window.removeEventListener('pointermove', look); CK.t = performance.now(); clear(); } };
  }
};
