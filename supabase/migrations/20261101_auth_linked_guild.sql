-- Single authenticated identity for fresh STARFORT beta guild users.
-- The legacy 17 beta/test identities are preserved, but no longer offered to new signups.
create table if not exists starfort_beta.auth_links(
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  beta_user_id text unique not null references starfort_beta.users(id) on delete cascade,
  internal_token text not null check(internal_token ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now()
);
alter table starfort_beta.auth_links enable row level security;
revoke all on starfort_beta.auth_links from public,anon,authenticated;

create or replace function public.sfb_account_api(
  route text, data jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer
set search_path=starfort_beta,extensions,pg_temp
as $func$
declare who uuid; linked starfort_beta.auth_links; token text; r jsonb;
begin
  who := auth.uid();
  if who is null then
    return jsonb_build_object('status',401,'body',jsonb_build_object('error','E-posta hesabına giriş gerekli.'));
  end if;
  if route='status' then
    return jsonb_build_object('status',200,'body',jsonb_build_object('ok',true,'online',true,'service','starfort-auth-guild'));
  end if;
  perform pg_advisory_xact_lock(hashtextextended(who::text, 987654));
  select * into linked from starfort_beta.auth_links where auth_user_id=who;
  if not found then
    if route <> 'register' then
      return jsonb_build_object('status',404,'body',jsonb_build_object('error','Önce bu e-posta hesabına komutan adı oluştur.'));
    end if;
    r := starfort_beta.sfb_api_core('register',null,coalesce(data,'{}'::jsonb));
    if (r->>'status') <> '201' then return r; end if;
    token := r->'body'->>'token';
    if token is null or token !~ '^[a-f0-9]{64}$' then
      raise exception 'A newly registered commander did not return an internal token';
    end if;
    insert into starfort_beta.auth_links(auth_user_id,beta_user_id,internal_token)
      values(who,r->'body'->'player'->>'id',token);
    -- Never reveal the legacy bearer credential to the client.
    return jsonb_set(r,'{body}',(r->'body')-'token');
  end if;
  token := linked.internal_token;
  if route='register' then route:='me'; end if;
  if route like 'arena/%' or route like 'team/%' then
    return jsonb_build_object('status',400,'body',jsonb_build_object('error','Canlı savaşlar ayrı oyun sunucusundadır.'));
  end if;
  return public.sfb_api(route,token,coalesce(data,'{}'::jsonb));
end $func$;
revoke execute on function public.sfb_account_api(text,jsonb) from public,anon;
grant execute on function public.sfb_account_api(text,jsonb) to authenticated;
