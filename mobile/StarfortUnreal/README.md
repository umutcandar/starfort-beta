# STARFORT Mobile — Unreal Engine 5.8

## Native tactical combat v67 — meaningful hero skills and wave alerts

The existing authoritative SQL battle has 3 enemy waves, enemy intent hints, 3 individually cooldown-limited hero skills, rally cooldown and a minimum action interval. The previous mobile UMG HUD did not expose those mechanics. The new native `FStarfortVerifiedBattleTurn` and `UStarfortBattleScreen` now show **wave number, telegraphed enemy intent, all three named skills with individual cooldowns and live action readiness**, reading server state rather than inventing abilities.

`AStarfortBattleStage` now exposes distinct artist-assignable fire, guard, feint, rally and special attack montages, played only for **server-confirmed** turns. No animations or high-resolution 3D assets are shipped yet, so this is **code/QA interface functionality**, not a polished battle replay. See `Docs/TacticalCombat_v67_TR.md` for action logic and remaining real-device acceptance criteria.

## First launch and test on real Unreal builds — v66 source milestone

The native bootstrap now starts the actual account/village GameMode in the engine Entry map, not an empty hero preview. `FStarfortNativeWidgetFactory` constructs responsive gold/navy UMG login, village, campaign, battle and hero QA panels **without** needing Widget Blueprints. Authored visual Blueprints take priority when present. A real sign-in, server-owned resources, retry/logout and first menus can therefore be compiled for a phone once UE+SDKs are available.

`Tools/create_native_maps.py` generates 4 genuine Unreal `.umap` worlds *inside the editor*, with correct GameMode overrides and no fake blocky castle/mannequins. `Tools/native_mobile_build.py` builds smoke APK/IPA using installed Unreal UAT and mobile SDKs. `--dry-run` means **no executable is built**. `--profile release` blocks on missing art, maps, Widget Blueprints and device evidence.

**There are still no produced or tested IPA/APK binaries, production-quality licensed 3D heroes/fortress assets, or authored visual UI.** Source-only CI passing is not proof of engine compilation or phone compatibility.

Full setup and verification instructions: `Docs/FirstNativeBoot_TR.md`.

## Native story campaign and real battle loop — latest milestone

`UStarfortCampaignScreen` now presents eight authenticated story chapters and 1–3 server-issued campaign stars. `AStarfortBattleController` and `AStarfortBattleGameMode` bind this to a native UMG battle HUD and a licensed 3D Unreal stage once its Blueprint assets exist.

`UStarfortOnlineSubsystem` now supports actual `mission_start`, `mission_turn`, `mission_abandon` and `hero` RPC actions against the **existing** Supabase account. Mission identity, HP, max HP, round index, result and stars are parsed from the server response. Unsupported actions, stale requests and duplicate in-flight mutations are rejected. No local reward, battle damage or hero level is invented. Uncertain mutations reconcile with a read-only `get` instead of replaying the operation.

Rovan's native hero screen consumes his server-backed level through `ApplyVerifiedRosterLevel`. Attack/defense/rarity values remain **unavailable** until a real authenticated detailed-stats API is added. No guest mode.

**Important:** These are native C++/UMG controller and data contracts. Real Unreal `.umap`/Widget Blueprints and the high-quality 3D assets have not been created or compiled; the app is not yet playable on a phone. The authoritative missing-work and release criteria are in `Docs/MobileFullGameMilestones_TR.md`.

## Authenticated native account bridge (current source milestone)

The new `UStarfortOnlineSubsystem` connects **directly from Unreal C++** to the same Supabase Auth and server-owned village/progression RPCs used by the legacy client. It implements in-memory sign-in, bearer validation, expiring-token refresh, immutable account identity per request, authenticated village loading and server-issued building upgrade requests. The village HUD reacts to validated responses only; unknown network outcomes are not retried with a fresh idempotency key.

`UStarfortLoginScreen` and `UStarfortSceneRouter` prepare native UMG login and transitions to authored UE maps. The router deliberately rejects missing maps. `ContentPipeline/required_premium_assets.json` defines 12 required premium-quality 3D art deliverables. `python3 Tools/validate_premium_art.py --release` stays red until licensed textured models, LODs, reviewed animations and mobile device evidence exist.

