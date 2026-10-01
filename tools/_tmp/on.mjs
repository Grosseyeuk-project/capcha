import { chromium } from '/home/user/capcha/node_modules/playwright-core/index.mjs';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
for (const [w,h,n] of [[1280,800,'d'],[390,800,'m']]) {
const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage();
const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto('http://localhost:8091/?cheat=1'); await p.waitForTimeout(3000);
await p.click('text=Mode en ligne'); await p.waitForTimeout(1200);
await p.screenshot({path:`/tmp/s/on_menu_${n}.png`});
await p.fill('input[aria-label=Pseudo]','Vince'); await p.click('text=Partie rapide');
await p.waitForTimeout(3000); await p.screenshot({path:`/tmp/s/on_fill_${n}.png`});
await p.waitForSelector('.ol-rail',{timeout:30000}).catch(()=>console.log('no rail'));
await p.waitForTimeout(1500); await p.screenshot({path:`/tmp/s/on_race_${n}.png`});
for(let i=0;i<4;i++){ await p.evaluate(()=>window.CAPCHA_ONLINE.game?.cur?.api.solve()); await p.waitForTimeout(2200);}
await p.screenshot({path:`/tmp/s/on_race2_${n}.png`});
console.log(n, await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth), errs.slice(0,4));
await p.close();}
await b.close();
