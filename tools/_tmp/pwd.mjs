import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 800 }, hasTouch: true, isMobile: true });
const p = await ctx.newPage(); const errs=[];
p.on('pageerror', e=>errs.push(e.message)); p.on('console', m=>m.type()==='error'&&errs.push(m.text()));
await p.goto('http://localhost:8097/?cap=b_pwd&cheat=1'); await p.waitForTimeout(4000);
await p.screenshot({path:process.argv[2]+'/pw1.png'});
const t0=Date.now();
const rules=()=>p.evaluate(()=>[...document.querySelectorAll('.bp-r')].length);
await p.tap('.bp-field input');
// human-ish solve: type progressively
const inp='.bp-field input';
const set=async(v)=>{ await p.fill(inp,''); await p.keyboard.type(v,{delay:60}); };
const state=()=>p.evaluate(()=>({n:document.querySelectorAll('.bp-r').length,cur:document.querySelector('.bp-cur')?.innerText,v:document.querySelector('.bp-field input').value,prog:document.querySelector('.bk-meta')?.innerText,worm:document.querySelector('.bp-worm')?.innerText}));
await p.keyboard.type('Abcdefgh1',{delay:80}); await p.waitForTimeout(1500);
console.log(await state());
await p.screenshot({path:process.argv[2]+'/pw2.png'});
// cheat-fill to progress with reveal delays
for (let i=0;i<40;i++){
  const ans=await p.evaluate(()=>document.querySelector('.cap-host').dataset.answer);
  const s=await state();
  await p.fill(inp, ans); await p.waitForTimeout(1200);
  const s2=await state();
  console.log(((Date.now()-t0)/1000).toFixed(0)+'s', s2.n, s2.prog, s2.worm, '|', (s2.cur||'').slice(0,60).replace(/\n/g,' '));
  if(i==10) await p.screenshot({path:process.argv[2]+'/pw3.png'});
  if (/20\/20/.test(s2.prog)) break;
}
await p.screenshot({path:process.argv[2]+'/pw4.png'});
console.log(await p.evaluate(()=>document.querySelector('.cap-host').dataset.answer), errs);
await b.close();
