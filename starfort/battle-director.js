/** Display-only objective guidance derived exclusively from a server snapshot.
 * This module does not and must not modify scores, health, timing or inputs. */
const clamp=(value)=>Math.max(0,Math.min(100,Math.round(value)));
const percent=(item)=>Number.isFinite(item?.hp)&&Number.isFinite(item?.maxHp)&&item.maxHp>0
  ?clamp(100*item.hp/item.maxHp):0;
const result=(key,title,detail,progress=0,urgent=false)=>Object.freeze({key,title,detail,progress:clamp(progress),urgent});
export function battleObjective(room,you){
  if(!room||!Array.isArray(room.players))return result('waiting','TAKTİK HEDEF','Bir maç başladığında hedef burada gösterilir.');
  const player=room.players.find(p=>p.id===you);
  if(!player)return result('spectator','SAVAŞ ALANI','Takım bilgisi bekleniyor.');
  if(room.status==='ended'){
    const won=room.winner===player.team;
    return result('ended',room.winner===null?'BERABERE':won?'ZAFER':'MAĞLUBİYET',
      room.variant==='siege'?(room.reason==='siege-victory'?'Yıldız çekirdeği ele geçirildi.':'Kuşatma sona erdi.'):'Maç tamamlandı.',100);
  }
  if(player.hp<=0){
    const wait=Math.max(0,Math.ceil((player.respawnAt||room.elapsed||0)-(room.elapsed||0)));
    return result('respawn','YENİDEN DOĞUŞ',`${wait} saniye sonra yeniden savaşa katılacaksın.`,100,true);
  }
  if(room.variant==='siege'&&room.siege){
    const {gate,core,ram}=room.siege;
    const gateDone=gate?.hp<=0;
    if(player.team===1){
      if(gateDone)return result('defend-core','SON SAVUNMA','Yıldız çekirdeğini koru. Düşmanı iç kaleden uzaklaştır.',percent(core),true);
      if(ram?.hp>0)return result('stop-ram','KOÇBAŞINI DURDUR','Koçbaşını hedef al; kapıyı koruyarak süreyi doldur.',percent(gate),ram?.phase==='ramming');
      return result('defend-gate','KAPIYI SAVUN','Koçbaşı yıkıldı. Yeniden gelmeden savunmanı güçlendir.',percent(gate));
    }
    if(gateDone)return result('breach','ÇEKİRDEĞİ ELE GEÇİR','Kapı açıldı. Takımınla yıldız çekirdeğine saldır.',100-percent(core),true);
    if(!ram||ram.hp<=0)return result('ram-down','KOÇBAŞINI BEKLE','Koçbaşı yeniden hazırlanıyor. Askerlerini koru.',100-percent(gate),true);
    if(ram.phase==='ramming')return result('break-gate','KAPIYI YIK','Koçbaşı kapıyı dövüyor. Kapı çevresindeki muhafızları temizle.',100-percent(gate),true);
    if(ram.phase==='advancing')return result('escort','KOÇBAŞINI KORU','Koçbaşı ilerliyor. Yakınında kal ve düşmanı uzak tut.',100-percent(gate));
    return result('rally','KOÇBAŞINA YAKLAŞ','Koçbaşının hareket etmesi için saldıran kahramanlardan biri yanında olmalı.',100-percent(gate),true);
  }
  const score=Array.isArray(room.score)?room.score:[0,0];
  const myScore=Number(score[player.team])||0;
  const captured=(room.capture||[]).filter(side=>side===player.team).length;
  if(captured===2)return result('hold-flags','SANCAKLARI KORU','Her iki sancağı kontrol ediyorsunuz. Savunma emri ver.',myScore);
  if(captured===1)return result('second-flag','İKİNCİ SANCAĞI AL','Bir sancak sizde. Diğerini ele geçirmek için ilerle.',myScore);
  return result('capture','SANCAKLARI ELE GEÇİR','Haritadaki iki kontrol noktasına ilerle ve bölgeyi savun.',myScore,Number(score[1-player.team])>myScore);
}
