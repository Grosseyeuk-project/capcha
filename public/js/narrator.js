export const LINES = {
  start: ['Bonjour. Veuillez prouver que vous êtes humain. Ce ne sera pas long. Ce sera long.'],
  solve: ['Hmm. Humain, apparemment.'],
  strike: ['Suspect.'],
  over: ['Robot confirmé.'],
  win: ['Bien. Vous pouvez passer. Je vous surveille.']
};
export const say = (k, r) => { const a = LINES[k]; return a[Math.floor(r() * a.length)]; };
