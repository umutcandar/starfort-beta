-- STARFORT v2.36: payment-safe scaffolding. No checkout endpoint and no user-crediting API.
-- Player balance is 0 until a verified provider event arrives through trusted backend only.
create table if not exists public.starfort_premium_wallet (
 user_id uuid primary key references auth.users(id) on delete cascade,
 crystals bigint not null default 0 check (crystals between 0 and 100000000),
 equipped jsonb not null default '{}'::jsonb,
 vip_until timestamptz,
 revision bigint not null default 1,
 updated_at timestamptz not null default now()
);
create table if not exists public.starfort_premium_owned (
 user_id uuid not null references auth.users(id) on delete cascade,
 item_id text not null,
 source text not null,
 granted_at timestamptz not null default now(),
 primary key(user_id,item_id)
);
create table if not exists public.starfort_premium_requests (
 user_id uuid not null references auth.users(id) on delete cascade,
 request_id uuid not null,
 response jsonb not null,
 created_at timestamptz not null default now(),
 primary key(user_id,request_id)
);
create table if not exists public.starfort_premium_seasons (
 user_id uuid not null references auth.users(id) on delete cascade,
 month text not null check (month ~ '^20[0-9]{2}-(0[1-9]|1[0-2])$'),
 baseline_wins integer not null default 0 check (baseline_wins>=0),
 free_claims jsonb not null default '[]'::jsonb,
 premium boolean not null default false,
 premium_claims jsonb not null default '[]'::jsonb,
 created_at timestamptz not null default now(),
 primary key(user_id,month)
);
-- Trusted provider event ledger: only server-side private fulfillment is allowed.
create table if not exists public.starfort_premium_events (
 provider text not null,
 provider_ref text not null,
 user_id uuid not null references auth.users(id) on delete cascade,
 sku text not null,
 credited_crystals integer not null default 0,
 created_at timestamptz not null default now(),
 primary key(provider,provider_ref)
);
alter table public.starfort_premium_wallet enable row level security;
alter table public.starfort_premium_owned enable row level security;
alter table public.starfort_premium_requests enable row level security;
alter table public.starfort_premium_seasons enable row level security;
alter table public.starfort_premium_events enable row level security;
revoke all on public.starfort_premium_wallet from public,anon,authenticated;
revoke all on public.starfort_premium_owned from public,anon,authenticated;
revoke all on public.starfort_premium_requests from public,anon,authenticated;
revoke all on public.starfort_premium_seasons from public,anon,authenticated;
revoke all on public.starfort_premium_events from public,anon,authenticated;

create or replace function public.sfb_premium_api(
 p_action text,p_item text default null,p_request_id uuid default null
) returns jsonb
language plpgsql security definer set search_path=''
as $fn$
declare
 u uuid:=auth.uid();
 w public.starfort_premium_wallet%rowtype;
 season public.starfort_premium_seasons%rowtype;
 month_id text:=to_char(clock_timestamp() at time zone 'UTC','YYYY-MM');
 event_now timestamptz:=clock_timestamp();
 current_wins integer:=0;
 progress integer;
 price integer;
 slot text;
 prize text;
 threshold integer;
 updated boolean:=false;
 prev jsonb;
 owned_ids jsonb;
 result jsonb;
