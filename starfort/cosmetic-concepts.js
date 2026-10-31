// Non-commercial research concepts. Interest is not a purchase or payment intent.
export const COSMETIC_CONCEPTS=Object.freeze([
  {id:'castle-night',name:'Gece Yıldızı Kalesi',category:'Kale görünümü',detail:'Kulenin mavi kristal ışıkları ve koyu taş mimarisi.'},
  {id:'hero-cape',name:'Yeminli Komutan Pelerini',category:'Kahraman kostümü',detail:'Altın işlemeli savaş pelerini; istatistik değiştirmez.'},
  {id:'clan-banner',name:'Efsanevi Klan Sancağı',category:'Klan kimliği',detail:'Klanın armasını ve savaş rengini öne çıkaran sancak.'},
  {id:'victory-trail',name:'Yıldız Zaferi Efekti',category:'Zafer animasyonu',detail:'Maç sonucunda kısa yıldız parçacıkları gösterisi.'},
]);
export function restoreWishlist(raw){
  if(!Array.isArray(raw))return [];
  return [...new Set(raw)].filter(id=>typeof id==='string'&&COSMETIC_CONCEPTS.some(c=>c.id===id)).slice(0,4);
}
export function toggleWishlist(state,id){
  if(!COSMETIC_CONCEPTS.some(c=>c.id===id))return {ok:false,error:'Bilinmeyen tasarım.'};
  state.cosmeticWishlist=restoreWishlist(state.cosmeticWishlist);
  state.cosmeticWishlist=state.cosmeticWishlist.includes(id)?state.cosmeticWishlist.filter(x=>x!==id):[...state.cosmeticWishlist,id];
  return {ok:true,selected:state.cosmeticWishlist.includes(id)};
}
