import { chromium } from 'playwright-core';
export async function mk(w,h,extra=[]){const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist',...extra]});
const c=await b.newContext({viewport:{width:w,height:h},hasTouch:w<500,isMobile:w<500});const p=await c.newPage();p.errs=[];
p.on('console',m=>['error','warning'].includes(m.type())&&p.errs.push(m.type()+': '+m.text()));p.on('pageerror',e=>p.errs.push('PAGEERR '+e.message));return {b,p};}
