/** Rotating server-owned weekly guild raid (UTC weeks). */
export const WEEK_MS=7*24*60*60*1000;
export const RAID_BOSSES=Object.freeze([{id:'shadow',name:'Gölge Muhafızı'},{id:'iron',name:'Demir Yıkıcı'},{id:'frost',name:'Ayaz Devi'},{id:'ember',name:'Kor Ejderi'}]);
export function raidWeek(now=Date.now()){return Math.floor((Number.isFinite(now)&&now>=0?now:Date.now())/WEEK_MS);}
export function newWeeklyRaid(now=Date.now()){
 const week=raidWeek(now),boss=RAID_BOSSES[week%RAID_BOSSES.length];
 return {week,bossId:boss.id,bossName:boss.name,nextResetAt:(week+1)*WEEK_MS,health:2500,maxHealth:2500,damage:0,completed:false,attacks:[]};
}
export function rotateGuildRaids(db,now=Date.now()){
 if(!Array.isArray(db?.guilds))return false;
 const week=raidWeek(now),template=newWeeklyRaid(now);let changed=false;
 for(const guild of db.guilds){
  if(!guild||typeof guild!=='object')continue;
  if(!guild.raid||typeof guild.raid!=='object'){guild.raid={...template,attacks:[]};changed=true;continue;}
  if(!Number.isInteger(guild.raid.week)){
   guild.raid.week=week;guild.raid.bossId=template.bossId;guild.raid.bossName=template.bossName;guild.raid.nextResetAt=template.nextResetAt;
   if(!Number.isInteger(guild.raidWins))guild.raidWins=guild.raid.completed?1:0;
   changed=true;
  }else if(guild.raid.week<week){guild.raid={...template,attacks:[]};changed=true;}
 }
 return changed;
}
