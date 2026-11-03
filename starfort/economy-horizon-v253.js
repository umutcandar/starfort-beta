/** v2.53. Read-only projection of CURRENT authenticated village production.
 * Uses live sfb_village_api collect rules: first 240 minutes at full output,
 * remainder (up to 1440 minutes total) at 12%; current levels are held fixed.
 * Excludes all quests, wins, calendar rewards, trades, upgrades and spending.
 * This is a scenario, NOT a promise or an amount the client can claim.
 */
import {getLocale,formatNumber} from './locale-v243.js';
import {ITEMS} from './equipment.js';

export const ECONOMY_HORIZONS=Object.freeze([90,180]);
export const ECONOMY_PROFILES=Object.freeze([
 Object.freeze({id:'casual',daysPerWeek:3,collectionsPerDay:1}),
 Object.freeze({id:'daily',daysPerWeek:7,collectionsPerDay:1}),
 Object.freeze({id:'active',daysPerWeek:7,collectionsPerDay:2})
]);
export const ECONOMY_KEYS=Object.freeze([
 'title','summary','assumptions','day','gold','stone','aether','casual','daily','active',
 'allFour','remaining','enough','shortfall','notGuaranteed','goal','weekGate','noStreak'
]);
const L={
tr:['90–180 günlük kaynak planı','Mevcut bina seviyeleri sabit kalırsa olası üretim; oyun ödülü değildir.','Görev, savaş, takvim, ticaret, bina yükseltmesi ve harcamalar hesaba katılmaz.','gün','Altın','Taş','Yıldız özü','Haftada 3 toplama','Her gün 1 toplama','Her gün 2 toplama','4 patron ekipmanını +5 ve IV yapmak','Kalan toplam maliyet','Kaynak açısından yeterli','Kaynak açığı','Tahmindir; zaferler ve 14 farklı patron haftası garanti edilmez.','Hedef bütçe','En erken 14 ayrı haftalık zafer','Giriş serisi şartı yok'],
en:['90–180 day resource plan','Projected production at your current building levels, not a game reward.','Excludes quests, battles, calendar, trades, upgrades and spending.','days','Gold','Stone','Star essence','Collect 3 days/week','Collect once a day','Collect twice a day','Master all 4 boss relics +5 and ascend to IV','Total remaining cost','Resources cover cost','Resource shortfall','Estimate only; victories and 14 distinct boss weeks are not guaranteed.','Budget target','At least 14 distinct weekly wins','No login streak'],
es:['Plan de recursos a 90–180 días','Producción estimada con edificios actuales; no es un premio.','No incluye misiones, combates, calendario, comercio, mejoras ni gastos.','días','Oro','Piedra','Esencia estelar','Recoger 3 días/semana','Recoger una vez al día','Recoger dos veces al día','Llevar los 4 equipos +5 y ascender al IV','Coste total restante','Recursos suficientes','Faltan recursos','Estimación: no garantiza victorias ni 14 semanas de jefe.','Objetivo de recursos','Al menos 14 victorias semanales distintas','Sin racha de inicio de sesión'],
'pt-BR':['Plano de recursos para 90–180 dias','Produção estimada nos níveis atuais, não é recompensa.','Não inclui missões, batalhas, calendário, comércio, melhorias ou gastos.','dias','Ouro','Pedra','Essência estelar','Coletar 3 dias/semana','Coletar uma vez ao dia','Coletar duas vezes ao dia','Melhorar os 4 itens até +5 e nível IV','Custo total restante','Recursos suficientes','Recursos insuficientes','Estimativa: vitórias e 14 semanas distintas não são garantidas.','Meta de recursos','Pelo menos 14 vitórias semanais distintas','Sem sequência de login'],
fr:['Plan de ressources sur 90–180 jours','Production estimée aux niveaux actuels, pas une récompense.','Hors quêtes, combats, calendrier, échanges, améliorations et dépenses.','jours','Or','Pierre','Essence stellaire','Collecter 3 jours/semaine','Collecter une fois par jour','Collecter deux fois par jour','Maîtriser les 4 objets +5 et les élever au rang IV','Coût restant total','Ressources suffisantes','Ressources manquantes','Estimation : victoires et 14 semaines de boss non garanties.','Objectif de ressources','Au moins 14 victoires hebdomadaires distinctes','Pas de série de connexions'],
de:['90–180-Tage-Ressourcenplan','Geschätzte Produktion mit aktuellen Gebäuden, keine Belohnung.','Ohne Quests, Kämpfe, Kalender, Handel, Upgrades und Ausgaben.','Tage','Gold','Stein','Sternenessenz','3 Tage/Woche sammeln','Einmal täglich sammeln','Zweimal täglich sammeln','Alle 4 Bossgegenstände auf +5 und Rang IV bringen','Verbleibende Gesamtkosten','Ressourcen reichen','Ressourcen fehlen','Nur Schätzung: Siege und 14 Bosswochen sind nicht garantiert.','Budgetziel','Mindestens 14 unterschiedliche wöchentliche Siege','Keine Login-Serie nötig'],
it:['Piano risorse di 90–180 giorni','Produzione stimata ai livelli attuali, non è una ricompensa.','Esclude missioni, battaglie, calendario, scambi, migliorie e spese.','giorni','Oro','Pietra','Essenza stellare','Raccogli 3 giorni/settimana','Raccogli una volta al giorno','Raccogli due volte al giorno','Porta i 4 oggetti a +5 e al grado IV','Costo totale rimanente','Risorse sufficienti','Risorse mancanti','Stima: vittorie e 14 settimane di boss non garantite.','Obiettivo risorse','Almeno 14 vittorie settimanali distinte','Nessuna serie di accessi'],
ru:['План ресурсов на 90–180 дней','Прогноз производства на текущих уровнях, не игровая награда.','Без заданий, боёв, календаря, обмена, улучшений и трат.','дней','Золото','Камень','Звёздная эссенция','Сбор 3 дня в неделю','Один сбор в день','Два сбора в день','Все 4 предмета до +5 и ранга IV','Осталось потратить','Ресурсов хватает','Недостаток ресурсов','Прогноз: победы и 14 недель босса не гарантированы.','Целевой бюджет','Не менее 14 разных недельных побед','Без серии входов'],
ar:['خطة موارد لـ 90–180 يوماً','إنتاج متوقع بمستويات مبانيك الحالية وليس مكافأة.','لا تشمل المهام والمعارك والتقويم والتجارة والترقيات والمصروفات.','يوم','ذهب','حجر','جوهر نجمي','جمع 3 أيام أسبوعياً','جمع مرة يومياً','جمع مرتين يومياً','رفع المعدات الأربع إلى +5 والرتبة IV','التكلفة المتبقية','الموارد كافية','نقص الموارد','تقدير فقط: الانتصارات و14 أسبوعاً غير مضمونة.','ميزانية الهدف','14 انتصاراً في أسابيع مختلفة على الأقل','لا يتطلب سلسلة دخول'],
hi:['90–180 दिन की संसाधन योजना','मौजूदा भवन स्तरों पर अनुमानित उत्पादन, कोई इनाम नहीं।','इसमें कार्य, युद्ध, कैलेंडर, व्यापार, उन्नयन और खर्च शामिल नहीं हैं।','दिन','सोना','पत्थर','तारकीय सार','सप्ताह में 3 दिन संग्रह','प्रतिदिन एक संग्रह','प्रतिदिन दो संग्रह','चार बॉस उपकरण +5 और रैंक IV तक','कुल बाकी लागत','संसाधन पर्याप्त','संसाधन कम','अनुमान: जीत और 14 अलग बॉस सप्ताह सुनिश्चित नहीं।','बजट लक्ष्य','कम से कम 14 अलग साप्ताहिक जीत','लगातार लॉगिन जरूरी नहीं'],
id:['Rencana sumber daya 90–180 hari','Perkiraan produksi pada tingkat bangunan saat ini, bukan hadiah.','Tidak termasuk misi, pertempuran, kalender, dagang, peningkatan atau pengeluaran.','hari','Emas','Batu','Esensi bintang','Kumpulkan 3 hari/minggu','Kumpulkan sekali sehari','Kumpulkan dua kali sehari','Empat perlengkapan bos ke +5 dan peringkat IV','Total biaya tersisa','Sumber daya cukup','Kekurangan sumber daya','Perkiraan: kemenangan dan 14 minggu bos tidak dijamin.','Target anggaran','Minimal 14 kemenangan di minggu berbeda','Tanpa kewajiban login beruntun'],
ja:['90～180日の資源計画','現在の建物レベルでの生産予測です。報酬ではありません。','クエスト、戦闘、カレンダー、交易、建設、消費は含みません。','日','金','石','星のエッセンス','週3日回収','毎日1回回収','毎日2回回収','ボス装備4種を+5とランクIVに','残りの総費用','資源は足りる見込み','資源が不足','予測です。勝利や14週のボス戦は保証されません。','必要な予算','異なる14週で勝利が必要','連続ログイン不要'],
ko:['90~180일 자원 계획','현재 건물 수준의 생산 예상치이며 보상이 아닙니다.','임무, 전투, 출석, 거래, 건설, 소비는 포함하지 않습니다.','일','골드','돌','별 정수','주 3일 수집','매일 1회 수집','매일 2회 수집','보스 장비 4종 +5 및 IV등급','남은 총비용','자원 충족','자원 부족','예상치이며 승리와 보스 14주는 보장되지 않습니다.','목표 예산','서로 다른 14주 승리 필요','연속 로그인 불필요'],
'zh-CN':['90～180天资源计划','按当前建筑等级估算的产量，并非游戏奖励。','不含任务、战斗、签到、交易、升级和支出。','天','金币','石头','星之精华','每周收取3天','每天收取1次','每天收取2次','全部4件首领装备+5并升至IV阶','剩余总费用','资源充足','资源不足','仅为估算；胜利与14个不同首领周不作保证。','预算目标','至少14个不同周的胜利','无需连续登录']
};
export const ECONOMY_TRANSLATIONS=Object.freeze(Object.fromEntries(Object.entries(L).map(([lang,v])=>[lang,Object.freeze(Object.fromEntries(ECONOMY_KEYS.map((key,i)=>[key,v[i]])))])));
export const economyText=key=>ECONOMY_TRANSLATIONS[getLocale()]?.[key]??ECONOMY_TRANSLATIONS.en[key]??'';
export function auditEconomyLanguages(langs){
 return langs.flatMap(lang=>ECONOMY_KEYS.filter(key=>
  typeof ECONOMY_TRANSLATIONS[lang]?.[key]!=='string'||!ECONOMY_TRANSLATIONS[lang][key].trim()
 ).map(key=>lang+'.'+key));
}
const KEYS=['gold','stone','aether'];
const ASCENDING_IDS=['ember_guard','star_spear','guardian_seal','starbreaker'];
const cost=(rank,rarity)=>({gold:120*rank*rank*rarity,stone:40*rank*rarity,aether:8*rank*rank*rarity});
const rankCost=rank=>({gold:1400*rank*rank,stone:420*rank,aether:100*rank*rank});
const empty=()=>({gold:0,stone:0,aether:0});
const plus=(a,b)=>Object.fromEntries(KEYS.map(k=>[k,a[k]+b[k]]));
const safeLevel=(n,cap=20)=>Number.isSafeInteger(n)&&n>=1&&n<=cap?n:1;

