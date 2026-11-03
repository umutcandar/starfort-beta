/** Native Act II all 8 chapters, 24 missions, 8 bosses and region lore across 14 languages.
 * Rule, power and reward values are never derived from translated text.
 */
import {getLocale} from './locale-v243.js';
import {ACT_TWO_EU} from './locale-act2-eu-v247.js';
import {ACT_TWO_ASIA1} from './locale-act2-asia1-v247.js';
import {ACT_TWO_ASIA2} from './locale-act2-asia2-v247.js';
export const ACT_TWO_NATIVE=Object.freeze({...ACT_TWO_EU,...ACT_TWO_ASIA1,...ACT_TWO_ASIA2});
export const ACT_TWO_GATE_KEYS=Object.freeze(["unknown","mainStory","priorRegion","power"]);
export const ACT_TWO_GATES=Object.freeze({"tr":{"unknown":"Bilinmeyen ikinci perde bölgesi.","mainStory":"Önce sekiz ana hikâye bölgesini tamamla.","priorRegion":"Önce ikinci perdenin önceki bölgesini bitir.","power":"Gerekli güç {power}. Kahraman ve ekipmanı geliştir."},"en":{"unknown":"Unknown Act II region.","mainStory":"Complete all eight main story regions first.","priorRegion":"Finish the previous Act II region first.","power":"Required power: {power}. Upgrade heroes and equipment."},"es":{"unknown":"Región desconocida del segundo acto.","mainStory":"Completa primero las ocho regiones de la historia principal.","priorRegion":"Termina primero la región anterior del segundo acto.","power":"Poder necesario: {power}. Mejora héroes y equipo."},"pt-BR":{"unknown":"Região desconhecida do segundo ato.","mainStory":"Conclua primeiro as oito regiões da história principal.","priorRegion":"Conclua primeiro a região anterior do segundo ato.","power":"Poder necessário: {power}. Melhore heróis e equipamentos."},"fr":{"unknown":"Région inconnue du deuxième acte.","mainStory":"Terminez d'abord les huit régions de l'histoire principale.","priorRegion":"Terminez d'abord la région précédente du deuxième acte.","power":"Puissance requise : {power}. Améliorez les héros et l'équipement."},"de":{"unknown":"Unbekannte Region in Akt II.","mainStory":"Schließe zuerst alle acht Regionen der Hauptgeschichte ab.","priorRegion":"Schließe zuerst die vorherige Region von Akt II ab.","power":"Benötigte Stärke: {power}. Verbessere Helden und Ausrüstung."},"it":{"unknown":"Regione sconosciuta del secondo atto.","mainStory":"Completa prima tutte le otto regioni della storia principale.","priorRegion":"Completa prima la regione precedente del secondo atto.","power":"Potenza richiesta: {power}. Potenzia eroi ed equipaggiamento."},"ru":{"unknown":"Неизвестная область второго акта.","mainStory":"Сначала пройди все восемь областей основной истории.","priorRegion":"Сначала заверши предыдущую область второго акта.","power":"Требуемая сила: {power}. Улучши героев и снаряжение."},"ar":{"unknown":"منطقة غير معروفة من الفصل الثاني.","mainStory":"أكمل أولًا مناطق القصة الرئيسية الثماني.","priorRegion":"أكمل أولًا المنطقة السابقة من الفصل الثاني.","power":"القوة المطلوبة: {power}. طوّر الأبطال والمعدات."},"hi":{"unknown":"दूसरे अंक का अज्ञात क्षेत्र।","mainStory":"पहले मुख्य कहानी के सभी आठ क्षेत्र पूरे करें।","priorRegion":"पहले दूसरे अंक का पिछला क्षेत्र पूरा करें।","power":"आवश्यक शक्ति: {power}। नायक और उपकरण उन्नत करें।"},"id":{"unknown":"Wilayah babak kedua tidak dikenal.","mainStory":"Selesaikan delapan wilayah cerita utama terlebih dahulu.","priorRegion":"Selesaikan wilayah sebelumnya di babak kedua.","power":"Kekuatan dibutuhkan: {power}. Tingkatkan pahlawan dan perlengkapan."},"ja":{"unknown":"第二幕の不明な地域です。","mainStory":"先にメインストーリーの8地域をすべてクリアしてください。","priorRegion":"先に第二幕の前の地域をクリアしてください。","power":"必要戦力: {power}。英雄と装備を強化してください。"},"ko":{"unknown":"제2막의 알 수 없는 지역입니다.","mainStory":"먼저 메인 스토리의 8개 지역을 모두 완료하세요.","priorRegion":"먼저 제2막의 이전 지역을 완료하세요.","power":"필요 전투력: {power}. 영웅과 장비를 강화하세요."},"zh-CN":{"unknown":"未知的第二幕区域。","mainStory":"请先完成主线故事的全部八个区域。","priorRegion":"请先完成第二幕的上一个区域。","power":"所需战力：{power}。请升级英雄与装备。"}});
export const nativeSecondRegion=(id)=>ACT_TWO_NATIVE[getLocale()]?.[String(id)]||null;
export const nativeSecondOperation=(id)=>{
 const [chapter]=String(id||'').split('-');
 return nativeSecondRegion(chapter)?.operations?.[String(id)]||null;
};
export function nativeSecondGate(key,values={}){
 const text=ACT_TWO_GATES[getLocale()]?.[key]??ACT_TWO_GATES.en[key]??key;
 return text.replace(/\{(\w+)\}/g,(_,arg)=>String(values[arg]??''));
}
export function auditActTwo(){
 const locales=Object.keys(ACT_TWO_GATES).filter(x=>!['tr','en'].includes(x)),errors=[];
 for(const l of locales){
  const regions=ACT_TWO_NATIVE[l];
  if(!regions){errors.push(l+': missing act two');continue;}
  for(let i=1;i<=8;i++){
   const region=regions[i];
   if(!region?.name||!region.zone||!region.lore||!region.boss)errors.push(l+': region '+i);
   for(let j=1;j<=3;j++){
    const key=i+'-'+j,op=region?.operations?.[key];
    if(!op?.name||!op.objective)errors.push(l+': operation '+key);
   }
  }
 }
 return errors;
}
