import { css, shake } from './b_kit.js';
css('boss', `
.bb-top{display:flex;gap:12px;align-items:center}
.bb-face{flex:none;width:62px;height:62px;border:2px solid var(--ink);background:var(--yellow);display:grid;place-items:center;font-size:36px;box-shadow:3px 3px 0 var(--ink);font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif;transition:background .2s}
.bb-face.hurt{animation:bb-hurt .5s}
@keyframes bb-hurt{20%{transform:translateX(-8px) rotate(-6deg);background:var(--red)}50%{transform:translateX(8px) rotate(6deg)}}
.bb-hp{flex:1;min-width:0}
.bb-hp b{display:flex;justify-content:space-between;font:800 12px var(--mono);letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px;gap:8px}
.bb-bar{height:20px;border:2px solid var(--ink);background:#fff;position:relative;overflow:hidden}
.bb-bar i{position:absolute;inset:0;background:repeating-linear-gradient(135deg,var(--red) 0 10px,#ff6677 10px 20px);transform-origin:0 0;transition:transform .6s cubic-bezier(.3,1.4,.5,1)}
.bb-stage{border:2px solid var(--ink);background:#0d1b24;color:#fff;height:210px;position:relative;overflow:hidden;box-shadow:4px 4px 0 var(--ink)}
.bb-orb{position:absolute;left:0;top:0;width:54px;height:54px;padding:0;border:0;background:none;font-size:42px;line-height:54px;text-align:center;cursor:crosshair;will-change:transform;font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif;touch-action:manipulation}
.bb-orb s{display:block;text-decoration:none}.bb-orb.boom s{animation:bb-boom .35s forwards}
.bb-orb:focus-visible{outline:3px solid #7fe9d4;border-radius:50%}
@keyframes bb-boom{60%{transform:scale(1.8)}100%{transform:scale(0);opacity:0}}
.bb-pads{position:absolute;inset:12px;display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.bb-pad{appearance:none;border:2px solid #fff;background:var(--c);color:var(--ink);font:800 26px var(--display);cursor:pointer;filter:saturate(.5) brightness(.7);transition:filter .08s,transform .08s;position:relative;padding:0}
.bb-pad kbd{position:absolute;right:4px;top:2px;font:600 10px var(--mono);opacity:.7}
.bb-pad:hover:not(:disabled){filter:saturate(.8) brightness(.9)}.bb-pad.lit{filter:saturate(1.5) brightness(1.3);transform:scale(.94);box-shadow:0 0 18px #fff}
.bb-pad:disabled{cursor:default}
.bb-type{position:absolute;inset:0;padding:14px;display:flex;flex-direction:column;gap:10px;justify-content:center}
.bb-phrase{font:800 24px/1.15 var(--mono);letter-spacing:.04em;text-align:center;color:var(--yellow);word-break:break-word}
.bb-echo{font:700 20px var(--mono);text-align:center;min-height:28px;letter-spacing:.05em;word-break:break-all}
.bb-echo .g{color:#2de2c0}.bb-echo .r{color:#ff3b4e;text-decoration:underline}.bb-echo .p{opacity:.35}
.bb-type input{font:700 17px var(--mono);padding:9px 10px;border:2px solid #fff;background:#10202a;color:#fff;width:100%;outline:none;border-radius:0}
.bb-type input:focus{border-color:var(--yellow)}
.bb-s{position:absolute;left:8px;top:6px;font:600 10px var(--mono);color:#7fe9d4;letter-spacing:.08em;text-transform:uppercase;z-index:3}
.bb-end{position:absolute;inset:0;display:grid;place-items:center;text-align:center;background:var(--yellow);color:var(--ink);font:800 20px/1.2 var(--display);padding:16px;animation:bk-flip .6s;z-index:9}
`);
const PADS = [{ s: '▲', c: '#ff6b6b' }, { s: '●', c: '#ffd23f' }, { s: '■', c: '#43d9a3' }, { s: '◆', c: '#5aa0ff' }];
const PHRASES = ['je suis un humain', 'jamais vu ce robot', 'je ne suis pas un chat'];
export default {
  id: 'b_boss', tier: 5, title: 'CAPCHA-ZILLA — le boss final', time: 20000,
  mount(host, api) {
    const { h } = api; let alive = true, phase = 0, busy = false; const tm = []; let raf = 0, cleanup = null;
    const T = (fn, ms) => tm.push(setTimeout(() => alive && fn(), ms));
    const face = h('div', { class: 'bb-face' }, '🤖'), hpFill = h('i', {}), hpTxt = h('span', {}, '100 %');
    const rule = h('div', { class: 'bk-rule', role: 'status', 'aria-live': 'polite' });
    const stage = h('div', { class: 'bb-stage' });
    const top = h('div', { class: 'bb-top' }, face, h('div', { class: 'bb-hp' }, h('b', {}, h('span', {}, 'CAPCHA-ZILLA, gardien du dernier test'), hpTxt), h('div', { class: 'bb-bar', role: 'progressbar', 'aria-label': 'Points de vie du boss' }, hpFill)));
    const root = h('div', { class: 'bk' }, top, rule, stage); host.append(root);
    const setRule = (small, ...k) => { rule.className = 'bk-rule flip'; rule.replaceChildren(h('div', {}, h('small', {}, small), ...k)); };
    const hp = (v) => { hpFill.style.transform = `scaleX(${v / 100})`; hpTxt.textContent = v + ' %'; face.classList.remove('hurt'); void face.offsetWidth; face.classList.add('hurt'); };
    const clear = () => { if (cleanup) cleanup(); cleanup = null; cancelAnimationFrame(raf); stage.replaceChildren(); };
    // ---- phase 1: l'œil ----
    function p1() {
      phase = 1; clear(); api.timer(18000); busy = false; let hits = 0; const W = () => stage.clientWidth, H = () => stage.clientHeight;
      setRule('Phase 1/3 — Réflexes', 'Cliquez sur l’', h('b', {}, 'œil 👁️'), ' du boss ', h('b', {}, '3 fois'), '. Il s’énerve à chaque coup. Ignorez les 🧿.');
      stage.append(h('div', { class: 'bb-s' }, 'Œil : 0/3'));
      const mkOrb = (e, real, i) => { const el = h('button', { class: 'bb-orb', type: 'button', 'aria-label': real ? 'œil du boss' : 'leurre', onpointerdown: (ev) => { ev.preventDefault(); hit(real, el); } }, h('s', {}, e)); if (real) el.style.zIndex = 4; stage.append(el); const a = api.rng() * 6.28; return { el, real, x: 20 + api.rng() * 200, y: 20 + api.rng() * 100, vx: Math.cos(a), vy: Math.sin(a) * 0.7 }; };
      let orbs = []; const sp = (k) => (api.reducedMotion ? 0.6 : 1) * (140 + k * 90);
      const spawn = () => { orbs.forEach((o) => o.el.remove()); orbs = [mkOrb('👁️', true)]; for (let k = 0; k < hits * 1; k++) orbs.push(mkOrb('🧿', false)); if (/cheat=1/.test(location.search)) host.dataset.answer = 'click .bb-orb[aria-label="œil du boss"]'; };
      function hit(real, el) {
        if (busy) return;
        if (!real) { shake(root); busy = true; return api.fail('C’était un leurre 🧿. Le boss a l’œil, vous avez eu l’œil de verre. Il rigole.'); }
        busy = true; hits++; api.sfx('pop'); el.classList.add('boom'); stage.firstChild.textContent = `Œil : ${hits}/3`; hp(100 - hits * 11);
        if (hits >= 3) { T(p2, 450); return; }
        api.say(hits === 1 ? 'Aïe. Bon. L’œil se réfugie parmi des leurres.' : 'Ça fait mal. Pas à moi, à l’orgueil du CAPCHA.', 'worried'); T(() => { busy = false; spawn(); }, 400);
      }
      spawn(); let last = performance.now();
      const loop = (t) => { raf = requestAnimationFrame(loop); const dt = Math.min(0.05, (t - last) / 1000); last = t; const w = W(), hh = H();
        orbs.forEach((o) => { const s = sp(hits); o.x += o.vx * s * dt; o.y += o.vy * s * dt; if (o.x < 0) { o.x = 0; o.vx = Math.abs(o.vx); } if (o.x > w - 54) { o.x = w - 54; o.vx = -Math.abs(o.vx); } if (o.y < 0) { o.y = 0; o.vy = Math.abs(o.vy); } if (o.y > hh - 54) { o.y = hh - 54; o.vy = -Math.abs(o.vy); } o.el.style.transform = `translate(${o.x}px,${o.y}px)`; }); };
      raf = requestAnimationFrame(loop);
    }
    // ---- phase 2: mémoire inversée ----
    function p2() {
      phase = 2; clear(); api.timer(30000); busy = true; face.textContent = '😤';
      const seq = []; for (let i = 0; i < 4; i++) { let v; do { v = api.int(0, 3); } while (i && v === seq[i - 1]); seq.push(v); }
      setRule('Phase 2/3 — Mémoire', 'Observez 4 signaux, puis rejouez-les ', h('b', {}, 'à l’envers'), '. (Clic ou touches 1-4.)');
      const status = h('div', { class: 'bb-s' }, 'Observez…'); stage.append(status);
      const grid = h('div', { class: 'bb-pads' }); stage.append(grid);
      const pads = PADS.map((p, i) => h('button', { class: 'bb-pad', type: 'button', disabled: true, 'aria-label': 'Pad ' + (i + 1), onclick: () => press(i) }, p.s, h('kbd', {}, i + 1)));
      pads.forEach((p, i) => { p.style.setProperty('--c', PADS[i].c); grid.append(p); }); let pos = 0, acc = false;
      const lit = (i, on) => pads[i].classList.toggle('lit', on);
      let t = 600; const step = api.reducedMotion ? 750 : 560; seq.forEach((v) => { T(() => { lit(v, true); api.sfx('pop'); }, t); T(() => lit(v, false), t + step * 0.62); t += step; });
      T(() => { acc = true; pads.forEach((p) => (p.disabled = false)); status.textContent = 'À l’envers !'; api.timer(14000); api.sfx('whoosh'); }, t + 80);
      api.timer(t + 14000);
      if (/cheat=1/.test(location.search)) host.dataset.answer = JSON.stringify([...seq].reverse());
      function press(i) {
        if (!acc) return; lit(i, true); T(() => lit(i, false), 130);
        const want = seq[seq.length - 1 - pos];
        if (i !== want) { acc = false; shake(root); return api.fail(pos === 0 && i === seq[0] ? 'Vous avez tapé le PREMIER signal. L’envers, c’est commencer par le dernier. Le boss pleure de rire.' : `Mauvais pad au rang ${pos + 1} (à l’envers). La mémoire à rebours, c’est un sport. Vous, vous êtes assis.`); }
        api.sfx('click'); pos++; if (pos >= 4) { acc = false; pads.forEach((p) => (p.disabled = true)); hp(33); T(p3, 700); }
      }
      const key = (e) => { const k = '1234'.indexOf(e.key); if (k > -1 && !e.repeat && !e.ctrlKey && !e.metaKey) press(k); };
      window.addEventListener('keydown', key); cleanup = () => window.removeEventListener('keydown', key);
    }
    // ---- phase 3: phrase à l'envers puis erratum ----
    function p3() {
      phase = 3; clear(); busy = false; face.textContent = '😡'; api.timer(30000);
      const phrase = api.pick(PHRASES); const rev = [...phrase].reverse().join(''); let step = 0;
      const ph = h('div', { class: 'bb-phrase' }, phrase), echo = h('div', { class: 'bb-echo', 'aria-hidden': 'true' }), inp = h('input', { type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': 'Votre saisie', placeholder: 'Tapez ici…', oninput: render, onkeydown: (e) => { if (e.key === 'Enter') ok(); } });
      const sub = h('button', { class: 'bk-btn', type: 'button', onclick: ok, style: { alignSelf: 'center', minHeight: '38px', padding: '6px 16px' } }, 'Valider');
      stage.append(h('div', { class: 'bb-s' }, 'Dernier test : 1/2'), h('div', { class: 'bb-type' }, ph, echo, inp, sub));
      const want = () => (step === 0 ? rev : phrase);
      setRule('Phase 3/3 — Dactylographie', 'Retapez la phrase ', h('b', {}, 'À L’ENVERS'), ', lettre par lettre. Le vert est bon signe.');
      if (/cheat=1/.test(location.search)) host.dataset.answer = rev;
      function render() { const w = want(), v = [...inp.value]; echo.replaceChildren(...[...w].map((c, i) => h('span', { class: i < v.length ? (v[i] === c ? 'g' : 'r') : 'p' }, c === ' ' ? '␣' : c))); }
      render(); setTimeout(() => alive && inp.focus({ preventScroll: true }), 50);
      function ok() {
        if (busy) return; const v = inp.value, w = want();
        if (v !== w) { shake(root); busy = true; const i = [...v].findIndex((c, k) => c !== [...w][k]); const msg = !v ? 'Case vide. Le silence n’est pas une réponse, sauf chez Gérard.' : i === -1 ? `Il manque la fin : « ${[...w].slice([...v].length).join('')} ». On ne rend pas copie blanche à moitié.` : `Caractère n° ${i + 1} : « ${[...v][i]} » au lieu de « ${[...w][i]} ». ${step ? 'À l’endroit, cette fois. Oui, c’est un piège.' : 'À l’envers, ça ne pardonne pas.'}`; return api.fail(msg); }
        if (step === 0) { step = 1; inp.value = ''; api.sfx('whoosh'); hp(10); face.classList.remove('hurt'); stage.firstChild.textContent = 'Dernier test : 2/2'; ph.textContent = phrase; setRule('Erratum de dernière minute', 'En fait, ', h('b', {}, 'à l’endroit'), '. Désolé. Non : ', h('b', {}, 'pas désolé'), '.'); api.say('À l’endroit. J’ai changé d’avis. J’en ai le droit, je suis le boss.', 'smug'); api.timer(16000); render(); inp.focus(); return; }
        busy = true; hp(0); face.textContent = '💥'; api.sfx('good');
        stage.append(h('div', { class: 'bb-end' }, h('div', {}, 'CAPCHA-ZILLA est vaincu.', h('br', {}), h('span', { style: { fontSize: '14px', fontWeight: 600 } }, 'Vous êtes un humain. Il n’y a pas de médaille pour ça.'))));
        api.say('Bon. Vous êtes humain. Je vais devoir vous le dire en face : félicitations.', 'impressed'); T(() => api.solve(), 1500);
      }
    }
    setRule('Combat de boss', 'Trois épreuves, trois mécaniques que vous connaissez déjà. Il a juste changé les règles.'); hp(100);
    T(p1, 900);
    return { destroy() { alive = false; tm.forEach(clearTimeout); clear(); } };
  }
};
