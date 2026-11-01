// Local PvE achievement track. Not a PvP rank or trusted multiplayer reward.
export const STAR_MILESTONES = Object.freeze([
  {total:3,title:'Kül İzci'},
  {total:6,title:'Yemin Muhafızı'},
  {total:12,title:'Gümüş Komutan'},
  {total:18,title:'Kuzeyin Kalkanı'},
  {total:24,title:'Yıldız Mareşali'},
]);
export const THREE_STAR_LOOT = Object.freeze(['moon_watch','ember_guard','dawn_relic','star_spear','dawn_guard']);
const grade = value => Number.isInteger(value) && value>=1 && value<=3;
export function restoreCampaignStars(saved,cleared) {
  const ratings={};
  for(const id of cleared||[]) if(Number.isInteger(id) && id>=1 && id<=8)
    ratings[id]=grade(saved?.[id])?saved[id]:1; // Older completed chapters get one star.
  return ratings;
}
export function gradeCampaignBattle(battle) {
  if(!battle || !Array.isArray(battle.allies) || !battle.allies.length) return 1;
  const allies=battle.allies;
  const survivors=allies.filter(hero=>Number.isFinite(hero.hp) && hero.hp>0).length;
  const maxHp=allies.reduce((sum,hero)=>sum+Math.max(1,Number(hero.maxHp)||1),0);
  const currentHp=allies.reduce((sum,hero)=>sum+Math.max(0,Math.min(Number(hero.hp)||0,Number(hero.maxHp)||0)),0);
  if(survivors===allies.length && currentHp/maxHp>=0.7) return 3;
  if(survivors>=Math.ceil(allies.length*2/3) && currentHp/maxHp>=0.35) return 2;
  return 1;
}
export function recordCampaignStars(state,battle) {
  if(battle.veteranTier || battle.riftModifier) return {stars:0,improved:false,loot:null};
  const stars=gradeCampaignBattle(battle);
  const before=state.campaignStars?.[battle.stageId]||0;
  if(!state.campaignStars)state.campaignStars={};
  const threeBefore=Object.values(state.campaignStars).filter(s=>s===3).length;
  state.campaignStars[battle.stageId]=Math.max(before,stars);
  let loot=null;
  if(stars===3 && before<3 && threeBefore<THREE_STAR_LOOT.length) {
    loot=THREE_STAR_LOOT[threeBefore];
    state.inventory[loot]=Math.min(20,(state.inventory[loot]||0)+1);
  }
  return {stars,improved:stars>before,loot};
}
export function campaignStarStatus(state) {
  const ratings=state.campaignStars||{};
  const total=Array.from({length:8},(_,i)=>ratings[i+1]||0).reduce((sum,n)=>sum+(grade(n)?n:0),0);
  return {total,max:24,threeStarWins:Object.values(ratings).filter(n=>n===3).length,
    milestones:STAR_MILESTONES.map(m=>({...m,unlocked:total>=m.total})),
    next:STAR_MILESTONES.find(m=>total<m.total)||null};
}
