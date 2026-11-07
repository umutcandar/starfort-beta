/** Royal Gunner cosmetic navigation: 14 locale labels, presentation only. */
import {getLocale} from './locale-v243.js';
const LABELS=Object.freeze({
 tr:'✦ Kraliyet Nişancısı · Gerçek 3D incele',
 en:'✦ Royal Gunner · Inspect real 3D',
 es:'✦ Artillero real · Ver en 3D',
 'pt-BR':'✦ Atirador Real · Ver em 3D',
 fr:'✦ Tireur royal · Voir en 3D',
 de:'✦ Königlicher Schütze · 3D ansehen',
 it:'✦ Tiratore reale · Visualizza in 3D',
 ru:'✦ Королевский стрелок · Просмотр 3D',
 ar:'✦ الرامي الملكي · عرض 3D',
 hi:'✦ शाही निशानेबाज़ · 3D में देखें',
 id:'✦ Penembak Kerajaan · Lihat 3D',
 ja:'✦ 王家の銃士 · 3Dで見る',
 ko:'✦ 왕실 사수 · 3D 보기',
 'zh-CN':'✦ 皇家枪手 · 查看3D'
});
export const royalGunnerViewLabel=()=>LABELS[getLocale()]||LABELS.en;
export const ROYAL_GUNNER_LABELS=LABELS;
