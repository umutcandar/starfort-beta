-- STARFORT v2.38 hardening: stop roster, gear, hero stats and inventory swapping
-- while Shadow Frontier combat is active. First-clear payouts remain allowed
-- because the battle ledger is cleared atomically before the inventory write.
create or replace function public.sfb_shadow_guard_loadout()
returns trigger language plpgsql security definer set search_path=''
as $fn$
begin
 if (new.team is distinct from old.team or
     new.heroes is distinct from old.heroes or
     new.loadouts is distinct from old.loadouts or
     new.item_upgrades is distinct from old.item_upgrades or
     new.inventory is distinct from old.inventory)
   and exists(select 1 from public.starfort_shadow_frontier
      where user_id=new.user_id and battle is not null) then
    raise exception 'Gölge Sınırı savaşı sürerken kahraman veya ekipman değiştirilemez.';
 end if;
 return new;
end;
$fn$;
drop trigger if exists sfb_shadow_guard_equipment on public.starfort_player_progress;
create trigger sfb_shadow_guard_equipment
 before update of heroes,team,loadouts,inventory,item_upgrades
 on public.starfort_player_progress for each row
 execute function public.sfb_shadow_guard_loadout();
revoke all on function public.sfb_shadow_guard_loadout() from public,anon,authenticated;
