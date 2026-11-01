import {exportSave,importSave} from './backup.js';
export const RECOVERY_PREFIX='starfort:recovery:';
export function recoveryPoints(storage){
  const result=[];
  try{
    for(let i=0;i<storage.length;i++){
      const key=storage.key(i);
      if(!key?.startsWith(RECOVERY_PREFIX))continue;
      try{
        const payload=storage.getItem(key),state=importSave(payload);
        result.push({key,createdAt:key.slice(RECOVERY_PREFIX.length),state,bytes:payload.length});
      }catch{/* One corrupt checkpoint must not hide other valid copies. */}
    }
  }catch{return result.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));}
  return result.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
}
export function makeRecoveryPoint(storage,state,now=Date.now()){
  // Validate before writing any recovery data. A bad checkpoint is not safety.
  const data=exportSave(importSave(exportSave(state)));
  const date=new Date(now);
  if(!Number.isFinite(date.getTime()))throw Error('Kurtarma tarihi geçersiz.');
  const key=RECOVERY_PREFIX+date.toISOString()+'-'+Math.random().toString(36).slice(2,8);
  // If Storage is out of space, do not delete good checkpoints or touch the save.
  storage.setItem(key,data);
  const list=recoveryPoints(storage);
  for(const old of list.slice(3))storage.removeItem(old.key);
  return {key,bytes:data.length};
}
export function loadRecoveryPoint(storage,key){
  if(typeof key!=='string'||!key.startsWith(RECOVERY_PREFIX))throw Error('Geçersiz kurtarma kaydı.');
  const raw=storage.getItem(key);
  if(!raw)throw Error('Kurtarma kaydı bulunamadı.');
  return importSave(raw);
}
