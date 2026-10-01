// Scoped styles for the online mode. Everything prefixed ol-.
const CSS = `
.ol-root{--ol-bg:#080a11;--ol-panel:#121623;--ol-panel2:#181d2e;--ol-line:#2a3354;--ol-fg:#e8ecf5;--ol-dim:#8a94b4;--ol-acc:#5b8cff;--ol-good:#4ee39b;--ol-bad:#ff5d6c;--ol-warn:#ffd166;
 position:fixed;inset:0;z-index:1000;color:var(--ol-fg);font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:rgba(6,8,14,.9);backdrop-filter:blur(6px);overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;animation:ol-fade .25s ease}
.ol-root *{box-sizing:border-box}
.ol-root button{font:inherit;color:inherit;cursor:pointer}
@keyframes ol-fade{from{opacity:0}to{opacity:1}}
@keyframes ol-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes ol-pop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.15);opacity:1}100%{transform:scale(1)}}
@keyframes ol-pulse{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes ol-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-5px)}40%{transform:translateX(5px)}60%{transform:translateX(-3px)}80%{transform:translateX(3px)}}
@keyframes ol-good{0%{background:rgba(78,227,155,.45)}100%{background:transparent}}
@keyframes ol-badf{0%{background:rgba(255,93,108,.5)}100%{background:transparent}}
@keyframes ol-grow{from{transform:scaleY(0)}to{transform:scaleY(1)}}
@keyframes ol-fall{0%{transform:translateY(-10vh) rotate(0);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:.8}}
.ol-wrap{max-width:720px;margin:0 auto;padding:18px 16px 40px;min-height:100%;display:flex;flex-direction:column;gap:14px}
.ol-wide{max-width:1100px}
.ol-top{display:flex;align-items:center;gap:10px;justify-content:space-between;font:600 12px ui-monospace,Menlo,monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--ol-dim)}
.ol-live{display:inline-flex;align-items:center;gap:7px}
.ol-live i{width:8px;height:8px;border-radius:50%;background:var(--ol-good);box-shadow:0 0 8px var(--ol-good);animation:ol-pulse 1.6s infinite}
.ol-live.off i{background:var(--ol-bad);box-shadow:0 0 8px var(--ol-bad)}
.ol-ghostbtn{background:none;border:1px solid var(--ol-line);border-radius:8px;padding:6px 12px;color:var(--ol-dim);font:600 12px ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase}
.ol-ghostbtn:hover{color:var(--ol-fg);border-color:var(--ol-acc)}
.ol-title{font:800 clamp(26px,6vw,40px)/1.05 system-ui;margin:6px 0 0;letter-spacing:-.02em}
.ol-title small{display:block;font:500 14px/1.4 system-ui;color:var(--ol-dim);letter-spacing:0;margin-top:8px}
.ol-card{background:var(--ol-panel);border:1px solid var(--ol-line);border-radius:14px;padding:18px;animation:ol-rise .3s ease both}
.ol-card h3{margin:0 0 10px;font:700 11px ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase;color:var(--ol-dim)}
.ol-field{width:100%;background:#0b0e18;border:1px solid var(--ol-line);border-radius:10px;padding:12px 14px;color:var(--ol-fg);font:600 17px system-ui;outline:none}
.ol-field:focus{border-color:var(--ol-acc);box-shadow:0 0 0 3px rgba(91,140,255,.22)}
.ol-code-in{text-transform:uppercase;letter-spacing:.35em;text-align:center;font:700 20px ui-monospace,monospace}
.ol-row2{display:flex;gap:10px}
.ol-row2>*{flex:1;min-width:0}
.ol-btn{border:1px solid var(--ol-line);background:var(--ol-panel2);border-radius:10px;padding:13px 16px;font-weight:700;transition:transform .08s,border-color .15s,background .15s}
.ol-btn:hover:not(:disabled){border-color:var(--ol-acc);background:#1c2340}
.ol-btn:active:not(:disabled){transform:scale(.98)}
.ol-btn:disabled{opacity:.4;cursor:not-allowed}
.ol-btn.pri{background:var(--ol-acc);border-color:var(--ol-acc);color:#fff}
.ol-btn.pri:hover:not(:disabled){background:#7aa0ff}
.ol-btn.good{background:var(--ol-good);border-color:var(--ol-good);color:#04170e}
.ol-btn small{display:block;font-weight:500;font-size:12px;opacity:.75;margin-top:2px}
.ol-err{color:var(--ol-bad);font-size:13px;min-height:1.2em;margin:6px 0 0}
.ol-code{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.ol-code b{font:800 clamp(34px,9vw,52px) ui-monospace,Menlo,monospace;letter-spacing:.18em;padding-left:.18em;line-height:1}
.ol-badge{font:700 10px ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;border:1px solid var(--ol-line);border-radius:99px;padding:4px 9px;color:var(--ol-dim)}
.ol-badge.acc{color:var(--ol-acc);border-color:var(--ol-acc)}
.ol-plist{display:flex;flex-direction:column;gap:7px}
.ol-pl{display:flex;align-items:center;gap:11px;padding:9px 12px;border-radius:10px;background:var(--ol-panel2);border:1px solid transparent;animation:ol-rise .25s ease both}
.ol-pl.me{border-color:rgba(91,140,255,.55)}
.ol-pl .nm{flex:1;min-width:0;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ol-pl .nm em{font:600 10px ui-monospace,monospace;color:var(--ol-dim);font-style:normal;letter-spacing:.1em;margin-left:6px;text-transform:uppercase}
.ol-av{width:30px;height:30px;border-radius:50%;flex:none;display:grid;place-items:center;font:800 13px system-ui;color:#0a0c14;background:var(--c,#5b8cff)}
.ol-chip{font:700 11px ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase;padding:4px 9px;border-radius:99px;background:#0b0e18;color:var(--ol-dim);white-space:nowrap}
.ol-chip.ok{color:var(--ol-good);background:rgba(78,227,155,.12)}
.ol-chip.bad{color:var(--ol-bad);background:rgba(255,93,108,.12)}
.ol-chip.warn{color:var(--ol-warn);background:rgba(255,209,102,.1)}
.ol-meter{height:6px;border-radius:9px;background:#0b0e18;overflow:hidden;margin-top:10px}
.ol-meter i{display:block;height:100%;background:linear-gradient(90deg,var(--ol-acc),#8fb0ff);width:0;transition:width .15s linear}
.ol-hint{color:var(--ol-dim);font-size:13px;line-height:1.45}
.ol-emotes{display:flex;flex-wrap:wrap;gap:6px}
.ol-emotes button{background:#0b0e18;border:1px solid var(--ol-line);border-radius:99px;padding:6px 11px;font-size:12px;color:var(--ol-dim)}
.ol-emotes button:hover{color:var(--ol-fg);border-color:var(--ol-acc)}
.ol-count{position:fixed;inset:0;z-index:5;display:grid;place-content:center;text-align:center;background:rgba(5,7,12,.86);gap:6px}
.ol-count b{font:900 clamp(120px,32vw,260px)/1 system-ui;color:#fff;text-shadow:0 0 60px rgba(91,140,255,.75);animation:ol-pop .45s ease both}
.ol-count span{font:700 13px ui-monospace,monospace;letter-spacing:.2em;text-transform:uppercase;color:var(--ol-dim)}
.ol-count.go b{color:var(--ol-good);text-shadow:0 0 60px rgba(78,227,155,.75)}
/* toasts */
.ol-toasts{position:fixed;left:0;right:0;bottom:14px;z-index:20;display:flex;flex-direction:column;align-items:center;gap:7px;pointer-events:none;padding:0 12px}
.ol-toast{max-width:min(440px,100%);background:#0e1220;border:1px solid var(--ol-line);border-left:4px solid var(--ol-acc);border-radius:10px;padding:9px 14px;font-size:14px;line-height:1.35;box-shadow:0 8px 28px rgba(0,0,0,.5);animation:ol-rise .22s ease both;transition:opacity .35s,transform .35s}
.ol-toast.bad{border-left-color:var(--ol-bad)}.ol-toast.good{border-left-color:var(--ol-good)}.ol-toast.warn{border-left-color:var(--ol-warn)}
.ol-toast.out{opacity:0;transform:translateY(8px)}
/* race */
.ol-rtop{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font:700 12px ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase}
.ol-rtop .pill{background:var(--ol-panel);border:1px solid var(--ol-line);border-radius:99px;padding:6px 12px;display:inline-flex;gap:6px;align-items:center}
.ol-rtop .pill b{font-size:15px;color:#fff;letter-spacing:0}
.ol-rtop .sp{flex:1}
.ol-rank.up b{color:var(--ol-good)}.ol-rank.down b{color:var(--ol-bad)}
.ol-rank.pop b{animation:ol-pop .4s ease}
.ol-last{background:linear-gradient(90deg,#4b0f18,#7a1624);border:1px solid var(--ol-bad);border-radius:10px;padding:10px 14px;font-weight:800;text-align:center;animation:ol-pulse 1s infinite}
.ol-race{display:grid;grid-template-columns:minmax(0,1fr) 310px;gap:16px;align-items:start}
.ol-stage{min-width:0}
.ol-game{max-width:640px;margin:0 auto}
.ol-rail{background:var(--ol-panel);border:1px solid var(--ol-line);border-radius:14px;padding:10px;position:sticky;top:10px}
.ol-rail h3{margin:2px 4px 8px;font:700 10px ui-monospace,monospace;letter-spacing:.16em;color:var(--ol-dim);text-transform:uppercase;display:flex;justify-content:space-between}
.ol-rows{position:relative;display:flex;flex-direction:column;gap:4px}
.ol-prow{display:grid;grid-template-columns:20px 22px 1fr auto;grid-template-areas:"rk av nm lv" "rk av bar st" "tt tt tt tt";column-gap:8px;row-gap:3px;padding:7px 8px;border-radius:9px;background:var(--ol-panel2);align-items:center;border:1px solid transparent;will-change:transform}
.ol-prow.me{border-color:rgba(91,140,255,.6)}
.ol-prow .rk{grid-area:rk;font:800 14px ui-monospace,monospace;color:var(--ol-dim);text-align:center}
.ol-prow .av{grid-area:av;width:22px;height:22px;border-radius:50%;background:var(--c);display:grid;place-items:center;font:800 11px system-ui;color:#0a0c14}
.ol-prow .nm{grid-area:nm;font-weight:700;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ol-prow .lv{grid-area:lv;font:700 12px ui-monospace,monospace;color:var(--ol-dim)}
.ol-prow .bar{grid-area:bar;height:6px;border-radius:9px;background:#0b0e18;overflow:hidden}
.ol-prow .bar i{display:block;height:100%;width:0;background:var(--c);transition:width .55s cubic-bezier(.2,.9,.3,1);border-radius:9px}
.ol-prow .st{grid-area:st;display:flex;gap:3px;justify-content:flex-end}
.ol-prow .st u{width:8px;height:8px;border-radius:50%;background:#0b0e18;border:1px solid var(--ol-line)}
.ol-prow .st u.x{background:var(--ol-bad);border-color:var(--ol-bad)}
.ol-prow .tt{grid-area:tt;font-size:11.5px;line-height:1.3;color:var(--ol-bad);display:none}
.ol-prow.has-tt .tt{display:block}
.ol-prow.fgood{animation:ol-good .7s ease}.ol-prow.fbad{animation:ol-badf .8s ease,ol-shake .35s ease}
.ol-prow.out{opacity:.5}.ol-prow.out .nm{text-decoration:line-through}.ol-prow.off .nm::after{content:' (hors ligne)';color:var(--ol-warn);font-size:10px}
.ol-prow.done .lv{color:var(--ol-good)}
.ol-rail .ol-emotes{margin-top:9px}
/* ghost / spectator */
.ol-ghost{background:var(--ol-panel);border:1px solid var(--ol-line);border-radius:14px;padding:18px;display:flex;flex-direction:column;gap:14px;animation:ol-rise .3s ease both}
.ol-stamp{display:inline-block;align-self:flex-start;font:900 22px ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;border:3px solid var(--ol-bad);color:var(--ol-bad);padding:4px 14px;border-radius:6px;transform:rotate(-3deg);animation:ol-pop .4s ease both}
.ol-stamp.ok{border-color:var(--ol-good);color:var(--ol-good)}
.ol-lanes{display:flex;flex-direction:column;gap:9px}
.ol-lane{display:grid;grid-template-columns:78px 1fr;gap:10px;align-items:center;font-size:12px;font-weight:700}
.ol-lane .t{position:relative;height:22px;border-radius:99px;background:#0b0e18;border:1px solid var(--ol-line)}
.ol-lane .t s{position:absolute;top:50%;width:1px;height:8px;background:var(--ol-line);transform:translateY(-50%)}
.ol-lane .t i{position:absolute;top:50%;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;background:var(--c);box-shadow:0 0 12px var(--c);transition:left .7s cubic-bezier(.2,.9,.3,1);display:grid;place-items:center;font:800 10px system-ui;color:#0a0c14}
.ol-lane.out .t i{opacity:.4;box-shadow:none;filter:grayscale(.6)}
.ol-lane .n{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ol-feed{display:flex;flex-direction:column;gap:5px;font-size:13px;max-height:190px;overflow:hidden}
.ol-feed p{margin:0;padding:6px 10px;border-radius:7px;background:var(--ol-panel2);color:var(--ol-dim);animation:ol-rise .25s ease both}
.ol-feed p.bad{color:#ff9aa4}.ol-feed p.good{color:#8ef0be}
/* end */
.ol-end h1{margin:0;font:900 clamp(30px,8vw,52px)/1 system-ui;letter-spacing:-.02em;animation:ol-pop .5s ease both}
.ol-end h1.win{color:var(--ol-good)}.ol-end h1.lose{color:var(--ol-bad)}
.ol-podium{display:grid;grid-template-columns:1fr 1.1fr 1fr;gap:10px;align-items:end;min-height:200px;margin:6px 0}
.ol-pod{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;min-width:0}
.ol-pod .av{width:46px;height:46px;border-radius:50%;background:var(--c);display:grid;place-items:center;font:900 20px system-ui;color:#0a0c14;box-shadow:0 0 22px var(--c);animation:ol-pop .5s ease both;animation-delay:var(--d)}
.ol-pod .nm{font-weight:800;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ol-pod .sub{font:600 11px ui-monospace,monospace;color:var(--ol-dim)}
.ol-pod .blk{width:100%;border-radius:10px 10px 0 0;background:linear-gradient(180deg,var(--c),#161b2e 140%);display:grid;place-items:start center;padding-top:8px;font:900 28px ui-monospace,monospace;color:rgba(0,0,0,.55);transform-origin:bottom;animation:ol-grow .6s cubic-bezier(.2,.9,.3,1) both;animation-delay:var(--d)}
.ol-pod.p1 .blk{height:120px}.ol-pod.p2 .blk{height:84px}.ol-pod.p3 .blk{height:56px}
.ol-tbl{width:100%;border-collapse:collapse;font-size:13px}
.ol-tbl th{font:700 10px ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--ol-dim);text-align:left;padding:4px 6px}
.ol-tbl td{padding:8px 6px;border-top:1px solid var(--ol-line);white-space:nowrap}
.ol-tbl tr.me td{background:rgba(91,140,255,.1)}
.ol-tbl td:nth-child(2){max-width:110px;overflow:hidden;text-overflow:ellipsis}
.ol-conf{position:fixed;inset:0;pointer-events:none;z-index:4;overflow:hidden}
.ol-conf i{position:absolute;top:0;width:9px;height:14px;animation:ol-fall linear forwards}
@media (max-width:820px){
 .ol-race{grid-template-columns:1fr}
 .ol-rail{order:-1;position:static;padding:7px}
 .ol-rows{max-height:136px;overflow-y:auto}
 .ol-prow{grid-template-columns:16px 20px minmax(0,84px) 1fr auto auto;grid-template-areas:'rk av nm bar lv st';padding:5px 7px}
 .ol-prow .av{width:20px;height:20px;font-size:10px}
 .ol-prow .nm{font-size:12px}
 .ol-rtop{gap:6px}.ol-rtop .pill{padding:5px 9px}
 .ol-prow .tt{display:none!important}
 .ol-rail .ol-emotes{display:none}
 .ol-rail h3{margin-bottom:5px}
 .ol-wrap{padding:12px 12px 30px}
 .ol-tbl .hm{display:none}
}
@media (prefers-reduced-motion:reduce){.ol-root *{animation-duration:.01s!important;transition-duration:.01s!important}}
/* ===== Ministère skin : papier, encre, tampons, jaune de signalisation ===== */
.ol-root{--ink:#10202a;--paper:#f6f1e4;--paper2:#ebe4d2;--yel:#ffd23f;--ol-acc:#ffd23f;--ol-good:#0e8a6d;--ol-bad:#c8102e;--ol-warn:#b36b00;
 --disp:'Bricolage Grotesque','Arial Black',system-ui,sans-serif;--mono:'IBM Plex Mono',ui-monospace,Menlo,Consolas,monospace;
 background:rgba(4,7,10,.5);backdrop-filter:none;color:#eaf2f0;font-family:var(--disp)}
.ol-card,.ol-rail,.ol-ghost{--ol-fg:var(--ink);--ol-dim:#6b6a5c;--ol-line:rgba(16,32,42,.35);--ol-panel2:var(--paper2);background:var(--paper);color:var(--ink);border:3px solid var(--ink);border-radius:14px;box-shadow:0 6px 0 #000}
.ol-card h3,.ol-rail h3{font:600 .68rem/1 var(--mono);letter-spacing:.16em;color:#7a7767}
.ol-top{color:var(--yel);font-family:var(--mono)}
.ol-ghostbtn{background:rgba(7,11,15,.7);border:2px solid rgba(246,241,228,.5);color:#eaf2f0;border-radius:8px;font-family:var(--mono)}
.ol-ghostbtn:hover{border-color:var(--yel);color:var(--yel)}
.ol-card .ol-ghostbtn,.ol-rail .ol-ghostbtn{background:transparent;color:var(--ink);border-color:var(--ink)}
.ol-title{font-family:var(--disp);font-weight:800;color:var(--paper);letter-spacing:-.03em;text-shadow:0 4px 0 #000}
.ol-title small{color:#a9bcbc;text-shadow:none;font-family:var(--mono);font-size:13px}
.ol-field{background:#fff;color:var(--ink);border:2.5px solid var(--ink);border-radius:10px;font-family:var(--disp)}
.ol-field:focus{border-color:var(--ink);box-shadow:0 0 0 4px var(--yel)}
.ol-btn{background:var(--paper);color:var(--ink);border:2.5px solid var(--ink);border-radius:10px;font:800 1rem/1.1 var(--disp);box-shadow:0 5px 0 #000;padding:14px 16px}
.ol-btn:hover:not(:disabled){background:#fff;border-color:var(--ink);transform:translateY(-2px);box-shadow:0 7px 0 #000}
.ol-btn:active:not(:disabled){transform:translateY(4px);box-shadow:0 1px 0 #000}
.ol-btn.pri,.ol-btn.pri:hover:not(:disabled){background:var(--yel);color:var(--ink);border-color:var(--ink)}
.ol-btn.good,.ol-btn.good:hover:not(:disabled){background:#2de2c0;color:var(--ink);border-color:var(--ink)}
.ol-btn small{font-family:var(--mono);font-size:11px}
.ol-err{color:#c8102e;font-family:var(--mono);font-weight:600}
.ol-code b{font-family:var(--mono);color:var(--ink);background:var(--yel);border:3px solid var(--ink);padding:4px 10px 4px 14px;border-radius:8px;box-shadow:0 4px 0 #000;transform:rotate(-1.5deg)}
.ol-badge{font-family:var(--mono);border:2px solid var(--ink);color:var(--ink);background:var(--paper2)}
.ol-badge.acc{background:var(--ink);color:var(--yel);border-color:var(--ink)}
.ol-pl,.ol-prow{background:var(--paper2);border:2px solid rgba(16,32,42,.25);color:var(--ink)}
.ol-pl.me,.ol-prow.me{background:#fff3c4;border-color:var(--ink)}
.ol-pl .nm em,.ol-prow .lv{color:#6b6a5c}
.ol-chip{background:#fff;color:#6b6a5c;border:1.5px solid rgba(16,32,42,.3);font-family:var(--mono)}
.ol-chip.ok{background:#bff3de;color:#0b6a52;border-color:#0b6a52}.ol-chip.bad{background:#ffd0d4;color:#a50f26;border-color:#a50f26}.ol-chip.warn{background:#ffe9b0;color:#7a4b00;border-color:#b36b00}
.ol-av,.ol-prow .av,.ol-pod .av{border:2px solid var(--ink);color:var(--ink)}
.ol-meter,.ol-prow .bar,.ol-lane .t{background:rgba(16,32,42,.15);border-color:rgba(16,32,42,.3)}
.ol-meter i{background:var(--ink)}
.ol-prow .bar i{background:var(--c)}
.ol-prow .st u{background:#fff;border-color:var(--ink)}.ol-prow .st u.x{background:var(--ol-bad);border-color:var(--ol-bad)}
.ol-hint{color:#a9bcbc;font-family:var(--mono);font-size:12.5px}
.ol-card .ol-hint,.ol-ghost .ol-hint{color:#6b6a5c}
.ol-emotes button{background:var(--paper);border:2px solid var(--ink);color:var(--ink);font-family:var(--mono)}
.ol-emotes button:hover{background:var(--yel);border-color:var(--ink);color:var(--ink)}
.ol-root>div>.ol-wrap>.ol-emotes button,.ol-wrap>.ol-emotes button{background:rgba(7,11,15,.7);color:#eaf2f0;border-color:rgba(246,241,228,.5)}
.ol-toast{background:var(--ink);color:var(--paper);border:2px solid var(--yel);border-left-width:6px;border-radius:8px;font-family:var(--mono);font-size:13px;box-shadow:0 4px 0 #000}
.ol-toast.bad{border-color:#ff3b4e}.ol-toast.good{border-color:#2de2c0}
.ol-rtop .pill{background:rgba(7,11,15,.78);border:2px solid rgba(246,241,228,.4);color:#eaf2f0;font-family:var(--mono)}
.ol-rtop .pill b{color:var(--yel)}
.ol-rank.up b{color:#2de2c0}.ol-rank.down b{color:#ff5d6c}
.ol-last{background:var(--ink);border:3px solid #ff3b4e;color:#ffd9dd;font-family:var(--mono);text-transform:uppercase;letter-spacing:.1em}
.ol-rail h3{color:#7a7767}
.ol-stamp{font-family:var(--disp);font-weight:800;border:6px double #c8102e;color:#c8102e;border-radius:10px;font-size:clamp(26px,7vw,40px);padding:2px 18px;transform:rotate(-6deg);mix-blend-mode:multiply;background:rgba(246,241,228,.6)}
.ol-stamp.ok{border-color:#0e8a6d;color:#0e8a6d}
.ol-lane .t i{border:2px solid var(--ink);color:var(--ink)}
.ol-feed p{background:var(--paper2);color:var(--ink);font-family:var(--mono);font-size:12px;border:1.5px solid rgba(16,32,42,.25)}
.ol-feed p.bad{color:#a50f26;background:#ffd0d4}.ol-feed p.good{color:#0b6a52;background:#bff3de}
.ol-end h1{font-family:var(--disp);font-weight:800;text-shadow:0 4px 0 #000;margin:0}
.ol-end h1.win{color:#2de2c0}.ol-end h1.lose{color:#ff5d6c}
.ol-pod .nm{color:var(--ink)}.ol-pod .sub{color:#6b6a5c;font-family:var(--mono)}
.ol-pod .blk{background:linear-gradient(180deg,var(--c),#d8cfb6 160%);border:3px solid var(--ink);border-bottom:0;color:var(--ink)}
.ol-tbl th{font-family:var(--mono);color:#7a7767}.ol-tbl td{border-top:1.5px solid rgba(16,32,42,.2);font-family:var(--mono);font-size:12.5px}
.ol-tbl tr.me td{background:#fff3c4}
.ol-verdict{display:flex;justify-content:center;margin:2px 0 6px}
.ol-bigstamp{display:inline-block;font:800 clamp(2rem,9vw,3.6rem)/1 var(--disp);letter-spacing:.06em;padding:4px 22px;border:7px double currentColor;border-radius:12px;transform:rotate(-5deg);background:var(--paper);box-shadow:0 5px 0 #000;animation:ol-stamp .5s .2s cubic-bezier(.2,1.4,.4,1) both}
.ol-bigstamp.win{color:#0e8a6d}.ol-bigstamp.lose{color:#c8102e}
@keyframes ol-stamp{from{transform:rotate(-5deg) scale(3.2);opacity:0}to{transform:rotate(-5deg) scale(1);opacity:1}}
/* Gérard dans les écrans en ligne */
.ol-gerard{background:transparent;border:0;box-shadow:none;padding:0}
.ol-gerard .speaker{width:100%}
.ol-gerard .avatar{width:76px;height:76px}
.ol-gerard .bubble{min-height:3.4rem}
/* compte à rebours dramatique */
.ol-count{background:rgba(4,7,10,.99);gap:10px;padding:16px;justify-items:center}
.ol-count .speaker{max-width:560px;margin:0 auto}
.ol-count b{font-family:var(--disp);font-weight:800;color:var(--paper);text-shadow:0 8px 0 #000,0 0 80px rgba(255,210,63,.6);animation:ol-slam .6s cubic-bezier(.2,1.5,.4,1) both}
.ol-count.n2 b{color:var(--yel)}.ol-count.n1 b{color:#ff5d6c;text-shadow:0 8px 0 #000,0 0 90px rgba(255,59,78,.8)}
.ol-count span{font-family:var(--mono);color:var(--yel)}
@keyframes ol-slam{0%{transform:scale(3.4) rotate(-6deg);opacity:0}60%{transform:scale(.92) rotate(2deg);opacity:1}100%{transform:scale(1) rotate(0)}}
.ol-go{position:fixed;inset:0;z-index:6;display:grid;place-items:center;pointer-events:none;background:radial-gradient(circle,rgba(45,226,192,.35),transparent 70%);animation:ol-gofade 1s ease forwards}
.ol-go b{font:800 clamp(4rem,20vw,11rem)/1 var(--disp);color:#2de2c0;text-shadow:0 8px 0 #000;letter-spacing:.04em;animation:ol-slam .5s cubic-bezier(.2,1.5,.4,1) both}
@keyframes ol-gofade{0%,60%{opacity:1}100%{opacity:0}}
/* dépassements */
.ol-ovt{position:fixed;left:50%;top:76px;z-index:12;transform:translateX(-50%);pointer-events:none;display:flex;align-items:center;gap:12px;padding:10px 22px;border:4px double currentColor;border-radius:12px;background:var(--paper);font:800 clamp(1.1rem,4.6vw,1.7rem)/1.1 var(--disp);box-shadow:0 6px 0 #000;white-space:nowrap;max-width:94vw;animation:ol-ovt 2.1s cubic-bezier(.2,1.3,.4,1) both}
.ol-ovt.up{color:#0e8a6d}.ol-ovt.down{color:#c8102e}
.ol-ovt i{font-style:normal;font-size:1.5em}
.ol-ovt span{overflow:hidden;text-overflow:ellipsis}
@keyframes ol-ovt{0%{transform:translateX(-50%) translateY(-40px) scale(.7) rotate(-4deg);opacity:0}12%{transform:translateX(-50%) scale(1.12) rotate(-2deg);opacity:1}22%{transform:translateX(-50%) scale(1) rotate(-1deg)}80%{opacity:1}100%{transform:translateX(-50%) translateY(-20px);opacity:0}}
.ol-root .ledger{position:static;width:auto;max-height:none;margin-top:10px}
.ol-race.shake{animation:ol-shake .4s}
@media (max-width:820px){
 .ol-rtop{flex-wrap:nowrap}.ol-rtop .pill{padding:4px 8px;font-size:11px}.ol-rtop .pill b{font-size:13px}
 .ol-rtop .ol-live span{display:none}
 .ol-race{gap:8px;grid-template-columns:minmax(0,1fr)}.ol-rail,.ol-stage,.ol-wrap,.ol-game{min-width:0;max-width:100%}
 .ol-rail{padding:6px;border-width:2px;box-shadow:0 3px 0 #000}
 .ol-rail h3{display:none}
 .ol-rows{flex-direction:row;overflow-x:auto;overflow-y:hidden;max-height:none;gap:6px;padding-bottom:2px;scrollbar-width:none}
 .ol-prow{flex:0 0 132px;grid-template-columns:14px 18px minmax(0,1fr) auto;grid-template-areas:'rk av nm lv' 'bar bar bar st';padding:4px 6px;column-gap:5px;row-gap:3px}
 .ol-prow .nm{font-size:11px}.ol-prow .lv{font-size:10px}.ol-prow .bar{height:5px}.ol-prow .st u{width:6px;height:6px}
 .ol-prow .av{width:18px;height:18px}
 .ol-ovt{top:60px;padding:8px 14px}
 .ol-wrap{padding:10px 12px 28px;gap:10px}
}
`;
let done = false;
export function injectCss() {
  if (done) return; done = true;
  const s = document.createElement('style'); s.id = 'ol-css'; s.textContent = CSS; document.head.append(s);
}
