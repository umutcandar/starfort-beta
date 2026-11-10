-- Disposable PostgreSQL 16 CI only: minimal live-table signature fixtures.
-- Never run against a real Supabase project.
create role authenticated nologin;
create role anon nologin;
create schema auth;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid
 language sql stable set search_path to ''
 as $$select nullif(current_setting('test.user_id',true),'')::uuid$$;
create function auth.jwt() returns jsonb
 language sql stable set search_path to ''
 as $$select '{}'::jsonb$$;
grant usage on schema auth to authenticated;
grant execute on function auth.uid() to authenticated;
grant execute on function auth.jwt() to authenticated;

create table public.starfort_player_progress(
 user_id uuid primary key references auth.users(id),
 mission jsonb default null,
 last_report jsonb default null
);
create table public.starfort_world_boss_contribution(
 user_id uuid not null references auth.users(id),
 week text not null,
 damage integer not null default 0,
 primary key(user_id,week)
);
alter table public.starfort_player_progress enable row level security;
revoke all on public.starfort_player_progress from public,authenticated,anon;
revoke all on public.starfort_world_boss_contribution from public,authenticated,anon;
insert into auth.users(id)
values('00000000-0000-4000-8000-000000000001'),
      ('00000000-0000-4000-8000-000000000002');
insert into public.starfort_player_progress(user_id)
 select id from auth.users;
