import { css, frame, numWords, coarse, S } from './a_kit.js';
css('math', `
.am-p{background:#f6f7f9;border:1px dashed #c9ccd1;border-radius:4px;padding:10px 12px 10px 12px;font-size:14px;line-height:1.5}
.am-p ol{margin:6px 0 0;padding-left:20px}
.am-p li{margin:2px 0}
.am-p li::marker{color:#1a73e8;font-weight:700}
.am-p em{font-style:normal;font-weight:700;color:#1a3d7c}
.am-p{position:relative;overflow:hidden}.am-p li{opacity:0;animation:am-in .4s both}
@keyframes am-in{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:none}}
.am-st{display:inline-block;float:right;margin:4px 0 0 8px;border:2px solid #c62828;color:#c62828;font:900 10px/1.1 system-ui;letter-spacing:.08em;padding:3px 5px;border-radius:3px;transform:rotate(7deg) scale(1);animation:am-stamp .35s .7s both;text-align:center;opacity:.85}
@keyframes am-stamp{from{transform:rotate(7deg) scale(2.4);opacity:0}to{transform:rotate(7deg) scale(1);opacity:.85}}
.am-p em{display:inline-block;animation:am-pulse 2.4s infinite}
@keyframes am-pulse{50%{transform:scale(1.08)}}
.am-big{text-align:center;padding:16px 12px}.am-q{font-size:14px;color:#5f6368}.am-e{font:800 40px/1.2 ui-monospace,Menlo,monospace;color:#1a3d7c;margin:4px 0}.am-big .am-st{position:absolute;right:6px;bottom:4px;float:none;margin:0}
.am-r{display:flex;align-items:center;gap:8px;margin-top:10px}
.am-r label{font-weight:600;font-size:13px;flex:1}
.am-n{width:128px;height:42px;border:2px solid #c9ccd1;border-radius:3px;font:700 20px ui-monospace,Menlo,monospace;text-align:center;outline:0;transition:border-color .15s,box-shadow .15s;background:#fff;color:#202124;user-select:text;-webkit-user-select:text;-moz-appearance:textfield}
.am-n:focus{border-color:#1a73e8;box-shadow:0 0 0 3px rgba(26,115,232,.2)}
`);
export default {
  id: 'a_math', tier: 1, title: 'Calcul mental', time: 25000,
  mount(host, api) {
    const { h } = api;
    const two = api.rng() < .5; let a, b, c, v, expr;
    if (two) { a = api.int(6, 12); b = api.int(2, 5); c = api.int(2, 6); v = a - b + c; expr = `${a} − ${b} + ${c}`; } else { a = api.int(3, 9); b = api.int(3, 9); v = a + b; expr = `${a} + ${b}`; }
    S.mathVal = v; S.mathWords = numWords(v);
    const p = h('div', { class: 'am-p am-big' }, h('div', { class: 'am-q' }, 'Combien font'), h('div', { class: 'am-e' }, expr + ' ?'));
    const inp = h('input', { class: 'am-n', id: 'am-n', type: 'text', inputmode: 'numeric', autocomplete: 'off', autocapitalize: 'none', autocorrect: 'off', spellcheck: 'false', 'aria-label': 'Résultat', placeholder: '?', onkeydown: (e) => { if (e.key === 'Enter') check(); } });
    const fr = frame(h, { api, id: 'a_math', small: 'Répondez avec un nombre', title: 'Quel est le résultat ?', body: [p, h('div', { class: 'am-r' }, h('label', { for: 'am-n' }, 'Résultat'), inp)], onVerify: check });
    host.append(fr.el); if (!coarse()) setTimeout(() => inp.focus(), 50);
    if (/cheat=1/.test(location.search)) host.dataset.answer = String(v);
    const norm = (x) => String(x ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[-\s]+/g, ' ').trim();
    function check() {
      const raw = inp.value.trim(); const n = Number(raw.replace(',', '.'));
      if ((raw !== '' && n === v) || (raw && norm(raw) === norm(numWords(v)))) { fr.el.classList.add('ak-ok'); return api.solve(); }
      fr.shake(); let m;
      if (!raw) m = 'Réponse vide. Zéro point, mais zéro effort : c’est cohérent.';
      else if (Number.isFinite(n) && Math.abs(n - v) === 1) m = 'À une unité près. Les robots font mieux, et les poètes aussi.';
      else if (Number.isFinite(n)) m = `${raw} ? Non. J’ai vérifié avec les doigts, et même eux ne vous suivent pas.`;
      else m = `« ${raw} » n’est pas un nombre. On vous demande un résultat, pas de la poésie.`;
      api.fail(m);
    }
    return { destroy() {} };
  }
};
