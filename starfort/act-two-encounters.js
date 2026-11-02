/** Story encounter formations for each of the 24 Act II operations.
 * Pure presentation: server mission wave/stage and intent remain authoritative. */
const chapters=[
 [['Kızıl Sahil Nöbeti','Fener Sabotajcısı','Kızıl Okçu'],['Rıhtım Ablukası','Kanlı Topçu','Dalgakıran'],['Sancak Muhafızı','Kızıl Gözcü','Kor Habercisi']],
 [['Cam İz Sürücü','Kum Muhafızı','Çöl İzci'],['Ayna Büyücüsü','Cam Kalkanlı','Kum Kahini'],['Ayna Muhafızı','Cam Kehanetçisi','Kum Gölgesi']],
 [['Meteor Gözcüsü','Taş Kırıcı','Krater İzci'],['Göktaşı Kalkanı','Krater Şamanı','Taş Çekirdek'],['Taş Çağıran','Göktaşı Devi','Meteor Büyücüsü']],
 [['Kök Avcısı','Diken Okçu','Karanlık Sarmaşık'],['Diken Muhafızı','Kanlı Bahçıvan','Kök Büyücüsü'],['Taç Muhafızı','Diken Kraliçesi','Diken Büyücüsü']],
 [['Kül Akıncısı','Kor Nöbetçisi','Lav İzci'],['Kül Büyücüsü','Kor Golemi','Kızgın Muhafız'],['Dağ Nöbetçisi','Kül Muhafızı','Kül Rahibi']],
 [['Gece Nöbetçisi','Sessiz Suikastçı','Gölge Avcısı'],['Ayinsiz Rahip','Mabet Muhafızı','Gece Kâhini'],['Son Çan Bekçisi','Gece Başrahibi','Karanlık Mürit']],
 [['Fırtına Gözcüsü','Geçit Muhafızı','Yıldırım Okçu'],['Kule Muhafızı','Şimşek Çağıran','Köprü Kırıcı'],['Gökgürültüsü Muhafızı','Fırtına Mareşali','Yıldırım Kâhini']],
 [['Boşluk İzci','Yarık Muhafızı','Kayıp Nöbetçi'],['Boşluk Kalkanı','Sessiz Büyücü','Işık Yiyen'],['Uçurum Muhafızı','Boşluk Varisi','Son Gölge']]
];
const roles=[
 [['raider','caster','raider'],['raider','caster','caster'],['raider','boss','caster']],
 [['raider','raider','caster'],['caster','raider','caster'],['caster','boss','raider']],
 [['raider','raider','raider'],['raider','caster','raider'],['raider','boss','caster']],
 [['raider','caster','raider'],['raider','caster','caster'],['raider','boss','caster']],
 [['raider','raider','caster'],['caster','raider','raider'],['raider','boss','caster']],
 [['raider','raider','raider'],['caster','raider','caster'],['raider','boss','caster']],
 [['raider','caster','raider'],['raider','caster','caster'],['raider','boss','caster']],
 [['raider','raider','caster'],['raider','caster','caster'],['raider','boss','caster']]
];
const themes=['ember','glass','meteor','thorn','ash','night','storm','void'];
export const ACT_TWO_ENCOUNTERS=Object.freeze(chapters.map((waves,i)=>Object.freeze({
 stage:i+1,theme:themes[i],
 waves:Object.freeze(waves.map((names,j)=>Object.freeze({
  wave:j+1,roster:Object.freeze(roles[i][j].map((kind,k)=>Object.freeze({kind,name:names[k]})))
 })))
})));
export function actTwoEncounter(mission){
 if(mission?.mode!=='act2'||!Number.isInteger(mission.stage)||!Number.isInteger(mission.wave))return null;
 const group=ACT_TWO_ENCOUNTERS[mission.stage-1];
 return group&&mission.wave>=1&&mission.wave<=3?Object.freeze({stage:group.stage,wave:mission.wave,theme:group.theme,roster:group.waves[mission.wave-1].roster}):null;
}
