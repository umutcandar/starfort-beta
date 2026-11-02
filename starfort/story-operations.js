/** Story operations shown inside each server-authoritative chapter.
 * Names and objectives are presentation only. The server owns wave count,
 * combat turns, health and all rewards. */
export const STORY_OPERATIONS=Object.freeze(Object.fromEntries([["Sönük Fenerler","Fenerleri koruyup akıncıların ilk baskınını durdur.","Erzak Yolu","Erzak kervanını kuşatmadan çıkar.","Kül Kumandanı","Geçidin kumandanını son siperinde yen."],["Mahzen Kapısı","Şapelin girişindeki gölge nöbetini dağıt.","Yaralıların Koridoru","Mira'ya giden koridoru güvene al.","Kırık Çan Ayini","Gölge rahiplerinin ayinini boz ve Mira'yı kurtar."],["Dikenli Yol","İz sürücülerin tuttuğu sınır yolunu aç.","Kayıp Keşif","Yıldız parçasını arayan birliği kurtar.","Köklerin Efendisi","Ormanın kadim muhafızına karşı son mevziyi tut."],["Yıkılmış Burç","Doran'ın sur yolundaki düşmanları geri püskürt.","Çelik Köprü","Demir lejyonunun takviyesini kes.","Celladın Örsü","Demir Cellat'ın üç safhalı kuşatmasını kır."],["Mühürlü Merdiven","Mahzenin içindeki gözcüleri durdur.","Uyanan Mezarlar","Karanlık ayini tamamlanmadan safları temizle.","Çekirdeğin Nöbeti","Yıldız çekirdeğini koruyan son muhafızı yen."],["Kar Geçidi","Ayaz birliğinin gözetleme hattını aş.","Donmuş Muhafızlar","Buzdan surda kaybolan nöbeti durdur.","Ayaz Komutanı","Komutanın son nefesine kadar süren savaşı kazan."],["Sönen Aynalar","Tutulmanın enerji aynalarını devre dışı bırak.","Kule Merdivenleri","Büyücülerin son savunma hattını temizle.","Tutulma Çekirdeği","Kule çekirdeğini koruyan muhafızları yen."],["Yıldızsız Kapı","Tahta giden son kapıyı koruyanları yen.","Sessiz Muhafızlar","Kadim yeminlilerin savunmasını aş.","Boşluk Tahtı","Hükümdarın üç aşamalı son direnişini durdur."]].map((rows,index)=>[
 index+1,Object.freeze(Array.from({length:3},(_,i)=>Object.freeze({id:`${index+1}-${i+1}`,title:rows[i*2],objective:rows[i*2+1]})))
])));
export function operationStatus(mission){
 if(!mission||mission.mode!=='story'||!Number.isInteger(mission.stage)||!STORY_OPERATIONS[mission.stage])return null;
 const total=Number.isInteger(mission.waves)&&mission.waves>=1&&mission.waves<=3?mission.waves:1;
 const wave=Number.isInteger(mission.wave)&&mission.wave>=1&&mission.wave<=total?mission.wave:1;
 const entry=STORY_OPERATIONS[mission.stage][Math.min(2,wave-1)];
 return Object.freeze({...entry,wave,total,completed:wave-1});
}
