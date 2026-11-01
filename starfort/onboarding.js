/** First-5-minutes guide: first fight → first reward → first upgrade. Pure step logic + a tiny coach card. */
export const ONBOARD_KEY='starfort:onboarding';
export const ONBOARD_STEPS=Object.freeze(['fight','upgrade','done']);
export function normalizeStep(value){return ONBOARD_STEPS.includes(value)?value:'fight';}
export function advanceOnboarding(step,event){
  step=normalizeStep(step);
  if(event==='skip')return 'done';
  if(step==='fight'&&event==='practice-result')return 'upgrade';
  if(step==='upgrade'&&event==='upgraded')return 'done';
  return step;
}
export const ONBOARD_COPY=Object.freeze({
  fight:{step:'1/3',title:'İlk savaşın',text:'Yıldız Kalesi seni bekliyor. Bir bot düellosuna gir: Saldır\'a basılı tut, kahramanın rakibe kendisi yürür.',cta:'⚔ İlk savaşa gir'},
  upgrade:{step:'2/3',title:'Ödülünü harca',text:'Savaş ödülü kalene eklendi. Şimdi Hasat Avlusu\'nu geliştir: daha çok altın, daha hızlı büyüme.',cta:'🌾 Hasat Avlusu\'nu geliştir'},
});
export function mountOnboarding({storage,onFight,onUpgrade}){
  let step=normalizeStep(storage.getItem(ONBOARD_KEY));
  const card=document.createElement('aside');card.className='sf-coach';card.setAttribute('role','dialog');card.setAttribute('aria-label','Başlangıç rehberi');document.body.appendChild(card);
  function render(){const c=ONBOARD_COPY[step];card.hidden=!c;if(!c)return;
    card.innerHTML=`<small>BAŞLANGIÇ ${c.step}</small><b>${c.title}</b><p>${c.text}</p><div><button class="primary" data-coach-go>${c.cta}</button><button class="secondary" data-coach-skip>Geç</button></div>`;}
  card.addEventListener('click',e=>{if(e.target.closest('[data-coach-skip]'))fire('skip');else if(e.target.closest('[data-coach-go]'))(step==='fight'?onFight:onUpgrade)?.();});
  function fire(event){const next=advanceOnboarding(step,event);if(next!==step){step=next;storage.setItem(ONBOARD_KEY,step);render();return true;}return false;}
  render();
  return {fire,get step(){return step;}};
}
