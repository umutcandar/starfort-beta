/** Combat feedback layer: floating numbers, hit flash, screen shake, haptics, end banner. Purely visual. */
export function createJuice(field,getCanvas){
  if(!field)return {hit(){},finish(){},dispose(){}};
  const layer=document.createElement('div');layer.className='sf-juice';layer.setAttribute('aria-hidden','true');field.appendChild(layer);
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const place=(x,y)=>{const c=getCanvas(),r=c.getBoundingClientRect(),f=field.getBoundingClientRect();
    const fit=getComputedStyle(c).objectFit==='cover'?Math.max:Math.min;const sc=fit(r.width/1000,r.height/600);
    const w=1000*sc,h=600*sc;return {left:r.left-f.left+(r.width-w)/2+x/100*w,top:r.top-f.top+(r.height-h)/2+y/60*h};};
  function hit(ev,isMe){
    const n=document.createElement('b');const card=field.querySelector(isMe?'.sf-life-ally':'.sf-life-enemy');let left,top;
    if(card&&card.offsetParent){const r=card.getBoundingClientRect(),f=field.getBoundingClientRect();left=r.left-f.left+r.width/2;top=r.bottom-f.top+34;}else({left,top}=place(ev.x??50,ev.y??30));
    n.className='sf-dmg'+(ev.delta>0?' heal':isMe?' me':'')+(ev.crit?' crit':'');n.textContent=(ev.delta>0?'+':'')+ev.delta;
    n.style.left=`${left+(Math.random()*24-12)}px`;n.style.top=`${top-18}px`;layer.appendChild(n);setTimeout(()=>n.remove(),900);
    if(ev.delta<0&&isMe){field.classList.remove('sf-hurt');void field.offsetWidth;field.classList.add('sf-hurt');try{navigator.vibrate?.(ev.crit?60:25)}catch{}}
    if(ev.delta<0&&!reduced&&(ev.crit||isMe)){field.classList.remove('sf-shake');void field.offsetWidth;field.classList.add('sf-shake');}
  }
  function finish(won){const b=document.createElement('div');b.className='sf-end-banner '+(won?'win':'lose');b.textContent=won?'ZAFER!':'YENİLGİ';layer.appendChild(b);setTimeout(()=>b.remove(),2200);try{navigator.vibrate?.(won?[40,40,80]:120)}catch{}}
  return {hit,finish,dispose(){layer.remove();}};
}
