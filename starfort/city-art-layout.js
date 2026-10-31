// Presentation only. Coordinates use the authored 1919 × 820 panorama, never save data.
export const ART_SIZE = { width: 1919, height: 820 };
export const ART_PLOTS = {
  keep: { anchor:[1035,425], center:[1015,270], bounds:[730,10,560,445], polygon:[[735,240],[805,95],[1010,10],[1145,60],[1268,300],[1228,445],[845,440]], radius:135 },
  observatory: { anchor:[490,414], center:[490,300], bounds:[320,165,285,280], polygon:[[440,180],[515,165],[573,272],[600,395],[490,443],[320,401],[347,306]], radius:80 },
  quarry: { anchor:[1555,463], center:[1555,357], bounds:[1380,237,365,250], polygon:[[1403,307],[1623,237],[1728,354],[1745,455],[1508,487],[1380,406]], radius:108 },
  farm: { anchor:[255,636], center:[240,548], bounds:[63,420,337,237], polygon:[[80,484],[239,420],[372,507],[400,602],[245,657],[63,575]], radius:102 },
  forge: { anchor:[663,659], center:[662,559], bounds:[491,411,355,269], polygon:[[533,494],[639,411],[733,461],[846,534],[824,638],[654,680],[491,599]], radius:110 },
  tavern: { anchor:[1121,687], center:[1108,577], bounds:[966,437,330,280], polygon:[[1053,493],[1167,437],[1290,568],[1296,663],[1137,717],[966,628],[982,540]], radius:112 },
  lumber: { anchor:[1652,653], center:[1660,556], bounds:[1513,473,313,207], polygon:[[1544,490],[1685,473],[1826,586],[1790,657],[1645,680],[1513,579]], radius:105 },
};

// Authored rectangles, not a guessed regular grid: preserve every tip and foundation.
// Source coordinates are relative to the 1280px inspection view; scaling supports the original PNG/WebP.
export const ATLAS_SIZE = 1280;
export const ATLAS_RECTS = [
  [44,15,238,315], [300,70,349,258], [700,26,181,305], [967,22,280,323],
  [27,347,270,300], [324,379,317,269], [660,333,300,325], [964,427,283,221],
  [14,700,316,213], [343,649,290,269], [643,666,331,255], [975,706,272,207],
  [14,907,315,317], [331,965,313,255], [643,938,331,290], [982,930,260,300],
];
// Each upgrade adds an actual illustrated structure, ordered back-to-front when drawn.
const part=(sprite,x,y,width)=>({sprite,x,y,width});
const step=(name,...parts)=>({name,parts});
export const ART_UPGRADES = {
  keep:[
    step('Çift muhafız kulesi',part(0,913,405,65),part(0,1160,412,65)),
    step('Batı kraliyet kanadı',part(1,839,423,136)),
    step('Doğu kraliyet kanadı',part(1,1222,429,138)),
    step('Yüksek gözetleme kulesi',part(0,942,321,66)),
    step('Ön meydan burçları',part(0,940,467,78),part(0,1190,477,78)),
    step('Yıldız mabedi',part(3,1090,405,92)),
    step('Kraliyet sancakları',part(2,1004,459,29),part(2,1128,472,29)),
  ],
  farm:[
    step('Tahıl silosu',part(4,358,572,66)),
    step('Yeni ambar',part(5,146,594,92)),
    step('İkinci taş değirmen',part(6,159,504,76)),
    step('İkinci silo',part(4,100,554,65)),
    step('Hasat deposu',part(5,335,648,90)),
    step('Büyük tahıl kulesi',part(4,374,626,76)),
    step('Yıldız hasat serası',part(7,224,664,108)),
  ],
  lumber:[
    step('Kütük deposu',part(8,1553,633,84)),
    step('İşleme atölyesi',part(10,1796,609,94)),
    step('Kaldırma vinci',part(9,1766,538,72)),
    step('Yükleme deposu',part(8,1747,675,85)),
    step('Usta atölyesi',part(10,1560,540,100)),
    step('Büyük testere',part(11,1642,680,93)),
    step('Oduncu gözetleme kulesi',part(0,1800,668,76)),
  ],
  quarry:[
    step('Taş yükleme vinci',part(9,1424,432,68)),
    step('İkinci kaldırma vinci',part(9,1648,410,77)),
    step('Madenci atölyesi',part(10,1424,373,90)),
    step('Yük işleme sundurması',part(13,1659,490,96)),
    step('Maden muhafız kulesi',part(0,1716,444,72)),
    step('Kristal arıtma ocağı',part(12,1489,487,87)),
    step('Aytaşı mabedi',part(3,1549,447,103)),
  ],
  forge:[
    step('İkinci döküm fırını',part(12,542,602,85)),
    step('Yüksek baca atölyesi',part(12,774,559,88)),
    step('Silah sundurması',part(13,746,659,104)),
    step('Usta işleme atölyesi',part(10,527,537,89)),
    step('Kraliyet dökümhanesi',part(12,790,631,100)),
    step('Büyük silah tezgâhı',part(13,585,676,88)),
    step('Yıldız döküm kulesi',part(3,670,639,93)),
  ],
  tavern:[
    step('Konuk konağı',part(14,994,648,102)),
    step('Doğu konuk kanadı',part(14,1260,632,108)),
    step('Kraliyet misafirhanesi',part(1,1006,560,112)),
    step('Kahramanlar kulesi',part(0,1230,550,75)),
    step('Şölen konağı',part(14,1216,713,100)),
    step('Batı muhafız kulesi',part(0,980,706,73)),
    step('Kahramanların sancağı',part(2,1125,705,33)),
  ],
  observatory:[
    step('Gözlem merceği',part(15,571,416,55)),
    step('Mercek kulesi',part(0,375,361,65)),
    step('Gök haritası odası',part(1,383,426,102)),
    step('İkinci gözlem kulesi',part(15,575,321,63)),
    step('Yıldız mabedi',part(3,449,443,78)),
    step('Batı mercek kulesi',part(15,322,405,62)),
    step('Göksel taç',part(3,547,461,91)),
  ],
};
export const ART_EVOLUTION = Object.fromEntries(Object.entries(ART_UPGRADES).map(([id,stages])=>[id,['İlk yerleşim',...stages.map(s=>s.name)]]));

