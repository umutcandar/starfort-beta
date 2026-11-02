/** STARFORT v2.29 — next actions always follow the currently trusted player state.
 * Authenticated progress is never inferred from the guest/local browser save. */
import {STAGES,teamPower} from './rules.js';
import {SECOND_ACT} from './second-act.js';
import {officialServerTeamPower} from './official-server-team-power.js';
import {chronicleState} from './commander-chronicle.js';
export const OFFICIAL_STAGE_THRESHOLDS=Object.freeze([250,310,380,450,540,650,780,920]);
export function isoWeek(now=Date.now()){
 const d=new Date(now);if(!Number.isFinite(d.getTime()))return null;
 const thursday=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()));
 thursday.setUTCDate(thursday.getUTCDate()+4-(thursday.getUTCDay()||7));
 const year=thursday.getUTCFullYear();
 const first=new Date(Date.UTC(year,0,1));
 return `${year}-${String(Math.ceil(((thursday-first)/86400000+1)/7)).padStart(2,'0')}`;
}
export const OFFICIAL_STORY_GATES=Object.freeze({
 3:{forge:2,gear:1,maze:1},4:{forge:2,gear:1,maze:2},
 5:{forge:3,gear:2,maze:3},6:{forge:3,gear:2,maze:4},
 7:{forge:4,gear:3,maze:6},8:{forge:4,gear:3,maze:8}
});
export function officialStoryReadiness(view,account,stage){
 const gate=OFFICIAL_STORY_GATES[stage];
 if(!gate||account?.cleared?.includes(stage))return {ok:true,missing:[]};
 const equipped=Object.values(account?.loadouts||{}).reduce((sum,slots)=>sum+Object.values(slots||{}).filter(Boolean).length,0);
 const missing=[];
 if((view?.buildings?.forge||0)<gate.forge)missing.push({kind:'forge',value:view?.buildings?.forge||0,required:gate.forge,label:'Demirhane '+gate.forge});
 if(equipped<gate.gear)missing.push({kind:'gear',value:equipped,required:gate.gear,label:gate.gear+' kuşanılmış eşya'});
 if((account?.mazeFloor||0)<gate.maze)missing.push({kind:'maze',value:account?.mazeFloor||0,required:gate.maze,label:'Labirent '+gate.maze+'. kat'});
 return {ok:missing.length===0,missing};
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
  const readiness=officialStoryReadiness(view,account,stage.id);
  if(!readiness.ok){
   const next=readiness.missing[0];
   const action=next.kind==='maze'?'expedition':next.kind==='forge'?'keep':'armory';
   return {id:'gate-'+next.kind,title:stage.name+' · '+next.label+' gerekli',
     detail:`Şu an ${next.value}/${next.required}. Diğer bölgeye geçmeden önce ${next.kind==='forge'?'Demirhaneni yükselt':next.kind==='maze'?'Labirent muhafızlarını yen':'daha fazla ekipman kuşan'}. Bu şart sunucu tarafından da doğrulanır.`,
     action,label:next.kind==='maze'?'Labirenti aç':next.kind==='forge'?'Köyü aç':'Cephaneliğe git'};
  }
  if(power<required*.7)return {id:'train',title:stage.name+' için takımını güçlendir',detail:`Yeni bölgenin önerilen gücü ${required}. Kahraman eğitimleri veya ekipmanlarla hazır ol; resmî sunucu asgari gücü kontrol eder.`,action:'heroes',label:'Kahramanları eğit'};
  return {id:'story',title:'Sıradaki sefer: '+stage.name,detail:`${cleared}/8 bölge tamamlandı. Bu seferde yeni hikâye, ganimet ve kalıcı 1–3 yıldız kazanabilirsin.`,action:'expedition',label:'Seferi aç'};
 }
 if(Array.isArray(account.act2Cleared)&&account.act2Cleared.length<8){
  const chapter=SECOND_ACT[account.act2Cleared.length];
  const threshold=chapter.recommendedPower*.7;
  if(officialServerTeamPower(view,account)<threshold)return {id:'act2-training',title:chapter.name+' için takımı geliştir',detail:'İkinci perde için en az '+Math.ceil(threshold)+' takım gücü gerekiyor. Önerilen: '+chapter.recommendedPower+'.',action:'heroes',label:'Kahramanları güçlendir'};
  return {id:'act2',title:'İkinci perde: '+chapter.name,detail:'Yeni hikâye '+(account.act2Cleared.length+1)+'/8. Üç operasyonu tamamlayarak sıradaki bölgeyi aç.',action:'expedition',label:'Yeni bölgeye git'};
 }
 if(account.mazeFloor<16)return {id:'maze',title:`Yıldızaltı Labirenti · Kat ${account.mazeFloor+1}`,detail:'16 kalıcı katı bitir; her katın savaş sonucu sunucuda kayıtlıdır.',action:'expedition',label:'Labirente git'};
 const bestStars=Object.values(account.campaignStars||{}).reduce((sum,n)=>sum+n,0);
 if(bestStars<24)return {id:'stars',title:'Eksik yıldızları tamamla',detail:`Hikâye mührün ${bestStars}/24. Bölümleri tekrar oynayıp dereceni üç yıldıza çıkar.`,action:'expedition',label:'Yıldızlara git'};
 const veteran=Object.values(account.veteranMedals||{}).reduce((sum,n)=>sum+n,0);
 if(veteran<24)return {id:'veteran',title:'Usta seferlerini tamamla',detail:`Ustalık mührün ${veteran}/24. Bütün sekiz bölgenin üç zorluk kademesini aş.`,action:'expedition',label:'Usta seferlerini aç'};
 if(account.riftWeek!==isoWeek(now))return {id:'rift',title:'Haftalık Yıldız Yarığı seni bekliyor',detail:'Bu haftanın tek resmî yarık mührünü kazan.',action:'expedition',label:'Haftalık yarığı aç'};
 const chronicle=chronicleState(account);
 if(chronicle.next){
  if(chronicle.eligible)return {id:'chronicle-claim',title:'Komutan Kroniği · '+chronicle.next.name,
   detail:chronicle.next.wins+' doğrulanmış zaferle yeni rütbe kazandın. '+chronicle.next.gold+' altın ve '+chronicle.next.aether+' yıldız özü sandığını aç.',
   action:'expedition',label:'Rütbe sandığını aç'};
  return {id:'chronicle-train',title:'Kronik rütbesi · '+chronicle.next.name,
   detail:'Yeni rütbeye '+chronicle.remaining+' zafer kaldı. Tamamlanan seferleri yeniden oynayarak kalıcı rütbeleri yükselt.',
   action:'expedition',label:'Zafer yolunu aç'};
 }
 if(view?.construction)return {id:'build',title:'Köy ustası çalışıyor',detail:'İnşaatının durumunu ve tamamlandığında kazandığın bina bonusunu kontrol et.',action:'keep',label:'Köye git'};
 return {id:'long-game',title:'Kuzeyin koruyucusu',detail:'Ekipmanlarını +5 ustalığa taşı, köyünü seviye 20’ye geliştir ve haftalık dünya patronuna katkı yap.',action:'armory',label:'Ekipmanı güçlendir'};
}
export function officialNextGoalMarkup(goal){
 const e=s=>String(s).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
 return `<section class="official-next-goal" aria-label="Sıradaki doğrulanmış hedef"><div><span class="eyebrow">✦ KOMUTANIN SONRAKİ ADIMI · SUNUCU KAYDI</span><h3>${e(goal.title)}</h3><p>${e(goal.detail)}</p></div><button class="secondary" data-view="${e(goal.action)}">${e(goal.label)}</button></section>`;
}
