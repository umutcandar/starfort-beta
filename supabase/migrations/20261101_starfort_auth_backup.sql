-- Authenticated, owner-scoped OPTIONAL backup. Never a trusted PvP economy ledger.
create table if not exists public.starfort_account_backups (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null,
  revision integer not null default 1 check(revision between 1 and 1000000000),
  updated_at timestamptz not null default now(),
  constraint starfort_backup_valid check (
    jsonb_typeof(state)='object' and state->>'version'='1'
    and jsonb_typeof(state->'res')='object'
    and jsonb_typeof(state->'heroes')='object'
    and jsonb_typeof(state->'buildings')='object'
    and octet_length(state::text)<=131072
  )
);
alter table public.starfort_account_backups enable row level security;
revoke all on public.starfort_account_backups from anon;
grant select,insert,update,delete on public.starfort_account_backups to authenticated;
-- Safe for replay after an initial beta deployment; policies are replaced atomically.
drop policy if exists "starfort_bak_select" on public.starfort_account_backups;
drop policy if exists "starfort_bak_insert" on public.starfort_account_backups;
drop policy if exists "starfort_bak_update" on public.starfort_account_backups;
drop policy if exists "starfort_bak_delete" on public.starfort_account_backups;
create policy "starfort_bak_select" on public.starfort_account_backups
  for select to authenticated using ((select auth.uid())=user_id);
create policy "starfort_bak_insert" on public.starfort_account_backups
  for insert to authenticated with check ((select auth.uid())=user_id);
create policy "starfort_bak_update" on public.starfort_account_backups
  for update to authenticated using ((select auth.uid())=user_id)
  with check ((select auth.uid())=user_id);
create policy "starfort_bak_delete" on public.starfort_account_backups
  for delete to authenticated using ((select auth.uid())=user_id);
