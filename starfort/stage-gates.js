// Required first-clear milestones. Already cleared chapters are replayable regardless
// of future balance changes. PvP and server authorization do not depend on this module.
const GATES=Object.freeze({
  3:{forge:2,gear:1,maze:1},
  4:{forge:2,gear:1,maze:2},
  5:{forge:3,gear:2,maze:3},
  6:{forge:3,gear:2,maze:4},
  7:{forge:4,gear:3,maze:6},
  8:{forge:4,gear:3,maze:8},
});
export function stageRequirements(state,stage,teamPower) {
  if(!stage || !Number.isInteger(stage.id))return {available:false,reasons:['Bilinmeyen sefer.'],requirements:[]};
  if(state.cleared?.includes(stage.id))return {available:true,reasons:[],requirements:[],replay:true};
  const gates=GATES[stage.id];
  if(!gates)return {available:true,reasons:[],requirements:[],replay:false};
  const equipped=Object.values(state.loadouts||{}).reduce((sum,slots)=>sum+Object.values(slots||{}).filter(Boolean).length,0);
  const requirements=[
    {key:'power',label:`Takım gücü ${stage.recommendedPower}`,value:teamPower,target:stage.recommendedPower},
    {key:'forge',label:`Demirhane seviye ${gates.forge}`,value:state.buildings?.forge||0,target:gates.forge},
    {key:'gear',label:`${gates.gear} kuşanılmış eşya`,value:equipped,target:gates.gear},
    {key:'maze',label:`${gates.maze} labirent katı`,value:state.labyrinth?.cleared||0,target:gates.maze}
  ].map(r=>({...r,met:r.value>=r.target}));
  return {available:requirements.every(x=>x.met),requirements,
    reasons:requirements.filter(x=>!x.met).map(x=>`${x.label} gerekli (${x.value}/${x.target}).`),replay:false};
}
