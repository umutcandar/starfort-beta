"""Browser UI smoke test via Python HTTP bridge (localhost browser navigation restricted).
The actual HTTP match is verified independently with arena.integration.test.mjs.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import base64, json, re, urllib.request
ROOT=Path(__file__).resolve().parents[1]
BASE='http://127.0.0.1:8879'
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
css='\n'.join((ROOT/f).read_text() for f in ['style.css','art.css','battle.css','city.css','premium.css','tactics.css','arena.css'])
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
    for i,size in enumerate([{'width':1536,'height':960},{'width':1280,'height':800}]):
        player=api('register',body={'name':f'Arena UI Tester {i+1}'})['data']
        ctx=browser.new_context(viewport=size)
        page=ctx.new_page();page.expose_function('qaFetch',lambda route,token,raw:api(route,token,json.loads(raw) if raw else None))
        page.on('pageerror',lambda e:results['errors'].append(str(e)))
        page.set_content(html.replace('</head>',bootstrap(player['token'])+'</head>'),wait_until='domcontentloaded')
        page.locator('.resource').first.wait_for(timeout=12000)
        page.locator('[data-view="expedition"]').first.click(timeout=12000)
        page.locator('[data-arena-open]').click(timeout=12000)
        page.locator('[data-arena-queue]').wait_for(timeout=7000)
        pages.append((page,ctx,player))
    a,b=pages[0][0],pages[1][0]
    a.locator('[data-arena-queue]').click()
    a.wait_for_function('document.querySelector("#arena-connection")?.textContent.includes("bekleniyor")',timeout=10000)
    b.locator('[data-arena-queue]').click()
    for page in [a,b]:page.wait_for_function('document.querySelector("#arena-connection")?.textContent.includes("sürüyor")',timeout=12000)
    results['matched']=True
    one=pages[0][2];start=next(v['x'] for v in api('arena/state',one['token'])['data']['room']['players'] if v['id']==one['player']['id'])
    a.keyboard.down('d');a.wait_for_timeout(620);a.keyboard.up('d');a.wait_for_timeout(130)
    moved=next(v['x'] for v in api('arena/state',one['token'])['data']['room']['players'] if v['id']==one['player']['id'])
    results['moved']=moved>start;results['x_initial']=start;results['x_after']=moved
    out=ROOT.parent;a.screenshot(path=str(out/'Starfort_v1_2_Arena_Desktop.png'),full_page=True)
    a.set_viewport_size({'width':390,'height':844});a.wait_for_timeout(200)
    a.screenshot(path=str(out/'Starfort_v1_2_Arena_Mobil.png'),full_page=True)
    results['mobile_touch']=a.locator('.arena-touch').is_visible();results['mobile_attack']=a.locator('[data-arena-attack]').is_visible()
    results['mobile_overflow']=a.evaluate('document.documentElement.scrollWidth > innerWidth+3')
    b.locator('[data-arena-leave]').click()
    a.wait_for_function('document.querySelector("#arena-connection")?.textContent.includes("tamamlandı")',timeout=12000)
    results['forfeit']=api('arena/state',one['token'])['data']['room']['winner']==one['player']['id']
    browser.close()
print(json.dumps(results,ensure_ascii=False,indent=2))
if results.get('errors') or not all([results.get('matched'),results.get('moved'),results.get('forfeit'),results.get('mobile_touch'),results.get('mobile_attack')]) or results.get('mobile_overflow'):
    raise SystemExit(1)
