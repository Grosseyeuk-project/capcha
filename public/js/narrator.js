// Gérard, Agent de Vérification. Voix du jeu : pince-sans-rire, de plus en plus mesquin, puis instable, puis visiblement fragile.
// Pools: tableau simple, ou { a, b, c } = début / milieu / fin de partie (selon la progression).
export const LINES = {
  start: [
    'Bonjour. Je suis Gérard, Agent de Vérification. Prouvez que vous êtes humain. Prenez votre temps. N’en prenez pas trop.',
    'Bienvenue au Portail de Conformité Humaine. Veuillez déposer votre âme dans le bac prévu à cet effet.',
    'Ce service est gratuit. Votre dignité, en revanche, est facturée en supplément.',
    'Un robot m’a dit que vous étiez humain. Je ne fais pas confiance aux robots. Ni à vous.',
    'Avant de commencer : non, je ne suis pas un robot. Je suis un agent. C’est administrativement différent.'
  ],
  again: [
    'Vous revoilà. Je m’étais fait une raison.',
    'Un nouvel essai. Votre persévérance est… notée. Dans la colonne « inquiétant ».',
    'Encore ? Très bien. J’ai rafraîchi le café et mes rancunes.'
  ],
  begin: [
    'Première vérification. Une formalité. Les formalités sont ce qui tue les gens.',
    'Commençons doucement. Vous méritez au moins cette illusion.',
    'Test numéro un : prouver que vous existez. Les philosophes ont échoué. Vous avez quelques secondes.',
    'Je ne vous juge pas. Je note. Dans un carnet. Avec un stylo rouge.'
  ],
  level: {
    a: [
      'Vérification suivante. Restez calme, ça me facilite le travail.',
      'Encore une. La paperasse ne s’arrête jamais, c’est ce qui la rend belle.',
      'On continue. Je note tout, pour information.'
    ],
    b: [
      'Vous êtes toujours là ? Impressionnant. Ou négligent de ma part.',
      'J’ai augmenté la difficulté. Rien de personnel. Si, un peu.',
      'Mon superviseur regarde. Ne me faites pas passer pour un idiot.'
    ],
    c: [
      'Je commence à manquer d’épreuves. Je vais devoir en inventer.',
      'Personne n’est allé aussi loin. Je n’ai pas de procédure pour ça.',
      'Je ne dors plus depuis le niveau 8. Vous en êtes responsable.'
    ]
  },
  tier2: ['Les choses sérieuses commencent. Jusqu’ici, c’était l’échauffement du personnel.'],
  tier3: ['Niveau trois. À partir d’ici, ma hiérarchie recommande « un peu de cruauté ». Je m’exécute.'],
  tier4: ['Vous entrez dans les épreuves absurdes. J’en suis le premier surpris : je les ai écrites à 3 h du matin.'],
  tier5: ['Dernière série. Je n’ai plus d’idées. Ni de budget. Ni d’amis. Courage.'],
  solve: {
    a: ['Validé. Rien d’exceptionnel.', 'Humain. Probablement.', 'Passez. Ne touchez à rien.'],
    b: [
      'Hmm. Encore validé. Je vais devoir être plus méchant.',
      'Correct. Je ne dis pas bravo. Je dis « correct ». Nuance.',
      'Validé. Je note quand même que vous avez eu de la chance.'
    ],
    c: [
      '… Validé. Ne le prenez pas pour un compliment. C’en est un, mais ne le prenez pas pour.',
      'Vous me rendez la tâche très difficile. Merci. Non, pas merci.',
      'Encore ? Vous êtes sûr de ne pas avoir de piston ? Moi, je n’en ai pas eu.'
    ]
  },
  solveFast: [
    'Déjà ? Vous avez triché. Je ne sais pas comment, mais je le sens.',
    'Trop rapide. Les robots sont rapides. Je ne dis rien. Je note.',
    'Record de vitesse. Je vais devoir vérifier que vous n’êtes pas deux dans le même manteau.',
    'Quatre secondes. Mon dernier stagiaire en a mis quarante. Il est parti élever des chèvres.'
  ],
  solveSlow: [
    'Vous avez pris votre temps. Le café était bon, au moins ?',
    'Un robot aurait été plus rapide. Un humain aussi, remarquez.',
    'J’ai eu le temps de relire mon règlement intérieur. Il est excellent.',
    'Validé. Au compte-gouttes, mais validé.',
    'C’était juste. J’ai presque eu de l’espoir. Presque.'
  ],
  streak3: [
    'Trois d’affilée. Je vous surveille de plus près.',
    'Série en cours. Je sors le deuxième carnet.',
    'Vous êtes lancé. Statistiquement, ça va mal finir.'
  ],
  streak5: [
    'Cinq d’affilée. Je n’aime pas ça. Ça me donne des sueurs.',
    'À ce stade, je soupçonne un humain exceptionnel ou un robot très poli.'
  ],
  strike1: [
    'Erreur. La première. On dit que c’est celle qui coûte.',
    'Mauvaise réponse. Je ne suis pas fâché. Je suis déçu. C’est pire.',
    'Un robot aurait fait la même erreur. Ça ne vous aide pas.',
    'Raté. Je note « maladroit, mais sincère ».',
    'Aïe. Ça m’a fait mal à moi aussi. Non, je mens.'
  ],
  strike2: [
    'Deuxième erreur. Je commence à avoir des doutes. Et un formulaire.',
    'Il ne vous reste qu’une chance. Elle est petite. Elle est fragile. Comme mes certitudes.',
    'Deux erreurs. Je dois prévenir mon superviseur. Qui est ma mère.',
    'Vous le faites exprès ? Dites-moi que c’est exprès.',
    'Je vous préviens : à la prochaine, je pleure. Pas de joie.'
  ],
  timeout: {
    a: [
      'Temps écoulé. Les humains sont lents, c’est connu.',
      'Trop tard. Le délai était pourtant clair. Il était écrit en petit.',
      'Vous avez hésité. Un robot n’hésite pas. Un humain si. Je suis perdu.'
    ],
    b: [
      'Chronomètre épuisé. J’ai attendu poliment. Intérieurement, non.',
      'Le temps, c’est de l’argent. Vous venez de me faire perdre les deux.'
    ],
    c: [
      'Vous avez dépassé le temps. Moi aussi, parfois. Dans ma vie. En général.',
      'Le temps est écoulé. Comme mon contrat. Comme ma patience. Comme mon mariage.'
    ]
  },
  idle: [
    'Vous êtes toujours là ? Je demande pour le registre.',
    'Le silence est un comportement suspect. Je note.',
    'Allô ? J’ai l’impression de parler à un mur. J’ai l’habitude.',
    'Si vous attendez que ça passe tout seul, ça ne passera pas.',
    'Vous réfléchissez ou vous êtes mort ? Les deux sont enregistrés.'
  ],
  idle2: [
    'Je vais compter jusqu’à… Non, en fait je n’ai pas de plan après ça.',
    'J’ai fini mon sandwich. Vous n’avez toujours rien fait.'
  ],
  online: ['Le mode en ligne ? En construction. Par un stagiaire. Soyez patient, il est lent et il pleure.'],
  over: [
    'Robot confirmé. Veuillez rester immobile pendant qu’on vous recycle.',
    'Trois erreurs. Verdict : grille-pain. Pas de recours possible.',
    'Accès refusé. Vous pouvez faire appel. L’appel est traité par moi. C’est non.',
    'Je suis désolé. Non, en fait, je ne suis pas désolé. Est-ce que c’est mal ?',
    'Vous êtes un robot. Ne le prenez pas mal. Moi aussi, un peu.',
    'Fin de session. Merci d’avoir contribué à ma moyenne.',
    'Votre dossier a été classé verticalement. Autrement dit : à la poubelle.',
    'Dommage. Vous aviez l’air humain. De dos.'
  ],
  win: [
    '… Vous êtes humain. Je n’en reviens pas. Je vais devoir mettre à jour mon manuel.',
    'Accès accordé. Vous pouvez passer. Ne me dites pas au revoir, ça me gêne.',
    'Félicitations. Je n’ai pas de tampon assez gros pour ça. J’ai pris celui des colis.',
    'Vous avez gagné. Je vais perdre mon poste. Merci beaucoup.',
    'Je demanderai une vérification de votre vérification. Par moi. Demain. Passez une bonne vie.',
    'C’est fini. Vous êtes officiellement humain. Les impôts arrivent dans la semaine.'
  ]
};

