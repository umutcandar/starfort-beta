/** STARFORT beta.12 — truthful, server-action compatible tactical war room.
 * Only displays verified account snapshots. This module NEVER resolves damage,
 * sends extra moves, persists rewards, or gives heroes individual fake HP.
 */
import {HEROES} from './rules.js';
import {getLocale} from './locale-v243.js';

export const WAR_LOCALES=Object.freeze(['tr','en','es','pt-BR','fr','de','it','ru','ar','hi','id','ja','ko','zh-CN']);
const WORDS={
tr:['MUHAREBE KOMUTASI','Birliklerine emir ver. Her komut sunucuda çözülür.','İleri hücum','Kalkan duvarı','Kanat saldırısı','Sıhhî destek','ÖNERİLEN','KAHRAMAN HAMLELERİ','Hazır','Bekleme','tur','Doğrulanmış son çarpışma','Verilen hasar','Alınan hasar','İyileşme','Geri çekil','Düşmanın hazırlığına göre komut seç.','Temel hasar','Gelen darbeyi azalt','Kalkanı yar','Can yenile','Güç','Seviye','Kalkan','Şimdi kullan','Her kahramanın özel hamlesi farklıdır.'],
en:['BATTLE COMMAND','Lead your squad. Every order is resolved by the server.','Advance and strike','Shield wall','Flanking attack','Field recovery','RECOMMENDED','HERO ACTIONS','Ready','Cooldown','turns','Last verified clash','Damage dealt','Damage taken','Healing','Retreat','Counter the enemy’s announced move.','Base damage','Reduce incoming damage','Break shields','Restore health','Power','Level','Shield','Use now','Every hero has a distinct battle ability.'],
es:['MANDO DE BATALLA','Dirige tu escuadrón. El servidor resuelve cada orden.','Carga frontal','Muro de escudos','Ataque de flanco','Auxilio de campaña','RECOMENDADO','HABILIDADES DE HÉROE','Listo','Recarga','turnos','Último choque verificado','Daño causado','Daño recibido','Curación','Retirada','Responde al próximo ataque enemigo.','Daño base','Reduce el daño','Rompe escudos','Recupera salud','Poder','Nivel','Escudo','Usar ahora','Cada héroe tiene una habilidad distinta.'],
'pt-BR':['COMANDO DE BATALHA','Lidere o esquadrão. O servidor resolve cada ordem.','Avanço frontal','Parede de escudos','Ataque pelo flanco','Apoio de campo','RECOMENDADO','HABILIDADES DOS HERÓIS','Pronto','Recarga','turnos','Último confronto verificado','Dano causado','Dano recebido','Cura','Recuar','Reaja à próxima ação inimiga.','Dano base','Reduz o dano','Rompe escudos','Recupera vida','Poder','Nível','Escudo','Usar agora','Cada herói possui uma habilidade diferente.'],
fr:['COMMANDEMENT','Dirigez l’escouade. Le serveur résout chaque ordre.','Charge frontale','Mur de boucliers','Attaque de flanc','Soins de campagne','CONSEILLÉ','CAPACITÉS DES HÉROS','Prêt','Recharge','tours','Dernier affrontement vérifié','Dégâts infligés','Dégâts reçus','Soins','Retraite','Répondez à l’attaque annoncée.','Dégâts de base','Réduit les dégâts','Brise les boucliers','Rend des PV','Puissance','Niveau','Bouclier','Utiliser','Chaque héros possède un pouvoir distinct.'],
de:['SCHLACHTBEFEHL','Führe deinen Trupp. Jeder Befehl wird vom Server berechnet.','Frontalangriff','Schildwall','Flankenangriff','Feldversorgung','EMPFOHLEN','HELDENFÄHIGKEITEN','Bereit','Abklingzeit','Runden','Letzter bestätigter Schlagabtausch','Verursachter Schaden','Erlittener Schaden','Heilung','Rückzug','Kontere den angekündigten Angriff.','Grundschaden','Reduziert Schaden','Durchbricht Schilde','Heilt Leben','Kraft','Stufe','Schild','Jetzt nutzen','Jeder Held besitzt eine eigene Fähigkeit.'],
it:['COMANDO DI BATTAGLIA','Guida la squadra. Il server risolve ogni ordine.','Carica frontale','Muro di scudi','Attacco ai fianchi','Cure sul campo','CONSIGLIATO','ABILITÀ DEGLI EROI','Pronto','Ricarica','turni','Ultimo scontro verificato','Danni inflitti','Danni subiti','Cure','Ritirata','Contrasta l’attacco annunciato.','Danno base','Riduce i danni','Supera gli scudi','Recupera salute','Potenza','Livello','Scudo','Usa ora','Ogni eroe ha un potere diverso.'],
ru:['БОЕВОЕ КОМАНДОВАНИЕ','Управляйте отрядом. Каждый приказ проверяет сервер.','Лобовая атака','Стена щитов','Фланговый удар','Полевая помощь','СОВЕТ','УМЕНИЯ ГЕРОЕВ','Готово','Перезарядка','ход.','Последний подтверждённый бой','Нанесённый урон','Полученный урон','Лечение','Отступить','Учитывайте следующий удар врага.','Базовый урон','Снижает урон','Пробивает щит','Восстанавливает здоровье','Сила','Уровень','Щит','Применить','У каждого героя своё умение.'],
ar:['قيادة المعركة','قد فرقتك. الخادم يحسم نتيجة كل أمر.','هجوم مباشر','جدار الدروع','هجوم جانبي','إسعاف ميداني','مُوصى به','قدرات الأبطال','جاهز','إعادة الشحن','أدوار','آخر اشتباك موثق','الضرر المُحدث','الضرر المتلقى','الشفاء','انسحاب','واجه حركة العدو المُعلنة.','ضرر أساسي','تقليل الضرر','اختراق الدروع','استعادة الصحة','القوة','المستوى','الدرع','استخدم الآن','لكل بطل قدرة قتالية مختلفة.'],
hi:['युद्ध कमान','अपनी टुकड़ी चलाएँ। हर आदेश सर्वर तय करता है।','सीधा हमला','ढाल की दीवार','किनारे से हमला','मैदानी उपचार','सुझाया गया','नायक क्षमताएँ','तैयार','शीतकाल','चालें','पिछली सत्यापित झड़प','दिया गया नुकसान','लिया गया नुकसान','उपचार','पीछे हटें','दुश्मन की अगली चाल का जवाब दें।','मूल नुकसान','नुकसान घटाएँ','ढाल तोड़ें','स्वास्थ्य बढ़ाएँ','शक्ति','स्तर','ढाल','अभी चलाएँ','हर नायक की अलग क्षमता है।'],
id:['KOMANDO PERTEMPURAN','Pimpin pasukanmu. Server menghitung setiap perintah.','Serangan depan','Dinding perisai','Serangan sayap','Pertolongan medan','DISARANKAN','KEMAMPUAN PAHLAWAN','Siap','Pemulihan','giliran','Bentrok terverifikasi terakhir','Kerusakan diberikan','Kerusakan diterima','Pemulihan HP','Mundur','Hadapi aksi musuh berikutnya.','Kerusakan dasar','Kurangi serangan','Tembus perisai','Pulihkan HP','Daya','Level','Perisai','Gunakan','Setiap pahlawan memiliki kemampuan berbeda.'],
ja:['戦闘指揮','部隊に命令。結果はすべてサーバーで確定します。','正面突撃','盾の陣形','側面攻撃','野戦回復','推奨','英雄スキル','使用可能','再使用まで','ターン','確認済みの直近の戦闘','与えたダメージ','受けたダメージ','回復量','撤退','敵の予告行動に対応しよう。','基本ダメージ','被ダメージ減少','盾を突破','体力回復','戦力','レベル','盾','今使う','英雄ごとに異なるスキルがあります。'],
ko:['전투 지휘','부대에 명령하세요. 결과는 서버에서 판정합니다.','정면 돌격','방패 진형','측면 공격','야전 회복','추천','영웅 기술','준비 완료','재사용 대기','턴','검증된 최근 교전','가한 피해','받은 피해','회복량','후퇴','적이 예고한 행동에 대응하세요.','기본 피해','받는 피해 감소','방패 관통','체력 회복','전투력','레벨','방패','지금 사용','영웅마다 고유한 전투 기술이 있습니다.'],
'zh-CN':['战斗指挥','指挥队伍。所有指令均由服务器结算。','正面冲锋','盾墙防御','侧翼突袭','战场救护','推荐','英雄技能','就绪','冷却','回合','最近一次已验证交锋','造成伤害','受到伤害','治疗量','撤退','针对敌人预告的招式行动。','基础伤害','减少伤害','破除护盾','恢复生命','战力','等级','护盾','立即使用','每位英雄都有独特的战斗技能。']
};
export const WAR_TEXT_KEYS=Object.freeze(['heading','intro','strike','guard','feint','rally','recommended','heroSkills','ready','cooldown','turns','verified','damage','received','healed','retreat','tip','baseDamage','lessDamage','pierce','restore','power','level','shield','use','skillIntro']);
export function warText(key,locale=getLocale()){
 const index=WAR_TEXT_KEYS.indexOf(key);
 return index<0?'':(WORDS[locale]||WORDS.en)[index]||WORDS.en[index];
}
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeInt=value=>Number.isSafeInteger(value)&&value>=0?value:0;
const SKILLS=Object.freeze({
 aldren:{icon:'🛡',effect:'×0.82 ⚔ · −62% 🛡',strength:0.82},
 lyra:{icon:'✦',effect:'×1.75 ⚔',strength:1.75},
 rovan:{icon:'🏹',effect:'×1.55 ⚔ · <50% HP: ×1.25',strength:1.55},
 mira:{icon:'☽',effect:'×0.85 ⚔ · +42 + 6 × Lv HP',strength:.85},
 doran:{icon:'⚔',effect:'×1.80 ⚔',strength:1.8},
 vesper:{icon:'☠',effect:'×1.93 ⚔ · <35% HP: ×1.40',strength:1.93},
 eira:{icon:'❄',effect:'×1.35 ⚔ · −45% 🛡 · +18 + 3 × Lv HP',strength:1.35}
});
export const verifiedSkillSpec=id=>SKILLS[id]||null;
export function warSkillCooldown(mission,id){
 return Math.max(0,safeInt(mission?.cooldowns?.[id])-safeInt(mission?.turn)-1);
}
export function warRallyCooldown(mission){
 const used=safeInt(mission?.lastRallyTurn),next=safeInt(mission?.turn)+1;
 return used?Math.max(0,4-(next-used)):0;
}
export function warAdvice(mission,team){
 if(!mission)return null;
 const ids=(Array.isArray(team)?team:[]).filter(id=>SKILLS[id]&&HEROES.some(hero=>hero.id===id));
 const active=ids.filter(id=>warSkillCooldown(mission,id)===0);
 const best=active.slice().sort((a,b)=>SKILLS[b].strength-SKILLS[a].strength)[0];
 const hp=safeInt(mission.playerHp)/Math.max(1,safeInt(mission.playerMaxHp));
 const intent=mission.enemyIntent||'strike';
 if(intent==='crush')return 'guard';
 if(intent==='sunder')return 'feint';
 if(intent==='eclipse')return hp<.6&&!warRallyCooldown(mission)?'rally':'guard';
 if(intent==='shield')return best&&SKILLS[best].strength>1.1?'skill:'+best:'feint';
 if(hp<.48&&!warRallyCooldown(mission))return 'rally';
 if(intent==='drain')return best&&SKILLS[best].strength>1.2?'skill:'+best:'strike';
 return best&&SKILLS[best].strength>1.2?'skill:'+best:'strike';
}
export const WAR_COMMANDS=Object.freeze([
 {id:'strike',icon:'⚔',key:'strike',detail:'×1.00 ⚔'},
 {id:'guard',icon:'🛡',key:'guard',detail:'×0.68 ⚔ · −65% 🛡'},
 {id:'feint',icon:'➶',key:'feint',detail:'×0.72 ⚔ · +35% 🛡'},
 {id:'rally',icon:'♡',key:'rally',detail:'×0.45 ⚔ · +16% HP'}
]);
export function officialWarRoomMarkup(mission,team,now=Date.now(),delta=null,locale=getLocale()){
 if(!mission)return '';
 const teamIds=(Array.isArray(team)?team:[]).filter(id=>HEROES.some(h=>h.id===id)).slice(0,3);
 const locked=!(Number.isFinite(now)&&Number.isFinite(mission.lastTurnAt))||now-mission.lastTurnAt<3000;
 const advice=warAdvice(mission,teamIds);
 const t=key=>warText(key,locale);
 const commands=WAR_COMMANDS.map(command=>{
  const cooldown=command.id==='rally'?warRallyCooldown(mission):0;
  const suggested=advice===command.id;
  const isDisabled=locked||cooldown>0;
  return '<button type="button" class="war-command '+(suggested?'suggested ':'')+'" data-account-turn="'+command.id+'" '+(isDisabled?'disabled ':'')+
   'aria-label="'+esc(t(command.key))+'" title="'+esc(t(command.key)+' · '+command.detail)+'">'+
   '<span class="war-command-icon" aria-hidden="true">'+command.icon+'</span><span class="war-command-copy"><strong>'+esc(t(command.key))+'</strong><small dir="ltr">'+esc(command.detail)+'</small>'+
   (cooldown?'<small>'+esc(t('cooldown'))+' '+cooldown+' '+esc(t('turns'))+'</small>':'')+'</span>'+
   (suggested?'<em class="war-recommended">'+esc(t('recommended'))+'</em>':'')+'</button>';
 }).join('');
 const skills=teamIds.map(id=>{
  const hero=HEROES.find(x=>x.id===id),spec=SKILLS[id],cd=warSkillCooldown(mission,id);
  const suggested=advice==='skill:'+id;
  return '<button type="button" class="war-skill '+(suggested?'suggested':'')+'" data-account-turn="skill:'+id+'" '+
   (locked||cd?'disabled ':'')+'aria-label="'+esc(hero.name+' · '+spec.effect)+'" title="'+esc(hero.name+' · '+spec.effect)+'">'+
   '<img src="assets/'+id+'.webp" alt="" loading="lazy"><span class="war-skill-body"><strong>'+esc(hero.name)+'</strong><small dir="ltr">'+esc(spec.effect)+'</small>'+
   '<small>'+esc(cd?t('cooldown')+' '+cd+' '+t('turns'):t('ready'))+'</small></span>'+
   (suggested?'<em class="war-recommended">'+esc(t('recommended'))+'</em>':'')+'</button>';
 }).join('');
 const verified=delta&&!delta.initial&&delta.turn===mission.turn&&
   [delta.damage,delta.received,delta.healed].every(x=>Number.isSafeInteger(x)&&x>=0)?
   '<section class="war-verified-report" role="status" aria-label="'+esc(t('verified'))+'"><strong>✓ '+esc(t('verified'))+'</strong>'+
   '<span>⚔ '+esc(t('damage'))+' <b>'+delta.damage+'</b></span>'+
   '<span>🛡 '+esc(t('received'))+' <b>'+delta.received+'</b></span>'+
   (delta.healed?'<span>✚ '+esc(t('healed'))+' <b>'+delta.healed+'</b></span>':'')+
   '</section>':'';
 return '<section class="official-war-room" aria-label="'+esc(t('heading'))+'"><header class="war-room-header">'+
  '<div><span class="eyebrow">'+esc(t('heading'))+'</span><p>'+esc(t('intro'))+'</p></div>'+
  '<p class="war-live-advice">◎ '+esc(t('tip'))+'</p></header>'+
  verified+
  '<div class="war-command-grid" role="group" aria-label="'+esc(t('heading'))+'">'+commands+'</div>'+
  '<div class="war-skills-head"><strong>'+esc(t('heroSkills'))+'</strong><small>'+esc(t('skillIntro'))+'</small></div>'+
  '<div class="war-skill-grid" role="group" aria-label="'+esc(t('heroSkills'))+'">'+skills+'</div>'+
  '<div class="war-foot"><button type="button" class="text-button" data-account-abandon>'+esc(t('retreat'))+'</button></div></section>';
}
