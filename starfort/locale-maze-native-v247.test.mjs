import test from 'node:test';
import assert from 'node:assert/strict';
import {SUPPORTED_LOCALES,setLocale} from './locale-v243.js';
import {MAZE_TRANSLATIONS,MAZE_ENGLISH_KEYS,MAZE_GATE_TEXT,mazeGateText,auditMazePhrases} from './locale-maze-native-v247.js';
import {labyrinthMarkup,translatedMazeZone} from './labyrinth-view.js';
import {createState} from './rules.js';
test('all 30 labyrinth screen labels and eight zone expressions translate in twelve additional languages',()=>{
 assert.equal(MAZE_ENGLISH_KEYS.length,38);assert.deepEqual(auditMazePhrases(),[]);
 for(const code of SUPPORTED_LOCALES.filter(x=>x!=='tr'&&x!=='en')){
  assert.deepEqual(Object.keys(MAZE_TRANSLATIONS[code]).sort(),[...MAZE_ENGLISH_KEYS].sort());
  for(const value of Object.values(MAZE_TRANSLATIONS[code]))assert.ok(value.trim());
 }
});
test('native lab map and dynamic story chapter requirement never mutate rewards or floor graph',()=>{
 const state=createState(Date.UTC(2026,10,3));const before=JSON.stringify(state);
 try{for(const code of SUPPORTED_LOCALES){setLocale(code);
  const html=labyrinthMarkup(state);
  const expected=code==='tr'?'Yıldızın Yeminini Tamamladın':code==='en'?'You fulfilled the Star Oath':MAZE_TRANSLATIONS[code]['You fulfilled the Star Oath'];
  assert.ok(expected&&expected.length);
  assert.ok(html.includes(mazeGateText(1)));
  assert.ok(html.includes('data-view="expedition"'));
  assert.ok(html.includes(translatedMazeZone({name:'Kül Merdivenleri',hint:'Yıldız Vadisi altındaki unutulmuş kül ocakları'}).name));
  assert.ok(MAZE_GATE_TEXT[code].includes('{chapters}'));
  assert.equal(JSON.stringify(state),before);
 }}finally{setLocale('tr');}
});
