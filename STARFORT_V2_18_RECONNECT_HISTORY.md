# STARFORT v2.18 — live match continuity and signed persistent history

## Live match reconnect
- Active 1v1 and 2v2/5v5 (including siege) sessions tolerate up to 60 seconds without a fresh authenticated heartbeat before a disconnect is evaluated.
- `arena/state` and `team/state` refresh presence and include the server-assigned last accepted sequence counter, which is reused after a page reload.
- Each Render process has a fresh `serverEpoch`. While a match is active, the browser remembers only its room ID and server epoch in sessionStorage. If the server restarts and the former room is absent, the screen says the session was **cancelled / lost**, not a fake server-verified loss. The player can requeue.
- Active team games poll state as well as sending inputs, preserving reconnection and keeping old command counters from rejecting player movement.
- **Limit**: active simulation still runs in the Render process memory. This release does not pretend to resume the exact frame after a Render restart.

## Persistent server-authored match history
- `public.starfort_match_history` contains room ID, Auth UUID, mode, win/loss/draw, reason, hero and timestamps. Server writes only finished, real human-player matches (bots/practice excluded from this ledger).
- RLS: `authenticated` role has SELECT of **its own** rows only. Neither `anon` nor `authenticated` may INSERT, UPDATE or DELETE.
- Render signs the **exact JSON result** with `STARFORT_MATCH_INGEST_SECRET` (256-bit random key stored as private Render environment variable). The matching secret is kept only in `starfort_beta.match_signing_keys`, never in source control or the browser.
- Public RPC `sfb_match_ingest` validates HMAC, mode, UUIDs, timestamps and data size; replay is idempotent by room/player primary key. The function is callable by anon but requires valid HMAC; invalid signatures are rejected, verified via SQL transaction test.
- Match outcome is calculated from the server-owned room state, not arbitrary client `won` fields. Browser has an opt-in **Son 10 Maçım** panel using its own Auth JWT.
- If Supabase briefly fails, in-memory retry uses exponential backoff and does not freeze combat. **If Render restarts while an accepted result is still queued but not written**, that pending result can be lost. This beta is not a ranked, cash-prize, or irreversible economy ledger. A durable disk/queue and stronger delivery guarantee remain for competitive release.

## Operational checks
- `STARFORT_AUTH_REQUIRED=1`, `STARFORT_MATCH_INGEST_SECRET` are set on Render; only the signing secret is marked `sync:false` in `render.yaml`.
- Supabase migration `20261101_starfort_match_history.sql` applied; policy/privilege checks passed.
- Signed ingest success and an intentionally invalid HMAC rejection were verified inside a transaction rolled back afterwards, without creating player results.
- Automated tests: refresh, process epoch cancellation, reconnect grace, signed match ingestion, HTTP and browser regressions.
- A real two-user production match and one Render restart should still be tested before claiming production-grade uptime.

## Non-goals
- No new map or game mode; no server-controlled village economy, live battle state migration, ranked leagues or payments.
