/** Browser + Node safe random hex ids (replaces node:crypto randomBytes for room/bot ids). */
export function randomHex(bytes){const a=new Uint8Array(bytes);globalThis.crypto.getRandomValues(a);return Array.from(a,b=>b.toString(16).padStart(2,'0')).join('');}
export const randomBytes=n=>({toString:()=>randomHex(n)});
