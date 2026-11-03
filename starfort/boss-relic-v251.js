/** v2.51: deterministic, server-owned weekly boss relic rotation and native combat hints.
 * This browser module can PREVIEW the next reward, never award it.
 * Supabase verifies weekly victory, item inventory cap and idempotent claims.
 */
import {getLocale} from './locale-v243.js';
export const BOSS_RELIC_ITEMS=Object.freeze(['ember_guard','star_spear','guardian_seal','starbreaker']);
export function weeklyBossRelic(week){
 if(typeof week!=='string'||!/^\d{4}-(0[1-9]|[1-4]\d|5[0-3])$/.test(week))return null;
 const n=Number(week.slice(5));
 return BOSS_RELIC_ITEMS[(n-1)%4];
}
const KEYS=['sunder','sunderHint','sunderTip','guaranteedRelic','rotation','earnedRelic','converted','noRelicForOldBattle'];
const strings={
tr:['Zırh Parçalama','◇ Aldat ile zırh kıran darbeyi boz ve karşı saldır. Savun da hasarı azaltır.','◇ Aldat: patronun Zırh Parçalama saldırısını boz.','Bu haftanın garantili ekipmanı','Dört haftalık ganimet döngüsü','Patron ganimeti','Eşya sınırı dolu: 36 yıldız özü verildi','Eski savaşlarda yeni ganimet bulunmaz.'],
en:['Armor Sunder','◇ Use Feint to interrupt the armor-breaking strike. Guard reduces damage too.','◇ Feint interrupts the boss’s Armor Sunder.','Guaranteed equipment this week','Four-week loot rotation','Boss equipment earned','Inventory full: received 36 star essence','Older battles do not include the new loot.'],
es:['Ruptura de armadura','◇ Usa Finta para interrumpir la ruptura. Defender también reduce daño.','◇ Finta interrumpe la ruptura del jefe.','Equipo garantizado esta semana','Rotación de botín de cuatro semanas','Equipo del jefe obtenido','Inventario lleno: recibes 36 esencias estelares','Las batallas antiguas no incluyen el nuevo botín.'],
'pt-BR':['Ruptura de armadura','◇ Use Finta para interromper o golpe. Defender também reduz o dano.','◇ Finta interrompe a ruptura de armadura do chefe.','Equipamento garantido nesta semana','Rotação de saque em quatro semanas','Equipamento do chefe obtido','Inventário cheio: recebeu 36 essências estelares','Batalhas antigas não incluem o novo saque.'],
fr:['Brise-armure','◇ Utilisez Feinte pour interrompre le coup. Garde réduit aussi les dégâts.','◇ Feinte interrompt le Brise-armure du boss.','Équipement garanti cette semaine','Rotation des butins sur quatre semaines','Équipement du boss obtenu','Inventaire plein : 36 essences stellaires reçues','Les anciens combats n’offrent pas ce nouveau butin.'],
de:['Rüstungsbruch','◇ Unterbrich den Rüstungsbruch mit Finte. Abwehren verringert ebenfalls Schaden.','◇ Finte unterbricht den Rüstungsbruch des Bosses.','Garantierte Ausrüstung diese Woche','Vierwöchige Beuterotation','Bossausrüstung erhalten','Inventar voll: 36 Sternenessenz erhalten','Alte Kämpfe enthalten diese Beute nicht.'],
it:['Spezzarmatura','◇ Usa Finta per interrompere il colpo. Difesa riduce anche i danni.','◇ Finta interrompe lo Spezzarmatura del boss.','Equipaggiamento garantito questa settimana','Rotazione bottino di quattro settimane','Equipaggiamento del boss ottenuto','Inventario pieno: ricevute 36 essenze stellari','Le vecchie battaglie non includono il nuovo bottino.'],
ru:['Разрушение брони','◇ Используй финт, чтобы прервать удар. Защита также снизит урон.','◇ Финт прерывает разрушение брони босса.','Гарантированное снаряжение недели','Четырёхнедельная ротация добычи','Снаряжение босса получено','Инвентарь полон: получено 36 звёздной эссенции','Старые бои не содержат новую добычу.'],
ar:['تحطيم الدرع','◇ استخدم الخدعة لقطع الضربة. الدفاع يقلل الضرر أيضاً.','◇ الخدعة تعطل تحطيم الدرع لدى الزعيم.','معدات مضمونة لهذا الأسبوع','دورة غنائم من أربعة أسابيع','تم الحصول على معدات الزعيم','الحقيبة ممتلئة: حصلت على 36 جوهر نجمي','المعارك القديمة لا تشمل الغنيمة الجديدة.'],
hi:['कवच भेदन','◇ प्रहार को रोकने के लिए छल करें। रक्षा भी नुकसान घटाती है।','◇ छल से बॉस का कवच भेदन रोकें।','इस सप्ताह का सुनिश्चित उपकरण','चार सप्ताह का लूट चक्र','बॉस का उपकरण मिला','सूची भरी है: 36 तारकीय सार मिले','पुराने युद्ध में नया पुरस्कार नहीं मिलता।'],
id:['Penghancur zirah','◇ Gunakan Tipuan untuk menghentikan pukulan. Bertahan juga mengurangi cedera.','◇ Tipuan menghentikan Penghancur Zirah bos.','Perlengkapan pasti minggu ini','Rotasi hadiah empat minggu','Perlengkapan bos diperoleh','Tas penuh: menerima 36 esensi bintang','Pertarungan lama tidak mendapat hadiah baru.'],
ja:['装甲破壊','◇ フェイントで装甲破壊を中断。防御でも被害を減らせます。','◇ フェイントでボスの装甲破壊を阻止。','今週の確定装備','4週間の戦利品ローテーション','ボス装備を獲得','所持上限のため星のエッセンス36個を獲得','旧バージョンの戦闘は新しい報酬の対象外です。'],
ko:['방어구 파괴','◇ 속임수로 공격을 끊으세요. 방어도 피해를 줄입니다.','◇ 속임수로 보스의 방어구 파괴를 끊으세요.','이번 주 확정 장비','4주 전리품 순환','보스 장비 획득','보관함 가득 참: 별 정수 36개 획득','기존 전투에는 새 전리품이 적용되지 않습니다.'],
'zh-CN':['破甲打击','◇ 用佯攻打断破甲。防御也能减少伤害。','◇ 佯攻可打断首领的破甲打击。','本周保底装备','四周战利品轮换','获得首领装备','背包已满：获得36星之精华','旧版本战斗不包含新掉落。']
};
export const BOSS_RELIC_KEYS=Object.freeze(KEYS);
export const BOSS_RELIC_TRANSLATIONS=Object.freeze(Object.fromEntries(Object.entries(strings).map(
 ([lang,values])=>[lang,Object.freeze(Object.fromEntries(KEYS.map((key,i)=>[key,values[i]])))])));
export const bossRelicText=key=>BOSS_RELIC_TRANSLATIONS[getLocale()]?.[key]||BOSS_RELIC_TRANSLATIONS.en[key]||'';
export function auditBossRelicLanguages(languages){
 return languages.flatMap(lang=>KEYS.filter(key=>typeof BOSS_RELIC_TRANSLATIONS[lang]?.[key]!=='string'||
  !BOSS_RELIC_TRANSLATIONS[lang][key].trim()).map(key=>lang+'.'+key));
}
