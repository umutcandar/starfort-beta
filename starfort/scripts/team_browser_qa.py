"""Browser UI smoke test via Python HTTP bridge (localhost browser navigation restricted).
The actual HTTP match is verified independently with arena.integration.test.mjs.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import base64, json, re, urllib.request
ROOT=Path(__file__).resolve().parents[1]
BASE='http://127.0.0.1:8977'
def enc(blob,mime):return 'data:'+mime+';base64,'+base64.b64encode(blob).decode()
modules={}
def module(file):
    if file in modules:return modules[file]
    s=file.read_text()
    if file.name=='illustrated-scene.js':
        s=re.sub(r"new URL\('\./assets/city/[^']+',import\.meta\.url\)\.href", "'about:blank'",s)
    s=re.sub(r'(from\s+)[\'\"](\./[^\'\"]+)[\'\"]',lambda m:m.group(1)+repr(module((file.parent/m.group(2)).resolve())),s)
    modules[file]=enc(s.encode(),'text/javascript')
    return modules[file]
app=module(ROOT/'app.js')
css='\n'.join((ROOT/f).read_text() for f in ['style.css','art.css','battle.css','city.css','premium.css','tactics.css','arena.css','team.css'])
html=(ROOT/'index.html').read_text()
html=re.sub(r'<link[^>]+(?:stylesheet|preload)[^>]*>','',html)
html=re.sub(r'<script>\s*if \(location\.protocol[\s\S]+?</script>','',html)
css=css.replace("url('assets/battlefield.webp')","url('"+enc((ROOT/'assets/battlefield.webp').read_bytes(),'image/webp')+"')")
html=html.replace('</head>',f'<style>{css}</style></head>')
html=html.replace('src="icon.svg"','src="'+enc((ROOT/'icon.svg').read_bytes(),'image/svg+xml')+'"').replace('src="assets/aldren.webp"','src="'+enc((ROOT/'assets/aldren.webp').read_bytes(),'image/webp')+'"')
html=html.replace('</body>',f'<script type="module" src="{app}"></script></body>')
def api(route,token=None,body=None):
    headers={'Content-Type':'application/json'}
    if token:headers['Authorization']='Bearer '+token
    request=urllib.request.Request(BASE+'/api/'+route,headers=headers,**({'data':json.dumps(body).encode()} if body is not None else {}))
    try:
        with urllib.request.urlopen(request,timeout=7) as r:return {'status':r.status,'data':json.load(r)}
    except urllib.error.HTTPError as error:return {'status':error.code,'data':json.loads(error.read())}
def bootstrap(token):
    return '''<script>
    window.__starfortStore={'starfort:guild-token': TOKEN};
    Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>window.__starfortStore[k]??null,setItem:(k,v)=>window.__starfortStore[k]=String(v),removeItem:k=>delete window.__starfortStore[k]}});
    window.fetch=async(path,opts={})=>{
      if(!String(path).startsWith('/api/'))throw new Error('Mocked static fetch unavailable');
      const response=await window.qaFetch(String(path).slice(5),opts.headers?.Authorization?.replace('Bearer ',''),opts.body||null);
      return {ok:response.status>=200&&response.status<300,status:response.status,json:async()=>response.data};
    };
    </script>'''.replace('TOKEN',json.dumps(token))
results={'errors':[]}
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    pages=[]
    for i,size in enumerate([{'width':1536,'height':960},{'width':1280,'height':800},{'width':1280,'height':800},{'width':390,'height':844}]):
        player=api('register',body={'name':f'Team UI Tester {i+1}'})['data']
        ctx=browser.new_context(viewport=size)
        page=ctx.new_page();page.expose_function('qaFetch',lambda route,token,raw:api(route,token,json.loads(raw) if raw else None))
        page.on('pageerror',lambda e,i=i:results['errors'].append(f'{i}: {e}'))
        page.set_content(html.replace('</head>',bootstrap(player['token'])+'</head>'),wait_until='domcontentloaded')
        page.locator('.resource').first.wait_for(timeout=12000)
        page.locator('[data-view="expedition"]').first.click(timeout=12000)
        page.locator('[data-team-open]').click(timeout=12000)
        page.locator('[data-team-mode="2"]').wait_for(timeout=7000)
        pages.append((page,ctx,player))
    for page,ctx,player in pages:page.locator('[data-team-mode="2"]').click()
    for page,ctx,player in pages:page.wait_for_function('document.querySelector("#team-status")?.textContent.includes("CANLI")',timeout=15000)
    results['matched']=True
    a=pages[0][0];one=pages[0][2]
    start=next(v['x'] for v in api('team/state',one['token'])['data']['room']['players'] if v['id']==one['player']['id'])
    a.keyboard.down('d');a.wait_for_timeout(550);a.keyboard.up('d');a.wait_for_timeout(170)
    moved=next(v['x'] for v in api('team/state',one['token'])['data']['room']['players'] if v['id']==one['player']['id'])
    results['moved']=moved>start
    a.locator('[data-team-order="push"]').click();a.wait_for_timeout(480)
    results['command']=next(v['order'] for v in api('team/state',one['token'])['data']['room']['players'] if v['id']==one['player']['id'])=='push'
    out=Path('/mnt/data')
    a.screenshot(path=str(out/'Starfort_v1_3_Takim_Desktop.png'),full_page=False)
    mobile=pages[3][0];mobile.screenshot(path=str(out/'Starfort_v1_3_Takim_Mobil.png'),full_page=True)
    results['mobile_touch']=mobile.locator('.team-touch').is_visible()
    results['mobile_attack']=mobile.locator('[data-team-attack]').is_visible()
    results['mobile_overflow']=mobile.evaluate('document.documentElement.scrollWidth > innerWidth+3')
    results['errors']=results['errors'][:10]
    browser.close()
print(json.dumps(results,ensure_ascii=False,indent=2))
if results.get('errors') or not all([results.get('matched'),results.get('moved'),results.get('command'),results.get('mobile_touch'),results.get('mobile_attack')]) or results.get('mobile_overflow'):
    raise SystemExit(1)
