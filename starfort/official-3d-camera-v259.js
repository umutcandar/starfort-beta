/** Local-only 3D camera controls; never included in game action RPC requests. */
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
export const CAMERA_DEFAULT=Object.freeze({yaw:0,distance:69});
export function orbitCamera(current=CAMERA_DEFAULT,dx=0){
 const yaw=clamp(Number(current?.yaw)||0,-.85,.85);
 const delta=Number.isFinite(dx)?clamp(dx,-500,500):0;
 return Object.freeze({yaw:clamp(yaw+delta*.004,-.85,.85),
   distance:clamp(Number(current?.distance)||69,50,95)});
}
export function zoomCamera(current=CAMERA_DEFAULT,delta=0){
 const yaw=clamp(Number(current?.yaw)||0,-.85,.85);
 const distance=clamp((Number(current?.distance)||69)+(Number.isFinite(delta)?clamp(delta,-300,300)*.085:0),50,95);
 return Object.freeze({yaw,distance});
}
