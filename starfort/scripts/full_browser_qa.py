"""Starfort UI smoke test without browser localhost permissions.
Runs the actual app.js from data-URI modules and inlines static images/CSS.
This cannot validate live server fetch (covered by guild.integration.test.mjs).
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import base64,re,json
root=Path(__file__).resolve().parents[1]
def enc(t,mime):return 'data:'+mime+';base64,'+base64.b64encode(t).decode()
cache={}
static_images={}
for im in list(root.glob('assets/*.webp'))+list(root.glob('assets/city/*.webp')):
 static_images['assets/'+str(im.relative_to(root/'assets'))]=enc(im.read_bytes(),'image/webp')
def module(file):
 name=file.name
 if name in cache:return cache[name]
 s=file.read_text()
 if name=='illustrated-scene.js':
  s=re.sub(r"new URL\('\./assets/city/[^']+',import\.meta\.url\)\.href", "'about:blank'", s)
 def image_replace(m):
  return static_images.get(m.group(0),m.group(0))
 # Do not inline images: browser rejects localhost assets in this sandbox.
 # Image errors are handled by the normal scene fallback.
 def imp(m):return m.group(1)+repr(module((file.parent/m.group(2)).resolve()))
 s=re.sub(r'(from\s+)[\'\"](\./[^\'\"]+)[\'\"]',imp,s)
 url=enc(s.encode(),'text/javascript')
 cache[name]=url
 return url
app=module(root/'app.js')
css='\n'.join((root/x).read_text() for x in ['style.css','art.css','battle.css','city.css','premium.css','tactics.css'])
# Preserve the original CSS URL references; artwork can be absent for logic testing.
html=(root/'index.html').read_text()
html=re.sub(r'<link[^>]+(?:stylesheet|preload)[^>]*>', '',html)
html=re.sub(r'<script>\s*if \(location\.protocol[\s\S]+?</script>', '',html)
html=html.replace('</head>','<style>'+css+'</style></head>').replace('</body>','<script type="module" src="'+app+'"></script></body>')
results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for label,size in [('desktop',{'width':1536,'height':960}),('mobile',{'width':390,'height':844}),('landscape',{'width':844,'height':390})]:
  page=browser.new_page(viewport=size);errors=[];page.on('pageerror',lambda e: errors.append(str(e)))
  try:
   page.set_content(html,wait_until='domcontentloaded',timeout=20000)
   page.locator('#resources .resource').first.wait_for(timeout=9000)
   page.locator('[data-view="expedition"]').first.click()
   page.locator('[data-training-open]').click()
   page.locator('#training-canvas').wait_for(timeout=3000)
   page.locator('[data-training-ability="burst"]').click()
   page.locator('[data-close-view]').first.click()
   page.locator('[data-view="guild"]').first.click()
   # Guild remains offline because about:blank origin has no /api endpoint.
   page.wait_for_timeout(200)
   result={'state':'PASS','size':label,'resources':page.locator('.resource').count(),'nav':page.locator('.nav-item').count(),'errors':errors,'scrollWidth':page.evaluate('document.documentElement.scrollWidth'),'width':size['width']}
   results.append(result)
  except Exception as e:results.append({'state':'FAIL','size':label,'error':str(e)[:360],'errors':errors})
  page.close()
 browser.close()
print(json.dumps(results,ensure_ascii=False,indent=2))
if any(r['state']!='PASS' or r.get('errors') for r in results):exit(1)
