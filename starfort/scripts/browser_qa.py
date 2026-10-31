"""Sandbox-compatible browser smoke test of the actual tactical UI module.
The sandbox blocks localhost browser navigation, so only the training module is
loaded with data: module URLs. The guild REST API has separate HTTP tests.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import base64,json,re
root=Path(__file__).resolve().parents[1]
enc=lambda s:'data:text/javascript;base64,'+base64.b64encode(s.encode()).decode()
core=enc((root/'tactics.js').read_text())
view=(root/'tactics-view.js').read_text().replace("'./tactics.js'",repr(core))
view=view.replace('export function mountTraining','function mountTraining')
view+='\nconst clean=mountTraining(document.querySelector("#workspace"));window.__gameMounted=true;\n'
css=(root/'tactics.css').read_text()
bg='data:image/webp;base64,'+base64.b64encode((root/'assets/battlefield.webp').read_bytes()).decode()
css=css.replace('assets/battlefield.webp',bg)
html=f'''<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{{box-sizing:border-box}}body{{margin:0;background:#081827;color:#f1d6a2;font-family:system-ui}}button{{cursor:pointer}}button:focus-visible{{outline:2px solid #e5bd65}}#workspace{{max-width:1300px;margin:auto;padding:20px}}h2{{font-size:32px;margin:8px 0}}h3{{font-size:24px}}.eyebrow{{font-size:10px;letter-spacing:2px}}.primary,.secondary{{padding:12px;background:#ba985d;border:1px solid #dac38b;border-radius:5px;color:#132234}}.training-title{{display:flex;justify-content:space-between;align-items:center;gap:12px}}{css}</style><main id="workspace"></main><script type="module" src="{enc(view)}"></script></html>'''
url='data:text/html;base64,'+base64.b64encode(html.encode()).decode()
results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for label,size in [('desktop',{'width':1536,'height':960}),('mobile',{'width':390,'height':844}),('landscape',{'width':844,'height':390})]:
  page=browser.new_page(viewport=size);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  try:
   page.set_content(html,wait_until='load',timeout=16000)
   page.locator('#training-canvas').wait_for(timeout=6500)
   page.keyboard.press('w');page.locator('[data-training-squad="1"]').click()
   page.locator('[data-training-order="advance"]').click();page.locator('#training-canvas').click(position={'x':210,'y':120})
   page.locator('[data-training-ability="burst"]').click();page.wait_for_timeout(400)
   view={'state':'PASS','size':label,'squads':page.locator('.training-squad').count(),'header':page.locator('.training-title h2').inner_text(),'event':page.locator('#training-event').inner_text(),'errors':errors,'scrollWidth':page.evaluate('document.documentElement.scrollWidth'),'width':size['width']}
   page.screenshot(path=str(root.parent/('Starfort_v1_1_Tatbikat_'+label+'.png')),full_page=True)
   results.append(view)
  except Exception as ex: results.append({'state':'FAIL','size':label,'error':str(ex)[:250],'errors':errors})
  page.close()
 browser.close()
print(json.dumps(results,ensure_ascii=False,indent=2))
if any(r['state']!='PASS' or r.get('errors') for r in results):exit(1)
