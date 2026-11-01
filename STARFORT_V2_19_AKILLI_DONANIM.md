# STARFORT v2.19 — Smart hero equipment (beta)

## Player-facing change
The **Çanta ve Donanım** screen has a **Rolüne göre otomatik kuşan** control for the selected, unlocked hero.

- Evaluates all spare weapons, armor and relics against the hero's canonical role (tank, healer, mage, ranger, fighter, assassin).
- Calculates real `equipmentStats` for each combination, including the same-hero two-piece moon / ember / dawn set bonuses and the existing armor cap.
- Only considers inventory copies not equipped by other heroes; never takes an item from another hero.
- Preserves the existing loadout on ties, leaves the inventory and all resources untouched, and returns a no-op if nothing improves.
- Rejects edits during an active PvE battle and for nonexistent/locked heroes.
- Changes are stored by the existing guarded local/cloud save pipeline. No database schema or PvP power changes.

## Validation
Additional automated regression tests cover role selection, set bonuses, copy ownership, save/restore idempotence, locked heroes and active combat; the armory UI tests cover presence and disabled state.

## Security and scope
The optimizer affects **local campaign gear** only. It is not a server-authoritative competitive economy and does not alter live PvP hero stats. No Supabase migration, match-history schema change or Render secret change required. The backend still identifies its live match protocol as v2.18 reconnect.
