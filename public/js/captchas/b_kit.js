// Shared helpers for captchas-b (css injection, paper-style widgets).
export function css(id, text) {
  if (document.getElementById('bk-css-' + id)) return;
  const s = document.createElement('style'); s.id = 'bk-css-' + id; s.textContent = text; document.head.append(s);
}
css('base', `
.bk{width:min(100%,560px);margin:0 auto;color:var(--ink);font-family:var(--body,system-ui,sans-serif);display:flex;flex-direction:column;gap:10px;user-select:none;-webkit-user-select:none;position:relative}
.bk *{box-sizing:border-box}
.bk-rule{border:2px solid var(--ink);background:var(--yellow);padding:8px 12px;font:800 16px/1.2 var(--display);letter-spacing:-.01em;box-shadow:4px 4px 0 var(--ink);min-height:62px;display:flex;align-items:center;gap:10px}
.bk-rule small{display:block;font:600 11px var(--mono);letter-spacing:.08em;text-transform:uppercase;opacity:.7;margin-bottom:2px}
.bk-rule.flip{animation:bk-flip .6s}
@keyframes bk-flip{0%{transform:rotate(-2deg) scale(1.04);background:var(--red);color:#fff}100%{transform:none}}
.bk-meta{display:flex;justify-content:space-between;align-items:center;font:600 11px var(--mono);letter-spacing:.06em;text-transform:uppercase;min-height:20px;gap:8px}
.bk-pips{display:flex;gap:5px}.bk-pips i{width:14px;height:14px;border:2px solid var(--ink);background:transparent;transition:background .2s,transform .2s}
.bk-pips i.on{background:var(--ink);transform:scale(1.15)}
.bk-btn{appearance:none;border:2px solid var(--ink);background:var(--ink);color:var(--paper);font:800 14px var(--display);letter-spacing:.04em;text-transform:uppercase;padding:10px 18px;min-height:44px;cursor:pointer;box-shadow:3px 3px 0 var(--yellow),3px 3px 0 1px var(--ink);transition:transform .08s,box-shadow .08s,background .15s}
.bk-btn:hover:not(:disabled){background:#1d3544;transform:translate(-1px,-1px)}
.bk-btn:active:not(:disabled){transform:translate(2px,2px);box-shadow:0 0 0 var(--yellow)}
.bk-btn:disabled{opacity:.35;cursor:not-allowed;box-shadow:none}
.bk :focus-visible{outline:3px solid #1a73e8;outline-offset:2px}
@keyframes bk-shake{10%,90%{transform:translateX(-2px)}20%,80%{transform:translateX(4px)}30%,50%,70%{transform:translateX(-7px)}40%,60%{transform:translateX(7px)}}
.bk-shake{animation:bk-shake .45s}
@media (prefers-reduced-motion:reduce){.bk *{animation:none!important;transition:none!important}}
`);
export const pad2 = (n) => String(n).padStart(2, '0');
export function shake(el) { el.classList.remove('bk-shake'); void el.offsetWidth; el.classList.add('bk-shake'); }
