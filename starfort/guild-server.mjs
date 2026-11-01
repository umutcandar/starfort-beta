/** Starfort local multiplayer prototype. NOT production authentication or PvP. */
import http from 'node:http';
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import {createArenaService} from './arena.js';
import {trainingDifficulty} from './training-difficulty.js';
import {newWeeklyRaid,rotateGuildRaids} from './guild-weekly-raid.js';
import {createTeamService} from './team-arena.js';
import {verifiedArenaUser} from './arena-auth.js';
import {createMatchLedger} from './match-ledger.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.STARFORT_DATA_DIR || path.join(DIR, '.local-data');
const DB_FILE = path.join(DATA_DIR, 'guilds.json');
const testCode = (process.env.STARFORT_TEST_CODE || '').trim();
// An invite code is a temporary closed-beta gate, not production-grade authentication.
const testCodeValid = candidate => {
  if(!testCode) return true;
  if(typeof candidate !== 'string' || candidate.length > 128) return false;
  const expected=createHash('sha256').update(testCode).digest();
  const received=createHash('sha256').update(candidate).digest();
  return timingSafeEqual(expected,received);
};
const TYPES = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.json':'application/json; charset=utf-8','.ico':'image/x-icon'};
const newDb=()=>({version:1,users:[],guilds:[]});
const hash=secret=>createHash('sha256').update(secret).digest('hex');
const normalize=value=>typeof value==='string'?value.trim().replace(/\s+/g,' '):'';
const safeName=(value,max=24)=>{const name=normalize(value);return name.length>=3&&name.length<=max&&!/[<>\x00-\x1f]/.test(name)?name:null;};
const publicUser=user=>({id:user.id,name:user.name,joinedAt:user.joinedAt});
const publicGuild=(guild,db)=>({id:guild.id,name:guild.name,code:guild.code,createdAt:guild.createdAt,ownerId:guild.ownerId,raid:guild.raid,
  warPlan:guild.warPlan||{objective:'gate',brief:'Önce kapıyı aş, sonra merkezi koru.',updatedAt:guild.createdAt},
  warRoster:guild.members.map(id=>({userId:id,role:guild.warRoster?.[id]?.role||'frontline',ready:Boolean(guild.warRoster?.[id]?.ready)})),
  members:guild.members.map(id=>db.users.find(user=>user.id===id)).filter(Boolean).map(publicUser),messages:guild.messages.slice(-25),raidWins:guild.raidWins||0});
