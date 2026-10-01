import { css, frame, hasRule, coarse, infraction } from './a_kit.js';
css('wavy', `
.aw-cv{display:block;width:100%;height:auto;border-radius:3px;background:#eef1f5}
.aw-row{display:flex;gap:8px;margin-top:10px}
.aw-in{flex:1;min-width:0;height:42px;border:2px solid #c9ccd1;border-radius:3px;padding:0 12px;font:600 18px/1 ui-monospace,Menlo,monospace;letter-spacing:.12em;outline:0;transition:border-color .15s,box-shadow .15s;background:#fff;color:#202124;user-select:text;-webkit-user-select:text}
.aw-in:focus{border-color:#1a73e8;box-shadow:0 0 0 3px rgba(26,115,232,.2)}
.aw-in::placeholder{font-size:13px;letter-spacing:.02em;font-weight:400;text-transform:none;color:#80868b}
.aw-rf{width:42px;height:42px;border:1px solid #c9ccd1;border-radius:3px;font-size:18px}
`);
const WORDS = ['BAGUETTE', 'FROMAGE', 'PATATE', 'ESCARGOT', 'BRIOCHE', 'COUCOU', 'MOUSTACHE', 'CROISSANT'];
const FONTS = ['Georgia,serif', 'Impact,Haettenschweiler,sans-serif', '"Courier New",monospace', '"Brush Script MT","Comic Sans MS",cursive', '"Trebuchet MS",sans-serif', 'Palatino,"Times New Roman",serif', 'Verdana,sans-serif'];
const lev = (a, b) => { const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]); for (let j = 1; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; };
export default {
  id: 'a_wavy', tier: 1, title: 'Texte tordu', time: 30000,
  mount(host, api) {
    const { h } = api, word = api.pick(WORDS), W = 340, H = 116;
    const cv = h('canvas', { class: 'aw-cv', width: W * 2, height: H * 2, role: 'img', 'aria-label': 'Texte déformé de ' + word.length + ' lettres' });
    let off = null, A = 6, f = .05, ph = 0, raf = 0, dead = false;
    function paint() { const g = cv.getContext('2d'); g.clearRect(0, 0, W * 2, H * 2); for (let x = 0; x < W * 2; x += 2) g.drawImage(off, x, 0, 2, H * 2, x, Math.sin(x / 2 * f + ph) * A * 2, 2, H * 2); }
    function loop() { if (dead) return; ph += .06; paint(); raf = requestAnimationFrame(loop); }
    function draw() {
      off = document.createElement('canvas'); off.width = W * 2; off.height = H * 2;
      const o = off.getContext('2d'); o.scale(2, 2);
      const bg = o.createLinearGradient(0, 0, W, H); bg.addColorStop(0, `hsl(${api.int(180, 260)} 40% 90%)`); bg.addColorStop(1, `hsl(${api.int(20, 60)} 50% 90%)`);
      o.fillStyle = bg; o.fillRect(0, 0, W, H);
      const step = (W - 40) / word.length * .92; o.textAlign = 'center'; o.textBaseline = 'middle';
      [...word].forEach((c, i) => {
        o.save(); o.translate(24 + step * (i + .5) + api.int(-3, 3), H / 2 + api.int(-8, 8)); o.rotate((api.rng() - .5) * 1.1);
        const sz = api.int(40, 54); o.font = `${api.rng() < .5 ? 'italic ' : ''}${api.rng() < .5 ? 'bold ' : ''}${sz}px ${api.pick(FONTS)}`;
        o.fillStyle = `hsl(${api.int(0, 360)} 65% 32%)`; o.strokeStyle = `hsl(${api.int(0, 360)} 70% 70%)`; o.lineWidth = 2;
        o.strokeText(c, 0, 0); o.fillText(c, 0, 0); o.restore();
      });
      for (let i = 0; i < 6; i++) { o.strokeStyle = `hsla(${api.int(0, 360)} 60% 35% / .55)`; o.lineWidth = 1.5; o.beginPath(); const y = api.int(10, H - 10); o.moveTo(0, y); o.bezierCurveTo(W / 3, y + api.int(-40, 40), W * .66, y + api.int(-40, 40), W, api.int(10, H - 10)); o.stroke(); }
      for (let i = 0; i < 70; i++) { o.fillStyle = `hsla(${api.int(0, 360)} 50% 40% / .5)`; o.fillRect(api.rng() * W, api.rng() * H, 2, 2); }
      // wave: shift each column vertically
      A = api.int(6, 9); f = api.rng() * 0.05 + 0.05; ph = api.rng() * 6; paint();
    }
    draw(); if (!api.reducedMotion) raf = requestAnimationFrame(loop); if (/cheat=1/.test(location.search)) host.dataset.answer = word;
    const inp = h('input', { class: 'aw-in', type: 'text', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', placeholder: hasRule('a_wavy', 'R1') ? 'minuscules' : 'Tapez le texte', 'aria-label': 'Texte lu', maxlength: 14, onkeydown: (e) => { if (e.key === 'Enter') check(); } });
    const rf = h('button', { class: 'ak-ghost aw-rf', type: 'button', title: 'Autre image', 'aria-label': 'Autre image', onclick: () => { draw(); api.sfx('tick'); inp.focus(); } }, '⟳');
    const fr = frame(h, { api, id: 'a_wavy', small: 'Tapez le mot', title: 'Lisez ce que vous voyez', note: 'Respectez l’ordre. Un humain lit de gauche à droite (sauf le dimanche).', body: [cv, h('div', { class: 'aw-row' }, inp, rf)], onVerify: check });
    host.append(fr.el); if (!coarse()) setTimeout(() => inp.focus(), 50);
    function check() {
      const raw = inp.value.trim(); const v = raw.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '');
      if (hasRule('a_wavy', 'R1') && raw !== raw.toLowerCase() && v === word) { fr.shake(); infraction('upper'); return api.fail('Règle 1 : « ' + raw + ' » est correct… mais en majuscules. Vous avez lu la règle ? Elle est juste au-dessus. En petit.'); }
      if (v === word) { fr.el.classList.add('ak-ok'); return api.solve(); }
      fr.shake(); api.sfx('bad');
      let m;
      if (!v) m = 'Le champ est vide. Comme votre dossier de preuves d’humanité.';
      else if (v.length !== word.length && lev(v, word) > 2) m = `J’ai compté ${word.length} lettres à l’écran, vous en avez tapé ${v.length}. L’un de nous deux a des problèmes de vue, et ce n’est pas moi.`;
      else if (lev(v, word) === 1) m = `« ${v} » : presque ! Une seule lettre vous a échappé. Les robots, eux, voient tout.`;
      else if (lev(v, word) <= 3) m = `« ${v} » ressemble au mot, comme un cousin éloigné ressemble au marié. Pas assez.`;
      else m = `« ${v} » ? Je n’ai vu aucun mot pareil. Vous avez recopié le chat qui marche sur le clavier ?`;
      api.fail(m);
    }
    return { destroy() { dead = true; cancelAnimationFrame(raf); } };
  }
};
