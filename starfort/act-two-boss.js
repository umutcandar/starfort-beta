/** Honest presentation of the server-owned Act II boss's three health phases. */
import {SECOND_ACT} from './second-act.js';
import {actTwoBossAbility} from './act-two-abilities.js';
const labels=Object.freeze([
 ['Fenerlerin Nöbeti','Kızıl Hiddet','Sancağın Son Yemini'],
 ['Cam Perde','Kırık Kehanet','Çölün Son Aynası'],
 ['Taş Zırh','Göktaşı Çatlağı','Kraterin Son Darbesi'],
 ['Diken Savunması','Kanlı Taç','Köklerin Öfkesi'],
 ['Kor Muhafızları','Kül Fırtınası','Son Köz'],
 ['Gece Nöbeti','Kayıp Ayin','Gece Çanı'],
 ['Fırtına Zırhı','Yıldırım Yemini','Son Gökgürültüsü'],
 ['Boşluk Siperi','Yıldızın Çöküşü','Varisin Son Sözü']
]);
export const ACT_TWO_BOSS_PHASES=labels;
export function actTwoBossStatus(mission){
 if(!mission||mission.mode!=='act2'||mission.wave!==3||mission.waves!==3||
    !Number.isInteger(mission.stage)||!SECOND_ACT[mission.stage-1])return null;
 const max=Number(mission.enemyMaxHp),hp=Number(mission.enemyHp);
 if(!Number.isFinite(max)||max<=0||!Number.isFinite(hp)||hp<0||hp>max)return null;
 const ratio=hp/max;
 const phase=ratio<=.33?3:ratio<=.67?2:1;
 const hint=phase===1?'Düşmanın ilk niyetini izle; savunma durumunda kahraman yeteneğini kullan.':
   phase===2?'Patron can emme ve kalkan arasında geçiş yapıyor. Yeteneğini zamanında kullan.':
   'Patron son gücünde daha sert ağır darbeler yapıyor. Ağır darbe öncesi siper emrini seç.';
 return Object.freeze({phase,total:3,title:labels[mission.stage-1][phase-1],boss:SECOND_ACT[mission.stage-1].boss,hint,ratio,ability:actTwoBossAbility(mission)});
}
