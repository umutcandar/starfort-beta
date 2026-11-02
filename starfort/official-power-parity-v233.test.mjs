import test from 'node:test';
import assert from 'node:assert/strict';
import {createState} from './rules.js';
import {officialServerTeamPower} from './official-server-team-power.js';
import {secondActMarkup} from './second-act-view.js';
const T=Date.UTC(2026,10,2,18);
const profile=()=>({heroes:{aldren:1,lyra:1,rovan:1},team:['aldren','lyra','rovan'],loadouts:{},itemUpgrades:{},cleared:[1,2,3,4,5,6,7,8],act2Cleared:[],act2Stars:{},campaignStars:{},mazeFloor:0,mission:null});
test('online team power uses server base attack and HP, not inferred local rewards',()=>{
 const v=createState(T),account=profile();
 assert.equal(officialServerTeamPower(v,account),267);
 assert.equal(officialServerTeamPower(v,{...account,team:['aldren']}),0);
});
test('server-computed power includes gear, enchantments and faction sets',()=>{
 const v=createState(T),p=profile();
 v.buildings.forge=5;v.buildings.tavern=4;
 p.heroes.aldren=12;
 const baseline=officialServerTeamPower(v,p);
 p.loadouts.aldren={weapon:'star_spear',armor:'moon_watch',relic:'lunar_charm'};
 p.itemUpgrades.star_spear=3;
 assert.equal(officialServerTeamPower(v,p),baseline+22+23+12+18+27);
});
test('second act shows server-accurate unlock requirement before any battle starts',()=>{
 const v=createState(T),p=profile(),html=secondActMarkup(v,p,null);
 assert.ok(officialServerTeamPower(v,p)<805);
 assert.match(html,/Gerekli güç 805/);
 assert.match(html,/data-realm-mission="act2:1"/);
});