export function architectureForLevel(id,level) {
  const count=Math.max(0,Math.min(7,Math.floor(Number(level)||1)-1));
  const stages=Object.hasOwn(ART_UPGRADES,id)?ART_UPGRADES[id]:[];
  return stages.slice(0,count).flatMap((stage,index)=>stage.parts.map(p=>({...p,level:index+2,id})));
}
export function viewportTransform(width,height,zoom=1,pan={x:0,y:0}) {
  width=Math.max(1,width); height=Math.max(1,height);
  const scale=Math.max(width/ART_SIZE.width,height/ART_SIZE.height)*Math.max(1,Math.min(2.8,zoom));
  const sw=ART_SIZE.width*scale,sh=ART_SIZE.height*scale;
  return {scale,x:Math.max(width-sw,Math.min(0,(width-sw)/2+(pan.x||0))),y:Math.max(height-sh,Math.min(0,(height-sh)/2+(pan.y||0))),width,height};
}
export function worldToScreen(point,view) { return {x:point[0]*view.scale+view.x,y:point[1]*view.scale+view.y}; }
export function screenToWorld(point,view) { return [(point.x-view.x)/view.scale,(point.y-view.y)/view.scale]; }
export function insidePolygon([x,y],polygon) {
  let inside=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++) {
    const [xi,yi]=polygon[i],[xj,yj]=polygon[j];
    if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))inside=!inside;
  }
  return inside;
}
export function pickBuilding(point,levels={}) {
  const extras=Object.keys(ART_PLOTS).flatMap(id=>architectureForLevel(id,levels[id]||1)).sort((a,b)=>b.y-a.y);
  for(const p of extras) {
    const rect=ATLAS_RECTS[p.sprite],h=p.width*rect[3]/rect[2];
    if(point[0]>=p.x-p.width*.42&&point[0]<=p.x+p.width*.42&&point[1]>=p.y-h*.86&&point[1]<=p.y)return p.id;
  }
  return Object.entries(ART_PLOTS).sort((a,b)=>b[1].anchor[1]-a[1].anchor[1]).find(([,p])=>insidePolygon(point,p.polygon))?.[0]||null;
}
