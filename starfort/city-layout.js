// Presentation coordinates only: existing save IDs and all economic rules stay unchanged.
export const CITY_PLOTS = {
  keep:        { x: 0, z: -5.7, y: .65, width: 10.5, depth: 6.8, scale: 1.35, labelZ: 2.8 },
  observatory: { x: -11, z: -5.6, y: .45, width: 6.4, depth: 5.8, scale: 1.25, labelZ: 2.4 },
  quarry:      { x: 12.5, z: -5.2, y: .25, width: 6.6, depth: 5.8, scale: 1.15, labelZ: 2.3 },
  forge:       { x: -10.5, z: 4.9, y: .22, width: 6.4, depth: 5.8, scale: 1.15, labelZ: 2.2 },
  tavern:      { x: 1, z: 5.2, y: .22, width: 6.5, depth: 6.1, scale: 1.2, labelZ: 2.3 },
  farm:        { x: -19, z: 4.5, y: .18, width: 6.4, depth: 5.7, scale: 1.12, labelZ: 2.1 },
  lumber:      { x: 13, z: 5.7, y: .18, width: 6.4, depth: 5.8, scale: 1.15, labelZ: 2.2 },
};
export const CITY_NODES = {
  gate: [-5,.18,14], square: [-5,.22,9.5], west: [-10.5,.22,9.5], east: [13,.18,9.5],
  keep: [0,.65,-2.3], observatory: [-11,.45,-2.7], quarry: [12.5,.25,-2.3],
  forge: [-10.5,.22,7.8], tavern: [1,.22,8.25], farm: [-19,.18,7.35], lumber: [13,.18,8.6],
  north: [-5,.18,-2], westBridge: [-5,.18,1.4], upperWest: [-11,.18,-2], upperEast: [12.5,.18,-2],
};
export const CITY_LINKS = [
  ['gate','square',2],['square','west',1.6],['square','east',1.6],['west','forge',1.5],['west','farm',1.5],
  ['square','tavern',1.5],['east','lumber',1.5],['square','westBridge',2],['westBridge','north',2],
  ['north','keep',1.5],['north','upperWest',1.5],['upperWest','observatory',1.5],['north','upperEast',1.5],['upperEast','quarry',1.5],
];
export const CITY_VIEW = { target: [-2, 2.5, 1.5], offset: [10, 25, 40], halfWidth: 22.5, halfHeight: 11 };
export const CITY_PALETTE = { stone:'#8295a3', dark:'#3e5265', edge:'#b4c1c7', roof:'#263d58', gold:'#d0ae68', wood:'#6a5546', plaster:'#88959c', cyan:'#8be5ee', ember:'#ffc47a', grass:'#465e54' };

// Keep labels attached to their courtyards while separating crowded rows on narrow screens.
export function placeCityLabels(points, width, height, obstacles=[],maxShift=Infinity) {
  const placed=[];
  const intersects=(a,b)=>a.x-a.width/2<b.x+b.width/2+4&&a.x+a.width/2>b.x-b.width/2-4&&a.y<b.y+b.height+4&&a.y+a.height>b.y-4;
  for(const point of points.filter(p=>p.visible).sort((a,b)=>a.y-b.y)) {
    const w=point.width||120,h=point.height||28,x=Math.min(width-w/2-4,Math.max(w/2+4,point.x));
    const occupied=[...placed,...obstacles];
    const candidates=[Math.max(4,point.y),...occupied.flatMap(p=>[p.y-h-5,p.y+p.height+5])];
    const y=candidates.filter(y=>y>=4&&y+h<=height-4&&Math.abs(y-point.y)<=maxShift&&!occupied.some(p=>intersects({x,y,width:w,height:h},p))).sort((a,b)=>Math.abs(a-point.y)-Math.abs(b-point.y))[0];
    if(y===undefined)continue;
    placed.push({...point,x,y,width:w,height:h,shift:y-point.y});
  }
  return placed;
}
