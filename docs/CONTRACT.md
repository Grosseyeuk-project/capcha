# CAPCHA — architecture contract

Static site in `public/` (ES modules, no bundler, three.js vendored, import map `three`) + `server/` (node http + ws).
Run: `npm start` → http://localhost:8080 . Language of all player-facing text: **French**. Tone: deadpan, bureaucratic-paranoid, funny.

## Pieces (each owned by one builder, judged alone)
| id | piece | files |
|---|---|---|
| shell | engine, screens (title/level/gameover/win), HUD, 3D background, audio, juice, narrator voice | `public/js/{main,game,ui,scene,audio,narrator}.js`, `public/css/style.css` |
| captchas-a | tiers 1–2 captchas | `public/js/captchas/a_*.js` |
| captchas-b | tiers 3–5 captchas (cruel, absurd, finale) | `public/js/captchas/b_*.js` |
| online | lobby, rooms, race, spectator/leaderboard, server | `server/online.js`, `public/js/online/*` |

`public/js/captchas/index.js` lists the order (a_* then b_*). Add your modules there (only touch your own lines).

## Captcha module
```js
export default {
  id: 'a_checkbox',          // unique
  tier: 1,                   // 1..5, difficulty ramps with tier
  title: 'Case à cocher',    // shown small, in French
  time: 20000,               // ms allowed (optional, engine default by tier)
  mount(host, api) {         // host: empty <div class="cap-host"> to fill. Must be fully self-contained.
    // build UI with api.h(...). Use api.rng for ALL randomness (seeded => identical puzzle for all online players).
    return { destroy() {} }; // remove listeners/timers/WebGL you created
  }
};
```
`api`: `rng()` seeded 0..1, `int(a,b)` inclusive, `pick(arr)`, `shuffle(arr)`, `seed`, `level` (1-based), `h(tag, attrs, ...kids)` DOM helper (attrs: class, style obj, on*, data/aria), `THREE`,
`solve()` — player passed (call once), `fail(msg)` — wrong answer: costs a strike, narrator reacts with `msg` (French, specific & funny, never just "Faux"),
`say(text, mood)` narrator aside (mood: 'neutral'|'smug'|'angry'|'worried'|'impressed'), `sfx(name)` ('click','pop','tick','good','bad','whoosh'),
`timer(ms)` restart this captcha's countdown (e.g. multi-stage), `onTick(fn)` fn(msLeft) each frame while active, `reducedMotion` bool.
After `fail`, engine re-mounts the same captcha with a NEW seed (unless `fail(msg, {retry:true})` which keeps the UI and just costs the strike).
Captchas must be keyboard-accessible where reasonable, work 360px→1920px wide, and be solvable (never ambiguous; verify with the seed's ground truth).

## Engine
`new Game({ root, seedFor(level)→int, mode:'solo'|'online', onEvent(evt) })`. Events: `{type:'level', level}`, `'solve' {level, ms}`, `'strike' {strikes}`, `'over' {level}`, `'win'`. 3 strikes = game over. Timer expiry = strike.
`game.start()`, `game.destroy()`. Online piece drives it with shared seeds and reads events.

## Verification
`node tools/shot.mjs <scenario>` (shell piece maintains) screenshots the live game with Playwright (chromium at /opt/pw-browsers). Debug URL params: `?level=N` jumps to level N, `?cap=<id>` mounts one captcha alone, `?seed=N`, `?cheat=1` exposes `window.__cap.solve()/fail()`.
