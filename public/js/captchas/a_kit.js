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
const LOGO = `<svg viewBox="0 0 24 24"><path fill="#4285f4" d="M21 12a9 9 0 0 1-2.6 6.4l-2.1-2.1A6 6 0 0 0 18 12z"/><path fill="#1a73e8" d="M12 3a9 9 0 0 1 8.6 6.3l-2.9.9A6 6 0 0 0 12 6z"/><path fill="#9aa0a6" d="M3 12a9 9 0 0 1 9-9v3a6 6 0 0 0-6 6z"/><path fill="#34a853" d="M12 21a9 9 0 0 1-9-9h3a6 6 0 0 0 6 6z"/></svg>`;
export function brand(h) {
  const b = h('div', { class: 'ak-brand' }); b.innerHTML = LOGO + '<span><b style="font-size:11px">reCAPCHA</b><br>Confidentialité · Conditions</span>'; return b;
}
// frame: standard verification widget. returns {el, body, btn, shake()}
export function frame(h, { small, title, note, body, verify = 'Vérifier', onVerify, extra }) {
  const btn = h('button', { class: 'ak-btn', type: 'button', onclick: () => onVerify && onVerify() }, verify);
  const noteEl = note != null ? h('div', { class: 'ak-note' }, note) : null;
  const el = h('div', { class: 'ak-w', role: 'group', 'aria-label': title },
    h('div', { class: 'ak-head' }, h('small', {}, small || 'Sélectionnez'), h('b', {}, title)),
    noteEl, h('div', { class: 'ak-body' }, body),
    h('div', { class: 'ak-foot' }, h('div', { style: { display: 'flex', alignItems: 'center', gap: '6px' } }, extra, brand(h)), btn));
  return { el, btn, noteEl, shake() { el.classList.remove('ak-shake'); void el.offsetWidth; el.classList.add('ak-shake'); } };
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