const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
async function bodyOf(req){let body='';for await(const chunk of req){body+=chunk.toString();if(body.length>8192)throw new Error('İstek çok büyük.');}try{return JSON.parse(body||'{}')}catch{throw new Error('Geçersiz JSON.')}}
async function loadDb(){try{const db=JSON.parse(await readFile(DB_FILE,'utf8'));return db?.version===1&&Array.isArray(db.users)&&Array.isArray(db.guilds)?db:newDb();}catch(error){if(error.code==='ENOENT')return newDb();throw error;}}
function findUser(db,req){const token=/^Bearer ([a-f0-9]{64})$/.exec(req.headers.authorization||'');return token&&db.users.find(user=>user.tokenHash===hash(token[1]));}
function userGuild(db,user){return db.guilds.find(guild=>guild.members.includes(user.id));}
function oneGuild(db,user){const guild=userGuild(db,user);return {player:publicUser(user),guild:guild?publicGuild(guild,db):null,guilds:db.guilds.map(g=>({code:g.code,name:g.name,members:g.members.length}))};}
async function saveDb(db){await mkdir(DATA_DIR,{recursive:true,mode:0o700});const temp=DB_FILE+'.tmp';await writeFile(temp,JSON.stringify(db,null,2),{mode:0o600});await rename(temp,DB_FILE);}
function action(db,user,route,data,now=Date.now()){
  const guild=userGuild(db,user);
  if(route==='/api/guild/create'){
    if(guild)return [409,{error:'Zaten bir klana üyesin.'}];
    const name=safeName(data.name,32);if(!name)return [400,{error:'Klan adı 3–32 karakter olmalı.'}];
    if(db.guilds.some(g=>g.name.toLocaleLowerCase('tr')===name.toLocaleLowerCase('tr')))return [409,{error:'Bu klan adı kullanımda.'}];
    let code;do{code=randomBytes(3).toString('hex').toUpperCase();}while(db.guilds.some(g=>g.code===code));
    db.guilds.push({id:randomBytes(12).toString('hex'),code,name,ownerId:user.id,members:[user.id],createdAt:now,messages:[],warPlan:{objective:'gate',brief:'Önce kapıyı aş, sonra merkezi koru.',updatedAt:now},warRoster:{[user.id]:{role:'frontline',ready:false}},raid:newWeeklyRaid(now),raidWins:0});
  } else if(route==='/api/guild/join'){
    if(guild)return [409,{error:'Başka bir klana üyesin.'}];
    const target=db.guilds.find(g=>g.code===normalize(data.code).toUpperCase());
    if(!target)return [404,{error:'Bu davet koduyla klan bulunamadı.'}];
    if(target.members.length>=25)return [409,{error:'Klan dolu (25/25).'}];
    target.members.push(user.id);target.warRoster??={};target.warRoster[user.id]={role:'frontline',ready:false};
  } else if(route==='/api/guild/leave'){
    if(!guild)return [409,{error:'Klanın yok.'}];
    guild.members=guild.members.filter(id=>id!==user.id);if(guild.warRoster)delete guild.warRoster[user.id];
    if(!guild.members.length)db.guilds=db.guilds.filter(g=>g!==guild);
    else if(guild.ownerId===user.id)guild.ownerId=guild.members[0];
  } else if(route==='/api/guild/war/plan'){
    if(!guild)return [409,{error:'Önce bir klana katıl.'}];
    if(guild.ownerId!==user.id)return [403,{error:'Savaş planını yalnızca klan lideri değiştirebilir.'}];
    const objective=normalize(data.objective),brief=normalize(data.brief);
    if(!['gate','north','south','crystal'].includes(objective)||brief.length<5||brief.length>160||/[<>\x00-\x1f]/.test(brief))return [400,{error:'Geçerli bir hedef ve 5–160 karakterlik savaş planı seç.'}];
    guild.warPlan={objective,brief,updatedAt:now};
  } else if(route==='/api/guild/war/prepare'){
    if(!guild)return [409,{error:'Önce bir klana katıl.'}];
    const role=normalize(data.role);
    if(!['frontline','ranged','support','siege'].includes(role)||typeof data.ready!=='boolean')return [400,{error:'Geçerli bir savaş rolü ve hazır durumu gönder.'}];
    guild.warRoster??={};guild.warRoster[user.id]={role,ready:data.ready};
  } else if(route==='/api/guild/message'){
    if(!guild)return [409,{error:'Önce bir klana katıl.'}];
    const message=normalize(data.message);if(!message||message.length>250)return [400,{error:'Mesaj 1–250 karakter olmalı.'}];
    if((user.lastMessageAt||0)+1500>now)return [429,{error:'Mesaj göndermek için biraz bekle.'}];
    user.lastMessageAt=now;
    guild.messages.push({id:randomBytes(6).toString('hex'),userId:user.id,name:user.name,text:message,at:now});guild.messages=guild.messages.slice(-60);
  } else if(route==='/api/guild/raid'){
    if(!guild)return [409,{error:'Önce bir klana katıl.'}];
    const raid=guild.raid;
    if(raid.completed)return [409,{error:'Bu ortak baskın tamamlandı.'}];
    if(raid.attacks.some(a=>a.userId===user.id&&now-a.at<60000))return [429,{error:'Yeni saldırı için 60 saniye beklemelisin.'}];
    const damage=randomInt(80,131);raid.health=Math.max(0,raid.health-damage);raid.damage+=damage;
    raid.attacks.push({userId:user.id,name:user.name,damage,at:now});raid.attacks=raid.attacks.slice(-50);
    if(raid.health===0){raid.completed=true;guild.raidWins=(guild.raidWins||0)+1;}
  } else return [404,{error:'İşlem bulunamadı.'}];
  return [200,oneGuild(db,user)];
}
export { action, newDb, publicGuild, safeName };

