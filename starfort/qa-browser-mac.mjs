import {mkdtemp, mkdir, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const root=path.dirname(fileURLToPath(import.meta.url));
const out=path.join(root,'QA_BROWSER_SONUCLAR');
const db=await mkdtemp(path.join(tmpdir(),'starfort-browser-qa-'));
process.env.STARFORT_DATA_DIR=db; // Keep test accounts separate from real player saves.
const {createGuildServer}=await import('./guild-server.mjs');
await mkdir(out,{recursive:true});
const findings=[];
let server,browser;
const log=(status,text)=>{const line=`[${status}] ${text}`; findings.push(line); console.log(line);};
const snap=async(page,name)=>{await page.screenshot({path:path.join(out,name+'.png'),fullPage:false,timeout:15000});};

async function runCase(name,fn){
 try{await fn();log('GEÇTİ',name);}catch(error){log('HATA',`${name}: ${error.message}`);}
}
async function waitVisible(page,sel,timeout=20000){await page.locator(sel).first.waitFor({state:'visible',timeout});}
async function visit(page,base){
 await page.goto(base+'/starfort/',{waitUntil:'domcontentloaded',timeout:20000});
 await waitVisible(page,'#navigation [data-view="expedition"]');
 await page.waitForTimeout(800);
 assert.match(await page.title(),/Starfort/i);
}
async function scenario(label,viewport,options,base){
 const context=await browser.newContext({viewport,...options,acceptDownloads:true});
 const page=await context.newPage();
 const scriptErrors=[];
 page.on('pageerror',err=>scriptErrors.push(String(err)));
 page.on('console',msg=>{if(msg.type()==='error'&&!/WebGL|GL context|GPU/i.test(msg.text()))scriptErrors.push(msg.text());});
 try{
  await runCase(label+' · şehir açılışı',async()=>{
   await visit(page,base);
   assert.equal(await page.locator('.build-badge').innerText(),'v2.8.0');
   await snap(page,label+'_01_sehir');
  });
  for(const [view,description] of [['heroes','Kahramanlar'],['armory','Cephanelik'],['guild','İttifak'],['expedition','Seferler']]){
   await runCase(label+' · '+description+' menüsü',async()=>{
    await page.locator(`#navigation [data-view="${view}"]`).click();
    await waitVisible(page,'#workspace');
    assert.equal(await page.locator('#workspace').isHidden(),false);
   });
  }
  await runCase(label+' · Seferler görüntüsü',async()=>{
   await page.locator('#navigation [data-view="expedition"]').click();
   await waitVisible(page,'[data-quick-bot="duel"]');
   assert.equal(await page.locator('.contract-card').count(),3);
   assert.equal(await page.locator('.weekly-rift').count(),1);
   await snap(page,label+'_02_seferler');
  });
  await runCase(label+' · kozmetik konsept oylaması',async()=>{
   await page.locator('#navigation [data-view="shop"]').click();
   assert.equal(await page.locator('.concept-card').count(),4);
   await page.locator('[data-cosmetic-interest="castle-night"]').click();
   assert.equal(await page.locator('[data-cosmetic-interest="castle-night"]').getAttribute('aria-pressed'),'true');
   await snap(page,label+'_kozmetik');
   await page.locator('#navigation [data-view="expedition"]').click();
  });
  await runCase(label+' · botlu 1v1 başlatma',async()=>{
   await page.locator('[data-quick-bot="duel"]').click();
   await waitVisible(page,'#arena-canvas',25000);
   await page.waitForFunction(()=>document.querySelector('#arena-connection')?.textContent?.includes('Canlı düello sürüyor'),null,{timeout:25000});
   await snap(page,label+'_03_duello');
   await page.keyboard.down('d');await page.waitForTimeout(400);await page.keyboard.up('d');
   await page.keyboard.press('j');await page.waitForTimeout(400);
   assert.match(await page.locator('#arena-me-hp').innerText(),/\d+\/\d+/);
  });
  await runCase(label+' · botlu 5v5 kuşatma başlatma',async()=>{
   await page.locator('#workspace [data-close-view]:visible').first().click();
   await page.locator('#navigation [data-view="expedition"]').click();
   await waitVisible(page,'[data-quick-bot="siege"]');
   await page.locator('[data-quick-bot="siege"]').click();
   await waitVisible(page,'#team-canvas',25000);
   await page.waitForFunction(()=>document.querySelector('#team-status')?.textContent?.includes('CANLI MUHAREBE'),null,{timeout:25000});
   await snap(page,label+'_04_kusatma');
   await page.locator('[data-squad-select="guard"]').click();
   await page.locator('[data-team-order="push"]').click();
   assert.equal(await page.locator('[data-squad-select="guard"]').getAttribute('aria-pressed'),'true');
   await page.locator('[data-team-map]').click();
   await snap(page,label+'_05_taktik');
  });
  await runCase(label+' · JavaScript çalışma hataları',async()=>{
   if(scriptErrors.length) throw Error(scriptErrors.slice(0,5).join(' | '));
  });
 }finally{await context.close();}
}
try{
 server=await createGuildServer({host:'127.0.0.1',port:0});
 const base='http://127.0.0.1:'+server.address().port;
 try{browser=await chromium.launch({channel:'chrome',headless:true,args:['--disable-dev-shm-usage']});}
 catch(error){throw Error('Google Chrome başlatılamadı. Chrome kurulu olmalı. '+error.message);}
 await scenario('masaustu',{width:1440,height:900},{deviceScaleFactor:1},base);
 await scenario('mobil_yatay',{width:844,height:390},{isMobile:true,hasTouch:true,deviceScaleFactor:2},base);
} catch(error){log('HATA','Test altyapısı: '+error.stack);}
finally{
 await browser?.close().catch(()=>{});
 if(server)await new Promise(resolve=>server.close(resolve));
 await rm(db,{recursive:true,force:true});
 const passed=findings.filter(s=>s.startsWith('[GEÇTİ]')).length;
 const failed=findings.filter(s=>s.startsWith('[HATA]')).length;
 const summary=['STARFORT TARAYICI TESTİ',`Tarih: ${new Date().toISOString()}`,`Başarılı: ${passed}`,`Hatalı: ${failed}`,'',...findings,'',
 'Bu rapor yalnızca otomatik menü ve botlu maç açılış senaryolarını kapsar.','Fiziksel iPhone FPS ve grafik kalite onayı değildir.'].join('\n');
 await writeFile(path.join(out,'RAPOR.txt'),summary,'utf8');
 console.log('\nRapor ve ekran görüntüleri:',out);
 if(failed)process.exitCode=1;
}
