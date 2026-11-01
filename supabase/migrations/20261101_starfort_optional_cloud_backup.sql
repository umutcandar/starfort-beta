-- STARFORT v2.9.1 optional cloud backup. All writes are token-authenticated and
-- separate from the local-only economy. Never trust this save for ranked/PvP.
begin;

create table if not exists starfort_beta.player_saves (
  user_id text primary key references starfort_beta.users(id) on delete cascade,
  game_state jsonb not null,
  rev integer not null default 1 check (rev >= 1 and rev <= 1000000000),
  saved_at timestamptz not null default now()
);
alter table starfort_beta.player_saves enable row level security;
revoke all on starfort_beta.player_saves from public, anon, authenticated;

create or replace function public.sfb_save_api(
  route text, token text default null, data jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer
set search_path = 'starfort_beta', 'extensions', 'pg_temp'
as $body$
declare
  uid text;
  existing starfort_beta.player_saves;
  snapshot jsonb;
  expected_revision integer;
begin
  if route not in ('save/get','save/put','save/delete') then
    return jsonb_build_object('status',404,'body',jsonb_build_object('error','İşlem bulunamadı.'));
  end if;
  if token is null or token !~ '^[a-f0-9]{64}$' then
    return jsonb_build_object('status',401,'body',jsonb_build_object('error','Oturum bulunamadı.'));
  end if;
  select id into uid from starfort_beta.users
  where token_hash = encode(digest(token,'sha256'),'hex');
  if uid is null then
    return jsonb_build_object('status',401,'body',jsonb_build_object('error','Oturum bulunamadı.'));
  end if;

  if route = 'save/get' then
    select * into existing from starfort_beta.player_saves where user_id=uid;
    if not found then
      return jsonb_build_object('status',200,'body',jsonb_build_object('exists',false,'revision',0));
    end if;
    return jsonb_build_object('status',200,'body',jsonb_build_object(
      'exists',true,'revision',existing.rev,'savedAt',existing.saved_at,
      'state',existing.game_state));
  end if;

  data := coalesce(data,'{}'::jsonb);
  if coalesce(data->>'expectedRev','') !~ '^(0|[1-9][0-9]{0,8})$' then
    return jsonb_build_object('status',400,'body',jsonb_build_object('error','Geçersiz kayıt sürümü.'));
  end if;
  expected_revision := (data->>'expectedRev')::integer;

  select * into existing from starfort_beta.player_saves where user_id=uid for update;
  if route='save/delete' then
    if not found then
      return jsonb_build_object('status',200,'body',jsonb_build_object('deleted',false,'revision',0));
    end if;
    if existing.rev <> expected_revision then
      return jsonb_build_object('status',409,'body',jsonb_build_object('error','Bulut kaydı başka cihazda güncellenmiş.','revision',existing.rev));
    end if;
    delete from starfort_beta.player_saves where user_id=uid;
    return jsonb_build_object('status',200,'body',jsonb_build_object('deleted',true,'revision',0));
  end if;

  snapshot := data->'state';
  if snapshot is null
    or jsonb_typeof(snapshot)<>'object'
    or coalesce(jsonb_typeof(snapshot->'version'),'')<>'number'
    or coalesce(snapshot->>'version','')<>'1'
    or coalesce(jsonb_typeof(snapshot->'res'),'')<>'object'
    or coalesce(jsonb_typeof(snapshot->'buildings'),'')<>'object'
    or coalesce(jsonb_typeof(snapshot->'team'),'')<>'array'
    or coalesce(jsonb_typeof(snapshot->'heroes'),'')<>'object'
    or octet_length(snapshot::text)>131072 then
    return jsonb_build_object('status',400,'body',jsonb_build_object('error','Kayıt boyutu veya biçimi geçersiz.'));
  end if;

  if found then
    if existing.rev <> expected_revision then
      return jsonb_build_object('status',409,'body',jsonb_build_object('error','Bulut kaydı başka cihazda güncellenmiş.','revision',existing.rev));
    end if;
    if existing.saved_at > now() - interval '3 seconds' then
      return jsonb_build_object('status',429,'body',jsonb_build_object('error','Yeni yedek için birkaç saniye bekle.'));
    end if;
    update starfort_beta.player_saves
      set game_state=snapshot, rev=existing.rev+1, saved_at=now()
      where user_id=uid;
    return jsonb_build_object('status',200,'body',jsonb_build_object('saved',true,'revision',existing.rev+1));
  end if;

  if expected_revision<>0 then
    return jsonb_build_object('status',409,'body',jsonb_build_object('error','Bulut yedeği henüz yok.','revision',0));
  end if;
  insert into starfort_beta.player_saves(user_id,game_state)
  values(uid,snapshot) on conflict (user_id) do nothing;
  if not found then
    return jsonb_build_object('status',409,'body',jsonb_build_object('error','Bulut kaydı eşzamanlı oluşturulmuş. Önce yenile.'));
  end if;
  return jsonb_build_object('status',200,'body',jsonb_build_object('saved',true,'revision',1));
end;
$body$;

revoke execute on function public.sfb_save_api(text,text,jsonb) from public;
grant execute on function public.sfb_save_api(text,text,jsonb) to anon, authenticated;
comment on function public.sfb_save_api(text,text,jsonb)
  is 'STARFORT beta: explicit client backup only; not authoritative for rewards, progression or multiplayer.';
commit;
