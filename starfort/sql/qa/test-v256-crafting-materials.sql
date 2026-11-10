-- v256 material wallet: run in disposable Postgres QA only.
-- Requires the minimal schema from v256-test-bootstrap.sql and the new
-- starfort-v256-original-crafting-materials.sql.
set test.user_id='00000000-0000-4000-8000-000000000001';
set role authenticated;
do $body$
declare v jsonb;
begin
 v:=public.sfb_crafting_materials('get',null,null);
 if v->>'focus'<>'weapon' or v#>>'{materials,edge_sliver}'<>'0'
    or v#>>'{materials,guardian_stamp}'<>'0' then
  raise exception 'Fresh authenticated wallet must be empty and focused on weapon: %',v;
 end if;
 -- No client can write any material or victory/loot table.
 if has_table_privilege('authenticated',
   'public.starfort_crafting_material_wallet','INSERT') or
    has_table_privilege('authenticated',
   'public.starfort_crafting_material_wallet','UPDATE') or
    has_table_privilege('authenticated',
   'public.starfort_crafting_material_awards','INSERT') or
    has_table_privilege('authenticated',
   'public.starfort_player_progress','UPDATE') then
  raise exception 'Client privileges can bypass real server earned drops';
 end if;
end;
$body$;

do $body$
declare v jsonb;
begin
 v:=public.sfb_crafting_materials('focus','armor',
      '11111111-1111-4111-8111-111111111111');
 if v->>'focus'<>'armor' then raise exception 'Real focus save failed'; end if;
 v:=public.sfb_crafting_materials('focus','relic',
      '22222222-2222-4222-8222-222222222222');
 if v->>'focus'<>'relic' then raise exception 'Second focus failed'; end if;
 -- A replayed idempotency UUID must NOT reverse the user's newer focus.
 v:=public.sfb_crafting_materials('focus','armor',
      '11111111-1111-4111-8111-111111111111');
 if v->>'focus'<>'armor' then raise exception 'Cached UUID reply must match'; end if;
 v:=public.sfb_crafting_materials('get',null,null);
 if v->>'focus'<>'relic' then raise exception 'Replay mutated later focus'; end if;
end;
$body$;
reset role;

-- Create 5 actual successful mission-terminal transitions in one UTC day.
-- Each is 3-star story chapter 5, but only first 3 may award Astral Fiber,
-- and only the first eligible chapter awards Star Glass.
do $body$
declare v_id uuid:='00000000-0000-4000-8000-000000000001';
 v_ms bigint;
 i integer;
begin
 v_ms:=floor(extract(epoch from
    (date_trunc('day',now() at time zone 'UTC')+interval '12 hours'))*1000)::bigint;
 for i in 1..5 loop
  update public.starfort_player_progress
   set mission=jsonb_build_object('mode','story','stage',5,'tier',0)
   where user_id=v_id;
  update public.starfort_player_progress
   set mission=null,last_report=jsonb_build_object(
    'won',true,'mode','story','stage',5,'stars',3,'at',v_ms+i*30000)
   where user_id=v_id;
 end loop;
 -- Normal reads or repeated identical outcome cannot duplicate a grant.
 update public.starfort_player_progress set last_report=last_report
 where user_id=v_id;
end;
$body$;

do $body$
declare w public.starfort_crafting_material_wallet%rowtype;
 n integer;
begin
 select * into strict w from public.starfort_crafting_material_wallet
 where user_id='00000000-0000-4000-8000-000000000001';
 select count(*) into n from public.starfort_crafting_material_awards
 where user_id=w.user_id and source_type='daily_story';
 if w.astral_fiber<>9 or w.star_glass<>1 or w.edge_sliver<>0
    or w.ward_rivet<>0 or n<>3 then
  raise exception 'UTC daily cap / selected class / 3star glass mismatch';
 end if;
end;
$body$;

-- Negative conditions: a lost fight and a mismatched battle report are NOT
-- evidence, even when request JSON contains a valid server-like date.
do $body$
declare v_id uuid:='00000000-0000-4000-8000-000000000001';
 v_ms bigint;
begin
 v_ms:=floor(extract(epoch from now())*1000)::bigint+500000;
 update public.starfort_player_progress set
  mission='{"mode":"story","stage":7}'::jsonb where user_id=v_id;
 update public.starfort_player_progress set mission=null,
  last_report=jsonb_build_object('won',false,'mode','story',
      'stage',7,'stars',0,'at',v_ms) where user_id=v_id;
 update public.starfort_player_progress set
  mission='{"mode":"story","stage":7}'::jsonb where user_id=v_id;
 update public.starfort_player_progress set mission=null,
  last_report=jsonb_build_object('won',true,'mode','boss',
      'stage',7,'stars',3,'at',v_ms+30000) where user_id=v_id;
end;
$body$;

-- The actual existing world-boss contribution row is required for a weekly stamp.
do $body$
declare v_id uuid:='00000000-0000-4000-8000-000000000001';
 wk text;
 v_ms bigint;
 i int;
