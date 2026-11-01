// Narrative biomes use the existing illustrated battlefield, not unfinished 3D meshes.
// Visual presentation only; stages, hitboxes and combat calculations are unchanged.
export const CHAPTER_ATMOSPHERES=Object.freeze([
  {id:'ash',name:'Kül Geçidi',mood:'Küllü şafak'},
  {id:'chapel',name:'Kırık Şapel',mood:'Sönen kutsal ışık'},
  {id:'forest',name:'Karaorman',mood:'Zehirli yeşil sis'},
  {id:'iron',name:'Demir Kapı',mood:'Alevler içindeki surlar'},
  {id:'crypt',name:'Sessiz Mahzen',mood:'Kadim mezar soğuğu'},
  {id:'frost',name:'Ayaz Surları',mood:'Ayaz fırtınası'},
  {id:'eclipse',name:'Tutulma Kulesi',mood:'Tutulmanın gölgesi'},
  {id:'void',name:'Yıldızsız Taht',mood:'Son karanlık'},
]);
export function chapterAtmosphere(stageId){
  return CHAPTER_ATMOSPHERES[Number.isInteger(stageId)?stageId-1:-1] || CHAPTER_ATMOSPHERES[0];
}
