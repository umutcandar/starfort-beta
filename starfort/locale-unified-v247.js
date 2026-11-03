/** STARFORT v2.47 shared display-only multilingual phrase memory. Canonical IDs never translated. */
import {getLocale,SUPPORTED_LOCALES} from './locale-v243.js';
import {SHARED_TRANSLATIONS} from './locale-sections-v247.js';
import {TEAM_TRANSLATIONS} from './locale-team-v247.js';
import {GUILD_TRANSLATIONS} from './locale-guild-v247.js';
import {REWARD_TRANSLATIONS} from './locale-rewards-v245.js';
import {ARMORY_TRANSLATIONS} from './locale-armory-v246.js';
import {OFFICIAL_TRANSLATIONS} from './locale-official-ui-v247.js';
import {REALM_UI} from './locale-realm-ui-v247.js';
import {AUTH_MESSAGES} from './locale-auth-messages-v247.js';
import {MAZE_TRANSLATIONS} from './locale-maze-native-v247.js';
import {PREMIUM_STORE_NATIVE} from './locale-premium-store-native-v247.js';
import {WARFRONT_NATIVE} from './locale-warfront-native-v247.js';
import {BUILDING_NATIVE} from './locale-building-native-v247.js';
import {BUILDING_ADVANCED_NATIVE} from './locale-building-advanced-v247.js';
import {AUXILIARY_NATIVE} from './locale-auxiliary-native-v247.js';
import {SHADOW_HUD_NATIVE} from './locale-shadow-hud-native-v247.js';
import {APP_NATIVE} from './locale-app-native-v247.js';
import {ARENA_NATIVE} from './locale-arena-native-v247.js';
import {SHELL_TRANSLATIONS} from './locale-shell-v247.js';
import {WORLD_LANGUAGES} from './locale-world-v247.js';
import {HERO_UI} from './locale-hero-ui-v247.js';
import {ITEM_NAMES} from './locale-item-names-v247.js';
export const UNIFIED_KEYS=Object.freeze(["Star Duel","Shadow Frontier","Frontier Mastery","Landscape mode recommended.","MATCH INTERRUPTED","CONNECTION ERROR","Cinematic 2.5D · main game","3D development preview","Connecting…","Disconnected","Matchmaking","Boss HP","WAVE","renown","FIRST-CLEAR LOOT"]);
export const UNIFIED_PACK=Object.freeze({"es":{"Star Duel":"Duelo Estelar","Shadow Frontier":"Frontera Sombría","Frontier Mastery":"Maestría de la Frontera","Landscape mode recommended.":"Se recomienda modo horizontal.","MATCH INTERRUPTED":"PARTIDA INTERRUMPIDA","CONNECTION ERROR":"ERROR DE CONEXIÓN","Cinematic 2.5D · main game":"Cinemática 2.5D · juego principal","3D development preview":"Vista previa 3D en desarrollo","Connecting…":"Conectando…","Disconnected":"Desconectado","Matchmaking":"Buscando partida","Boss HP":"Vida del jefe","WAVE":"OLEADA","renown":"renombre","FIRST-CLEAR LOOT":"BOTÍN DE PRIMERA VICTORIA"},"pt-BR":{"Star Duel":"Duelo Estelar","Shadow Frontier":"Fronteira Sombria","Frontier Mastery":"Maestria da Fronteira","Landscape mode recommended.":"Recomenda-se modo paisagem.","MATCH INTERRUPTED":"PARTIDA INTERROMPIDA","CONNECTION ERROR":"ERRO DE CONEXÃO","Cinematic 2.5D · main game":"Cinemático 2.5D · jogo principal","3D development preview":"Prévia 3D em desenvolvimento","Connecting…":"Conectando…","Disconnected":"Desconectado","Matchmaking":"Buscando partida","Boss HP":"Vida do chefe","WAVE":"ONDA","renown":"renome","FIRST-CLEAR LOOT":"SAQUE DA PRIMEIRA VITÓRIA"},"fr":{"Star Duel":"Duel des Étoiles","Shadow Frontier":"Frontière des Ombres","Frontier Mastery":"Maîtrise des Frontières","Landscape mode recommended.":"Mode paysage recommandé.","MATCH INTERRUPTED":"PARTIE INTERROMPUE","CONNECTION ERROR":"ERREUR DE CONNEXION","Cinematic 2.5D · main game":"Cinématique 2.5D · jeu principal","3D development preview":"Aperçu 3D en développement","Connecting…":"Connexion…","Disconnected":"Déconnecté","Matchmaking":"Recherche d'adversaire","Boss HP":"PV du boss","WAVE":"VAGUE","renown":"renommée","FIRST-CLEAR LOOT":"BUTIN DE PREMIÈRE VICTOIRE"},"de":{"Star Duel":"Sternenduell","Shadow Frontier":"Schattenfront","Frontier Mastery":"Grenzmeisterschaft","Landscape mode recommended.":"Querformat empfohlen.","MATCH INTERRUPTED":"SPIEL UNTERBROCHEN","CONNECTION ERROR":"VERBINDUNGSFEHLER","Cinematic 2.5D · main game":"Kinematisches 2,5D · Hauptspiel","3D development preview":"3D-Entwicklungsvorschau","Connecting…":"Verbinden…","Disconnected":"Getrennt","Matchmaking":"Gegner wird gesucht","Boss HP":"Boss-LP","WAVE":"WELLE","renown":"Ruhm","FIRST-CLEAR LOOT":"BEUTE BEIM ERSTEN SIEG"},"it":{"Star Duel":"Duello Stellare","Shadow Frontier":"Frontiera delle Ombre","Frontier Mastery":"Maestria della Frontiera","Landscape mode recommended.":"Modalità orizzontale consigliata.","MATCH INTERRUPTED":"PARTITA INTERROTTA","CONNECTION ERROR":"ERRORE DI CONNESSIONE","Cinematic 2.5D · main game":"Cinematica 2.5D · gioco principale","3D development preview":"Anteprima 3D in sviluppo","Connecting…":"Connessione…","Disconnected":"Disconnesso","Matchmaking":"Ricerca avversario","Boss HP":"PV del boss","WAVE":"ONDATA","renown":"fama","FIRST-CLEAR LOOT":"BOTTINO PRIMA VITTORIA"},"ru":{"Star Duel":"Звёздная дуэль","Shadow Frontier":"Теневая Граница","Frontier Mastery":"Мастерство Границы","Landscape mode recommended.":"Рекомендуется альбомная ориентация.","MATCH INTERRUPTED":"МАТЧ ПРЕРВАН","CONNECTION ERROR":"ОШИБКА СОЕДИНЕНИЯ","Cinematic 2.5D · main game":"Кинематографичный 2.5D · основная игра","3D development preview":"Предпросмотр 3D-разработки","Connecting…":"Подключение…","Disconnected":"Отключено","Matchmaking":"Поиск противника","Boss HP":"Здоровье босса","WAVE":"ВОЛНА","renown":"слава","FIRST-CLEAR LOOT":"ДОБЫЧА ЗА ПЕРВУЮ ПОБЕДУ"},"ar":{"Star Duel":"المبارزة النجمية","Shadow Frontier":"حدود الظلال","Frontier Mastery":"إتقان الحدود","Landscape mode recommended.":"يوصى بالوضع الأفقي.","MATCH INTERRUPTED":"انقطعت المباراة","CONNECTION ERROR":"خطأ في الاتصال","Cinematic 2.5D · main game":"مشهد سينمائي 2.5D · اللعبة الأساسية","3D development preview":"معاينة تطوير ثلاثية الأبعاد","Connecting…":"جارٍ الاتصال…","Disconnected":"غير متصل","Matchmaking":"البحث عن مباراة","Boss HP":"صحة الزعيم","WAVE":"موجة","renown":"الشهرة","FIRST-CLEAR LOOT":"غنيمة النصر الأول"},"hi":{"Star Duel":"तारा द्वंद्व","Shadow Frontier":"छाया सीमांत","Frontier Mastery":"सीमांत महारत","Landscape mode recommended.":"लैंडस्केप मोड बेहतर है।","MATCH INTERRUPTED":"मैच बाधित","CONNECTION ERROR":"कनेक्शन त्रुटि","Cinematic 2.5D · main game":"सिनेमैटिक 2.5D · मुख्य खेल","3D development preview":"3D विकास पूर्वावलोकन","Connecting…":"कनेक्ट हो रहा है…","Disconnected":"डिस्कनेक्ट","Matchmaking":"मैच खोज रहा है","Boss HP":"बॉस की सेहत","WAVE":"लहर","renown":"प्रतिष्ठा","FIRST-CLEAR LOOT":"पहली जीत की लूट"},"id":{"Star Duel":"Duel Bintang","Shadow Frontier":"Perbatasan Bayangan","Frontier Mastery":"Penguasaan Perbatasan","Landscape mode recommended.":"Mode lanskap disarankan.","MATCH INTERRUPTED":"PERTANDINGAN TERPUTUS","CONNECTION ERROR":"KESALAHAN KONEKSI","Cinematic 2.5D · main game":"Sinematik 2.5D · game utama","3D development preview":"Pratinjau pengembangan 3D","Connecting…":"Menghubungkan…","Disconnected":"Terputus","Matchmaking":"Mencari pertandingan","Boss HP":"HP bos","WAVE":"GELOMBANG","renown":"kemasyhuran","FIRST-CLEAR LOOT":"JARAHAN KEMENANGAN PERTAMA"},"ja":{"Star Duel":"星の決闘","Shadow Frontier":"影の辺境","Frontier Mastery":"辺境マスタリー","Landscape mode recommended.":"横向き画面を推奨します。","MATCH INTERRUPTED":"対戦が中断されました","CONNECTION ERROR":"接続エラー","Cinematic 2.5D · main game":"シネマティック2.5D · メインゲーム","3D development preview":"3D開発プレビュー","Connecting…":"接続中…","Disconnected":"切断されました","Matchmaking":"マッチング中","Boss HP":"ボスのHP","WAVE":"ウェーブ","renown":"名声","FIRST-CLEAR LOOT":"初回勝利の戦利品"},"ko":{"Star Duel":"별의 결투","Shadow Frontier":"그림자 변경","Frontier Mastery":"변경 숙련","Landscape mode recommended.":"가로 모드를 권장합니다.","MATCH INTERRUPTED":"경기가 중단됨","CONNECTION ERROR":"연결 오류","Cinematic 2.5D · main game":"시네마틱 2.5D · 메인 게임","3D development preview":"3D 개발 미리보기","Connecting…":"연결 중…","Disconnected":"연결 끊김","Matchmaking":"매칭 중","Boss HP":"보스 HP","WAVE":"웨이브","renown":"명성","FIRST-CLEAR LOOT":"첫 승리 전리품"},"zh-CN":{"Star Duel":"星辰决斗","Shadow Frontier":"暗影边境","Frontier Mastery":"边境精通","Landscape mode recommended.":"建议横屏游玩。","MATCH INTERRUPTED":"比赛中断","CONNECTION ERROR":"连接错误","Cinematic 2.5D · main game":"电影式2.5D · 主游戏","3D development preview":"3D开发预览","Connecting…":"连接中…","Disconnected":"已断开","Matchmaking":"正在匹配","Boss HP":"首领生命值","WAVE":"波次","renown":"声望","FIRST-CLEAR LOOT":"首胜战利品"}});
export const RANK_NAMES_EN=Object.freeze(["Apprentice Watcher","Frontier Scout","Thorn Hunter","Night Guide","Siren Breaker","Ash Warden","Eclipse Hunter","Star Sentinel","Summit Guardian","Darkness Splitter","Frontier Legend","Dawn Vanguard"]);
export const RANK_NAMES_NATIVE=Object.freeze({"es":["Vigía aprendiz","Explorador fronterizo","Cazador de espinas","Guía nocturno","Rompedor de sirenas","Guardián de cenizas","Cazador del eclipse","Centinela estelar","Guardián de la cumbre","Cortador de sombras","Leyenda de la frontera","Vanguardia del alba"],"pt-BR":["Vigia aprendiz","Batedor da fronteira","Caçador de espinhos","Guia noturno","Quebrador de sereias","Guardião das cinzas","Caçador do eclipse","Sentinela estelar","Guardião do cume","Rasgador das trevas","Lenda da fronteira","Vanguarda da aurora"],"fr":["Guetteur novice","Éclaireur frontalier","Chasseur d'épines","Guide nocturne","Briseur de sirènes","Gardien des cendres","Chasseur d'éclipse","Sentinelle stellaire","Gardien des sommets","Pourfendeur des ténèbres","Légende des frontières","Avant-garde de l'aube"],"de":["Wächterlehrling","Grenzspäher","Dornenjäger","Nachtführer","Sirenenbrecher","Aschenhüter","Finsternisjäger","Sternensentinel","Gipfelhüter","Dunkelheitsspalter","Grenzlegende","Morgendämmerungs-Vorhut"],"it":["Guardiano apprendista","Esploratore di confine","Cacciatore di spine","Guida notturna","Spezzasirene","Custode delle ceneri","Cacciatore dell'eclissi","Sentinella stellare","Custode delle vette","Fendioscurità","Leggenda della frontiera","Avanguardia dell'alba"],"ru":["Ученик дозорного","Пограничный разведчик","Охотник за шипами","Ночной проводник","Покоритель сирен","Хранитель пепла","Охотник затмения","Звёздный страж","Хранитель вершины","Рассекатель тьмы","Легенда границы","Авангард рассвета"],"ar":["المراقب المتدرب","كشاف الحدود","صياد الأشواك","دليل الليل","قاهر الحوريات","حارس الرماد","صياد الكسوف","حارس النجوم","حامي القمة","شاق الظلام","أسطورة الحدود","طليعة الفجر"],"hi":["प्रशिक्षु प्रहरी","सीमा स्काउट","काँटा शिकारी","रात्रि मार्गदर्शक","सायरन विजेता","राख रक्षक","ग्रहण शिकारी","तारा प्रहरी","शिखर रक्षक","अंधकार भेदी","सीमा की किंवदंती","भोर का अग्रदूत"],"id":["Pengawas pemula","Pengintai perbatasan","Pemburu duri","Pemandu malam","Pematah siren","Penjaga abu","Pemburu gerhana","Penjaga bintang","Pelindung puncak","Pembelah kegelapan","Legenda perbatasan","Pelopor fajar"],"ja":["見習い監視者","辺境の斥候","棘の狩人","夜の案内人","セイレーン破り","灰の守護者","日食の狩人","星の番人","頂の守護者","闇裂き","辺境の伝説","暁の先駆者"],"ko":["견습 감시자","변경 정찰병","가시 사냥꾼","밤의 길잡이","사이렌 파괴자","잿빛 수호자","일식 사냥꾼","별의 파수꾼","정상 수호자","어둠의 절단자","변경의 전설","새벽의 선봉"],"zh-CN":["见习守望者","边境斥候","荆棘猎手","夜行向导","海妖破除者","灰烬守卫","日蚀猎手","星辰哨卫","峰顶守护者","破暗者","边境传奇","黎明先锋"]});
export const AUTH_ERROR_CODES=Object.freeze({"invalid_credentials":"auth.invalidCredentials","email_not_confirmed":"auth.notConfirmed","over_request_rate_limit":"auth.limit","over_email_send_rate_limit":"auth.limit","session_expired":"auth.unauthorized","session_not_found":"auth.unauthorized","request_timeout":"auth.connection","unexpected_failure":"auth.failed","signup_disabled":"auth.failed","validation_failed":"auth.invalidForm","email_address_invalid":"auth.badAddress","no_authorization":"auth.unauthorized"});
const caches=new Map();
function glossary(language){
 if(caches.has(language))return caches.get(language);
 const map=new Map();
 for(const [en,native] of Object.entries(OFFICIAL_TRANSLATIONS[language]||{}))map.set(en,native);
 for(const [en,native] of Object.entries(REALM_UI[language]||{}))if(!map.has(en))map.set(en,native);
 for(const pack of [SHARED_TRANSLATIONS,TEAM_TRANSLATIONS,GUILD_TRANSLATIONS,REWARD_TRANSLATIONS,ARMORY_TRANSLATIONS,SHELL_TRANSLATIONS,AUTH_MESSAGES]){
  for(const [key,en] of Object.entries(pack.en||{})){
   const native=pack[language]?.[key];
   if(typeof en==='string'&&typeof native==='string'&&!en.includes('{')&&!map.has(en))map.set(en,native);
  }
 }
 const enWorld=WORLD_LANGUAGES.en,world=WORLD_LANGUAGES[language];
 for(const section of ['buildings','stages','resources']){
  for(const [id,english] of Object.entries(enWorld?.[section]||{})){
   const native=world?.[section]?.[id];
   if(typeof english==='string'&&typeof native==='string'&&!map.has(english))map.set(english,native);
   else if(english&&typeof english==='object'&&native&&typeof native==='object'){
    for(const [field,v] of Object.entries(english))if(typeof v==='string'&&typeof native[field]==='string'&&!map.has(v))map.set(v,native[field]);
   }
  }
 }
 const enHeroes=HERO_UI.en,heroes=HERO_UI[language];
 for(const section of ['titles','abilities','roles'])for(const [id,english] of Object.entries(enHeroes?.[section]||{})){
  const native=heroes?.[section]?.[id];if(typeof english==='string'&&typeof native==='string'&&!map.has(english))map.set(english,native);
 }
 const enItems=ITEM_NAMES.en,items=ITEM_NAMES[language];
 for(const section of ['names','sets'])for(const [id,english] of Object.entries(enItems?.[section]||{})){
  const native=items?.[section]?.[id];if(typeof english==='string'&&typeof native==='string'&&!map.has(english))map.set(english,native);
 }
 for(const [en,native] of Object.entries(MAZE_TRANSLATIONS[language]||{}))map.set(en,native);
 for(const [en,native] of Object.entries(PREMIUM_STORE_NATIVE[language]||{}))map.set(en,native);
 for(const [en,native] of Object.entries(WARFRONT_NATIVE[language]||{}))map.set(en,native);
 for(const [en,native] of Object.entries(BUILDING_NATIVE[language]||{}))map.set(en,native);
 for(const [en,native] of Object.entries(BUILDING_ADVANCED_NATIVE[language]||{}))map.set(en,native);
 for(const [en,native] of Object.entries(ARENA_NATIVE[language]||{}))map.set(en,native);
 for(const [en,native] of Object.entries(UNIFIED_PACK[language]||{}))map.set(en,native);
 for(const [en,native] of Object.entries(AUXILIARY_NATIVE[language]||{}))map.set(en,native);
 for(const [en,native] of Object.entries(SHADOW_HUD_NATIVE[language]||{}))map.set(en,native);
 for(const [en,native] of Object.entries(APP_NATIVE[language]||{}))map.set(en,native);
 RANK_NAMES_EN.forEach((en,i)=>map.set(en,RANK_NAMES_NATIVE[language]?.[i]||en));
 caches.set(language,map);return map;
}
export function bilingual(tr,en){
 const l=getLocale();return l==='tr'?tr:l==='en'?en:glossary(l).get(en)??en;
}
export function hasNativeBilingual(english,language=getLocale()){
 if(language==='tr'||language==='en')return true;
 return glossary(language).has(english);
}
export function shadowRankName(index){
 if(!Number.isInteger(index)||index<0||index>=12)return null;
 return getLocale()==='tr'?null:bilingual(null,RANK_NAMES_EN[index]);
}
export function localizeServerError(error){
 const message=typeof error==='string'?error:typeof error?.message==='string'?error.message:'';
 const raw=typeof error?.code==='string'?error.code:message;
 const aliases={'Invalid login credentials':'invalid_credentials','Email not confirmed':'email_not_confirmed','JWT expired':'session_expired','Too many requests':'over_request_rate_limit'};
 const id=aliases[raw]||raw,auth=AUTH_ERROR_CODES[id];
 return auth?AUTH_MESSAGES[getLocale()]?.[auth]??message:message;
}
export function auditUnified(){
 return SUPPORTED_LOCALES.filter(l=>l!=='tr'&&l!=='en').flatMap(l=>[
  ...UNIFIED_KEYS.filter(key=>!UNIFIED_PACK[l]?.[key]?.trim()).map(key=>l+'.glossary.'+key),
  ...RANK_NAMES_EN.filter((_,i)=>!RANK_NAMES_NATIVE[l]?.[i]?.trim()).map(key=>l+'.rank.'+key)
 ]).concat(SUPPORTED_LOCALES.flatMap(l=>Object.values(AUTH_ERROR_CODES).filter(key=>!AUTH_MESSAGES[l]?.[key]?.trim()).map(key=>l+'.server.'+key)));
}
