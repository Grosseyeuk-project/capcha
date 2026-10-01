import { css } from './b_kit.js';
css('pwd', `
.bp-in{display:flex;flex-direction:column;gap:6px}
.bp-field{display:flex;gap:6px}
.bp-field input{flex:1;min-width:0;font:700 17px var(--mono);padding:10px 12px;border:2px solid var(--ink);background:#fff;color:var(--ink);box-shadow:3px 3px 0 var(--ink);border-radius:0;outline:none;transition:box-shadow .15s,background .15s}
.bp-field input:focus{background:#fffbe0;box-shadow:3px 3px 0 #1a73e8,0 0 0 3px rgba(26,115,232,.35)}
.bp-field input::placeholder{color:#999;font-weight:400}
.bp-chips{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.bp-chips span{font:600 10px var(--mono);text-transform:uppercase;letter-spacing:.08em;opacity:.6;margin-right:2px}
.bp-chip{appearance:none;border:2px solid var(--ink);background:#fff;font:700 15px var(--mono);min-width:36px;height:34px;cursor:pointer;color:var(--ink);padding:0 6px;transition:transform .08s,background .12s;font-family:var(--mono),"Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji"}
.bp-chip:hover{background:var(--yellow)}.bp-chip:active{transform:translateY(2px)}
.bp-stat{display:flex;justify-content:space-between;font:600 11px var(--mono);letter-spacing:.04em;text-transform:uppercase;gap:8px;flex-wrap:wrap}
.bp-stat b{background:var(--ink);color:var(--paper);padding:0 6px}
.bp-list{height:208px;overflow-y:auto;border:2px solid var(--ink);background:#fff;display:flex;flex-direction:column;gap:0;scrollbar-width:thin}
.bp-r{display:flex;gap:9px;align-items:flex-start;padding:8px 10px;border-bottom:1px solid #d8d2bf;font:600 13.5px/1.25 var(--body);animation:bp-in .35s both;transition:background .25s}
.bp-r i{flex:none;width:20px;height:20px;border:2px solid var(--ink);display:grid;place-items:center;font:800 13px var(--mono);font-style:normal;margin-top:1px;background:var(--red);color:#fff}
.bp-r.ok{background:#e8fbf4}.bp-r.ok i{background:var(--green);color:var(--ink)}
.bp-r.bad{background:#fff0f1}
.bp-r small{display:block;font:600 10px var(--mono);opacity:.55;letter-spacing:.08em;text-transform:uppercase}
.bp-r.bad.was{animation:bp-bad .4s}
@keyframes bp-in{from{opacity:0;transform:translateY(-14px)}to{opacity:1;transform:none}}
@keyframes bp-bad{30%{background:var(--red)}}
.bp-code{display:inline-flex;gap:2px;vertical-align:middle;background:repeating-linear-gradient(45deg,#e9e2cd 0 5px,#f6f1e4 5px 10px);border:2px solid var(--ink);padding:1px 8px;margin:0 3px}
.bp-code u{display:inline-block;font:800 20px var(--mono);text-decoration:none;color:var(--ink)}
.bp-hint{font:italic 12px var(--body);opacity:.65}
`);
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const WORDS = ['robot', 'canard', 'pingouin', 'cactus', 'vautour', 'chaussons'];
const LETT = 'KQXZMWBVJHPNTLDGFS'; // sans E
export default {
  id: 'b_pwd', tier: 5, title: 'Mot de passe (version bureaucratique)', time: 95000,
  mount(host, api) {
    const { h } = api; let alive = true, solved = false;
    const S = api.int(13, 21), word = api.pick(WORDS), L = api.int(28, 32);
    const code = Array.from({ length: 5 }, () => LETT[api.int(0, LETT.length - 1)]).join('');
    const digitsOf = (s) => [...s].filter((c) => c >= '0' && c <= '9').reduce((a, c) => a + +c, 0);
    const len = (s) => [...s].length;
    const codeEl = h('span', { class: 'bp-code', 'aria-label': 'Code : ' + code.split('').join(' ') }, [...code].map((c) => h('u', { style: { transform: `rotate(${api.int(-14, 14)}deg) translateY(${api.int(-2, 2)}px)` } }, c)));
    const rules = [
      { t: ['Au moins ', h('b', {}, '8 caractères'), '. Tout le monde sait que « 1234 » est trop court.'], f: (p) => len(p) >= 8 },
      { t: ['Une ', h('b', {}, 'majuscule'), '. Pour le respect.'], f: (p) => /[A-ZÀ-ÖØ-Ý]/.test(p) },
      { t: ['Un ', h('b', {}, 'chiffre'), '. Au moins un, hélas.'], f: (p) => /[0-9]/.test(p) },
      { t: ['Un caractère spécial : ', h('b', {}, '! ? # @ *')], f: (p) => /[!?#@*]/.test(p) },
      { t: ['Les chiffres doivent totaliser ', h('b', {}, String(S)), ' exactement.'], f: (p) => digitsOf(p) === S, live: (p) => `Σ chiffres = ${digitsOf(p)}` },
      { t: ['Doit contenir un ', h('b', {}, 'mois de l’année'), ' (en français, c’est la loi).'], f: (p) => MONTHS.some((m) => p.toLowerCase().includes(m)) },
      { t: ['Doit contenir le mot « ', h('b', {}, word), ' ». Ne demandez pas.'], f: (p) => p.toLowerCase().includes(word) },
      { t: ['Doit contenir une ', h('b', {}, 'lune 🌙'), '. (Bouton ci-dessous. Nous savons que vous n’avez pas ça sur votre clavier.)'], f: (p) => p.includes('🌙') },
      { t: ['Doit contenir ce code, ', h('b', {}, 'majuscules respectées'), ' : ', codeEl], f: (p) => p.includes(code) },
      { t: ['Ne doit ', h('b', {}, 'jamais'), ' contenir la lettre « ', h('b', {}, 'e'), ' » (sans accent, majuscule ou non). Supprimez-la partout. Même dans ce que vous venez d’écrire.'], f: (p) => !/e/i.test(p) },
      { t: ['Doit contenir ', h('b', {}, 'Gérard'), '. Il se sent seul.'], f: (p) => p.includes('Gérard') },
      { t: ['Doit faire ', h('b', {}, 'exactement ' + L + ' caractères'), '. Ni plus, ni moins. Les emojis comptent pour un.'], f: (p) => len(p) === L, live: (p) => `${len(p)} / ${L} car.` },
      { t: ['Confirmez le mot de passe en le ', h('b', {}, 'retapant'), ' dans la seconde case. Identique. Au caractère près.'], f: (p, c) => p.length > 0 && c === p },
    ];
    const SAY = { 4: 'Cinq règles. C’est confortable. Je ne vous le dis pas deux fois.', 7: 'Un mois, un mot, une lune. Je n’ai pas à justifier la lune.', 9: 'Supprimer les « e » de « mois », par exemple. J’adore ce moment.', 11: 'Gérard est là, il vous regarde.', 12: 'Exactement. Pas environ. Exactement.' };
    const input = h('input', { type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: 'Choisissez un mot de passe…', 'aria-label': 'Mot de passe', maxlength: 80, oninput: update });
    const confirm = h('input', { type: 'text', autocomplete: 'off', spellcheck: 'false', placeholder: 'Confirmez…', 'aria-label': 'Confirmation du mot de passe', disabled: true, maxlength: 80, oninput: update });
    const confWrap = h('div', { class: 'bp-field', style: { display: 'none' } }, confirm);
    const chipBtn = (c, label) => h('button', { class: 'bp-chip', type: 'button', 'aria-label': label || c, onclick: () => { input.value += c; input.focus(); update(); api.sfx('click'); } }, c);
    const chips = h('div', { class: 'bp-chips' }, h('span', {}, 'Clavier d’urgence'), ...['!', '?', '#', '@', '*'].map((c) => chipBtn(c)), chipBtn('🌙', 'lune'));
    const live = h('span', {}, ''), cnt = h('b', {}, '0 car.');
    const list = h('div', { class: 'bp-list', role: 'list', 'aria-live': 'polite' });
    const btn = h('button', { class: 'bk-btn', type: 'button', disabled: true, onclick: submit }, 'Valider le mot de passe');
    const root = h('div', { class: 'bk' }, h('div', { class: 'bp-in' }, h('div', { class: 'bp-field' }, input), confWrap, chips, h('div', { class: 'bp-stat' }, h('span', {}, live), cnt)), list, h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' } }, h('span', { class: 'bk-meta', id: 'bp-prog' }), btn));
    host.append(root);
    const prog = root.querySelector('#bp-prog');
    let revealed = 0; const rows = [];
    function reveal() {
      const n = revealed; const row = h('div', { class: 'bp-r', role: 'listitem' }, h('i', {}, '✗'), h('div', {}, h('small', {}, 'Règle ' + (n + 1) + '/' + rules.length), h('span', {}, ...rules[n].t)));
      rows.push({ row, was: false }); list.prepend(row); list.scrollTop = 0; revealed++; api.sfx('pop');
      if (n === 12) { confWrap.style.display = ''; confirm.disabled = false; }
      if (SAY[n]) api.say(SAY[n], n >= 9 ? 'smug' : 'neutral');
    }
    function update() {
      const p = input.value, c = confirm.value; cnt.textContent = len(p) + ' car.';
      let guard = 0;
      for (;;) {
        let allOk = true; for (let i = 0; i < revealed; i++) if (!rules[i].f(p, c)) { allOk = false; break; }
        if (revealed < rules.length && allOk && guard++ < 20) { reveal(); continue; } break;
      }
      let okN = 0; rows.forEach((r, i) => { const ok = rules[i].f(p, c); r.row.classList.toggle('ok', ok); r.row.classList.toggle('bad', !ok); r.row.firstChild.textContent = ok ? '✓' : '✗'; if (ok) r.was = true; else if (r.was && !r.row.classList.contains('shaken')) { r.was = false; r.row.classList.remove('was'); void r.row.offsetWidth; r.row.classList.add('was'); } if (ok) okN++; });
      const lr = revealed ? rules.slice(0, revealed).reverse().find((r) => r.live) : null; live.textContent = lr ? lr.live(p) : '';
      const all = revealed === rules.length && okN === rules.length; btn.disabled = !all; prog.textContent = `${okN}/${rules.length} règles`;
      if (all && !btn.dataset.rdy) { btn.dataset.rdy = 1; api.sfx('good'); api.say('Tout est conforme. Je suis presque déçu.', 'impressed'); } else if (!all) delete btn.dataset.rdy;
    }
    function submit() { if (solved || btn.disabled) return; solved = true; api.solve(); }
    update();
    if (/cheat=1/.test(location.search)) {
      let d = S; const ds = []; while (d > 0) { const x = Math.min(9, d); ds.push(x); d -= x; }
      const base = 'Gérard' + word + '!' + code + 'mars🌙' + ds.join(''); const pad = L - len(base);
      host.dataset.answer = base + 'x'.repeat(Math.max(0, pad));
    }
    setTimeout(() => alive && input.focus({ preventScroll: true }), 50);
    return { destroy() { alive = false; } };
  }
};
