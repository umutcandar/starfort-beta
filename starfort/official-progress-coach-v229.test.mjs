import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as R from './rules.js';
import {officialNextGoal,officialNextGoalMarkup,isoWeek} from './official-progress-coach.js';
import {commanderPath} from './commander-path.js';
import {accountServerView} from './account-progression.js';
import {accountExpeditionMarkup} from './account-expedition.js';
const T=Date.UTC(2026,10,2,9);
const game=()=>R.createState(T);
const profile=(override={})=>({heroes:{aldren:1,lyra:1,rovan:1},inventory:{iron_sword:1,ward_mail:1},loadouts:{},team:['aldren','lyra','rovan'],cleared:[],
 campaignStars:{},veteranMedals:{},mazeFloor:0,mission:null,riftWeek:null,itemUpgrades:{},worldBoss:null,contractClaims:{},counters:{win:0,hero:0,forge:0,maze:0,rift:0,veteran:0},titles:[],...override});
test('a legitimate fresh player sees a real equip action, not the local test save progression',()=>{
 const s=game(),p=profile(),v=accountServerView(s,p);
 assert.equal(officialNextGoal(v,p,T).id,'equip');
 assert.equal(officialNextGoal(v,p,T).action,'armory');
 const cheated=game();cheated.cleared=[1,2,3,4,5,6,7,8];cheated.heroes.aldren.level=20;cheated.riftRecords=[{week:'2026-45'}];
 const trusted=accountServerView(cheated,p);
 assert.equal(officialNextGoal(trusted,p,T).id,'equip','client progress cannot earn official milestones');
 assert.equal(commanderPath(trusted).steps.find(x=>x.id==='finish-campaign').completed,false);
 assert.equal(commanderPath(trusted).steps.find(x=>x.id==='rift').completed,false);
});
test('server game state genuinely drives progression steps, veteran and weekly rift',()=>{
 const p=profile({cleared:[1,2,3,4,5,6,7,8],loadouts:{aldren:{weapon:'iron_sword'}},veteranMedals:{1:1},riftWeek:'2026-44'});
 const s=accountServerView(game(),p);
 assert.equal(commanderPath(s).steps.find(x=>x.id==='finish-campaign').completed,true);
 assert.equal(commanderPath(s).steps.find(x=>x.id==='veteran').completed,true);
 assert.equal(commanderPath(s).steps.find(x=>x.id==='rift').completed,true);
 assert.equal(officialNextGoal(s,p,T).id,'maze');
 p.mazeFloor=16;
 assert.equal(officialNextGoal(s,p,T).id,'stars');
 p.campaignStars=Object.fromEntries(Array.from({length:8},(_,i)=>[i+1,3]));
 assert.equal(officialNextGoal(s,p,T).id,'veteran');
 p.veteranMedals=Object.fromEntries(Array.from({length:8},(_,i)=>[i+1,3]));
 assert.equal(officialNextGoal(s,p,T).id,'rift');
 p.riftWeek=isoWeek(T);
 assert.equal(officialNextGoal(s,p,T).id,'long-game');
});
test('active official combat wins over all other recommendations, and teacher never invents a claim',()=>{
 const s=accountServerView(game(),profile()),p=profile({mission:{mode:'story',stage:1,turn:0,lastAction:'Başladı'}});
 const goal=officialNextGoal(s,p,T);
 assert.equal(goal.id,'mission');assert.equal(goal.action,'campaign');
 const html=officialNextGoalMarkup({...goal,title:'<img src=x onerror=alert(1)>',detail:'<script>bad</script>'});
 assert.doesNotMatch(html,/<script>|<img src=x/);
 assert.match(html,/&lt;script&gt;/);
 assert.match(html,/Sıradaki doğrulanmış hedef/);
});
test('UTC ISO week comparisons handle New Year safely',()=>{
 assert.equal(isoWeek(Date.UTC(2026,11,31)),'2026-53');
 assert.equal(isoWeek(Date.UTC(2027,0,1)),'2026-53');
 assert.equal(isoWeek(Date.UTC(2027,0,4)),'2027-01');
 assert.equal(isoWeek(Date.UTC(2026,10,2)),'2026-45');
});
test('server veteran tier guard is in the applied SQL and bypass cannot be done through a forged button',()=>{
 const s=readFileSync(new URL('./sql/starfort-v229-veteran-sequence.sql',import.meta.url),'utf8');
 assert.match(s,/tier>least\(3,coalesce\(\(veteran->>stage::text\)::integer,0\)\+1\)/);
 assert.match(s,/Önce önceki usta seferi kademesini tamamla/);
 assert.match(s,/where user_id=u for update/);
 assert.match(s,/p_target!~'\^\[1-8\]\$'/);
 const app=readFileSync(new URL('./app.js',import.meta.url),'utf8');
 assert.match(app,/commanderPath\(villageView\(\)\)/);
 assert.match(app,/accountProgressAction/);
 const html=accountExpeditionMarkup(signedInView(),profile());
 assert.match(html,/official-next-goal/);
});
function signedInView(){return accountServerView(game(),profile());}
