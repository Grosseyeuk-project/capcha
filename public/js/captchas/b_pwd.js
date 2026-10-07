import { css } from './b_kit.js';
css('pwd', `
.bp-foot{display:flex;justify-content:space-between;align-items:center;gap:10px;position:sticky;bottom:0;z-index:6;background:var(--paper);padding:6px 0;border-top:2px solid var(--ink)}
.bp-cur{flex-direction:column;align-items:stretch!important;max-height:min(112px,20vh);overflow:auto}.bp-cr{display:flex;gap:8px;align-items:baseline;font-size:12px;line-height:1.2;padding:2px 0}.bp-cur .bp-cr+.bp-cr{border-top:1px solid #345}.bp-cur>small+span{display:inline}
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

.bp-view{display:none;flex-wrap:wrap;gap:1px;padding:6px 8px;border:2px dashed var(--ink);background:#fff8e6;font:700 13px/1.15 var(--mono);min-height:34px;max-height:70px;overflow:hidden}
.bp-view.on{display:flex}
.bp-view span{padding:0 1px;border-radius:2px}
.bp-view .w{background:#d6f5b8}.bp-view .f{animation:bp-fire .35s infinite alternate;font-size:17px;line-height:1}
.bp-view .g{background:#ffe9a8}.bp-view .c{background:#cfe6ff}
@keyframes bp-fire{from{transform:translateY(0) scale(1)}to{transform:translateY(-3px) scale(1.25)}}
.bp-cap{display:inline-block;vertical-align:middle;border:2px solid var(--ink);background:#fff;max-width:100%}
.bp-r.fl{animation:bp-fl .9s}@keyframes bp-fl{20%,60%{background:#fff2a8}}
.bk.bp-boom{animation:bp-boom .55s}
@keyframes bp-boom{0%{box-shadow:0 0 0 0 rgba(255,59,78,.9)}20%{box-shadow:0 0 0 6px rgba(255,59,78,.9),inset 0 0 40px rgba(255,59,78,.35);transform:translateX(-5px)}40%{transform:translateX(6px)}60%{transform:translateX(-3px)}100%{box-shadow:0 0 0 0 rgba(255,59,78,0)}}
.bp-cur.hot{animation:bp-hot .6s}@keyframes bp-hot{30%{background:var(--red);color:#fff}}
.bp-r.bad.was{animation:bp-bad2 .8s}@keyframes bp-bad2{15%,45%{background:var(--red);color:#fff}}
`);
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const WORDS = ['robot', 'canard', 'pingouin', 'cactus', 'vautour', 'chaussons'];
const CAPL = 'bcdfghkmnprstuvwxz'; // sans e, sans l/i/o ambigus
const MOONS = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];
const MOON_RE = /[\u{1F311}-\u{1F318}]/gu;
const CAPITALS = ['paris', 'rome', 'madrid', 'berlin', 'londres', 'lisbonne', 'oslo', 'lima', 'tokyo', 'rabat', 'dakar', 'berne', 'vienne', 'athènes', 'athenes', 'bruxelles', 'ottawa', 'brasilia', 'canberra', 'riga', 'kiev', 'moscou', 'pékin', 'pekin', 'séoul', 'seoul', 'delhi', 'alger', 'tunis', 'bamako', 'accra', 'nairobi', 'helsinki', 'stockholm', 'copenhague', 'dublin', 'varsovie', 'prague', 'budapest', 'sofia', 'bucarest', 'ankara', 'bogota', 'caracas', 'quito', 'santiago', 'havane', 'washington', 'mexico', 'le caire'];
const PRIMES = new Set([11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97]);
const hhmm = () => { const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
const PANIC = (n) => [`AAAH ! La règle ${n} vient de sauter ! Qui a touché à la règle ${n} ?!`, `Non non non. La règle ${n} était verte il y a une seconde. Je l’aimais bien.`, `Règle ${n} cassée. Ce n’est pas ma faute. C’est un peu la vôtre.`, `Cascade ! La règle ${n} a lâché. Respirez. Réparez.`, `La règle ${n} s’effondre. Je prépare un formulaire de réclamation.`];
export default {
  id: 'b_pwd', tier: 5, title: 'Mot de passe (version bureaucratique)', time: 90000,
  mount(host, api) {
    const { h } = api; let alive = true, solved = false;
    const word = api.pick(WORDS), L = api.pick([42, 44, 45, 46]);
    const T0 = performance.now(); const moonNow = () => MOONS[Math.floor((performance.now() - T0) / 15000) % 8];
    let capWord = ''; while (capWord.length < 5) { const c = CAPL[api.int(0, CAPL.length - 1)]; if (c !== capWord[capWord.length - 1]) capWord += c; }
    const len = (s) => [...s].length;
    // mini-captcha ondulé, dans le mot de passe
    const cv = h('canvas', { class: 'bp-cap', width: 240, height: 60, role: 'img', 'aria-label': 'Captcha : ' + capWord.split('').join(' ') });
    { const g = cv.getContext('2d'); g.fillStyle = '#f6f1e4'; g.fillRect(0, 0, 240, 60); for (let i = 0; i < 7; i++) { g.strokeStyle = `hsla(${api.int(0, 360)},60%,45%,.6)`; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, api.int(5, 55)); g.bezierCurveTo(80, api.int(0, 60), 160, api.int(0, 60), 240, api.int(5, 55)); g.stroke(); }
      for (let i = 0; i < capWord.length; i++) { g.save(); g.translate(28 + i * 42, 34 + Math.sin(i * 1.7) * 7); g.rotate((api.rng() - .5) * .7); g.fillStyle = '#10202a'; g.font = '700 34px "IBM Plex Mono",monospace'; g.textAlign = 'center'; g.fillText(capWord[i], 0, 0); g.restore(); } }
    
    const hasPrime = (p) => { for (let i = 0; i < p.length - 1; i++) if (/\d\d/.test(p.slice(i, i + 2)) && PRIMES.has(+p.slice(i, i + 2))) return true; return false; };
    let hatched = false, eggT = 0, fireOn = false, burnt = 0, foyers = 0, fireDone = false, reignite = 0, fireStart = 0;

    const dsum = (p) => [...p].reduce((a, c) => a + (c >= '0' && c <= '9' ? +c : 0), 0);
    const rules = [
      { t: ['Au moins ', h('b', {}, '8 caractères'), '. Tout le monde sait que « 1234 » est trop court.'], f: (p) => len(p) >= 8, s: 'Huit caractères. On commence doucement.' },
      { t: ['Une ', h('b', {}, 'majuscule'), '. Pour le respect.'], f: (p) => /[A-ZÀ-ÖØ-Ý]/.test(p) },
      { t: ['Un ', h('b', {}, 'chiffre'), '. Au moins un, hélas.'], f: (p) => /[0-9]/.test(p) },
      { t: ['Un caractère spécial : ', h('b', {}, '! ? # @ *')], f: (p) => /[!?#@*]/.test(p) },
      { t: ['Doit contenir le nom d’une ', h('b', {}, 'capitale'), ' (en minuscules ou en majuscules, comme vous voulez : Paris, Oslo, Lima, Rabat, Tokyo, Madrid…).'], f: (p) => CAPITALS.some((c) => p.toLowerCase().includes(c)), s: 'Une capitale. N’importe laquelle. Je suis un homme de goût, pas un monstre.' },
      { t: ['Doit contenir un ', h('b', {}, 'mois de l’année'), ' (en lettres, en français : mars, avril, mai, juin, août…).'], f: (p) => MONTHS.some((m) => p.toLowerCase().includes(m)) },
      { t: ['Doit contenir le mot « ', h('b', {}, word), ' ». Ne demandez pas.'], f: (p) => p.toLowerCase().includes(word), s: 'Ce mot a été tiré au sort. Par moi. Avec amour.' },
      { t: ['Doit contenir une ', h('b', {}, 'lune 🌙'), ' (bouton 🌙 : votre clavier n’en a pas, nous le savons).'], f: (p) => p.includes('🌙'), s: 'Je n’ai pas à justifier la lune.' },
      { t: ['Un ', h('b', {}, 'captcha à l’intérieur du mot de passe'), '. Oui. Recopiez les 5 lettres, en minuscules : ', h('br', {}), cv], f: (p) => p.includes(capWord), s: 'Un captcha dans un captcha. Je suis très fier de celui-là.' },
      { t: ['Ne doit ', h('b', {}, 'jamais'), ' contenir la lettre « ', h('b', {}, 'e'), ' » (sans accent). Supprimez-la partout. Même dans ce que vous venez d’écrire.'], f: (p) => !/e/i.test(p), s: 'Supprimer les « e » de « mois », par exemple. J’adore ce moment.' },
      { t: ['Doit contenir ', h('b', {}, 'Gérard'), '. Il se sent seul. (Bouton « Gérard » pour les claviers sans é.)'], f: (p) => p.includes('Gérard'), s: 'Gérard est là, il vous regarde.' },
      { t: ['Doit contenir le nombre ', h('b', {}, '12'), ' (c’est le nombre de lettres de « BUREAUCRATIE »). Le mot de passe peut être plus long, bien sûr.'], f: (p) => p.includes('12'), s: 'Douze. B-U-R-E-A-U-C-R-A-T-I-E. Je vous ai fait le calcul, de rien.' },
            { id: 'conf', t: ['Confirmez en le ', h('b', {}, 'retapant'), ' dans la seconde case (ou « copier »). Ensuite, elle se synchronise toute seule. Nous sommes humains.'], f: (p, c) => p.length > 0 && c === p, s: 'Une seconde case. Elle se mettra à jour toute seule, c’est mon cadeau.' },
            { t: ['Gérard a pondu : le mot de passe doit contenir un ', h('b', {}, 'œuf 🥚'), '. Il éclot tout seul au bout de 5 s passées dedans (un compte à rebours s’affiche). Ne le perdez pas.'], f: (p) => p.includes('🥚') || p.includes('🐔'), s: 'Gérard a pondu. Je ne pose pas de questions. Il fait ça quand il stresse.', id: 'egg' },
      { t: ['L’œuf a éclos : c’est une ', h('b', {}, 'poule 🐔'), '. Elle doit être entourée de graines : ', h('b', {}, '🌱🐔🌱'), ' (boutons 🌱 et 🐔).'], f: (p) => p.includes('🌱🐔🌱'), when: () => hatched, s: 'C’est une poule. Évidemment que c’est une poule. Donnez-lui des graines.' },
      { t: ['🔥 ', h('b', {}, 'INCENDIE'), ' : dans 5 secondes, un feu se déclare dans le mot de passe et brûle un caractère toutes les 2 s. ', h('b', {}, '2 foyers'), ' successifs : éteignez-le chaque fois (bouton 🧯, ou effacez les 🔥). Il repart 6 s après le premier.'], f: (p) => fireDone && !p.includes('🔥'), s: 'Au feu ! Ce n’est pas dans la procédure. Faites quelque chose !', id: 'fire' },
      { t: ['Dernière règle : le mot de passe doit ', h('b', {}, 'se terminer par un point d’exclamation « ! »'), '. Mettez-le tout à la fin (bouton « ! » du clavier d’urgence).'], f: (p) => p.endsWith('!'), s: 'La dernière. Je vous le jure. Un point d’exclamation, et on n’en parle plus.' },
    ];
    const IDX = (id) => rules.findIndex((r) => r.id === id);
    const CONF = IDX('conf');
    let synced = false, graceUntil = 0;
    const input = h('input', { type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: 'Choisissez un mot de passe…', 'aria-label': 'Mot de passe', maxlength: 100, oninput: () => setPw(input.value) });
    const confirm = h('input', { type: 'text', autocomplete: 'off', spellcheck: 'false', placeholder: 'Confirmez…', 'aria-label': 'Confirmation du mot de passe', disabled: true, maxlength: 100, oninput: () => { synced = confirm.value === input.value; update(); } });
    function setPw(v) { input.value = v; if (synced) confirm.value = v; update(); }
    const cp = h('button', { class: 'bp-cp', type: 'button', onclick: () => { confirm.value = input.value; synced = true; update(); api.sfx('click'); } }, 'Copier');
    const confWrap = h('div', { class: 'bp-field', style: { display: 'none' } }, confirm, cp);
    const field = h('div', { class: 'bp-field' }, input);
    const chipBtn = (c, label, fn) => h('button', { class: 'bp-chip', type: 'button', 'aria-label': label || c, title: label || c, onclick: () => { setPw(fn ? fn(input.value) : input.value + c); input.focus(); api.sfx('click'); } }, c);
    const chips = h('div', { class: 'bp-chips' }, h('span', {}, 'Clavier d’urgence'), ...['!', '?', '#', '@', '*', 'é'].map((c) => chipBtn(c)), chipBtn('Gérard', 'Gérard'), chipBtn('🌙', 'lune'), chipBtn('🥚', 'œuf'), chipBtn('🌱', 'graine'), chipBtn('🐔', 'poule'), chipBtn('🧯', 'éteindre le feu', (v) => v.replace(/🔥/g, '')));
    const worm = h('span', { class: 'bp-worm' }, ''), cnt = h('b', {}, '0 car.');
    const cur = h('div', { class: 'bp-cur', 'aria-live': 'polite' });
    const view = h('div', { class: 'bp-view', 'aria-hidden': 'true' });
    const list = h('div', { class: 'bp-list', role: 'list' });
    const btn = h('button', { class: 'bk-btn', type: 'button', disabled: true, onclick: submit }, 'Valider');
    const prog = h('span', { class: 'bk-meta' });
    const root = h('div', { class: 'bk' }, cur, h('div', { class: 'bp-in' }, field, confWrap, chips, h('div', { class: 'bp-stat' }, worm, cnt), view), list, h('div', { class: 'bp-foot' }, prog, btn));
    host.append(root);
    let revealed = 0; const rows = []; let lastJab = 0, revealTO = 0;
    function reveal() {
      const n = revealed; const row = h('div', { class: 'bp-r', role: 'listitem' }, h('i', {}, '✗'), h('div', {}, h('small', {}, 'Règle ' + (n + 1) + '/' + rules.length), h('span', {}, ...rules[n].t)));
      rows.push({ row, was: false }); list.prepend(row); list.scrollTop = 0; revealed++; api.sfx('pop'); api.timer(rules[n].id === 'fire' ? 90000 : 60000);
      if (n === CONF) { confWrap.style.display = ''; confirm.disabled = false; }
      if (rules[n].id === 'egg') view.classList.add('on');
      if (rules[n].id === 'fire') { view.classList.add('on'); fireStart = setTimeout(() => { if (!alive) return; fireOn = true; foyers = 0; const c0 = [...input.value]; c0.splice(Math.floor(c0.length * 0.35), 0, '🔥'); setPw(c0.join('')); api.sfx('alarm'); api.say('Le feu est déclaré ! Annoncé, prévu, et pourtant.', 'worried'); }, 5000); }
      if (rules[n].s) api.say(rules[n].s, n >= 12 ? 'smug' : 'neutral');
    }
    function renderView() {
      if (!view.classList.contains('on')) return; const cs = [...input.value];
      view.replaceChildren(...cs.map((c) => h('span', { class: c === '🐛' ? 'w' : c === '🔥' ? 'f' : c === '🥚' || c === '🐔' || c === '🌱' ? 'g' : MOON_RE.test(c) ? 'c' : '' }, c)));
      MOON_RE.lastIndex = 0;
    }
    function update() {
      const p = input.value, c = confirm.value; cnt.textContent = len(p) + (revealed > 14 ? ' / ' + L : '') + ' car.';
      let allOk = true; for (let i = 0; i < revealed; i++) if (!rules[i].f(p, c)) { allOk = false; break; }
      const nxt = rules[revealed];
      if (revealed < rules.length && allOk && (!nxt.when || nxt.when()) && !revealTO) revealTO = setTimeout(() => { revealTO = 0; if (alive && revealed < rules.length) { reveal(); update(); } }, revealed > 11 ? 500 : 700);
      let okN = 0, broke = -1, firstBad = -1;
      rows.forEach((r, i) => { const ok = rules[i].f(p, c); r.row.classList.toggle('ok', ok); r.row.classList.toggle('bad', !ok); r.row.firstChild.textContent = ok ? '✓' : '✗'; if (ok) { if (!r.was) { r.was = true; api.sfx('tick'); } okN++; } else { firstBad = i; if (r.was) { r.was = false; if (broke < 0) broke = i; r.row.classList.remove('was'); void r.row.offsetWidth; r.row.classList.add('was'); } } });
      if (broke >= 0) { root.classList.remove('bp-boom'); void root.offsetWidth; if (!api.reducedMotion) root.classList.add('bp-boom'); cur.classList.remove('hot'); void cur.offsetWidth; cur.classList.add('hot'); api.sfx('bad'); if (performance.now() - lastJab > 2500) { lastJab = performance.now(); const L2 = PANIC(broke + 1); api.say(L2[api.int(0, L2.length - 1)], 'angry'); } }
      const all = revealed === rules.length && okN === rules.length; if (all) { graceUntil = performance.now() + 5000; setTimeout(() => alive && update(), 5100); } btn.disabled = !(all || performance.now() < graceUntil); prog.textContent = `${okN}/${rules.length} règles`;
      cur.className = 'bp-cur' + (firstBad < 0 ? ' okk' : '') + (cur.classList.contains('hot') ? ' hot' : '');
      const live = revealed && rules[revealed - 1].live ? ' · ' + rules[revealed - 1].live(p) : '';
      const bad = []; rows.forEach((r, i) => { if (!rules[i].f(p, c)) bad.push(i); }); const show = bad.slice(-3).reverse();
      const clone = (i) => h('span', {}, ...rules[i].t.filter((x) => !(x.tagName === 'CANVAS' || x.tagName === 'BR')).map((x) => (x.cloneNode ? x.cloneNode(true) : x)));
      if (show.length) cur.replaceChildren(...show.map((i) => h('div', { class: 'bp-cr' }, h('small', {}, 'RÈGLE ' + (i + 1)), clone(i)))); else cur.replaceChildren(h('small', {}, 'OK'), h('span', {}, revealed === rules.length ? 'Tout est conforme. Validez quand vous voulez.' : nxt && nxt.when && !nxt.when() ? 'Gérard prépare quelque chose…' : 'Une règle arrive…'));
      if (live) cnt.textContent += live;
      if (all && !btn.dataset.rdy) { btn.dataset.rdy = 1; api.sfx('good'); api.say('Tout est conforme. Cliquez quand vous voulez.', 'impressed'); } else if (!all) delete btn.dataset.rdy;
      renderView();
    }
    let ext = 0; api.onTick((ms) => { if (ms < 1500 && revealed >= rules.length - 3 && ext < 2 && !solved) { ext++; api.timer(60000); api.say('Prolongation accordée par Gérard. Ne le répétez pas.', 'impressed'); } });
    const iv = setInterval(() => {
      if (!alive || solved) return; let p = input.value;
      if (p.includes('🥚') && revealed > IDX('egg') && !hatched) { eggT++; if (eggT >= 5) { hatched = true; p = p.replace('🥚', '🐔'); setPw(p); api.sfx('confetti'); api.say('L’œuf éclot ! C’est… une poule. Gérard pleure de joie. Moi aussi, un peu.', 'impressed'); } }
      worm.className = 'bp-worm'; worm.textContent = '';
      if (p.includes('🥚') && !hatched && revealed > IDX('egg')) worm.textContent = `🥚 éclot dans ${Math.max(0, 5 - eggT)} s`;
      if (fireOn || fireStart) worm.textContent += (worm.textContent ? ' · ' : '') + (fireOn ? `🔥 foyer ${Math.min(2, foyers + 1)}/2` : fireDone ? '' : '🔥 départ de feu imminent');
      update();
    }, 1000);
    // l'incendie progresse plus vite que le reste
    const fiv = setInterval(() => {
      if (!alive || solved || !fireOn) return; const cs = [...input.value]; const k = cs.lastIndexOf('🔥'); if (k < 0) { if (!reignite) { foyers++; if (foyers >= 2) { fireOn = false; fireDone = true; api.say('Le dernier foyer est éteint. Les pompiers vous remercient. Moi, un peu.', 'impressed'); api.sfx('good'); update(); } else { api.say(`Foyer ${foyers}/2 éteint… ça couve. Il repart dans 6 s.`, 'worried'); reignite = setTimeout(() => { reignite = 0; if (!alive) return; const c2 = [...input.value]; const at = Math.min(c2.length, 2 + Math.floor(api.rng() * Math.max(1, c2.length - 8))); c2.splice(at, 0, '🔥'); setPw(c2.join('')); api.sfx('alarm'); api.say('Il repart ! Là, au milieu !', 'angry'); }, 6000); } } return; }
      if (k < cs.length - 1) { const lost = cs[k + 1]; cs[k + 1] = '🔥'; burnt++; api.sfx('tick'); setPw(cs.join('')); if (burnt % 3 === 1) api.say(`Le feu a avalé « ${lost} ». Il a bon appétit.`, 'worried'); }
    }, 2000);
    function submit() { if (solved || btn.disabled) return; solved = true; api.solve(); }
    update();
    let sy = 0;
    if (/cheat=1/.test(location.search)) {
      const build = () => {
        const mid = 'Gérard' + capWord + word + '!mars🌙12' + 'paris';
        const make = (d) => { const base = mid + (d === null ? '' : String(d)) + (hatched ? '🌱🐔🌱' : '🥚'); const padN = Math.max(0, L - len(base)); let f = ''; for (let i = 0; i < padN; i++) f += i % 2 ? 'y' : 'x'; return base + f + '!'; };
        const sum = dsum(make(null)); const d = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].find((x) => (sum + x) % 7 === 0);
        return make(d);
      };
      const sync = () => { host.dataset.answer = build(); }; sync(); sy = setInterval(sync, 300);
    }
    setTimeout(() => alive && input.focus({ preventScroll: true }), 50);
    return { destroy() { alive = false; clearInterval(iv); clearInterval(fiv); clearTimeout(revealTO); clearTimeout(reignite); clearTimeout(fireStart); clearInterval(sy); } };
  }
};
