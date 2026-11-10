-- STARFORT v88 — Original equipment materials: secured account wallet.
-- STAGED MIGRATION: do not execute on production until review/QA.
-- Designed against live sfb_starfort_progress v255, WITHOUT replacing it.
-- All gains originate in its verified mission win UPDATE. Clients cannot
-- fabricate victories, item counts, stage names, stars or weekly boss wins.
-- A failed transaction rolls back both battle outcome and its material loot.
-- Repeated HTTP request UUID returns cached result without a new update.
--
-- Materials: 3 class-specific fragments + glass + core + stamp + chart.
-- Never retroactively charge these for existing +1..+5 or +1..+4 tiers.

create table if not exists public.starfort_crafting_material_wallet (
 user_id uuid primary key references auth.users(id) on delete cascade,
 focus_slot text not null default 'weapon'
  check(focus_slot in ('weapon','armor','relic')),
 edge_sliver integer not null default 0 check(edge_sliver between 0 and 100000),
 ward_rivet integer not null default 0 check(ward_rivet between 0 and 100000),
 astral_fiber integer not null default 0 check(astral_fiber between 0 and 100000),
 star_glass integer not null default 0 check(star_glass between 0 and 100000),
 stellar_core integer not null default 0 check(stellar_core between 0 and 100000),
 guardian_stamp integer not null default 0 check(guardian_stamp between 0 and 100000),
 constellation_chart integer not null default 0 check(constellation_chart between 0 and 100000),
 updated_at timestamptz not null default now()
);

create table if not exists public.starfort_crafting_material_awards (
 user_id uuid not null references auth.users(id) on delete cascade,
 claim_key text not null check(length(claim_key) between 5 and 96),
 source_type text not null check(source_type in
  ('daily_story','daily_star_glass','weekly_rift','weekly_boss','weekly_solo')),
 bucket text not null check(length(bucket) between 7 and 10),
 item_id text not null check(item_id in
  ('edge_sliver','ward_rivet','astral_fiber','star_glass',
   'stellar_core','guardian_stamp','constellation_chart')),
 amount integer not null check(amount between 1 and 3),
 awarded_at timestamptz not null default now(),
 primary key(user_id,claim_key)
);

create index if not exists starfort_material_awards_quota_idx
 on public.starfort_crafting_material_awards(user_id,source_type,bucket);

create table if not exists public.starfort_crafting_focus_requests (
 user_id uuid not null references auth.users(id) on delete cascade,
 request_id uuid not null,
 response jsonb not null check(jsonb_typeof(response)='object'),
 created_at timestamptz not null default now(),
 primary key(user_id,request_id)
);

alter table public.starfort_crafting_material_wallet enable row level security;
alter table public.starfort_crafting_material_awards enable row level security;
alter table public.starfort_crafting_focus_requests enable row level security;

-- NO authenticated/anon table access, including direct PostgREST updates.
-- The checked v255 starfort_player_progress table also denies authenticated
-- UPDATE; only the existing SECURITY DEFINER mission engine can write it.
revoke all on public.starfort_crafting_material_wallet from public,anon,authenticated;
revoke all on public.starfort_crafting_material_awards from public,anon,authenticated;
revoke all on public.starfort_crafting_focus_requests from public,anon,authenticated;

create or replace function public.sfb_crafting_materials_after_win()
returns trigger
language plpgsql security definer set search_path to ''
as $body$
declare
 v_mode text;
 v_report_at text;
 v_day text;
 v_week text;
 v_stage int;
 v_stars int;
 v_tier int;
 v_utc timestamp;
 v_focus text;
 v_item text;
 v_key text;
