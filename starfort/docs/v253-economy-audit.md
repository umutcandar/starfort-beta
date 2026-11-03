# STARFORT v2.53 — 90 / 180-day endgame economy review

**Evidence:** production formula in the live `public.sfb_village_api` function (MD5 `a65fb7348849940c8f2eb5608ffaada9`), and live `sfb_starfort_progress` relic mastery/ascension cost logic (MD5 `0bced2bd39dd7bdd185e5c33f56b41f2`). Both inspected on 2026-11-03 before the v2.53 deployment. The precise model in `economy-horizon-v253.js` is regression tested in `economy-combo-v253.test.mjs`.

## Decision and scope

The release decision was whether the gear ascension economy needs more handouts or a cheaper cost curve before beta player evidence exists. **Decision: do not inflate rewards preemptively.** Instead expose a conservative, clearly labeled 90/180-day forecast in the account Armory while improving endgame combat variety (server-authoritative Eclipse Surge).

The model is a **fixed-level supply projection, not a playthrough, retention experiment, or guarantee**. It excludes login-calendar claims, Warfront bounties, story replay wins, hero training, resource purchases, equipment drops, trades, and ALL future spending on buildings or heroes. It assumes perfect collection on the scheduled days and no earlier 24-hour offline bank between sessions. It is intentionally **not** based on the one existing beta account, which is insufficient evidence for cohort-wide tuning.

## Reproduced production formula

For minutes since last collection `t`, `effectiveMinutes = min(240,t) + 0.12 * max(0,min(t,1440)-240)`; `t` is capped at 1,440 minutes. Building production per collection is floored separately:

- Gold: `floor(4 × farmLevel × (1+0.05×(keepLevel−1)) × effectiveMinutes)`
- Stone: `floor(2.5 × quarryLevel × keepBonus × effectiveMinutes)`
- Aether: `floor(0.6 × observatoryLevel × keepBonus × effectiveMinutes)`

At starter level 1, a 24-hour collection yields **1,536 gold / 960 stone / 230 aether**. Two collections 12 hours apart yield **2,380 gold / 1,488 stone / 356 aether** combined. Returning only three times per week yields three capped 24h collections, not seven days of accumulated production.

## Cost of fully developing all four weekly-boss relic types

Server-enhancing all four types to +5 (one epic, three legendary) costs **72,600 gold, 6,600 stone, 4,840 aether**. Ascending all four types through ranks I–IV costs another **168,000 gold, 16,800 stone, 12,000 aether**.

**Total zero-progress target:** **240,600 gold / 23,400 stone / 16,840 aether**, excluding all unrelated construction and hero expenditures. Actual in-app target subtracts verified existing mastery/ascension ranks; materials currently held are added only to the projected wallet, not deducted from the item cost.

### Starter-level production scenarios (NO spending or extra rewards)

| Schedule | 90d gold | 90d aether | 180d gold | 180d aether | Covers total item costs by 180 days with no other spending? |
|---|---:|---:|---:|---:|---|
| 3 collection days/week | 59,904 | 8,970 | 119,808 | 17,940 | **No**: gold shortfall 120,792 |
| Once per day | 138,240 | 20,700 | 276,480 | 41,400 | **In theory yes**, but 35,880 gold remains for everything else |
| Twice per day | 214,200 | 32,040 | 428,400 | 64,080 | **In theory yes**, assuming the player maintains this activity |

Independent **week gate:** rank I requires 2 distinct verified world-boss weeks; II 5; III 9; IV 14. This makes a complete 4-rank item impossible inside **90 calendar days after starting from zero**, regardless of wallet size. Being offline for a week does not erase progress. Multiple wins in the same week do not multiply the rank counter.

## Balance implications

The data do **not** prove a real player can complete all four items in 180 days: construction, hero upgrades and gear acquisition also consume resources; the village may grow beyond level 1; weekly boss access and victories are not guaranteed. The scenario suggests a **meaningful activity/reward tradeoff**: casual players can develop a small number of chosen equipment types, while daily players can reasonably aspire to four if they invest in building production and earn PvE rewards.

Changes shipped in v2.53:

1. A read-only 90 / 180-day supply and total-cost planner appears only for a verified account in the Armory ascension detail, using current server-resolved village levels and account wallet. It labels three collection assumptions, all exclusions, and the 14-week victory gate in all 14 supported languages.
2. Version 4 *new* boss fights introduce a counterable Sunder → Eclipse two-turn chain in Act I regions 6–8 and weekly boss fights, and Shield → Eclipse on Act II regions 5–8. Guard and Rally counter the second wave; hero skills are less effective against it. The combat RPC owns intent, damage and cooldown logic. Existing v1–v3 battles are unchanged.
3. No resource reward multiplication, save migration of legacy battles, premium acceleration or local resource writes.

## Follow-up evidence needed

When there are enough consenting active beta accounts, compare anonymized percentiles for actual collected resources, win frequency, construction spending, 30/90/180-day survival and boss-fight outcome/star distribution. **Do not interpret this deterministic model as observed retention or engagement.** Recalibrate cost curves only after the shortfall and player drop-off rates are measured.
