import { css, frame, hasRule, coarse } from './a_kit.js';
css('grid', `
.ag-t{animation:ag-in .4s both}@keyframes ag-in{from{opacity:0;transform:scale(.7)}to{opacity:1;transform:none}}
.ag-t .sp{animation:ag-sp 2.2s linear infinite}@keyframes ag-sp{to{transform:rotate(360deg)}}
.ag-t .glow{animation:ag-gl 1.6s ease-in-out infinite}@keyframes ag-gl{50%{filter:brightness(1.7) drop-shadow(0 0 3px currentColor)}}
.ag-t .fl{animation:ag-fl 3s infinite steps(1)}@keyframes ag-fl{0%,60%,100%{opacity:1}65%{opacity:.3}70%{opacity:1}75%{opacity:.4}}
.ag-t .sw{animation:ag-sw 3s ease-in-out infinite}@keyframes ag-sw{50%{transform:rotate(2.5deg)}}
.ag-t[aria-pressed=true] svg{animation:ag-wg .35s}@keyframes ag-wg{30%{transform:scale(.7) rotate(-4deg)}}
@media (prefers-reduced-motion:reduce){.ag-t,.ag-t *{animation:none!important}}
@media (max-width:480px){.ag-t{aspect-ratio:1.3}}
.ag-t{aspect-ratio:1.25!important}
@media (min-width:900px){.ag-w2{width:min(100%,440px)!important}.ag-t{aspect-ratio:1.6!important}}
.ag-g{display:grid;grid-template-columns:repeat(3,1fr);gap:4px}
.ag-t{position:relative;aspect-ratio:1;padding:0;border:0;background:#ddd;cursor:pointer;overflow:hidden;border-radius:2px}
.ag-t svg{display:block;width:100%;height:100%;transition:transform .18s cubic-bezier(.3,1.5,.5,1)}
.ag-t:hover svg{filter:brightness(1.06)}
.ag-t[aria-pressed=true] svg{transform:scale(.8)}
.ag-t[aria-pressed=true]{background:#1a73e8}
.ag-t::after{content:"";position:absolute;left:5px;top:5px;width:22px;height:22px;border-radius:50%;background:#1a73e8 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='none' stroke='white' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round' d='M5 12.5l5 5L19 7'/%3E%3C/svg%3E") center/16px no-repeat;border:2px solid #fff;transform:scale(0);transition:transform .18s cubic-bezier(.3,1.8,.5,1)}
.ag-t[aria-pressed=true]::after{transform:scale(1)}
`);
const S = (inner, sky, gr) => `<svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient></defs><rect width="100" height="100" fill="url(#sk)"/><rect y="80" width="100" height="20" fill="${gr}"/>${inner}</svg>`;
const wheel = (x, y, r, sw = 3) => `<g class="sp" style="transform-origin:${x}px ${y}px"><circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#222" stroke-width="${sw}"/><line x1="${x - r}" y1="${y}" x2="${x + r}" y2="${y}" stroke="#222" stroke-width="1"/><line x1="${x}" y1="${y - r}" x2="${x}" y2="${y + r}" stroke="#222" stroke-width="1"/><circle cx="${x}" cy="${y}" r="1.8" fill="#222"/></g>`;
const ln = (a, b, c, d, col = '#c0392b', w = 3) => `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;
const ART = {
  feu: (r, lit0) => { const lit = lit0 ?? Math.floor(r() * 3), col = ['#ff3b30', '#ffb300', '#34c759'], dim = ['#5b2320', '#5a4310', '#1d4a2a']; return `<rect x="47" y="60" width="6" height="22" fill="#555"/><rect x="36" y="10" width="28" height="54" rx="6" fill="#2b2f36"/>` + [0, 1, 2].map((i) => `<circle cx="50" cy="${24 + i * 15}" r="6.5" fill="${i === lit ? col[i] : dim[i]}"${i === lit ? ' class="glow"' : ''}/>`).join('') + `<rect x="36" y="10" width="28" height="54" rx="6" fill="none" stroke="#111" stroke-width="2"/>`; },
  lampadaire: () => `<rect x="48" y="26" width="4" height="56" fill="#444"/>${ln(50, 26, 66, 20, '#444', 4)}<path class="fl" d="M60 20 h14 l-3 8 h-8z" fill="#ffe27a" stroke="#444" stroke-width="2"/>`,
  stop: () => `<rect x="48" y="50" width="4" height="32" fill="#666"/><polygon points="38,16 62,16 74,28 74,48 62,60 38,60 26,48 26,28" fill="#d32f2f" stroke="#fff" stroke-width="2.5" transform="translate(-6 -4) scale(1.12)"/><text x="50" y="40" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="13" fill="#fff">STOP</text>`,
  bus: () => `<rect x="26" y="46" width="4" height="36" fill="#666"/><rect x="14" y="14" width="30" height="34" rx="3" fill="#1565c0" stroke="#fff" stroke-width="2"/><text x="29" y="36" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="12" fill="#fff">BUS</text><rect x="56" y="38" width="36" height="34" rx="6" fill="#f9a825"/>` + [0, 1, 2].map((i) => `<rect x="${59 + i * 11}" y="42" width="8" height="10" fill="#cfe8ff"/>`).join('') + `<circle cx="66" cy="74" r="5" fill="#222"/><circle cx="84" cy="74" r="5" fill="#222"/>`,
  arbre: (r) => `<rect x="46" y="52" width="8" height="30" fill="#7b4a2a"/><g class="sw" style="transform-origin:50px 80px"><circle cx="50" cy="38" r="22" fill="#2e7d32"/><circle cx="38" cy="46" r="14" fill="#388e3c"/><circle cx="62" cy="46" r="14" fill="#388e3c"/>` + (r() < .5 ? '<circle cx="46" cy="32" r="3" fill="#e53935"/><circle cx="58" cy="40" r="3" fill="#e53935"/>' : '') + '</g>',
  maison: () => `<rect x="22" y="44" width="56" height="38" fill="#e6c9a0"/><polygon points="16,46 50,18 84,46" fill="#a33b2e"/><rect x="43" y="58" width="14" height="24" fill="#6d4c41"/><rect x="28" y="52" width="10" height="10" fill="#cfe8ff"/><rect x="62" y="52" width="10" height="10" fill="#cfe8ff"/>`,
  voiture: () => `<path d="M12 72 v-14 q0-4 5-5 l14-2 l10-12 h24 l10 12 l8 2 q4 1 4 5 v14z" fill="#c62828"/><path d="M38 40 h20 l7 11 h-34z" fill="#cfe8ff"/>${wheel(30, 74, 8, 5)}${wheel(72, 74, 8, 5)}`,
  velo: (r, col = '#c0392b') => { const L = (a, b, c, d) => ln(a, b, c, d, col); return `${wheel(27, 66, 15)}${wheel(73, 66, 15)}${L(27, 66, 41, 42)}${L(41, 42, 49, 66)}${L(27, 66, 49, 66)}${L(41, 42, 66, 42)}${L(49, 66, 66, 42)}${L(66, 42, 73, 66)}${ln(66, 42, 62, 32, '#222')}${ln(58, 32, 68, 32, '#222')}${ln(36, 39, 46, 39, '#222', 4)}`; },
  monocycle: () => `${wheel(50, 64, 17)}${ln(50, 64, 50, 38, '#2e7d32', 4)}${ln(42, 36, 58, 36, '#222', 5)}${ln(44, 68, 56, 60, '#222', 3)}`,
  tricycle: () => `${wheel(30, 66, 16)}<g opacity=".95">${wheel(66, 72, 9)}${wheel(82, 69, 9)}</g>${ln(30, 66, 30, 40, '#e67e22', 4)}${ln(30, 40, 56, 48, '#e67e22', 4)}${ln(56, 48, 74, 70, '#e67e22', 4)}${ln(24, 34, 36, 34, '#222', 4)}${ln(52, 44, 64, 44, '#222', 5)}`
};
const SKY = [['#bfe3ff', '#eaf6ff'], ['#ffe0b2', '#fff3e0'], ['#c5cae9', '#e8eaf6'], ['#b2dfdb', '#e0f2f1']];
const GR = ['#8bc34a', '#9e9e9e', '#bcaaa4', '#78909c'];
const MODES = {
  feu: { target: 'feux tricolores', yes: ['feu'], nameOf: { feu: 'un feu tricolore', lampadaire: 'un lampadaire', stop: 'un panneau stop', bus: 'un abribus et un bus', arbre: 'un arbre', maison: 'une maison', voiture: 'une voiture' }, decoys: ['lampadaire', 'stop', 'bus', 'arbre', 'maison', 'voiture'], note: 'Un feu tricolore possède trois lumières. Un lampadaire n’en a qu’une et aucune autorité.',
    hit: { lampadaire: 'Ceci est un lampadaire. Une seule lumière, zéro pouvoir sur la circulation.', stop: 'Un panneau stop n’est pas un feu tricolore. Il est juste plus direct.', bus: 'L’abribus ne régule rien, il fait juste attendre. Ce n’est pas un feu.', arbre: 'C’est un arbre. Il est vert en permanence, ce qui ne suffit pas.', maison: 'Une maison. Même éclairée, elle n’a jamais arrêté personne.', voiture: 'Une voiture n’est pas un feu. Elle les grille, c’est même son rôle.' } },
  velo: { target: 'vélos', yes: ['velo'], nameOf: { velo: 'un vélo', monocycle: 'un monocycle', tricycle: 'un tricycle', voiture: 'une voiture', bus: 'un bus', arbre: 'un arbre', maison: 'une maison' }, decoys: ['monocycle', 'tricycle', 'voiture', 'arbre', 'maison', 'lampadaire'], note: 'Définition officielle : un vélo possède exactement deux roues. Ni plus, ni moins, ni quiche.',
    hit: { monocycle: 'Ceci est un monocycle. Une roue. Un vélo en a deux, c’est dans la définition, pas une opinion.', tricycle: 'Trois roues : un tricycle. Mignon, mais nous avons dit deux.', voiture: 'Une voiture a quatre roues et un toit. Un vélo, ni l’un ni l’autre.', arbre: 'Un arbre. Zéro roue. C’est même assez impressionnant, comme erreur.', maison: 'Une maison. Elle ne bouge pas, ou alors vous avez un très gros problème.', lampadaire: 'Un lampadaire n’a pas de roues. Ni de pédales. Ni d’avenir sportif.' } }
};
export default {
  id: 'a_grid', tier: 1, title: 'Grille d’images', time: 35000,
  mount(host, api) {
    const { h } = api, M = MODES[api.rng() < .5 ? 'feu' : 'velo'];
    const nYes = api.int(3, 4), keys = [...Array(nYes).fill(M.yes[0]), ...api.shuffle(M.decoys).slice(0, 9 - nYes)], order = api.shuffle(keys);
    const yesIdx = order.map((k, i) => M.yes.includes(k) ? i : -1).filter((i) => i >= 0), redFlags = api.shuffle([true, false, false, api.rng() < .5]).slice(0, yesIdx.length), red = new Set(yesIdx.filter((_, n) => redFlags[n]));
    if (!red.size) red.add(yesIdx[0]); if (yesIdx.length - red.size < 2) red.delete([...red][0]);
    const isFeu = M.yes[0] === 'feu'; let ruleOn = false; const sel = new Set(), tiles = order.map((k, i) => {
      const sky = api.pick(SKY), t = h('button', { class: 'ag-t', style: { animationDelay: i * 45 + 'ms' }, type: 'button', 'aria-pressed': 'false', 'aria-label': 'Image ' + (i + 1), onclick: () => { if (!ruleOn) { clearTimeout(rt); armRule(); } const on = !sel.has(i); on ? sel.add(i) : sel.delete(i); t.setAttribute('aria-pressed', on); api.sfx('click'); } });
      t.innerHTML = S(M.yes.includes(k) ? (isFeu ? ART.feu(api.rng, red.has(i) ? 0 : api.pick([1, 2])) : ART.velo(api.rng, red.has(i) ? '#c0392b' : api.pick(['#1565c0', '#2e7d32', '#6a1b9a']))) : ART[k](api.rng), sky, api.pick(GR)).replace('id="sk"', `id="sk${i}"`).replace('url(#sk)', `url(#sk${i})`); return t;
    });
    const fr = frame(h, { api, id: 'a_grid', small: 'Sélectionnez toutes les images avec des', title: M.target, body: [h('p', { class: 'ag-cap' }, M.note), h('div', { class: 'ag-g' }, tiles)], onVerify: check });
    fr.el.style.width = 'min(100%,340px)'; fr.el.classList.add('ag-w2'); host.append(fr.el);
    const truth = () => yesIdx.filter((i) => !ruleOn || !red.has(i));
    const RULE = isFeu ? 'Rectificatif de la direction : les feux rouges sont suspendus. Plus aucun feu rouge ne compte.' : 'Rectificatif de la direction : les vélos rouges sont réquisitionnés. Plus aucun vélo rouge ne compte.';
    let rt = 0; function armRule() { rt = setTimeout(() => { if (ruleOn) return; ruleOn = true; fr.banner(RULE, 'rule', 0); api.say(RULE, 'smug'); api.sfx('whoosh'); if (/cheat=1/.test(location.search)) host.dataset.answer = truth().join(','); }, 900); }
    rt = setTimeout(() => { armRule(); }, 6000);
    if (/cheat=1/.test(location.search)) host.dataset.answer = yesIdx.filter((i) => !red.has(i)).join(',');
    function check() {
      if (!ruleOn) { clearTimeout(rt); ruleOn = true; fr.banner(RULE, 'rule', 0); }
      const T = new Set(truth()), bad = [...sel].filter((i) => !T.has(i)), miss = [...T].filter((i) => !sel.has(i));
      if (!bad.length && !miss.length) { fr.el.classList.add('ak-ok'); return api.solve(); }
      fr.shake();
      let m;
      if (bad.length) { m = red.has(bad[0]) ? (isFeu ? 'Ce feu est rouge. Le rectificatif de la direction (bannière bleue) les a suspendus. Il fallait lire la bannière, elle était bleue.' : 'Ce vélo est rouge. Le rectificatif de la direction (bannière bleue) les a réquisitionnés. La bannière était bleue, pourtant.') : M.hit[order[bad[0]]] + (bad.length > 1 ? ` (Et ${bad.length - 1} autre${bad.length > 2 ? 's' : ''} du même acabit.)` : '') + (miss.length ? ` Vous en avez aussi oublié ${miss.length}.` : ''); }
      else m = sel.size ? `Il en reste ${miss.length} à cliquer. Vous avez le regard sélectif.` : `Vous n’avez rien sélectionné. Il y en avait pourtant ${T.size}, des ${M.target}. Courage, regardez les images.`;
      api.fail(m);
    }
    return { destroy() { clearTimeout(rt); } };
  }
};
