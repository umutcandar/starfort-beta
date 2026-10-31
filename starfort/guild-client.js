/** Opt-in development-server connection. Never sends the player's local game save. */
export const GUILD_TOKEN_KEY='starfort:guild-token';
export const STARFORT_BETA_CODE_KEY='starfort:beta-test-code';
export async function guildRequest(route,token=null,data=null){
  let body=data;
  if(route==='register'&&body){
    let stored='';
    try{stored=globalThis.sessionStorage?.getItem(STARFORT_BETA_CODE_KEY)||'';}catch{}
    if(stored)body={...body,testCode:stored};
  }
  async function send(payload){
    const response=await fetch(`/api/${route}`,{method:payload===null?'GET':'POST',signal:AbortSignal.timeout(6500),
      headers:{...(token?{'Authorization':`Bearer ${token}`} :{}),...(payload===null?{}:{'Content-Type':'application/json'})},
      ...(payload===null?{}:{body:JSON.stringify(payload)})});
    const result=await response.json();
    return {response,result};
  }
  let {response,result}=await send(body);
  if(route==='register'&&response.status===403&&result.code==='INVITE_REQUIRED'&&typeof globalThis.prompt==='function'){
    // Prompt only if the server explicitly requests an invite code; local play remains unchanged.
    let code=globalThis.prompt('Starfort çevrim içi beta giriş kodunu yaz:');
    code=typeof code==='string'?code.trim():'';
    if(!code)throw new Error('Test sunucusu giriş kodu gerekli.');
    ({response,result}=await send({...data,testCode:code}));
    if(response.ok){try{globalThis.sessionStorage?.setItem(STARFORT_BETA_CODE_KEY,code);}catch{}}
    else{try{globalThis.sessionStorage?.removeItem(STARFORT_BETA_CODE_KEY);}catch{}}
  }
  if(!response.ok)throw new Error(result.error||'Sunucuda işlem gerçekleştirilemedi.');
  return result;
}
export const guildOnline=()=>guildRequest('status');
