/** Manual opt-in QA loop. Runs only while this terminal/computer stays on. */
import {spawn} from 'node:child_process';
const delay=Number(process.env.QA_INTERVAL_MS||300000);
if(!Number.isFinite(delay)||delay<10000)throw Error('QA_INTERVAL_MS must be at least 10000 ms');
console.log('Starfort continuous local QA: running every '+Math.round(delay/1000)+' s. Ctrl+C to stop.');
let stopped=false;
process.on('SIGINT',()=>{stopped=true;process.exit(0)});
async function audit(){
  const parts=[['game','qa:game'],['guild server','qa:server'],['syntax','qa:syntax']];
  const results=await Promise.all(parts.map(([label,cmd])=>new Promise(resolve=>{
    const child=spawn(process.platform==='win32'?'npm.cmd':'npm',['run',cmd],{stdio:['ignore','pipe','pipe']});let output='';
    child.stdout.on('data',d=>output+=d);child.stderr.on('data',d=>output+=d);
    child.on('error',e=>resolve({label,code:1,output:String(e)}));child.on('close',code=>resolve({label,code,output}));
  })));
  const date=new Date().toISOString();for(const r of results){console.log(date,r.label,r.code===0?'PASS':'FAIL');if(r.code)console.error(r.output.slice(-3000));}
  return results.every(r=>r.code===0);
}
while(!stopped){await audit();await new Promise(r=>setTimeout(r,delay));}
