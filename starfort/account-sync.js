// Account-based cloud sync is optional, never a trusted PvP economy ledger.
// Client writes use an expected revision; a divergent device is never silently overwritten.
export function createAccountSync({fetchRemote,saveRemote,readLocal,validateLocal,onStatus=()=>{},onConflict=()=>{},schedule=(fn,ms)=>setTimeout(fn,ms),cancel=id=>clearTimeout(id)}){
  let enabled=false,revision=null,baseline=null,timer=null,inFlight=false,status='disconnected',pending=false,identity=0;
  const snapshot=()=>JSON.stringify(validateLocal(readLocal()));
  const emit=(next,detail='')=>{status=next;onStatus({status,revision,detail});};
  function stop(){
    identity++;
    enabled=false;pending=false;
    if(timer!==null){cancel(timer);timer=null;}
    revision=null;baseline=null;emit('disconnected');
  }
  async function start(){
    const run=++identity;
    enabled=false;pending=false;
    if(timer!==null){cancel(timer);timer=null;}
    revision=null;baseline=null;emit('checking');
    try{
      const remote=await fetchRemote();
      if(run!==identity)return false;
      const local=snapshot();
      if(remote===null){
        revision=0;baseline=local;enabled=true;emit('synced','Yeni hesap yedeği oluşturuluyor.');
        await flush();return status==='synced';
      }
      const remoteData=JSON.stringify(validateLocal(remote.state));
      revision=remote.revision;
      if(remoteData!==local){
        emit('conflict','Bulut ve bu cihazdaki kayıt farklı. Hiçbiri değiştirilmedi.');
        onConflict({revision,local,remote:remoteData});
        return false;
      }
      baseline=local;enabled=true;emit('synced');return true;
    }catch(error){if(run!==identity)return false;emit('offline',error.message);return false;}
  }
  async function flush(){
    if(!enabled||status==='conflict'||inFlight)return false;
    if(timer!==null){cancel(timer);timer=null;}
    let current;try{current=snapshot();}catch(error){emit('error',error.message);return false;}
    if(current===baseline && revision!==0){pending=false;emit('synced');return true;}
    inFlight=true;emit('uploading');
    const gen=identity,expected=revision,original=current;
    try{
      const saved=await saveRemote(JSON.parse(current),expected);
      if(gen!==identity)return false;
      if(!saved||!Number.isInteger(saved.revision)||saved.revision!==expected+1)throw Error('Bulut kayıt sürümü doğrulanamadı.');
      revision=saved.revision;baseline=original;
      const changed=snapshot()!==original;
      pending=changed;
      emit('synced',changed?'Son değişiklikler sıraya alındı.':'Bulut ve yerel kayıt eşit.');
      return true;
    }catch(error){
      if(gen!==identity)return false;
      enabled=false;emit('conflict',error.message||'Bulut sürüm çatışması.');
      onConflict({revision,error});
      return false;
    }finally{inFlight=false;if(enabled&&pending)noteSaved();}
  }
  function noteSaved(){
    if(!enabled)return false;
    pending=true;
    if(timer!==null)cancel(timer);
    timer=schedule(()=>{timer=null;void flush();},1800);
    return true;
  }
  async function refresh(){
    if(inFlight||status==='checking'||status==='uploading')return false;
    if(!enabled)return start();
    try{
      const remote=await fetchRemote();
      const serverRev=remote?.revision||0;
      if(serverRev!==revision){
        enabled=false;revision=serverRev;emit('conflict','Başka cihazda yeni kayıt var. Yerel oyun korunuyor.');
        onConflict({revision});
        return false;
      }
      if(snapshot()!==baseline)noteSaved();
      return true;
    }catch(error){emit('offline',error.message);return false;}
  }
  // Explicit action only. The UI must confirm backup/overwrite before calling.
  async function useLocal(){
    const remote=await fetchRemote();
    const current=snapshot();
    const expected=remote?.revision||0;
    const result=await saveRemote(JSON.parse(current),expected);
    if(!result||result.revision!==expected+1)throw Error('Bulut kayıt işlemi başarısız.');
    revision=result.revision;baseline=current;enabled=true;pending=false;emit('synced');
    return true;
  }
  return {start,stop,flush,noteSaved,refresh,useLocal,
    get status(){return status;},get revision(){return revision;},
    get enabled(){return enabled;},get dirty(){return enabled&&pending;}};
}
