import test from 'node:test';import assert from 'node:assert/strict';
import {WEEK_MS,newWeeklyRaid,rotateGuildRaids,raidWeek,RAID_BOSSES} from './guild-weekly-raid.js';
const at=week=>week*WEEK_MS+1000;
test('weekly raid rotation changes boss, retains win count, resets only once',()=>{
 const g={raid:{...newWeeklyRaid(at(3000)),health:1,damage:2499,completed:true,attacks:[{userId:'a'}]},raidWins:11};
 const db={guilds:[g]};assert.equal(rotateGuildRaids(db,at(3000)),false);
 assert.equal(rotateGuildRaids(db,at(3001)),true);
 assert.equal(g.raid.health,2500);assert.equal(g.raid.damage,0);assert.equal(g.raid.completed,false);
 assert.deepEqual(g.raid.attacks,[]);assert.equal(g.raidWins,11);
 assert.equal(g.raid.bossId,RAID_BOSSES[3001%RAID_BOSSES.length].id);
 assert.equal(rotateGuildRaids(db,at(3001)),false);
});
test('legacy saved guild raids upgrade without erasing progress',()=>{
 const db={guilds:[{raid:{health:500,maxHealth:2500,damage:2000,completed:false,attacks:[]}},
 {raid:{health:0,maxHealth:2500,damage:2500,completed:true,attacks:[]}}]};
 assert.equal(rotateGuildRaids(db,at(3010)),true);
 assert.equal(db.guilds[0].raid.health,500);assert.equal(db.guilds[1].raid.health,0);
 assert.equal(db.guilds[0].raidWins,0);assert.equal(db.guilds[1].raidWins,1);
 assert.equal(rotateGuildRaids(db,at(3010)),false);
});
test('UTC boundary matches advertised next reset date',()=>{
 const r=newWeeklyRaid(at(3000));assert.equal(r.nextResetAt,3001*WEEK_MS);
 assert.equal(raidWeek(3001*WEEK_MS-1),3000);assert.equal(raidWeek(3001*WEEK_MS),3001);
});
