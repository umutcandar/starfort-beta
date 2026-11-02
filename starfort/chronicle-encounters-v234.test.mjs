import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createState} from './rules.js';
import {ACT_TWO_ENCOUNTERS,actTwoEncounter} from './act-two-encounters.js';
import {ACT_TWO_ABILITIES} from './act-two-abilities.js';
import {officialCombatScene} from './official-combat-scene.js';
import {officialBattleRoom} from './official-battle-bridge.js';
import {CHRONICLE_MILESTONES,chronicleState,chronicleMarkup} from './commander-chronicle.js';
import {ACCOUNT_ACTIONS} from './account-progression.js';
const now=Date.UTC(2026,10,2,18,0);
const state=createState(now);
const mission=(stage=2,wave=3,intent='shield')=>({
 mode:'act2',stage,wave,waves:3,turn:15,startedAt:now,lastTurnAt:now-300,
 lastAction:'skill:lyra',enemyIntent:intent,power:1450,enemyHp:120,enemyMaxHp:600,
 playerHp:490,playerMaxHp:720
});
test('every region has three original enemy patrols with 24 distinct compositions',()=>{
 assert.equal(ACT_TWO_ENCOUNTERS.length,8);
 assert.equal(new Set(ACT_TWO_ENCOUNTERS.map(x=>x.theme)).size,8);
 const signatures=new Set(),allNames=[];
 for(let s=1;s<=8;s++){
  const region=ACT_TWO_ENCOUNTERS[s-1];
  assert.equal(region.stage,s);
  assert.equal(region.waves.length,3);
  for(let w=1;w<=3;w++){
   const wave=actTwoEncounter(mission(s,w));
   assert.equal(wave.roster.length,3);
   assert.equal(wave.roster.filter(x=>x.kind==='boss').length,w===3?1:0);
   assert.ok(wave.roster.every(x=>['raider','caster','boss'].includes(x.kind)&&x.name.length>3));
   const key=wave.roster.map(x=>x.name).join('|');
   assert.ok(!signatures.has(key),key);signatures.add(key);
   allNames.push(...wave.roster.map(x=>x.name));
  }
 }
 assert.equal(signatures.size,24);assert.ok(new Set(allNames).size>=60);
 assert.equal(actTwoEncounter(mission(9,3)),null);
 assert.equal(actTwoEncounter({...mission(1,1),mode:'story'}),null);
});
test('two-dimensional sprite scene uses chapter roster, biome and distinct telegraphed boss auras',()=>{
 for(let i=1;i<=8;i++){
  const skill=ACT_TWO_ABILITIES[i-1];
  const html=officialCombatScene(state,mission(i,3,skill.trigger));
  assert.match(html,new RegExp('theme-'+ACT_TWO_ENCOUNTERS[i-1].theme));
  assert.ok(html.includes('boss-ability-live ability-'+skill.id),skill.id);
  assert.ok(html.includes(skill.name),skill.name);
  assert.ok(html.includes('act2-ability-banner'));
  for(const fighter of ACT_TWO_ENCOUNTERS[i-1].waves[2].roster)assert.ok(html.includes(fighter.name),fighter.name);
  const passive=officialCombatScene(state,mission(i,3,skill.trigger==='crush'?'drain':'crush'));
  assert.ok(!passive.includes('boss-ability-live'));
 }
});
test('3D bridge uses exactly the same named enemies and roles as the illustrated 2D fight',()=>{
 for(let i=1;i<=8;i++)for(let wave=1;wave<=3;wave++){
  const m=mission(i,w),r=officialBattleRoom(state.team,m,{now,previous:null});
  const expected=ACT_TWO_ENCOUNTERS[i-1].waves[wave-1].roster;
  assert.deepEqual(r.squads.map(x=>x.name),expected.map(x=>x.name));
  assert.deepEqual(r.squads.map(x=>x.type),expected.map(x=>x.kind));
  assert.equal(r.source,'authenticated-postgres');
 }
});
test('Chronicle has 30 ascending long-term goals and finite one-time claim values',()=>{
 assert.equal(CHRONICLE_MILESTONES.length,30);
 for(let i=0;i<30;i++){
  const m=CHRONICLE_MILESTONES[i];
  assert.equal(m.wins,2*(i+1)**2);
  assert.ok(m.gold>0&&m.aether>0);
  if(i)assert.ok(m.wins>CHRONICLE_MILESTONES[i-1].wins);
 }
 assert.equal(new Set(CHRONICLE_MILESTONES.map(x=>x.name)).size,30);
 assert.equal(CHRONICLE_MILESTONES[29].wins,1800);
});
test('Chronicle never unlocks unearned or out-of-sequence reward requests',()=>{
 const a={counters:{win:7},contractClaims:{'chronicle:1':2}};
 assert.deepEqual(chronicleState(a).claimed,1);
 assert.equal(chronicleState(a).next.wins,8);
 assert.equal(chronicleState(a).eligible,false);
 const markup=chronicleMarkup(a);
 assert.match(markup,/data-account-chronicle="2"/);
 assert.match(markup,/7 \/ 8 zafer/);
 assert.match(markup,/RÜTBE 02/);
 assert.match(markup,/disabled/);
 assert.equal(chronicleState({...a,counters:{win:8}}).eligible,true);
 const completed=Object.fromEntries(CHRONICLE_MILESTONES.map(x=>['chronicle:'+x.rank,x.wins]));
 assert.equal(chronicleState({counters:{win:1800},contractClaims:completed}).next,null);
 assert.match(chronicleMarkup({counters:{win:1800},contractClaims:completed}),/Ebedî Mareşal/);
});
test('real RPC and browser agree on milestone thresholds, one-time claims and atomic ledger',()=>{
 const sql=readFileSync(new URL('./sql/starfort-v234-commander-chronicle.sql',import.meta.url),'utf8');
 assert.ok(ACCOUNT_ACTIONS.includes('chronicle_claim'));
 assert.match(sql,/elsif p_action='chronicle_claim' then/);
 assert.match(sql,/counter_value<2\*req\*req/);
 assert.match(sql,/claims \? contract_key then raise exception/);
 assert.match(sql,/req>1 and not \(claims \? \('chronicle:'/);
 assert.match(sql,/resources:=jsonb_set\(resources/);
 assert.match(sql,/contract_claims=claims/);
 assert.match(sql,/insert into public.starfort_village_requests/);
 assert.match(sql,/revoke all on function public.sfb_starfort_progress/);
});
test('Chronicle is embedded in authenticated sefer screen, not guest save',()=>{
 const source=readFileSync(new URL('./account-expedition.js',import.meta.url),'utf8');
 const app=readFileSync(new URL('./app.js',import.meta.url),'utf8');
 assert.match(source,/chronicleMarkup\(account\)/);
 assert.match(app,/button\.dataset\.accountChronicle\?'chronicle_claim'/);
 assert.doesNotMatch(app,/saveGuard\.write\(state\)/);
});
