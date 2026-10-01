import { chromium } from 'playwright-core';
const mobile = process.argv[2]==='m';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const ctx = await b.newContext({ viewport: mobile?{width:390,height:800}:{width:1280,height:800}, hasTouch: mobile, isMobile: mobile });
const p = await ctx.newPage(); const errs=[];
p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>m.type()==='error'&&!/CERT|404|ERR_/.test(m.text())&&errs.push(m.text()));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
await p.goto('http://localhost:8095/?cap=b_pwd',{waitUntil:'domcontentloaded'});
await p.waitForSelector('.bp-field input',{timeout:20000});
await sleep(1500);
const t0=Date.now(); const el=()=>((Date.now()-t0)/1000).toFixed(0)+'s';
const inp=p.locator('.bp-field input').first();
const tx=async s=>{ for(const ch of s){ await p.keyboard.type(ch); await sleep(110);} };
const info=()=>p.evaluate(()=>({n:document.querySelectorAll('.bp-r').length, ok:document.querySelectorAll('.bp-r.ok').length, v:document.querySelector('.bp-field input').value, t:document.querySelector('.hud-time, .hud .time')?.textContent, btn:!document.querySelector('.bk-btn').disabled, say:document.querySelector('.bubble, .say, [class*=bubble]')?.innerText}));
const log=async(m)=>console.log(el(),m,JSON.stringify(await info()));
const rd=()=>sleep(2500);
await inp.click();
await tx('Aa1!13'); await rd();
await tx('mars'); await rd(); await log('after mars');
const info2=await p.evaluate(()=>{const r=[...document.querySelectorAll('.bp-r')].map(r=>r.innerText);const m=r.find(x=>/Doit contenir le mot/.test(x));const L=r.find(x=>/exactement/.test(x));return {w:m?m.match(/« (.*?) »/)[1]:null, code:[...document.querySelectorAll('.bp-code u')].map(u=>u.textContent).join('')}});
console.log(info2);
await tx(info2.w); await rd();
await p.locator('.bp-chip').nth(5).click(); await rd();
await tx(info2.code); await rd(); await log('after code');
await tx('Gérard'); await rd(); await log('after gerard');
// copy
await p.locator('.bp-cp').click(); await rd(); await log('after copy');
await p.screenshot({path:`/tmp/claude-0/s/pwd_p3_${mobile?'m':'d'}.png`});
// clock
await inp.click(); await p.keyboard.press('End'); await p.locator('.bp-chip').nth(7).click(); await rd(); await log('after clock');
await p.locator('.bp-cp').click(); await rd(); await log('copy again');
// worm
await p.locator('.bp-chip').nth(6).click(); await rd(); await log('after worm');
await p.screenshot({path:`/tmp/claude-0/s/pwd_p4_${mobile?'m':'d'}.png`});
await sleep(9000); await log('9s after worm');
console.log('errs',errs);
await b.close();
