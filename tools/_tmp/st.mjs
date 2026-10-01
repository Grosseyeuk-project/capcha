import { chromium } from '/home/user/capcha/node_modules/playwright-core/index.mjs';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
const p = await (await b.newContext({ viewport: { width:390, height:800 }, hasTouch:true,isMobile:true })).newPage();
const errs=[]; p.on('console', m=>['error','warning'].includes(m.type())&&errs.push(m.type()+': '+m.text())); p.on('pageerror',e=>errs.push('PE '+e.message)); p.on('requestfailed', r=>errs.push('REQFAIL '+r.url())); p.on('response',r=>r.status()>=400&&errs.push(r.status()+' '+r.url()));
const t0=Date.now();
await p.goto('http://localhost:8098/?cheat=1'); await p.waitForSelector('text=Mode en ligne'); console.log('title ready ms',Date.now()-t0);
await p.waitForTimeout(1500);
await p.click('text=Mode en ligne'); await p.waitForTimeout(2500); await p.screenshot({path:'/tmp/s/st-online.png'});
console.log(await p.evaluate(()=>document.querySelector('.title-root')?.innerText.slice(0,400)));
await p.click('text=/Commencer/'); await p.waitForTimeout(2500);
for(let i=0;i<2;i++){await p.evaluate(()=>window.__cap.solve()); await p.waitForTimeout(2600);}
await p.screenshot({path:'/tmp/s/st-l3.png'}); console.log('lvl',await p.evaluate(()=>window.__game.level));
console.log('ERRS',errs); await b.close();