export async function createGuildServer({host='127.0.0.1',port=8877}={}){
  const db=await loadDb();
  const arena=createArenaService();
  const teams=createTeamService();
  const serverEpoch=randomBytes(12).toString('hex');
  const matchLedger=createMatchLedger();
  // Attach receipts only to authenticated members' completed match snapshots.
  // Render's in-memory queue may disappear on restart, but a browser can safely
  // forward this HMAC-verified receipt to the existing idempotent Supabase RPC.
  function liveJson(res,status,data,kind){
    const roomId=data?.status==='ended'?data.room?.id:null;
    const room=roomId?(kind==='duel'?arena.rooms:teams.rooms).get(roomId):null;
    const receipt=room?matchLedger.receiptFor(room,kind):null;
    return json(res,status,receipt?{...data,matchReceipt:receipt}:data);
  }

  const arenaTimer=setInterval(()=>{
    arena.tick(.05);teams.tick(.05);
    for(const room of arena.rooms.values())if(room.status==='ended')matchLedger.enqueue(room,'duel');
    for(const room of teams.rooms.values())if(room.status==='ended')matchLedger.enqueue(room,'team');
    if(matchLedger.status.pending)void matchLedger.flush();
    arena.prune();teams.prune();
  },50);arenaTimer.unref();
  const failedInvites=new Map();
  const maxFailedInvites=10, inviteWindowMs=15*60*1000;
  function inviteAllowed(req,code){
    if(!testCode)return {ok:true};
    const identity=req.socket.remoteAddress||'unknown';
    const now=Date.now();
    const record=failedInvites.get(identity);
    if(record && now-record.first<inviteWindowMs && record.count>=maxFailedInvites) return {ok:false,status:429,message:'Çok fazla yanlış giriş kodu denemesi. 15 dakika sonra tekrar dene.'};
    if(testCodeValid(code)){failedInvites.delete(identity);return {ok:true};}
    const current=record&&now-record.first<inviteWindowMs?record:{first:now,count:0};
    current.count++;failedInvites.set(identity,current);
    return {ok:false,status:403,message:'Bu test sunucusuna giriş kodu gerekli veya kod yanlış.',code:'INVITE_REQUIRED'};
  }
  // One process serializes all state writes: no double spending/contributions between requests.
  let lock=Promise.resolve();
  // Read incomplete POST bodies outside the state write queue: a client can
  // no longer block the health endpoint or other connected players by stalling.
  async function serveStatic(req,res,route){
    try {
        if(req.method!=='GET'&&req.method!=='HEAD')return json(res,405,{error:'Desteklenmeyen yöntem.'});
        let relative=decodeURIComponent(route.replace(/^\/starfort\/?/,'/')).replace(/^\/+/, '');
        if(!relative||relative.endsWith('/'))relative+='index.html';
        if(relative.split('/').some(segment=>segment==='..'||segment.startsWith('.'))||relative.includes('\\'))return json(res,403,{error:'Erişim engellendi.'});
        const file=path.resolve(DIR,relative);if(!file.startsWith(DIR+path.sep))return json(res,403,{error:'Erişim engellendi.'});
        try{const data=await readFile(file);res.writeHead(200,{'Content-Type':TYPES[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:data);}
        catch(error){json(res,error.code==='ENOENT'?404:500,{error:'Dosya bulunamadı.'})}
    }catch(error){if(!res.headersSent)json(res,400,{error:'Geçersiz dosya yolu.'});}
  }
  const server=http.createServer((req,res)=>{
    // Only the first-party GitHub Pages and Render site may use this API cross-origin.
    const origin=req.headers.origin;
    if(origin && ['https://umutcandar.github.io','https://starfort-online-beta.onrender.com'].includes(origin)){
      res.setHeader('Access-Control-Allow-Origin',origin);
      res.setHeader('Vary','Origin');
      res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');
      res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');
    }
    if(req.method==='OPTIONS')return res.writeHead(204).end();
    let route;
    try{route=new URL(req.url,'http://localhost').pathname;}
    catch{return json(res,400,{error:'Geçersiz adres.'});}
    // Trusted wall-clock reading for beta village construction. No browser time
    // input is accepted by this route; never grants currency or building levels.
    if(route==='/api/clock'&&req.method==='GET')return json(res,200,{ok:true,source:'starfort-server',now:Date.now()});
    // Health and static assets never depend on guild disk writes.
    if(route==='/api/status'&&req.method==='GET')return json(res,200,{ok:true,service:'starfort-beta-live-arena',version:'2.23.0-mastery',serverEpoch,online:true,historyReady:matchLedger.status.enabled,inviteOnly:Boolean(testCode),features:['guilds','chat','shared-raid','war-room','live-1v1-duel','server-ai-duel-practice','live-2v2-and-5v5-team-battles','server-ai-team-training','squad-orders','guild-party-matchmaking','live-5v5-siege']})
    if(!route.startsWith('/api/')){void serveStatic(req,res,route);return;}
    function enqueue(data,authenticatedArenaUser=null){
      lock=lock.then(async()=>{
        try {
          if(process.env.STARFORT_AUTH_REQUIRED==='1'&&!/^\/api\/(arena|team)\//.test(route))return json(res,410,{error:'Lonca verileri Supabase e-posta hesabına taşındı. Bu Node uç noktası kapalı.'});
          if(process.env.STARFORT_AUTH_REQUIRED!=='1' && rotateGuildRaids(db,Date.now()))await saveDb(db);
          if(route==='/api/register'&&req.method==='POST'){
            const gate=inviteAllowed(req,data.testCode);
            if(!gate.ok)return json(res,gate.status,{error:gate.message,code:gate.code||'INVITE_LIMIT'});
            const name=safeName(data.name);if(!name)return json(res,400,{error:'Oyuncu adı 3–24 karakter olmalı.'});
            if(db.users.length>=10000)return json(res,503,{error:'Sunucu kapasitesi dolu.'});
            const token=randomBytes(32).toString('hex');const user={id:randomBytes(12).toString('hex'),name,tokenHash:hash(token),joinedAt:Date.now()};
            db.users.push(user);await saveDb(db);return json(res,201,{token,...oneGuild(db,user)});
          }
          const user=authenticatedArenaUser||findUser(db,req);
          if(!user)return json(res,401,{error:'E-posta oturumu gerekli.'});
          if(route==='/api/me'&&req.method==='GET')return json(res,200,oneGuild(db,user));
          if(route==='/api/team/state'&&req.method==='GET')return liveJson(res,200,{...teams.result(user),serverEpoch},'team');
          if(route==='/api/team/queue'&&req.method==='POST'){const [status,dataOut]=teams.queue(user,data);return liveJson(res,status,{...dataOut,serverEpoch},route.startsWith('/api/arena/')?'duel':'team');}
          if(route==='/api/team/bot'&&req.method==='POST'){const [status,dataOut]=teams.queueBot(user,data);return liveJson(res,status,{...dataOut,serverEpoch},route.startsWith('/api/arena/')?'duel':'team');}
          if(route==='/api/team/party/queue'&&req.method==='POST'){
            const guild=userGuild(db,user);
            if(!guild)return json(res,409,{error:'Önce bir klana katıl.'});
            if(guild.ownerId!==user.id)return json(res,403,{error:'Klan takımını yalnızca lider eşleştirebilir.'});
            const size=data.size;const variant=data.variant??'flags';
            if(!['flags','siege'].includes(variant))return json(res,400,{error:'Geçersiz savaş türü.'});
            if(variant==='siege'&&size!==5)return json(res,400,{error:'Kuşatma 5v5 yapılır.'});
            if(size!==2&&size!==5)return json(res,400,{error:'2v2 veya 5v5 seç.'});
            const ready=guild.members.filter(id=>guild.warRoster?.[id]?.ready);
            if(!ready.includes(user.id))return json(res,409,{error:'Klan lideri önce Savaş Odası bölümünden hazır olmalı.'});
            if(ready.length<size)return json(res,409,{error:`En az ${size} klan üyesinin Savaş Odası bölümünde hazır olması gerekiyor.`});
            const selected=[user.id,...ready.filter(id=>id!==user.id).slice(0,size-1)];
            const members=selected.map(id=>db.users.find(u=>u.id===id)).filter(Boolean).map(u=>({id:u.id,name:u.name}));
            const [status,response]=teams.queueParty(members,size,guild.id,guild.name,variant);
            return json(res,status,response);
          }
          if(route==='/api/team/leave'&&req.method==='POST')return liveJson(res,200,teams.leave(user),'team');
          if(route==='/api/team/input'&&req.method==='POST'){const [status,dataOut]=teams.input(user,data);return liveJson(res,status,{...dataOut,serverEpoch},route.startsWith('/api/arena/')?'duel':'team');}
          if(route==='/api/arena/state'&&req.method==='GET')return liveJson(res,200,{...arena.result(user),serverEpoch},'duel');
          if(route==='/api/arena/queue'&&req.method==='POST')return liveJson(res,200,{...arena.queue(user,data),serverEpoch},'duel');
          if(route==='/api/arena/bot'&&req.method==='POST'){if(!trainingDifficulty(data.difficulty??'normal'))return json(res,400,{error:'Geçersiz bot zorluk seviyesi.'});return json(res,200,{...arena.queueBot(user,data),serverEpoch});}
          if(route==='/api/arena/leave'&&req.method==='POST')return liveJson(res,200,arena.leave(user),'duel');
          if(route==='/api/arena/input'&&req.method==='POST'){const [status,dataOut]=arena.input(user,data);return liveJson(res,status,{...dataOut,serverEpoch},route.startsWith('/api/arena/')?'duel':'team');}
          if(req.method!=='POST')return json(res,405,{error:'Bu yöntem desteklenmiyor.'});
          const [status,result]=action(db,user,route,data);
          if(status===200){
            // Removing a ready player from a waiting clan party cancels it for everyone.
            if(route==='/api/guild/leave'||(route==='/api/guild/war/prepare'&&data.ready===false))teams.leave(user);
            await saveDb(db);
          }
          return json(res,status,result);
        }catch(error){if(!res.headersSent)json(res,400,{error:error.message||'Sunucu hatası.'});}
      }).catch(error=>{if(!res.headersSent)json(res,500,{error:'Sunucu işlemi başarısız.'});console.error(error);});
    }
    // Parse request and validate identity before entering serialized match actions.
    const live=/^\/api\/(arena|team)\//.test(route);
    async function dispatch(data){
      let player=null;
      if(live && process.env.STARFORT_AUTH_REQUIRED==='1'){
        try{player=await verifiedArenaUser(req.headers.authorization);}
        catch(error){return json(res,401,{error:error.message});}
      }
      enqueue(data,player);
    }
    if(req.method==='POST')bodyOf(req).then(dispatch).catch(error=>{
      if(!res.headersSent)json(res,error.message==='İstek çok büyük.'?413:400,{error:error.message||'Geçersiz istek.'});
    });
    else void dispatch({});
  });
  server.once('close',()=>clearInterval(arenaTimer));
  try{await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,host,resolve)});}catch(error){clearInterval(arenaTimer);throw error;}
  return server;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  createGuildServer({host:process.env.STARFORT_HOST||'127.0.0.1',port:Number(process.env.PORT||8877)})
    .then(s=>console.log(`Starfort yerel çok oyunculu sunucu: http://${s.address().address}:${s.address().port}/starfort/`))
    .catch(error=>{console.error(error);process.exitCode=1});
}
