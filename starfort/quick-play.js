/** Optional, explicitly user-initiated local test account; never touches campaign progress. */
import {GUILD_TOKEN_KEY} from './guild-client.js';
export async function ensureTestCommander({storage,request,random=()=>crypto.getRandomValues(new Uint32Array(1))[0]}={}){
  const existing=storage.getItem(GUILD_TOKEN_KEY);
  if(existing){
    try{await request('me',existing);return existing;}
    catch(error){if(!/oturum yok|yetkisiz|unauthorized|401/i.test(error?.message||''))throw error;}
  }
  const suffix=String(random() % 1000000).padStart(6,'0');
  const response=await request('register',null,{name:'Deneme '+suffix});
  if(typeof response?.token!=='string'||!(/^[a-f0-9]{64}$/.test(response.token)))throw Error('Deneme komutanı kaydı doğrulanamadı.');
  storage.setItem(GUILD_TOKEN_KEY,response.token);
  return response.token;
}
