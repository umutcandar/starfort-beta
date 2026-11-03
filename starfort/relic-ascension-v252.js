/** STARFORT v2.52 — 14-week server-backed relic ascension.
 * A read-only local preview. All eligibility, weekly wins, costs, payouts and
 * permanent power are resolved inside authenticated Supabase PostgreSQL.
 * No daily-login streak; existing saves and unascended items remain valid.
 */
import {getLocale,formatNumber} from './locale-v243.js';
import {economyHorizonMarkup} from './economy-horizon-v253.js';
export const ASCENSION_ITEMS=Object.freeze(['ember_guard','star_spear','guardian_seal','starbreaker']);
export const ASCENSION_WEEKS=Object.freeze([2,5,9,14]);
export const ASCENSION_MAX_RANK=4;
export const ASCENSION_POWER_PER_RANK=14;
const KEYS=['title','intro','rank','weeklyVictories','required','power','bonus','nextCost',
 'forge','needGear','needMastery','needWeeks','needResources','battleBlocked','complete','earned',
 'allCopies','serverOnly'];
const rows={
tr:['✦ Yıldız İşleme','Dört kalıcı rütbe, farklı haftalarda kazanılmış dünya patronu zaferleriyle açılır. Giriş serisi gerekmez.','Rütbe','Doğrulanmış patron haftaları','Gerekli','Güç','Savaş gücü bonusu','Sonraki maliyet','Yıldız işlemesini başlat','Önce bu ekipmanı kazan','Önce +5 eşya ustalığını tamamla','Yeni haftalarda patronu yen','Daha fazla kaynak biriktir','Devam eden savaşı bitir','Maksimum işleme tamamlandı','Kalıcı ustalık','Aynı türün tüm kopyalarında geçerli','Yalnızca sunucudaki doğrulanmış zaferler sayılır.'],
en:['✦ Star Ascension','Four permanent ranks unlock through world-boss victories in distinct weeks. No login streak required.','Rank','Verified boss weeks','Required','Power','Combat power bonus','Next cost','Ascend this relic','Obtain this equipment first','Complete gear mastery +5 first','Defeat bosses in additional weeks','Gather more resources','Finish your current battle','Maximum ascension reached','Permanent mastery','Applies to all copies of this equipment type','Only server-verified victories count.'],
es:['✦ Ascensión estelar','Cuatro rangos permanentes por victorias contra el jefe en semanas distintas. Sin racha de inicio de sesión.','Rango','Semanas de jefe verificadas','Necesarias','Poder','Bonificación de combate','Próximo coste','Ascender el equipo','Consigue este equipo primero','Completa la maestría +5','Derrota jefes en más semanas','Reúne más recursos','Termina el combate actual','Ascensión máxima alcanzada','Maestría permanente','Se aplica a todas las copias de este equipo','Solo cuentan las victorias verificadas por el servidor.'],
'pt-BR':['✦ Ascensão estelar','Quatro patentes permanentes por vitórias no chefe em semanas diferentes. Não exige sequência de login.','Patente','Semanas de chefe verificadas','Necessárias','Poder','Bônus de combate','Próximo custo','Ascender equipamento','Conquiste este equipamento primeiro','Conclua a maestria +5','Vença chefes em outras semanas','Junte mais recursos','Termine o combate atual','Ascensão máxima alcançada','Maestria permanente','Vale para todas as cópias deste equipamento','Apenas vitórias verificadas pelo servidor contam.'],
fr:['✦ Ascension stellaire','Quatre rangs permanents via des victoires contre le boss sur des semaines différentes. Aucune connexion consécutive requise.','Rang','Semaines de boss vérifiées','Requises','Puissance','Bonus de puissance','Prochain coût','Améliorer la relique','Obtenez cet équipement','Terminez d’abord la maîtrise +5','Battez le boss lors de nouvelles semaines','Rassemblez plus de ressources','Terminez votre combat','Ascension maximale atteinte','Maîtrise permanente','S’applique à toutes les copies de cet équipement','Seules les victoires vérifiées par le serveur comptent.'],
de:['✦ Sternenaufstieg','Vier dauerhafte Ränge durch Weltboss-Siege in verschiedenen Wochen. Keine tägliche Login-Serie nötig.','Rang','Bestätigte Bosswochen','Benötigt','Stärke','Kampfkraftbonus','Nächste Kosten','Ausrüstung aufsteigen','Besorge zuerst diese Ausrüstung','Schließe zuerst +5 Meisterschaft ab','Besiege Bosse in weiteren Wochen','Sammle weitere Ressourcen','Beende zuerst den Kampf','Maximaler Aufstieg erreicht','Dauerhafte Meisterschaft','Gilt für alle Kopien dieses Ausrüstungstyps','Nur serverbestätigte Siege zählen.'],
it:['✦ Ascensione stellare','Quattro gradi permanenti da vittorie sul boss in settimane diverse. Nessuna serie di accessi richiesta.','Grado','Settimane del boss verificate','Richieste','Potenza','Bonus potenza in battaglia','Costo successivo','Ascendi equipaggiamento','Ottieni prima questo equipaggiamento','Completa prima la maestria +5','Sconfiggi il boss in altre settimane','Raccogli altre risorse','Concludi il combattimento','Ascensione massima raggiunta','Maestria permanente','Vale per tutte le copie di questo equipaggiamento','Contano solo le vittorie verificate dal server.'],
ru:['✦ Звёздное возвышение','Четыре постоянных ранга за победы над мировым боссом в разные недели. Серия входов не нужна.','Ранг','Подтверждённых недель босса','Требуется','Сила','Бонус боевой мощи','Следующая стоимость','Возвысить предмет','Сначала получи предмет','Заверши мастерство +5','Победи босса в другие недели','Накопи ресурсы','Заверши текущий бой','Максимальный ранг достигнут','Постоянное мастерство','Действует на все копии этого типа предмета','Учитываются только победы, подтверждённые сервером.'],
ar:['✦ الارتقاء النجمي','أربع رتب دائمة بفوزك على زعيم العالم في أسابيع مختلفة. لا تتطلب سلسلة دخول يومية.','الرتبة','أسابيع الزعيم المؤكدة','المطلوب','القوة','مكافأة قوة القتال','التكلفة التالية','ترقية العتاد','احصل على العتاد أولاً','أكمل إتقان العتاد +5 أولاً','اهزم الزعيم في أسابيع إضافية','اجمع المزيد من الموارد','أنهِ معركتك الحالية','اكتمل أعلى ارتقاء','إتقان دائم','يسري على كل نسخ هذا العتاد','لا تُحتسب إلا الانتصارات المؤكدة من الخادم.'],
hi:['✦ तारकीय आरोहण','अलग-अलग हफ्तों में विश्व बॉस को हराकर चार स्थायी रैंक खोलें। लगातार लॉगिन जरूरी नहीं।','रैंक','सत्यापित बॉस हफ्ते','जरूरत','शक्ति','युद्ध शक्ति बोनस','अगली लागत','उपकरण आरोहण','पहले यह उपकरण पाएँ','पहले +5 महारत पूरी करें','आने वाले हफ्तों में बॉस हराएँ','और संसाधन जुटाएँ','वर्तमान युद्ध पूरा करें','अधिकतम आरोहण पूरा','स्थायी महारत','इस उपकरण की सभी प्रतियों पर लागू','केवल सर्वर द्वारा सत्यापित जीत गिनी जाती है।'],
id:['✦ Kenaikan Bintang','Empat peringkat permanen dibuka lewat kemenangan bos pada minggu berbeda. Tanpa kewajiban login beruntun.','Peringkat','Minggu bos terverifikasi','Diperlukan','Kekuatan','Bonus kekuatan tempur','Biaya berikutnya','Naikkan perlengkapan','Dapatkan perlengkapan ini dulu','Selesaikan penguasaan +5 dahulu','Kalahkan bos di minggu lain','Kumpulkan lebih banyak sumber daya','Selesaikan pertarungan saat ini','Kenaikan maksimal tercapai','Penguasaan permanen','Berlaku untuk semua salinan perlengkapan ini','Hanya kemenangan yang diverifikasi server dihitung.'],
ja:['✦ 星の昇華','異なる週のワールドボス勝利で永続ランクを4段階解放。連続ログインは不要です。','ランク','認証済みボス勝利週','必要','戦力','戦闘力ボーナス','次の費用','装備を昇華','まず装備を獲得','先に装備熟練+5を達成','別の週にもボスを倒そう','資源をさらに集めよう','進行中の戦闘を終了','最大ランク達成','永続熟練','同じ装備の全コピーに適用','サーバーが確認した勝利のみ有効です。'],
ko:['✦ 별 승급','서로 다른 주의 월드 보스 승리로 영구 등급 4개를 엽니다. 연속 로그인은 필요 없습니다.','등급','확인된 보스 승리 주','필요','전투력','전투력 보너스','다음 비용','장비 승급','먼저 장비를 획득하세요','장비 숙련 +5를 먼저 달성하세요','다른 주에도 보스를 처치하세요','자원을 더 모으세요','진행 중인 전투를 끝내세요','최고 승급 완료','영구 숙련','같은 장비의 모든 복제본에 적용','서버에서 확인된 승리만 계산됩니다.'],
'zh-CN':['✦ 星辰升华','在不同周击败世界首领可解锁四级永久升华，无需连续登录。','等级','已验证首领胜利周数','需要','战力','战斗力加成','下一级费用','升华装备','请先获得这件装备','请先完成装备精通+5','在更多周击败首领','积累更多资源','先结束当前战斗','已达到最高升华','永久精通','作用于该装备的所有副本','仅服务器验证的胜利有效。']
};
export const ASCENSION_KEYS=Object.freeze(KEYS);
export const ASCENSION_TRANSLATIONS=Object.freeze(Object.fromEntries(Object.entries(rows).map(
 ([lang,values])=>[lang,Object.freeze(Object.fromEntries(KEYS.map((key,i)=>[key,values[i]])))])));
