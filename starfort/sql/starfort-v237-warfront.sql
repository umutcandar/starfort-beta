-- STARFORT v2.37 — Warfront, reliable equipment chests, repeatable daily/weekly bounties.
-- All currency, milestones, tactics and rewards are computed on the server.
create table if not exists public.starfort_warfront (
 user_id uuid primary key references auth.users(id) on delete cascade,
 pending_doctrine text check(pending_doctrine in ('assault','bulwark','recon')),
 day date not null default (now() at time zone 'UTC')::date,
 day_base integer not null default 0 check(day_base>=0),
 day_claimed boolean not null default false,
 week text not null default to_char(now() at time zone 'UTC','IYYY-IW'),
 week_base integer not null default 0 check(week_base>=0),
 week_claimed boolean not null default false,
 chests_claimed integer not null default 0 check(chests_claimed between 0 and 100000),
 last_loot jsonb,
 revision bigint not null default 1,
 updated_at timestamptz not null default now()
);
create table if not exists public.starfort_warfront_requests (
 user_id uuid not null references auth.users(id) on delete cascade,
 request_id uuid not null,
 response jsonb not null,
 created_at timestamptz not null default now(),
 primary key(user_id,request_id)
);
alter table public.starfort_warfront enable row level security;
alter table public.starfort_warfront_requests enable row level security;
revoke all on public.starfort_warfront from public,anon,authenticated;
revoke all on public.starfort_warfront_requests from public,anon,authenticated;
create or replace function public.sfb_warfront_api(
 p_action text,p_target text default null,p_request_id uuid default null
) returns jsonb language plpgsql security definer set search_path=''
as $fn$
declare
 uid uuid:=auth.uid();
 now_at timestamptz:=clock_timestamp();
 today date:=(now_at at time zone 'UTC')::date;
 iso_week text:=to_char(now_at at time zone 'UTC','IYYY-IW');
 vl public.starfort_village_ledger%rowtype;
 pg public.starfort_player_progress%rowtype;
 fw public.starfort_warfront%rowtype;
 wins integer;
 v_resources jsonb;
 inv jsonb;
 pending_cost jsonb;
 item_id text;
 rarity text;
 target_wins integer;
 next_chest integer;
 day_progress integer;
 week_progress integer;
 prize jsonb:='{}'::jsonb;
 loot jsonb;
 was_modified boolean:=false;
 previous jsonb;
 result jsonb;
 k text;
 amount bigint;
 begin_at bigint;
