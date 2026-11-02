-- v2.27: one authoritative 28-day reward track per account.
-- Missed days preserve the position; only the consecutive claim streak resets.
create table if not exists public.starfort_reward_calendar (
 user_id uuid primary key references auth.users(id) on delete cascade,
 claim_count bigint not null default 0 check (claim_count>=0),
 streak integer not null default 0 check (streak>=0),
 last_claim_day date,
 updated_at timestamptz not null default now()
);
alter table public.starfort_reward_calendar enable row level security;
revoke all on public.starfort_reward_calendar from public,anon,authenticated;

create or replace function public.sfb_daily_calendar(
 p_action text,
 p_request_id uuid default null
) returns jsonb
language plpgsql security definer set search_path=''
as $fn$
#variable_conflict use_variable
declare
 u uuid:=auth.uid();
 moment timestamptz:=clock_timestamp();
 today date:=(clock_timestamp() at time zone 'UTC')::date;
 ledger public.starfort_village_ledger%rowtype;
 cal public.starfort_reward_calendar%rowtype;
 history jsonb;
 result jsonb;
 purse jsonb;
 prize jsonb:='{}'::jsonb;
 item_code text:=null;
 item_awarded text:=null;
 held_inventory jsonb;
 held_quantity integer;
 next_level integer;
 day_no integer;
 show_day integer;
 cycle_no bigint;
 bonus_gold integer:=0;
 bonus_wood integer:=0;
 bonus_stone integer:=0;
 bonus_aether integer:=0;
 key_name text;
 amount bigint;
 available_now boolean;
 previous_day date;
begin
 if u is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then
   raise exception 'Günlük ödül için e-posta hesabına giriş yap.';
 end if;
 if p_action not in ('get','claim') or p_action is null then raise exception 'Geçersiz ödül takvimi işlemi.';end if;
 if p_action='claim' and p_request_id is null then raise exception 'Ödül işlemi kimliği gereklidir.';end if;
 insert into public.starfort_village_ledger(user_id) values(u) on conflict do nothing;
 select * into strict ledger from public.starfort_village_ledger where user_id=u for update;
 insert into public.starfort_reward_calendar(user_id,claim_count,streak,last_claim_day)
 values(u,case when ledger.last_daily is null then 0 else 1 end,
  case when ledger.last_daily is null then 0 else 1 end,ledger.last_daily)
 on conflict do nothing;
 select * into strict cal from public.starfort_reward_calendar where user_id=u for update;
 if p_action='claim' then
  select response into history from public.starfort_village_requests
    where user_id=u and request_id=p_request_id;
  if found then return history;end if;
 end if;
 available_now:=cal.last_claim_day is null or cal.last_claim_day<today;
 if p_action='claim' then
  if not available_now then raise exception 'Bugünkü ödülü zaten aldın. Yeni sandık yarın UTC 00.00’da açılır.';end if;
  day_no:=(cal.claim_count%28+1)::integer;
  if day_no=7 then
   bonus_gold:=200;bonus_wood:=90;bonus_stone:=90;bonus_aether:=20;item_code:='lunar_charm';
  elsif day_no=14 then
   bonus_gold:=400;bonus_wood:=180;bonus_stone:=160;bonus_aether:=35;item_code:='ember_blade';
  elsif day_no=21 then
   bonus_gold:=700;bonus_wood:=260;bonus_stone:=240;bonus_aether:=60;item_code:='star_lens';
  elsif day_no=28 then
   bonus_gold:=1200;bonus_wood:=450;bonus_stone:=380;bonus_aether:=100;item_code:='royal_blade';
  end if;
  prize:=jsonb_build_object('gold',90+day_no*12+bonus_gold,
    'wood',45+day_no*6+bonus_wood,'stone',35+day_no*5+bonus_stone,
    'aether',5+((day_no-1)/4)*3+bonus_aether);
  purse:=ledger.res;
  for key_name in select unnest(array['gold','wood','stone','aether']) loop
   amount:=least(1000000000,(purse->>key_name)::bigint+(prize->>key_name)::bigint);
   prize:=jsonb_set(prize,array[key_name],to_jsonb(amount-(purse->>key_name)::bigint));
   purse:=jsonb_set(purse,array[key_name],to_jsonb(amount));
  end loop;
  if item_code is not null then
   insert into public.starfort_player_progress(user_id) values(u) on conflict do nothing;
   select inventory into held_inventory from public.starfort_player_progress where user_id=u for update;
   held_quantity:=coalesce((held_inventory->>item_code)::integer,0);
   if held_quantity<20 then
    item_awarded:=item_code;
    update public.starfort_player_progress
     set inventory=jsonb_set(held_inventory,array[item_code],to_jsonb(held_quantity+1),true),updated_at=moment
     where user_id=u;
   else
    amount:=least(1000000000,(purse->>'aether')::bigint+250);
    prize:=jsonb_set(prize,'{aether}',to_jsonb((prize->>'aether')::bigint+amount-(purse->>'aether')::bigint));
    purse:=jsonb_set(purse,'{aether}',to_jsonb(amount));
   end if;
  end if;
  previous_day:=cal.last_claim_day;
  cal.claim_count:=cal.claim_count+1;
  cal.streak:=case when previous_day=today-1 then least(100000,cal.streak+1) else 1 end;
  cal.last_claim_day:=today;
  update public.starfort_reward_calendar set claim_count=cal.claim_count,
    streak=cal.streak,last_claim_day=cal.last_claim_day,updated_at=moment where user_id=u;
  update public.starfort_village_ledger set res=purse,last_daily=today,
    mastery=least(24,mastery+1),revision=revision+1,updated_at=moment where user_id=u;
  ledger.revision:=ledger.revision+1;
  available_now:=false;
 end if;
 next_level:=(cal.claim_count%28+1)::integer;
 show_day:=case when available_now then next_level else ((cal.claim_count-1+28)%28+1)::integer end;
 cycle_no:=greatest(1,(cal.claim_count-case when available_now then 0 else 1 end)/28+1);
 result:=jsonb_build_object('ok',true,'source','server-calendar',
  'claimCount',cal.claim_count,'streak',cal.streak,
  'lastClaimDay',case when cal.last_claim_day is null then null else to_char(cal.last_claim_day,'YYYY-MM-DD') end,
  'serverNow',floor(extract(epoch from moment)*1000)::bigint,
  'available',available_now,'nextDay',next_level,'displayDay',show_day,'cycle',cycle_no,
  'granted',case when p_action='claim' then jsonb_build_object('day',day_no,'resources',prize,'item',item_awarded) else null end);
 if p_action='claim' then
  insert into public.starfort_village_requests(user_id,request_id,response) values(u,p_request_id,result);
 end if;
 return result;
