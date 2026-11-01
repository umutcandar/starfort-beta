// Guard against a background/old tab overwriting newer local progress.
// All direct writes to the game save must use this guard. We fail closed on a
// conflicting version; never silently merge independent inventories.
export function createSaveGuard(storage,key,initialRaw=storage.getItem(key)){
 let baseline=initialRaw,conflicted=false;
 function check(){
   if(conflicted)return false;
   if(storage.getItem(key)!==baseline){conflicted=true;return false;}
   return true;
 }
 return {
   get conflicted(){return conflicted;},
   check,
   observe(newValue){
     if(newValue!==baseline){conflicted=true;return false;}
     return true;
   },
   write(state){
     if(!check())return false;
     const next=JSON.stringify(state);
     storage.setItem(key,next);
     baseline=next;
     return true;
   },
   // Explicitly restoring a file may overwrite this *tab's* known current save,
   // but only if no other tab has changed that save since the last check.
   get baseline(){return baseline;}
 };
}