begin
 -- A battle must actually have existed and ended in the SAME trusted update.
 -- Ordinary profile GET/focus/forge mutations do not award materials.
 if old.mission is null or new.mission is not null
    or new.last_report is not distinct from old.last_report
    or jsonb_typeof(new.last_report)<>'object'
    or new.last_report->>'won'<>'true' then
  return new;
 end if;
 v_mode:=new.last_report->>'mode';
 if v_mode is null or v_mode<>old.mission->>'mode'
    or v_mode not in ('story','boss','rift','veteran') then
  return new;
 end if;
 v_report_at:=new.last_report->>'at';
 if v_report_at is null or v_report_at !~ '^[0-9]{12,16}$' then
  return new;
 end if;
 v_utc:=to_timestamp(v_report_at::double precision/1000.0) at time zone 'UTC';
 v_day:=to_char(v_utc,'YYYY-MM-DD');
 v_week:=to_char(v_utc,'IYYY-IW');
 v_stage:=coalesce((new.last_report->>'stage')::int,0);
 v_stars:=coalesce((new.last_report->>'stars')::int,0);
 v_tier:=coalesce((old.mission->>'tier')::int,0);
 if v_stage<>coalesce((old.mission->>'stage')::int,0)
    or v_stars<1 or v_stars>3 then return new; end if;

 insert into public.starfort_crafting_material_wallet(user_id)
 values(new.user_id) on conflict(user_id) do nothing;
 -- Serializes ALL daily/weekly quota decisions and focus selection per user.
 select focus_slot into strict v_focus
 from public.starfort_crafting_material_wallet
 where user_id=new.user_id for update;

 if v_mode='story' then
  -- Exactly first THREE authenticated story wins per UTC day.
  if (select count(*) from public.starfort_crafting_material_awards
      where user_id=new.user_id and source_type='daily_story'
      and bucket=v_day)<3 then
   v_key:='story:'||v_report_at;
   v_item:=case v_focus when 'armor' then 'ward_rivet'
    when 'relic' then 'astral_fiber' else 'edge_sliver' end;
   insert into public.starfort_crafting_material_awards
    (user_id,claim_key,source_type,bucket,item_id,amount)
   values(new.user_id,v_key,'daily_story',v_day,v_item,3)
   on conflict do nothing;
   if found then
    update public.starfort_crafting_material_wallet set
     edge_sliver=least(100000,edge_sliver+
      case when v_item='edge_sliver' then 3 else 0 end),
     ward_rivet=least(100000,ward_rivet+
      case when v_item='ward_rivet' then 3 else 0 end),
     astral_fiber=least(100000,astral_fiber+
      case when v_item='astral_fiber' then 3 else 0 end),
     updated_at=clock_timestamp()
    where user_id=new.user_id;
   end if;
  end if;
  -- One extra Yıldız Camı daily, only chapters 5-8 finished with 3 stars.
  if v_stage between 5 and 8 and v_stars=3 then
   insert into public.starfort_crafting_material_awards
    (user_id,claim_key,source_type,bucket,item_id,amount)
   values(new.user_id,'glass:'||v_day,
    'daily_star_glass',v_day,'star_glass',1)
   on conflict do nothing;
   if found then
    update public.starfort_crafting_material_wallet set
     star_glass=least(100000,star_glass+1),updated_at=clock_timestamp()
    where user_id=new.user_id;
   end if;
  end if;
 elsif v_mode='boss' and exists (
  select 1 from public.starfort_world_boss_contribution
  where user_id=new.user_id and week=v_week and damage>=300) then
  -- Existing server only allows one real world-boss victory per UTC week.
  insert into public.starfort_crafting_material_awards
   (user_id,claim_key,source_type,bucket,item_id,amount)
  values(new.user_id,'boss:'||v_week,
   'weekly_boss',v_week,'guardian_stamp',1)
  on conflict do nothing;
  if found then
   update public.starfort_crafting_material_wallet set
    guardian_stamp=least(100000,guardian_stamp+1),
    updated_at=clock_timestamp() where user_id=new.user_id;
  end if;
 elsif v_mode='rift' then
  -- Existing WEEKLY RIFT can repeat after prior 16-floor maze is finished.
  -- Do not pretend the planned repeatable labyrinth contract is live.
  insert into public.starfort_crafting_material_awards
   (user_id,claim_key,source_type,bucket,item_id,amount)
  values(new.user_id,'rift:'||v_week,
   'weekly_rift',v_week,'stellar_core',1)
  on conflict do nothing;
  if found then
   update public.starfort_crafting_material_wallet set
    stellar_core=least(100000,stellar_core+1),
    updated_at=clock_timestamp() where user_id=new.user_id;
  end if;
 elsif v_mode='veteran' and v_stage>=5 and v_tier>=2 and v_stars=3 then
  -- Solo path guarantees a weekly chart without forcing alliance joining.
  insert into public.starfort_crafting_material_awards
   (user_id,claim_key,source_type,bucket,item_id,amount)
  values(new.user_id,'solo:'||v_week,
   'weekly_solo',v_week,'constellation_chart',1)
  on conflict do nothing;
  if found then
   update public.starfort_crafting_material_wallet set
    constellation_chart=least(100000,constellation_chart+1),
    updated_at=clock_timestamp() where user_id=new.user_id;
  end if;
 end if;
 return new;
