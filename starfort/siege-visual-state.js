/** Pure, server-snapshot-driven visual decisions for the illustrated siege.
 * Never changes HP, timers or win conditions. Renderers may use these values
 * to display destruction and the escort unit, even when artwork is loaded. */
const bound=(value,min,max)=>Math.max(min,Math.min(max,value));
export function siegeVisualState(room){
  if(room?.variant!=='siege'||!room.siege)return null;
  const {gate,core,ram}=room.siege;
  const health=object=>object&&Number.isFinite(object.maxHp)&&object.maxHp>0
    ?bound(Number.isFinite(Number(object.hp))?Number(object.hp)/object.maxHp:0,0,1):0;
  const gateFraction=health(gate),coreFraction=health(core),ramFraction=health(ram);
  const gateStage=gateFraction===0?3:gateFraction<=.3?2:gateFraction<=.65?1:0;
  return Object.freeze({
    gateFraction,coreFraction,ramFraction,gateStage,gateDown:gateStage===3,
    ramVisible:Boolean(ram),ramActive:Boolean(ram&&ram.hp>0),
    ramPhase:['waiting','advancing','ramming','destroyed','breached'].includes(ram?.phase)?ram.phase:'waiting',
    objective:gateStage===3?'core':'gate',
    status:gateStage===3?'Kapı yıkıldı · Çekirdeğe ilerle':
      ram?.hp<=0?'Koçbaşı devre dışı · Yeniden hazırlanıyor':
      ram?.phase==='waiting'?'Koçbaşına eskortluk et':
      ram?.phase==='advancing'?'Koçbaşı ilerliyor':
      ram?.phase==='ramming'?'Koçbaşı kapıya saldırıyor':'Kapıyı yık'
  });
}
