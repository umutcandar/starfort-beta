/** STARFORT v2.53 — tactical counterplay text only; server owns boss intentions. */
import {getLocale} from './locale-v243.js';
const KEY=['name','hint','tip','combo','phase'];
const translations={
 tr:['Tutulma Dalgası','Patronun ikinci dalgası! Savun hasarı azaltır; Toparlan hem can yeniler hem darbeyi hafifletir.','◉ Savun veya ♡ Toparlan: Tutulma Dalgasını karşıla.','İki hamlelik patron kombosu','İkinci dalga'],
 en:['Eclipse Surge','The second strike is coming! Guard reduces damage; Rally heals and dampens the hit.','◉ Guard or ♡ Rally to counter Eclipse Surge.','Two-move boss combo','Second wave'],
 es:['Oleada de Eclipse','¡Llega el segundo golpe! Defender reduce daño; Reagrupar cura y amortigua.','◉ Defensa o ♡ Reagrupación contra Oleada de Eclipse.','Combo de jefe en dos movimientos','Segunda oleada'],
 'pt-BR':['Onda do Eclipse','O segundo golpe vem aí! Defender reduz dano; Reagrupar cura e amortece o impacto.','◉ Defender ou ♡ Reagrupar contra a Onda do Eclipse.','Combo de dois golpes do chefe','Segunda onda'],
 fr:['Onde d’éclipse','La seconde frappe arrive ! Garde réduit les dégâts ; Ralliement soigne et amortit le coup.','◉ Garde ou ♡ Ralliement contre l’Onde d’éclipse.','Combo de boss à deux coups','Seconde vague'],
 de:['Finsterniswelle','Der zweite Schlag kommt! Abwehren reduziert Schaden; Sammeln heilt und dämpft den Treffer.','◉ Abwehren oder ♡ Sammeln gegen die Finsterniswelle.','Boss-Kombo aus zwei Zügen','Zweite Welle'],
 it:['Onda d’Eclissi','Arriva il secondo colpo! Difesa riduce i danni; Raduno cura e attutisce l’impatto.','◉ Difesa o ♡ Raduno contro l’Onda d’Eclissi.','Combo del boss in due mosse','Seconda ondata'],
 ru:['Волна затмения','Готовится второй удар! Защита снижает урон, а Сбор лечит и смягчает попадание.','◉ Защита или ♡ Сбор против Волны затмения.','Комбинация босса из двух атак','Вторая волна'],
 ar:['موجة الكسوف','الضربة الثانية قادمة! الدفاع يقلل الضرر والتجمع يعيد الصحة ويخفف الضربة.','◉ استخدم الدفاع أو ♡ التجمع لصد موجة الكسوف.','هجوم مزدوج من الزعيم','الموجة الثانية'],
 hi:['ग्रहण लहर','दूसरा प्रहार आ रहा है! रक्षा नुकसान घटाती है; पुनर्गठन स्वास्थ्य बढ़ाता और प्रहार कम करता है।','◉ ग्रहण लहर के विरुद्ध रक्षा या ♡ पुनर्गठन करें।','बॉस के दो जुड़े हमले','दूसरी लहर'],
 id:['Gelombang Gerhana','Serangan kedua datang! Bertahan mengurangi cedera; Pulihkan menyembuhkan dan meredam serangan.','◉ Bertahan atau ♡ Pulihkan melawan Gelombang Gerhana.','Kombo bos dua gerakan','Gelombang kedua'],
 ja:['日食の波動','2撃目が来ます！ 防御で被害を軽減。再集結で回復しつつ軽減できます。','◉ 日食の波動には防御か♡再集結で対抗。','ボスの2連続攻撃','第2波'],
 ko:['일식 파동','두 번째 타격이 옵니다! 방어로 피해를 줄이고 재정비로 회복하며 막을 수 있습니다.','◉ 일식 파동은 방어 또는 ♡ 재정비로 대응하세요.','보스 2연속 연계 공격','두 번째 파동'],
 'zh-CN':['日蚀冲击','第二击即将到来！防御可减少伤害；集结能回复生命并减轻冲击。','◉ 使用防御或♡集结来应对日蚀冲击。','首领两段连击','第二波']
};
export const COMBO_KEYS=Object.freeze(KEY);
export const COMBO_TRANSLATIONS=Object.freeze(Object.fromEntries(Object.entries(translations).map(
 ([language,values])=>[language,Object.freeze(Object.fromEntries(KEY.map((key,i)=>[key,values[i]])))])));
export function comboText(key){
 return COMBO_TRANSLATIONS[getLocale()]?.[key]??COMBO_TRANSLATIONS.en[key]??'';
}
export function auditComboLanguages(languages){
 return languages.flatMap(lang=>KEY.filter(key=>
  typeof COMBO_TRANSLATIONS[lang]?.[key]!=='string'||!COMBO_TRANSLATIONS[lang][key].trim()
 ).map(key=>lang+'.'+key));
}
