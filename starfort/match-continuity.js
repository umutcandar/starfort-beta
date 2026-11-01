// Device-side continuity hints only. Never determines authoritative match results.
export function createMatchContinuity(storage,key){
  let previous=null;
  try{previous=JSON.parse(storage?.getItem(key)||'null');}catch{}
  if(!previous||typeof previous.epoch!=='string'||typeof previous.roomId!=='string')previous=null;
  const save=value=>{try{if(value)storage?.setItem(key,JSON.stringify(value));else storage?.removeItem(key);}catch{}};
  function accept(next){
    if(!next||typeof next!=='object')throw Error('Sunucudan maç durumu alınamadı.');
    if(next.status==='active'&&typeof next.room?.id==='string'&&typeof next.serverEpoch==='string'){
      previous={roomId:next.room.id,epoch:next.serverEpoch};
      save(previous);
      return {...next,reconnected:true};
    }
    if(next.status==='ended'){
      previous=null;save(null);return next;
    }
    if(next.status==='idle'&&previous){
      const changed=next.serverEpoch&&previous.epoch!==next.serverEpoch;
      const info=changed
        ?'Oyun sunucusu yeniden başladı. Devam eden maç iptal edildi; yenilgi yazılmadı.'
        :'Önceki maç oturumu artık sunucuda bulunmuyor. Yeni maç başlatabilirsin.';
      previous=null;save(null);
      return {...next,status:'interrupted',reason:changed?'server-restart':'match-expired',message:info};
    }
    return next;
  }
  return {accept,get pending(){return previous},clear(){previous=null;save(null);}};
}
