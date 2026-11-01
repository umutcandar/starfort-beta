-- Server-authenticated match outcome ledger. Never grants player INSERT/UPDATE.
-- Render signs the exact JSON body using a 256-bit key managed out-of-band.
create table if not exists starfort_beta.match_signing_keys(
 key_id smallint primary key check(key_id=1),
 secret text not null check(secret ~ '^[a-f0-9]{64}$')
);
alter table starfort_beta.match_signing_keys enable row level security;
revoke all on starfort_beta.match_signing_keys from public,anon,authenticated;

create table if not exists public.starfort_match_history(
 room_id text not null,
 user_id uuid not null references auth.users(id) on delete cascade,
 mode text not null check(mode in ('duel','team-2','team-5','siege-5')),
 outcome text not null check(outcome in ('win','loss','draw','cancel')),
 reason text not null,
 hero_id text,
 started_at timestamptz not null,
 ended_at timestamptz not null,
 recorded_at timestamptz not null default now(),
 primary key(room_id,user_id),
 constraint sane_match_duration check(ended_at>=started_at and ended_at<=started_at+interval '30 minutes')
);
create index if not exists starfort_match_history_user_recent_idx on public.starfort_match_history(user_id,ended_at desc);
alter table public.starfort_match_history enable row level security;
revoke all on public.starfort_match_history from public,anon,authenticated;
grant select on public.starfort_match_history to authenticated;
drop policy if exists "starfort_owner_match_history" on public.starfort_match_history;
create policy "starfort_owner_match_history" on public.starfort_match_history for select to authenticated using ((select auth.uid())=user_id);

create or replace function public.sfb_match_ingest(p_body text,p_sig text)
returns jsonb language plpgsql security definer set search_path=''
as $f$
declare secret text; doc jsonb; item jsonb; mid text; mode_text text; reason_text text;
  ended timestamptz; started timestamptz; uid uuid; added integer:=0;
begin
 if p_body is null or octet_length(p_body)>8000 or p_sig !~ '^[a-f0-9]{64}$' then
   raise exception 'Invalid signed match result' using errcode='22023';
 end if;
 select k.secret into secret from starfort_beta.match_signing_keys k where k.key_id=1;
 if secret is null or encode(extensions.hmac(p_body,secret,'sha256'),'hex')<>p_sig then
   raise exception 'Invalid match signature' using errcode='42501';
 end if;
 doc:=p_body::jsonb;
 mid:=doc->>'room_id';mode_text:=doc->>'mode';reason_text:=doc->>'reason';
 if mid !~ '^[a-f0-9]{16,18}$'
 or mode_text not in ('duel','team-2','team-5','siege-5')
 or reason_text is null or length(reason_text)>40 or reason_text !~ '^[a-z-]+$'
 or jsonb_typeof(doc->'players')<>'array'
 or jsonb_array_length(doc->'players') not between 1 and 10 then
   raise exception 'Invalid match payload' using errcode='22023';
 end if;
 ended:=(doc->>'ended_at')::timestamptz;
 started:=(doc->>'started_at')::timestamptz;
 if ended < started or ended > started+interval '30 minutes'
 or abs(extract(epoch from (now()-ended)))>300 then
   raise exception 'Invalid match timestamp' using errcode='22023';
 end if;
 for item in select value from jsonb_array_elements(doc->'players') loop
   uid:=(item->>'user_id')::uuid;
   if item->>'outcome' not in ('win','loss','draw','cancel')
   or item->>'hero_id' !~ '^[a-z_]{1,20}$' then
     raise exception 'Invalid player result' using errcode='22023';
   end if;
   insert into public.starfort_match_history(room_id,user_id,mode,outcome,reason,hero_id,started_at,ended_at)
   values(mid,uid,mode_text,item->>'outcome',reason_text,item->>'hero_id',started,ended)
   on conflict(room_id,user_id) do nothing;
   added:=added+1;
 end loop;
 return jsonb_build_object('ok',true,'processed',added);
end $f$;
revoke execute on function public.sfb_match_ingest(text,text) from public,authenticated;
grant execute on function public.sfb_match_ingest(text,text) to anon;