end;
$fn$;
revoke all on function public.sfb_daily_calendar(text,uuid) from public,anon,authenticated;
grant execute on function public.sfb_daily_calendar(text,uuid) to authenticated;

-- The legacy daily path must not award another chest in parallel.
create or replace function public.sfb_village_api(
  p_action text,
  p_building text default null,
  p_request_id uuid default null,
  p_room_id text default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_user uuid := auth.uid();
  v_row public.starfort_village_ledger%rowtype;
  v_now timestamptz := clock_timestamp();
  v_ms bigint;
  v_elapsed numeric;
  v_eff numeric;
  v_bonus numeric;
  v_gain jsonb := '{}'::jsonb;
  v_res jsonb;
  v_blds jsonb;
  v_con jsonb;
  v_level integer;
  v_keep integer;
  v_duration integer;
  v_factor numeric;
  v_gold bigint := 0;
  v_wood bigint := 0;
  v_stone bigint := 0;
  v_aether bigint := 0;
  v_base_gold integer;
  v_base_wood integer;
  v_base_stone integer;
  v_required integer := 0;
  v_cost jsonb := '{}'::jsonb;
  v_reward jsonb := '{}'::jsonb;
  v_claimed text;
  v_response jsonb;
  v_previous jsonb;
  v_resource text;
  v_credit bigint;
  v_source bigint;
  v_cost_amount bigint;
  v_started bigint;
  v_ends bigint;
  v_minutes integer[];
begin
  if v_user is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then
    raise exception 'E-posta hesabıyla giriş yapman gerekiyor.';
  end if;
  if p_action not in ('get','collect','upgrade','finish','daily','match') or p_action is null then
    raise exception 'Bilinmeyen ekonomi işlemi.';
  end if;
  if p_action<>'get' and p_request_id is null then
    raise exception 'İşlem kimliği gerekli.';
  end if;
  insert into public.starfort_village_ledger(user_id) values(v_user) on conflict do nothing;
  select * into strict v_row from public.starfort_village_ledger where user_id=v_user for update;
  if p_action<>'get' then
    select response into v_previous from public.starfort_village_requests
      where user_id=v_user and request_id=p_request_id;
    if found then return v_previous; end if;
  end if;
  v_res := v_row.res;
  v_blds := v_row.buildings;
  v_con := v_row.construction;
  v_ms := floor(extract(epoch from v_now)*1000)::bigint;
  v_keep := (v_blds->>'keep')::integer;
  v_minutes := array[0,0,3,10,25,50,90,180,300,480,720,960,1200,1500,1860,2220,2580,2880,3240,3600];
  if p_action in ('collect','upgrade') then
    -- First four hours: full speed; rest up to 24h: 12% speed.
    v_elapsed := least(1440::numeric,greatest(0::numeric,extract(epoch from v_now-v_row.last_collected)/60));
    v_eff := least(240::numeric,v_elapsed)+greatest(0::numeric,v_elapsed-240)*0.12;
    v_bonus := 1+(v_keep-1)*0.05;
    v_gain := jsonb_build_object(
      'gold',floor(4*(v_blds->>'farm')::integer*v_bonus*v_eff)::bigint,
      'wood',floor(3*(v_blds->>'lumber')::integer*v_bonus*v_eff)::bigint,
      'stone',floor(2.5*(v_blds->>'quarry')::integer*v_bonus*v_eff)::bigint,
      'aether',floor(0.6*(v_blds->>'observatory')::integer*v_bonus*v_eff)::bigint
    );
    for v_resource in select unnest(array['gold','wood','stone','aether']) loop
      v_source:=(v_res->>v_resource)::bigint;
      v_credit:=least((v_gain->>v_resource)::bigint,1000000000-v_source);
      v_res:=jsonb_set(v_res,array[v_resource],to_jsonb(v_source+v_credit),true);
      v_gain:=jsonb_set(v_gain,array[v_resource],to_jsonb(v_credit),true);
    end loop;
  end if;
  if p_action='upgrade' then
    if p_building is null or p_building not in ('keep','farm','lumber','quarry','forge','tavern','observatory') then
      raise exception 'Bilinmeyen bina.';
    end if;
    if v_con is not null then raise exception 'Tek inşaat ustası başka binada çalışıyor.'; end if;
    v_level:=(v_blds->>p_building)::integer;
    if v_level>=20 then raise exception 'Bina maksimum seviyede.'; end if;
    if p_building<>'keep' and v_level>=v_keep+1 then
      raise exception 'Önce Yıldız Kalesi seviyesini yükselt.';
    end if;
    v_required:=case when v_level>=18 then 24 when v_level>=14 then 18 when v_level>=10 then 12 when v_level>=7 then 6 when v_level>=4 then 3 else 0 end;
    if v_row.mastery<v_required then
      raise exception 'Sunucu ustalığı yetersiz: gerekli %, mevcut %.',v_required,v_row.mastery;
    end if;
    v_factor:=case when v_level<=8 then power(1.65::numeric,v_level-1)
                   else power(1.65::numeric,7)*power(1.42::numeric,v_level-8) end;
    v_base_gold:=case p_building when 'keep' then 100 when 'farm' then 55 when 'lumber' then 50
      when 'quarry' then 60 when 'forge' then 85 when 'tavern' then 80 when 'observatory' then 90 end;
    v_base_wood:=case p_building when 'keep' then 80 when 'farm' then 40 when 'quarry' then 35
      when 'forge' then 40 when 'tavern' then 65 when 'observatory' then 45 else 0 end;
    v_base_stone:=case p_building when 'keep' then 70 when 'lumber' then 25 when 'forge' then 55
      when 'tavern' then 30 when 'observatory' then 60 else 0 end;
    v_gold:=ceil(v_base_gold*v_factor)::bigint;
    v_wood:=ceil(v_base_wood*v_factor)::bigint;
    v_stone:=ceil(v_base_stone*v_factor)::bigint;
    if (v_res->>'gold')::bigint<v_gold or (v_res->>'wood')::bigint<v_wood or (v_res->>'stone')::bigint<v_stone then
      raise exception 'Sunucu kaynakları geliştirme için yeterli değil.';
    end if;
    v_res:=jsonb_set(v_res,'{gold}',to_jsonb((v_res->>'gold')::bigint-v_gold));
    v_res:=jsonb_set(v_res,'{wood}',to_jsonb((v_res->>'wood')::bigint-v_wood));
    v_res:=jsonb_set(v_res,'{stone}',to_jsonb((v_res->>'stone')::bigint-v_stone));
    v_cost:=jsonb_build_object('gold',v_gold,'wood',v_wood,'stone',v_stone);
    if v_level=1 then
      v_blds:=jsonb_set(v_blds,array[p_building],to_jsonb(2));
    else
      v_duration:=v_minutes[v_level+1];
      v_started:=v_ms;
      v_ends:=v_started+v_duration*60000::bigint;
      v_con:=jsonb_build_object('id',p_building,'fromLevel',v_level,'startedAt',v_started,'endsAt',v_ends);
    end if;
  elsif p_action='finish' then
    if v_con is null then raise exception 'Aktif inşaat bulunamadı.'; end if;
    if v_ms<(v_con->>'endsAt')::bigint then raise exception 'İnşaat henüz tamamlanmadı.'; end if;
    v_level:=(v_blds->>(v_con->>'id'))::integer;
    if v_level<>(v_con->>'fromLevel')::integer or v_level>=20 then
      raise exception 'İnşaat seviyesi geçersiz.';
    end if;
    v_blds:=jsonb_set(v_blds,array[v_con->>'id'],to_jsonb(v_level+1));
    v_con:=null;
  elsif p_action='daily' then
    raise exception 'Eski günlük sandık kapatıldı; 28 günlük ödül takvimini aç.';
  elsif p_action='match' then
    if p_room_id is null or length(p_room_id)>128 or length(p_room_id)<4 then
      raise exception 'Geçersiz doğrulanmış maç kimliği.';
    end if;
    if not exists (select 1 from public.starfort_match_history
        where user_id=v_user and room_id=p_room_id and outcome in ('win','victory')) then
      raise exception 'Sunucuda doğrulanmış galibiyet bulunamadı.';
    end if;
    insert into public.starfort_village_match_claims(user_id,room_id)
      values(v_user,p_room_id) on conflict do nothing returning room_id into v_claimed;
    if v_claimed is null then raise exception 'Maç ödülü daha önce alındı.'; end if;
    v_reward:='{"gold":220,"wood":100,"stone":70,"aether":15}'::jsonb;
    v_row.mastery:=least(24,v_row.mastery+3);
    for v_resource in select unnest(array['gold','wood','stone','aether']) loop
      v_res:=jsonb_set(v_res,array[v_resource],to_jsonb(least(1000000000,(v_res->>v_resource)::bigint+(v_reward->>v_resource)::bigint)));
    end loop;
  end if;
  if p_action<>'get' then
    update public.starfort_village_ledger set res=v_res,buildings=v_blds,construction=v_con,
      last_collected=case when p_action in ('collect','upgrade') then v_now else v_row.last_collected end,
      last_daily=v_row.last_daily,mastery=v_row.mastery,revision=v_row.revision+1,
      last_request_id=p_request_id,updated_at=v_now
    where user_id=v_user;
    v_row.revision:=v_row.revision+1;
    if p_action in ('collect','upgrade') then v_row.last_collected:=v_now; end if;
  end if;
  v_response:=jsonb_build_object('ok',true,'source','server','res',v_res,'buildings',v_blds,
    'construction',v_con,'lastCollected',floor(extract(epoch from v_row.last_collected)*1000)::bigint,
    'lastDailyReward',case when v_row.last_daily is null then null else to_char(v_row.last_daily,'YYYY-MM-DD') end,
    'serverNow',v_ms,'mastery',v_row.mastery,'revision',v_row.revision,
    'applied',p_action,'gain',v_gain,'cost',v_cost,'reward',v_reward);
  if p_action<>'get' then
    update public.starfort_village_ledger set last_response=v_response where user_id=v_user;
    insert into public.starfort_village_requests(user_id,request_id,response)
      values(v_user,p_request_id,v_response);
  end if;
  return v_response;
end;
$fn$;
revoke all on function public.sfb_village_api(text,text,uuid,text) from public,anon,authenticated;
grant execute on function public.sfb_village_api(text,text,uuid,text) to authenticated;
