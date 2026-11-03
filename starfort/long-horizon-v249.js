/** v2.49: read-only, server-snapshot-derived long-term campaign route.
 * Never authorizes battles, grants resources or writes local progress.
 */
import {getLocale,formatNumber} from './locale-v243.js';
import {chronicleState} from './commander-chronicle.js';
import {isoWeek} from './official-progress-coach.js';
const KEYS=['heading','intro','completed','next','done','story','storyStars','act2','act2Stars',
 'veteran','maze','chronicle','rift','boss','region','tier','wins','needClaim','replay','weekly','noRewards'];
const copy={
tr:['✦ Uzun Sefer Rotası','Hedefler doğrulanmış sunucu ilerlemeni gösterir. Bitmiş bölümleri tekrar oynayarak yıldız ve rütbe kazan.','Tamamlanan kalıcı hedefler','Önerilen sonraki hamle','Tamamlandı','I. Perde · Bölgeler','I. Perde · Yıldızlar','II. Perde · Bölgeler','II. Perde · Yıldızlar','Usta seferi mühürleri','Labirent katları','Komutan kroniği rütbeleri','Bu haftanın Yıldız Yarığı','Bu haftanın dünya patronu','Bölge','Kademe','zafer','Sandığını al','Yeniden sefer','Haftalık etkinlik','Bu panel ek ödül dağıtmaz; oyun ödüllerini yalnızca sunucu verir.'],
en:['✦ Long Expedition Road','Objectives use verified server progress. Replay cleared chapters to improve stars and earn ranks.','Permanent goals completed','Suggested next move','Complete','Act I · Regions','Act I · Stars','Act II · Regions','Act II · Stars','Veteran expedition seals','Labyrinth floors','Commander Chronicle ranks','This week’s Star Rift','This week’s world boss','Region','Tier','wins','Claim your chest','Replay expedition','Weekly activity','This panel grants no extra rewards; only the server grants game rewards.'],
es:['✦ Ruta de expedición larga','Objetivos basados en tu progreso verificado. Repite capítulos para mejorar estrellas y rangos.','Objetivos permanentes completados','Siguiente paso recomendado','Completado','Acto I · Regiones','Acto I · Estrellas','Acto II · Regiones','Acto II · Estrellas','Sellos veteranos','Pisos del laberinto','Rangos de la crónica','Grieta estelar semanal','Jefe mundial semanal','Región','Nivel','victorias','Reclama el cofre','Repetir expedición','Actividad semanal','Este panel no da recompensas extra; solo el servidor las concede.'],
'pt-BR':['✦ Rota de expedição longa','Objetivos baseados no progresso verificado. Repita capítulos para melhorar estrelas e patentes.','Metas permanentes concluídas','Próximo passo sugerido','Concluído','Ato I · Regiões','Ato I · Estrelas','Ato II · Regiões','Ato II · Estrelas','Selos veteranos','Andares do labirinto','Patentes da crônica','Fenda Estelar semanal','Chefe mundial semanal','Região','Nível','vitórias','Resgate o baú','Repetir expedição','Atividade semanal','Este painel não concede recompensas extras; apenas o servidor concede prêmios.'],
fr:['✦ Parcours de longue expédition','Objectifs fondés sur la progression vérifiée. Rejouez les chapitres pour gagner des étoiles et des rangs.','Objectifs permanents terminés','Prochaine étape conseillée','Terminé','Acte I · Régions','Acte I · Étoiles','Acte II · Régions','Acte II · Étoiles','Sceaux vétérans','Étages du labyrinthe','Rangs de la chronique','Faille stellaire de la semaine','Boss mondial de la semaine','Région','Niveau','victoires','Récupérer le coffre','Rejouer l’expédition','Activité hebdomadaire','Ce panneau n’accorde pas de récompense ; seul le serveur en attribue.'],
de:['✦ Langer Expeditionspfad','Ziele aus geprüftem Serverfortschritt. Spiele Kapitel erneut für Sterne und Ränge.','Dauerhafte Ziele abgeschlossen','Empfohlener nächster Schritt','Abgeschlossen','Akt I · Regionen','Akt I · Sterne','Akt II · Regionen','Akt II · Sterne','Veteranen-Siegel','Labyrinth-Etagen','Chronik-Ränge','Sternenspalt dieser Woche','Weltboss dieser Woche','Region','Stufe','Siege','Truhe abholen','Expedition wiederholen','Wöchentliche Aktivität','Diese Übersicht vergibt keine Extras; Belohnungen kommen nur vom Server.'],
it:['✦ Percorso delle spedizioni','Obiettivi dal progresso verificato. Rigioca i capitoli per ottenere stelle e gradi.','Obiettivi permanenti completati','Prossima mossa consigliata','Completato','Atto I · Regioni','Atto I · Stelle','Atto II · Regioni','Atto II · Stelle','Sigilli veterani','Piani del labirinto','Gradi della cronaca','Fenditura Stellare settimanale','Boss mondiale settimanale','Regione','Livello','vittorie','Riscatta il forziere','Rigioca la spedizione','Attività settimanale','Questo pannello non assegna premi extra; solo il server assegna ricompense.'],
ru:['✦ Долгий путь экспедиций','Цели основаны на подтверждённом прогрессе. Повторяйте главы ради звёзд и званий.','Постоянных целей выполнено','Рекомендуемый шаг','Готово','Акт I · Регионы','Акт I · Звёзды','Акт II · Регионы','Акт II · Звёзды','Печати ветерана','Этажи лабиринта','Ранги хроники','Звёздный разлом недели','Мировой босс недели','Регион','Уровень','побед','Забрать сундук','Повторить поход','Еженедельное событие','Этот экран не даёт награды; награды выдаёт только сервер.'],
ar:['✦ طريق الحملات الطويل','تعتمد الأهداف على تقدمك المؤكد من الخادم. أعد الفصول لتحسين النجوم والرتب.','الأهداف الدائمة المكتملة','الخطوة المقترحة التالية','مكتمل','الفصل الأول · المناطق','الفصل الأول · النجوم','الفصل الثاني · المناطق','الفصل الثاني · النجوم','أختام المحارب المخضرم','طوابق المتاهة','رتب سجل القائد','صدع النجوم هذا الأسبوع','زعيم العالم هذا الأسبوع','المنطقة','المستوى','انتصارات','احصل على الصندوق','أعد الحملة','نشاط أسبوعي','لا يمنح هذا العرض مكافآت إضافية؛ الخادم وحده يمنح المكافآت.'],
hi:['✦ लंबा अभियान मार्ग','लक्ष्य सत्यापित सर्वर प्रगति से आते हैं। सितारों और रैंक के लिए अध्याय फिर खेलें।','स्थायी लक्ष्य पूरे','अगला सुझाया कदम','पूरा हुआ','अंक I · क्षेत्र','अंक I · सितारे','अंक II · क्षेत्र','अंक II · सितारे','वयोवृद्ध मुहरें','भूलभुलैया मंज़िलें','कमांडर क्रॉनिकल रैंक','इस हफ्ते की स्टार रिफ्ट','इस हफ्ते का विश्व बॉस','क्षेत्र','स्तर','जीत','संदूक लें','अभियान दोहराएँ','साप्ताहिक गतिविधि','यह पैनल अतिरिक्त पुरस्कार नहीं देता; पुरस्कार केवल सर्वर देता है।'],
id:['✦ Jalur ekspedisi panjang','Target berasal dari progres server terverifikasi. Ulangi bab untuk meraih bintang dan peringkat.','Target permanen selesai','Langkah berikut yang disarankan','Selesai','Babak I · Wilayah','Babak I · Bintang','Babak II · Wilayah','Babak II · Bintang','Segel veteran','Lantai labirin','Peringkat kronik','Celah Bintang minggu ini','Bos dunia minggu ini','Wilayah','Tingkat','kemenangan','Ambil peti','Ulangi ekspedisi','Aktivitas mingguan','Panel ini tidak memberi hadiah tambahan; hanya server yang memberikannya.'],
ja:['✦ 長期遠征ロード','サーバーで確認された進行状況を表示します。章を再挑戦して星と階級を獲得しましょう。','達成済みの恒久目標','次のおすすめ','達成','第1幕 · 地域','第1幕 · 星','第2幕 · 地域','第2幕 · 星','ベテランの印','迷宮の階層','指揮官年代記の階級','今週の星の裂け目','今週のワールドボス','地域','段階','勝利','宝箱を受け取る','遠征を再挑戦','週間イベント','この画面から追加報酬は付与されません。報酬はサーバーのみが付与します。'],
ko:['✦ 장기 원정 여정','서버에서 확인된 진행 상황입니다. 챕터를 재도전해 별과 계급을 얻으세요.','완료한 영구 목표','다음 추천 목표','완료','1막 · 지역','1막 · 별','2막 · 지역','2막 · 별','베테랑 인장','미궁 층','지휘관 연대기 계급','이번 주 별의 균열','이번 주 월드 보스','지역','단계','승리','상자 받기','원정 다시 하기','주간 활동','이 화면은 추가 보상을 제공하지 않습니다. 보상은 서버에서만 지급됩니다.'],
'zh-CN':['✦ 长期远征路线','目标来自服务器验证的进度。重玩章节可提升星级和军衔。','已完成的永久目标','推荐下一步','已完成','第一幕 · 地区','第一幕 · 星级','第二幕 · 地区','第二幕 · 星级','老兵徽章','迷宫层数','指挥官编年史军衔','本周星之裂隙','本周世界首领','地区','等级','胜利','领取宝箱','重玩远征','每周活动','此面板不提供额外奖励；游戏奖励只由服务器发放。']
};
export const LONG_ROAD_TRANSLATIONS=Object.freeze(Object.fromEntries(Object.entries(copy).map(
 ([lang,values])=>[lang,Object.freeze(Object.fromEntries(KEYS.map((key,i)=>[key,values[i]])))]
)));
export const LONG_ROAD_KEYS=Object.freeze(KEYS);
const words=key=>LONG_ROAD_TRANSLATIONS[getLocale()]?.[key]||LONG_ROAD_TRANSLATIONS.en[key];
export const longRoadWord=key=>words(key);
const clamp=(x,max)=>Number.isSafeInteger(x)?Math.max(0,Math.min(max,x)):0;
const starsFor=(stages,stars)=>stages.reduce((n,id)=>n+clamp(stars?.[id],3),0);
const medalsFor=value=>Array.from({length:8},(_,i)=>clamp(value?.[i+1],3)).reduce((a,b)=>a+b,0);
const nextStar=(stages,stars)=>stages.map(id=>({id,stars:clamp(stars?.[id],3)}))
 .filter(x=>x.stars<3).sort((a,b)=>a.stars-b.stars||a.id-b.id)[0]||null;
