import { css, frame, numWords, hasRule, coarse, infraction } from './a_kit.js';
css('math', `
.am-p{background:#f6f7f9;border:1px dashed #c9ccd1;border-radius:4px;padding:10px 12px 10px 12px;font-size:14px;line-height:1.5}
.am-p ol{margin:6px 0 0;padding-left:20px}
.am-p li{margin:2px 0}
.am-p li::marker{color:#1a73e8;font-weight:700}
.am-p em{font-style:normal;font-weight:700;color:#1a3d7c}
.am-p{position:relative;overflow:hidden}.am-p li{opacity:0;animation:am-in .4s both}
@keyframes am-in{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:none}}
.am-st{position:absolute;right:8px;bottom:8px;border:2px solid #c62828;color:#c62828;font:900 9px/1.1 system-ui;letter-spacing:.1em;padding:3px 5px;border-radius:3px;transform:rotate(7deg) scale(1);animation:am-stamp .35s .7s both;text-align:center;opacity:.85}
@keyframes am-stamp{from{transform:rotate(7deg) scale(2.4);opacity:0}to{transform:rotate(7deg) scale(1);opacity:.85}}
.am-p em{display:inline-block;animation:am-pulse 2.4s infinite}
@keyframes am-pulse{50%{transform:scale(1.08)}}
.am-r{display:flex;align-items:center;gap:8px;margin-top:10px}
.am-r label{font-weight:600;font-size:13px;flex:1}
.am-n{width:128px;height:42px;border:2px solid #c9ccd1;border-radius:3px;font:700 20px ui-monospace,Menlo,monospace;text-align:center;outline:0;transition:border-color .15s,box-shadow .15s;background:#fff;color:#202124;user-select:text;-webkit-user-select:text;-moz-appearance:textfield}
.am-n:focus{border-color:#1a73e8;box-shadow:0 0 0 3px rgba(26,115,232,.2)}
`);
export default {
  id: 'a_math', tier: 1, title: 'Calcul mental', time: 40000,
  mount(host, api) {
    const { h } = api; const a = api.int(4, 19), b = api.int(3, 15), c = api.int(2, 4), d = api.int(2, 12);
    const v1 = a + b, v2 = v1 * c, v3 = v2 - d;
    const steps = [`Pensez au nombre <em>${numWords(a)}</em>.`, `Ajoutez-lui <em>${numWords(b)}</em>.`, `Multipliez le résultat par <em>${numWords(c)}</em>.`, `Retirez-en <em>${numWords(d)}</em>.`];
    const wrong = { prio: a + b * c - d, noMul: v1 - d, noSub: v2, add: a + b + c - d, sub: v3 + 2 * d };
    const p = h('div', { class: 'am-p' }, h('div', {}, 'Exécutez ces ordres dans l’ordre, comme à la mairie :'));
    const ol = h('ol'); steps.forEach((s, i) => { const li = h('li'); li.style.animationDelay = .25 + i * .3 + 's'; li.innerHTML = s; ol.append(li); }); p.append(ol, h('div', { class: 'am-st' }, 'CALCULATRICE', h('br'), 'CONFISQUÉE'));
    const inp = h('input', { class: 'am-n', id: 'am-n', type: 'text', inputmode: 'numeric', autocomplete: 'off', 'aria-label': 'Résultat en chiffres', placeholder: '?', onkeydown: (e) => { if (e.key === 'Enter') check(); } });
    const WORDS = hasRule('a_math', 'R2');
    if (WORDS) { inp.placeholder = 'en lettres'; inp.style.width = '200px'; inp.style.fontSize = '15px'; inp.removeAttribute('inputmode'); }
    const fr = frame(h, { api, id: 'a_math', small: WORDS ? 'Répondez en toutes lettres (règle 2)' : 'Répondez en chiffres', title: 'Quel est le résultat ?', note: 'Chaque opération s’applique au résultat précédent. Pas de priorité, pas de parenthèses, pas de pitié.', body: [p, h('div', { class: 'am-r' }, h('label', { for: 'am-n' }, 'Résultat final'), inp)], onVerify: check });
    host.append(fr.el); if (!coarse()) setTimeout(() => inp.focus(), 50);
    if (/cheat=1/.test(location.search)) host.dataset.answer = WORDS ? numWords(v3) : v3;
    function checkWords() {
      const raw = inp.value.trim(), n = (x) => x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[-\s]+/g, ' ').trim();
      if (/\d/.test(raw)) { fr.shake(); infraction(); return api.fail('Un chiffre ! Règle 2 : les nombres s’écrivent désormais en toutes lettres. Elle figure sous « règles », dans la carte. Dépliable. Mais bon.'); }
      if (raw !== raw.toLowerCase()) { fr.shake(); infraction('upper'); return api.fail('Règle 1 : minuscules. Vous criez vos réponses, comme un robot en colère.'); }
      if (n(raw) === n(numWords(v3))) { fr.el.classList.add('ak-ok'); return api.solve(); }
      fr.shake();
      const k = Object.entries({ [wrong.prio]: 'la priorité des opérateurs', [wrong.noMul]: 'l’oubli de la multiplication', [wrong.noSub]: 'l’oubli de la soustraction' }).find(([w]) => n(numWords(+w)) === n(raw));
      api.fail(!raw ? 'Réponse vide. Zéro point, mais zéro effort : c’est cohérent.' : k ? 'Bon calcul… pour ' + k[1] + '. Ici, on suit les ordres dans l’ordre, comme à la mairie.' : `« ${raw} » ? Je n’ai pas d’explication. Trois calculatrices (confisquées) ne vous suivent pas non plus.`);
    }
    function check() {
      if (WORDS) return checkWords();
      const s = inp.value.trim().replace(/\s/g, ''); const v = Number(s);
      if (s !== '' && /^-?\d+$/.test(s) && v === v3) { fr.el.classList.add('ak-ok'); return api.solve(); }
      fr.shake(); let m;
      if (s === '') m = 'Réponse vide. Zéro point, mais zéro effort : c’est cohérent.';
      else if (!/^-?\d+$/.test(s)) m = `« ${s} » n’est pas un nombre en chiffres. On vous a demandé des chiffres, pas de la poésie.`;
      else if (v === wrong.prio) m = 'Vous avez appliqué la priorité des opérateurs. Ici on suit les ordres dans l’ordre, comme à la mairie.';
      else if (v === wrong.noMul) m = 'Vous avez oublié de multiplier. Je ne vous juge pas. Si, un peu.';
      else if (v === wrong.noSub) m = 'Vous avez oublié de retirer à la fin. Les derniers ordres sont aussi des ordres.';
      else if (v === wrong.sub) m = 'Vous avez ajouté au lieu de retirer. Optimiste, mais faux.';
      else if (Math.abs(v - v3) === 1) m = 'À une unité près. Les robots font mieux, et les poètes aussi.';
      else if (v < 0 && v3 >= 0) m = 'Un résultat négatif ? À ce stade, c’est votre moral qui parle.';
      else m = `${v} ? Je n’ai pas d’explication. J’ai essayé, avec trois calculatrices : aucune ne vous suit.`;
      api.fail(m);
    }
    return { destroy() {} };
  }
};
