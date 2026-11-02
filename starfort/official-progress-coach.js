/** STARFORT v2.29 — next actions always follow the currently trusted player state.
 * Authenticated progress is never inferred from the guest/local browser save. */
import {STAGES,teamPower} from './rules.js';
export const OFFICIAL_STAGE_THRESHOLDS=Object.freeze([250,310,380,450,540,650,780,920]);
export function isoWeek(now=Date.now()){
 const d=new Date(now);if(!Number.isFinite(d.getTime()))return null;
 const thursday=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()));
 thursday.setUTCDate(thursday.getUTCDate()+4-(thursday.getUTCDay()||7));
 const year=thursday.getUTCFullYear();
 const first=new Date(Date.UTC(year,0,1));
 return `${year}-${String(Math.ceil(((thursday-first)/86400000+1)/7)).padStart(2,'0')}`;
}
export function officialNextGoal(view,account,now=Date.now()){
 if(!account)return {id:'loading',title:'Komutan hesabı doğrulanıyor',detail:'Kayıtların alınması için sunucu bağlantısını yenile.',action:'campaign',label:'Tekrar dene'};
 const mission=account.mission;
 if(mission)return {id:'mission',title:'Önce devam eden savaşı tamamla',detail:'Aktif seferin sunucuda kayıtlı. Sayfa yenilense de komut vermeye devam edebilirsin.',action:'campaign',label:'Savaşa dön'};
 const cleared=account.cleared.length;
 const equipped=Object.values(account.loadouts||{}).reduce((sum,slots)=>sum+Object.values(slots||{}).filter(Boolean).length,0);
 const power=teamPower(view);
 if(!equipped&&account.inventory?.iron_sword)return {id:'equip',title:'İlk kahramanını donat',detail:'Çantandaki başlangıç kılıcını kuşan. Eşya, sunucu savaş gücünü kalıcı artırır.',action:'armory',label:'Cephaneliğe git'};
 if(cleared<8){
  const stage=STAGES[cleared],required=OFFICIAL_STAGE_THRESHOLDS[cleared];
  if(power<required*.7)return {id:'train',title:stage.name+' için takımını güçlendir',detail:`Yeni bölgenin önerilen gücü ${required}. Kahraman eğitimleri veya ekipmanlarla hazır ol; resmî sunucu asgari gücü kontrol eder.`,action:'heroes',label:'Kahramanları eğit'};
  return {id:'story',title:'Sıradaki sefer: '+stage.name,detail:`${cleared}/8 bölge tamamlandı. Bu seferde yeni hikâye, ganimet ve kalıcı 1–3 yıldız kazanabilirsin.`,action:'expedition',label:'Seferi aç'};
 }
 if(account.mazeFloor<16)return {id:'maze',title:`Yıldızaltı Labirenti · Kat ${account.mazeFloor+1}`,detail:'16 kalıcı katı bitir; her katın savaş sonucu sunucuda kayıtlıdır.',action:'expedition',label:'Labirente git'};
 const bestStars=Object.values(account.campaignStars||{}).reduce((sum,n)=>sum+n,0);
 if(bestStars<24)return {id:'stars',title:'Eksik yıldızları tamamla',detail:`Hikâye mührün ${bestStars}/24. Bölümleri tekrar oynayıp dereceni üç yıldıza çıkar.`,action:'expedition',label:'Yıldızlara git'};
 const veteran=Object.values(account.veteranMedals||{}).reduce((sum,n)=>sum+n,0);
 if(veteran<24)return {id:'veteran',title:'Usta seferlerini tamamla',detail:`Ustalık mührün ${veteran}/24. Bütün sekiz bölgenin üç zorluk kademesini aş.`,action:'expedition',label:'Usta seferlerini aç'};
 if(account.riftWeek!==isoWeek(now))return {id:'rift',title:'Haftalık Yıldız Yarığı seni bekliyor',detail:'Bu haftanın tek resmî yarık mührünü kazan.',action:'expedition',label:'Haftalık yarığı aç'};
 if(view?.construction)return {id:'build',title:'Köy ustası çalışıyor',detail:'İnşaatının durumunu ve tamamlandığında kazandığın bina bonusunu kontrol et.',action:'keep',label:'Köye git'};
 return {id:'long-game',title:'Kuzeyin koruyucusu',detail:'Ekipmanlarını +5 ustalığa taşı, köyünü seviye 20’ye geliştir ve haftalık dünya patronuna katkı yap.',action:'armory',label:'Ekipmanı güçlendir'};
}
export function officialNextGoalMarkup(goal){
 const e=s=>String(s).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
 return `<section class="official-next-goal" aria-label="Sıradaki doğrulanmış hedef"><div><span class="eyebrow">✦ KOMUTANIN SONRAKİ ADIMI · SUNUCU KAYDI</span><h3>${e(goal.title)}</h3><p>${e(goal.detail)}</p></div><button class="secondary" data-view="${e(goal.action)}">${e(goal.label)}</button></section>`;
}