begin
 if u is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then
  raise exception 'Mağaza için doğrulanmış hesap gerekiyor.';
 end if;
 if p_action is null or p_action not in ('get','purchase','equip','unequip','claim') then
  raise exception 'Mağaza işlemi geçersiz.';
 end if;
 if p_action<>'get' and p_request_id is null then
  raise exception 'Tekrarlanabilir işlem kimliği gerekli.';
 end if;
 if p_item is not null and (length(p_item)>60 or length(p_item)<1) then
  raise exception 'Ürün kimliği geçersiz.';
 end if;
 insert into public.starfort_premium_wallet(user_id) values(u) on conflict do nothing;
 select * into strict w from public.starfort_premium_wallet where user_id=u for update;
 if p_action<>'get' then
  select response into prev from public.starfort_premium_requests where user_id=u and request_id=p_request_id;
  if found then return prev; end if;
 end if;
 select coalesce((counters->>'win')::integer,0) into current_wins from public.starfort_player_progress where user_id=u;
 current_wins:=coalesce(current_wins,0);
 insert into public.starfort_premium_seasons(user_id,month,baseline_wins)
 values(u,month_id,current_wins) on conflict do nothing;
 select * into strict season from public.starfort_premium_seasons
 where user_id=u and month=month_id for update;
 progress:=greatest(0,current_wins-season.baseline_wins);
 if p_action='purchase' then
  -- Only hardcoded cosmetic SKUs. Never accept a user-supplied price.
  price:=case p_item
   when 'castle-aurora' then 200 when 'castle-ember' then 200
   when 'cape-starlight' then 160 when 'cape-shadow' then 160
   when 'banner-royal' then 120 when 'banner-astral' then 120
   when 'victory-gold' then 140 when 'victory-sky' then 140 else null end;
  if price is null then raise exception 'Ürün satışta değil.'; end if;
  if exists (select 1 from public.starfort_premium_owned where user_id=u and item_id=p_item) then
   raise exception 'Bu kozmetik zaten hesabında.';
  end if;
  if w.crystals<price then raise exception 'Yetersiz Yıldız Kristali. Ödeme sistemi henüz kapalı.'; end if;
  insert into public.starfort_premium_owned(user_id,item_id,source)
    values(u,p_item,'crystals');
  w.crystals:=w.crystals-price;
  updated:=true;
 elsif p_action='equip' then
  select case
   when p_item in ('castle-aurora','castle-ember','castle-dawn') then 'castle'
   when p_item in ('cape-starlight','cape-shadow','cape-scout') then 'cape'
   when p_item in ('banner-royal','banner-astral','banner-trailblazer') then 'banner'
   when p_item in ('victory-gold','victory-sky','victory-constellation') then 'victory'
   else null end into slot;
  if slot is null then raise exception 'Görünüm yuvası geçersiz.'; end if;
  if not exists(select 1 from public.starfort_premium_owned where user_id=u and item_id=p_item) then
   raise exception 'Bu kozmetiğe sahip değilsin.';
  end if;
  w.equipped:=jsonb_set(w.equipped,array[slot],to_jsonb(p_item),true);
  updated:=true;
 elsif p_action='unequip' then
  if p_item not in ('castle','cape','banner','victory') or p_item is null then
   raise exception 'Görünüm yuvası geçersiz.';
  end if;
  w.equipped:=w.equipped-p_item;
  updated:=true;
 elsif p_action='claim' then
  if p_item not in ('1','2','3','4') or p_item is null then
   raise exception 'Sezon ödül seviyesi geçersiz.';
  end if;
  threshold:=case p_item when '1' then 2 when '2' then 5 when '3' then 10 else 18 end;
  prize:=case p_item when '1' then 'banner-trailblazer'
   when '2' then 'cape-scout' when '3' then 'castle-dawn' else 'victory-constellation' end;
  if progress<threshold then raise exception 'Sezon zafer hedefi henüz tamamlanmadı.'; end if;
  if season.free_claims ? p_item then raise exception 'Bu sezon ödülü alındı.'; end if;
  insert into public.starfort_premium_owned(user_id,item_id,source)
    values(u,prize,'free-season:'||month_id) on conflict do nothing;
  season.free_claims:=season.free_claims||to_jsonb(p_item);
  update public.starfort_premium_seasons set free_claims=season.free_claims
   where user_id=u and month=month_id;
  updated:=true;
 end if;
 if updated then
  w.revision:=w.revision+1;
  update public.starfort_premium_wallet
   set crystals=w.crystals,equipped=w.equipped,revision=w.revision,updated_at=event_now
   where user_id=u;
 end if;
 select coalesce(jsonb_agg(item_id order by item_id),'[]'::jsonb)
   into owned_ids from public.starfort_premium_owned where user_id=u;
 result:=jsonb_build_object(
  'ok',true,'source','server-premium','paymentsEnabled',false,
  'crystals',w.crystals,'vipUntil',case when w.vip_until is null then null else
    floor(extract(epoch from w.vip_until)*1000)::bigint end,
  'equipped',w.equipped,'owned',owned_ids,'revision',w.revision,
  'season',jsonb_build_object('month',month_id,'wins',progress,
    'thresholds',jsonb_build_array(2,5,10,18),'freeClaims',season.free_claims,
    'premium',season.premium,'premiumClaims',season.premium_claims),
  'applied',p_action);
 if p_action<>'get' then
  insert into public.starfort_premium_requests(user_id,request_id,response)
    values(u,p_request_id,result);
 end if;
 return result;
end;
$fn$;
revoke all on function public.sfb_premium_api(text,text,uuid) from public,anon,authenticated;
grant execute on function public.sfb_premium_api(text,text,uuid) to authenticated;

-- NOT a public webhook. Only a trusted payment adapter, after signature verification
-- and amount/currency/product checking, may invoke this service-role-only function.
create or replace function public.sfb_premium_fulfill(
 p_user uuid,p_provider text,p_reference text,p_sku text
) returns jsonb
language plpgsql security definer set search_path=''
as $fn$
declare
 event_row public.starfort_premium_events%rowtype;
 awarded integer;
 month_id text:=to_char(clock_timestamp() at time zone 'UTC','YYYY-MM');
 current_wins integer:=0;
 w public.starfort_premium_wallet%rowtype;
begin
 if p_user is null or p_provider not in ('future-provider')
   or p_reference is null or length(p_reference)<8 or length(p_reference)>128
   or p_sku not in ('crystals100','crystals500','crystals1200','vip30','pass_month')
 then raise exception 'Doğrulanmış ödeme verisi geçersiz.'; end if;
 -- This provider sentinel intentionally makes production fulfillment unavailable
 -- until a separately reviewed verified webhook adapter is deployed.
 raise exception 'Ücretli satın alma devre dışı: doğrulanmış ödeme entegrasyonu yok.';
end;
$fn$;
revoke all on function public.sfb_premium_fulfill(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.sfb_premium_fulfill(uuid,text,text,text) to service_role;