end;
$body$;

-- Only the existing REAL server battle completes a mission, then awards.
drop trigger if exists sfb_crafting_materials_real_mission on public.starfort_player_progress;
create trigger sfb_crafting_materials_real_mission
 after update of last_report on public.starfort_player_progress
 for each row execute function public.sfb_crafting_materials_after_win();
revoke all on function public.sfb_crafting_materials_after_win() from public,anon,authenticated;

create or replace function public.sfb_crafting_materials(
 p_action text default 'get', p_focus text default null,
 p_request_id uuid default null)
returns jsonb
language plpgsql security definer set search_path to ''
as $body$
declare
 v_user uuid:=auth.uid();
 v_wallet public.starfort_crafting_material_wallet%rowtype;
 v_prior jsonb;
 v_reply jsonb;
begin
 if v_user is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then
  raise exception 'Malzeme çantası için doğrulanmış hesap gerekir.';
 end if;
 if p_action is null or p_action not in ('get','focus') then
  raise exception 'Geçersiz malzeme işlemi.';
 end if;
 -- Do not provision fictitious player accounts or manipulate any other users.
 if not exists(select 1 from public.starfort_player_progress
                where user_id=v_user) then
  raise exception 'Önce STARFORT oyun hesabını oluştur.';
 end if;
 if p_action='focus' then
  if p_request_id is null or p_focus is null or
     p_focus not in ('weapon','armor','relic') then
   raise exception 'Geçerli seçim ve işlem kimliği zorunludur.';
  end if;
  insert into public.starfort_crafting_material_wallet(user_id)
  values(v_user) on conflict do nothing;
  select * into strict v_wallet from public.starfort_crafting_material_wallet
    where user_id=v_user for update;
  select response into v_prior from public.starfort_crafting_focus_requests
    where user_id=v_user and request_id=p_request_id;
  if found then return v_prior; end if;
  update public.starfort_crafting_material_wallet
   set focus_slot=p_focus,updated_at=clock_timestamp()
   where user_id=v_user returning * into strict v_wallet;
 else
  if p_focus is not null or p_request_id is not null then
   raise exception 'Salt okuma parametre kabul etmez.';
  end if;
  select * into v_wallet from public.starfort_crafting_material_wallet
   where user_id=v_user;
 end if;

 v_reply:=jsonb_build_object('ok',true,'source','server','focus',
  coalesce(v_wallet.focus_slot,'weapon'),
  'materials',jsonb_build_object(
   'edge_sliver',coalesce(v_wallet.edge_sliver,0),
   'ward_rivet',coalesce(v_wallet.ward_rivet,0),
   'astral_fiber',coalesce(v_wallet.astral_fiber,0),
   'star_glass',coalesce(v_wallet.star_glass,0),
   'stellar_core',coalesce(v_wallet.stellar_core,0),
   'guardian_stamp',coalesce(v_wallet.guardian_stamp,0),
   'constellation_chart',coalesce(v_wallet.constellation_chart,0)));
 if p_action='focus' then
  insert into public.starfort_crafting_focus_requests
   (user_id,request_id,response)
  values(v_user,p_request_id,v_reply);
 end if;
 return v_reply;
end;
$body$;

revoke all on function public.sfb_crafting_materials(text,text,uuid)
 from public,anon,authenticated;
grant execute on function public.sfb_crafting_materials(text,text,uuid)
 to authenticated;
