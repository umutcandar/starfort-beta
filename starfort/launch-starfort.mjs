/** Local Starfort launcher: prefer 8897 and fall back only if occupied. */
import {spawn} from 'node:child_process';
import {createGuildServer} from './guild-server.mjs';

export function candidatePorts(requested=8877,attempts=20){
  const start=Number(requested);
  if(!Number.isInteger(start)||start<1024||start>65535)throw new Error('Geçersiz port numarası.');
  return Array.from({length:Math.max(1,Math.min(20,attempts))},(_,i)=>start+i).filter(port=>port<=65535);
}

export function openGame(url,platform=process.platform){
  try {
    const cmd=platform==='darwin'?'open':platform==='win32'?'cmd':'xdg-open';
    const args=platform==='win32'?['/c','start','',url]:[url];
    const child=spawn(cmd,args,{detached:true,stdio:'ignore',windowsHide:true});
    child.on('error',()=>console.log(`Tarayıcı otomatik açılmadı; şu adresi aç: ${url}`));
    child.unref();
  }catch{console.log(`Tarayıcı otomatik açılmadı; şu adresi aç: ${url}`);}
}

export async function startLocalGame({preferredPort=Number(process.env.PORT||8897),host='127.0.0.1',browser=true}={}) {
  let lastError;
  for(const port of candidatePorts(preferredPort)){
    try {
      const server=await createGuildServer({host,port});
      const url=`http://${host}:${port}/starfort/`;
      console.log(`\n★ STARFORT v2.6.1: ${url}`);
      console.log(`3B deneme: ${url}graphics-3d-preview.html`);
      console.log('Oyun oynanırken bu terminali açık tut. Kapatmak için Ctrl+C.\n');
      if(browser)openGame(url);
      return {server,url,port};
    } catch(error){
      if(error.code==='EADDRINUSE'||error.code==='EACCES'){
        console.warn(`Port ${port} kullanılıyor; sonraki boş port deneniyor.`);
        lastError=error;
        continue;
      }
      throw error;
    }
  }
  throw lastError||new Error('Uygun boş port bulunamadı.');
}
if(process.argv[1]&&import.meta.url===new URL(`file://${process.argv[1]}`).href){
  startLocalGame().catch(error=>{console.error('Starfort başlatılamadı:',error.message);process.exitCode=1;});
}
