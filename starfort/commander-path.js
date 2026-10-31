// Starfort's optional journey map. Purely derived from the current save, with no
// timers, paywalls, or permanent flags to corrupt older save files.
const hasEquipment = state => Object.values(state.loadouts || {}).some(slots =>
  slots && typeof slots === 'object' && Object.values(slots).some(Boolean));
const tierTotal = state => Object.values(state.veteranMedals || {})
  .reduce((sum, value) => sum + (Number.isInteger(value) ? Math.max(0, Math.min(value, 3)) : 0), 0);
const chaptersCleared = state => Array.isArray(state.cleared) ? state.cleared.filter(id=>Number.isInteger(id)&&id>=1&&id<=8).length : 0;

export const COMMANDER_STEPS = Object.freeze([
  {id:'first-victory',title:'İlk ışığı geri getir',detail:'Kül Geçidi seferini tamamla.',action:'expedition',cta:'Seferleri aç',done:s=>chaptersCleared(s)>=1},
  {id:'keep-two',title:'Yıldız Kalesi’ni büyüt',detail:'Ana kaleni 2. seviyeye yükselt.',action:'keep',cta:'Köye dön',done:s=>(s.buildings?.keep||0)>=2},
  {id:'recruit-mira',title:'Yeni bir müttefik bul',detail:'Kırık Şapel’de Mira’yı kurtar ve kahraman ekranında tanış.',action:'expedition',cta:'Hikâyeye devam et',done:s=>chaptersCleared(s)>=2},
  {id:'equip-hero',title:'Kahramanını donat',detail:'Cephanelikten bir kahramana ekipman kuşandır.',action:'armory',cta:'Cephaneliğe git',done:hasEquipment},
  {id:'finish-campaign',title:'Kuzey Sınırı’nı kurtar',detail:'Sekiz ana hikâye seferini tamamla.',action:'expedition',cta:'Seferlere git',done:s=>chaptersCleared(s)>=8},
  {id:'veteran',title:'Ustalık mührü kazan',detail:'Tamamladığın bir seferin Usta seviyesini kazan.',action:'expedition',cta:'Usta Seferlerine git',done:s=>tierTotal(s)>=1},
  {id:'rift',title:'Yıldız Yarığı’nı keşfet',detail:'Haftalık meydan okumayı bir kez tamamla.',action:'expedition',cta:'Yıldız Yarığı’na git',done:s=>Array.isArray(s.riftRecords)&&s.riftRecords.length>0}
]);

export function commanderPath(state){
  const steps=COMMANDER_STEPS.map(({done,...item})=>({...item,completed:Boolean(done(state))}));
  const completed=steps.filter(step=>step.completed).length;
  const next=steps.find(step=>!step.completed)||null;
  return {steps,completed,total:steps.length,next,allDone:!next};
}
