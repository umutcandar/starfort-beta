import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
test('campaign progress is shown before optional arena and bot modes',()=>{
 const app=read('./app.js');
 const start=app.indexOf('function renderExpedition()');
 const end=app.indexOf('function renderJournal()',start);
 assert.ok(start>=0 && end>start);
 const expedition=app.slice(start,end);
 assert.ok(expedition.indexOf('class="stage-list"') < expedition.indexOf('class="mode-hub"'));
 assert.ok(expedition.indexOf('class="progress-banner"') < expedition.indexOf('class="stage-list"'));
 assert.match(expedition,/battlePolicy.liveMatchmaking/);
 assert.match(expedition,/details class="mode-hub"/);
});
test('team combat defaults to the cinematic renderer and does not contain giant poster',()=>{
 const team=read('./team-view.js'),arena=read('./arena-view.js');
 for(const view of [team,arena]){
  assert.match(view,/battleExperience\(window.location/);
  assert.match(view,/renderMode=policy.renderMode/);
  assert.match(view,/policy.graphicsLab/);
  assert.match(view,/policy.liveMatchmaking/);
 }
 assert.doesNotMatch(team,/class="team-siege-poster"/);
 assert.match(team,/class="mode-group-board"/);
 for(const kind of ['team-bot','team-mode','team-party'])assert.match(team,new RegExp('data-'+kind));
 assert.match(read('./cohesion.css'),/#workspace\.sf-battle-live \.mode-group-board/);
});
test('all eight battlefield atmosphere styles and app-linked stylesheets exist',()=>{
 const css=read('./battle-atmosphere.css'),html=read('./index.html');
 for(const mood of ['ash','chapel','forest','iron','crypt','frost','eclipse','void'])assert.match(css,new RegExp('\\.scene-'+mood+'\\b'));
 for(const sheet of ['battle-atmosphere.css','cohesion.css'])assert.ok(html.includes('href="'+sheet+'"'));
});