See `Docs/NativeAccountBridge_TR.md` for setup, authentication limitations, source contracts and remaining work. **No APK/IPA, UE Editor compilation, credential persistence, social OAuth, finished UMG Blueprints, production art or live-device verification has been performed.**

## Native premium village and cinematic battle — development update

The Unreal C++ source now also contains:
- UStarfortVisualTheme: shared gold, navy, sapphire and crimson design tokens for the approved hero-screen visual language.
- AStarfortVillageGameMode, AStarfortVillageController, AStarfortVillageCameraPawn, and AStarfortVillageBuilding: a native isometric world with drag/pinch and tap-to-inspect 3D buildings.
- UStarfortVillageScreen: read-only authenticated village UI including resources, building details and server-request-only upgrades.
- UStarfortBattleScreen: tactical combat HUD with server-listed strike/guard/feint/rally/skill action IDs, single-flight commands and verified HP.
- AStarfortBattleStage: Unreal camera/mesh presenter with Niagara FX triggered only by a new server-confirmed hit.

**These are C++ entrypoints, not finished production screens.** Real Unreal .umap fortress/battle arenas, Unreal UMG Widget Blueprints, artist-approved buildings, rigged hero/enemy models, an authenticated native API adapter, and iOS/Android test builds are pending. Read Docs/VillageBattle_VisualAndNativeContract.md to author levels and interfaces. The previous web version remains untouched, but it is not the intended new client.

**Target:** native iOS / Android landscape game. **Not a website, WebView, HTML game, or Pixel Streaming product.**

This new Unreal 5.8 C++ project is the beginning of the mobile-only migration. It contains a native GameMode, a skeletal-mesh Royal Gunner showroom Pawn, touch orbit/pinch, a gun mesh and Niagara effect attachment, mobile renderer/device settings and a quality gate. Missing real character assets deliberately remain invisible rather than displaying a toy low-poly substitute.

**Not yet a playable game or IPA/APK.** Unreal Editor/Android SDK/Xcode are unavailable in this automation environment, so the code has not been compiled or tested on physical phones. The photoreal Royal Gunner rig/textures and gameplay/account/social/commerce migration are incomplete.

## Setup
1. Install Unreal Engine 5.8 and the C++ build environment. Android uses SDK/NDK; signing a final iOS build requires Mac/Xcode and Apple developer provisioning.
2. Open `StarfortUnreal.uproject`. Generate/compile project code.
3. Commission or create a production-quality licensed character to match the Royal Gunner design. Deliver a skinned mesh, original cannon mesh, PBR textures, and actual motion assets (idle, locomotion, aim, fire, hit and death). Run `python3 Tools/check_glb_quality.py <rigged-hero.glb>`; passing only means structural compliance.
4. Create Blueprint `BP_RoyalGunnerPreviewPawn` derived from `ARoyalGunnerPreviewPawn`. Assign HeroBody, RoyalCannon, ShotMontage, MuzzleSystem, and `weapon_r`/`muzzle` sockets. Build a native showroom map `L_RoyalGunnerStudio`, configure lighting and set it as startup.
5. Verify at 30/60 FPS on multiple actual iPhone/Android devices and optimize LODs/materials. Complete server-authenticated native village/battle/social UI and progression migration **before** declaring mobile release.

**Boundary:** Existing STARFORT JS/Web sources are *reference logic only* for the port. The backend will remain server-authoritative for authentication, resources, combat, rewards and purchases. When native feature parity is established, web-player distribution can be retired without deleting player accounts. Web deployment isn't considered the mobile app.

The two Royal Gunner artistic concept PNGs are supplied in the downloadable ZIP, not as approved Unreal meshes. The former generated GLB had 0 skins, 0 animations and 0 texture maps despite ~256,446 triangles; it cannot be used as a game-ready hero.

Mobile settings deliberately avoid desktop-only Nanite/Lumen. Lumen is not supported on iOS and only experimental on select Android hardware. This template uses mobile deferred and conventional shadows: https://dev.epicgames.com/documentation/en-us/unreal-engine/mobile-rendering-features-in-unreal-engine
