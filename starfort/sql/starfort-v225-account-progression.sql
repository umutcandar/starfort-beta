-- STARFORT v2.25: one account owns the village, heroes, gear and server-resolved PvE.
-- Client JSON saves and locally fabricated battle victories are never imported.
create table if not exists public.starfort_player_progress(
 user_id uuid primary key references auth.users(id) on delete cascade,
 heroes jsonb not null default '{"aldren":1,"lyra":1,"rovan":1}'::jsonb,
 inventory jsonb not null default '{"iron_sword":1,"ward_mail":1}'::jsonb,
 loadouts jsonb not null default '{}'::jsonb,
 team jsonb not null default '["aldren","lyra","rovan"]'::jsonb,
 cleared jsonb not null default '[]'::jsonb,
 stars jsonb not null default '{}'::jsonb,
 veteran jsonb not null default '{}'::jsonb,
 maze_floor integer not null default 0 check(maze_floor between 0 and 16),
 rift_week text,
 mission jsonb,
 last_mission_at timestamptz,
 last_report jsonb,
 counters jsonb not null default '{"win":0,"hero":0,"forge":0,"maze":0,"rift":0,"veteran":0}'::jsonb,
 contract_claims jsonb not null default '{}'::jsonb,
 titles jsonb not null default '[]'::jsonb,
 updated_at timestamptz not null default now()
);
alter table public.starfort_player_progress enable row level security;
revoke all on public.starfort_player_progress from public,anon,authenticated;

-- A single RPC owns writes to BOTH tables, under a per-account lock.
-- Requests contain action IDs only; rewards, levels and results are recomputed here.
create or replace function public.sfb_account_api(
 p_action text,
 p_target text default null,
 p_aux text default null,
 p_request_id uuid default null
) returns jsonb
language plpgsql security definer set search_path=''
as $fn$
#variable_conflict use_variable
declare
 u uuid:=auth.uid();
 l public.starfort_village_ledger%rowtype;
 p public.starfort_player_progress%rowtype;
 stamp timestamptz:=clock_timestamp();
 ms bigint:=floor(extract(epoch from stamp)*1000)::bigint;
 resources jsonb;
 heroes jsonb;
 items jsonb;
 gear jsonb;
 roster jsonb;
 cleared jsonb;
 stars jsonb;
 veteran jsonb;
 counters jsonb;
 claims jsonb;
 titles jsonb;
 battle jsonb;
 outcome jsonb;
 reply jsonb;
 prior jsonb;
 req integer;
 lvl integer;
 hero text;
 slot text;
 item_id text;
 existing text;
 cost jsonb:='{}'::jsonb;
 reward jsonb:='{}'::jsonb;
 item_cost jsonb;
 item_forge integer;
 item_slot text;
 item_exclusive boolean;
 item_owner integer;
 used integer;
 current_count integer;
 i integer;
 j integer;
 n integer;
 stage integer;
 tier integer:=0;
 floor_no integer:=0;
 difficulty numeric:=1;
 power numeric:=0;
 base_hp numeric;
 base_atk numeric;
 fullhp numeric;
 ehp integer;
 php integer;
 dmg integer;
 edmg integer;
 turns integer;
 stars_won integer;
 old_stars integer;
 mode text;
 weeks text;
 ability text;
 mission_stage integer;
 mission_cost text;
 counter_name text;
 counter_value integer;
 contract_key text;
 counter_target integer;
 fee integer;
 c text;
 stage_reward jsonb;
 user_reward jsonb;
 bonus_item text;
 set_bonus text;
 v text;
 inv_count integer;
 last_action bigint;
