import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
for (const [w,h,n] of [[1280,800,'d'],[360,740,'m']]) {
 const p = await (await b.newContext({ viewport:{width:w,height:h}})).newPage();
 p.on('console', m=>['error','warning'].includes(m.type())&&console.log(n,'[c]',m.text()));
 p.on('pageerror', e=>console.log(n,'[pe]',e.message));
 await p.goto('http://localhost:8090/?cheat=1&level=3'); await p.waitForTimeout(2500);
 await p.screenshot({path:`/tmp/s/play_${n}.png`});
 console.log(n,'overflowX', await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth));
 await p.evaluate(()=>__cap.fail('x')); await p.waitForTimeout(700);
 await p.screenshot({path:`/tmp/s/fail_${n}.png`});
 await p.waitForTimeout(2500);
 await p.evaluate(()=>__cap.left(4000)); await p.waitForTimeout(1500);
 await p.screenshot({path:`/tmp/s/low_${n}.png`});
 await p.evaluate(()=>__cap.solve()); await p.waitForTimeout(500);
 await p.screenshot({path:`/tmp/s/solve_${n}.png`});
 await p.waitForTimeout(2500);
 await p.screenshot({path:`/tmp/s/next_${n}.png`});
 await p.evaluate(()=>__cap.over()); await p.waitForTimeout(3500);
 await p.screenshot({path:`/tmp/s/over_${n}.png`});
 console.log(n,'overflowX', await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth), await p.evaluate(()=>document.documentElement.scrollHeight>innerHeight));
 await p.evaluate(()=>__cap.title()); await p.evaluate(()=>__cap.start()); await p.waitForTimeout(800);
 await p.evaluate(()=>__cap.win()); await p.waitForTimeout(3500);
 await p.screenshot({path:`/tmp/s/win_${n}.png`, fullPage:true});
}
await b.close();
