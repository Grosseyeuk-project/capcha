import { css } from './b_kit.js';
css('pwd', `
.bp-cur{position:sticky;top:0;z-index:6;background:var(--ink);color:var(--paper);padding:6px 10px;font:600 12.5px/1.25 var(--body);border-left:6px solid var(--red);min-height:34px;display:flex;align-items:center;gap:8px}.bp-cur.okk{border-left-color:var(--green)}.bp-cur b{color:var(--yellow)}.bp-cur small{font:700 10px var(--mono);opacity:.7;white-space:nowrap}
.bp-moon{font-size:18px;vertical-align:middle;font-family:"Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",sans-serif}
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
.bp-list{min-height:60px;max-height:min(250px,36vh);overflow-y:auto;border:2px solid var(--ink);background:#fff;display:flex;flex-direction:column;gap:0;scrollbar-width:thin}
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

.bp-clock{font:700 12px var(--mono);background:var(--ink);color:var(--yellow);padding:0 5px}
.bp-worm{font:700 11px var(--mono);letter-spacing:.04em;text-transform:uppercase}
.bp-worm.hungry{color:var(--red)}
.bp-field.chomp input{animation:bp-chomp .45s}
@keyframes bp-chomp{30%{background:#ffd0d4;transform:translateX(-4px)}60%{transform:translateX(4px)}}
.bp-cp{flex:none;border:2px solid var(--ink);background:var(--yellow);font:800 12px var(--mono);padding:0 10px;cursor:pointer;color:var(--ink);text-transform:uppercase}
.bp-cp:hover{background:#fff}.bp-cp:active{transform:translateY(2px)}
`);
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const WORDS = ['robot', 'canard', 'pingouin', 'cactus', 'vautour', 'chaussons'];
const LETT = 'KQXZMWBVJHPNTLDGFS'; // sans E
const MOONS = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];
const MOON_RE = /[\u{1F311}-\u{1F318}]/gu;
const PRIMES = new Set([11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97]);
const hhmm = () => { const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
const JABS = ['Ah. Une règle qui était satisfaite ne l’est plus. Le suspense était à son comble.', 'Et voilà. Vous aviez presque fini. Presque.', 'Une règle vient de se réveiller. Elle n’était pas contente.', 'Vous avez cassé quelque chose. Je ne dis pas quoi. Si, la règle précédente.', 'On répare, on répare. C’est ça, la sécurité.', 'Le monde a changé pendant que vous tapiez. Il fait ça.'];
export default {
  id: 'b_pwd', tier: 5, title: 'Mot de passe (version bureaucratique)', time: 170000,
  mount(host, api) {
    const { h } = api; let alive = true, solved = false;
    const word = api.pick(WORDS), L = api.pick([56, 57, 58, 60]);
    const T0 = performance.now(); const moonNow = () => MOONS[Math.floor((performance.now() - T0) / 15000) % 8];
    const code = Array.from({ length: 5 }, () => LETT[api.int(0, LETT.length - 1)]).join('');
    const len = (s) => [...s].length;
    const codeEl = h('span', { class: 'bp-code', 'aria-label': 'Code : ' + code.split('').join(' ') }, [...code].map((c) => h('u', { style: { transform: `rotate(${api.int(-14, 14)}deg) translateY(${api.int(-2, 2)}px)` } }, c)));
    const clockEl = h('span', { class: 'bp-clock' }, hhmm()), moonEl = h('span', { class: 'bp-moon' }, moonNow()), ateEl = h('span', { class: 'bp-clock' }, '0');
    const hasPrime = (p) => { for (let i = 0; i < p.length - 1; i++) if (/\d\d/.test(p.slice(i, i + 2)) && PRIMES.has(+p.slice(i, i + 2))) return true; return false; };
    let ate = 0;
    const wormPos = (p) => { const cs = [...p], k = cs.indexOf('🐛'); return k < 0 ? -1 : k / cs.length; };
    const rules = [
      { t: ['Au moins ', h('b', {}, '8 caractères'), '. Tout le monde sait que « 1234 » est trop court.'], f: (p) => len(p) >= 8, s: 'Huit caractères. On commence doucement.' },
      { t: ['Une ', h('b', {}, 'majuscule'), '. Pour le respect.'], f: (p) => /[A-ZÀ-ÖØ-Ý]/.test(p) },
      { t: ['Un ', h('b', {}, 'chiffre'), '. Au moins un, hélas.'], f: (p) => /[0-9]/.test(p) },
      { t: ['Un caractère spécial : ', h('b', {}, '! ? # @ *')], f: (p) => /[!?#@*]/.test(p) },
      { t: ['Deux chiffres consécutifs formant un ', h('b', {}, 'nombre premier'), ' (13, 47, 71…). Les maths, ça sert.'], f: hasPrime, s: 'Un nombre premier. Allez, je suis gentil, il y en a 21.' },
      { t: ['Doit contenir un ', h('b', {}, 'mois de l’année'), ' (en français, c’est la loi).'], f: (p) => MONTHS.some((m) => p.toLowerCase().includes(m)) },
      { t: ['Doit contenir le mot « ', h('b', {}, word), ' ». Ne demandez pas.'], f: (p) => p.toLowerCase().includes(word), s: 'Ce mot a été tiré au sort. Par moi. Avec amour.' },
      { t: ['Doit contenir ', h('b', {}, 'la lune d’en ce moment'), ' : ', moonEl, ', et ', h('b', {}, 'aucune autre'), '. Elle change toutes les 15 s (bouton 🌕).'], f: (p) => { const m = p.match(MOON_RE) || []; return m.length === 1 && m[0] === moonNow(); }, s: 'La lune change de phase. Vous, non. C’est le problème.' },
      { t: ['Doit contenir ce code, ', h('b', {}, 'majuscules respectées'), ' : ', codeEl], f: (p) => p.includes(code) },
      { t: ['Ne doit ', h('b', {}, 'jamais'), ' contenir la lettre « ', h('b', {}, 'e'), ' » (sans accent). Supprimez-la partout. Même dans ce que vous venez d’écrire.'], f: (p) => !/e/i.test(p), s: 'Supprimer les « e » de « mois », par exemple. J’adore ce moment.' },
      { t: ['Doit contenir ', h('b', {}, 'Gérard'), '. Il se sent seul. (Bouton « Gérard » pour les claviers sans é.)'], f: (p) => p.includes('Gérard'), s: 'Gérard est là, il vous regarde.' },
      { t: ['Doit contenir l’', h('b', {}, 'heure actuelle'), ' au format HH:MM : il est ', clockEl, '. Oui, elle change. Chaque minute. Je n’y suis pour rien.'], f: (p) => p.includes(hhmm()), s: 'L’heure. Elle passe. Comme votre temps de réponse.' },
      { t: ['Doit contenir ', h('b', {}, 'Albert 🐛'), ', le ver de compagnie de Gérard. Il mange le caractère à sa droite toutes les 9 s, et meurt si rien à manger pendant 45 s.'], f: (p) => p.includes('🐛'), s: 'Albert a faim. Il mange ce qu’il a à droite. Je ne le contrôle plus.' },
      { t: ['Doit contenir le ', h('b', {}, 'nombre de repas d’Albert'), ' jusqu’ici, précédé de la lettre R (R0, R1…) : ', ateEl, '. Il grossit, vous mettez à jour.'], f: (p) => p.includes('R' + ate), s: 'Albert tient un registre. Moi aussi. Je note tout.' },
      { t: ['Doit faire ', h('b', {}, 'exactement ' + L + ' caractères'), '. Ni plus, ni moins. Les emojis comptent pour un.'], f: (p) => len(p) === L, live: (p) => `${len(p)} / ${L} car.` },
      { t: ['Albert doit rester ', h('b', {}, 'à l’abri'), ' : jamais dans le dernier cinquième du mot de passe. Il lui faut de quoi manger.'], f: (p) => { const w = wormPos(p); return w >= 0 && w < 0.8; }, s: 'Albert veut du confort. Un ver exigeant, c’est le pire.' },
      { t: ['Confirmez en le ', h('b', {}, 'retapant'), ' dans la seconde case (ou « copier »). Ensuite, elle se synchronise toute seule. Nous sommes humains.'], f: (p, c) => p.length > 0 && c === p, s: 'Une seconde case. Elle se mettra à jour toute seule, c’est mon cadeau.' },
      { t: [h('b', {}, 'Jamais trois caractères identiques'), ' de suite. « xxx » est un cri de détresse.'], f: (p) => !/(.)\1\1/u.test(p) },
      { t: ['Doit contenir « ', h('b', {}, 'pardon'), ' ». Gérard demande à ce que vous vous excusiez. Pour tout.'], f: (p) => p.toLowerCase().includes('pardon'), s: 'Les dernières. Vous me faites presque de la peine.' },
      { t: ['Doit ', h('b', {}, 'commencer par Gérard'), '. C’est le chef. Il passe devant.'], f: (p) => p.startsWith('Gérard') },
    ];
    const WORM = 13; // index de la règle qui lance Albert
    const BREAK = JABS;
    let synced = false;
    const input = h('input', { type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: 'Choisissez un mot de passe…', 'aria-label': 'Mot de passe', maxlength: 100, oninput: () => { if (synced) confirm.value = input.value; update(); } });
    const confirm = h('input', { type: 'text', autocomplete: 'off', spellcheck: 'false', placeholder: 'Confirmez…', 'aria-label': 'Confirmation du mot de passe', disabled: true, maxlength: 100, oninput: () => { synced = confirm.value === input.value; update(); } });
    const cp = h('button', { class: 'bp-cp', type: 'button', onclick: () => { confirm.value = input.value; synced = true; update(); api.sfx('click'); } }, 'Copier');
    const confWrap = h('div', { class: 'bp-field', style: { display: 'none' } }, confirm, cp);
    const field = h('div', { class: 'bp-field' }, input);
    const chipBtn = (c, label, fn) => h('button', { class: 'bp-chip', type: 'button', 'aria-label': label || c, onclick: () => { input.value = fn ? fn(input.value) : input.value + c; if (synced) confirm.value = input.value; input.focus(); update(); api.sfx('click'); } }, c);
    const chips = h('div', { class: 'bp-chips' }, h('span', {}, 'Clavier d’urgence'), ...['!', '?', '#', '@', '*', 'é'].map((c) => chipBtn(c)), chipBtn('Gérard', 'Gérard'), chipBtn('🌕', 'lune actuelle (remplace les autres)', (v) => v.replace(MOON_RE, '') + moonNow()), chipBtn('🐛', 'ver'), chipBtn('🕒', 'heure actuelle', (v) => v + hhmm()));
    const live = h('span', {}, ''), cnt = h('b', {}, '0 car.'), worm = h('span', { class: 'bp-worm' }, '');
    const cur = h('div', { class: 'bp-cur', 'aria-live': 'polite' });
    const list = h('div', { class: 'bp-list', role: 'list' });
    const btn = h('button', { class: 'bk-btn', type: 'button', disabled: true, onclick: submit }, 'Valider');
    const prog = h('span', { class: 'bk-meta' });
    const root = h('div', { class: 'bk' }, cur, h('div', { class: 'bp-in' }, field, confWrap, chips, h('div', { class: 'bp-stat' }, live, worm, cnt)), list, h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' } }, prog, btn));
    host.append(root);
    let revealed = 0; const rows = []; let lastJab = 0, wormOn = false, starve = 0, tickN = 0, revealTO = 0, forceIv = 0;
    function reveal(forced) {
      const n = revealed; const row = h('div', { class: 'bp-r', role: 'listitem' }, h('i', {}, '✗'), h('div', {}, h('small', {}, 'Règle ' + (n + 1) + '/' + rules.length + (forced ? ' — imposée d’office' : '')), h('span', {}, ...rules[n].t)));
      rows.push({ row, was: false }); list.prepend(row); list.scrollTop = 0; revealed++; api.sfx('pop');
      if (n === 16) { confWrap.style.display = ''; confirm.disabled = false; }
      if (n === WORM) { wormOn = true; tickN = 0; }
      if (n === WORM + 1 && !forceIv) { forceIv = setInterval(() => { if (alive && revealed < rules.length) { reveal(true); api.say('Je n’ai pas dit que vous aviez fini. Une règle de plus.', 'smug'); update(); } }, 15000); }
      if (rules[n].s) api.say(rules[n].s, n >= 12 ? 'smug' : 'neutral');
    }
    function update() {
      const p = input.value, c = confirm.value; cnt.textContent = len(p) + ' car.';
      let allOk = true; for (let i = 0; i < revealed; i++) if (!rules[i].f(p, c)) { allOk = false; break; }
      if (revealed < rules.length && allOk && !revealTO) revealTO = setTimeout(() => { revealTO = 0; if (alive && revealed < rules.length) { reveal(); update(); } }, revealed > 11 ? 400 : 700);
      let okN = 0, broke = false, firstBad = -1;
      rows.forEach((r, i) => { const ok = rules[i].f(p, c); r.row.classList.toggle('ok', ok); r.row.classList.toggle('bad', !ok); r.row.firstChild.textContent = ok ? '✓' : '✗'; if (ok) { if (!r.was) { r.was = true; api.sfx('tick'); } okN++; } else { firstBad = i; if (r.was) { r.was = false; broke = true; r.row.classList.remove('was'); void r.row.offsetWidth; r.row.classList.add('was'); } } });
      if (broke && performance.now() - lastJab > 3500) { lastJab = performance.now(); api.say(BREAK[api.int(0, BREAK.length - 1)], 'smug'); api.sfx('bad'); }
      const lr = revealed ? rules.slice(0, revealed).reverse().find((r) => r.live) : null; live.textContent = lr ? lr.live(p) : '';
      const all = revealed === rules.length && okN === rules.length; btn.disabled = !all; prog.textContent = `${okN}/${rules.length} règles`;
      cur.className = 'bp-cur' + (firstBad < 0 ? ' okk' : '');
      if (firstBad >= 0) cur.replaceChildren(h('small', {}, 'RÈGLE ' + (firstBad + 1)), h('span', {}, ...rules[firstBad].t.map((x) => (x.cloneNode ? x.cloneNode(true) : x)))); else cur.replaceChildren(h('small', {}, 'OK'), h('span', {}, revealed === rules.length ? 'Tout est conforme. Cliquez avant que le monde change.' : 'Une règle arrive…'));
      if (all && !btn.dataset.rdy) { btn.dataset.rdy = 1; api.sfx('good'); api.say('Tout est conforme. Cliquez vite : la lune bouge, Albert mange.', 'impressed'); } else if (!all) delete btn.dataset.rdy;
    }
    let lastMoon = moonNow();
    const iv = setInterval(() => {
      if (!alive || solved) return; clockEl.textContent = hhmm(); const m = moonNow(); moonEl.textContent = m; ateEl.textContent = String(ate); if (m !== lastMoon) { lastMoon = m; if (revealed > 7) api.sfx('whoosh'); }
      const p = input.value;
      if (wormOn && p.includes('🐛')) {
        tickN++;
        if (tickN % 9 === 0) {
          const cs = [...p]; const k = cs.indexOf('🐛');
          if (k < cs.length - 1) { const eaten = cs[k + 1]; cs.splice(k + 1, 1); input.value = cs.join(''); if (synced) confirm.value = input.value; starve = 0; ate++; ateEl.textContent = String(ate); api.sfx('bad'); field.classList.remove('chomp'); void field.offsetWidth; field.classList.add('chomp'); api.say(ate % 2 ? `Albert a mangé « ${eaten} ». Ça ne le dérange pas, lui.` : `Repas n° ${ate}. Il a pris « ${eaten} ». Vérifiez votre compteur.`, 'smug'); }
          else { starve++; if (starve >= 5) { input.value = p.replace('🐛', '💀'); if (synced) confirm.value = input.value; api.say('Albert est mort de faim. Gérard est en deuil. Vous pouvez en reprendre un.', 'angry'); starve = 0; api.sfx('bad'); } }
        }
        const sec = 9 - (tickN % 9); worm.className = 'bp-worm' + (starve ? ' hungry' : ''); worm.textContent = starve ? `🐛 affamé ${starve}/5` : `🐛 repas dans ${sec} s · ${ate} repas`;
      } else if (wormOn) { worm.textContent = '🐛 absent'; worm.className = 'bp-worm hungry'; }
      update();
    }, 1000);
    function submit() { if (solved || btn.disabled) return; solved = true; api.solve(); }
    update();
    let sy = 0;
    if (/cheat=1/.test(location.search)) {
      const build = () => { const base = 'Gérardpardon' + word + '!' + code + 'mars' + moonNow() + '13R' + ate + hhmm() + '🐛'; const padN = L - len(base); let f = ''; for (let i = 0; i < padN; i++) f += i % 2 ? 'y' : 'x'; return base + f; };
      const sync = () => { host.dataset.answer = build(); }; sync(); sy = setInterval(sync, 300);
    }
    setTimeout(() => alive && input.focus({ preventScroll: true }), 50);
    return { destroy() { alive = false; clearInterval(iv); clearInterval(forceIv); clearTimeout(revealTO); clearInterval(sy); } };
  }
};
