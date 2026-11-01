-- v2.24 follow-up: permanent, per-user operation idempotency (also across restarts).
create table if not exists public.starfort_village_requests(
 user_id uuid not null references auth.users(id) on delete cascade,
 request_id uuid not null,
 response jsonb not null,
 created_at timestamptz not null default now(),
 primary key(user_id,request_id)
);
alter table public.starfort_village_requests enable row level security;
revoke all on public.starfort_village_requests from public,anon,authenticated;

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
    if v_row.last_daily=v_now::date then raise exception 'Günlük sunucu ödülü zaten alındı.'; end if;
    v_reward:='{"gold":120,"wood":90,"stone":70,"aether":10}'::jsonb;
    v_row.last_daily:=v_now::date;
    v_row.mastery:=least(24,v_row.mastery+1);
    for v_resource in select unnest(array['gold','wood','stone','aether']) loop
      v_res:=jsonb_set(v_res,array[v_resource],to_jsonb(least(1000000000,(v_res->>v_resource)::bigint+(v_reward->>v_resource)::bigint)));
    end loop;
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