begin
 wk:=to_char(now() at time zone 'UTC','IYYY-IW');
 v_ms:=floor(extract(epoch from
    (date_trunc('day',now() at time zone 'UTC')+interval '15 hours'))*1000)::bigint;
 -- Boss without contribution: NO stamp.
 update public.starfort_player_progress set mission=
  '{"mode":"boss","stage":4,"tier":1}'::jsonb where user_id=v_id;
 update public.starfort_player_progress set mission=null,
  last_report=jsonb_build_object('won',true,'mode','boss',
  'stage',4,'stars',2,'at',v_ms+10000) where user_id=v_id;
 insert into public.starfort_world_boss_contribution(user_id,week,damage)
 values(v_id,wk,300);
 for i in 1..2 loop
  update public.starfort_player_progress set mission=
   '{"mode":"boss","stage":4,"tier":1}'::jsonb where user_id=v_id;
  update public.starfort_player_progress set mission=null,
   last_report=jsonb_build_object('won',true,'mode','boss',
    'stage',4,'stars',2,'at',v_ms+(i+1)*30000) where user_id=v_id;
 end loop;
 -- Rift is an already-existing repeatable once-per-week story mode.
 for i in 1..2 loop
  update public.starfort_player_progress set mission=
   '{"mode":"rift","stage":8,"tier":3}'::jsonb where user_id=v_id;
  update public.starfort_player_progress set mission=null,
   last_report=jsonb_build_object('won',true,'mode','rift',
    'stage',8,'stars',2,'at',v_ms+(i+3)*30000) where user_id=v_id;
 end loop;
 -- Equally accessible SOLO endgame chart; not alliance-gated.
 for i in 1..2 loop
  update public.starfort_player_progress set mission=
   '{"mode":"veteran","stage":5,"tier":2}'::jsonb where user_id=v_id;
  update public.starfort_player_progress set mission=null,
   last_report=jsonb_build_object('won',true,'mode','veteran',
    'stage',5,'stars',3,'at',v_ms+(i+5)*30000) where user_id=v_id;
 end loop;
end;
$body$;

do $body$
declare w public.starfort_crafting_material_wallet%rowtype;
begin
 select * into strict w from public.starfort_crafting_material_wallet
 where user_id='00000000-0000-4000-8000-000000000001';
 if w.guardian_stamp<>1 or w.stellar_core<>1 or
    w.constellation_chart<>1 or w.star_glass<>1 or
    w.astral_fiber<>9 then
  raise exception 'Weekly boss/rift/solo guarantees or daily caps failed: %',
   to_jsonb(w);
 end if;
end;
$body$;

-- UTC day rollover gets NEW daily chances, but does not reset weekly stamps.
set role authenticated;
do $body$
declare v jsonb;
begin
 v:=public.sfb_crafting_materials('focus','weapon',
      '33333333-3333-4333-8333-333333333333');
 if v->>'focus'<>'weapon' then raise exception 'New focus not accepted'; end if;
end;
$body$;
reset role;
do $body$
declare v_id uuid:='00000000-0000-4000-8000-000000000001';
 v_ms bigint;
begin
 v_ms:=floor(extract(epoch from
    (date_trunc('day',now() at time zone 'UTC')+interval '1 day 12 hours'))*1000)::bigint;
 update public.starfort_player_progress set mission=
  '{"mode":"story","stage":1}'::jsonb where user_id=v_id;
 update public.starfort_player_progress set mission=null,
  last_report=jsonb_build_object('won',true,'mode','story',
    'stage',1,'stars',2,'at',v_ms) where user_id=v_id;
end;
$body$;

do $body$
declare w public.starfort_crafting_material_wallet%rowtype;
begin
 select * into strict w from public.starfort_crafting_material_wallet
 where user_id='00000000-0000-4000-8000-000000000001';
 if w.edge_sliver<>3 or w.astral_fiber<>9 or
    w.star_glass<>1 or w.guardian_stamp<>1 then
  raise exception 'A new UTC day failed focus reward or weekly cap: %',to_jsonb(w);
 end if;
end;
$body$;

-- Authenticated user #2 must see ONLY their OWN wallet, no player #1 loot.
set test.user_id='00000000-0000-4000-8000-000000000002';
set role authenticated;
do $body$
declare v jsonb;
begin
 v:=public.sfb_crafting_materials('get',null,null);
 if v#>>'{materials,edge_sliver}'<>'0' or
    v#>>'{materials,stellar_core}'<>'0' or
    v#>>'{materials,guardian_stamp}'<>'0' or
    v->>'focus'<>'weapon' then
  raise exception 'Cross-account loot disclosure detected: %',v;
 end if;
end;
$body$;
reset role;

-- The material trigger never fabricates existing equipment/currency.
do $body$
declare old_gear jsonb;
begin
 select last_report into old_gear from public.starfort_player_progress
 where user_id='00000000-0000-4000-8000-000000000002';
 if old_gear is not null then
  raise exception 'Other user gameplay progress was unexpectedly mutated';
 end if;
end;
$body$;
select 'STARFORT v256 isolated PostgreSQL material economy checks passed' as result;
