// The same intent description drives combat and the visible forecast.
const formations = [
  ['raider','raider','raider'],
  ['raider','raider','caster'],
  ['raider','caster','raider','caster'],
  ['boss','raider','raider','caster'],
  ['raider','caster','caster','raider'],
  ['boss','raider','caster','raider','caster'],
  ['raider','caster','caster','raider','caster'],
  ['boss','caster','raider','caster','raider'],
];
export const ENEMY_ROLES = { raider:'Akıncı', caster:'Gölge Büyücüsü', boss:'Bölge Efendisi' };
export function encounterEnemies(stage, version=2) {
  const baseHp=[68,90,112,138,166,192,220,250][stage.id-1];
  const baseAttack=[10,12,15,18,21,24,27,31][stage.id-1];
  return Array.from({length:stage.enemyCount},(_,index)=>{
    const role=version===1?'raider':formations[stage.id-1][index];
    const hp=Math.round(baseHp*(role==='boss'?1.65:role==='caster'?.8:1));
    const attack=Math.round(baseAttack*(role==='boss'?1.15:role==='caster'?.85:1));
    const name=role==='boss'?(stage.id===8?'Yıldızsız Hükümdar':stage.id===6?'Ayaz Komutanı':'Demir Cellat'):
      role==='caster'?`Gölge Büyücüsü ${index+1}`:`${stage.enemyName} ${index+1}`;
    return {id:`enemy-${index+1}`,name,role,hp,maxHp:hp,attack};
  });
}
// Stage-specific threat rules shared by manual and live battles.
export function specialEnemyAttack(battle,enemy,count) {
  if(battle.combatVersion===1)return null;
  if(battle.stageId===3 && enemy.role==='raider' && count%3===0)
    return {type:'thorn',label:'Dikenli pusu',detail:'Zehirli oklar yıldız enerjisini azaltır.',danger:true,multiplier:.85};
  if(battle.stageId===4 && enemy.role==='boss' && count%2===0)
    return {type:'shatter',label:'Demir kırıcı',detail:'Ön saftaki kalkanları aşan ağır tekli darbe.',danger:true,multiplier:1.6};
  if(battle.stageId===5 && enemy.role==='caster' && count%2===0)
    return {type:'grave',label:'Mahzen ayini',detail:'Düşmanı iyileştirir ve takımı yaralar.',danger:true,multiplier:.5};
  if(battle.stageId===6 && enemy.role==='caster' && count%2===0)
    return {type:'frost',label:'Ayaz zinciri',detail:'Bütün takımı yavaşlatır, yıldız enerjisini tüketir.',danger:true,multiplier:.6};
  if(battle.stageId===7 && enemy.role==='caster' && count%2===0)
    return {type:'drain',label:'Tutulma soğurması',detail:'Takıma zarar verir ve kendini iyileştirir.',danger:true,multiplier:.55};
  if(battle.stageId===8 && enemy.role==='boss'){
    const ratio=enemy.hp/Math.max(1,enemy.maxHp);
    if(ratio<=1/3 && count%2===0)
      return {type:'nova',label:'Boşluk patlaması · III',detail:'Son aşama: ağır alan saldırısı.',danger:true,multiplier:1.45};
    if(ratio<=2/3 && count%2===0)
      return {type:'drain',label:'Karanlık soğurma · II',detail:'İkinci aşama: saldırı ve can çalma.',danger:true,multiplier:1.0};
    if(ratio>2/3 && count%3===0)
      return {type:'crush',label:'Tahtın siper yıkımı · I',detail:'Birinci aşama: güçlü alan darbesi.',danger:true,multiplier:.95};
  }
  return null;
}
export function enemyIntent(battle,enemy) {
  const round=battle.round+1;
  const special=specialEnemyAttack(battle,enemy,round);
  if(special)return special;
  if(battle.stageId===8 && enemy.role==='boss')return {type:'strike',label:'Boşluk kılıcı',detail:'Tahtın üç aşamalı saldırısı.',danger:false,multiplier:1};
  if(battle.combatVersion!==1 && enemy.role==='boss' && round%3===0)
    return {type:'crush',label:'Yıkım dalgası',detail:'Bu tur bütün takıma ağır darbe. Savun veya Yıldız ile boz.',danger:true,multiplier:.95};
  if(battle.combatVersion!==1 && enemy.role==='caster' && round%2===0)
    return {type:'volley',label:'Gölge yağmuru',detail:'Bu tur bütün kahramanlara büyü saldırısı.',danger:true,multiplier:.55};
  return {type:'strike',label:enemy.role==='boss'?'Ağır kesiş':'Ön safa saldırı',detail:'Ayaktaki muhafıza, yoksa en yaralı kahramana saldırır.',danger:false,multiplier:1};
}
