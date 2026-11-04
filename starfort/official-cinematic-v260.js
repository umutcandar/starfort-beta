/** STARFORT beta.14: readable fantasy combat theatre for verified account battles.
 * Wartune-style presentation language, NOT its art, names or rules.
 * Display only: canonical server mission/turn/HP and the same permitted skill IDs.
 */
import {HEROES} from './rules.js';
import {getLocale} from './locale-v243.js';
import {warText} from './official-warroom-v258.js';

const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct=(a,b)=>Math.round(Math.min(100,Math.max(0,100*Number(a||0)/Math.max(1,Number(b)||1))));
const native={
tr:['KAHRAMANLAR','DÜŞMAN HATTI','SAVAŞ SAHNESİ','KAHRAMAN GÜCÜ','SİPER','KANAT HÜCUMU','ŞİFA DALGASI','ÖZEL YETENEK','SAVAŞ EMRİ','Darbe doğrulandı','Düşman dalgası','Bir sonraki hamleyi seç','Düşman hazırlanıyor','ZAFER İÇİN SAVAŞ','Savaşın sonuçları sunucuda hesaplanır'],
en:['HEROES','ENEMY LINE','BATTLEFIELD','HERO POWER','SHIELD WALL','FLANK ATTACK','HEALING WAVE','HERO ABILITY','BATTLE ORDER','Hit confirmed','Enemy wave','Choose your next move','Enemy is preparing','FIGHT FOR VICTORY','Battle results are calculated by the server'],
es:['HÉROES','LÍNEA ENEMIGA','CAMPO DE BATALLA','PODER HEROICO','MURO DE ESCUDOS','ATAQUE DE FLANCO','OLA DE CURACIÓN','HABILIDAD HEROICA','ORDEN DE COMBATE','Golpe confirmado','Oleada enemiga','Elige tu próxima acción','El enemigo se prepara','LUCHA POR LA VICTORIA','El servidor calcula los resultados'],
'pt-BR':['HERÓIS','LINHA INIMIGA','CAMPO DE BATALHA','PODER HEROICO','PAREDE DE ESCUDOS','ATAQUE DE FLANCO','ONDA DE CURA','HABILIDADE HEROICA','ORDEM DE BATALHA','Golpe confirmado','Onda inimiga','Escolha sua ação','O inimigo se prepara','LUTE PELA VITÓRIA','O servidor calcula os resultados'],
fr:['HÉROS','LIGNE ENNEMIE','CHAMP DE BATAILLE','POUVOIR HÉROÏQUE','MUR DE BOUCLIERS','ATTAQUE DE FLANC','VAGUE DE SOINS','CAPACITÉ HÉROÏQUE','ORDRE DE BATAILLE','Coup confirmé','Vague ennemie','Choisissez votre action','Ennemi en préparation','COMBATTEZ POUR GAGNER','Le serveur calcule les résultats'],
de:['HELDEN','FEINDLINIE','SCHLACHTFELD','HELDENKRAFT','SCHILDWALL','FLANKENANGRIFF','HEILWELLE','HELDENFÄHIGKEIT','SCHLACHTBEFEHL','Treffer bestätigt','Feindwelle','Nächsten Zug wählen','Feind bereitet sich vor','KÄMPFE UM DEN SIEG','Der Server berechnet alle Ergebnisse'],
it:['EROI','LINEA NEMICA','CAMPO DI BATTAGLIA','POTERE EROICO','MURO DI SCUDI','ATTACCO AI FIANCHI','ONDA CURATIVA','ABILITÀ EROICA','ORDINE DI BATTAGLIA','Colpo confermato','Ondata nemica','Scegli la prossima mossa','Il nemico si prepara','COMBATTI PER VINCERE','I risultati sono calcolati dal server'],
ru:['ГЕРОИ','ВРАЖЕСКИЙ РЯД','ПОЛЕ БОЯ','СИЛА ГЕРОЯ','СТЕНА ЩИТОВ','ФЛАНГОВЫЙ УДАР','ВОЛНА ИСЦЕЛЕНИЯ','УМЕНИЕ ГЕРОЯ','БОЕВОЙ ПРИКАЗ','Удар подтверждён','Волна врагов','Выберите следующий ход','Враг готовится','СРАЖАЙСЯ ЗА ПОБЕДУ','Результаты рассчитывает сервер'],
ar:['الأبطال','خط العدو','ساحة المعركة','قوة البطل','جدار الدروع','هجوم جانبي','موجة الشفاء','مهارة البطل','أمر قتالي','تم تأكيد الضربة','موجة العدو','اختر حركتك التالية','العدو يستعد','قاتل من أجل النصر','الخادم يحسب نتائج المعركة'],
hi:['नायक','शत्रु पंक्ति','युद्धक्षेत्र','नायक शक्ति','ढाल की दीवार','पार्श्व हमला','उपचार तरंग','नायक क्षमता','युद्ध आदेश','वार सत्यापित','शत्रु लहर','अगली चाल चुनें','शत्रु तैयारी में है','जीत के लिए लड़ें','परिणाम सर्वर तय करता है'],
id:['PAHLAWAN','BARISAN MUSUH','MEDAN TEMPUR','KEKUATAN PAHLAWAN','DINDING PERISAI','SERANGAN SAYAP','GELOMBANG PENYEMBUHAN','KEMAMPUAN PAHLAWAN','PERINTAH TEMPUR','Serangan terverifikasi','Gelombang musuh','Pilih aksi berikutnya','Musuh bersiap','BERTARUNG UNTUK MENANG','Server menghitung hasil pertempuran'],
ja:['英雄','敵陣','戦場','英雄の力','盾の壁','側面攻撃','回復の波','英雄スキル','戦闘命令','攻撃確認','敵の波','次の行動を選択','敵が準備中','勝利のために戦え','戦闘結果はサーバーが計算します'],
ko:['영웅','적 진영','전장','영웅의 힘','방패 진형','측면 공격','치유의 파동','영웅 기술','전투 명령','타격 확인','적의 공세','다음 행동 선택','적이 준비 중','승리를 위해 싸워라','전투 결과는 서버가 계산합니다'],
'zh-CN':['英雄','敌方阵线','战场','英雄之力','盾墙','侧翼攻击','治疗波','英雄技能','作战命令','攻击已确认','敌方波次','选择下一步','敌人正在准备','为胜利而战','战斗结果由服务器结算']
};
export const CINEMATIC_LANGS=Object.freeze(Object.keys(native));
export const CINEMATIC_KEYS=Object.freeze(['heroes','enemy','field','power','guard','flank','rally','skill','order','hit','wave','next','preparing','victory','server']);
export function cinematicText(key,language=getLocale()){
 const index=CINEMATIC_KEYS.indexOf(key);return index<0?'':(native[language]||native.en)[index]||native.en[index];
}
function safeRoster(team){
 return (Array.isArray(team)?team:[]).filter(id=>typeof id==='string'&&HEROES.some(hero=>hero.id===id)).slice(0,3);
}
export function officialSkillSpotlight(mission,delta,team,language=getLocale()){
 if(!mission||!delta||delta.initial||!Number.isSafeInteger(delta.turn)||delta.turn!==mission.turn)return null;
 if(![delta.damage,delta.received,delta.healed].every(n=>Number.isSafeInteger(n)&&n>=0&&n<=1e6))return null;
 if(!delta.damage&&!delta.received&&!delta.healed)return null;
 const action=String(delta.action||mission.lastAction||'');
 const id=action.startsWith('skill:')?action.slice(6):null;
 const selected=safeRoster(team).includes(id)?HEROES.find(hero=>hero.id===id):null;
 const kind=selected?'skill':action==='guard'?'guard':action==='feint'?'flank':action==='rally'?'rally':'order';
 const label=selected?.name||cinematicText(kind,language);
 const description=selected?.skill||warText(kind==='guard'?'lessDamage':kind==='flank'?'pierce':kind==='rally'?'restore':'baseDamage',language);
 return Object.freeze({kind,heroId:selected?.id||null,label,description,damage:delta.damage,received:delta.received,healed:delta.healed});
}
export function cinematicCombatMarkup(mission,team,delta=null,language=getLocale()){
 if(!mission)return '';
 const t=key=>cinematicText(key,language),roster=safeRoster(team);
 const HP=Number(mission.playerHp)||0,MAX=Number(mission.playerMaxHp)||1;
 const EHP=Number(mission.enemyHp)||0,EMAX=Number(mission.enemyMaxHp)||1;
 const moment=officialSkillSpotlight(mission,delta,roster,language);
 const portraits=roster.map((id,i)=>{
  const h=HEROES.find(x=>x.id===id);
  return '<span class="sf-cinematic-hero" aria-label="'+esc(h.name)+'"><img src="assets/'+id+'.webp" loading="lazy" alt=""><b>'+esc(h.name)+'</b></span>';
 }).join('');
 const state=mission.enemyIntent||'strike';
 const wave=Number.isInteger(mission.wave)?mission.wave:1,total=Number.isInteger(mission.waves)?mission.waves:1;
 return '<div class="sf-cinematic-hud" aria-label="'+esc(t('field'))+'">'+
  '<div class="sf-cinematic-hud-top"><div class="sf-cinematic-side"><small>'+esc(t('heroes'))+'</small><strong>'+HP+' / '+MAX+'</strong>'+
  '<div class="sf-cinematic-meter" role="meter" aria-label="'+esc(t('heroes'))+'" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+pct(HP,MAX)+'"><i style="width:'+pct(HP,MAX)+'%"></i></div></div>'+
  '<span class="sf-cinematic-round">'+esc(t('wave'))+' '+wave+' / '+total+'</span>'+
  '<div class="sf-cinematic-side enemy"><small>'+esc(t('enemy'))+'</small><strong>'+EHP+' / '+EMAX+'</strong>'+
  '<div class="sf-cinematic-meter" role="meter" aria-label="'+esc(t('enemy'))+'" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+pct(EHP,EMAX)+'"><i style="width:'+pct(EHP,EMAX)+'%"></i></div></div></div>'+
  '<div class="sf-cinematic-portraits">'+portraits+'</div>'+
  '<div class="sf-cinematic-tell" aria-live="off"><span>◇ '+esc(t('preparing'))+'</span><strong>'+esc(state==='crush'?warText('guard',language):state==='shield'?warText('feint',language):state==='sunder'?warText('pierce',language):state==='drain'?warText('strike',language):warText('strike',language))+'</strong></div>'+
  (moment?.kind==='skill'?'<div class="sf-cinematic-moment kind-'+moment.kind+(moment.heroId?' hero-'+moment.heroId:'')+'" role="status">'+
    (moment.heroId?'<img src="assets/'+moment.heroId+'.webp" loading="lazy" alt="">':'<span class="sf-cinematic-emblem" aria-hidden="true">✦</span>')+
    '<div><small>'+esc(t(moment.kind==='skill'?'skill':moment.kind==='guard'?'guard':moment.kind==='flank'?'flank':moment.kind==='rally'?'rally':'order'))+'</small>'+
    '<strong>'+esc(moment.label)+'</strong><span class="sf-cinematic-result">'+
    (moment.damage?'<b>⚔ −'+moment.damage+'</b>':'')+(moment.received?'<b>☄ −'+moment.received+'</b>':'')+
    (moment.healed?'<b>✚ +'+moment.healed+'</b>':'')+'</span></div></div>':'')+
  '</div>';
}
