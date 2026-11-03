/** v2.50 — read-only, localized phases for server-versioned Act I final bosses.
 * Damage, HP, intent and rewards are always computed by Supabase; this renders only.
 */
import {getLocale} from './locale-v243.js';
import {bossRelicText} from './boss-relic-v251.js';
import {comboText} from './boss-combo-v253.js';
import {officialText as official} from './locale-official-ui-v247.js';
const KEYS=['boss','phase','prelude','pressure','lastStand','guard','shield','drain','strike','verified'];
const COPY={
tr:['Bölge patronu','Safha','Savunmayı gözle; patronun hamlesini öğren.','Patronun gücü artıyor. Hamle işaretlerini takip et.','Son direniş! Yanlış savunma ağır hasar verebilir.','Ağır darbeye karşı Savun kullan.','Kalkanı Aldat veya kahraman yeteneğiyle aş.','Can emmesini güçlü saldırıyla durdur.','Güvenli anda saldır ve enerjini koru.','Savaş ve ganimet hesabı sunucu tarafından yapılır.'],
en:['Region boss','Phase','Watch its guard and learn the attack pattern.','The boss is growing stronger. Watch the telegraphed move.','Final stand! A missed defense can hurt badly.','Use Guard to counter a heavy strike.','Break its shield with Feint or a hero ability.','Counter life drain with a strong attack.','Strike when safe and preserve your health.','Combat and loot are resolved by the server.'],
es:['Jefe regional','Fase','Observa su defensa y aprende el patrón de ataque.','El jefe gana fuerza. Vigila el movimiento anunciado.','¡Resistencia final! Una defensa fallida duele.','Usa Defensa contra los golpes fuertes.','Rompe el escudo con Finta o una habilidad.','Contrarresta el robo de vida con un ataque fuerte.','Ataca cuando sea seguro y conserva salud.','El servidor decide el combate y el botín.'],
'pt-BR':['Chefe regional','Fase','Observe a defesa e aprenda o padrão de ataque.','O chefe está ficando mais forte. Observe o golpe anunciado.','Resistência final! Errar a defesa pode custar caro.','Use Defender contra golpes pesados.','Quebre o escudo com Finta ou habilidade de herói.','Interrompa o roubo de vida com um ataque forte.','Ataque com segurança e preserve a vida.','O servidor decide o combate e as recompensas.'],
fr:['Boss de région','Phase','Observez sa garde et apprenez ses attaques.','Le boss gagne en puissance. Surveillez son attaque annoncée.','Dernière résistance ! Une défense ratée peut coûter cher.','Utilisez Garde contre les coups lourds.','Brisez son bouclier avec Feinte ou une compétence.','Contrez le vol de vie par une attaque puissante.','Frappez au bon moment et préservez vos PV.','Le serveur calcule le combat et le butin.'],
de:['Gebietsboss','Phase','Beobachte die Verteidigung und lerne die Angriffe.','Der Boss wird stärker. Achte auf den angekündigten Zug.','Letzter Widerstand! Ein Abwehrfehler kann gefährlich sein.','Nutze Abwehren gegen schwere Treffer.','Durchbrich den Schild mit Finte oder Heldenfähigkeit.','Stoppe Lebensentzug mit einem starken Angriff.','Greife sicher an und schone deine Gesundheit.','Kampf und Beute werden vom Server berechnet.'],
it:['Boss regionale','Fase','Osserva la difesa e impara gli attacchi.','Il boss diventa più forte. Osserva la mossa annunciata.','Ultima resistenza! Una difesa errata può costare cara.','Usa Difesa contro i colpi pesanti.','Rompi lo scudo con Finta o un’abilità dell’eroe.','Contrasta il furto di vita con un attacco potente.','Attacca quando è sicuro e conserva la salute.','Combattimento e bottino sono calcolati dal server.'],
ru:['Региональный босс','Фаза','Следи за защитой и изучай атаки противника.','Босс становится сильнее. Следи за объявленным ударом.','Последний рубеж! Ошибка в защите опасна.','Защищайся от тяжёлых ударов.','Пробей щит финтом или умением героя.','Останови похищение жизни мощной атакой.','Атакуй в безопасный момент и береги здоровье.','Бой и награды рассчитывает сервер.'],
ar:['زعيم المنطقة','المرحلة','راقب دفاعه وتعلم نمط هجماته.','يزداد الزعيم قوة. راقب الحركة المعلنة.','المقاومة الأخيرة! الدفاع الخاطئ قد يكون مؤلماً.','استخدم الدفاع لصد الضربات الثقيلة.','اكسر الدرع بالخدعة أو مهارة البطل.','واجه امتصاص الحياة بهجوم قوي.','هاجم في اللحظة المناسبة وحافظ على صحتك.','يحسب الخادم القتال والغنائم.'],
hi:['क्षेत्रीय बॉस','चरण','बचाव देखें और उसके हमले का तरीका सीखें।','बॉस ताकतवर हो रहा है। दिखाए गए हमले पर ध्यान दें।','अंतिम संघर्ष! गलत बचाव नुकसानदेह होगा।','भारी प्रहार के विरुद्ध रक्षा करें।','छल या नायक कौशल से ढाल तोड़ें।','जीवन-शोषण को शक्तिशाली हमले से रोकें।','सुरक्षित समय पर हमला कर स्वास्थ्य बचाएँ।','लड़ाई और पुरस्कार सर्वर तय करता है।'],
id:['Bos wilayah','Fase','Amati pertahanan dan pelajari pola serangannya.','Bos makin kuat. Perhatikan serangan yang ditandai.','Perlawanan terakhir! Salah bertahan bisa berbahaya.','Gunakan Bertahan untuk melawan serangan berat.','Hancurkan perisai dengan Tipuan atau jurus pahlawan.','Lawan pencurian nyawa dengan serangan kuat.','Serang pada saat aman dan jaga kesehatan.','Pertempuran dan hadiah dihitung server.'],
ja:['地域ボス','段階','防御を観察し、攻撃パターンを覚えよう。','ボスが強化中。予告された技に注意。','最終局面！防御の失敗は大ダメージにつながる。','強打には防御で対抗しよう。','盾はフェイントか英雄スキルで突破。','生命吸収には強力な攻撃で対抗。','安全な隙に攻撃し、体力を守ろう。','戦闘と報酬はサーバーが判定します。'],
ko:['지역 보스','단계','방어를 관찰하고 공격 패턴을 익히세요.','보스가 강해집니다. 예고된 공격을 주시하세요.','마지막 저항! 방어에 실패하면 큰 피해를 받습니다.','강타에는 방어를 사용하세요.','속임수나 영웅 기술로 방패를 뚫으세요.','강력한 공격으로 생명 흡수를 막으세요.','안전한 순간에 공격하고 체력을 지키세요.','전투와 보상은 서버가 계산합니다.'],
'zh-CN':['区域首领','阶段','观察防御并学习攻击模式。','首领变得更强。注意预告的攻击。','最后抵抗！防御失误可能造成大量伤害。','使用防御抵挡重击。','用佯攻或英雄技能突破护盾。','用强力攻击对抗生命吸取。','把握安全时机攻击并保留生命值。','战斗与战利品由服务器计算。']
};
export const BOSS_V250_KEYS=Object.freeze(KEYS);
export const BOSS_V250_TRANSLATIONS=Object.freeze(Object.fromEntries(Object.entries(COPY).map(
 ([locale,values])=>[locale,Object.freeze(Object.fromEntries(KEYS.map((key,i)=>[key,values[i]])))])));
