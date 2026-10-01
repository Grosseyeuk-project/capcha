import {mk} from './lib.mjs';
for (const [w,h] of [[360,640],[390,800],[1280,800]]){
 const {b,p}=await mk(w,h); await p.goto('http://localhost:8101/?cheat=1'); await p.waitForTimeout(2500);
 await p.screenshot({path:`/tmp/s/title-${w}.png`});
 console.log(w, await p.evaluate(()=>({sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight,btns:[...document.querySelectorAll('button,a')].map(b=>b.textContent.trim().slice(0,30)+'|'+Math.round(b.getBoundingClientRect().height))})), p.errs);
 await b.close();}
