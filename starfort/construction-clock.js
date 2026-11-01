// Beta construction requires a fresh Node-server clock for paid, timed
// upgrades and for delivery. This prevents casual wall-clock shortcuts.
// The underlying save is still client-owned: this is NOT anti-tamper security.
const LIVE='https://starfort-online-beta.onrender.com';
export const constructionClockBase=(loc=globalThis.location)=>loc&&(/^(localhost|127\.0\.0\.1)$/.test(loc.hostname)||loc.hostname.endsWith('.onrender.com'))
 ?loc.origin:LIVE;
export async function trustedConstructionNow({fetcher=globalThis.fetch,base=constructionClockBase(),timeoutMs=15000}={}){
 let response;
 try{
  response=await fetcher(base+'/api/clock',{method:'GET',cache:'no-store',signal:AbortSignal.timeout(timeoutMs)});
 }catch{throw new Error('İnşaat saatine ulaşılamıyor. Çevrim içi sunucuya bağlanıp tekrar dene.');}
 if(!response?.ok)throw new Error('İnşaat saati doğrulanamadı. İşlem yapılmadı.');
 let data;
 try{data=await response.json();}catch{throw new Error('İnşaat saati geçersiz yanıt verdi.');}
 if(data?.ok!==true||data.source!=='starfort-server'||!Number.isSafeInteger(data.now)||data.now<1600000000000)
  throw new Error('İnşaat saati güvenilir bir yanıt vermedi.');
 return data.now;
}