// Humeur du portrait selon la situation.
const MOODS = {
  start: 'neutral', again: 'smug', begin: 'smug', level: 'neutral', tier2: 'smug', tier3: 'smug', tier4: 'worried', tier5: 'worried',
  solve: 'neutral', solveFast: 'worried', solveSlow: 'smug', streak3: 'worried', streak5: 'worried',
  strike1: 'smug', strike2: 'angry', timeout: 'smug', idle: 'neutral', idle2: 'angry', online: 'worried', over: 'smug', win: 'impressed'
};
export function moodFor(key, ctx = {}) {
  if (key === 'solve') return (ctx.progress ?? 0) > 0.6 ? 'worried' : (ctx.progress ?? 0) > 0.3 ? 'impressed' : 'neutral';
  if (key === 'timeout' && (ctx.progress ?? 0) > 0.6) return 'angry';
  return MOODS[key] || 'neutral';
}

const recent = [];
const remember = (s) => { recent.push(s); if (recent.length > 18) recent.shift(); };

export const say = (key, r = Math.random, ctx = {}) => {
  let pool = LINES[key];
  if (!pool) return '';
  if (!Array.isArray(pool)) {
    const p = ctx.progress ?? 0;
    const st = p < 0.34 ? 'a' : p < 0.67 ? 'b' : 'c';
    pool = pool[st]?.length ? pool[st] : Object.values(pool).flat();
  }
  const fresh = pool.filter((s) => !recent.includes(s));
  const from = fresh.length ? fresh : pool.filter((s) => s !== recent[recent.length - 1]);
  const line = (from.length ? from : pool)[Math.floor(r() * (from.length ? from : pool).length)];
  remember(line);
  return line;
};
export const lineCount = () => Object.values(LINES).reduce((n, p) => n + (Array.isArray(p) ? p.length : Object.values(p).flat().length), 0);

// Rangs de fin de partie.
export function rankFor({ kind, progress, strikes, fast }) {
  if (kind === 'win') {
    if (strikes === 0) return 'Humain Certifié Premium (Gérard en pleure)';
    if (strikes === 1) return 'Humain Homologué, mention Bien (à peu près)';
    return 'Humain d’Occasion, Légèrement Rayé';
  }
  const tail = fast ? ' — suspectement rapide' : '';
  if (progress < 0.1) return 'Grille-pain en période d’essai' + tail;
  if (progress < 0.3) return 'Humain par erreur administrative' + tail;
  if (progress < 0.55) return 'Stagiaire en humanité' + tail;
  if (progress < 0.85) return 'Quasi-humain (sous réserve)' + tail;
  return 'Cyborg de bonne famille' + tail;
}
