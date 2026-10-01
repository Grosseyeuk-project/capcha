import { chromium } from '/home/user/capcha/node_modules/playwright-core/index.mjs';
const [port, W, H, tag] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width:+W, height:+H }, hasTouch: +W<600, isMobile: +W<600 });
const p = await ctx.newPage();
const errs=[]; p.on('console', m=>['error','warning'].includes(m.type())&&errs.push(m.type()+': '+m.text())); p.on('pageerror',e=>errs.push('PE '+e.message));
p.on('requestfailed', r=>errs.push('REQFAIL '+r.url()));
await p.goto(`http://localhost:${port}/?cheat=1`); await p.waitForTimeout(3500);
const S=(n)=>p.screenshot({path:`/tmp/s/${tag}-${n}.png`});
await S('title');
const ov=()=>p.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,sh:document.documentElement.scrollHeight,ch:innerHeight}));
console.log('title overflow',JSON.stringify(await ov()));
await p.click('text=/Commencer/i').catch(async e=>{console.log('click fail',(await p.locator('button').allInnerTexts()))});
await p.waitForTimeout(2500); await S('l1');
console.log('l1',JSON.stringify(await ov()), await p.evaluate(()=>({lvl:window.__game?.level, title:document.querySelector('.lvl-title')?.textContent})));
// layout shift tracking
await p.evaluate(()=>{window.__cls=0;new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.__cls+=e.value}).observe({type:'layout-shift',buffered:true})});
// solve 3 levels, with a strike between
for (let i=0;i<3;i++){ await p.evaluate(()=>window.__cap.solve()); await p.waitForTimeout(700); if(i==0) await S('solved'); await p.waitForTimeout(1900); await S('l'+(i+2)); console.log('lvl',await p.evaluate(()=>window.__game.level),JSON.stringify(await ov())); }
await p.evaluate(()=>window.__cap.fail()); await p.waitForTimeout(500); await S('strike1'); await p.waitForTimeout(2200);
await p.click('.ledger-btn').catch(()=>{}); await p.waitForTimeout(500); await S('ledger'); await p.click('.ledger-btn').catch(()=>{});
await p.evaluate(()=>window.__cap.left(4000)); await p.waitForTimeout(1500); await S('lowtime');
await p.evaluate(()=>window.__cap.fail()); await p.waitForTimeout(2200); await p.evaluate(()=>window.__cap.fail()); await p.waitForTimeout(500); await S('strike3');
await p.waitForTimeout(3500); await S('over');
console.log('over', JSON.stringify(await ov()), 'cls', await p.evaluate(()=>window.__cls));
// win
await p.evaluate(()=>window.__cap.title()); await p.waitForTimeout(1000);
await p.evaluate(()=>window.__cap.start()); await p.waitForTimeout(1500);
await p.evaluate(()=>window.__cap.win()); await p.waitForTimeout(3500); await S('win');
console.log('win', JSON.stringify(await ov()));
console.log('ERRS',[...new Set(errs)]);
await b.close();
