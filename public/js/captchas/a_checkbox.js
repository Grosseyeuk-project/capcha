import { css, brand, S, resetS, coarse } from './a_kit.js';
css('chk', `
.ac-w{width:min(100%,340px)}
.ac-row{position:relative;height:70px;background:#f9f9f9;border-bottom:1px solid #e3e5e8}
.ac-box{position:absolute;left:18px;top:20px;width:30px;height:30px;border:2px solid #c1c1c1;border-radius:3px;background:#fff;padding:0;cursor:pointer;transition:left .35s cubic-bezier(.3,1.6,.5,1),border-color .15s,box-shadow .15s;display:grid;place-items:center}
.ac-box:hover{border-color:#1a73e8;box-shadow:0 0 0 4px rgba(26,115,232,.15)}
.ac-box.hop{left:276px}
.ac-box:disabled{cursor:progress}
.ac-lab{position:absolute;left:64px;top:0;height:100%;display:flex;align-items:center;font-size:15px;font-weight:500;color:#202124;transition:left .35s}
.ac-box.hop+.ac-lab{left:16px}
.ac-spin{width:20px;height:20px;border:3px solid #dadce0;border-top-color:#1a73e8;border-radius:50%;animation:ac-sp .7s linear infinite}
@keyframes ac-sp{to{transform:rotate(360deg)}}
.ac-tick{width:22px;height:22px;animation:ak-pop .35s both}
.ac-strip{height:52px;padding:0 12px 0 16px;display:flex;align-items:center;justify-content:space-between;gap:10px;background:#fff}
.ac-st{flex:1;min-width:0}
.ac-st span{display:block;font-size:11px;line-height:1.25;color:#5f6368;height:28px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.ac-pb{height:5px;background:#e8eaed;border-radius:3px;margin-top:4px;overflow:hidden}
.ac-pb i{display:block;height:100%;width:0;background:linear-gradient(90deg,#1a73e8,#34a853);border-radius:3px}
.ac-w.bad .ac-pb i{background:#d93025}
.ac-ring{position:absolute;left:-6px;top:-6px;width:38px;height:38px;border-radius:50%;pointer-events:none;background:conic-gradient(#1a73e8 calc(var(--p,0)*1turn),transparent 0);-webkit-mask:radial-gradient(circle,transparent 15px,#000 16px);mask:radial-gradient(circle,transparent 15px,#000 16px)}
.ac-box{touch-action:manipulation;-webkit-user-select:none}
.ac-box.hint{animation:ac-hint 1.6s ease-in-out infinite}
@keyframes ac-hint{0%,100%{box-shadow:0 0 0 0 rgba(26,115,232,.45)}50%{box-shadow:0 0 0 9px rgba(26,115,232,0)}}
@media (prefers-reduced-motion:reduce){.ac-box.hint{animation:none}}
`);
export default {
  id: 'a_checkbox', tier: 1, title: 'Case à cocher', time: 25000,
  mount(host, api) {
    const { h } = api; resetS();
    const pts = []; let hopped = false, busy = false, raf = 0, tmo = [], warned = false;
    const box = h('button', { class: 'ac-box', type: 'button', 'aria-label': 'Je ne suis pas un robot' });
    const lab = h('div', { class: 'ac-lab' }, 'Je ne suis pas un robot');
    const row = h('div', { class: 'ac-row' }, box, lab);
    const bar = h('i'); const isTouch = coarse(); const msg = h('span', {}, isTouch ? 'Maintenez la case enfoncée : les robots lâchent vite.' : 'Analyse : en attente de preuves.');
    const w = h('div', { class: 'ak-w ac-w' }, row, h('div', { class: 'ac-strip' }, h('div', { class: 'ac-st' }, msg, h('div', { class: 'ac-pb' }, bar)), brand(h)));
    host.append(w); if (isTouch) { box.classList.add('hint'); lab.textContent = 'Je ne suis pas un robot (appui long)'; }
    const onMove = (e) => {
      if (e.pointerType !== 'mouse') return;
      const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : []; for (const c of (evs.length ? evs : [e])) pts.push({ x: c.clientX, y: c.clientY, t: performance.now() }); while (pts.length > 400) pts.shift();
      if (!hopped && !busy) {
        const r = box.getBoundingClientRect(), d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
        if (d < 70) { hopped = true; box.classList.add('hop'); msg.textContent = 'La case a détecté votre approche. Elle a eu peur.'; api.sfx('whoosh'); }
      }
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    const later = (f, ms) => tmo.push(setTimeout(f, ms));
    const verdict = (e) => {
      if (e && e.pointerType === 'touch') return { ok: true, why: 'Pouce légèrement moite : humain. Merci.' };
      const mouse = e && e.pointerType === 'mouse' && e.detail > 0;
      if (!mouse) return { ok: true, why: 'Pas de souris : on vous croit sur parole (sans enthousiasme).' };
      const now = performance.now(), p = pts.filter((q) => now - q.t < 5000);
      if (p.length < 3) return { ok: false, why: 'Aucun mouvement de souris avant le clic. Vous vous êtes téléporté·e ? Les humains traversent l’espace.' };
      const a = p[0], b = p[p.length - 1], L = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      let dev = 0, path = 0;
      p.forEach((q, i) => { dev = Math.max(dev, Math.abs((b.x - a.x) * (a.y - q.y) - (a.x - q.x) * (b.y - a.y)) / L); if (i) path += Math.hypot(q.x - p[i - 1].x, q.y - p[i - 1].y); });
      if (dev < 3.5) { S.straight = true; return { ok: false, why: `Trajectoire rectiligne à ${dev.toFixed(1)} px près. Aucune main humaine n’est aussi sûre d’elle. Hésitez un peu.` }; }
      return { ok: true, why: 'Tremblements réalistes détectés. Bravo, vous êtes visiblement stressé·e.' };
    };
    const touchy = (e) => e.pointerType === 'touch' || e.pointerType === 'pen';
    // touch: hold-to-prove (robots release too quickly)
    let hold = null;
    box.addEventListener('pointerdown', (e) => {
      if (!touchy(e) || busy) return;
      const t0 = performance.now(), ring = h('div', { class: 'ac-ring' }); box.append(ring); msg.textContent = 'Maintenez… un robot lâcherait déjà.';
      const HOLD = ['Mesure du tremblement du pouce…', 'Pouce détecté : 87 % humain, 13 % saucisse.', 'Analyse de la moiteur…']; const step = () => { const k = Math.min(1, (performance.now() - t0) / 1100); ring.style.setProperty('--p', k); msg.textContent = HOLD[Math.min(2, Math.floor(k * 3))]; if (k >= 1) { hold = null; ring.remove(); start({ pointerType: 'touch', detail: 1 }); } else hold.raf = requestAnimationFrame(step); };
      hold = { ring, raf: requestAnimationFrame(step) };
    });
    const rel = () => { if (!hold) return; cancelAnimationFrame(hold.raf); hold.ring.remove(); hold = null; msg.textContent = 'Relâché trop tôt. Un robot, lui, aurait tenu. Réessayez, plus longtemps.'; api.sfx('bad'); w.classList.remove('ak-shake'); void w.offsetWidth; w.classList.add('ak-shake'); };
    box.addEventListener('pointerup', rel); box.addEventListener('pointercancel', rel); box.addEventListener('pointerleave', (e) => touchy(e) && rel());
    box.addEventListener('contextmenu', (e) => e.preventDefault());
    let touchAt = -9999; box.addEventListener('pointerdown', (e) => { if (touchy(e)) touchAt = performance.now(); }, true); box.addEventListener('pointerup', (e) => { if (touchy(e)) touchAt = performance.now(); }, true);
    box.addEventListener('click', (e) => { if (touchy(e) || performance.now() - touchAt < 800) return; start(e); });
    function start(e) {
      if (busy) return; busy = true; box.disabled = true;
      box.replaceChildren(h('div', { class: 'ac-spin' })); api.sfx('click');
      const v = verdict(e), t0 = performance.now(), dur = api.reducedMotion ? 600 : 1700;
      const steps = ['Analyse des mouvements de la souris…', 'Comparaison avec 4 milliards de souris…', 'Consultation de votre mère…', 'Calcul du degré de tremblement…'];
      const loop = () => {
        const k = Math.min(1, (performance.now() - t0) / dur);
        bar.style.width = (v.ok ? k : Math.min(k, 0.9)) * 100 + '%';
        msg.textContent = steps[Math.min(3, Math.floor(k * 4))];
        if (k < 1) raf = requestAnimationFrame(loop); else end();
      };
      const end = () => {
        msg.textContent = v.ok ? v.why : 'Comportement suspect. Dossier transmis.';
        if (v.ok) {
          box.replaceChildren(h('div', {})); box.firstChild.innerHTML = '<svg class="ac-tick" viewBox="0 0 24 24"><path fill="none" stroke="#34a853" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" d="M4 12.5l5 5L20 6"/></svg>';
          box.style.borderColor = '#34a853'; later(() => api.solve(), 500);
        } else if (!warned) {
          warned = true; w.classList.add('ak-shake'); msg.textContent = 'Doute : ' + v.why + ' (Seconde chance, offerte.)'; api.say('Première alerte : ' + v.why + ' Je vous en offre une seconde, c’est la fête.', 'smug'); api.sfx('bad');
          box.replaceChildren(); box.disabled = false; busy = false; bar.style.width = '0'; pts.length = 0; setTimeout(() => w.classList.remove('ak-shake'), 600);
        } else {
          w.classList.add('bad', 'ak-shake'); box.replaceChildren(h('div', {})); box.firstChild.innerHTML = '<svg class="ac-tick" viewBox="0 0 24 24"><path fill="none" stroke="#d93025" stroke-width="3.5" stroke-linecap="round" d="M6 6l12 12M18 6L6 18"/></svg>';
          S.last = v.why; S.lastT = Date.now(); later(() => api.fail(v.why), 600);
        }
      };
      raf = requestAnimationFrame(loop);
    }
    return { destroy() { window.removeEventListener('pointermove', onMove); cancelAnimationFrame(raf); tmo.forEach(clearTimeout); } };
  }
};
