import {mk} from './lib.mjs';
const [w,h]=[+process.argv[2],+process.argv[3]];
const {b,p}=await mk(w,h); await p.goto('http://localhost:8101/?cheat=1'); await p.waitForTimeout(1500);
await p.evaluate(()=>{window.__cls=0;window.__shifts=[];new PerformanceObserver(l=>{for(const e of l.getEntries()) if(!e.hadRecentInput){window.__cls+=e.value;window.__shifts.push([Math.round(e.startTime),+e.value.toFixed(4),(e.sources||[]).map(s=>s.node?.className||s.node?.nodeName).join(',')])}}).observe({type:'layout-shift',buffered:true});});
await p.click('text=Commencer la vérification'); await p.waitForTimeout(2500);
await p.screenshot({path:`/tmp/s/play1-${w}.png`});
console.log(await p.evaluate(()=>document.getElementById('app').innerHTML.slice(0,3000)));
console.log(p.errs); await b.close();
