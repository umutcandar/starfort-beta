import { ART_SIZE, ART_PLOTS, ATLAS_SIZE, ATLAS_RECTS, architectureForLevel, viewportTransform, worldToScreen, screenToWorld, pickBuilding } from './city-art-layout.js';

const urls={panorama:new URL('./assets/city/starfall-valley.webp',import.meta.url).href,atlas:new URL('./assets/city/architecture-atlas-v2.webp',import.meta.url).href};
let assetsPromise;
function loadImage(src) {
  return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('Köy görseli yüklenemedi.'));image.src=src;});
}
function loadAssets() {
  return assetsPromise ||= Promise.all([loadImage(urls.panorama),loadImage(urls.atlas)]).then(([panorama,atlas])=>({panorama,atlas})).catch(error=>{assetsPromise=null;throw error;});
}
function paintPart(context,atlas,p) {
  const [x,y,w,h]=ATLAS_RECTS[p.sprite],ratio=atlas.width/ATLAS_SIZE,height=p.width*h/w;
  context.drawImage(atlas,x*ratio,y*ratio,w*ratio,h*ratio,p.x-p.width/2,p.y-height,p.width,height);
}
function paintArchitecture(context,assets,levels) {
  context.drawImage(assets.panorama,0,0,ART_SIZE.width,ART_SIZE.height);
  const parts=Object.keys(ART_PLOTS).flatMap(id=>architectureForLevel(id,levels[id]||1)).sort((a,b)=>a.y-b.y);
  for(const p of parts)paintPart(context,assets.atlas,p);
}

// The preview uses exactly the same artwork and additions as the playable map.
export async function paintBuildingPreview(canvas,id,level) {
  if(!ART_PLOTS[id])return;
  const assets=await loadAssets();
  if(!canvas.isConnected)return;
  const width=canvas.clientWidth||320,height=canvas.clientHeight||180,dpr=Math.min(2,window.devicePixelRatio||1);
  canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
  const ctx=canvas.getContext('2d');if(!ctx)return;
  const [x,y,w,h]=ART_PLOTS[id].bounds,scale=Math.max(width/(w+70),height/(h+45));
  ctx.scale(dpr,dpr);ctx.fillStyle='#111f31';ctx.fillRect(0,0,width,height);
  // Close-up on the facade and expansion courtyard, using identical framing on both sides.
  ctx.save();ctx.translate(width/2-(x+w/2)*scale,height*.91-(y+h)*scale);ctx.scale(scale,scale);
  paintArchitecture(ctx,assets,{[id]:level});ctx.restore();
  const shade=ctx.createLinearGradient(0,0,0,height);shade.addColorStop(0,'#08142200');shade.addColorStop(.65,'#08142200');shade.addColorStop(1,'#08142290');ctx.fillStyle=shade;ctx.fillRect(0,0,width,height);
}

