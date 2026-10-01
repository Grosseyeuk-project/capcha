// Shared helpers for captchas-a (widget frame, css injection, small utils).
export function css(id, text) {
  if (document.getElementById('ak-css-' + id)) return;
  const s = document.createElement('style'); s.id = 'ak-css-' + id; s.textContent = text; document.head.append(s);
}
css('base', `
.ak-w{width:min(100%,380px);margin:0 auto;background:#fff;color:#202124;border:1px solid #c9ccd1;border-radius:6px;box-shadow:0 8px 28px rgba(0,0,0,.28);font:14px/1.35 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;overflow:hidden;user-select:none;-webkit-user-select:none;text-align:left}
.ak-w *{box-sizing:border-box}
.ak-head{background:#1a73e8;color:#fff;padding:12px 16px 13px}
.ak-head small{display:block;font-size:12px;opacity:.88}
.ak-head b{display:block;font-size:21px;line-height:1.15;margin-top:2px;font-weight:700}
.ak-note{font-size:11.5px;color:#5f6368;padding:8px 14px 0;min-height:30px}
.ak-body{padding:10px}
.ak-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 10px 9px 14px;border-top:1px solid #e3e5e8;background:#f8f9fa}
.ak-brand{display:flex;align-items:center;gap:7px;font-size:10px;color:#6b7076;line-height:1.15}
.ak-brand svg{width:22px;height:22px;flex:none}
.ak-btn{appearance:none;background:#1a73e8;color:#fff;border:0;border-radius:3px;padding:10px 20px;font:700 12.5px system-ui,sans-serif;text-transform:uppercase;letter-spacing:.05em;cursor:pointer;transition:background .15s,transform .08s,box-shadow .15s;box-shadow:0 1px 2px rgba(0,0,0,.3);min-height:38px}
.ak-btn:hover:not(:disabled){background:#1765cc;box-shadow:0 2px 6px rgba(26,115,232,.45)}
.ak-btn:active:not(:disabled){transform:translateY(1px);box-shadow:none}
.ak-btn:disabled{background:#b9c3d3;cursor:not-allowed;box-shadow:none}
.ak-btn:focus-visible,.ak-w :focus-visible{outline:3px solid #fbbc04;outline-offset:2px}
.ak-ghost{appearance:none;background:transparent;border:1px solid transparent;border-radius:50%;width:34px;height:34px;color:#5f6368;cursor:pointer;display:grid;place-items:center;font-size:17px;transition:background .15s,transform .3s}
.ak-ghost:hover{background:#e8eaed}.ak-ghost:active{transform:rotate(90deg)}
@keyframes ak-shake{10%,90%{transform:translateX(-2px)}20%,80%{transform:translateX(4px)}30%,50%,70%{transform:translateX(-7px)}40%,60%{transform:translateX(7px)}}
@keyframes ak-pop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.12)}100%{transform:scale(1);opacity:1}}
.ak-shake{animation:ak-shake .5s}
.ak-ok{outline:3px solid #34a853;outline-offset:-3px}
@media (prefers-reduced-motion:reduce){.ak-shake{animation:none}.ak-w *{transition:none!important;animation:none!important}}
`);
export const ORDER = ['a_checkbox', 'a_wavy', 'a_grid', 'a_math', 'a_slider', 'a_bins', 'a_order', 'a_rotate'];
const TIMES = { a_wavy: 30000, a_grid: 35000, a_math: 40000, a_slider: 30000, a_bins: 45000, a_order: 40000, a_rotate: 50000 };
export const RULES = [
  { after: 'a_checkbox', k: 'R1', t: 'minuscules', full: 'Toute réponse tapée doit être en minuscules. Sans exception, sans clémence.' },
  { after: 'a_wavy', k: 'R2', t: 'sans chiffres', full: 'Les nombres s’écrivent en toutes lettres, partout : réponses, numéros, classements.' },
  { after: 'a_grid', k: 'R3', t: 'calme', full: '« Vérifier » ne s’active qu’après 2 s : preuve de calme.' },
  { after: 'a_slider', k: 'R4', t: 'bacs mobiles', full: 'Les bacs de tri peuvent changer de côté en cours de route. Le règlement ne dit pas quand.' },
  { after: 'a_bins', k: 'R5', t: 'sens révocable', full: 'Le sens d’un classement peut être rectifié en cours de route, sans préavis.' },
  { after: 'a_order', k: 'R6', t: '↑ HS · 2 poses', full: 'Le bouton ↑ est en maintenance. Une seule pose étant suspecte, il en faut deux.' }
];
export const lvOf = (id) => Math.max(0, ORDER.indexOf(id));
export const rulesFor = (id) => RULES.filter((r) => ORDER.indexOf(r.after) < ORDER.indexOf(id));
export const hasRule = (id, k) => rulesFor(id).some((r) => r.k === k);
// shared across captchas for the page's lifetime; reset by the first card
export const S = { pen: 0, last: '', lastT: 0, lastId: '', upper: false, straight: false, flips: 0 };
export const resetS = () => Object.assign(S, { pen: 0, last: '', lastT: 0, lastId: '', upper: false, straight: false, flips: 0 });
export const infraction = (what) => { S.pen++; if (what === 'upper') S.upper = true; };
export const coarse = () => { try { return matchMedia('(pointer:coarse)').matches; } catch { return false; } };
css('esc', `
.ak-w{--ak-hb:#1a73e8;--ak-hf:#fff;--ak-acc:#1a73e8;--ak-acc2:#1765cc;--ak-bg:#fff;--ak-ft:#f8f9fa;--ak-bd:#c9ccd1}
.ak-w{background:var(--ak-bg);border-color:var(--ak-bd)}
.ak-body{color:#202124}
.ak-head{background:var(--ak-hb);color:var(--ak-hf);position:relative;overflow:hidden}
.ak-foot{background:var(--ak-ft)}
.ak-btn{background:var(--ak-acc);min-width:118px}.ak-btn:hover:not(:disabled){background:var(--ak-acc2)}
.ak-btn:disabled{font-size:11px;letter-spacing:.02em}
.ak-sub{display:block;font-size:10.5px;letter-spacing:.04em;opacity:.9;margin-top:3px;min-height:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ak-inc{display:block;background:#fdecea;color:#8c1d18;border-bottom:1px solid #f4b8b3;padding:6px 12px;font-size:11.5px;line-height:1.3;animation:ak-pop .25s both;max-height:60px;overflow:hidden;transition:max-height .4s,padding .4s,opacity .4s}
.ak-inc.old{background:#fff4d6;color:#664d03;border-color:#ecd48a}.ak-inc.gone{max-height:0;padding-top:0;padding-bottom:0;opacity:0}
.ak-inc.rule{background:#e8f0fe;color:#174ea6;border-color:#aecbfa}
.ak-st{display:flex;align-items:center;gap:6px;padding:6px 10px 0;min-height:26px}
.ak-rb{appearance:none;border:1px solid #ecd48a;background:#fff3cd;color:#664d03;border-radius:10px;font:700 10px/1 system-ui;letter-spacing:.04em;text-transform:uppercase;padding:5px 8px;cursor:pointer;flex:none}
.ak-rb:hover{background:#ffe8a1}
.ak-pen{font:700 10px/1 system-ui;color:#b3261e;flex:none}
.ak-mock{display:flex;align-items:center;gap:6px;margin-left:auto;font-size:10.5px;color:#5f6368;min-width:0;appearance:none;background:none;border:0;cursor:pointer;font-family:inherit;padding:0}
.ak-mock span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.ak-mock i{flex:none;width:15px;height:15px;border:2px solid #9aa0a6;border-radius:3px;display:grid;place-items:center;font-style:normal;font-size:11px;font-weight:900;line-height:1;color:#188038}
.ak-mock:hover i{border-color:var(--ak-acc)}
.ak-rlist{margin:0;padding:6px 14px 2px 28px;font-size:11px;color:#5f6368;line-height:1.35}
.ak-rlist b{color:#202124}
@media (max-width:480px),(max-height:700px){.ak-head{padding:8px 12px 9px}.ak-head b{font-size:18px}.ak-head small{font-size:11px}.ak-note{padding:5px 12px 0;min-height:0;font-size:11px}.ak-body{padding:8px}.ak-foot{padding:6px 8px 6px 10px}.ak-sub{font-size:10px;margin-top:2px}.ak-brand span{font-size:9px}}
/* escalation */
.ak-w[data-lv="3"]{--ak-hb:linear-gradient(100deg,#6a1b9a,#ad1457);--ak-acc:#8e24aa;--ak-acc2:#7b1fa2;transform:rotate(-.3deg)}
.ak-w[data-lv="3"] .ak-head b{font-family:Georgia,serif;font-style:italic}
.ak-w[data-lv="4"]{--ak-hb:repeating-linear-gradient(-45deg,#ffca28 0 14px,#212121 14px 28px);--ak-hf:#fff;--ak-acc:#e65100;--ak-acc2:#bf360c;--ak-ft:#fff8e1;transform:rotate(.45deg)}
.ak-w[data-lv="4"] .ak-head b,.ak-w[data-lv="4"] .ak-head small,.ak-w[data-lv="4"] .ak-sub{background:#212121;color:#ffca28;display:table;padding:1px 6px;margin-top:3px}
.ak-w[data-lv="5"]{--ak-hb:#050a06;--ak-hf:#6cff8f;--ak-acc:#0c7a2b;--ak-acc2:#0a5f21;--ak-ft:#0b130d;--ak-bd:#1c7a36;--ak-bg:#0b130d;transform:rotate(-.6deg)}
.ak-w[data-lv="5"] .ak-head,.ak-w[data-lv="5"] .ak-note,.ak-w[data-lv="5"] .ak-brand{font-family:ui-monospace,Menlo,Consolas,monospace}
.ak-w[data-lv="5"] .ak-note,.ak-w[data-lv="5"] .ak-brand,.ak-w[data-lv="5"] .ak-mock,.ak-w[data-lv="5"] .ak-rlist{color:#6cff8f}
.ak-w[data-lv="5"] .ak-rlist b{color:#b9ffc9}
.ak-w[data-lv="5"] .ak-head b::before{content:"> "}
.ak-w[data-lv="6"]{--ak-hb:#fff;--ak-hf:#b3261e;--ak-acc:#b3261e;--ak-acc2:#8c1d18;--ak-bg:#fffdf5;--ak-bd:#b3261e;border-style:dashed;border-width:2px;transform:rotate(.9deg) skewX(-.6deg)}
.ak-w[data-lv="6"] .ak-head{border-bottom:3px double #b3261e}
.ak-w[data-lv="6"] .ak-head b{text-transform:uppercase;letter-spacing:.04em;font-family:"Courier New",monospace}
.ak-w[data-lv="7"]{--ak-hb:#000;--ak-hf:#ff3b30;--ak-acc:#ff3b30;--ak-acc2:#d32f2f;--ak-bg:#140607;--ak-ft:#1d0a0b;--ak-bd:#ff3b30;animation:ak-glitch 4s infinite steps(1)}
.ak-w[data-lv="7"] .ak-note,.ak-w[data-lv="7"] .ak-brand,.ak-w[data-lv="7"] .ak-mock,.ak-w[data-lv="7"] .ak-rlist{color:#ff8a80}
.ak-w[data-lv="7"] .ak-rlist b{color:#ffd0cc}
.ak-w[data-lv="7"] .ak-head b{text-shadow:2px 0 #0ff,-2px 0 #f0f}
.ak-w[data-lv="7"] .ak-body{background:#fff}
@keyframes ak-glitch{0%,92%,100%{transform:none;filter:none}93%{transform:translate(4px,-2px) skewX(3deg);filter:hue-rotate(60deg)}95%{transform:translate(-5px,1px);filter:invert(.15)}97%{transform:translate(2px,2px) skewX(-4deg)}}
@media (max-width:480px){.ak-w[data-lv]{transform:rotate(0)}.ak-w[data-lv="6"]{transform:rotate(.4deg)}}
@media (prefers-reduced-motion:reduce){.ak-w{transform:none!important;animation:none!important}}
`);
const SUB = ['', 'Dossier n° 4471 · pièce 2', 'Dossier n° 4471 · pièce 3 · règles en vigueur', 'Pièce 4/8 · votre patience est notée', 'FORMULAIRE 27-B/6 · à remplir en deux exemplaires', 'ATTENTION : l’interface se dégrade (c’est normal)', 'Ce widget n’est plus garanti. Ni remboursé.', 'reCAPCHA a démissionné. Voici un widget de remplacement.'];
const BRAND2 = ['Confidentialité · Conditions', 'Confidentialité · Conditions', 'Confidentialité · Conditions', 'Confidentialité (non) · Conditions', 'Confidentialité (non) · Conditions (pire)', 'Données revendues · Conditions', 'Aucune confidentialité', 'reCAPCHA™ (non remboursable)'];
const MOCK = [null, null, null, ['☑', 'Pas un robot (rappel pièce 1)'], ['☑', 'Pas un robot (sous réserve)'], ['☑', 'Pas un robot (en révision)'], ['☐', 'Case décochée par la direction'], ['☐', 'Peut-être un robot']];
const MOCKSAY = ['', '', '', 'Oui, oui, vous avez coché. Je m’en souviens très bien.', 'Cette case a été cochée à la pièce 1. Elle vous observe depuis.', 'Vous n’êtes pas un robot. Pour l’instant. Sur le papier.', 'La direction a décoché votre case. Elle dit que c’était une erreur de saisie.', 'Je ne dis pas que vous êtes un robot. Je dis que la case, elle, ne le dit plus.'];
const LOGO = `<svg viewBox="0 0 24 24"><path fill="#4285f4" d="M21 12a9 9 0 0 1-2.6 6.4l-2.1-2.1A6 6 0 0 0 18 12z"/><path fill="#1a73e8" d="M12 3a9 9 0 0 1 8.6 6.3l-2.9.9A6 6 0 0 0 12 6z"/><path fill="#9aa0a6" d="M3 12a9 9 0 0 1 9-9v3a6 6 0 0 0-6 6z"/><path fill="#34a853" d="M12 21a9 9 0 0 1-9-9h3a6 6 0 0 0 6 6z"/></svg>`;
export function brand(h, lv = 0) {
  const b = h('div', { class: 'ak-brand' }); b.innerHTML = LOGO + `<span><b style="font-size:11px">${lv >= 6 ? '<s>reCAPCHA</s> CAPCHA' : 'reCAPCHA'}</b><br>${BRAND2[lv]}</span>`; return b;
}
// frame: standard verification widget. returns {el, body, btn, shake(), banner(text, kind)}
export function frame(h, { api, id, small, title, note, body, verify = 'Vérifier', onVerify, extra }) {
  const lv = lvOf(id), rules = rulesFor(id);
  const patient = rules.some((r) => r.k === 'R3');
  const btn = h('button', { class: 'ak-btn', type: 'button', onclick: () => onVerify && onVerify() }, verify);
  const noteEl = note != null ? h('div', { class: 'ak-note' }, note) : null;
  const sub = h('span', { class: 'ak-sub' }, SUB[lv]);
  const head = h('div', { class: 'ak-head' }, h('small', {}, small || 'Sélectionnez'), h('b', {}, title), sub);
  let st = null, list = null;
  if (rules.length || MOCK[lv]) {
    st = h('div', { class: 'ak-st' });
    if (rules.length) {
      list = h('ol', { class: 'ak-rlist' }, rules.map((r) => h('li', {}, h('b', {}, r.k + ' ' + r.t + ' : '), r.full))); list.hidden = true;
      const rb = h('button', { class: 'ak-rb', type: 'button', 'aria-expanded': 'false', onclick: () => { list.hidden = !list.hidden; rb.setAttribute('aria-expanded', String(!list.hidden)); rb.textContent = rules.length + ' règle' + (rules.length > 1 ? 's' : '') + (list.hidden ? ' ▾' : ' ▴'); } }, rules.length + ' règle' + (rules.length > 1 ? 's' : '') + ' ▾');
      st.append(rb);
    }
    if (S.pen) st.append(h('span', { class: 'ak-pen', title: 'Chaque infraction coûte 5 s sur les cartes suivantes.' }, '−' + S.pen * 5 + ' s'));
    if (MOCK[lv]) st.append(h('button', { class: 'ak-mock', type: 'button', onclick: () => api && api.say(MOCKSAY[lv], 'smug') }, h('i', {}, MOCK[lv][0]), h('span', {}, MOCK[lv][1])));
  }
  const el = h('div', { class: 'ak-w', role: 'group', 'aria-label': title, 'data-lv': lv },
    head, st, list, noteEl, h('div', { class: 'ak-body' }, body),
    h('div', { class: 'ak-foot' }, h('div', { style: { display: 'flex', alignItems: 'center', gap: '6px' } }, extra, brand(h, lv)), btn));
  let inc = null;
  const banner = (m, kind, ms = 6000) => { inc?.remove(); inc = h('div', { class: 'ak-inc ' + (kind || ''), role: 'alert' }, m); head.after(inc); const me = inc; if (ms) setTimeout(() => { me.classList.add('gone'); setTimeout(() => me.remove(), 450); }, ms); };
  if (S.last && S.lastId === id && Date.now() - S.lastT < 15000) banner('Essai précédent : ' + S.last, 'old', 5000);
  if (api) {
    const f = api.fail; api.fail = (m, o) => { S.last = m || ''; S.lastT = Date.now(); S.lastId = id; if (m) banner(m, '', 0); return f(m, o); };
    const so = api.solve; api.solve = () => { S.last = ''; return so(); };
    const T = TIMES[id]; if (S.pen && T) api.timer(Math.max(12000, T - S.pen * 5000));
  }
  if (patient) {
    const labs = ['Respirez…', 'Encore un peu…'];
    btn.disabled = true; let n = 2; btn.textContent = labs[0];
    const t = setInterval(() => { if (!el.isConnected) return clearInterval(t); n--; if (n <= 0) { btn.disabled = false; btn.textContent = verify; clearInterval(t); } else btn.textContent = labs[1]; }, 1000);
  }
  return { el, btn, noteEl, banner, shake() { el.classList.remove('ak-shake'); void el.offsetWidth; el.classList.add('ak-shake'); } };
}
export const numWords = (n) => {
  const u = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const t = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'];
  if (n < 20) return u[n];
  if (n < 70) { const d = Math.floor(n / 10), r = n % 10; return t[d] + (r === 1 ? ' et un' : r ? '-' + u[r] : ''); }
  if (n < 80) { const r = n - 60; return 'soixante' + (r === 11 ? ' et onze' : '-' + u[r]); }
  if (n < 100) { const r = n - 80; return 'quatre-vingt' + (r === 0 ? 's' : '-' + u[r]); }
  const c = Math.floor(n / 100), r = n % 100;
  return (c === 1 ? 'cent' : u[c] + ' cent') + (r ? ' ' + numWords(r) : (c > 1 ? 's' : ''));
};