begin
 if uid is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then
  raise exception 'Doğrulanmış oyun hesabı gerekli.';
 end if;
 if p_action is null or p_action not in ('get','prepare','cancel','claim_daily','claim_weekly','claim_chest') then
  raise exception 'Geçersiz cephe işlemi.';
 end if;
 if p_action<>'get' and p_request_id is null then raise exception 'İşlem kimliği gerekli.'; end if;
 -- Stable lock order shared with sfb_starfort_progress: village, progress, warfront.
 insert into public.starfort_village_ledger(user_id) values(uid) on conflict do nothing;
 insert into public.starfort_player_progress(user_id) values(uid) on conflict do nothing;
 select * into strict vl from public.starfort_village_ledger where user_id=uid for update;
 select * into strict pg from public.starfort_player_progress where user_id=uid for update;
 wins:=coalesce((pg.counters->>'win')::integer,0);
 insert into public.starfort_warfront(user_id,day,day_base,week,week_base)
 values(uid,today,wins,iso_week,wins) on conflict do nothing;
 select * into strict fw from public.starfort_warfront where user_id=uid for update;
 if p_action<>'get' then
  select response into previous from public.starfort_warfront_requests
   where user_id=uid and request_id=p_request_id;
  if found then return previous; end if;
 end if;
 v_resources:=vl.res; inv:=pg.inventory;
 if fw.day<>today then
  fw.day:=today;fw.day_base:=wins;fw.day_claimed:=false;was_modified:=true;
 end if;
 if fw.week<>iso_week then
  fw.week:=iso_week;fw.week_base:=wins;fw.week_claimed:=false;was_modified:=true;
 end if;
 day_progress:=greatest(0,wins-fw.day_base);
 week_progress:=greatest(0,wins-fw.week_base);
 if p_action='prepare' then
  if pg.mission is not null then raise exception 'Aktif sefer sırasında yeni ikmal kurulamaz.'; end if;
  if fw.pending_doctrine is not null then raise exception 'Önceki ikmalin hazır. İstersen iptal et.'; end if;
  if p_target is null or p_target not in ('assault','bulwark','recon') then
   raise exception 'Bilinmeyen savaş doktrini.'; end if;
  pending_cost:=case p_target when 'assault' then '{"gold":70,"wood":50}'::jsonb
    when 'bulwark' then '{"wood":30,"stone":65}'::jsonb
    else '{"gold":90,"aether":12}'::jsonb end;
  for k in select jsonb_object_keys(pending_cost) loop
   if (v_resources->>k)::bigint<(pending_cost->>k)::bigint then raise exception 'İkmal için yeterli sunucu kaynağı yok.'; end if;
  end loop;
  for k in select jsonb_object_keys(pending_cost) loop
   v_resources:=jsonb_set(v_resources,array[k],to_jsonb((v_resources->>k)::bigint-(pending_cost->>k)::bigint));
  end loop;
  fw.pending_doctrine:=p_target;was_modified:=true;
 elsif p_action='cancel' then
  if pg.mission is not null then raise exception 'Sefer başladıktan sonra ikmal iptal edilemez.'; end if;
  if fw.pending_doctrine is null then raise exception 'İptal edilecek ikmal bulunamadı.'; end if;
  pending_cost:=case fw.pending_doctrine when 'assault' then '{"gold":70,"wood":50}'::jsonb
    when 'bulwark' then '{"wood":30,"stone":65}'::jsonb
    else '{"gold":90,"aether":12}'::jsonb end;
  for k in select jsonb_object_keys(pending_cost) loop
   if (v_resources->>k)::bigint+(pending_cost->>k)::bigint>1000000000 then
    raise exception 'Depo dolu. İkmal iadesi için yer aç.'; end if;
  end loop;
  for k in select jsonb_object_keys(pending_cost) loop
   v_resources:=jsonb_set(v_resources,array[k],to_jsonb((v_resources->>k)::bigint+(pending_cost->>k)::bigint));
  end loop;
  fw.pending_doctrine:=null;was_modified:=true;
 elsif p_action='claim_daily' then
  if fw.day_claimed then raise exception 'Günlük cephe ödülü alındı.'; end if;
  if day_progress<2 then raise exception 'Günlük hedef: iki doğrulanmış hikâye zaferi.'; end if;
  prize:='{"gold":160,"wood":75,"stone":65,"aether":14}'::jsonb;
  fw.day_claimed:=true;was_modified:=true;
 elsif p_action='claim_weekly' then
  if fw.week_claimed then raise exception 'Haftalık cephe ödülü alındı.'; end if;
  if week_progress<8 then raise exception 'Haftalık hedef: sekiz doğrulanmış hikâye zaferi.'; end if;
  prize:='{"gold":580,"wood":250,"stone":210,"aether":50}'::jsonb;
  fw.week_claimed:=true;was_modified:=true;
 elsif p_action='claim_chest' then
  next_chest:=fw.chests_claimed+1;
  target_wins:=case next_chest when 1 then 3 when 2 then 8 when 3 then 15 when 4 then 24 else 24+(next_chest-4)*12 end;
  if wins<target_wins then raise exception 'Savaş sandığı için % doğrulanmış zafer gerekli.',target_wins; end if;
  item_id:=case next_chest when 1 then 'ward_mail' when 2 then 'ember_blade'
     when 3 then 'star_lens' when 4 then 'moonheart'
     else (case (next_chest-5)%4 when 0 then 'ember_guard' when 1 then 'star_spear'
       when 2 then 'guardian_seal' else 'starbreaker' end) end;
  rarity:=case when next_chest=1 then 'uncommon' when next_chest=2 then 'rare'
    when next_chest=3 then 'epic' when next_chest=4 then 'legendary'
    else (case (next_chest-5)%4 when 3 then 'legendary' when 2 then 'epic' else 'rare' end) end;
  if coalesce((inv->>item_id)::integer,0)>=20 then
   prize:='{"aether":36}'::jsonb;
   loot:=jsonb_build_object('chest',next_chest,'item',null,'rarity',rarity,'converted',true,'aether',36);
  else
   inv:=jsonb_set(inv,array[item_id],to_jsonb(coalesce((inv->>item_id)::integer,0)+1),true);
   loot:=jsonb_build_object('chest',next_chest,'item',item_id,'rarity',rarity,'converted',false);
  end if;
  fw.chests_claimed:=next_chest;
  fw.last_loot:=loot;was_modified:=true;
 end if;
 if prize<>'{}'::jsonb then
  for k in select jsonb_object_keys(prize) loop
   amount:=(v_resources->>k)::bigint+(prize->>k)::bigint;
   v_resources:=jsonb_set(v_resources,array[k],to_jsonb(least(1000000000,amount)));
  end loop;
 end if;
 if was_modified then
  fw.revision:=fw.revision+1;
  update public.starfort_warfront set pending_doctrine=fw.pending_doctrine,
   day=fw.day,day_base=fw.day_base,day_claimed=fw.day_claimed,
   week=fw.week,week_base=fw.week_base,week_claimed=fw.week_claimed,
   chests_claimed=fw.chests_claimed,last_loot=fw.last_loot,revision=fw.revision,updated_at=now_at
   where user_id=uid;
 end if;
 if p_action<>'get' then
  update public.starfort_village_ledger
   set res=v_resources,revision=revision+1,updated_at=now_at where user_id=uid;
  update public.starfort_player_progress set inventory=inv,updated_at=now_at where user_id=uid;
 end if;
 -- Do not use unqualified column names as variable names in SQL.
 result:=jsonb_build_object('ok',true,'source','server-warfront',
  'pending',fw.pending_doctrine,'revision',fw.revision,'day',to_char(fw.day,'YYYY-MM-DD'),
  'week',fw.week,'dailyWins',day_progress,'weeklyWins',week_progress,
  'dailyClaimed',fw.day_claimed,'weeklyClaimed',fw.week_claimed,
  'chestsClaimed',fw.chests_claimed,
  'nextChestWins',case when fw.chests_claimed<4 then (array[3,8,15,24])[fw.chests_claimed+1]
     else 24+(fw.chests_claimed-3)*12 end,
  'wins',wins,'lastLoot',fw.last_loot,'applied',p_action,'reward',prize,
  'serverNow',floor(extract(epoch from now_at)*1000)::bigint);
 if p_action<>'get' then
  insert into public.starfort_warfront_requests(user_id,request_id,response)
   values(uid,p_request_id,result);
 end if;
 return result;
end;
$fn$;
revoke all on function public.sfb_warfront_api(text,text,uuid) from public,anon,authenticated;
grant execute on function public.sfb_warfront_api(text,text,uuid) to authenticated;