export function longRoadStatus(account,now=Date.now()){
 if(!account||!Array.isArray(account.cleared)||!Array.isArray(account.act2Cleared))return null;
 const story=clamp(account.cleared.length,8),act2=clamp(account.act2Cleared.length,8);
 const storyStars=starsFor(account.cleared,account.campaignStars);
 const act2Stars=starsFor(account.act2Cleared,account.act2Stars);
 const veteran=medalsFor(account.veteranMedals),maze=clamp(account.mazeFloor,16);
 const chronicle=chronicleState(account);
 const currentWeek=isoWeek(now);
 const rift=account.riftWeek===currentWeek?1:0;
 const boss=account.worldBoss&&account.worldBoss.week===currentWeek&&account.bossWeek===currentWeek?1:0;
 const goals=[
  {id:'story',value:story,max:8},
  {id:'storyStars',value:storyStars,max:24},
  {id:'act2',value:act2,max:8},
  {id:'act2Stars',value:act2Stars,max:24},
  {id:'veteran',value:veteran,max:24},
  {id:'maze',value:maze,max:16},
  {id:'chronicle',value:chronicle.claimed,max:30},
  {id:'rift',value:rift,max:1,weekly:true},
  {id:'boss',value:boss,max:1,weekly:true}
 ];
 let focus;
 if(story<8)focus={id:'story',stage:story+1};
 else if(act2<8)focus={id:'act2',stage:act2+1};
 else if(storyStars<24){
  const target=nextStar(account.cleared,account.campaignStars);
  focus={id:'storyStars',stage:target?.id,stars:target?.stars};
 }else if(act2Stars<24){
  const target=nextStar(account.act2Cleared,account.act2Stars);
  focus={id:'act2Stars',stage:target?.id,stars:target?.stars};
 }
 else if(veteran<24){
  const id=Array.from({length:8},(_,i)=>i+1).find(id=>clamp(account.veteranMedals?.[id],3)<3);
  focus={id:'veteran',stage:id,tier:clamp(account.veteranMedals?.[id],3)+1};
 }else if(maze<16)focus={id:'maze',floor:maze+1};
 else if(chronicle.next)focus={id:'chronicle',wins:clamp(account.counters?.win,1e8),
   target:chronicle.next.wins,claim:chronicle.eligible};
 else if(!rift)focus={id:'rift'};
 else if(!boss)focus={id:'boss'};
 else focus={id:'done'};
 return Object.freeze({goals:Object.freeze(goals.map(g=>Object.freeze(g))),focus,
  permanentCompleted:goals.filter(g=>!g.weekly&&g.value===g.max).length,
  permanentTotal:7,weeklyCompleted:rift+boss,week:currentWeek});
}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function longRoadMarkup(account,now=Date.now()){
 const status=longRoadStatus(account,now);
 if(!status)return '';
 const focus=status.focus;
 let cue=focus.id==='done'?words('done'):words(focus.id);
 if(focus.stage)cue+=' · '+words('region')+' '+formatNumber(focus.stage);
 if(focus.tier)cue+=' · '+words('tier')+' '+formatNumber(focus.tier);
 if(focus.floor)cue+=' · '+formatNumber(focus.floor);
 if(focus.id==='storyStars'||focus.id==='act2Stars')
  cue+=' · '+'★'.repeat(focus.stars)+'☆'.repeat(3-focus.stars)+' → ★★★ · '+words('replay');
 if(focus.id==='chronicle')
  cue+=' · '+formatNumber(focus.wins)+' / '+formatNumber(focus.target)+' '+words('wins')+
   (focus.claim?' · '+words('needClaim'):'');
 if(focus.id==='rift'||focus.id==='boss')cue+=' · '+words('weekly');
 return '<details class="long-road"><summary><span><b>'+esc(words('heading'))+'</b><small>'+
  esc(words('completed'))+': '+formatNumber(status.permanentCompleted)+' / '+status.permanentTotal+
  '</small></span><span class="long-road-arrow" aria-hidden="true">⌄</span></summary>'+
  '<div class="long-road-body"><p>'+esc(words('intro'))+'</p>'+
  '<div class="long-road-focus"><span>'+esc(words('next'))+'</span><strong>'+esc(cue)+'</strong></div>'+
  '<div class="long-road-goals">'+status.goals.map(goal=>
   '<article class="long-road-goal '+(goal.value===goal.max?'complete':'')+'"><div><strong>'+
    esc(words(goal.id))+'</strong><span>'+formatNumber(goal.value)+' / '+formatNumber(goal.max)+'</span></div>'+
    '<progress max="'+goal.max+'" value="'+goal.value+'" aria-label="'+esc(words(goal.id))+'"></progress></article>'
  ).join('')+'</div><small class="long-road-note">'+esc(words('noRewards'))+'</small></div></details>';
}
export function auditLongRoadLanguages(locales){
 return locales.flatMap(lang=>KEYS.filter(key=>typeof LONG_ROAD_TRANSLATIONS[lang]?.[key]!=='string'||
  !LONG_ROAD_TRANSLATIONS[lang][key].trim()).map(key=>lang+'.'+key));
}
