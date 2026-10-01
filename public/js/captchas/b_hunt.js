import { css, shake } from './b_kit.js';
css('hunt', `
.bh-arena{position:relative;height:clamp(250px,52vw,290px);border:2px solid var(--ink);background:repeating-linear-gradient(0deg,#bfe3ef 0 20px,#b3dbe9 20px 40px);overflow:hidden;box-shadow:4px 4px 0 var(--ink);touch-action:manipulation;cursor:crosshair}
.bh-arena::after{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 120%,rgba(255,255,255,.5),transparent 60%);pointer-events:none}
.bh-d{position:absolute;left:0;top:0;width:46px;height:46px;border:0;background:none;padding:0;font-size:34px;line-height:46px;text-align:center;cursor:pointer;will-change:transform;font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif;touch-action:manipulation}
.bh-d i.k{font-size:23px;top:-9px}.bh-d i{position:absolute;left:50%;top:-4px;font-style:normal;font-size:15px;line-height:1;transform:translateX(-50%);pointer-events:none}
.bh-d s{display:block;text-decoration:none;transition:transform .12s}
.bh-d:hover s{filter:drop-shadow(0 0 6px #fff)}
.bh-d:focus-visible{outline:3px solid #1a73e8;border-radius:50%}
.bh-d.hit s{animation:bh-hit .4s forwards}
@keyframes bh-hit{50%{transform:scale(1.7) rotate(20deg)}100%{transform:scale(0);opacity:0}}
.bk-rule b.no{background:var(--red);color:#fff;padding:0 5px;box-shadow:2px 2px 0 var(--ink)}
`);
const HATS = ['🎩', '🎓', '🧢', '👒'], FAKES = ['🔱', '🏆', '🎀'];
export default {
  id: 'b_hunt', tier: 3, title: 'Le canard royal', time: 30000,
  mount(host, api) {
    const { h } = api; let round = 0, alive = true, busy = false, step2 = false, bare = -1, wrongs = 0;
    const arena = h('div', { class: 'bh-arena', 'aria-label': 'Arène' });
    const pips = h('div', { class: 'bk-pips' }, [0, 1, 2].map(() => h('i', {})));
    const info = h('span', {}, 'Rois neutralisés');
    const rule = h('div', { class: 'bk-rule' });
    const setRule = (small, ...k) => { rule.className = 'bk-rule flip'; rule.replaceChildren(h('div', {}, h('small', {}, small), ...k)); };
    const ruleKing = () => setRule('Consigne', 'Cliquez sur le canard qui porte la ', h('b', {}, 'couronne 👑'), '. Un seul. Il bouge, c’est son droit.');
    ruleKing();
    const root = h('div', { class: 'bk' }, rule, arena, h('div', { class: 'bk-meta' }, info, pips)); host.append(root);
    const N = 15; let ducks = [], king = 0, W = 0, H = 0;
    const measure = () => { W = arena.clientWidth; H = arena.clientHeight; };
    const speed = () => (api.reducedMotion ? 0.6 : 1) * (95 + round * 75);
    function spawn() {
      measure(); arena.replaceChildren(); ducks = [];
      king = api.int(0, N - 1); step2 = false; bare = -1; if (round < 2) ruleKing(); else setRule('Consigne', 'Cliquez sur le canard qui porte la ', h('b', {}, 'couronne 👑'), '. (Dernier roi. Probablement.)');
      const nHat = [2, 6, N - 2][round];
      const others = api.shuffle([...Array(N).keys()].filter((i) => i !== king));
      if (round === 2) bare = others[0];
      const hatted = others.filter((i) => i !== bare).slice(0, nHat);
      for (let i = 0; i < N; i++) {
        const a = api.rng() * 6.283, sp = speed() * (0.7 + api.rng() * 0.6);
        const el = h('button', { class: 'bh-d', type: 'button', 'aria-label': i === king ? 'canard à couronne' : 'canard', onclick: () => hit(i) }, h('s', {}, '🦆'));
        if (i === king) el.append(h('i', { class: 'k' }, '👑')); else if (hatted.includes(i)) el.append(h('i', {}, round > 0 && api.rng() < 0.4 ? api.pick(FAKES) : api.pick(HATS)));
        if (i === king) el.style.zIndex = 5;
        arena.append(el);
        ducks.push({ el, x: 10 + api.rng() * (W - 66), y: 10 + api.rng() * (H - 66), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.7 });
      }
      if (/cheat=1/.test(location.search)) host.dataset.answer = String(king) + ',' + bare;
      api.timer(round === 0 ? 24000 : 20000);
    }
    function wrong(msg) { wrongs++; api.sfx('bad'); if (wrongs >= 3) { wrongs = 0; return api.fail(msg + ' (3e erreur : une vie.)', { retry: true }); } api.say(msg + ` (Erreur ${wrongs}/3 : tolérée.)`, 'smug'); }
    function hit(i) {
      if (busy) return;
      const d = ducks[i];
      if (step2) {
        if (i === king) { shake(root); return wrong('Ce canard a abdiqué. Il porte encore la couronne, par nostalgie. Cherchez celui SANS chapeau.'); }
        if (i !== bare) { shake(root); return wrong('Un chapeau ! L’erratum disait SANS chapeau. Vous avez arrêté un canard bien habillé, par réflexe.'); }
      } else if (i !== king) { shake(root); const hat = d.el.querySelector('i'); return wrong(hat ? `Ce canard porte un ${hat.textContent}, pas la vraie 👑. Les faux insignes, ça existe. Vous venez d’arrêter un innocent bien habillé.` : 'Ce canard est un civil. Pas de couronne, pas de procès. Vous venez de faire peur à un canard.'); }
      if (round === 2 && !step2) { // abdication : nouvelle consigne
        step2 = true; d.el.classList.add('hit'); api.sfx('whoosh'); king = -1;
        setRule('Erratum n° 3', 'Le roi vient d’abdiquer. Cliquez plutôt sur le canard ', h('b', { class: 'no' }, 'SANS chapeau'), '. Un seul.');
        api.say('Abdication ! Le trône est vacant. Je cherche un canard nu.', 'smug'); api.timer(14000); return;
      }
      busy = true; d.el.classList.add('hit'); api.sfx('pop'); round++;
      [...pips.children].forEach((p, k) => p.classList.toggle('on', k < round));
      if (round >= 3) { api.say('Le roi est mort. Vive le roi. Non, plus de roi. Bravo.', 'impressed'); setTimeout(() => alive && api.solve(), 350); return; }
      api.say(round === 1 ? 'Un roi de moins. Mais un autre canard l’a déjà remplacé, c’est la monarchie.' : 'Encore un. Les canards accélèrent, la couronne est de plus en plus lourde.', 'worried');
      setTimeout(() => { if (alive) { busy = false; spawn(); } }, 500);
    }
    spawn();
    let last = performance.now(), raf;
    const loop = (t) => {
      raf = requestAnimationFrame(loop); const dt = Math.min(0.05, (t - last) / 1000); last = t; if (!W) measure();
      for (const d of ducks) {
        d.x += d.vx * dt; d.y += d.vy * dt;
        if (d.x < 0) { d.x = 0; d.vx = Math.abs(d.vx); } else if (d.x > W - 46) { d.x = W - 46; d.vx = -Math.abs(d.vx); }
        if (d.y < 0) { d.y = 0; d.vy = Math.abs(d.vy); } else if (d.y > H - 46) { d.y = H - 46; d.vy = -Math.abs(d.vy); }
        d.el.style.transform = `translate(${d.x.toFixed(1)}px,${d.y.toFixed(1)}px)`;
        d.el.firstChild.style.transform = d.vx < 0 ? '' : 'scaleX(-1)';
      }
    };
    raf = requestAnimationFrame(loop);
    return { destroy() { alive = false; cancelAnimationFrame(raf); } };
  }
};
