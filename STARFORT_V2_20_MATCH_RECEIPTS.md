# STARFORT v2.20 — signed match-result receipt recovery (beta)

## Why this change exists
v2.18 stored finished authenticated 1v1/2v2/5v5 match results in an in-memory Render retry queue before Supabase acknowledged them. An abrupt Render restart discarded unconfirmed results.

## Recovery protocol
1. The authoritative server finishes a human-player room and signs its exact immutable result body once with the existing private 256-bit HMAC key.
2. The signed receipt is attached to the authenticated participant's ended-match response. Practice/bot rooms never receive one.
3. The browser stores only received signed receipts in a per-user localStorage queue (maximum 16). A refresh, page revisit or reconnect retries unsent receipts. Submission goes only to the existing Supabase RPC over HTTPS.
4. Supabase recomputes the server HMAC, validates mode/room/users/timestamps and records a result idempotently under (room_id,user_id). A client cannot invent or edit victories, and replaying a real receipt cannot grant a second victory.
5. The existing server-side best-effort retry remains enabled; browser relay provides a second independent chance after the server process disappears.

## Boundaries
- This protects results **only after at least one player receives and stores the signed receipt**. If Render crashes before any client gets it, that result may still disappear. Therefore this is not a durable ranked/cash-prize ledger.
- LocalStorage can be cleared, unavailable or full; browser relay is a recovery path, not authoritative permanent storage.
- Initial DB accepts a signed result within five minutes. A separate DB migration must extend this to seven days before six-day client recovery can reliably work; do not claim long-window recovery until migration is applied.
- Active combat still lives in Render RAM and is cancelled on process restart rather than resumed.
- No new match rewards, paywalls, authoritative village economy or rank points are enabled.

## QA coverage
The new match-receipts-v220 test suite covers restart/reload relay, HMAC integrity, duplicate no-op, expiry, account isolation, failed writes, server retry and anti-forgery. Existing v2.18 lifecycle and full Chromium smoke tests remain.
