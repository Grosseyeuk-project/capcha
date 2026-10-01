import { startScene } from './scene.js';
import { Game } from './game.js';
import { CAPTCHAS } from './captchas/index.js';

const q = new URLSearchParams(location.search);
startScene(document.getElementById('bg'));
const game = new Game({ root: document.getElementById('app'), startLevel: +q.get('level') || 1, seedFor: q.get('seed') ? () => +q.get('seed') : undefined });
if (q.get('cap')) { const i = CAPTCHAS.findIndex((c) => c.id === q.get('cap')); if (i >= 0) game.level = i + 1; }
game.start();
if (q.get('cheat')) window.__cap = { solve: () => game.cur.api.solve(), fail: () => game.cur.api.fail('cheat'), game };
