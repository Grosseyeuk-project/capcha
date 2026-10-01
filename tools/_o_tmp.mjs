import { chromium } from 'playwright-core';
const S='/tmp/claude-0/-home-user-capcha/268bcf5c-5de0-5a66-90ce-fe0b32e7ccc6/scratchpad/';
const W=+process.argv[2]||390,H=+process.argv[3]||800;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
const p = await (await b.newContext({ viewport:{width:W,height:H}, hasTouch:W<500 })).newPage();
p.on('pageerror', e=>console.log('[pe]',e.message));
p.on('console', m=>m.type()==='error'&&console.log('[c]',m.text()));
const shot=async n=>{await p.screenshot({path:S+`o${W}-${n}.png`});console.log(n,await p.evaluate(()=>[document.documentElement.scrollWidth,innerWidth]))};
await p.goto('http://localhost:8094/js/online/harness.html?n=6'); await p.waitForTimeout(1500);
await p.evaluate(()=>window.CAPCHA_ONLINE.open()); await p.waitForTimeout(800); await shot('menu');
await p.fill('input[aria-label=Pseudo]','Vincent'); await p.click('text=Partie rapide'); 
await p.waitForTimeout(2500); await shot('lobby');
await p.waitForSelector('.ol-rail',{timeout:60000}).catch(()=>console.log('no rail')); await p.waitForTimeout(1500); await shot('race0');
await p.waitForTimeout(8000); await shot('race1');
for(let i=0;i<20;i++){ await p.waitForTimeout(6000); const t=await p.evaluate(()=>document.body.innerText.slice(0,0)); if(await p.$('.ol-podium, [class*=podium]')) break; }
await shot('end'); await b.close();
