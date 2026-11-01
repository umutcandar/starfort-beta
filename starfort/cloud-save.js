import {SUPABASE_URL,SUPABASE_KEY} from './online-config.js';
// Separate manual cloud backup API; no automatic synchronization or PvP currency authority.
export async function cloudSaveRequest(route,token,data={},fetcher=fetch) {
  if(!['save/get','save/put','save/delete'].includes(route))throw new Error('Bilinmeyen bulut işlemi.');
  if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))throw new Error('Önce İttifak bölümünden komutan hesabı oluştur.');
  if(!SUPABASE_URL||!SUPABASE_KEY)throw new Error('Bulut bağlantısı yapılandırılmamış.');
  let response;
  try {
    response=await fetcher(`${SUPABASE_URL}/rest/v1/rpc/sfb_save_api`,{
      method:'POST',signal:AbortSignal.timeout(10000),
      headers:{'Content-Type':'application/json',apikey:SUPABASE_KEY},
      body:JSON.stringify({route,token,data}),
    });
  } catch { throw new Error('Bulut sunucusuna ulaşılamadı. Yerel kaydın değişmedi.'); }
  let payload;
  try { payload=await response.json(); }
  catch { throw new Error('Bulut sunucusu geçersiz yanıt verdi. Yerel kaydın değişmedi.'); }
  if(!response.ok || !payload || payload.status>=300)
    throw new Error(payload?.body?.error||'Bulut kayıt işlemi başarısız.');
  return payload.body;
}
export function cloudBackupSummary(record) {
  if(!record || record.exists!==true)return {exists:false,revision:0,savedAt:null};
  return {exists:true,revision:Number.isInteger(record.revision)?record.revision:0,savedAt:record.savedAt||null};
}