const text=key=>BOSS_V250_TRANSLATIONS[getLocale()]?.[key]??BOSS_V250_TRANSLATIONS.en[key];
export function bossV250Phase(mission){
 if(!mission)return null;
 const story=mission.mode==='story'&&[2,3,4,5,6].includes(mission.balanceVersion)&&
   Number.isInteger(mission.stage)&&mission.stage>=4&&mission.stage<=8&&mission.wave===3;
 const weekly=mission.mode==='boss'&&mission.balanceVersion>=3&&mission.stage===4&&mission.wave===1;
 if(!story&&!weekly)return null;
 const max=Number(mission.enemyMaxHp),hp=Number(mission.enemyHp);
 if(!Number.isFinite(max)||max<=0||!Number.isFinite(hp)||hp<0||hp>max)return null;
 const phase=hp<=max*.33?3:hp<=max*.67?2:1;
 const intent=['crush','shield','drain','strike','sunder','eclipse'].includes(mission.enemyIntent)?mission.enemyIntent:'strike';
 return Object.freeze({phase,intent,stage:mission.stage,ratio:hp/max,weekly});
}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function bossV250Markup(mission){
 const state=bossV250Phase(mission);if(!state)return '';
 const phaseLabel=text(['prelude','pressure','lastStand'][state.phase-1]);
 const hint=state.intent==='eclipse'?comboText('hint'):state.intent==='sunder'?bossRelicText('sunderHint'):text({crush:'guard',shield:'shield',drain:'drain',strike:'strike'}[state.intent]);
 const heading=state.weekly?official('Haftalık ortak dünya patronu','Weekly community world boss'):text('boss');
 return '<aside class="story-boss-v250 phase-'+state.phase+'" aria-label="'+esc(heading)+'">'+
 '<div><span class="eyebrow">⚔ '+esc(heading)+' · '+esc(text('phase'))+' '+state.phase+' / 3</span>'+
 '<strong>'+esc(phaseLabel)+'</strong><p>'+esc(hint)+'</p><small>'+esc(text('verified'))+'</small></div>'+
 '<div class="story-boss-v250-track" aria-hidden="true">'+[1,2,3].map(i=>'<i class="'+(i<=state.phase?'active':'')+'"></i>').join('')+'</div></aside>';
}
export function auditBossV250Languages(languages){
 return languages.flatMap(locale=>KEYS.filter(key=>typeof BOSS_V250_TRANSLATIONS[locale]?.[key]!=='string'||
   !BOSS_V250_TRANSLATIONS[locale][key].trim()).map(key=>locale+'.'+key));
}
