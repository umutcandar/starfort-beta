/** Bot practice difficulty only; no stat cheats or PvP rules changes. */
export const TRAINING_DIFFICULTIES=Object.freeze(['easy','normal','hard']);
export const TRAINING_LABELS=Object.freeze({easy:'Kolay',normal:'Normal',hard:'Zor'});
export function trainingDifficulty(value){return TRAINING_DIFFICULTIES.includes(value)?value:null;}
export function trainingLabel(value){return TRAINING_LABELS[trainingDifficulty(value)||'normal'];}
