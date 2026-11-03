-- STARFORT v2.41: server-owned long-game Shadow Mastery (12 ranks), weekly renown budget,
-- replay economy soft cap and non-daily-streak milestone rewards.
-- Existing players keep their original stage clears, items, resources and hero training.
alter table public.starfort_shadow_frontier
 add column if not exists mastery_xp bigint not null default 0 check (mastery_xp between 0 and 1000000000),
 add column if not exists mastery_claimed integer not null default 0 check (mastery_claimed between 0 and 12),
 add column if not exists week_id text not null default to_char((now() at time zone 'UTC'),'IYYY-IW'),
 add column if not exists week_wins integer not null default 0 check (week_wins between 0 and 100000),
 add column if not exists week_renown integer not null default 0 check (week_renown between 0 and 100);

-- STARFORT v2.39: protect at-cap first-clear loot; convert to 36 aether and report actual delivery.\n-- v2.38 gear parity: distinct real equipment power and 2-piece set synergy, superseding initial shadow function.
-- STARFORT v2.38: new post-Act-II Shadow Frontier + permanent hero disciplines.
-- Authenticated RPC only; no client-supplied power, enemy HP, cost, stars or loot.
create table if not exists public.starfort_shadow_frontier (
 user_id uuid primary key references auth.users(id) on delete cascade,
 hero_paths jsonb not null default '{}'::jsonb,
 cleared jsonb not null default '[]'::jsonb,
 stars jsonb not null default '{}'::jsonb,
 battle jsonb,
 last_report jsonb,
 last_started_at timestamptz,
 revision bigint not null default 1,
 updated_at timestamptz not null default now()
);
create table if not exists public.starfort_shadow_requests (
 user_id uuid not null references auth.users(id) on delete cascade,
 request_id uuid not null,
 response jsonb not null,
 created_at timestamptz not null default now(),
 primary key(user_id,request_id)
);
alter table public.starfort_shadow_frontier enable row level security;
alter table public.starfort_shadow_requests enable row level security;
revoke all on public.starfort_shadow_frontier from public,anon,authenticated;
revoke all on public.starfort_shadow_requests from public,anon,authenticated;

create or replace function public.sfb_shadow_api(
 p_action text,p_target text default null,p_aux text default null,p_request_id uuid default null
) returns jsonb language plpgsql security definer set search_path=''
as $fn$
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
        +coalesce((p.item_upgrades->>item_id)::integer,0)*9;
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
$fn$;
revoke all on function public.sfb_shadow_api(text,text,text,uuid) from public,anon,authenticated;
grant execute on function public.sfb_shadow_api(text,text,text,uuid) to authenticated;

-- A server story cannot start while a separate Shadow Frontier battle is running.
create or replace function public.sfb_shadow_block_overlap()
returns trigger language plpgsql security definer set search_path=''
as $fn$
begin
 if new.mission is not null and old.mission is null and exists(
  select 1 from public.starfort_shadow_frontier
  where user_id=new.user_id and battle is not null
 ) then raise exception 'Önce devam eden Gölge Sınırı savaşını bitir.';end if;
 return new;
end;
$fn$;
drop trigger if exists sfb_shadow_guard_story on public.starfort_player_progress;
create trigger sfb_shadow_guard_story
 before update of mission on public.starfort_player_progress
 for each row execute function public.sfb_shadow_block_overlap();
revoke all on function public.sfb_shadow_block_overlap() from public,anon,authenticated;