export function createScene(canvas,{onSelect=()=>{},onProject=()=>{},onLoadError=()=>{}}={}) {
  const ctx=canvas.getContext('2d',{alpha:false});
  if(!ctx)throw new Error('Canvas 2D kullanılamıyor.');
  const layer=document.createElement('canvas');layer.width=ART_SIZE.width;layer.height=ART_SIZE.height;
  const layerContext=layer.getContext('2d');
  let width=1,height=1,topInset=0,dpr=1,zoom=1,pan={x:0,y:0},view=viewportTransform(1,1),assets,disposed=false,frame=0,lastFrame=0;
  let levels={},selected=null,hovered=null,upgrade=null,dirty=true,target=null;
  const pointers=new Map();let gesture=null,dragged=false;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const listeners=[];
  const listen=(el,event,fn,options)=>{el.addEventListener(event,fn,options);listeners.push(()=>el.removeEventListener(event,fn,options));};
  canvas.style.touchAction='none';canvas.style.cursor='grab';

  function rebuild() { if(assets){paintArchitecture(layerContext,assets,levels);dirty=true;} }
  const originY=scale=>topInset+(height-topInset-ART_SIZE.height*scale)/2;
  function camera(nextZoom,nextPan={x:0,y:0}) {const result=viewportTransform(width,height-topInset,nextZoom,nextPan);result.y+=topInset;result.height=height;return result;}
  function updateView() { view=camera(zoom,pan); }
  function project() {
    onProject(Object.entries(ART_PLOTS).map(([id,plot])=>{
      const point=worldToScreen(plot.anchor,view);
      return {id,...point,visible:point.x>-35&&point.x<width+35&&point.y>0&&point.y<height-20};
    }),width,height);
  }
  function resize() {
    width=Math.max(1,canvas.clientWidth);height=Math.max(1,canvas.clientHeight);dpr=Math.min(2,window.devicePixelRatio||1);
    topInset=Math.min(height*.25,parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--city-hud-top'))||0);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);updateView();dirty=true;project();schedule();
  }
  function outline(id,alpha=1) {
    const plot=ART_PLOTS[id];if(!plot)return;
    ctx.save();ctx.globalAlpha=alpha;ctx.beginPath();
    plot.polygon.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();
    ctx.fillStyle='#f9d68e0d';ctx.fill();ctx.strokeStyle='#ffe2a6';ctx.lineWidth=1.15/view.scale;ctx.shadowColor='#ffcb74';ctx.shadowBlur=7;ctx.stroke();ctx.restore();
  }
  function glow(x,y,r,color,alpha) {
    const gradient=ctx.createRadialGradient(x,y,0,x,y,r);gradient.addColorStop(0,color);gradient.addColorStop(1,'rgba(255,190,90,0)');
    ctx.save();ctx.globalAlpha=alpha;ctx.globalCompositeOperation='screen';ctx.fillStyle=gradient;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.restore();
  }
  function atmosphere(time) {
    const t=time/1000;
    glow(1010,75,35,'#90e9ff',.18+Math.sin(t*1.5)*.08);
    glow(639,581,31,'#ffad53',.14+Math.sin(t*5)*.04);
    glow(493,219,20,'#9ceeff',.15+Math.sin(t*2)*.06);
    // Fine smoke, drifting motes and a distant flight add life without obscuring architecture.
    for(let i=0;i<6;i++) {
      const phase=(t*.11+i/6)%1,x=653+phase*39+Math.sin(i*3+t*.4)*4,y=445-phase*70;
      ctx.fillStyle=`rgba(214,221,226,${.035*(1-phase)})`;ctx.beginPath();ctx.ellipse(x,y,9+phase*11,5+phase*8,-.3,0,Math.PI*2);ctx.fill();
    }
    for(let i=0;i<16;i++) {
      const phase=(t*.035+i*.173)%1,x=420+(i*97)%1120+Math.sin(t*.4+i)*8,y=625-phase*130;
      ctx.globalAlpha=Math.sin(phase*Math.PI)*.4;ctx.fillStyle=i%3?'#fce7ae':'#a9edff';ctx.fillRect(x,y,1.3,1.3);
    }
    ctx.globalAlpha=1;
    for(let i=0;i<3;i++) {
      const x=1225+((t*9+i*26)%430),y=112+i*9+Math.sin(t+i)*3,wing=Math.sin(t*5+i)*2;
      ctx.beginPath();ctx.moveTo(x-4,y-wing);ctx.lineTo(x,y);ctx.lineTo(x+4,y-wing);ctx.strokeStyle='#233e50a0';ctx.lineWidth=1;ctx.stroke();
    }
  }
  function draw(time) {
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#14263d';ctx.fillRect(0,0,width,height);
    if(!assets)return;
    ctx.translate(view.x,view.y);ctx.scale(view.scale,view.scale);ctx.drawImage(layer,0,0);
    if(!reduced.matches)atmosphere(time);
    if(hovered)outline(hovered,.65);
    if(selected&&!hovered&&target)outline(selected,.4);
    if(upgrade) {
      const elapsed=(time-upgrade.started)/1600;
      if(elapsed>1)upgrade=null;
      else {
        const plot=ART_PLOTS[upgrade.id],alpha=Math.sin(Math.min(1,elapsed)*Math.PI);
        outline(upgrade.id,alpha);glow(plot.anchor[0],plot.anchor[1]-50,125,'#ffe4a8',alpha*.24);
        const newest=architectureForLevel(upgrade.id,levels[upgrade.id]).filter(p=>p.level===levels[upgrade.id]);
        for(const p of newest) {
          for(let i=0;i<10;i++) {const a=i*Math.PI/5;ctx.fillStyle=`rgba(255,222,151,${(1-elapsed)*.8})`;ctx.beginPath();ctx.arc(p.x+Math.cos(a)*elapsed*35,p.y-25-elapsed*65+Math.sin(a)*elapsed*20,1.7,0,Math.PI*2);ctx.fill();}
        }
      }
    }
    dirty=false;
  }
  function schedule() {if(!disposed&&!frame&&!document.hidden)frame=requestAnimationFrame(tick);}
  function tick(time) {
    frame=0;if(disposed||document.hidden)return;
    if(target) {
      const blend=reduced.matches?1:.17;
      zoom+=(target.zoom-zoom)*blend;pan.x+=(target.pan.x-pan.x)*blend;pan.y+=(target.pan.y-pan.y)*blend;
      if(Math.abs(target.zoom-zoom)<.002&&Math.abs(target.pan.x-pan.x)+Math.abs(target.pan.y-pan.y)<.7){zoom=target.zoom;pan={...target.pan};target=null;}
      updateView();dirty=true;project();
    }
    if(dirty||time-lastFrame>33){draw(time);lastFrame=time;}
    if(!reduced.matches||target||upgrade)schedule();
  }
  function local(event) {const r=canvas.getBoundingClientRect();return {x:event.clientX-r.left,y:event.clientY-r.top};}
  function moveView(nextZoom,point={x:width/2,y:height/2}) {
    const world=screenToWorld(point,view);zoom=Math.max(1,Math.min(2.8,nextZoom));
    const base=camera(zoom);
    pan={x:point.x-world[0]*base.scale-(width-ART_SIZE.width*base.scale)/2,y:point.y-world[1]*base.scale-originY(base.scale)};
    target=null;updateView();dirty=true;project();schedule();
  }
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  listen(canvas,'pointerdown',event=>{
    if(event.button!==0&&event.pointerType!=='touch')return;
    pointers.set(event.pointerId,local(event));canvas.setPointerCapture(event.pointerId);target=null;
    if(pointers.size===1){gesture={start:local(event),viewX:view.x,viewY:view.y};dragged=false;}
    else if(pointers.size===2){const [a,b]=[...pointers.values()];gesture={distance:distance(a,b),zoom};dragged=true;}
    canvas.style.cursor='grabbing';
  });
  listen(canvas,'pointermove',event=>{
    const point=local(event);
    if(!pointers.has(event.pointerId)) {const next=pickBuilding(screenToWorld(point,view),levels);if(next!==hovered){hovered=next;canvas.style.cursor=next?'pointer':'grab';dirty=true;schedule();}return;}
    pointers.set(event.pointerId,point);
    if(pointers.size>=2) {
      const [a,b]=[...pointers.values()];if(gesture?.distance)moveView(gesture.zoom*distance(a,b)/Math.max(1,gesture.distance),{x:(a.x+b.x)/2,y:(a.y+b.y)/2});
    } else if(gesture?.start) {
      const dx=point.x-gesture.start.x,dy=point.y-gesture.start.y;if(Math.hypot(dx,dy)>6)dragged=true;
      if(dragged){const base=camera(zoom);pan={x:gesture.viewX+dx-(width-ART_SIZE.width*base.scale)/2,y:gesture.viewY+dy-originY(base.scale)};updateView();dirty=true;project();schedule();}
    }
  });
  function endPointer(event,cancel=false) {
    if(!pointers.has(event.pointerId))return;
    if(gesture?.start&&distance(local(event),gesture.start)>6)dragged=true;
    pointers.delete(event.pointerId);if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);
    if(!cancel&&!dragged&&pointers.size===0){const id=pickBuilding(screenToWorld(local(event),view),levels);if(id)onSelect(id);}
    if(pointers.size===1){gesture={start:[...pointers.values()][0],viewX:view.x,viewY:view.y};dragged=true;}else if(!pointers.size)gesture=null;
    canvas.style.cursor=hovered?'pointer':'grab';
  }
  listen(canvas,'pointerup',event=>endPointer(event));listen(canvas,'pointercancel',event=>endPointer(event,true));
  listen(canvas,'pointerleave',()=>{hovered=null;dirty=true;schedule();});
  listen(canvas,'wheel',event=>{event.preventDefault();moveView(zoom*Math.exp(-event.deltaY*.0015),local(event));},{passive:false});
  listen(document,'visibilitychange',()=>{if(document.hidden&&frame){cancelAnimationFrame(frame);frame=0;}else schedule();});
  listen(reduced,'change',()=>{dirty=true;schedule();});
  const observer=new ResizeObserver(resize);observer.observe(canvas);
  resize();
  const ready=loadAssets().then(loaded=>{if(disposed)return;assets=loaded;canvas.dataset.sceneReady='true';rebuild();schedule();}).catch(error=>{if(!disposed){canvas.dataset.sceneReady='error';onLoadError(error);} });
  return {
    ready,
    update(state) {
      let changed=false;
      for(const id of Object.keys(ART_PLOTS)) {
        const level=Math.max(1,Math.min(8,Number(state.buildings?.[id])||1));
        if(levels[id]!==level){if(levels[id]&&level>levels[id])upgrade={id,started:performance.now()};levels[id]=level;changed=true;}
      }
      if(changed)rebuild();project();schedule();
    },
    focus(id,move=true) {
      if(!ART_PLOTS[id])return;selected=id;
      if(move){const desiredZoom=Math.max(zoom,1.35),base=camera(desiredZoom),[x,y]=ART_PLOTS[id].center;target={zoom:desiredZoom,pan:{x:width/2-x*base.scale-(width-ART_SIZE.width*base.scale)/2,y:height*.5-y*base.scale-originY(base.scale)}};}
      dirty=true;schedule();
    },
    overview(){selected=null;target={zoom:1,pan:{x:0,y:0}};dirty=true;schedule();},
    zoomBy(factor){if(Number.isFinite(factor)&&factor>0)moveView(zoom*factor);},
    resize,
    dispose(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();listeners.forEach(remove=>remove());for(const id of pointers.keys())if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);pointers.clear();},
  };
}
