/** Native narrative for Act I, preserving existing canonical Turkish and English fallback.
 * All 12 additional locales contain 24 operation titles/objectives and 8 chapter descriptions.
 * No combat, rewards, ID or save logic lives in this module.
 */
import {getLocale,SUPPORTED_LOCALES} from './locale-v243.js';
import {ACT_ONE_EU} from './locale-story-eu-v247.js';
import {ACT_ONE_ASIA} from './locale-story-asia-v247.js';
export const ACT_ONE_NATIVE=Object.freeze({...ACT_ONE_EU,...ACT_ONE_ASIA});
export function storyOperationNative(id){return ACT_ONE_NATIVE[getLocale()]?.operations?.[String(id)]||null;}
export function storyChapterNative(id){return ACT_ONE_NATIVE[getLocale()]?.stages?.[String(id)]||null;}
export function auditActOne(){
 return SUPPORTED_LOCALES.filter(l=>l!=='tr'&&l!=='en').flatMap(locale=>{
  const data=ACT_ONE_NATIVE[locale],errors=[];
  if(!data)return [locale+': no native narrative'];
  for(let chapter=1;chapter<=8;chapter++){
   if(!data.stages[chapter]?.trim())errors.push(locale+': chapter '+chapter);
   for(let wave=1;wave<=3;wave++){
    const id=chapter+'-'+wave,op=data.operations[id];
    if(!op?.title?.trim()||!op?.objective?.trim())errors.push(locale+': mission '+id);
   }
  }
  return errors;
 });
}