begin
 if u is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then
  raise exception 'Çevrim içi ilerleme için doğrulanmış e-posta hesabı gerekir.';
 end if;
 if p_action is null or p_action not in
  ('get','hero','forge','equip','unequip','team','mission_start','mission_turn','mission_abandon','contract','title')
  then raise exception 'Geçersiz hesap işlemi.';
 end if;
 if p_action<>'get' and p_request_id is null then raise exception 'İşlem kimliği zorunludur.'; end if;
 insert into public.starfort_village_ledger(user_id) values(u) on conflict do nothing;
 insert into public.starfort_player_progress(user_id) values(u) on conflict do nothing;
 select * into strict l from public.starfort_village_ledger where user_id=u for update;
 select * into strict p from public.starfort_player_progress where user_id=u for update;
 if p_action<>'get' then
  select response into prior from public.starfort_village_requests where user_id=u and request_id=p_request_id;
  if found then return prior; end if;
 end if;
 resources:=l.res;
 heroes:=p.heroes;
 items:=p.inventory;
 gear:=p.loadouts;
 roster:=p.team;
 cleared:=p.cleared;
 stars:=p.stars;
 veteran:=p.veteran;
 counters:=p.counters;
 claims:=p.contract_claims;
 titles:=p.titles;
 battle:=p.mission;
 outcome:=p.last_report;
 if p_action='hero' then
  hero:=p_target;
  if hero not in ('aldren','lyra','rovan','mira','doran','vesper','eira') or hero is null then
   raise exception 'Kahraman bulunamadı.';
  end if;
  if not (heroes ? hero) then raise exception 'Kahraman henüz açılmadı.'; end if;
  if battle is not null then raise exception 'Savaş sürerken geliştirme yapılmaz.'; end if;
  lvl:=(heroes->>hero)::integer;
  if lvl>=20 then raise exception 'Kahraman en yüksek seviyede.'; end if;
  cost:=jsonb_build_object('gold',60*lvl,'wood',15*lvl,'aether',6*lvl);
  for c in select jsonb_object_keys(cost) loop
   if (resources->>c)::bigint < (cost->>c)::bigint then raise exception 'Yetersiz sunucu kaynağı.'; end if;
   resources:=jsonb_set(resources,array[c],to_jsonb((resources->>c)::bigint-(cost->>c)::bigint));
  end loop;
  heroes:=jsonb_set(heroes,array[hero],to_jsonb(lvl+1));
  counters:=jsonb_set(counters,'{hero}',to_jsonb((counters->>'hero')::integer+1));
 elsif p_action='forge' then
  item_id:=p_target;
  if battle is not null then raise exception 'Savaş sürerken eşya üretilemez.'; end if;
  select x.slot,x.forge,x.cost into item_slot,item_forge,item_cost from (values
   ('iron_sword','weapon',1,'{"gold":90,"wood":25}'::jsonb),
   ('ward_mail','armor',1,'{"gold":110,"stone":35}'::jsonb),
   ('lunar_charm','relic',1,'{"gold":100,"aether":15}'::jsonb),
   ('ember_blade','weapon',2,'{"gold":260,"aether":30}'::jsonb),
   ('warden_plate','armor',2,'{"gold":280,"stone":100}'::jsonb),
   ('star_lens','relic',2,'{"gold":230,"aether":45}'::jsonb),
   ('royal_blade','weapon',4,'{"gold":650,"aether":80}'::jsonb),
   ('aegis','armor',4,'{"gold":700,"stone":220}'::jsonb),
   ('moonheart','relic',4,'{"gold":650,"aether":100}'::jsonb),
   ('starbreaker','weapon',6,'{"gold":1450,"aether":220}'::jsonb),
   ('ashes_plate','armor',5,'{"gold":1250,"stone":390}'::jsonb),
   ('guardian_seal','relic',5,'{"gold":1100,"aether":185}'::jsonb)
  ) as x(id,slot,forge,cost) where x.id=item_id;
  if item_slot is null then raise exception 'Bilinmeyen veya ganimete özel eşya.'; end if;
  if (l.buildings->>'forge')::integer<item_forge then raise exception 'Demirhane seviyesi yetersiz.'; end if;
  if coalesce((items->>item_id)::integer,0)>=20 then raise exception 'En fazla 20 adet üretilebilir.'; end if;
  cost:=item_cost;
  for c in select jsonb_object_keys(cost) loop
   if (resources->>c)::bigint<(cost->>c)::bigint then raise exception 'Sunucu kaynakları yetersiz.'; end if;
   resources:=jsonb_set(resources,array[c],to_jsonb((resources->>c)::bigint-(cost->>c)::bigint));
  end loop;
  items:=jsonb_set(items,array[item_id],to_jsonb(coalesce((items->>item_id)::integer,0)+1),true);
  counters:=jsonb_set(counters,'{forge}',to_jsonb((counters->>'forge')::integer+1));
 elsif p_action in ('equip','unequip') then
  hero:=p_target;
  if not (heroes ? coalesce(hero,'')) then raise exception 'Kahraman açık değil.'; end if;
  if battle is not null then raise exception 'Savaş sırasında ekipman değiştirilemez.'; end if;
  if p_action='equip' then
   item_id:=p_aux;
   if not (items ? coalesce(item_id,'')) or (items->>item_id)::integer<1 then
    raise exception 'Ekipman envanterinde bulunamadı.';
   end if;
   item_slot:=case when item_id in ('iron_sword','ember_blade','royal_blade','eclipse_edge','star_spear','starbreaker') then 'weapon'
       when item_id in ('ward_mail','warden_plate','aegis','moon_watch','ember_guard','dawn_guard','ashes_plate') then 'armor'
       when item_id in ('lunar_charm','star_lens','moonheart','grave_seal','dawn_relic','guardian_seal') then 'relic'
       else null end;
   if item_slot is null then raise exception 'Bilinmeyen eşya yuvası.'; end if;
   used:=0;
   for v in select jsonb_object_keys(heroes) loop
    if v<>hero and (gear->v->>item_slot)=item_id then used:=used+1; end if;
   end loop;
   if used>=(items->>item_id)::integer then raise exception 'Eşya başka kahramanda kullanılıyor.'; end if;
   gear:=jsonb_set(gear,array[hero],coalesce(gear->hero,'{}'::jsonb),true);
   gear:=jsonb_set(gear,array[hero,item_slot],to_jsonb(item_id),true);
  else
   if p_aux not in ('weapon','armor','relic') then raise exception 'Geçersiz ekipman yuvası.'; end if;
   gear:=jsonb_set(gear,array[hero],coalesce(gear->hero,'{}'::jsonb)-p_aux,true);
  end if;
 elsif p_action='team' then
  if battle is not null then raise exception 'Savaş sırasında takım değiştirilemez.'; end if;
  if p_target is null or length(p_target)>90 then raise exception 'Takım seçimi geçersiz.'; end if;
  roster:=to_jsonb(string_to_array(p_target,','));
  if jsonb_array_length(roster)<>3 then raise exception 'Tam üç kahraman seç.'; end if;
  for i in 0..2 loop
   hero:=roster->>i;
   if not (heroes ? coalesce(hero,'')) then raise exception 'Açılmamış kahraman seçilemez.'; end if;
   for j in 0..i-1 loop
    if hero=roster->>j then raise exception 'Aynı kahraman iki kez seçilemez.'; end if;
   end loop;
  end loop;
 elsif p_action='mission_start' then
  if battle is not null then raise exception 'Önceki sefer hâlâ sürüyor.'; end if;
  if p.last_mission_at is not null and stamp-p.last_mission_at<interval '20 seconds' then
   raise exception 'Komutanın hazırlanıyor. 20 saniye sonra tekrar dene.';
  end if;
  mode:='story';
  if p_target='rift' then
   mode:='rift';stage:=8;tier:=3;
   if jsonb_array_length(cleared)<8 then raise exception 'Yarık için hikâyeyi tamamla.'; end if;
   weeks:=to_char(stamp at time zone 'UTC','IYYY-IW');
   if p.rift_week=weeks then raise exception 'Bu haftanın yarık sınavı tamamlandı.'; end if;
  elsif p_target like 'maze:%' then
   mode:='maze';floor_no:=substring(p_target from 6)::integer;
   if floor_no<>p.maze_floor+1 or floor_no<1 or floor_no>16 then raise exception 'Labirentin sıradaki katını seç.'; end if;
   stage:=ceil(floor_no/2.0)::integer;
   if jsonb_array_length(cleared)<stage then raise exception 'Önce gerekli hikâye bölümünü tamamla.'; end if;
  elsif p_target like 'veteran:%' then
   mode:='veteran';stage:=split_part(p_target,':',2)::integer;tier:=split_part(p_target,':',3)::integer;
   if stage<1 or stage>8 or tier<1 or tier>3 or not (cleared @> to_jsonb(array[stage])) then
    raise exception 'Usta seferi henüz açılmadı.';
   end if;
  else
   if p_target is null or p_target!~'^[1-8]$' then raise exception 'Bilinmeyen hikâye bölümü.'; end if;
   stage:=p_target::integer;
   if stage>jsonb_array_length(cleared)+1 then raise exception 'Önce önceki hikâye bölümünü tamamla.'; end if;
  end if;
  power:=0;
  for i in 0..2 loop
   hero:=roster->>i;
   lvl:=(heroes->>hero)::integer;
   base_hp:=case hero when 'aldren' then 170 when 'lyra' then 100 when 'rovan' then 110
      when 'mira' then 115 when 'doran' then 145 when 'vesper' then 85 when 'eira' then 120 else 0 end;
   base_atk:=case hero when 'aldren' then 18 when 'lyra' then 26 when 'rovan' then 23
      when 'mira' then 20 when 'doran' then 28 when 'vesper' then 27 when 'eira' then 24 else 0 end;
   power:=power+2*round(base_atk*(1+(lvl-1)*0.15)*(1+((l.buildings->>'forge')::integer-1)*0.05))
     +0.35*round(base_hp*(1+(lvl-1)*0.12)*(1+((l.buildings->>'tavern')::integer-1)*0.04));
   for slot in select unnest(array['weapon','armor','relic']) loop
    item_id:=gear->hero->>slot;
    power:=power+case item_id
      when 'iron_sword' then 8 when 'ward_mail' then 15 when 'lunar_charm' then 12
      when 'ember_blade' then 20 when 'warden_plate' then 33 when 'star_lens' then 18
      when 'royal_blade' then 34 when 'aegis' then 50 when 'moonheart' then 30
      when 'starbreaker' then 56 when 'ashes_plate' then 67 when 'guardian_seal' then 38
      when 'grave_seal' then 18 when 'eclipse_edge' then 30 when 'moon_watch' then 23
      when 'ember_guard' then 25 when 'dawn_relic' then 15 when 'star_spear' then 22 when 'dawn_guard' then 34 else 0 end;
   end loop;
  end loop;
  req:=case stage when 1 then 250 when 2 then 310 when 3 then 380 when 4 then 450
      when 5 then 540 when 6 then 650 when 7 then 780 else 920 end;
  difficulty:=1+0.4*tier+case when mode='maze' then floor_no*0.035 else 0 end;
  if power<req*difficulty*0.7 then raise exception 'Takımın sefer için yeterince güçlü değil.'; end if;
  ehp:=round((110+stage*45)*difficulty)::integer;
  php:=round(130+power*0.6)::integer;
  battle:=jsonb_build_object('mode',mode,'stage',stage,'tier',tier,'floor',floor_no,
    'startedAt',ms,'lastTurnAt',ms,'turn',0,'power',round(power),'enemyHp',ehp,'enemyMaxHp',ehp,
    'playerHp',php,'playerMaxHp',php,'lastAction','Başladı');
  outcome:=null;
  p.last_mission_at:=stamp;
 elsif p_action='mission_turn' then
  if battle is null then raise exception 'Devam eden sunucu savaşı yok.'; end if;
  if p_aux not in ('strike','guard','skill') then raise exception 'Savaş hamlesi geçersiz.'; end if;
  last_action:=(battle->>'lastTurnAt')::bigint;
  if ms-last_action<3000 then raise exception 'Savaş hamlesi için 3 saniye bekle.'; end if;
  turns:=(battle->>'turn')::integer+1;
  power:=(battle->>'power')::numeric;
  ehp:=(battle->>'enemyHp')::integer;php:=(battle->>'playerHp')::integer;
  ability:=p_aux;
  dmg:=greatest(12,round(power/5*(case ability when 'skill' then 1.3 when 'guard' then 0.68 else 1 end)))::integer;
  edmg:=greatest(5,round((18+(battle->>'stage')::integer*9)*(case ability when 'guard' then 0.35 else 1 end)*(1+(battle->>'tier')::integer*.3)))::integer;
  ehp:=greatest(0,ehp-dmg);
  if ehp>0 then php:=greatest(0,php-edmg); end if;
  battle:=jsonb_set(battle,'{turn}',to_jsonb(turns));
  battle:=jsonb_set(battle,'{enemyHp}',to_jsonb(ehp));
  battle:=jsonb_set(battle,'{playerHp}',to_jsonb(php));
  battle:=jsonb_set(battle,'{lastTurnAt}',to_jsonb(ms));
  battle:=jsonb_set(battle,'{lastAction}',to_jsonb(ability));
  if ehp=0 or php=0 or turns>=14 then
   stage:=(battle->>'stage')::integer;
   mode:=battle->>'mode';
   tier:=(battle->>'tier')::integer;
   floor_no:=(battle->>'floor')::integer;
   if ehp=0 then
    stars_won:=case when php>=((battle->>'playerMaxHp')::integer*.7) and turns<=5 then 3
      when php>=((battle->>'playerMaxHp')::integer*.3) then 2 else 1 end;
    reward:=case stage
      when 1 then '{"gold":120,"wood":60,"stone":35,"aether":12}'::jsonb
      when 2 then '{"gold":160,"wood":70,"stone":50,"aether":18}'::jsonb
      when 3 then '{"gold":190,"wood":100,"stone":65,"aether":22}'::jsonb
      when 4 then '{"gold":230,"wood":110,"stone":90,"aether":28}'::jsonb
      when 5 then '{"gold":280,"wood":130,"stone":110,"aether":35}'::jsonb
      when 6 then '{"gold":330,"wood":150,"stone":135,"aether":42}'::jsonb
      when 7 then '{"gold":400,"wood":180,"stone":160,"aether":50}'::jsonb
      else '{"gold":500,"wood":220,"stone":200,"aether":65}'::jsonb end;
    if mode='story' and (cleared @> to_jsonb(array[stage])) then
      for c in select jsonb_object_keys(reward) loop
       reward:=jsonb_set(reward,array[c],to_jsonb(round((reward->>c)::numeric*.4)::bigint));
      end loop;
    elsif mode='veteran' then
      for c in select jsonb_object_keys(reward) loop
       reward:=jsonb_set(reward,array[c],to_jsonb(round((reward->>c)::numeric*(1+tier*.16))::bigint));
      end loop;
      veteran:=jsonb_set(veteran,array[stage::text],to_jsonb(greatest(coalesce((veteran->>stage::text)::integer,0),tier)),true);
    elsif mode='maze' then
      reward:='{"gold":90,"wood":30,"stone":40,"aether":12}'::jsonb;
      p.maze_floor:=floor_no;
    elsif mode='rift' then
      reward:='{"gold":320,"wood":150,"stone":180,"aether":40}'::jsonb;
      p.rift_week:=to_char(stamp at time zone 'UTC','IYYY-IW');
    end if;
    for c in select jsonb_object_keys(reward) loop
      resources:=jsonb_set(resources,array[c],to_jsonb(least(1000000000,(resources->>c)::bigint+(reward->>c)::bigint)));
    end loop;
    if mode='story' then
      if not (cleared @> to_jsonb(array[stage])) then
       cleared:=cleared||to_jsonb(stage);
       bonus_item:=case stage when 1 then 'lunar_charm' when 2 then 'ember_blade' when 3 then 'warden_plate'
        when 4 then 'star_lens' when 5 then 'grave_seal' when 6 then 'royal_blade'
        when 7 then 'eclipse_edge' else 'moonheart' end;
       items:=jsonb_set(items,array[bonus_item],to_jsonb(coalesce((items->>bonus_item)::integer,0)+1),true);
       if stage=2 then heroes:=jsonb_set(heroes,'{mira}','1'::jsonb,true); end if;
       if stage=3 then heroes:=jsonb_set(heroes,'{vesper}','1'::jsonb,true); end if;
       if stage=4 then heroes:=jsonb_set(heroes,'{doran}','1'::jsonb,true); end if;
       if stage=6 then heroes:=jsonb_set(heroes,'{eira}','1'::jsonb,true); end if;
      end if;
      old_stars:=coalesce((stars->>stage::text)::integer,0);
      if stars_won>old_stars then stars:=jsonb_set(stars,array[stage::text],to_jsonb(stars_won),true); end if;
      -- Trusted 1–3★ campaign victories unlock the village mastery gates.
      select coalesce(sum(value::integer),0) into n from jsonb_each_text(stars);
      l.mastery:=least(24,greatest(l.mastery,n));
      -- Five unique three-star chapters grant one permanent exclusive item each.
      if old_stars<3 and stars_won=3 then
        n:=0;
        for c in select jsonb_object_keys(stars) loop
         if (stars->>c)::integer=3 then n:=n+1; end if;
        end loop;
        bonus_item:=case n when 1 then 'moon_watch' when 2 then 'ember_guard'
          when 3 then 'dawn_relic' when 4 then 'star_spear' when 5 then 'dawn_guard' else null end;
        if bonus_item is not null then
         items:=jsonb_set(items,array[bonus_item],to_jsonb(coalesce((items->>bonus_item)::integer,0)+1),true);
        end if;
      end if;
    end if;
    counter_name:=case mode when 'maze' then 'maze' when 'rift' then 'rift' when 'veteran' then 'veteran' else 'win' end;
    counters:=jsonb_set(counters,array[counter_name],to_jsonb((counters->>counter_name)::integer+1));
    outcome:=jsonb_build_object('won',true,'mode',mode,'stage',stage,'stars',stars_won,
      'reward',reward,'floor',floor_no,'at',ms,'turns',turns);
   else
    outcome:=jsonb_build_object('won',false,'mode',battle->>'mode','stage',(battle->>'stage')::integer,
      'stars',0,'reward','{}'::jsonb,'at',ms,'turns',turns);
   end if;
   battle:=null;
  end if;
 elsif p_action='mission_abandon' then
  if battle is null then raise exception 'Aktif sunucu seferi bulunamadı.'; end if;
  battle:=null;
  outcome:=jsonb_build_object('won',false,'abandoned',true,'at',ms);
 elsif p_action='contract' then
  if p_target not in ('win','hero','forge','maze') then raise exception 'Günlük sözleşme bilinmiyor.'; end if;
  contract_key:=to_char(stamp at time zone 'UTC','YYYY-MM-DD')||':'||p_target;
  if claims ? contract_key then raise exception 'Günlük sözleşme zaten alındı.'; end if;
  counter_target:=case p_target when 'win' then 1 when 'hero' then 1 when 'forge' then 1 else 1 end;
  counter_value:=coalesce((counters->>p_target)::integer,0);
  select coalesce(max(value::integer),0) into fee
    from jsonb_each_text(claims) where key like '%:'||p_target;
  if counter_value<counter_target or counter_value<=fee then
   raise exception 'Bu görev için yeni bir doğrulanmış ilerleme gerekli.';
  end if;
  reward:=case p_target when 'win' then '{"gold":65,"wood":25}'::jsonb
    when 'hero' then '{"aether":12,"gold":35}'::jsonb when 'forge' then '{"stone":55,"gold":40}'::jsonb
    else '{"aether":18,"wood":40}'::jsonb end;
  for c in select jsonb_object_keys(reward) loop
   resources:=jsonb_set(resources,array[c],to_jsonb(least(1000000000,(resources->>c)::bigint+(reward->>c)::bigint)));
  end loop;
  claims:=jsonb_set(claims,array[contract_key],to_jsonb(counter_value),true);
 elsif p_action='title' then
  if p_target not in ('Sınır Nöbetçisi','Yıldız Ustası','Kuzey Muhafızı') then raise exception 'Bilinmeyen unvan.'; end if;
  req:=case p_target when 'Sınır Nöbetçisi' then 5 when 'Yıldız Ustası' then 20 else 40 end;
  n:=(counters->>'win')::integer+(counters->>'hero')::integer+(counters->>'forge')::integer
    +(counters->>'maze')::integer+(counters->>'rift')::integer+(counters->>'veteran')::integer;
  if n<req then raise exception 'Unvan hedefi tamamlanmadı.'; end if;
  if titles ? p_target then raise exception 'Bu unvan zaten açıldı.'; end if;
  titles:=titles||to_jsonb(p_target);
 end if;

 if p_action<>'get' then
  update public.starfort_village_ledger set res=resources,mastery=l.mastery,revision=l.revision+1,updated_at=stamp where user_id=u;
  l.revision:=l.revision+1;
  update public.starfort_player_progress set heroes=heroes,inventory=items,loadouts=gear,
   team=roster,cleared=cleared,stars=stars,veteran=veteran,
   maze_floor=p.maze_floor,rift_week=p.rift_week,mission=battle,last_mission_at=p.last_mission_at,
   last_report=outcome,counters=counters,contract_claims=claims,titles=titles,updated_at=stamp
   where user_id=u;
 end if;
 reply:=jsonb_build_object('ok',true,'source','server','applied',p_action,'serverNow',ms,'revision',l.revision,
  'res',resources,'buildings',l.buildings,'construction',l.construction,'mastery',l.mastery,
  'lastCollected',floor(extract(epoch from l.last_collected)*1000)::bigint,
  'lastDailyReward',case when l.last_daily is null then null else to_char(l.last_daily,'YYYY-MM-DD') end,
  'heroes',heroes,'inventory',items,'loadouts',gear,'team',roster,'cleared',cleared,
  'campaignStars',stars,'veteranMedals',veteran,'mazeFloor',p.maze_floor,
  'riftWeek',p.rift_week,'mission',battle,'lastReport',outcome,
  'counters',counters,'contractClaims',claims,'titles',titles,'cost',cost,'reward',reward);
 if p_action<>'get' then
  insert into public.starfort_village_requests(user_id,request_id,response)
   values(u,p_request_id,reply);
 end if;
 return reply;
end;
$fn$;
revoke all on function public.sfb_account_api(text,text,text,uuid) from public,anon,authenticated;
grant execute on function public.sfb_account_api(text,text,text,uuid) to authenticated;
