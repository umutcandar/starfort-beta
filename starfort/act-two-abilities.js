/** Act II chapter-specific boss abilities. These are combat instructions for the UI.
 * Actual damage and status effects are calculated by the verified Supabase mission RPC. */
export const ACT_TWO_ABILITIES=Object.freeze([
 {stage:1,id:'ember-surge',name:'Kor Taşkını',icon:'🔥',trigger:'crush',counter:'guard',hint:'Ağır darbe öncesi Siper kullan; kızıl ateşin ek hasarını engellersin.',effect:'Siper kullanılmazsa Kor Taşkını ağır darbeyi güçlendirir.'},
 {stage:2,id:'mirror-reversal',name:'Ayna Yansıması',icon:'🪞',trigger:'shield',counter:'skill',hint:'Kalkanlı turda bir kahramanın özel yeteneğini kullan; aynadan dönen hasarı önle.',effect:'Normal saldırı aynadan geri yansır; kahraman yeteneği yansımayı bozar.'},
 {stage:3,id:'stone-carapace',name:'Göktaşı Zırhı',icon:'🪨',trigger:'shield',counter:'skill',hint:'Taş zırha normal saldırı daha az hasar verir. Özel yetenekle zırhı del.',effect:'Kalkanlı turda normal darbelerin hasarını büyük ölçüde düşürür.'},
 {stage:4,id:'blood-thorns',name:'Kan Dikenleri',icon:'🌹',trigger:'strike',counter:'guard',hint:'Dikenli karşı saldırıda Siper kullan; saldırırsan dikenler canını azaltır.',effect:'Normal karşı saldırı sırasında saldırganın verdiği hasarın bir kısmını yansıtır.'},
 {stage:5,id:'ash-feast',name:'Kül Ayini',icon:'🌋',trigger:'drain',counter:'skill',hint:'Can emme turunda yüksek hasarlı kahraman yeteneğinle ayini kısa kes.',effect:'Can emme sırasında daha fazla iyileşir ve biraz daha ağır vurur.'},
 {stage:6,id:'night-veil',name:'Gece Peçesi',icon:'🌘',trigger:'shield',counter:'skill',hint:'Karanlık kalkanını özel yeteneklerle yar; düz saldırılar neredeyse boşa gider.',effect:'Karanlık perdesi normal darbeleri zayıflatır, özel yetenekleri durduramaz.'},
 {stage:7,id:'chain-lightning',name:'Zincir Yıldırım',icon:'⚡',trigger:'crush',counter:'guard',hint:'Yıldırım hücumunu görürsen Siper seç; aksi hâlde ek şimşek hasarı alırsın.',effect:'Ağır hücumda zincir yıldırım takıma ilave hasar verir.'},
 {stage:8,id:'void-devour',name:'Boşluk Yutumu',icon:'✴',trigger:'drain',counter:'guard',hint:'Boşluk can emmeye hazırlanıyorsa Siper hasarı ve patronun iyileşmesini azaltır.',effect:'Son perdenin can emme saldırısı diğer patronlardan daha fazla HP yeniler.'}
].map(x=>Object.freeze(x)));
export function actTwoBossAbility(mission){
 if(!mission||mission.mode!=='act2'||mission.waves!==3||mission.wave!==3)return null;
 const ability=ACT_TWO_ABILITIES[mission.stage-1];
 if(!ability)return null;
 const intent=mission.enemyIntent||'strike';
 return Object.freeze({...ability,active:intent===ability.trigger,intent});
}