/** The exact per-collection production formula of sfb_village_api, rounded per resource. */
export function villageCollection(buildings,minutes=1440){
 const t=Math.min(1440,Math.max(0,Number(minutes)||0));
 const effective=Math.min(240,t)+Math.max(0,t-240)*.12;
 const keep=safeLevel(buildings?.keep),bonus=1+(keep-1)*.05;
 const level=k=>safeLevel(buildings?.[k]);
 return Object.freeze({
  gold:Math.floor(4*level('farm')*bonus*effective),
  wood:Math.floor(3*level('lumber')*bonus*effective),
  stone:Math.floor(2.5*level('quarry')*bonus*effective),
  aether:Math.floor(.6*level('observatory')*bonus*effective)
 });
}
/** Remaining costs for four +5 gear masteries and four rank-IV ascensions. */
export function relicRoadRemaining(state){
 let output=empty();
 for(const id of ASCENDING_IDS){
  const item=ITEMS.find(x=>x.id===id);
  const rarity=item?.rarity==='legendary'?3:2;
  const mastery=Math.min(5,Math.max(0,Number(state?.itemUpgrades?.[id]||0)));
  const ascension=Math.min(4,Math.max(0,Number(state?.relicAscensions?.[id]||0)));
  for(let n=mastery+1;n<=5;n++)output=plus(output,cost(n,rarity));
  for(let n=ascension+1;n<=4;n++)output=plus(output,rankCost(n));
 }
 return Object.freeze(output);
}
/** Collect scenarios have no "offline catch-up" beyond 24 hours. No future upgrades. */
export function economyScenario(state,days,profile='daily'){
 if(!ECONOMY_HORIZONS.includes(days))return null;
 const option=ECONOMY_PROFILES.find(x=>x.id===profile);
 if(!option)return null;
 let produced=empty(),collections=0;
 for(let day=0;day<days;day++){
  if(option.daysPerWeek===3&&![0,2,4].includes(day%7))continue;
  for(let n=0;n<option.collectionsPerDay;n++){
   const gain=villageCollection(state?.buildings,option.collectionsPerDay===2?720:1440);
   produced=plus(produced,gain);collections++;
  }
 }
 const balances=Object.fromEntries(KEYS.map(k=>[k,Math.max(0,Number(state?.res?.[k]||0))]));
 const total=plus(produced,balances),remaining=relicRoadRemaining(state);
 const shortfall=Object.fromEntries(KEYS.map(k=>[k,Math.max(0,remaining[k]-total[k])]));
 return Object.freeze({days,profile,collections,produced,total,remaining,shortfall,
  sufficient:KEYS.every(k=>shortfall[k]===0)});
}
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>formatNumber(Math.floor(n));
export function economyHorizonMarkup(state){
 if(!state?.serverVillage)return '';
 const left=relicRoadRemaining(state);
 const rows=ECONOMY_HORIZONS.flatMap(days=>ECONOMY_PROFILES.map(p=>{
  const result=economyScenario(state,days,p.id);
  const afford=result.sufficient;
  return '<tr><th scope="row">'+days+' '+esc(economyText('day'))+'</th>'+
   '<td>'+esc(economyText(p.id))+'</td>'+
   '<td>'+fmt(result.total.gold)+'</td><td>'+fmt(result.total.stone)+'</td>'+
   '<td>'+fmt(result.total.aether)+'</td><td class="'+(afford?'ok':'short')+'">'+
   esc(economyText(afford?'enough':'shortfall'))+'</td></tr>';
 })).join('');
 return '<details class="economy-horizon-v253"><summary>'+esc(economyText('title'))+'</summary>'+
 '<p>'+esc(economyText('summary'))+'</p><p>'+esc(economyText('assumptions'))+'</p>'+
 '<p class="economy-horizon-goal"><strong>'+esc(economyText('allFour'))+'</strong> — '+
 esc(economyText('remaining'))+': '+fmt(left.gold)+' '+esc(economyText('gold'))+' · '+
 fmt(left.stone)+' '+esc(economyText('stone'))+' · '+fmt(left.aether)+' '+esc(economyText('aether'))+'</p>'+
 '<div class="economy-horizon-scroll"><table><thead><tr><th>'+esc(economyText('day'))+'</th><th>'+esc(economyText('goal'))+'</th>'+
 '<th>'+esc(economyText('gold'))+'</th><th>'+esc(economyText('stone'))+'</th>'+
 '<th>'+esc(economyText('aether'))+'</th><th>✓</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
 '<small>'+esc(economyText('weekGate'))+' · '+esc(economyText('noStreak'))+'</small>'+
 '<small>'+esc(economyText('notGuaranteed'))+'</small></details>';
}
