/** Caravan trade presentation in fourteen languages. Route IDs, prices, caps and UTC policy are never translated. */
import {SUPPORTED_LOCALES} from './locale-v243.js';
export const CARAVAN_UI_KEYS=Object.freeze(["aria","eyebrow","intro","trades","done","keepRequired","dailyUsed","storageFull","insufficient","note"]);
const VALUES={
 "tr": {
  "routes": [
   [
    "Karaorman Kereste Kervanı",
    "Altın ve taş karşılığında surlar için kereste taşı."
   ],
   [
    "Aytaşı Taşçı Birliği",
    "Taş ustalarını gönder, kalenin duvarlarını hızlandır."
   ],
   [
    "Yıldız Gözcüleri Seferi",
    "Nadir yıldız özü elde etmek için diğer kaynakları feda et."
   ]
  ],
  "ui": [
   "Kervan pazarı ve günlük kaynak takası",
   "KRALLIK LOJİSTİĞİ · SUNUCU TAKASI",
   "Hangi malzemenin eksik olduğuna sen karar ver. Günlük en fazla iki ayrı ticaret tamamlanır. Teklifler ücretsiz kaynak üretmez.",
   "HAK",
   "Bugün yapıldı",
   "Kale seviye {level} gerekli",
   "Günlük hak bitti",
   "Depo dolu",
   "Kaynak yetersiz",
   "Takaslar sunucuda kaynak ve günlük sınır doğrulanarak işlenir. Aynı ticaret aynı gün ikinci kez yapılamaz. Haklar UTC gün değişiminde yenilenir."
  ]
 },
 "en": {
  "routes": [
   [
    "Blackwood Timber Caravan",
    "Haul timber to the walls in exchange for gold and stone."
   ],
   [
    "Moonstone Mason Guild",
    "Send stonemasons to strengthen the keep walls."
   ],
   [
    "Stargazer Expedition",
    "Trade surplus resources for rare Star essence."
   ]
  ],
  "ui": [
   "Caravan market and daily resource trades",
   "KINGDOM LOGISTICS · VERIFIED TRADING",
   "Choose which resource you need. You can complete up to two different trades per day. Trades do not create free resources.",
   "TRADES",
   "Already traded today",
   "Keep level {level} required",
   "Daily trades used",
   "Storage full",
   "Insufficient resources",
   "The server checks balances and daily limits. Each trade is available only once per UTC day; allowances reset at 00:00 UTC."
  ]
 },
 "es": {
  "routes": [
   [
    "Caravana de madera del Bosque Negro",
    "Transporta madera para las murallas a cambio de oro y piedra."
   ],
   [
    "Gremio de canteros de Piedra Lunar",
    "Envía canteros para reforzar los muros de la fortaleza."
   ],
   [
    "Expedición de los astrónomos",
    "Intercambia recursos sobrantes por esencia estelar rara."
   ]
  ],
  "ui": [
   "Mercado de caravanas e intercambios diarios",
   "LOGÍSTICA DEL REINO · INTERCAMBIO VERIFICADO",
   "Elige el recurso que necesites. Puedes hacer hasta dos intercambios distintos al día. No se generan recursos gratis.",
   "INTERCAMBIOS",
   "Ya intercambiado hoy",
   "Se requiere fortaleza nivel {level}",
   "Límite diario alcanzado",
   "Almacén lleno",
   "Recursos insuficientes",
   "El servidor comprueba recursos y límites diarios. Cada intercambio se realiza una vez por día UTC; se reinicia a las 00:00 UTC."
  ]
 },
 "pt-BR": {
  "routes": [
   [
    "Caravana de madeira da Floresta Negra",
    "Leve madeira para as muralhas em troca de ouro e pedra."
   ],
   [
    "Guilda dos pedreiros de Pedra Lunar",
    "Envie pedreiros para reforçar as muralhas da fortaleza."
   ],
   [
    "Expedição dos observadores de estrelas",
    "Troque recursos excedentes por essência estelar rara."
   ]
  ],
  "ui": [
   "Mercado de caravanas e trocas diárias",
   "LOGÍSTICA DO REINO · TROCAS VERIFICADAS",
   "Escolha o recurso de que precisa. Faça até duas trocas diferentes por dia. As trocas não criam recursos gratuitos.",
   "TROCAS",
   "Já trocado hoje",
   "Fortaleza nível {level} necessária",
   "Limite diário atingido",
   "Depósito cheio",
   "Recursos insuficientes",
   "O servidor verifica recursos e limites diários. Cada troca ocorre uma vez por dia UTC; o limite é renovado às 00:00 UTC."
  ]
 },
 "fr": {
  "routes": [
   [
    "Caravane de bois de la Forêt Noire",
    "Transportez du bois pour les remparts contre de l'or et de la pierre."
   ],
   [
    "Guilde des maçons de Pierre de Lune",
    "Envoyez des maçons renforcer les murs du donjon."
   ],
   [
    "Expédition des observateurs d'étoiles",
    "Échangez des ressources contre de l'essence stellaire rare."
   ]
  ],
  "ui": [
   "Marché des caravanes et échanges quotidiens",
   "LOGISTIQUE DU ROYAUME · ÉCHANGES VALIDÉS",
   "Choisissez les ressources nécessaires. Effectuez jusqu'à deux échanges différents par jour. Aucun échange ne crée des ressources gratuites.",
   "ÉCHANGES",
   "Déjà échangé aujourd'hui",
   "Donjon niveau {level} requis",
   "Limite quotidienne atteinte",
   "Stockage plein",
   "Ressources insuffisantes",
   "Le serveur vérifie les stocks et limites. Chaque échange est possible une fois par jour UTC ; remise à zéro à 00:00 UTC."
  ]
 },
 "de": {
  "routes": [
   [
    "Schwarzwald-Holzkarawane",
    "Bringe Holz für die Mauern im Tausch gegen Gold und Stein."
   ],
   [
    "Mondstein-Steinmetzgilde",
    "Schicke Steinmetze zur Verstärkung der Burgmauern."
   ],
   [
    "Sternengucker-Expedition",
    "Tausche überschüssige Ressourcen gegen seltene Sternenessenz."
   ]
  ],
  "ui": [
   "Karawanenmarkt und täglicher Ressourcentausch",
   "KÖNIGREICHSLOGISTIK · SERVERGEPRÜFTER HANDEL",
   "Wähle die benötigte Ressource. Pro Tag sind bis zu zwei verschiedene Tauschgeschäfte möglich. Es entstehen keine kostenlosen Ressourcen.",
   "TAUSCHE",
   "Heute bereits getauscht",
   "Burgstufe {level} erforderlich",
   "Tageslimit erreicht",
   "Lager voll",
   "Zu wenige Ressourcen",
   "Der Server prüft Bestände und Tageslimits. Jeder Handel ist pro UTC-Tag einmal möglich; Zurücksetzung um 00:00 UTC."
  ]
 },
 "it": {
  "routes": [
   [
    "Carovana del legname della Foresta Nera",
    "Trasporta legname alle mura in cambio di oro e pietra."
   ],
   [
    "Gilda dei muratori di Pietra Lunare",
    "Invia muratori per rafforzare le mura del castello."
   ],
   [
    "Spedizione degli osservatori stellari",
    "Scambia risorse in eccesso con rara essenza stellare."
   ]
  ],
  "ui": [
   "Mercato delle carovane e scambi giornalieri",
   "LOGISTICA DEL REGNO · SCAMBI VERIFICATI",
   "Scegli la risorsa necessaria. Puoi effettuare fino a due scambi diversi al giorno. Gli scambi non creano risorse gratuite.",
   "SCAMBI",
   "Già scambiato oggi",
   "Castello di livello {level} richiesto",
   "Limite giornaliero raggiunto",
   "Magazzino pieno",
   "Risorse insufficienti",
   "Il server verifica risorse e limiti giornalieri. Ogni scambio è disponibile una volta al giorno UTC; ripristino alle 00:00 UTC."
  ]
 },
 "ru": {
  "routes": [
   [
    "Лесной караван Чернолесья",
    "Доставьте древесину для стен в обмен на золото и камень."
   ],
   [
    "Гильдия каменщиков Лунного камня",
    "Отправьте каменщиков укрепить крепостные стены."
   ],
   [
    "Экспедиция звездочётов",
    "Обменяйте излишки ресурсов на редкую звёздную эссенцию."
   ]
  ],
  "ui": [
   "Рынок караванов и ежедневный обмен",
   "ЛОГИСТИКА КОРОЛЕВСТВА · ПРОВЕРЕННЫЙ ОБМЕН",
   "Выбирайте необходимые ресурсы. В день доступно до двух разных обменов. Бесплатные ресурсы не создаются.",
   "ОБМЕНЫ",
   "Сегодня уже обменяно",
   "Требуется замок уровня {level}",
   "Дневной лимит исчерпан",
   "Хранилище заполнено",
   "Недостаточно ресурсов",
   "Сервер проверяет остатки и дневные лимиты. Каждый обмен возможен один раз за день UTC; обновление в 00:00 UTC."
  ]
 },
 "ar": {
  "routes": [
   [
    "قافلة أخشاب الغابة السوداء",
    "انقل الأخشاب للأسوار مقابل الذهب والحجر."
   ],
   [
    "نقابة بنّائي حجر القمر",
    "أرسل البنّائين لتقوية جدران القلعة."
   ],
   [
    "بعثة راصدي النجوم",
    "استبدل الموارد الزائدة بجوهر نجوم نادر."
   ]
  ],
  "ui": [
   "سوق القوافل والتبادل اليومي",
   "إمداد المملكة · تبادل موثق",
   "اختر الموارد التي تحتاجها. يمكنك إتمام صفقتين مختلفتين يومياً بحد أقصى. لا تنشئ الصفقات موارد مجانية.",
   "صفقات",
   "أُنجزت الصفقة اليوم",
   "يلزم مستوى القلعة {level}",
   "انتهى الحد اليومي",
   "المخزن ممتلئ",
   "الموارد غير كافية",
   "يتحقق الخادم من الرصيد والحد اليومي. لا يمكن تنفيذ الصفقة نفسها إلا مرة في يوم UTC؛ يتجدد الحد عند 00:00 UTC."
  ]
 },
 "hi": {
  "routes": [
   [
    "काले वन का लकड़ी कारवाँ",
    "सोने और पत्थर के बदले दीवारों के लिए लकड़ी ले जाएँ।"
   ],
   [
    "चंद्रशिला राजमिस्त्री संघ",
    "किले की दीवारें मजबूत करने के लिए राजमिस्त्री भेजें।"
   ],
   [
    "तारा-दर्शक अभियान",
    "दुर्लभ तारा सार पाने के लिए अतिरिक्त संसाधनों का विनिमय करें।"
   ]
  ],
  "ui": [
   "कारवाँ बाज़ार और दैनिक संसाधन विनिमय",
   "राज्य आपूर्ति · सर्वर-सत्यापित विनिमय",
   "आवश्यक संसाधन चुनें। एक दिन में अधिकतम दो अलग व्यापार कर सकते हैं। व्यापार से मुफ्त संसाधन नहीं बनते।",
   "व्यापार",
   "आज व्यापार हो चुका है",
   "किला स्तर {level} आवश्यक है",
   "दैनिक सीमा पूरी हुई",
   "भंडार भरा है",
   "संसाधन अपर्याप्त हैं",
   "सर्वर संसाधन और दैनिक सीमा जाँचता है। प्रत्येक व्यापार प्रति UTC दिन केवल एक बार; 00:00 UTC पर सीमा रीसेट होती है।"
  ]
 },
 "id": {
  "routes": [
   [
    "Karavan Kayu Hutan Hitam",
    "Angkut kayu untuk tembok dengan menukar emas dan batu."
   ],
   [
    "Serikat Tukang Batu Bulan",
    "Kirim tukang batu untuk memperkuat dinding benteng."
   ],
   [
    "Ekspedisi Pengamat Bintang",
    "Tukarkan sumber daya berlebih dengan esensi bintang langka."
   ]
  ],
  "ui": [
   "Pasar karavan dan perdagangan harian",
   "LOGISTIK KERAJAAN · PERDAGANGAN TERVERIFIKASI",
   "Pilih sumber daya yang diperlukan. Maksimal dua jenis perdagangan berbeda per hari. Perdagangan tidak menghasilkan sumber daya gratis.",
   "PERDAGANGAN",
   "Sudah diperdagangkan hari ini",
   "Benteng level {level} diperlukan",
   "Batas harian habis",
   "Gudang penuh",
   "Sumber daya tidak cukup",
   "Server memeriksa saldo dan batas harian. Setiap perdagangan hanya sekali per hari UTC; diatur ulang pukul 00:00 UTC."
  ]
 },
 "ja": {
  "routes": [
   [
    "黒森の木材キャラバン",
    "金と石を交換して城壁用の木材を運びます。"
   ],
   [
    "月長石の石工組合",
    "石工を派遣し、城の壁を強化します。"
   ],
   [
    "星見の遠征隊",
    "余剰資源を希少な星の精髄と交換します。"
   ]
  ],
  "ui": [
   "キャラバン市場と毎日の資源交換",
   "王国の物流 · サーバー認証取引",
   "必要な資源を選びましょう。1日に異なる取引を最大2回実行できます。無料の資源は生成されません。",
   "取引",
   "本日は取引済み",
   "城レベル{level}が必要",
   "本日の回数上限",
   "倉庫が満杯です",
   "資源が不足しています",
   "サーバーが残高と1日の制限を確認します。同じ取引はUTC日付につき1回のみ。00:00 UTCに回数が更新されます。"
  ]
 },
 "ko": {
  "routes": [
   [
    "검은숲 목재 대상단",
    "금과 석재를 교환해 성벽용 목재를 운송합니다."
   ],
   [
    "월장석 석공 조합",
    "석공을 보내 성벽을 강화합니다."
   ],
   [
    "별 관측자 원정대",
    "남는 자원을 희귀한 별의 정수로 교환합니다."
   ]
  ],
  "ui": [
   "대상단 시장 및 일일 자원 교환",
   "왕국 물류 · 서버 검증 거래",
   "필요한 자원을 선택하세요. 하루에 서로 다른 거래를 최대 2회 완료할 수 있습니다. 무료 자원은 생성되지 않습니다.",
   "거래",
   "오늘 이미 거래함",
   "성 레벨 {level} 필요",
   "일일 한도 소진",
   "창고가 가득 참",
   "자원 부족",
   "서버가 자원과 일일 한도를 확인합니다. 같은 거래는 UTC 기준 하루 한 번만 가능하며 00:00 UTC에 초기화됩니다."
  ]
 },
 "zh-CN": {
  "routes": [
   [
    "黑森林木材商队",
    "用金币和石材换取城墙所需的木材。"
   ],
   [
    "月长石石匠公会",
    "派遣石匠加固城堡城墙。"
   ],
   [
    "观星者远征队",
    "用剩余资源兑换稀有星辰精华。"
   ]
  ],
  "ui": [
   "商队市场与每日资源交换",
   "王国物流 · 服务器验证交易",
   "选择需要的资源。每天最多完成两种不同交易。交易不会生成免费资源。",
   "交易",
   "今日已交易",
   "需要城堡等级{level}",
   "今日次数已用完",
   "仓库已满",
   "资源不足",
   "服务器验证资源余额与每日限制。同一种交易每个UTC日只能进行一次；每日00:00 UTC重置。"
  ]
 }
};
export const CARAVAN_TRANSLATIONS=Object.freeze(Object.fromEntries(Object.entries(VALUES).map(([lang,p])=>[lang,Object.freeze({routes:Object.freeze(Object.fromEntries(['wood','stone','aether'].map((id,i)=>[id,Object.freeze({name:p.routes[i][0],description:p.routes[i][1]})]))),ui:Object.freeze(Object.fromEntries(CARAVAN_UI_KEYS.map((key,i)=>[key,p.ui[i]])))})])));
export const auditCaravanTranslations=()=>SUPPORTED_LOCALES.flatMap(lang=>{
 const p=CARAVAN_TRANSLATIONS[lang];if(!p)return [lang+':missing'];
 return [...['wood','stone','aether'].flatMap(id=>!p.routes[id]?.name||!p.routes[id]?.description?[lang+':'+id]:[]),...CARAVAN_UI_KEYS.filter(k=>!p.ui[k]?.trim()).map(k=>lang+':'+k),...(!p.ui.keepRequired.includes('{level}')?[lang+':keepRequired placeholder']:[])];
});
