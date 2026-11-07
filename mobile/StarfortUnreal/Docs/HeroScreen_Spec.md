# STARFORT mobile hero screen — visual and implementation contract

**Platform:** native Unreal Engine 5.8, iOS/Android landscape orientation, UMG + 3D SkeletalMesh (not HTML/Three.js/WebView). A screenshot-style reference was created in chat, but the game-ready 3D character asset and authored UMG Widget Blueprint are **not yet built**.

## Approved visual direction
- The Royal Gunner remains an anatomically proportioned blond adult with sculpted face, elaborate gold/silver plate armour, deep crimson cape, and very large blue-energy firearm.
- Warm gold ornaments, dark navy HUD, blue charged effects, detailed fortress background and cinematic three-point lighting.
- Landscape phone safe-area UI; do not reproduce the prior small toy-looking mannequin.
- Hero roster at left; live 3D camera in centre; verified stats/gear/skills and enhancement UI at right; navigation tabs at bottom.
- Concept image uses **fictional placeholder levels/stats/currency** for composition. Do not place those amounts in production. On a new account, receive values from a validated authenticated server response.

## Native screen wiring
1. In the UE Editor, build Widget Blueprint `WBP_HeroScreen` inheriting `UStarfortHeroScreen`, using Canvas Panel, Scale Boxes and Safe Zone.
2. Add optional named widgets: `TxtHeroName`, `TxtRarity`, `TxtLevel`, `TxtAttack`, `TxtDefense`, `TxtHealth`, `TxtSpeed`, `TxtShardCount`, `TxtConnectionStatus`, `ProgressShards`; action buttons `BtnInspect`, `BtnFirePreview`, `BtnBack`, `BtnUpgrade`.
3. Create `BP_StarfortMobilePlayerController` from `AStarfortMobilePlayerController` and set `HeroScreenClass=WBP_HeroScreen`. Set it as PlayerController on the GameMode Blueprint. C++ GameMode already uses this controller class.
4. Assign actual approved `HeroBody` skinned rig and `RoyalCannon` plus `ShotMontage`, `MuzzleSystem`. Without them the visual quality gate intentionally hides the missing model.
5. When the authenticated server returns a verified hero snapshot, adapt the response to `FStarfortHeroSnapshot` and call `ApplyVerifiedHero`. Do not set `bServerVerified=true` on a client-only guess: this flag denotes the result of the real authenticated API validation.
6. Bind `OnUpgradeRequested` to an authenticated server action (cost, cooldown and transaction checks live on the server); never update local level/shards as if granted. `OnFirePreviewRequested` is cosmetic and plays no damage.
7. Each resource counter, item slot, skill and star must also bind to server-verified data before release. Current class covers primary hero stats only, not complete combat UI.

## Layout guide for 19.5:9 and 16:9 landscape
- Top bar height ~7%: app title, currency, user controls.
- Hero roster left column 8–11%; large tap targets.
- 3D stage takes ~45–50% centre width. Drag to orbit, pinch to zoom. Avoid placing HUD over the face or muzzle.
- Right panel 38–42%: hero name, rarity, progression, six equipment tiles, stat list, ability row, shard progression and upgrade.
- Navigation bottom height ~11% with touch targets at least 44 pt logical equivalents. Anchor to device safe area, avoid camera notch/cut-outs.
- Rework sizes under actual DPI and device profiles rather than hard-coding screenshot pixel coordinates.
- The model remains a 3D mesh under UMG, not a rendered hero PNG. A 2D illustration may be used only as clearly labelled concept art.

## Validation
Current CI uses static source tests only. A real UE 5.8 compile, UMG Blueprint implementation, imported production asset, 30/60fps phone performance, API integration and physical-device screenshot comparison are still required. Do **not** claim the image is a frame from the built app.
