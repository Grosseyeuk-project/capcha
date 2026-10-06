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
  { after: 'a_grid', k: 'R2', t: 'sans chiffres', full: 'Les nombres s’écrivent en toutes lettres, partout : réponses, numéros, classements.' },
  { after: 'a_math', k: 'R3', t: 'calme', full: '« Vérifier » ne s’active qu’après 2 s : preuve de calme.' },
  { after: 'a_slider', k: 'R4', t: 'bacs mobiles', full: 'Les bacs de tri peuvent changer de côté en cours de route. Le règlement ne dit pas quand.' },
  { after: 'a_bins', k: 'R5', t: 'sens révocable', full: 'Le sens d’un classement peut être rectifié en cours de route, sans préavis.' },
  { after: 'a_order', k: 'R6', t: '↑ HS, 2 poses', full: 'Le bouton ↑ est en maintenance. Une seule pose étant suspecte, il en faut deux.' }
];
export const lvOf = (id) => Math.max(0, ORDER.indexOf(id));
export const rulesFor = (id) => []; // POLICY: no cross-card rules, instructions never change mid-game
export const hasRule = (id, k) => rulesFor(id).some((r) => r.k === k);
// shared across captchas for the page's lifetime; reset by the first card
export const S = { entries: [], pen: 0, last: '', lastT: 0, lastId: '', upper: false, straight: false, left: 30000, hit: {} };
// ---- Dossier: persistent list of the player's earlier answers, judged live against the CURRENT rules ----
export const canon = (e, rules) => {
  const has = (k) => rules.some((r) => r.k === k); let t = String(e.base ?? e.label ?? '');
  if (e.kind === 'count') t = has('R2') ? `${numWords(e.val)} ${e.noun}` : `${e.val} ${e.noun}`;
  if (e.kind === 'num') t = has('R2') ? numWords(e.val) : String(e.val);
  if (has('R4') && e.kind === 'num' && t.length > 12) t = roman(e.val).toLowerCase();
  if (e.kind === 'word' && has('R6')) t = e.base.slice(0, 6);
  if (has('R1')) t = t.toLowerCase();
  return t;
};
const DEFAULTS = { a_checkbox: { kind: 'plain', label: 'case', base: 'Case cochée' }, a_wavy: { kind: 'word', label: 'texte tordu' }, a_grid: { kind: 'count', label: 'images', val: 3, noun: 'vélos' }, a_math: { kind: 'num', label: 'calcul' }, a_slider: { kind: 'plain', label: 'puzzle', base: 'Pièce replacée' }, a_bins: { kind: 'plain', label: 'tri', base: 'Tri validé' }, a_order: { kind: 'plain', label: 'classement', base: 'Classement validé' } };
export function logEntry(id, e) { S.entries = S.entries.filter((x) => x.id !== id); const d = { ...DEFAULTS[id], ...e, id }; if (d.kind === 'word' && !d.base) d.base = (S.word || 'puzzle').toLowerCase(); if (d.kind === 'num') { d.val = d.val ?? S.mathVal ?? 42; d.base = String(d.val); } d.text = canon(d, rulesFor(id)); S.entries.push(d); S.entries.sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id)); }
function ensureEntries(id) { for (const pid of ORDER.slice(0, ORDER.indexOf(id))) if (!S.entries.some((x) => x.id === pid)) logEntry(pid, {}); }
export const resetS = () => { S.entries = []; delete S.word; delete S.mathWords; delete S.mathVal; return Object.assign(S, { pen: 0, last: '', lastT: 0, lastId: '', upper: false, straight: false, left: 30000, hit: {} }); };
const REL = { a_wavy: ['R1'], a_math: ['R1', 'R2'], a_slider: ['R1', 'R3'], a_bins: ['R1', 'R2', 'R3', 'R4'], a_order: ['R1', 'R2', 'R3', 'R5'], a_rotate: ['R1', 'R3', 'R6'] };
const RULESAY = { R1: 'Nouvelle règle : tout ce que vous tapez, en minuscules. Je ne crie pas, donc vous non plus.', R2: 'Nouvelle règle : plus un seul chiffre. Les nombres, en toutes lettres. Je les épelle très bien, moi.', R3: 'Nouvelle règle : « Vérifier » se débloque après deux secondes. Respirez. C’est un ordre.', R4: 'Nouvelle règle : les bacs de tri peuvent déménager. Gardez un œil dessus.', R5: 'Nouvelle règle : le sens d’un classement est révocable. Par moi. Quand je veux.', R6: 'Nouvelle règle : le bouton ↑ est en panne, et une seule pose est suspecte. Il en faut deux.' };
export const roman = (n) => { const m = [[100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]; let r = ''; for (const [v, t] of m) while (n >= v) { r += t; n -= v; } return r; };
export function zap(h, inp, text = 'BZZT !') {
  const par = inp.parentElement; if (!par) return; if (getComputedStyle(par).position === 'static') par.style.position = 'relative';
  inp.classList.remove('ak-wob'); void inp.offsetWidth; inp.classList.add('ak-wob');
  const z = h('span', { class: 'ak-zap' }, text); z.style.left = inp.offsetLeft + 8 + 'px'; z.style.top = inp.offsetTop - 6 + 'px'; par.append(z); setTimeout(() => z.remove(), 800);
}
// First infraction of a rule = warning (-5 s). Next ones = a real strike. Returns true when handled as a warning.
export function ruleHit(api, fr, k, msg) {
  S.pen++; if (k === 'R1') S.upper = true;
  fr.rule(k, 'bad'); fr.shake();
  if (!S.hit[k]) { S.hit[k] = 1; api.timer(Math.max(6000, S.left - 5000)); fr.banner(msg + ' Avertissement : −5 s. Récidive = erreur.', 'warn', 4500); api.say('Premier avertissement pour la règle ' + k + '. Je note, je ne punis pas. Encore.', 'smug'); api.sfx('bad'); return true; }
  api.fail(msg + ' (Récidive.)'); return false;
}
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
.ak-w{position:relative}.ak-inc{position:absolute;left:0;right:0;z-index:6;box-shadow:0 4px 10px rgba(0,0,0,.2);pointer-events:none}.ak-inc.old{animation:ak-oldfade 5s forwards}@keyframes ak-oldfade{0%,35%{opacity:1}60%,100%{opacity:0}}
.ak-st{display:flex;align-items:center;gap:6px;padding:6px 10px 0;min-height:46px}
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
css('live', `
.ak-inc{z-index:20;max-height:none;padding:8px 12px;font-size:12px;border-bottom:2px solid #f4b8b3;cursor:pointer;box-shadow:0 6px 14px rgba(0,0,0,.25);transition:opacity .4s}
.ak-inc.warn{background:#fff4d6;color:#664d03;border-color:#ecd48a}
.ak-inc.gone{max-height:none;padding:8px 12px;opacity:0;pointer-events:none}
.ak-st{min-height:0;display:flex;align-items:center;flex-wrap:wrap;gap:5px;padding:7px 10px 0}
.ak-lc{font:600 12px/1 system-ui,sans-serif;padding:5px 8px;border-radius:12px;display:inline-flex;align-items:center;gap:5px;background:#f1f3f4;color:#5f6368;transition:background .15s,color .15s}
.ak-lc i{width:8px;height:8px;border-radius:50%;background:#9aa0a6;flex:none}
.ak-lc.ok{background:#e6f4ea;color:#137333}.ak-lc.ok i{background:#34a853}
.ak-lc.bad{background:#fce8e6;color:#c5221f}.ak-lc.bad i{background:#d93025}.ak-lc.hit{animation:ak-shake .4s}
.ak-lc.warn{background:#fff4d6;color:#8a6100}.ak-lc.warn i{background:#f9ab00}
.ak-lc.info{background:#e8f0fe;color:#174ea6}.ak-lc.info i{background:#1a73e8}
.ak-rb{font:700 11px/1 system-ui;border-radius:12px;padding:6px 9px;text-transform:none;letter-spacing:.02em}
.ak-sub{white-space:normal;overflow:visible;text-overflow:clip;min-height:0;font-size:11px;line-height:1.25}
.ak-mock{font-size:12px}
@media (max-width:480px){.ak-head small,.ak-note{font-size:12px}.ak-mock{font-size:11.5px}.ak-sub{font-size:11px}.ak-brand span{font-size:10px}}
`);
css('live2', `
.ak-drain{font:800 12px/1 system-ui;color:#c5221f;background:#fce8e6;border-radius:12px;padding:5px 8px;animation:ak-shake .4s}
.ak-viol{border-color:#d93025!important;background:#fff5f5!important;color:#c5221f!important;box-shadow:0 0 0 3px rgba(217,48,37,.18)!important}
.ak-btn:disabled{font-size:12px}
.ak-lc{padding:4px 7px;gap:4px}
.ak-st{gap:4px;padding:6px 10px 0;min-height:0}
.ak-inc{pointer-events:none;font-size:12.5px;line-height:1.3}
@media (min-width:900px){.ak-w{width:min(100%,520px)}.ak-note{font-size:13px}}
`);
css('live3', `
.ak-stamp{position:absolute;right:8px;top:7px;border:2px solid currentColor;color:#fff;font:900 12px/1.1 system-ui;letter-spacing:.06em;padding:3px 6px;border-radius:3px;transform:rotate(-5deg);background:rgba(0,0,0,.28);pointer-events:none;animation:ak-stm .5s cubic-bezier(.2,1.5,.4,1) both,ak-fadeo .5s 3.8s forwards;z-index:2}
@keyframes ak-stm{from{opacity:0;top:-14px}to{opacity:1;top:7px}}
@keyframes ak-fadeo{to{opacity:0}}
.ak-lc.new{animation:ak-drop .7s cubic-bezier(.2,1.4,.4,1) both;outline:2px solid #f9ab00;outline-offset:1px}
@keyframes ak-drop{from{transform:translateY(-26px);opacity:0}to{transform:none;opacity:1}}
.ak-more{appearance:none;border:1px dashed #9aa0a6;background:transparent;color:#5f6368;border-radius:12px;font:700 12px/1 system-ui;padding:5px 9px;min-height:26px;cursor:pointer}
.ak-pen{font:700 12px/1 system-ui;color:#b3261e;background:#fce8e6;border-radius:12px;padding:5px 8px}
.ak-drain{font:800 12px/1 system-ui;white-space:nowrap}
.ak-mock{flex:none;min-width:auto;font-size:12px!important}
.ak-mock span{overflow:visible;text-overflow:clip}
.ak-st{flex-wrap:wrap}
.ak-zap{position:absolute;z-index:9;pointer-events:none;font:900 12px/1 system-ui;color:#fff;background:#d93025;border-radius:4px;padding:3px 6px;animation:ak-zp .8s ease-out both}
@keyframes ak-zp{from{transform:translateY(0) rotate(-6deg) scale(.6);opacity:1}to{transform:translateY(-26px) rotate(4deg) scale(1.2);opacity:0}}
.ak-wob{animation:ak-shake .35s}
.cap-host .ak-w .ak-st{flex-wrap:wrap!important;overflow:visible!important}
.cap-host .ak-w .ak-st>*{flex:none}
.ak-lc[hidden],.ak-drain[hidden],.ak-more[hidden],.ak-dosp[hidden]{display:none!important}
`);
css('live4', `
.ak-newtag{font:900 12px/1 system-ui;letter-spacing:.05em;color:#fff;background:#d93025;border-radius:3px;padding:5px 7px;transform:rotate(-3deg);animation:ak-nt .5s cubic-bezier(.2,1.5,.4,1) both}
@keyframes ak-nt{from{opacity:0;transform:translateX(-20px) rotate(-3deg)}to{opacity:1;transform:rotate(-3deg)}}
.ak-dos{appearance:none;border:1px solid #c9ccd1;background:#fff;color:#1a3d7c;border-radius:6px;font:700 12px/1.1 system-ui;padding:0 10px;min-height:44px;cursor:pointer}
.ak-dos:hover{background:#e8f0fe}
.ak-dosp{flex-basis:100%;font:600 12px/1.4 ui-monospace,Menlo,monospace;background:#fffbe6;border:1px dashed #d4b106;border-radius:4px;padding:6px 8px;color:#614700}
.ag-cap,.ab-cap,.ao-cap{font-size:12px;line-height:1.35;color:#202124;margin:0 0 8px}
`);
css('dz', `
.ak-dz{display:flex;align-items:center;gap:4px;padding:6px 10px 0;flex-wrap:wrap}
.ak-dl{font:700 12px/1 system-ui;color:#5f6368;margin-right:2px}
.ak-dc{appearance:none;min-width:40px;height:40px;border-radius:50%;border:2px solid #34a853;background:#e6f4ea;color:#137333;font:800 12px/1 system-ui;cursor:pointer;padding:0 4px}
.ak-dc.bad{border-color:#d93025;background:#fce8e6;color:#c5221f;animation:ak-shake .5s 2}
.ak-dd{margin:6px 10px 0;padding:8px;border:1px solid #c9ccd1;border-radius:6px;background:#f8f9fa;display:flex;flex-direction:column;gap:6px;color:#202124;font-size:12px;line-height:1.35}
.ak-dt.bad{color:#c5221f;font-weight:600}
.ak-dfix{height:44px;border:2px solid #c9ccd1;border-radius:4px;font:700 15px ui-monospace,Menlo,monospace;padding:0 8px;background:#fff;color:#202124}.ak-dfix:focus{outline:0;border-color:#1a73e8}
.ak-dd[hidden]{display:none!important}
`);
const SUB = ['', 'Dossier n° 4471 · pièce 2', 'Dossier 4471 · pièce 3', 'Pièce 4/8 · patience notée', 'FORMULAIRE 27-B/6 · 2 exemplaires', 'ATTENTION : interface en dégradation', 'Widget non garanti. Ni remboursé.', 'reCAPCHA a démissionné. Remplaçant.'];
const BRAND2 = ['Confidentialité · Conditions', 'Confidentialité · Conditions', 'Confidentialité · Conditions', 'Vie privée (non) · Conditions', 'Vie privée (non) · Conditions', 'Données revendues', 'Aucune confidentialité', 'Non remboursable'];
const MOCK = [];
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
  let st = null, list = null, drainEl = null; const chips = {}, bad = new Set(); let drained = 0, dt = 0;
  const rel = REL[id] || [], isNew = (r) => ORDER.indexOf(r.after) === lv - 1;
  if (rules.length || MOCK[lv]) {
    st = h('div', { class: 'ak-st' });
    const dormant = [];
    for (const r of rules) {
      const c = h('span', { class: 'ak-lc ' + (r.k === 'R3' ? 'warn' : /R[456]/.test(r.k) ? 'info' : 'ok') + (isNew(r) ? ' new' : ''), 'data-k': r.k, title: r.full }, h('i'), r.k + ' ' + r.t); chips[r.k] = c;
      if (rel.includes(r.k) || isNew(r)) st.append(c); else { c.hidden = true; dormant.push(c); st.append(c); }
    }
    if (dormant.length) { const mb = h('button', { class: 'ak-more', type: 'button', 'aria-label': dormant.length + ' règles dormantes', onclick: () => { const on = dormant[0].hidden; dormant.forEach((c) => { c.hidden = !on; }); mb.textContent = on ? '−' : '+' + dormant.length; } }, '+' + dormant.length); st.append(mb); }
    drainEl = h('span', { class: 'ak-drain', hidden: '', title: 'Tant qu’une règle est violée, le chrono perd 1 s par seconde (5 s max).' }, ''); st.append(drainEl);
    if (S.pen) st.append(h('span', { class: 'ak-pen', title: 'Chaque infraction passée coûte 5 s sur les cartes suivantes.' }, 'Pénalités −' + S.pen * 5 + ' s'));
    if (MOCK[lv]) st.append(h('button', { class: 'ak-mock', type: 'button', onclick: () => api && api.say(MOCKSAY[lv], 'smug') }, h('i', {}, MOCK[lv][0]), h('span', {}, MOCK[lv][1])));
  }
  // dossier strip
  const ents = [];
  const bad2 = () => ents.filter((e) => e.text !== canon(e, rules));
  let dz = null, dd = null; const dcs = [];
  const causeOf = (e) => { const act = [...rules].reverse(); for (const r of act) if (e.text === canon(e, rules.filter((x) => x.k !== r.k))) return r; return null; };
  function refresh() {
    const reds = bad2(); dcs.forEach(([e, c]) => { const ok = e.text === canon(e, rules); c.className = 'ak-dc ' + (ok ? 'ok' : 'bad'); });
    el.dataset.dfix = JSON.stringify(Object.fromEntries(reds.map((e) => [ents.indexOf(e) + 1, canon(e, rules)])));
    if (typeof setLock === 'function') setLock();
  }
  function openEntry(e) {
    const n = ents.indexOf(e) + 1; dd.hidden = false; dd.innerHTML = '';
    const ok = e.text === canon(e, rules), r = ok ? null : causeOf(e);
    dd.append(h('div', { class: 'ak-dt' }, h('b', {}, roman(n) + ' · ' + e.label + ' : '), '« ' + e.text + ' »', ok ? '  conforme' : ''));
    if (!ok) {
      dd.append(h('div', { class: 'ak-dt bad' }, r ? `${r.k} (${r.t}) : cette entrée n’est plus conforme. Réécrivez-la.` : 'Cette entrée n’est plus conforme. Réécrivez-la.'));
      const inp = h('input', { class: 'ak-dfix', type: 'text', value: e.text, autocomplete: 'off', autocapitalize: 'none', autocorrect: 'off', spellcheck: 'false', 'aria-label': 'Corriger l’entrée ' + roman(n), oninput: () => { const v = inp.value.trim(); if (v === canon(e, rules)) { e.text = v; api && api.sfx('good'); dd.hidden = true; refresh(); const nx = bad2()[0]; if (nx) openEntry(nx); } else inp.classList.toggle('ak-viol', v !== v.toLowerCase() && rules.some((x) => x.k === 'R1')); } });
      dd.append(inp);
    }
  }
  if (ents.length) {
    dz = h('div', { class: 'ak-dz' }, h('span', { class: 'ak-dl' }, 'Dossier'));
    ents.forEach((e, i) => { const c = h('button', { class: 'ak-dc ok', type: 'button', title: e.label, 'data-n': i + 1, 'aria-label': 'Entrée ' + roman(i + 1) + ' ' + e.label, onclick: () => { if (!dd.hidden && dd.dataset.n == i + 1) { dd.hidden = true; return; } dd.dataset.n = i + 1; openEntry(e); } }, roman(i + 1)); dcs.push([e, c]); dz.append(c); });
    dd = h('div', { class: 'ak-dd', hidden: '' });
  }
  const newRules = rules.filter(isNew); if (newRules.length && st) st.prepend(h('span', { class: 'ak-newtag' }, 'NOUVELLE RÈGLE'));
  const foot = h('div', { class: 'ak-foot' }, h('div', { style: { display: 'flex', alignItems: 'center', gap: '6px' } }, extra, brand(h, lv)), btn);
  const el = h('div', { class: 'ak-w', role: 'group', 'aria-label': title, 'data-lv': lv },
    head, st, dz, dd, list, noteEl, h('div', { class: 'ak-body' }, body), foot);
  let inc = null;
  const drain = () => { if (dt || !api) return; dt = setInterval(() => { if (!el.isConnected || !bad.size) { clearInterval(dt); dt = 0; return; } if (drained >= 5) return; drained++; api.timer(Math.max(3000, S.left - 1000)); if (drainEl) { drainEl.hidden = false; drainEl.textContent = '⏱ −1 s/s : −' + drained + ' s'; } api.sfx('tick'); }, 1000); };
  const banner = (m, kind, ms = 4500) => { inc?.remove(); const me = inc = h('div', { class: 'ak-inc ' + (kind || ''), role: 'alert', title: 'Toucher pour fermer', onclick: () => { me.classList.add('gone'); setTimeout(() => me.remove(), 450); } }, m); me.style.top = head.offsetHeight + 'px'; me.style.bottom = 'auto'; el.append(me); setTimeout(() => { me.classList.add('gone'); setTimeout(() => me.remove(), 450); }, ms || 9000); };
  if (api) {
    const f = api.fail; api.fail = (m, o) => { S.last = m || ''; S.lastT = Date.now(); S.lastId = id; return f(m, o); };
    const so = api.solve; api.solve = () => { S.last = ''; if (!S.entries.some((x) => x.id === id)) logEntry(id, {}); return so(); };
    api.onTick((l) => { S.left = l; });
    if (newRules.length) setTimeout(() => el.isConnected && api.say(RULESAY[newRules[0].k], 'smug'), 700);
    const T = TIMES[id]; if (S.pen && T) api.timer(Math.max(12000, T - S.pen * 5000));
    const A = { a_math: S.upper ? 'À la carte 2, vous aviez écrit en majuscules. C’est dans le dossier. Ici : en lettres, en minuscules, avec humilité.' : '', a_slider: S.straight ? 'Pour mémoire : à la carte 1, votre trajectoire était trop rectiligne. Ici, on glisse avec un léger tremblement de culpabilité.' : '' }[id] || (S.pen && lv >= 5 ? `Pénalité cumulée : −${S.pen * 5} s. Chaque infraction se paie sur les cartes suivantes. Je n’invente rien.` : '');
    if (A) setTimeout(() => el.isConnected && api.say(A, 'smug'), 1400);
  }
  let patLocked = !!patient, patN = 2; const labs = ['Respirez…', 'Encore un peu…'];
  function setLock() { const reds = bad2().length; btn.disabled = patLocked || reds > 0; btn.textContent = reds ? 'Corrigez le dossier' : patLocked ? labs[patN > 1 ? 0 : 1] : verify; }
  if (patient) { const t = setInterval(() => { if (!el.isConnected) return clearInterval(t); patN--; if (patN <= 0) { patLocked = false; chips.R3 && (chips.R3.className = 'ak-lc ok'); clearInterval(t); } setLock(); }, 1000); }
  setLock(); refresh();
  { const rs = bad2(); if (rs.length) { setTimeout(() => { if (!el.isConnected) return; openEntry(rs[0]); const r = causeOf(rs[0]); api && api.say(`${r ? r.k : 'Une règle'} : l’entrée ${roman(ents.indexOf(rs[0]) + 1)} du dossier (« ${rs[0].text} ») n’est plus conforme. Corrigez-la avant de continuer. Le dossier est juge, jury et bureaucrate.`, 'smug'); api && api.sfx('bad'); }, 900); } }
  return { el, btn, noteEl, banner, rule: (k, state) => { const c = chips[k]; if (c) { c.className = 'ak-lc ' + state; if (state === 'bad') { c.classList.remove('hit'); void c.offsetWidth; c.classList.add('hit'); } } if (state === 'bad' && (k === 'R1' || k === 'R2')) { bad.add(k); drain(); } else bad.delete(k); },
    addChip: (text, state) => { const c = h('span', { class: 'ak-lc ' + (state || 'bad') }, h('i'), text); if (st) (drainEl ? st.insertBefore(c, drainEl) : st.append(c)); return c; }, shake() { el.classList.remove('ak-shake'); void el.offsetWidth; el.classList.add('ak-shake'); } };
}
export const numWords = (n) => {
  if (!Number.isFinite(n) || n < 0 || n > 999) return String(n);
  const u = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const t = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'];
  if (n < 20) return u[n];
  if (n < 70) { const d = Math.floor(n / 10), r = n % 10; return t[d] + (r === 1 ? ' et un' : r ? '-' + u[r] : ''); }
  if (n < 80) { const r = n - 60; return 'soixante' + (r === 11 ? ' et onze' : '-' + u[r]); }
  if (n < 100) { const r = n - 80; return 'quatre-vingt' + (r === 0 ? 's' : '-' + u[r]); }
  const c = Math.floor(n / 100), r = n % 100;
  return (c === 1 ? 'cent' : u[c] + ' cent') + (r ? ' ' + numWords(r) : (c > 1 ? 's' : ''));
};
