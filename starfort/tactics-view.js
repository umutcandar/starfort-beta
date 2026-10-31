import {createTraining,stepTraining,orderSquad,setHeroDestination,heroAbility,FIELD} from './tactics.js';
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const orders={follow:'Takip',advance:'İlerle',hold:'Savun',focus:'Odak saldırı'};
const colors={guard:'#f8ca79',archer:'#8adbd0',mage:'#a9a4ff',raider:'#f18f8d',caster:'#cf7fd6',boss:'#ffca70'};
export function mountTraining(root){
  let game=createTraining();let running=true,raf=0,last=0,lastHud=0,orderWaiting=false;
  const keys=new Set();let pointing=false;
  root.innerHTML=`<header class="training-title"><div><span class="eyebrow">KOMUTAN AKADEMİSİ · OYNANABİLİR PROTOTİP</span><h2>Kuşatma Tatbikatı</h2><p>Kahramanını bizzat yönet ve üç birliğine taktik emirler ver. Çevrim dışı eğitim; klan PvP'si değildir.</p></div><button class="secondary" data-close-view>Köye dön</button></header>
    <div class="training-layout"><section class="training-main"><div class="training-status"><div><b id="training-event">Kapıya saldır!</b><small id="training-clock">03:00</small><small id="training-hp">Aldren ♡ 240 / 240</small></div><div class="training-score">KALE HAKİMİYETİ <strong id="training-score">0%</strong><span><i id="training-progress"></i></span></div></div>
    <div class="training-field" id="training-field"><canvas id="training-canvas" width="1000" height="600" tabindex="0" aria-label="Kuşatma eğitim haritası. Kahramanını WASD veya yön düğmeleriyle hareket ettir. Haritaya dokunarak git, İlerle emrini seçerek birlik hedefini belirle."></canvas><div class="training-corner">✦ YILDIZ KALESİ · DOĞU KAPISI</div><div id="training-outcome" class="training-outcome" hidden></div></div>
    <div class="training-shortcuts"><button data-training-ability="burst" title="Q">✦ Yıldız Darbesi <small>Q · 8 sn</small></button><button data-training-ability="dash" title="Space">➤ Atılma <small>Space · 4 sn</small></button><button data-training-ability="rally" title="E">⚑ Savaş Nârâsı <small>E · 12 sn</small></button><button data-training-pause>Ⅱ Duraklat</button><button data-training-reset>↺ Yeniden Başla</button></div>
    <div class="training-touch" aria-label="Mobil kahraman kontrolü"><button data-move="up" aria-label="Yukarı">▲</button><div><button data-move="left" aria-label="Sol">◀</button><button data-move="down" aria-label="Aşağı">▼</button><button data-move="right" aria-label="Sağ">▶</button></div></div></section>
    <aside class="training-side"><h3>Ordu Komutası</h3><p>Birlik seç, emir ver. <b>İlerle</b> için haritaya dokun.</p><div id="training-squads" class="training-squads"></div><div class="training-orders">${Object.entries(orders).map(([id,name])=>`<button data-training-order="${id}">${name}</button>`).join('')}</div><div class="training-manual"><b>Nasıl oynanır?</b><p>WASD / ok tuşları: hareket<br>Q: alan darbesi · E: iyileştirme<br>Space: atılma<br>1/2/3: birlik seç<br>Birliğe İlerle emri vermek için haritada konum seç.</p><p><b>Zafer:</b> Kapıyı yık, son muhafızları yen ve kale kapısında %100 hakimiyet sağla. Kahramanın ölürse veya 3 dakika dolarsa tatbikat biter.</p></div></aside></div>`;
  const canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d');
  // Animated Canvas tutorial uses the same illustrated art language as the live battle.
  const battleArt=new Image();battleArt.decoding='async';battleArt.src='assets/battlefield.webp';
  const spriteFiles=['unit-dawn-1.webp','unit-dawn-2.webp','unit-dawn-3.webp','unit-dusk-1.webp','unit-dusk-2.webp','unit-dusk-3.webp'];
  const sprites=spriteFiles.map(name=>{const img=new Image();img.decoding='async';img.src='assets/'+name;return img;});
  const sx=10,sy=10;const pos=u=>({x:u.x*sx,y:u.y*sy});
  function disk(x,y,r,color,blur=0){ctx.save();ctx.shadowBlur=blur;ctx.shadowColor=color;ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.restore();}
  function entity(u,team){
    if(u.hp<=0)return;const p=pos(u),isHero=u.id==='hero',isGate=u.type==='gate';
    if(isGate){
      // Curved oak gatehouse with iron bands, hinge pins, and light from the damaged opening.
      const w=75,h=115,x=p.x-w/2,y=p.y-h*.61;
      const g=ctx.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,'#8a6744');g.addColorStop(.44,'#3c2a20');g.addColorStop(1,'#201c1a');
      ctx.save();ctx.shadowColor='#000c';ctx.shadowBlur=20;
      ctx.beginPath();ctx.moveTo(x,y+h);ctx.lineTo(x,y+25);ctx.quadraticCurveTo(p.x,y-25,x+w,y+25);ctx.lineTo(x+w,y+h);ctx.closePath();ctx.fillStyle=g;ctx.fill();
      ctx.strokeStyle='#c39c63';ctx.lineWidth=6;ctx.stroke();ctx.shadowBlur=0;
      ctx.strokeStyle='#171b1e';ctx.lineWidth=5;for(const offset of [29,79]){ctx.beginPath();ctx.moveTo(x+6,y+offset);ctx.lineTo(x+w-6,y+offset);ctx.stroke();}
      ctx.strokeStyle='#d9b679';ctx.lineWidth=2;for(const offset of [-19,0,19]){ctx.beginPath();ctx.moveTo(p.x+offset,y+12);ctx.lineTo(p.x+offset,y+h-6);ctx.stroke();}
      if(u.hp<u.maxHp*.7){ctx.strokeStyle='#ffb96d';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(p.x-13,y+42);ctx.lineTo(p.x+4,y+61);ctx.lineTo(p.x-5,y+88);ctx.stroke();}
      ctx.restore();
    }else{
      const color=team==='ally'?'#a2dbfa':'#ff9c88';const isFriend=team==='ally';
      const visual=isHero?sprites[0]:isFriend?sprites[{guard:0,archer:1,mage:2}[u.type]??0]:sprites[{raider:3,caster:4,boss:5}[u.type]??3];
      const w=isHero?49:u.type==='boss'?52:36,h=isHero?84:u.type==='boss'?85:61;
      ctx.save();ctx.shadowColor='#000b';ctx.shadowBlur=11;
      ctx.fillStyle='#05141c99';ctx.beginPath();ctx.ellipse(p.x,p.y+16,w*.48,8,0,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
      if(visual.complete&&visual.naturalWidth>0){ctx.drawImage(visual,p.x-w/2,p.y-h+22,w,h);}
      else{disk(p.x,p.y,isHero?14:11,color,5);}
      ctx.strokeStyle=color;ctx.lineWidth=isHero?2.5:1.7;ctx.beginPath();ctx.ellipse(p.x,p.y+15,w*.5,8,0,0,Math.PI*2);ctx.stroke();
      ctx.restore();
    }
    const w=isGate?75:isHero?56:48,top=p.y-(isGate?93:isHero?74:49);
    ctx.fillStyle='#061320e6';ctx.fillRect(p.x-w/2,top,w,6);
    ctx.fillStyle=team==='ally'?'#65d6a9':'#ff9283';ctx.fillRect(p.x-w/2,top,w*Math.max(0,u.hp)/u.maxHp,6);
    ctx.font='600 12px system-ui';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#07111de9';ctx.strokeText(u.name,p.x,p.y+(isGate?69:35));ctx.fillStyle='#fff0d1';ctx.fillText(u.name,p.x,p.y+(isGate?69:35));
  }
  function draw(){if(!ctx)return;ctx.clearRect(0,0,1000,600);
    if(battleArt.complete&&battleArt.naturalWidth){
      const iw=battleArt.naturalWidth,ih=battleArt.naturalHeight,scale=Math.max(1000/iw,600/ih);
      ctx.drawImage(battleArt,(1000-iw*scale)/2,(600-ih*scale)/2,iw*scale,ih*scale);
    }else{const g=ctx.createLinearGradient(0,0,0,600);g.addColorStop(0,'#34485b');g.addColorStop(1,'#4b4138');ctx.fillStyle=g;ctx.fillRect(0,0,1000,600);}
    const tint=ctx.createLinearGradient(0,0,0,600);tint.addColorStop(0,'#0815254a');tint.addColorStop(.5,'#0b1e2c28');tint.addColorStop(1,'#07152470');ctx.fillStyle=tint;ctx.fillRect(0,0,1000,600);
    // No tactical debug grid: the scenery, characters and objective are the visual language.
    ctx.strokeStyle='#d2ae75a0';ctx.lineWidth=4;ctx.setLineDash([12,9]);ctx.beginPath();ctx.arc(910,300,97,0,2*Math.PI);ctx.stroke();ctx.setLineDash([]);
    ctx.strokeStyle='#b4ddf4b3';ctx.lineWidth=2;ctx.beginPath();ctx.arc(910,300,111,Math.PI*.5,Math.PI*.5+Math.PI*2*game.score/100);ctx.stroke();
    game.squads.forEach((u,i)=>{if(u.hp<=0)return;const p=pos(u);if(i===game.selected){ctx.strokeStyle='#ffecb5';ctx.lineWidth=3;ctx.setLineDash([6,6]);ctx.beginPath();ctx.arc(p.x,p.y,32,0,2*Math.PI);ctx.stroke();ctx.setLineDash([]);}if(u.order==='advance'||u.order==='hold'){const t=pos(u.point);ctx.strokeStyle=i===game.selected?'#ffe7a9aa':'#74d6d777';ctx.lineWidth=2;ctx.setLineDash([4,7]);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(t.x,t.y);ctx.stroke();ctx.setLineDash([]);disk(t.x,t.y,5,'#d9c180');}});
    [...game.enemies,game.gate].forEach(e=>entity(e,'enemy'));game.squads.forEach(e=>entity(e,'ally'));entity(game.hero,'ally');
    for(const e of game.effects){const p=pos(e);ctx.globalAlpha=Math.max(0,1-e.age/.85);disk(p.x,p.y,9+e.age*24,e.side==='ally'?'#ffd17a':'#f77a79',12);ctx.fillStyle='#fff9e9';ctx.textAlign='center';ctx.font='bold 20px Georgia';ctx.fillText(String(e.amount),p.x,p.y-12-e.age*32);ctx.globalAlpha=1;}
    if(!running&&game.status==='active'){ctx.fillStyle='#07172680';ctx.fillRect(0,0,1000,600);ctx.fillStyle='#ffe8b0';ctx.font='bold 32px Georgia';ctx.textAlign='center';ctx.fillText('TAKTİK MOLA',500,290);}
  }
  function hud(){root.querySelector('#training-event').textContent=game.event;root.querySelector('#training-clock').textContent=`${Math.floor(Math.max(0,180-game.elapsed)/60).toString().padStart(2,'0')}:${Math.floor(Math.max(0,180-game.elapsed)%60).toString().padStart(2,'0')}`;
    root.querySelector('#training-hp').textContent=`Aldren ♡ ${Math.ceil(game.hero.hp)} / ${game.hero.maxHp}`;root.querySelector('#training-score').textContent=`${Math.floor(game.score)}%`;root.querySelector('#training-progress').style.width=`${game.score}%`;
    root.querySelector('#training-squads').innerHTML=game.squads.map((s,i)=>`<button class="training-squad ${i===game.selected?'selected':''} ${s.hp<=0?'dead':''}" data-training-squad="${i}" aria-pressed="${i===game.selected}"><span><b>${i+1}. ${esc(s.name)}</b><small>${esc(orders[s.order])} · ${Math.ceil(s.hp)} / ${s.maxHp}</small></span><i style="width:${Math.max(0,s.hp)/s.maxHp*100}%"></i></button>`).join('');
    root.querySelector('[data-training-pause]').textContent=running?'Ⅱ Duraklat':'▶ Devam';
    const outcome=root.querySelector('#training-outcome');if(game.status!=='active'){outcome.hidden=false;outcome.innerHTML=`<b>${game.status==='won'?'✦ ZAFER':'◇ TATBİKAT BİTTİ'}</b><p>${esc(game.event)}</p><small>Emir: ${game.orderCount} · Yetenek: ${game.abilityUses}</small>`;running=false;}
  }
  function frame(now){if(!last)last=now;const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;
    if(running&&game.status==='active'&&!document.hidden){let x=0,y=0;if(keys.has('a')||keys.has('arrowleft'))x--;if(keys.has('d')||keys.has('arrowright'))x++;if(keys.has('w')||keys.has('arrowup'))y--;if(keys.has('s')||keys.has('arrowdown'))y++;stepTraining(game,dt,{x,y});}
    draw();if(now-lastHud>150){hud();lastHud=now;}raf=requestAnimationFrame(frame);
  }
  function onKeyDown(e){if(!root.isConnected||e.target.matches('input,textarea'))return;const key=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','q','e',' ','1','2','3'].includes(key))e.preventDefault();keys.add(key);
    if(e.repeat)return;if(key==='q')heroAbility(game,'burst');if(key==='e')heroAbility(game,'rally');if(key===' ')heroAbility(game,'dash');if('123'.includes(key)&&key.length===1)game.selected=Number(key)-1;
  }
  function onKeyUp(e){keys.delete(e.key.toLowerCase());}
  function point(e){const rect=canvas.getBoundingClientRect();return {x:(e.clientX-rect.left)/rect.width*FIELD.width,y:(e.clientY-rect.top)/rect.height*FIELD.height};}
  function onCanvas(e){if(game.status!=='active')return;const p=point(e);if(orderWaiting){orderSquad(game,game.selected,'advance',p.x,p.y);orderWaiting=false;game.event='Birlik yeni mevziye ilerliyor.';}else setHeroDestination(game,p.x,p.y);hud();}
  function onClick(e){const button=e.target.closest('button');if(!button||!root.contains(button))return;
    if(button.dataset.trainingSquad!==undefined){game.selected=Number(button.dataset.trainingSquad);hud();}
    if(button.dataset.trainingOrder){const order=button.dataset.trainingOrder;if(order==='advance'){orderWaiting=true;game.event='Haritada birlik için hedef noktayı seç.';}else{orderWaiting=false;orderSquad(game,game.selected,order);}hud();}
    if(button.dataset.trainingAbility)heroAbility(game,button.dataset.trainingAbility);
    if(button.hasAttribute('data-training-pause')){running=!running;last=0;hud();}
    if(button.hasAttribute('data-training-reset')){game=createTraining();running=true;orderWaiting=false;root.querySelector('#training-outcome').hidden=true;hud();}
  }
  function downMove(e){const button=e.target.closest('[data-move]');if(!button||!root.contains(button))return;const keysFor={left:'a',right:'d',up:'w',down:'s'};keys.add(keysFor[button.dataset.move]);pointing=true;e.preventDefault();}
  function upMove(){if(pointing){for(const key of ['w','a','s','d'])keys.delete(key);pointing=false;}}
  window.addEventListener('keydown',onKeyDown);window.addEventListener('keyup',onKeyUp);window.addEventListener('blur',upMove);
  canvas.addEventListener('click',onCanvas);root.addEventListener('click',onClick);root.addEventListener('pointerdown',downMove);window.addEventListener('pointerup',upMove);window.addEventListener('pointercancel',upMove);
  hud();raf=requestAnimationFrame(frame);
  return ()=>{cancelAnimationFrame(raf);window.removeEventListener('keydown',onKeyDown);window.removeEventListener('keyup',onKeyUp);window.removeEventListener('blur',upMove);window.removeEventListener('pointerup',upMove);window.removeEventListener('pointercancel',upMove);canvas.removeEventListener('click',onCanvas);root.removeEventListener('click',onClick);root.removeEventListener('pointerdown',downMove);};
}
