import {mk} from './lib.mjs';
const ids='a_checkbox a_wavy a_grid a_math a_slider a_bins a_order a_rotate b_flip b_hunt b_loading b_memory b_robot b_cube b_pwd b_boss'.split(' ');
for(const [w,h] of [[360,640],[390,800],[1280,800]]){
 const {b,p}=await mk(w,h);
 for(const id of ids){
  await p.goto(`http://localhost:8101/?cheat=1&cap=${id}`); await p.waitForTimeout(3200);
  const r=await p.evaluate(()=>{
   const card=document.querySelector('.card'); const host=document.querySelector('.card-body, .host')||card;
   const sc=[...document.querySelectorAll('.stage *')].filter(e=>e.scrollHeight>e.clientHeight+2&&['auto','scroll'].includes(getComputedStyle(e).overflowY)).map(e=>e.className+':'+e.scrollHeight+'/'+e.clientHeight);
   const vh=innerHeight;
   const btns=[...document.querySelectorAll('.card button, .card [role=button]')].filter(b=>/v[ée]rifier|valider|envoyer|confirmer|suivant|ok/i.test(b.textContent)).map(b=>{const r=b.getBoundingClientRect();const cr=card.getBoundingClientRect();return b.textContent.trim().slice(0,14)+' top='+Math.round(r.top)+' bot='+Math.round(r.bottom)+' vh='+vh});
   return {docScroll:document.documentElement.scrollHeight-vh,sc,btns,cardH:Math.round(card.getBoundingClientRect().height)};});
  console.log(w,id,JSON.stringify(r));
  await p.screenshot({path:`/tmp/s/c-${w}-${id}.png`});
 }
 console.log(p.errs); await b.close();}
