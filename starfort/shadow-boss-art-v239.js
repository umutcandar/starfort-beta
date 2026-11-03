import {getLocale} from './locale-v243.js';
import {SHADOW_STAGE_NATIVE} from './locale-shadow-stages-v247.js';
import {shadowPhaseTitle,shadowPhaseHint,shadowArtLabel} from './locale-shadow-voice-v247.js';
/** STARFORT v2.39 original vector boss illustrations.
 * Static SVG geometry only; no remote images, external dependencies, or scripts.
 * Per-stage visual states are derived exclusively from authenticated battle snapshots.
 */
const STAGE_KEYS=Object.freeze(['thorns','siren','tempest','eclipse']);
const INTENTS=Object.freeze(['strike','crush','shield','drain']);
const PHASE_LABELS=Object.freeze([
 Object.freeze(['Uyuyan Kökler','Diken Nöbeti','Yaşayan Surlar']),
 Object.freeze(['Sessiz Kıyılar','Boşluğun Şarkısı','Can Çalan Ezgi']),
 Object.freeze(['Kül Rüzgârı','Alev Çemberi','Kızıl Fırtına']),
 Object.freeze(['Sönük Taht','Tutulma Kapısı','Hükümdarın Uyanışı'])
]);
const SAFE_X=(x,a,b)=>Number.isSafeInteger(x)?Math.max(a,Math.min(b,x)):a;
const SCENE_BODY=[
 // Thorn Watcher: horned forest guardian and layered branches.
 `<g class="shadow-boss-body"><path d="M175 221Q133 176 147 124L120 94L137 76L167 104L181 58L204 93L218 49L239 98L261 76L278 92L246 127Q259 175 218 221Z" class="boss-core"/>
 <path d="M174 154L102 116L71 136M248 154L318 113L347 136M168 186L107 174L79 198M252 187L312 169L341 195" class="boss-limbs"/>
 <path d="M161 102L132 58L111 41M250 102L275 60L298 42M183 214L158 244M235 213L259 244" class="boss-limbs"/>
 <path d="M178 133L195 139L184 146M242 133L224 139L236 146" class="boss-eyes"/>
 <path d="M191 161L209 174L228 161" class="boss-detail"/></g>
 <g class="shadow-boss-sparks"><path d="M60 219Q105 202 126 225M301 232Q325 214 367 223M65 83L91 110M333 83L312 110" class="boss-sparks-line"/></g>`,
 // Hollow Siren: tidal shell and spectral hair; spiral trident.
 `<g class="shadow-boss-body"><path d="M120 234Q151 184 149 117Q151 53 209 57Q269 51 272 118Q267 191 302 234L256 217Q214 251 163 215Z" class="boss-core"/>
 <path d="M148 114Q113 146 109 199M268 109Q308 151 310 199M167 90Q130 131 146 171M246 89Q277 131 259 175" class="boss-limbs"/>
 <ellipse cx="209" cy="151" rx="40" ry="60" class="boss-face"/>
 <path d="M185 143L198 148M222 148L236 143" class="boss-eyes"/>
 <path d="M204 165Q210 170 217 165" class="boss-detail"/>
 <path d="M139 240Q168 212 195 241T263 240M89 253Q132 230 171 254T258 254T332 253" class="boss-sparks-line"/></g>
 <g class="shadow-boss-sparks"><path d="M304 80L304 204M291 110L304 92L316 110M291 134L304 152L316 134" class="boss-limbs"/></g>`,
 // Ash Tempest: phoenix-like armored storm.
 `<g class="shadow-boss-body"><path d="M210 51L244 112L270 81L269 148L315 121L286 202L253 183L240 238L210 217L178 238L166 183L133 202L106 121L150 147L151 81L176 113Z" class="boss-core"/>
 <path d="M182 126L135 94L105 84M239 127L281 94L313 84M180 184L117 209L87 236M240 184L300 211L331 237" class="boss-limbs"/>
 <path d="M185 131L198 139L183 143M235 131L221 139L237 143" class="boss-eyes"/>
 <path d="M188 164L209 186L232 164" class="boss-detail"/>
 <path d="M209 38L196 19M233 67L252 31M174 70L160 31M260 169L344 172" class="boss-sparks-line"/></g>
 <g class="shadow-boss-sparks"><circle cx="111" cy="191" r="7" class="boss-ember"/><circle cx="312" cy="206" r="5" class="boss-ember"/></g>`,
 // Eclipse Regent: crown and nebula cloak; giant eclipse halo.
 `<g class="shadow-boss-body"><path d="M209 42L237 76L270 51L267 103L286 99L282 136L269 155L301 242L209 220L117 242L150 155L136 136L132 99L151 103L149 51L183 76Z" class="boss-core"/>
 <path d="M209 33L209 7M141 62L124 36M279 62L293 36M135 171L89 227M280 171L326 227" class="boss-limbs"/>
 <path d="M169 110L188 122L181 133L164 126M247 110L231 122L237 133L253 126" class="boss-eyes"/>
 <path d="M182 164Q211 179 239 164M166 202L210 225L255 202" class="boss-detail"/>
 <circle cx="209" cy="87" r="17" class="boss-gem"/></g>
 <g class="shadow-boss-sparks"><circle cx="209" cy="142" r="112" class="boss-eclipse-ring"/><path d="M89 143H54M329 143H365M209 8V0M209 283V272" class="boss-sparks-line"/></g>`
];
const ENVIRONMENTS=[
 `<path d="M0 236L46 171L89 241L128 155L180 246L241 176L295 245L351 152L420 235V300H0Z" class="boss-land"/>
 <path d="M0 279L68 261L139 279L213 255L314 281L382 262L420 271" class="boss-horizon"/>`,
 `<path d="M0 237Q58 216 104 238T211 238T314 237T420 230V300H0Z" class="boss-land"/>
 <path d="M0 254Q56 238 105 258T210 254T315 255T420 251M0 276Q75 254 141 276T281 276T420 276" class="boss-horizon"/>`,
 `<path d="M0 248L68 222L116 257L163 236L210 253L289 217L359 244L420 228V300H0Z" class="boss-land"/>
 <path d="M35 288L70 244L89 288M138 295L162 258L188 295M272 288L307 248L337 288" class="boss-horizon"/>`,
 `<path d="M0 253L79 225L140 258L219 216L293 250L351 221L420 253V300H0Z" class="boss-land"/>
 <path d="M102 259V199L141 172V263M281 262V201L310 175V263" class="boss-horizon"/>`
];
/** Safely render one 420x300 original boss illustration with unique SVG paint servers. */
export function shadowBossArtwork(stage,{variant='card',wave=1,intent='strike',enraged=false}={}){
 const idx=SAFE_X(stage,1,4)-1,w=SAFE_X(wave,1,3);
 const key=STAGE_KEYS[idx];
 const bossName=getLocale()==='tr'?['Diken Nöbetçisi','Oyuk Siren','Kül Fırtınası','Tutulma Hükümdarı'][idx]:SHADOW_STAGE_NATIVE[getLocale()]?.[idx]?.boss||['Thorn Sentinel','Hollow Siren','Ash Tempest','Eclipse Sovereign'][idx];
 const mode=variant==='battle'?'battle':variant==='reward'?'reward':'card';
 const style=(enraged&&idx===3)?'enraged':(INTENTS.includes(intent)?intent:'strike');
 const paint='sfb-v239-'+key+'-'+mode;
 return `<svg xmlns="http://www.w3.org/2000/svg" class="shadow-boss-art art-${key} boss-intent-${style} ${mode==='battle'?'art-combat':''}" viewBox="0 0 420 300" role="img" aria-label="${bossName} ${shadowArtLabel()}" focusable="false" preserveAspectRatio="xMidYMid meet">
 <defs><radialGradient id="${paint}-sky" cx="50%" cy="37%" r="75%">
  <stop offset="0%" stop-color="var(--boss-sky-core)"/><stop offset="100%" stop-color="var(--boss-sky-edge)"/></radialGradient>
  <linearGradient id="${paint}-core" x1="0" y1="0" x2="1" y2="1">
   <stop offset="0%" stop-color="var(--boss-core-light)"/><stop offset="100%" stop-color="var(--boss-core-dark)"/></linearGradient>
  <radialGradient id="${paint}-halo"><stop offset="40%" stop-color="var(--boss-halo)" stop-opacity=".67"/>
  <stop offset="100%" stop-color="var(--boss-halo)" stop-opacity="0"/></radialGradient>
 </defs>
 <rect width="420" height="300" fill="url(#${paint}-sky)"/>
 <g class="shadow-boss-background"><circle cx="209" cy="137" r="130" fill="url(#${paint}-halo)"/>
 <circle cx="78" cy="53" r="2.4" class="boss-star"/><circle cx="349" cy="74" r="3.1" class="boss-star"/>
 <circle cx="40" cy="129" r="2" class="boss-star"/><circle cx="320" cy="39" r="2" class="boss-star"/>
 <path d="M0 221Q80 197 174 218T420 207" class="boss-fog"/></g>
 <g>${ENVIRONMENTS[idx]}</g>
 <g class="shadow-boss-figure" style="transform-origin:50% 60%">
 ${SCENE_BODY[idx].replaceAll('class="boss-core"','class="boss-core" fill="url(#'+paint+'-core)"')}</g>
 <g class="boss-ground-light"><ellipse cx="211" cy="266" rx="109" ry="13" fill="var(--boss-halo)" opacity=".30"/></g>
 <g class="boss-wave-indicator" aria-hidden="true">${[1,2,3].map(n=>`<circle cx="${191+(n-1)*17}" cy="284" r="4" fill="${n<=w?'var(--boss-accent)':'#263146'}"/>`).join('')}</g>
 </svg>`;
}
export function shadowBossPhase(stage,wave=1,hp=1,maxHp=1){
 const n=SAFE_X(stage,1,4),w=SAFE_X(wave,1,3),ratio=maxHp>0?Math.max(0,Math.min(1,hp/maxHp)):1;
 if(n===4&&w===3&&ratio<=.35)return {id:'eclipse-rage',title:shadowPhaseTitle(12,'Tutulmanın Son Nefesi'),hint:shadowPhaseHint(5,'Patron kritik canın altında öfkelenir: gelen hasar artar.'),danger:'high'};
 if(n===4&&w===3&&ratio<=.68)return {id:'eclipse-rise',title:shadowPhaseTitle(13,'Karanlık Taht Çatlıyor'),hint:shadowPhaseHint(6,'Patronun saldırı niyeti değişti; gelecek hamleyi izle.'),danger:'high'};
 const names=PHASE_LABELS[n-1];return {id:STAGE_KEYS[n-1]+'-phase-'+w,title:shadowPhaseTitle((n-1)*3+(w-1),names[w-1]),
  hint:w===3?shadowPhaseHint(n-1,['Kalkanı Aldat hamlesiyle kır.','Can emmesine yüksek hasarla karşılık ver.',
   'Ağır darbeleri Savun ile karşıla.','Son safhada yeteneklerini doğru zamanda kullan.'][n-1])
   :shadowPhaseHint(4,'Bu dalga bittiğinde kalan canın bir kısmı yenilenir.'),danger:w===3?'medium':'low'};
}
/** Only actual server reward values are included; never calculate an invented drop. */
export function shadowLootSummary(report){
 if(!report||report.won!==true)return [];
 const resources=report.reward&&typeof report.reward==='object'&&!Array.isArray(report.reward)?report.reward:{};
 const accepted=['gold','wood','stone','aether'];
 return accepted.filter(k=>Number.isSafeInteger(resources[k])&&resources[k]>=0&&resources[k]<=1000000000)
  .map(id=>({id,value:resources[id]}));
}
