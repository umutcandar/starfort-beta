import {restoreState,STORAGE_KEY} from './rules.js';
export function exportSave(state,now=new Date()){
  return JSON.stringify({format:'starfort-save',exportedAt:now.toISOString(),key:STORAGE_KEY,state},null,2);
}
export function importSave(content){
  if(typeof content!=='string'||content.length>2_000_000)throw new Error('Kayıt dosyası boyutu geçersiz.');
  let data;try{data=JSON.parse(content)}catch{throw new Error('Kayıt dosyası JSON değil.')}
  if(data?.format!=='starfort-save'||data.key!==STORAGE_KEY||data.state?.version!==1)throw new Error('Bu dosya Starfort kayıt yedeği değil.');
  if(!data.state.res||typeof data.state.res!=='object'||!data.state.buildings||typeof data.state.buildings!=='object'||!Array.isArray(data.state.team)||!data.state.heroes||typeof data.state.heroes!=='object')throw new Error('Eksik veya bozuk Starfort kayıt verisi.');
  const restored=restoreState(data.state);
  if(!restored||!restored.team?.length||!restored.res)throw new Error('Kayıt geçersiz.');
  return restored;
}