export const ascensionText=key=>ASCENSION_TRANSLATIONS[getLocale()]?.[key]||ASCENSION_TRANSLATIONS.en[key]||'';
export function auditAscensionLanguages(locales){
 return locales.flatMap(lang=>KEYS.filter(key=>typeof ASCENSION_TRANSLATIONS[lang]?.[key]!=='string'||
 !ASCENSION_TRANSLATIONS[lang][key].trim()).map(key=>lang+'.'+key));
}
export function ascensionCost(rank){
 if(!Number.isInteger(rank)||rank<1||rank>4)return null;
 return Object.freeze({gold:1400*rank*rank,stone:420*rank,aether:100*rank*rank});
}
export function ascensionStatus(state,itemId){
 if(!ASCENSION_ITEMS.includes(itemId)||!state?.serverVillage)return null;
 const level=state.relicAscensions?.[itemId]||0;
 const weeks=Number.isSafeInteger(state.bossSeals)&&state.bossSeals>=0?state.bossSeals:0;
 const owned=(state.inventory?.[itemId]||0)>0,mastery=(state.itemUpgrades?.[itemId]||0)>=5;
 const next=level<ASCENSION_MAX_RANK?level+1:null,cost=next?ascensionCost(next):null;
 const canPay=!!cost&&Object.entries(cost).every(([key,amount])=>(state.res?.[key]||0)>=amount);
 const busy=!!(state.serverMission||state.serverShadowBattle||state.battle?.status==='active');
 const reason=next===null?'complete':!owned?'needGear':!mastery?'needMastery':
   weeks<ASCENSION_WEEKS[next-1]?'needWeeks':busy?'battleBlocked':!canPay?'needResources':null;
 return Object.freeze({itemId,level,weeks,required:next?ASCENSION_WEEKS[next-1]:14,
  next,cost,owned,mastery,power:level*ASCENSION_POWER_PER_RANK,
  canAscend:reason===null,reason});
}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function ascensionMarkup(state,itemId,displayResource=(x=>x)){
 const status=ascensionStatus(state,itemId);if(!status)return '';
 const f=x=>formatNumber(x);
 const cost=status.cost?Object.entries(status.cost).map(([id,amount])=>f(amount)+' '+esc(displayResource(id))).join(' · '):'';
 return '<section class="relic-ascension" aria-label="'+esc(ascensionText('title'))+'">'+
  '<div class="relic-ascension-head"><strong>'+esc(ascensionText('title'))+'</strong>'+
  '<span>'+esc(ascensionText('rank'))+' '+status.level+' / 4</span></div>'+
  '<p>'+esc(ascensionText('intro'))+'</p>'+
  '<progress value="'+status.level+'" max="4" aria-label="'+esc(ascensionText('rank'))+'"></progress>'+
  '<div class="relic-ascension-facts"><span>✦ '+esc(ascensionText('weeklyVictories'))+
   ': <b>'+f(status.weeks)+' / '+f(status.required)+'</b></span>'+
  '<span>⚔ '+esc(ascensionText('bonus'))+': <b>+'+f(status.power)+'</b></span></div>'+
  (cost?'<small>'+esc(ascensionText('nextCost'))+': '+cost+'</small>':'')+
  '<button class="secondary" data-account-ascend="'+esc(itemId)+'"'+(status.canAscend?'':' disabled')+'>'+
    esc(status.next===null?ascensionText('complete'):ascensionText('forge')+' · '+status.next+'/4')+'</button>'+
  (status.reason&&status.reason!=='complete'?'<small class="relic-ascension-blocked">'+esc(ascensionText(status.reason))+'</small>':'')+
  '<small>'+esc(ascensionText('allCopies'))+' · '+esc(ascensionText('serverOnly'))+'</small></section>'+economyHorizonMarkup(state);
}
