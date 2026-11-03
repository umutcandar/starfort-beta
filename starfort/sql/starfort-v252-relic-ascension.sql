-- STARFORT v2.52: 14-week permanent relic ascension, server authoritative.
-- Baseline sfb_starfort_progress md5 3f12acb4faa0da29e94a86f3d73ef683;
-- baseline sfb_shadow_api md5 3c5c84262a67acb7e227dc0f4370b1f8.
-- Existing active missions snapshot their power and cannot be retroactively changed.
-- Ascension is NEVER bought with premium currency, and does not affect multiplayer PvP.
-- One distinct weekly boss contribution row (unique week/user) per verified victory.
-- Four ranks unlock after 2,5,9,14 DISTINCT real weeks; no consecutive-login streak.
-- All writes remain under existing authenticated auth.uid() + village/progress row locks.
alter table public.starfort_player_progress
  add column if not exists relic_ascensions jsonb not null default '{}'::jsonb
  check(jsonb_typeof(relic_ascensions)='object');

CREATE OR REPLACE FUNCTION public.sfb_starfort_progress(p_action text, p_target text DEFAULT NULL::text, p_aux text DEFAULT NULL::text, p_request_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
 act2 jsonb;
 act2_stars jsonb;
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
 ascensions jsonb:='{}'::jsonb;
 boss_seals integer:=0;
 ascension_level integer:=0;
 boss_relic_converted boolean:=false;
 set_bonus text;
 v text;
 inv_count integer;
 last_action bigint;
 enchant jsonb;
 enchant_level integer;
 rarity integer;
 player_week text;
 v_doctrine text;
 v_last_rally integer;
 contribution integer;
 can_claim boolean:=false;
 boss_total integer:=4500;
 boss_damage integer:=0;
 boss_victories integer:=0;
begin
 if u is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then
  raise exception 'Çevrim içi ilerleme için doğrulanmış e-posta hesabı gerekir.';
 end if;
 if p_action is null or p_action not in
  ('get','hero','forge','equip','unequip','team','enhance','ascend','mission_start','mission_turn','mission_abandon','contract','chronicle_claim','title','boss_claim')
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
 act2:=p.act2_cleared;
 act2_stars:=p.act2_stars;
 counters:=p.counters;
 claims:=p.contract_claims;
 titles:=p.titles;
 battle:=p.mission;
 outcome:=p.last_report;
 enchant:=p.item_upgrades;
 ascensions:=coalesce(p.relic_ascensions,'{}'::jsonb);
 select count(*)::integer into boss_seals from public.starfort_world_boss_contribution
  where user_id=u and damage>=300;
 player_week:=to_char(stamp at time zone 'UTC','IYYY-IW');
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
 elsif p_action='ascend' then
  -- At most four persistent PvE ranks per eligible boss item, after mastery +5.
  -- Each weekly-boss contribution exists only after a server-verified boss victory.
  item_id:=p_target;
  if battle is not null then raise exception 'Savaş sürerken yıldız işleme yapılamaz.'; end if;
  if exists(select 1 from public.starfort_shadow_frontier
    where user_id=u and battle is not null) then
    raise exception 'Gölge Sınırı savaşı sürerken ekipman geliştirilemez.';
  end if;
  if item_id is null or item_id not in ('ember_guard','star_spear','guardian_seal','starbreaker') then
    raise exception 'Bu eşya yıldız işleme için uygun değil.';
  end if;
  if coalesce((items->>item_id)::integer,0)<1 then raise exception 'Ekipmanı önce kazan.'; end if;
  if coalesce((enchant->>item_id)::integer,0)<5 then
    raise exception 'Önce bu ekipmanın +5 ustalığını tamamla.';
  end if;
  ascension_level:=coalesce((ascensions->>item_id)::integer,0);
  if ascension_level>=4 then raise exception 'Bu ekipman en üst işleme rütbesinde.'; end if;
  if ascension_level<0 then raise exception 'İşleme rütbesi geçersiz.'; end if;
  ascension_level:=ascension_level+1;
  if boss_seals<(array[2,5,9,14])[ascension_level] then
    raise exception 'Farklı haftalarda % doğrulanmış dünya patronu zaferi gerekli.',
      (array[2,5,9,14])[ascension_level];
  end if;
  cost:=jsonb_build_object('gold',1400*ascension_level*ascension_level,
      'stone',420*ascension_level,'aether',100*ascension_level*ascension_level);
  for c in select jsonb_object_keys(cost) loop
    if (resources->>c)::bigint < (cost->>c)::bigint then
      raise exception 'Yıldız işleme için sunucu kaynağı yetersiz.';
    end if;
    resources:=jsonb_set(resources,array[c],
      to_jsonb((resources->>c)::bigint-(cost->>c)::bigint));
  end loop;
  ascensions:=jsonb_set(ascensions,array[item_id],to_jsonb(ascension_level),true);
 elsif p_action='enhance' then
  item_id:=p_target;
  if battle is not null then raise exception 'Savaşta eşya geliştirilemez.'; end if;
  if not (items ? coalesce(item_id,'')) then raise exception 'Önce eşyayı kazan.'; end if;
  enchant_level:=coalesce((enchant->>item_id)::integer,0);
  if enchant_level>=5 then raise exception 'Bu eşya zaten +5 ustalığında.'; end if;
  rarity:=case when item_id in ('iron_sword','ward_mail','lunar_charm') then 1
      when item_id in ('ember_blade','warden_plate','star_lens','grave_seal','moon_watch','ember_guard') then 2
      else 3 end;
  enchant_level:=enchant_level+1;
  cost:=jsonb_build_object('gold',120*enchant_level*enchant_level*rarity,
    'stone',40*enchant_level*rarity,'aether',8*enchant_level*enchant_level*rarity);
  for c in select jsonb_object_keys(cost) loop
   if (resources->>c)::bigint<(cost->>c)::bigint then raise exception 'Eşya ustalığı için sunucu kaynakları yetersiz.'; end if;
   resources:=jsonb_set(resources,array[c],to_jsonb((resources->>c)::bigint-(cost->>c)::bigint));
  end loop;
  enchant:=jsonb_set(enchant,array[item_id],to_jsonb(enchant_level),true);
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
  if p_target='boss' then
   mode:='boss';stage:=4;tier:=1;
   if jsonb_array_length(cleared)<4 then raise exception 'Ortak dünya patronu için dört hikâye bölgesi tamamla.'; end if;
   if p.boss_week=player_week then raise exception 'Bu haftanın dünya patronunu zaten mağlup ettin.'; end if;
  elsif p_target='rift' then
   mode:='rift';stage:=8;tier:=3;
   if jsonb_array_length(cleared)<8 then raise exception 'Yarık için hikâyeyi tamamla.'; end if;
   weeks:=to_char(stamp at time zone 'UTC','IYYY-IW');
   if p.rift_week=weeks then raise exception 'Bu haftanın yarık sınavı tamamlandı.'; end if;
  elsif p_target like 'maze:%' then
   mode:='maze';floor_no:=substring(p_target from 6)::integer;
   if floor_no<>p.maze_floor+1 or floor_no<1 or floor_no>16 then raise exception 'Labirentin sıradaki katını seç.'; end if;
   stage:=ceil(floor_no/2.0)::integer;
   if jsonb_array_length(cleared)<stage then raise exception 'Önce gerekli hikâye bölümünü tamamla.'; end if;
  elsif p_target ~ '^act2:[1-8]$' then
   mode:='act2';stage:=split_part(p_target,':',2)::integer;
   if jsonb_array_length(cleared)<8 then raise exception 'İkinci perde için sekiz ana bölgeyi tamamla.'; end if;
   if stage>jsonb_array_length(act2)+1 then raise exception 'Önce ikinci perdenin önceki bölgesini bitir.'; end if;
  elsif p_target like 'veteran:%' then
   mode:='veteran';stage:=split_part(p_target,':',2)::integer;tier:=split_part(p_target,':',3)::integer;
   if stage<1 or stage>8 or tier<1 or tier>3 or not (cleared @> to_jsonb(array[stage])) then
    raise exception 'Usta seferi henüz açılmadı.';
   end if;
   -- Protect permanent veteran medals from forged direct tier 3 RPC requests.
   if tier>least(3,coalesce((veteran->>stage::text)::integer,0)+1) then
    raise exception 'Önce önceki usta seferi kademesini tamamla.';
   end if;
  else
   if p_target is null or p_target!~'^[1-8]$' then raise exception 'Bilinmeyen hikâye bölümü.'; end if;
   stage:=p_target::integer;
   if stage>jsonb_array_length(cleared)+1 then raise exception 'Önce önceki hikâye bölümünü tamamla.'; end if;
   -- Match the guest campaign's actual 3–8 progression contracts.
   -- Returning veterans can replay cleared chapters without being retroactively blocked.
   if stage>=3 and not (cleared @> to_jsonb(array[stage])) then
    req:=case when stage<=4 then 2 when stage<=6 then 3 else 4 end;
    if (l.buildings->>'forge')::integer < req then
     raise exception 'Yeni sefer için demirhaneyi geliştir.';
    end if;
    req:=case stage when 3 then 1 when 4 then 2 when 5 then 3 when 6 then 4 when 7 then 6 else 8 end;
    if p.maze_floor < req then
     raise exception 'Yeni sefer için önce labirent muhafızlarını geç.';
    end if;
    n:=0;
    for i in 0..2 loop
     hero:=roster->>i;
     for slot in select jsonb_object_keys(coalesce(gear->hero,'{}'::jsonb)) loop
      n:=n+1;
     end loop;
    end loop;
    req:=case when stage<=4 then 1 when stage<=6 then 2 else 3 end;
    if n<req then raise exception 'Yeni sefer için daha fazla ekipman kuşan.'; end if;
   end if;
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
    power:=power+coalesce((enchant->>item_id)::integer,0)*9;
    -- Each equipped relic copy receives +14 combat power per verified ascension rank.
    power:=power+coalesce((ascensions->>item_id)::integer,0)*14;
   end loop;
   -- Matching two distinct set pieces worn by the same hero add server-side power.
   for slot in select unnest(array['moon','ember','dawn']) loop
     n:=0;
     for v in select jsonb_object_keys(coalesce(gear->hero,'{}'::jsonb)) loop
       item_id:=gear->hero->>v;
       if (slot='moon' and item_id in ('lunar_charm','moon_watch','star_spear'))
        or (slot='ember' and item_id in ('ember_blade','ember_guard','ashes_plate'))
        or (slot='dawn' and item_id in ('royal_blade','dawn_relic','dawn_guard','starbreaker','guardian_seal')) then n:=n+1; end if;
     end loop;
     if n>=2 then power:=power+case slot when 'moon' then 18 when 'ember' then 18 else 16 end; end if;
   end loop;
  end loop;
  req:=case stage when 1 then 250 when 2 then 310 when 3 then 380 when 4 then 450
      when 5 then 540 when 6 then 650 when 7 then 780 else 920 end;
  if mode='act2' then req:=1000+stage*150; end if;
  difficulty:=case when mode='act2' then 1.5+stage*.12 else 1+0.4*tier+case when mode='maze' then floor_no*0.035 else 0 end end;
  if power<req*(case when mode='act2' then .7 else difficulty*.7 end) then raise exception 'Takımın sefer için yeterince güçlü değil.'; end if;
  ehp:=round(case when mode='act2' then greatest((110+stage*45)*difficulty,least(power,(1000+stage*150)*1.25)*1.2)
              else (110+stage*45)*difficulty*(case when mode='story' then .8 else 1 end) end)::integer;
  -- v2.50: weekly boss endurance scales to a bounded, server-computed team power.
  -- The cap prevents impossible HP while avoiding a two-hit world boss for developed heroes.
  if mode='boss' then
    ehp:=greatest(ehp,round(least(power,1800)*1.65)::integer);
  end if;
  php:=round(130+power*0.6)::integer;
  -- Prepared and paid supplies are consumed only after a verified mission start.
  select pending_doctrine into v_doctrine from public.starfort_warfront where user_id=u for update;
  if v_doctrine is not null then
    update public.starfort_warfront
      set pending_doctrine=null,revision=revision+1,updated_at=stamp where user_id=u;
  end if;
  if v_doctrine='bulwark' then php:=round(php*1.10)::integer; end if;
  battle:=jsonb_build_object('mode',mode,'stage',stage,'tier',tier,'floor',floor_no,
    'startedAt',ms,'lastTurnAt',ms,'turn',0,'balanceVersion',3,'power',round(power),'enemyHp',ehp,'enemyMaxHp',ehp,
    'playerHp',php,'playerMaxHp',php,'wave',1,'waves',case when mode in ('story','act2') then 3 else 1 end,'waveTurn',0,'lastAction','Başladı','enemyIntent','strike','cooldowns','{}'::jsonb,'doctrine',coalesce(v_doctrine,'none'),'lastRallyTurn',0);
  outcome:=null;
  p.last_mission_at:=stamp;
 elsif p_action='mission_turn' then
  if battle is null then raise exception 'Devam eden sunucu savaşı yok.'; end if;
  if p_aux not in ('strike','guard','skill','feint','rally') and
     p_aux !~ '^skill:(aldren|lyra|rovan|mira|doran|vesper|eira)$' then
   raise exception 'Savaş hamlesi geçersiz.';
  end if;
  last_action:=(battle->>'lastTurnAt')::bigint;
  if ms-last_action<3000 then raise exception 'Savaş hamlesi için 3 saniye bekle.'; end if;
  turns:=(battle->>'turn')::integer+1;
  power:=(battle->>'power')::numeric;
  ehp:=(battle->>'enemyHp')::integer;php:=(battle->>'playerHp')::integer;
  ability:=p_aux;
  n:=0; -- 1 only on a verified story wave boundary
  if ability like 'skill:%' then
   hero:=split_part(ability,':',2);
   if not (roster @> to_jsonb(array[hero])) then raise exception 'Yetenek yalnızca aktif takımdaki kahramana aittir.'; end if;
   if coalesce((battle->'cooldowns'->>hero)::integer,0)>turns then
    raise exception 'Bu kahramanın yeteneği henüz yenilenmedi.';
   end if;
   battle:=jsonb_set(battle,'{cooldowns}',coalesce(battle->'cooldowns','{}'::jsonb),true);
   battle:=jsonb_set(battle,array['cooldowns',hero],to_jsonb(turns+3),true);
  end if;
  dmg:=greatest(12,round(power/5*(case ability when 'skill' then 1.3 when 'guard' then 0.68 else 1 end)))::integer;
  edmg:=greatest(5,round((18+(battle->>'stage')::integer*9)*(case ability when 'guard' then 0.35 else 1 end)*(1+(battle->>'tier')::integer*.3)))::integer;
  if ability='feint' then dmg:=greatest(8,round(dmg*.72)::integer); end if;
  if ability='rally' then
    v_last_rally:=coalesce((battle->>'lastRallyTurn')::integer,0);
    if v_last_rally>0 and turns-v_last_rally<4 then
      raise exception 'Toparlanma komutu için dört tur bekle.';
    end if;
    dmg:=greatest(8,round(dmg*.45)::integer);
    php:=least((battle->>'playerMaxHp')::integer,php+round((battle->>'playerMaxHp')::numeric*.16)::integer);
    battle:=jsonb_set(battle,'{lastRallyTurn}',to_jsonb(turns),true);
  end if;
  if ability like 'skill:%' then
   dmg:=greatest(12,round(dmg*(case hero
     when 'aldren' then 0.82 when 'lyra' then 1.75 when 'rovan' then 1.55
     when 'mira' then 0.85 when 'doran' then 1.80 when 'vesper' then 1.93
     when 'eira' then 1.35 else 1 end))::integer);
   if hero='aldren' then edmg:=greatest(2,round(edmg*.38)::integer); end if;
   if hero='eira' then
    edmg:=greatest(2,round(edmg*.55)::integer);
    php:=least((battle->>'playerMaxHp')::integer,php+18+(heroes->>hero)::integer*3);
   end if;
   if hero='mira' then php:=least((battle->>'playerMaxHp')::integer,php+42+(heroes->>hero)::integer*6); end if;
   if hero='rovan' and ehp<(battle->>'enemyMaxHp')::integer*.5 then dmg:=round(dmg*1.25)::integer; end if;
   if hero='vesper' and ehp<(battle->>'enemyMaxHp')::integer*.35 then dmg:=round(dmg*1.4)::integer; end if;
  end if;
  -- The enemy announces its intent before each player turn.
  -- Players can counter a telegraphed crush with Guard, or break the enemy shield with a hero skill.
  if battle->>'enemyIntent'='crush' then
    edmg:=greatest(1,round(edmg*(case when ability='guard' then .22 else 1.70 end))::integer);
  elsif battle->>'enemyIntent'='shield' then
    edmg:=greatest(1,round(edmg*.5)::integer);
    if ability not like 'skill:%' and ability<>'feint' then
      dmg:=greatest(1,round(dmg*.55)::integer);
    elsif ability='feint' then
      dmg:=greatest(1,round(dmg*1.35)::integer);
    end if;
  elsif battle->>'enemyIntent'='drain' then
    edmg:=greatest(1,round(edmg*.8)::integer);
  elsif battle->>'enemyIntent'='sunder' and coalesce((battle->>'balanceVersion')::integer,1)>=3 then
    -- Marked armor-breaking blow: Feint interrupts it, Guard is a safer but slower answer.
    -- All hit values are computed server-side, never sent by the browser.
    if ability='feint' then
      edmg:=greatest(1,round(edmg*.35)::integer);
      dmg:=greatest(1,round(dmg*1.55)::integer);
    elsif ability='guard' then
      edmg:=greatest(1,round(edmg*.40)::integer);
      dmg:=greatest(1,round(dmg*.75)::integer);
    else
      edmg:=greatest(1,round(edmg*1.38)::integer);
      dmg:=greatest(1,round(dmg*.80)::integer);
    end if;
  end if;
  -- Act II final-wave bosses become tactically stronger at 67% and 33% HP.
  -- Inputs are the locked server mission snapshot, not any client-supplied statistics.
  if battle->>'mode'='act2' and coalesce((battle->>'wave')::integer,1)=3 then
    if ehp <= (battle->>'enemyMaxHp')::numeric*.33 then
      edmg:=greatest(1,round(edmg*1.27)::integer);
    elsif ehp <= (battle->>'enemyMaxHp')::numeric*.67 then
      if battle->>'enemyIntent'='shield' and ability not like 'skill:%' and ability<>'feint' then
        dmg:=greatest(1,round(dmg*.82)::integer);
      end if;
    end if;
  end if;
  -- Stage-specific Act II effects on the final wave; every input comes from the locked battle.
  if battle->>'mode'='act2' and (battle->>'wave')::integer=3 then
    case (battle->>'stage')::integer
      when 1 then
        if battle->>'enemyIntent'='crush' and ability<>'guard' then edmg:=round(edmg*1.22)::integer; end if;
      when 2 then
        if battle->>'enemyIntent'='shield' and ability not like 'skill:%' and ability<>'feint' then edmg:=edmg+round(dmg*.18)::integer; end if;
      when 3 then
        if battle->>'enemyIntent'='shield' and ability not like 'skill:%' and ability<>'feint' then dmg:=greatest(1,round(dmg*.58)::integer); end if;
      when 4 then
        if battle->>'enemyIntent'='strike' and ability<>'guard' then edmg:=edmg+round(dmg*.17)::integer; end if;
      when 5 then
        if battle->>'enemyIntent'='drain' then edmg:=round(edmg*1.12)::integer; end if;
      when 6 then
        if battle->>'enemyIntent'='shield' and ability not like 'skill:%' and ability<>'feint' then dmg:=greatest(1,round(dmg*.63)::integer); end if;
      when 7 then
        if battle->>'enemyIntent'='crush' and ability<>'guard' then edmg:=round(edmg*1.32)::integer; end if;
      when 8 then
        if battle->>'enemyIntent'='drain' and ability='guard' then edmg:=greatest(1,round(edmg*.80)::integer); end if;
      else null;
    end case;
  end if;
  -- v2.50 story final-boss phases: warned enemy intent always has a counterplay.
  if battle->>'mode'='story' and coalesce((battle->>'balanceVersion')::integer,1)>=2
    and (battle->>'stage')::integer>=4 and coalesce((battle->>'wave')::integer,1)=3
    and ehp <= (battle->>'enemyMaxHp')::numeric*.67 then
    case (battle->>'stage')::integer
     when 4 then
      if battle->>'enemyIntent'='shield' and ability not like 'skill:%' and ability<>'feint' then
       dmg:=greatest(1,round(dmg*.85)::integer);end if;
     when 5 then
      if battle->>'enemyIntent'='drain' then edmg:=greatest(1,round(edmg*1.10)::integer);end if;
     when 6 then
      if battle->>'enemyIntent'='shield' and ability not like 'skill:%' and ability<>'feint' then
       dmg:=greatest(1,round(dmg*.78)::integer);end if;
     when 7 then
      if battle->>'enemyIntent'='crush' and ability<>'guard' then edmg:=greatest(1,round(edmg*1.18)::integer);end if;
     when 8 then
      if battle->>'enemyIntent'='shield' and ability not like 'skill:%' and ability<>'feint' then
       dmg:=greatest(1,round(dmg*.82)::integer);end if;
     else null;
    end case;
    if ehp <= (battle->>'enemyMaxHp')::numeric*.33
      and battle->>'enemyIntent'='crush' and ability<>'guard' then
      edmg:=greatest(1,round(edmg*1.12)::integer);
    end if;
  end if;
  -- Verified PvE doctrines cannot be changed by an untrusted battle turn.
  v_doctrine:=coalesce(battle->>'doctrine','none');
  if v_doctrine='assault' then
    dmg:=greatest(1,round(dmg*1.12)::integer);
    edmg:=greatest(1,round(edmg*1.06)::integer);
  elsif v_doctrine='bulwark' then
    edmg:=greatest(1,round(edmg*.78)::integer);
  elsif v_doctrine='recon' and ability='feint' then
    dmg:=greatest(1,round(dmg*1.25)::integer);
  end if;
  ehp:=greatest(0,ehp-dmg);
  if ehp>0 then
    php:=greatest(0,php-edmg);
    if battle->>'enemyIntent'='drain' then
      ehp:=least((battle->>'enemyMaxHp')::integer,ehp+greatest(2,round(edmg*(case
 when battle->>'mode'='act2' and (battle->>'wave')::integer=3 and (battle->>'stage')::integer=8 and ability='guard' then .35
 when battle->>'mode'='act2' and (battle->>'wave')::integer=3 and (battle->>'stage')::integer=8 then .92
 when battle->>'mode'='act2' and (battle->>'wave')::integer=3 and (battle->>'stage')::integer=5 then .82
 when battle->>'mode'='act2' and (battle->>'wave')::integer=3 then .65
 when battle->>'mode'='story' and coalesce((battle->>'balanceVersion')::integer,1)>=2
   and (battle->>'wave')::integer=3 and (battle->>'stage')::integer=8 then .72
 when battle->>'mode'='story' and coalesce((battle->>'balanceVersion')::integer,1)>=2
   and (battle->>'wave')::integer=3 and (battle->>'stage')::integer=5 then .60
 else .45 end))::integer));
    end if;
  end if;
  -- Only the server may advance a story chapter's 3 objectives.
  -- No intermediate wave is a victory, reward, star or first-clear.
  if ehp=0 and php>0 and battle->>'mode' in ('story','act2')
     and coalesce((battle->>'wave')::integer,1)<coalesce((battle->>'waves')::integer,1) then
    n:=1;
    req:=coalesce((battle->>'wave')::integer,1)+1;
    stage:=(battle->>'stage')::integer;
    ehp:=round(case when battle->>'mode'='act2' then
          greatest((110+stage*45)*(1.5+stage*.12)*(case req when 2 then 1.25 else 1.50 end),
                   least(power,(1000+stage*150)*1.25)*(case req when 2 then 1.55 else 1.90 end))
        -- v2.50: only NEW stage 4-8 story bosses (third operation) gain bounded endurance.
        -- Existing active battles lack balanceVersion=2 and remain on their original HP rules.
        when battle->>'mode'='story' and coalesce((battle->>'balanceVersion')::integer,1)>=2
          and stage>=4 and req=3 then
          greatest((110+stage*45)*1.25,least(power,750+stage*90)*1.40)
        else (110+stage*45)*(case req when 2 then 1.0 else 1.25 end) end)::integer;
    php:=least((battle->>'playerMaxHp')::integer,
        php+round((battle->>'playerMaxHp')::numeric*(case when battle->>'mode'='act2' then .34 else .24 end))::integer);
    battle:=jsonb_set(battle,'{wave}',to_jsonb(req),true);
    battle:=jsonb_set(battle,'{enemyMaxHp}',to_jsonb(ehp),true);
  end if;
  battle:=jsonb_set(battle,'{waveTurn}',to_jsonb(case when n=1 then 0 else coalesce((battle->>'waveTurn')::integer,0)+1 end),true);
  battle:=jsonb_set(battle,'{turn}',to_jsonb(turns));
  battle:=jsonb_set(battle,'{enemyHp}',to_jsonb(ehp));
  battle:=jsonb_set(battle,'{playerHp}',to_jsonb(php));
  battle:=jsonb_set(battle,'{lastTurnAt}',to_jsonb(ms));
  battle:=jsonb_set(battle,'{lastAction}',to_jsonb(case when n=1 then 'Dalga '||(battle->>'wave')||' başladı' else ability end));
  -- Repeatable four-turn enemy behavior remains server-authoritative across reloads.
  battle:=jsonb_set(battle,'{enemyIntent}',to_jsonb(case
    -- Final-wave story bosses telegraph Sunder every 3rd-5th turn from 67% HP.
    -- A new version is needed so existing open fights retain the original 4-intent rhythm.
    when battle->>'mode'='story' and coalesce((battle->>'balanceVersion')::integer,1)>=3
      and (battle->>'stage')::integer>=4 and (battle->>'wave')::integer=3
      and ehp <= (battle->>'enemyMaxHp')::numeric*.33 then
       (case (turns+(battle->>'stage')::integer)%3 when 0 then 'sunder' when 1 then 'crush' else 'drain' end)
    when battle->>'mode'='story' and coalesce((battle->>'balanceVersion')::integer,1)>=3
      and (battle->>'stage')::integer>=4 and (battle->>'wave')::integer=3
      and ehp <= (battle->>'enemyMaxHp')::numeric*.67 then
       (case (turns+(battle->>'stage')::integer)%5
         when 0 then 'sunder' when 1 then 'crush' when 2 then 'shield' when 3 then 'drain' else 'strike' end)
    when battle->>'mode'='boss' and coalesce((battle->>'balanceVersion')::integer,1)>=3
      and ehp <= (battle->>'enemyMaxHp')::numeric*.50 then
       (case turns%4 when 0 then 'sunder' when 1 then 'crush' when 2 then 'shield' else 'drain' end)
    when battle->>'mode'='act2' then (case
      when coalesce((battle->>'wave')::integer,1)=3 and ehp <= (battle->>'enemyMaxHp')::numeric*.33
        then (case when turns%3=0 then 'drain' else 'crush' end)
      when coalesce((battle->>'wave')::integer,1)=3 and ehp <= (battle->>'enemyMaxHp')::numeric*.67
        then (case when turns%3=0 then 'shield' else 'drain' end)
      else (case (turns+(battle->>'stage')::integer+(battle->>'wave')::integer)%4
        when 0 then 'crush' when 1 then 'drain' when 2 then 'shield' else 'strike' end) end)
    when n=1 then 'strike'
    else (case turns%4 when 1 then 'crush' when 2 then 'shield' when 3 then 'drain' else 'strike' end) end));
  if ehp=0 or php=0 or turns >= (case when battle->>'mode' in ('story','act2') and coalesce((battle->>'waves')::integer,1)>1 then 36 else 14 end) then
   stage:=(battle->>'stage')::integer;
   mode:=battle->>'mode';
   tier:=(battle->>'tier')::integer;
   floor_no:=(battle->>'floor')::integer;
   if ehp=0 then
    stars_won:=case when php>=((battle->>'playerMaxHp')::integer*.7) and turns <= (case when mode='story' and stage>=4 and coalesce((battle->>'balanceVersion')::integer,1)>=2 then 24 when mode='boss' and coalesce((battle->>'balanceVersion')::integer,1)>=3 then 12 when mode in ('story','act2') and coalesce((battle->>'waves')::integer,1)>1 then 18 else 5 end) then 3
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
    -- Only FIRST clear of rebalanced late story receives a modest endurance premium;
    -- replays retain their existing 40% rate and cannot farm the premium.
    if mode='story' and stage>=4 and coalesce((battle->>'balanceVersion')::integer,1)>=2
       and not (cleared @> to_jsonb(array[stage])) then
      for c in select jsonb_object_keys(reward) loop
       reward:=jsonb_set(reward,array[c],to_jsonb(round((reward->>c)::numeric*1.10)::bigint));
      end loop;
    end if;
    if mode='act2' then
      for c in select jsonb_object_keys(reward) loop
       reward:=jsonb_set(reward,array[c],to_jsonb(round((reward->>c)::numeric *
        (case when act2 @> to_jsonb(array[stage]) then .5 else 1.65 end))::bigint));
      end loop;
    elsif mode='story' and (cleared @> to_jsonb(array[stage])) then
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
    elsif mode='boss' then
      reward:='{"gold":420,"wood":175,"stone":160,"aether":60}'::jsonb;
      p.boss_week:=player_week;
      -- Deterministic four-week equipment rotation: one boss victory at most per week.
      -- Older open battles keep their original reward. Inventory cap converts to star essence.
      if coalesce((battle->>'balanceVersion')::integer,1)>=3 then
        bonus_item:=case ((right(player_week,2))::integer-1)%4
          when 0 then 'ember_guard' when 1 then 'star_spear'
          when 2 then 'guardian_seal' else 'starbreaker' end;
        if coalesce((items->>bonus_item)::integer,0)>=20 then
          boss_relic_converted:=true;
          reward:=jsonb_set(reward,'{aether}',to_jsonb((reward->>'aether')::bigint+36),true);
        else
          items:=jsonb_set(items,array[bonus_item],
            to_jsonb(coalesce((items->>bonus_item)::integer,0)+1),true);
        end if;
      end if;
      contribution:=greatest(300,round((battle->>'power')::numeric*5)::integer);
      insert into public.starfort_world_boss_week(week,goal_damage,damage,victories)
       values(player_week,4500,0,0) on conflict (week) do nothing;
      update public.starfort_world_boss_week
       set damage=least(goal_damage,damage+contribution),victories=victories+1 where week=player_week;
      insert into public.starfort_world_boss_contribution(week,user_id,damage)
       values(player_week,u,contribution)
       on conflict(week,user_id) do update set damage=public.starfort_world_boss_contribution.damage+excluded.damage;
    end if;
    for c in select jsonb_object_keys(reward) loop
      resources:=jsonb_set(resources,array[c],to_jsonb(least(1000000000,(resources->>c)::bigint+(reward->>c)::bigint)));
    end loop;
    if mode='act2' then
      if not (act2 @> to_jsonb(array[stage])) then act2:=act2||to_jsonb(stage); end if;
      old_stars:=coalesce((act2_stars->>stage::text)::integer,0);
      if stars_won>old_stars then act2_stars:=jsonb_set(act2_stars,array[stage::text],to_jsonb(stars_won),true); end if;
    end if;
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
    counter_name:=case mode when 'boss' then 'rift' when 'maze' then 'maze' when 'rift' then 'rift' when 'veteran' then 'veteran' else 'win' end;
    counters:=jsonb_set(counters,array[counter_name],to_jsonb((counters->>counter_name)::integer+1));
    outcome:=jsonb_build_object('won',true,'mode',mode,'stage',stage,'stars',stars_won,
      'reward',reward,'floor',floor_no,'at',ms,'turns',turns);
    if mode='boss' and coalesce((battle->>'balanceVersion')::integer,1)>=3 then
      outcome:=jsonb_set(outcome,'{bossRelic}',jsonb_build_object(
        'item',case when boss_relic_converted then null else bonus_item end,
        'converted',boss_relic_converted,
        'aether',case when boss_relic_converted then 36 else 0 end
      ),true);
    end if;
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
 elsif p_action='chronicle_claim' then
  -- Komutan Kronigi: sequential permanent server victories and one-time reward.
  -- No client damage, claimed rank or self-reported victories are trusted.
  if p_target is null or p_target !~ '^([1-9]|[12][0-9]|30)$' then
    raise exception 'Gecersiz kronik rutbesi.';
  end if;
  req:=p_target::integer;
  contract_key:='chronicle:'||req::text;
  if claims ? contract_key then raise exception 'Bu kronik sandigi zaten acildi.'; end if;
  if req>1 and not (claims ? ('chronicle:'||(req-1)::text)) then
    raise exception 'Onceki kronik rutbesini tamamla.';
  end if;
  counter_value:=coalesce((counters->>'win')::integer,0);
  if counter_value<2*req*req then
    raise exception 'Bu rutbe icin daha fazla dogrulanmis sefer zaferi gerekli.';
  end if;
  reward:=jsonb_build_object('gold',100+req*60,'aether',5+req*3);
  for c in select jsonb_object_keys(reward) loop
    resources:=jsonb_set(resources,array[c],to_jsonb(
      least(1000000000,(resources->>c)::bigint+(reward->>c)::bigint)));
  end loop;
  claims:=jsonb_set(claims,array[contract_key],to_jsonb(counter_value),true);
 elsif p_action='boss_claim' then
  select damage,goal_damage,victories into boss_damage,boss_total,boss_victories
   from public.starfort_world_boss_week where week=player_week for update;
  if not found or boss_damage<boss_total then raise exception 'Ortak dünya patronu henüz yenilmedi.'; end if;
  update public.starfort_world_boss_contribution
   set claimed=true where week=player_week and user_id=u and damage>0 and claimed=false;
  if not found then raise exception 'Ortak ödül daha önce alındı veya katılım yok.'; end if;
  reward:='{"gold":600,"stone":260,"aether":120}'::jsonb;
  for c in select jsonb_object_keys(reward) loop
   resources:=jsonb_set(resources,array[c],to_jsonb(least(1000000000,(resources->>c)::bigint+(reward->>c)::bigint)));
  end loop;
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
   team=roster,cleared=cleared,stars=stars,veteran=veteran,act2_cleared=act2,act2_stars=act2_stars,item_upgrades=enchant,relic_ascensions=ascensions,boss_week=p.boss_week,
   maze_floor=p.maze_floor,rift_week=p.rift_week,mission=battle,last_mission_at=p.last_mission_at,
   last_report=outcome,counters=counters,contract_claims=claims,titles=titles,updated_at=stamp
   where user_id=u;
 end if;
 select damage,goal_damage,victories into boss_damage,boss_total,boss_victories
   from public.starfort_world_boss_week where week=player_week;
 boss_damage:=coalesce(boss_damage,0);
 boss_total:=coalesce(boss_total,4500);
 boss_victories:=coalesce(boss_victories,0);
 select coalesce((select claimed from public.starfort_world_boss_contribution where week=player_week and user_id=u),false) into can_claim;
 -- Include any boss victory completed in THIS action's final response.
 select count(*)::integer into boss_seals from public.starfort_world_boss_contribution
  where user_id=u and damage>=300;
 reply:=jsonb_build_object('ok',true,'source','server','applied',p_action,'serverNow',ms,'revision',l.revision,
  'res',resources,'buildings',l.buildings,'construction',l.construction,'mastery',l.mastery,
  'lastCollected',floor(extract(epoch from l.last_collected)*1000)::bigint,
  'lastDailyReward',case when l.last_daily is null then null else to_char(l.last_daily,'YYYY-MM-DD') end,
  'tradeDay',case when l.trade_day is null then null else to_char(l.trade_day,'YYYY-MM-DD') end,
  'tradeRoutes',l.trade_routes,
  'heroes',heroes,'inventory',items,'loadouts',gear,'team',roster,'cleared',cleared,
  'campaignStars',stars,'act2Cleared',act2,'act2Stars',act2_stars,'veteranMedals',veteran,'mazeFloor',p.maze_floor,
  'riftWeek',p.rift_week,'bossWeek',p.boss_week,'worldBoss',jsonb_build_object('week',player_week,'goal',boss_total,'damage',boss_damage,'victories',boss_victories,'claimed',can_claim),
  'itemUpgrades',enchant,'relicAscensions',ascensions,'bossSeals',boss_seals,
  'mission',battle,'lastReport',outcome,
  'counters',counters,'contractClaims',claims,'titles',titles,'cost',cost,'reward',reward);
 if p_action<>'get' then
  insert into public.starfort_village_requests(user_id,request_id,response)
   values(u,p_request_id,reply);
 end if;
 return reply;
end;
$function$;

revoke all on function public.sfb_starfort_progress(text,text,text,uuid) from public,anon,authenticated;
grant execute on function public.sfb_starfort_progress(text,text,text,uuid) to authenticated;

CREATE OR REPLACE FUNCTION public.sfb_shadow_api(p_action text, p_target text DEFAULT NULL::text, p_aux text DEFAULT NULL::text, p_request_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
#variable_conflict use_variable
declare
 uid uuid:=auth.uid();
 t timestamptz:=clock_timestamp();
 ms bigint:=floor(extract(epoch from t)*1000)::bigint;
 v public.starfort_village_ledger%rowtype;
 p public.starfort_player_progress%rowtype;
 w public.starfort_shadow_frontier%rowtype;
 prior jsonb;
 result jsonb;
 battle jsonb;
 paths jsonb;
 cleared jsonb;
 stars jsonb;
 resources jsonb;
 inventory jsonb;
 counters jsonb;
 cost jsonb:='{}'::jsonb;
 reward jsonb:='{}'::jsonb;
 report jsonb;
 hero text;
 path text;
 rank_no integer;
 level_no integer;
 needed integer;
 stage integer;
 wave_no integer;
 turn_no integer;
 hp integer;
 maxhp integer;
 enemy_hp integer;
 enemy_max integer;
 attack_power integer;
 attack_ranks integer:=0;
 ward_ranks integer:=0;
 base_atk integer;
 done boolean:=false;
 first_clear boolean:=false;
 loot_converted boolean:=false;
 item_id text;
 move text;
 damage integer;
 received integer;
 stars_won integer;
 prev_stars integer;
 k text;
 i integer;
 j integer;
 next_intent text;
 last_rally integer;
 cooldowns jsonb;
 changed boolean:=false;
 mastery_rank integer:=0;
 gained_renown integer:=0;
 new_gain integer:=0;
 weekly_limit integer:=100;
 repeat_factor numeric;
 current_week text:=to_char(t at time zone 'UTC','IYYY-IW');
 milestones integer[]:=array[12,30,55,90,140,210,300,410,550,710,900,1120];
 claimed_rank integer:=0;
begin
 if uid is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then
  raise exception 'Gölge Sınırı için doğrulanmış oyuncu hesabı gerekir.';end if;
 if p_action is null or p_action not in ('get','train','start','turn','abandon','claim_mastery') then
  raise exception 'Bilinmeyen sınır işlemi.';end if;
 if p_action<>'get' and p_request_id is null then raise exception 'Tekil işlem kimliği gerekli.';end if;
 -- Same lock order as campaign and warfront: village -> progress -> frontier.
 insert into public.starfort_village_ledger(user_id) values(uid) on conflict do nothing;
 insert into public.starfort_player_progress(user_id) values(uid) on conflict do nothing;
 select * into strict v from public.starfort_village_ledger where user_id=uid for update;
 select * into strict p from public.starfort_player_progress where user_id=uid for update;
 insert into public.starfort_shadow_frontier(user_id) values(uid) on conflict do nothing;
 select * into strict w from public.starfort_shadow_frontier where user_id=uid for update;
 if p_action<>'get' then
  select response into prior from public.starfort_shadow_requests where user_id=uid and request_id=p_request_id;
  if found then return prior;end if;
 end if;
 paths:=w.hero_paths;cleared:=w.cleared;stars:=w.stars;
 resources:=v.res;inventory:=p.inventory;counters:=p.counters;
 battle:=w.battle;report:=w.last_report;
 -- A week resets on the first authenticated visit. Progress NEVER requires consecutive logins.
 if w.week_id<>current_week then
  w.week_id:=current_week;w.week_wins:=0;w.week_renown:=0;changed:=true;
 end if;
 for i in 1..12 loop
  if w.mastery_xp>=milestones[i] then mastery_rank:=i;else exit;end if;
 end loop;
 if p_action='claim_mastery' then
  if w.mastery_claimed>=mastery_rank then
    raise exception 'Henüz alınmamış Sınır Ustalığı ödülü bulunmuyor.';end if;
  claimed_rank:=w.mastery_claimed+1;
  if claimed_rank>12 then raise exception 'Tüm ustalık unvanları zaten alındı.';end if;
  reward:=jsonb_build_object('gold',80+60*claimed_rank,'wood',40+30*claimed_rank,
    'stone',35+30*claimed_rank,'aether',8+6*claimed_rank);
  for k in select jsonb_object_keys(reward) loop
   resources:=jsonb_set(resources,array[k],
    to_jsonb(least(1000000000,(resources->>k)::bigint+(reward->>k)::bigint)));
  end loop;
  w.mastery_claimed:=claimed_rank;changed:=true;
 elsif p_action='train' then
  hero:=p_target;path:=p_aux;
  if hero is null or hero not in ('aldren','lyra','rovan','mira','doran','vesper','eira')
    or not (p.heroes ? hero) then raise exception 'Kahraman henüz açılmadı.';end if;
  if path is null or path not in ('assault','warden') then raise exception 'Geçersiz kahraman uzmanlığı.';end if;
  if battle is not null or p.mission is not null then raise exception 'Savaş sürerken eğitim yapılamaz.';end if;
  if paths ? hero and paths->hero->>'path'<>path then
    raise exception 'Kahramanın ilk seçtiği uzmanlık yolu kalıcıdır.';end if;
  rank_no:=coalesce((paths->hero->>'rank')::integer,0)+1;
  if rank_no>3 then raise exception 'Uzmanlık zaten en yüksek rütbede.';end if;
  needed:=case rank_no when 1 then 3 when 2 then 6 else 10 end;
  if (p.heroes->>hero)::integer<needed then
    raise exception 'Uzmanlık rütbesi % için kahraman seviye % olmalı.',rank_no,needed;end if;
  needed:=case rank_no when 1 then 2 when 2 then 6 else 8 end;
  if jsonb_array_length(p.cleared)<needed then
    raise exception 'Bu eğitim için ana hikâyede % bölüm gerekli.',needed;end if;
  if rank_no=3 and jsonb_array_length(p.act2_cleared)<2 then
    raise exception 'Üçüncü rütbe için İkinci Perde 2. bölge gerekli.';end if;
  cost:=jsonb_build_object('gold',250*rank_no*rank_no,'aether',45*rank_no*rank_no,
    'stone',25*rank_no);
  for k in select jsonb_object_keys(cost) loop
    if (resources->>k)::bigint<(cost->>k)::bigint then
      raise exception 'Uzmanlık için kaynaklar yetersiz.';end if;
  end loop;
  for k in select jsonb_object_keys(cost) loop
    resources:=jsonb_set(resources,array[k],to_jsonb((resources->>k)::bigint-(cost->>k)::bigint));
  end loop;
  paths:=jsonb_set(paths,array[hero],jsonb_build_object('path',path,'rank',rank_no),true);
  changed:=true;
 elsif p_action='start' then
  if p.mission is not null or battle is not null then raise exception 'Önce aktif savaşı bitir.';end if;
  if w.last_started_at is not null and t-w.last_started_at<interval '20 seconds' then
    raise exception 'Komutan hazırlanıyor. Yeni sefer için 20 saniye bekle.';end if;
  if p_target is null or p_target not in ('1','2','3','4') then raise exception 'Bilinmeyen sınır bölgesi.';end if;
  stage:=p_target::integer;
  if jsonb_array_length(p.act2_cleared)<stage*2 then
    raise exception 'Bu sınır bölgesi için İkinci Perde % / 8 tamamlanmalı.',stage*2;end if;
  if stage>jsonb_array_length(cleared)+1 then
    raise exception 'Önceki sınır bölgesini tamamla.';end if;
  attack_power:=0;attack_ranks:=0;ward_ranks:=0;
  if jsonb_array_length(p.team)<>3 then raise exception 'Üç kahraman gerekli.';end if;
  for i in 0..2 loop
    hero:=p.team->>i;level_no:=coalesce((p.heroes->>hero)::integer,0);
    if level_no<1 then raise exception 'Takımdaki kahraman kapalı.';end if;
    base_atk:=case hero when 'aldren' then 18 when 'lyra' then 26 when 'rovan' then 23
      when 'mira' then 20 when 'doran' then 28 when 'vesper' then 27 when 'eira' then 24 else 0 end;
    attack_power:=attack_power+round(base_atk*2*(1+.16*(level_no-1)))::integer+45+
      round((level_no-1)*6)::integer;
    for k in select jsonb_object_keys(coalesce(p.loadouts->hero,'{}'::jsonb)) loop
      item_id:=p.loadouts->hero->>k;
      attack_power:=attack_power+(case item_id
        when 'iron_sword' then 8 when 'ward_mail' then 15 when 'lunar_charm' then 12
        when 'ember_blade' then 20 when 'warden_plate' then 33 when 'star_lens' then 18
        when 'royal_blade' then 34 when 'aegis' then 50 when 'moonheart' then 30
        when 'starbreaker' then 56 when 'ashes_plate' then 67 when 'guardian_seal' then 38
        when 'grave_seal' then 18 when 'eclipse_edge' then 30 when 'moon_watch' then 23
        when 'ember_guard' then 25 when 'dawn_relic' then 15 when 'star_spear' then 22
        when 'dawn_guard' then 34 else 0 end)
        +coalesce((p.item_upgrades->>item_id)::integer,0)*9
        +coalesce((p.relic_ascensions->>item_id)::integer,0)*14;
    end loop;
    -- Existing equipment-set combinations also matter in the new endgame.
    for path in select unnest(array['moon','ember','dawn']) loop
      j:=0;
      for k in select jsonb_object_keys(coalesce(p.loadouts->hero,'{}'::jsonb)) loop
        item_id:=p.loadouts->hero->>k;
        if (path='moon' and item_id in ('lunar_charm','moon_watch','star_spear'))
         or (path='ember' and item_id in ('ember_blade','ember_guard','ashes_plate'))
         or (path='dawn' and item_id in ('royal_blade','dawn_relic','dawn_guard','starbreaker','guardian_seal'))
         then j:=j+1;end if;
      end loop;
      if j>=2 then attack_power:=attack_power+18;end if;
    end loop;
    if paths->hero->>'path'='assault' then
      attack_ranks:=attack_ranks+coalesce((paths->hero->>'rank')::integer,0);
    elsif paths->hero->>'path'='warden' then
      ward_ranks:=ward_ranks+coalesce((paths->hero->>'rank')::integer,0);
    end if;
  end loop;
  attack_power:=attack_power+18*attack_ranks;
  needed:=620+stage*180;
  if attack_power<needed*.70 then
    raise exception 'Sınır seferi için takım gücü yetersiz. Kahramanları ve ekipmanı geliştir.';end if;
  hp:=round(170+attack_power*.62+20*ward_ranks)::integer;
  enemy_hp:=round((170+stage*78)*(1.35+stage*.15))::integer;
  battle:=jsonb_build_object('mode','shadow','stage',stage,'wave',1,'waves',3,'turn',0,'waveTurn',0,
    'power',attack_power,'playerHp',hp,'playerMaxHp',hp,
    'enemyHp',enemy_hp,'enemyMaxHp',enemy_hp,'enemyIntent','strike',
    'attackRanks',attack_ranks,'wardRanks',ward_ranks,'lastTurnAt',ms,
    'lastRallyTurn',0,'cooldowns','{}'::jsonb,'lastAction','Başladı');
  w.last_started_at:=t;report:=null;changed:=true;
 elsif p_action='turn' then
  if battle is null then raise exception 'Aktif Gölge Sınırı savaşı yok.';end if;
  move:=p_aux;
  if move is null or (move not in ('strike','guard','feint','rally')
    and move !~ '^skill:(aldren|lyra|rovan|mira|doran|vesper|eira)$') then
    raise exception 'Savaş hamlesi geçersiz.';end if;
  if ms-(battle->>'lastTurnAt')::bigint<3000 then raise exception 'Hamle için 3 saniye bekle.';end if;
  turn_no:=(battle->>'turn')::integer+1;
  stage:=(battle->>'stage')::integer;
  wave_no:=(battle->>'wave')::integer;
  hp:=(battle->>'playerHp')::integer;maxhp:=(battle->>'playerMaxHp')::integer;
  enemy_hp:=(battle->>'enemyHp')::integer;enemy_max:=(battle->>'enemyMaxHp')::integer;
  attack_power:=(battle->>'power')::integer;
  damage:=greatest(12,round(attack_power/4.6)::integer);
  received:=greatest(7,round((21+stage*12)*(1+.10*wave_no))::integer);
  if move='guard' then damage:=round(damage*.65)::integer;received:=round(received*.34)::integer;end if;
  if move='feint' then damage:=round(damage*.74)::integer;end if;
  if move='rally' then
    last_rally:=coalesce((battle->>'lastRallyTurn')::integer,0);
    if last_rally>0 and turn_no-last_rally<4 then raise exception 'Toparlanmak için dört tur bekle.';end if;
    battle:=jsonb_set(battle,'{lastRallyTurn}',to_jsonb(turn_no),true);
    hp:=least(maxhp,hp+round(maxhp*.16)::integer);
    damage:=round(damage*.42)::integer;
  end if;
  if move like 'skill:%' then
    hero:=split_part(move,':',2);
    if not (p.team @> to_jsonb(array[hero])) then raise exception 'Yetenek yalnızca takımdaki kahramana ait.';end if;
    cooldowns:=coalesce(battle->'cooldowns','{}'::jsonb);
    if coalesce((cooldowns->>hero)::integer,0)>turn_no then
      raise exception 'Kahraman yeteneği henüz yenilenmedi.';end if;
    battle:=jsonb_set(battle,array['cooldowns',hero],to_jsonb(turn_no+3),true);
    damage:=round(damage*(case hero when 'lyra' then 1.72 when 'vesper' then 1.8
      when 'doran' then 1.55 else 1.35 end))::integer;
    if hero in ('mira','eira') then hp:=least(maxhp,hp+round(maxhp*.10)::integer);end if;
    if hero='aldren' then received:=round(received*.65)::integer;end if;
  end if;
  if battle->>'enemyIntent'='crush' then
    received:=round(received*(case when move='guard' then .22 else 1.75 end))::integer;
  elsif battle->>'enemyIntent'='shield' then
    if move not like 'skill:%' and move<>'feint' then
      damage:=round(damage*.55)::integer;
    elsif move='feint' then damage:=round(damage*1.38)::integer;end if;
  elsif battle->>'enemyIntent'='drain' then received:=round(received*.85)::integer;end if;
  received:=greatest(1,round(received*(1-.03*least(9,(battle->>'wardRanks')::integer)))::integer);
  if wave_no=3 then
    case stage
      when 1 then
        if battle->>'enemyIntent'='shield' and move<>'feint' and move not like 'skill:%' then
          damage:=round(damage*.72)::integer;end if;
      when 2 then
        if battle->>'enemyIntent'='drain' then received:=round(received*1.18)::integer;end if;
      when 3 then
        if battle->>'enemyIntent'='crush' and move<>'guard' then received:=round(received*1.34)::integer;end if;
      when 4 then
        if enemy_hp<enemy_max*.35 then received:=round(received*1.23)::integer;end if;
      else null;
    end case;
  end if;
  damage:=greatest(1,damage);enemy_hp:=greatest(0,enemy_hp-damage);
  if enemy_hp>0 then
    hp:=greatest(0,hp-received);
    if battle->>'enemyIntent'='drain' then
      enemy_hp:=least(enemy_max,enemy_hp+round(received*(case when stage=2 and wave_no=3 then .78 else .42 end))::integer);
    end if;
  end if;
  if enemy_hp=0 and hp>0 and wave_no<3 then
    wave_no:=wave_no+1;
    enemy_hp:=round((170+stage*78)*(1.35+stage*.15)*(case wave_no when 2 then 1.28 else 1.52 end))::integer;
    enemy_max:=enemy_hp;
    hp:=least(maxhp,hp+round(maxhp*.27)::integer);
    battle:=jsonb_set(battle,'{wave}',to_jsonb(wave_no),true);
    battle:=jsonb_set(battle,'{waveTurn}','0'::jsonb,true);
    next_intent:='strike';
  else
    next_intent:=case when wave_no=3 and stage=1 then
      (case turn_no%3 when 0 then 'shield' when 1 then 'crush' else 'shield' end)
      when wave_no=3 and stage=2 then
      (case turn_no%3 when 0 then 'drain' when 1 then 'drain' else 'strike' end)
      when wave_no=3 and stage=3 then
      (case turn_no%3 when 0 then 'crush' when 1 then 'crush' else 'shield' end)
      when wave_no=3 and stage=4 then
      (case when enemy_hp<enemy_max*.35 then 'drain'
       when enemy_hp<enemy_max*.68 then 'crush' else 'shield' end)
      else (case turn_no%4 when 0 then 'strike' when 1 then 'crush'
       when 2 then 'shield' else 'drain' end) end;
    battle:=jsonb_set(battle,'{waveTurn}',to_jsonb((battle->>'waveTurn')::integer+1),true);
  end if;
  battle:=jsonb_set(battle,'{turn}',to_jsonb(turn_no),true);
  battle:=jsonb_set(battle,'{playerHp}',to_jsonb(hp),true);
  battle:=jsonb_set(battle,'{enemyHp}',to_jsonb(enemy_hp),true);
  battle:=jsonb_set(battle,'{enemyMaxHp}',to_jsonb(enemy_max),true);
  battle:=jsonb_set(battle,'{enemyIntent}',to_jsonb(next_intent),true);
  battle:=jsonb_set(battle,'{lastTurnAt}',to_jsonb(ms),true);
  battle:=jsonb_set(battle,'{lastAction}',to_jsonb(move),true);
  if hp=0 or (enemy_hp=0 and wave_no=3) or turn_no>=36 then
    done:=enemy_hp=0 and hp>0 and wave_no=3;
    if done then
      stars_won:=case when hp>=maxhp*.70 and turn_no<=18 then 3 when hp>=maxhp*.30 then 2 else 1 end;
      reward:=case stage when 1 then '{"gold":420,"wood":200,"stone":210,"aether":60}'::jsonb
        when 2 then '{"gold":560,"wood":250,"stone":275,"aether":82}'::jsonb
        when 3 then '{"gold":700,"wood":320,"stone":310,"aether":100}'::jsonb
        else '{"gold":870,"wood":390,"stone":370,"aether":130}'::jsonb end;
      first_clear:=not (cleared @> to_jsonb(array[stage]));
      if not first_clear then
        -- Fast replay farming stops dominating the economy:
        -- first six weekly wins: 38%; next six: 22%; afterwards: 10%.
        repeat_factor:=case when w.week_wins<6 then .38
          when w.week_wins<12 then .22 else .10 end;
        for k in select jsonb_object_keys(reward) loop
          reward:=jsonb_set(reward,array[k],
            to_jsonb(greatest(1,round((reward->>k)::numeric*repeat_factor)::bigint)));
        end loop;
      end if;
      w.week_wins:=least(100000,w.week_wins+1);
      -- Prestige XP is limited to 100/week, regardless of machine or repeated easy runs.
      -- Stronger bosses and first clears grant more; stars affect prestige too.
      new_gain:=stage*3+stars_won*2+(case when first_clear then 10 else 0 end);
      gained_renown:=least(new_gain,greatest(0,weekly_limit-w.week_renown));
      w.week_renown:=w.week_renown+gained_renown;
      w.mastery_xp:=least(1000000000,w.mastery_xp+gained_renown);
      for i in 1..12 loop
       if w.mastery_xp>=milestones[i] then mastery_rank:=i;else exit;end if;
      end loop;
      for k in select jsonb_object_keys(reward) loop
        resources:=jsonb_set(resources,array[k],
          to_jsonb(least(1000000000,(resources->>k)::bigint+(reward->>k)::bigint)));
      end loop;
      if first_clear then
        cleared:=cleared||to_jsonb(stage);
        item_id:=case stage when 1 then 'grave_seal' when 2 then 'eclipse_edge'
          when 3 then 'guardian_seal' else 'starbreaker' end;
        if coalesce((inventory->>item_id)::integer,0)<20 then
          inventory:=jsonb_set(inventory,array[item_id],
            to_jsonb(coalesce((inventory->>item_id)::integer,0)+1),true);
        else
          -- Never promise undelivered first-clear equipment. Account stays at inventory cap.
          item_id:=null;
          loot_converted:=true;
          resources:=jsonb_set(resources,'{aether}',
            to_jsonb(least(1000000000,(resources->>'aether')::bigint+36)),true);
          reward:=jsonb_set(reward,'{aether}',to_jsonb((reward->>'aether')::bigint+36),true);
        end if;
      end if;
      prev_stars:=coalesce((stars->>stage::text)::integer,0);
      if stars_won>prev_stars then
        stars:=jsonb_set(stars,array[stage::text],to_jsonb(stars_won),true);
      end if;
      counters:=jsonb_set(counters,'{win}',
        to_jsonb(coalesce((counters->>'win')::integer,0)+1),true);
      report:=jsonb_build_object('won',true,'stage',stage,'stars',stars_won,'turns',turn_no,
        'reward',reward,'item',case when first_clear then item_id else null end,
        'renown',gained_renown,'weeklyWins',w.week_wins,'masteryRank',mastery_rank,
        'converted',loot_converted,'at',ms);
    else
      report:=jsonb_build_object('won',false,'stage',stage,'stars',0,'turns',turn_no,
        'reward','{}'::jsonb,'at',ms);
    end if;
    battle:=null;
  end if;
  changed:=true;
 elsif p_action='abandon' then
  if battle is null then raise exception 'Aktif Gölge Sınırı savaşı yok.';end if;
  report:=jsonb_build_object('won',false,'abandoned',true,'at',ms,'reward','{}'::jsonb);
  battle:=null;changed:=true;
 end if;
 if changed then
  update public.starfort_shadow_frontier set hero_paths=paths,cleared=cleared,stars=stars,
    battle=battle,last_report=report,last_started_at=w.last_started_at,
    mastery_xp=w.mastery_xp,mastery_claimed=w.mastery_claimed,
    week_id=w.week_id,week_wins=w.week_wins,week_renown=w.week_renown,
    revision=revision+1,updated_at=t
   where user_id=uid;
  update public.starfort_village_ledger set res=resources,revision=revision+1,updated_at=t
   where user_id=uid;
  update public.starfort_player_progress set inventory=inventory,counters=counters,updated_at=t
   where user_id=uid;
 end if;
 select revision into w.revision from public.starfort_shadow_frontier where user_id=uid;
 result:=jsonb_build_object('ok',true,'source','server-shadow',
  'heroPaths',paths,'cleared',cleared,'stars',stars,'battle',battle,'lastReport',report,
  'masteryXp',w.mastery_xp,'masteryRank',mastery_rank,
  'masteryClaimed',w.mastery_claimed,'weeklyRenown',w.week_renown,
  'weeklyWins',w.week_wins,'weeklyLimit',weekly_limit,'week',w.week_id,
  'revision',w.revision,'serverNow',ms,'applied',p_action,'cost',cost,'reward',reward);
 if p_action<>'get' then
  insert into public.starfort_shadow_requests(user_id,request_id,response)
  values(uid,p_request_id,result);
 end if;
 return result;
end;
$function$;

revoke all on function public.sfb_shadow_api(text,text,text,uuid) from public,anon,authenticated;
grant execute on function public.sfb_shadow_api(text,text,text,uuid) to authenticated;
