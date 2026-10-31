/** Yatay ekran için analog joystick. Girdi yalnızca hareket vektörüdür; oyun sonuçları sunucuda hesaplanır. */
export function joystickVector(dx,dy,radius=54,deadZone=.12){
  if(!Number.isFinite(dx)||!Number.isFinite(dy)||!Number.isFinite(radius)||radius<=0)return {x:0,y:0};
  const length=Math.hypot(dx,dy),amount=Math.min(1,length/radius);
  if(amount<=deadZone)return {x:0,y:0};
  const scaled=(amount-deadZone)/(1-deadZone);
  return {x:Math.round(dx/length*scaled*1000)/1000,y:Math.round(dy/length*scaled*1000)/1000};
}
export function combineMovement(keyX,keyY,analog={x:0,y:0}){
  const x=keyX||analog.x||0,y=keyY||analog.y||0,mag=Math.hypot(x,y);
  return {x:mag>1?x/mag:x,y:mag>1?y/mag:y};
}
export function mountJoystick(element){
  if(!element)return {read:()=>({x:0,y:0}),reset:()=>{},dispose:()=>{}};
  const thumb=element.querySelector('.sf-joystick-thumb');
  let activePointer=null,vector={x:0,y:0};
  const move=e=>{if(activePointer!==e.pointerId)return;const rect=element.getBoundingClientRect(),radius=Math.min(rect.width,rect.height)*.34;
    const dx=e.clientX-(rect.left+rect.width/2),dy=e.clientY-(rect.top+rect.height/2);
    vector=joystickVector(dx,dy,radius);
    const length=Math.hypot(dx,dy),scale=length>radius?radius/length:1;
    if(thumb)thumb.style.transform=`translate(${Math.round(dx*scale)}px, ${Math.round(dy*scale)}px)`;
  };
  const reset=()=>{activePointer=null;vector={x:0,y:0};element.classList.remove('is-dragging');if(thumb)thumb.style.transform='translate(0, 0)';};
  const down=e=>{if(activePointer!==null)return;e.preventDefault();activePointer=e.pointerId;element.classList.add('is-dragging');try{element.setPointerCapture?.(e.pointerId)}catch{}move(e);};
  const end=e=>{if(activePointer===e.pointerId)reset();};
  const lose=()=>reset();
  element.addEventListener('pointerdown',down);element.addEventListener('pointermove',move);
  element.addEventListener('pointerup',end);element.addEventListener('pointercancel',end);
  element.addEventListener('lostpointercapture',end);window.addEventListener('blur',lose);
  return {read:()=>({...vector}),reset,dispose(){reset();element.removeEventListener('pointerdown',down);element.removeEventListener('pointermove',move);element.removeEventListener('pointerup',end);element.removeEventListener('pointercancel',end);element.removeEventListener('lostpointercapture',end);window.removeEventListener('blur',lose);}};
}
/** object-fit:contain kullanılan savaş canvas'ını 100x60 oyun koordinatlarına çevirir.
 * Yanlardaki siyah şeritlere dokunma, yanlışlıkla düşman seçmemelidir. */
export function battlePoint(clientX,clientY,rect,canvasWidth=1000,canvasHeight=600,fit='contain'){
  if(!rect||rect.width<=0||rect.height<=0)return null;
  const scale=(fit==='cover'?Math.max:Math.min)(rect.width/canvasWidth,rect.height/canvasHeight);
  const width=canvasWidth*scale,height=canvasHeight*scale;
  const left=rect.left+(rect.width-width)/2,top=rect.top+(rect.height-height)/2;
  if(clientX<left||clientX>left+width||clientY<top||clientY>top+height)return null;
  return {x:(clientX-left)/width*100,y:(clientY-top)/height*60};
}
