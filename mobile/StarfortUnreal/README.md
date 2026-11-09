# STARFORT Mobile — Unreal Engine 5.8

## v85 — Server-selected three of seven REAL user-imported free Fab rigs

The v84 Development-only bridge now accepts **4–7 distinct original Fab source SkeletalMeshes** instead of only one hard-coded team. It validates seven canonical roster IDs, each source namespace, unique genuine rig and matching original idle/attack clips; selects the **exact authenticated three heroes** and one **different unused real mesh as a temporary opponent stand-in**, hides all unused gallery actors and restores actor transforms on room change/log-out. Enemy source art is never represented as the final STARFORT enemy. The actual imported attack length governs cinematic timing; there is no local damage, result, XP or purchase simulation.

The pure native C++ unused-rig selection helper is standalone compiled and exercised for **all 35 unordered 3-of-7 combinations**, including when the server selects Doran/Khaimera as a player hero. User-owned real Epic/Fab files and UE5.8 compilation/physical mobile device QA remain prerequisites; static GitHub QA is NOT proof of a mobile playtest. Shipping hero art gates stay unchanged. Turkish install/troubleshooting: `Docs/DynamicSevenHeroFabServerBattle_v85_TR.md`.

## v84 — Real authenticated server turns on genuine free Fab 3D rigs (Development-only)

`AStarfortFabVerifiedBattleBridge` is an opt-in non-shipping visual renderer attached to the **real native** `L_StarfortBattle` map. It binds four distinct user-owned Epic/Fab Paragon SkeletalMesh assets and their hard-referenced same-skeleton idle/attack sequences. `AStarfortBattleController` forwards only the existing online subsystem's `FStarfortVerifiedBattleTurn` to this optional renderer. A first snapshot only shows authentic rigs at idle; only a **new confirmed server turn** can trigger a matching real hero strike/special. Real lost HP is required for the enemy counter animation. Mission end, log-out and level teardown clear the assets and camera. Server-owned HP, mission outcome, rewards, skills, cooldowns and existing battle UMG remain untouched.

A local real Unreal Editor tool `Tools/STARFORT_CANLI_FAB_3D_KUR.py` stages selected, license-accepted real Fab source assets into a backed-up development copy of `L_StarfortBattle`; it refuses missing assets, same-skeleton clip failures, existing review actors and a production-approved art stage. No Paragon binaries are added to the GitHub repo. Only the local UE 5.8 editor, device signing and a real server login can demonstrate the full effect. A local development-art audit report additionally **blocks a Shipping build until the temporary demo actors are removed and the level reviewed**, and the actor's rendering is permanently disabled at compile time in Shipping.

Read `Docs/VerifiedLiveServerFab3DReview_v84_TR.md` for the full Turkish setup steps and the important distinction between actual server battle and temporary third-party visual art. Source-only GitHub QA does **not** prove UE5.8 compilation or phone testing.

## v83 — Native touchscreen + private Fab mobile 3D development build gates

Real Unreal `BindTouch(IE_Pressed)` is now wired to the **same landscape hit rectangles as the Canvas HUD and desktop mouse** for the seven hero selection buttons, authentic 3v1 animation preview and camera controls. On physical touch devices, synthetic duplicate mouse events are ignored; landscape/notch margin and compact touch buttons replace the prior screen-filling overlay. Standalone source CI actually compiles and exercises the shared pure C++ hit-test logic on two landscape resolutions.

A strictly opt-in `Tools/native_mobile_build.py --profile private-preview` profile can **locally attempt** a Development-only iOS/Android package of the two real user-imported Fab `.umap` previews. It refuses missing Fab license acknowledgement, missing actual Editor asset audit, absent UE-created maps, toolchain SDKs or an existing `UECommandLine.txt`. It temporarily sets Unreal's documented mobile command-line map URL and removes it even on normal BuildCookRun failure; regular smoke/retail releases neither cook nor route to private Fab worlds. Mac launcher: `STARFORT_OZEL_3D_MOBIL_KONTROL.command`.

The original 23m PBR ash GLB arena importer now audits real Unreal StaticMesh bounds to choose `1x` if Interchange already converts meters to centimeters, otherwise `100x`, failing closed for unknown bounds rather than planting a 100x mismatched arena. Tests are runnable without UE, but **nothing here means that the UE5.8 C++ Editor compiled, Epic/Fab packs were acquired, a phone was tested or an APK/IPA already exists**. Turkish guide: `Docs/PrivateMobileFabDevicePreview_v83_TR.md`.

## v82 — Real user-imported 3-v-1 private combat animation director

The free Paragon editor-only battle review now waits in real imported **idle** poses and plays **three individually rigged ally attack clips in sequence** when Q is pressed. E tests only the actual opponent's keyed native attack, B switches between 3+1 battlefield and hero cinema cameras, and actors return precisely to their original positions after a bounded authored-motion step. HUD reports imported 3+1 count and actual demonstrated clips; there is **no fake damage, invented attack clip, HP, loot, progression or online RPC**. A real editor-only QA script validates exactly 3 ally rigs + 1 opponent, one camera, original scene GameMode and matching imported skeleton/animation paths.

Source and contract tests are wired into Native Mobile Source QA. The real Epic/Fab content is **not** downloaded into GitHub; the user's UE5.8 Editor, accepted EULAs, installed Paragon files and actual editor playtest are required. No UE compile or Android/iOS package is claimed. Turkish walkthrough: `Docs/ThreeHeroFabPrivateCombatDirector_v82_TR.md`.

## v81 — Interactive 7-slot real Fab hero + 3v1 camera/animation preview

The user-only Unreal Editor preview now has a dedicated offline native `StarfortFabPreviewGameMode`, `StarfortFabPreviewController`, and a cinematic `StarfortFabPreviewHUD` with **seven canonical hero selectors**, mouse + keyboard input, camera orbit/zoom, and *real imported same-skeleton* Paragon idle/attack animation switching. The actual saved SkeletalMeshActor tags connect the Editor's audited native AnimSequences to the PIE runtime inspector. An absent attack animation stays missing instead of being fabricated.

The two v80 private maps remain separated from actual STARFORT battle maps and shipping cook lists; the inspector has **no Supabase, health, loot, mission, or economy calls**. No Fab license acceptance/download, UE 5.8 compilation, actual .umap imports, phone testing or Android/iOS package creation can be assumed from source CI. See `Docs/InteractiveSevenHeroFabPreview_v81_TR.md`.

## v80 — Local seven-hero Epic/Fab private 3D preview (no credits)

The free Paragon Wraith, Greystone, The Fey, Serath, Khaimera, Countess and Aurora asset listings are now mapped to STARFORT's seven stable server hero IDs for a **private visual review only**. After the user accepts the EULAs and adds the real packs to the local UE5.8 project, `Tools/STARFORT_7_KAHRAMAN_TARA.py` finds actual compatible SkeletalMeshes and native animation clips. Once the user confirms the local selection and license flag, `Tools/STARFORT_7_KAHRAMAN_KUR.py` creates TWO isolated `.umap` maps: a full-body hero gallery and a **3-v-1 animated cinematic lineup**. The original STARFORT v79 authored PBR arena is included automatically **if** its SHA-verified local GLB is available. Real Fab textures and models are never pushed to GitHub.

These are real 3D characters when user-imported, but only their initial Paragon appearances, not original STARFORT royal armor. **No Epic packs are already installed in this GitHub source tree, no server battle is simulated, and no playable APK/IPA is produced by source-only CI**. Private maps are neither production maps nor included in mobile cook lists. Release art gates stay intact. Turkish install steps: `Docs/PrivateParagonSevenHeroPlaytest_v80_TR.md`.


## v77 — FREE AAA Fab character bases, REAL Unreal Editor 3D review scene

We verified **four actual Epic/Fab free Unreal character asset listings** as high-quality 3D starting points: Wraith for Rovan (gunner base), Greystone for Aldren (knight/shield), The Fey for Lyra (caster), Countess for Vesper (dual-blade duelist). These are **NOT final STARFORT character designs**. They require original face/armor/weapon/FX work, artist approval and mobile performance testing.

Once the developer accepts the individual Fab EULAs and adds all four packs **locally** to their Unreal 5.8 project, `Tools/fab_character_review.py --scan` discovers actual rigged `SkeletalMesh` assets under the imported Paragon namespaces and writes candidate paths. The artist verifies the four selected meshes in `Saved/QA/fab_hero_selection.json`; `--stage` then authors a **new isolated real `.umap` review level** using four actual SkeletalMeshActors, lights and a camera. It never marks art production ready, overwrites the gameplay worlds or changes players' progression.

The GitHub repository intentionally contains **no third-party model packages**, since Fab standalone redistribution is not permitted. `Content/Paragon*/` and other licensed incoming content are gitignored; `Tools/audit_public_asset_hygiene.py` rejects accidental public uploads. Offline mocks test source selection, all four real skeletal mesh paths, editor level orchestration and failures. The tools cannot make real meshes appear until Fab packs have been imported in an actual UE Editor, which is not available in this session. Detailed setup: `Docs/FabAAA_RealHeroReview_v77_TR.md`.

## v76 — Server-verified cinematic battle director and individual hero VFX

Battle effects now have **five bespoke Niagara slots per hero** (strike, guard, feint, rally, special), in addition to existing unique animation montages. `AStarfortBattleStage` attaches shield and rally aura systems to the character's actual skeletal rig instead of a weapon muzzle, while strike, feint, and special FX stay at the corresponding authored weapon socket. The animation/VFX/voice never fall back to the older shared toy animations.

The 3D scene camera smoothly interpolates **field of view, spring arm distance, focus point and angle** for guarded stances, three-hero rally framing and hero-specific ultimate shots (including Rovan, Aldren and Vesper). A **server-confirmed hit** produces enemy impact Niagara and montage after a 0.28s cosmetic beat, not immediately after a button press. Timers are cancelled on room/account/team changes and stale callbacks reject mismatched turn/room/generation; unknown action strings are ignored. The same authenticated server still controls damage and victory.

**These are source-code improvements only:** no real 3D hero production meshes, Niagara UAssets, UE Editor builds, physical mobile tests or app delivery are represented as complete. The art-quality gate becomes stricter (five actual authored FX assets required) and cannot be faked with 2D hero PNGs. See `Docs/CinematicBattleDirector_v76_TR.md`.

## v75 — Safe one-command cinematic asset install and async UI textures

The original v74 **28-PNG binary ZIP** has now been checked against its SHA-256 manifest and verified as genuine decodable PNG art. New `Tools/install_cinematic_hero_art.py` finds the ZIP in `~/Downloads`, validates every image's manifest identity, SHA-256, PNG CRC/IEND, size and safe paths, and copies the originals into `ContentPipeline/Incoming` **without overwriting an artist's existing different file**. Then use `python3 Tools/import_cinematic_hero_ui.py --check` and the actual Unreal Editor import.

The native hero UI now calls `UAssetManager::GetStreamableManager().RequestAsyncLoad` for **only the selected character's seven textures**. Hero change or viewport teardown cancels stale loading callbacks; a pending Rovan request can't replace Lyra's portrait. Previously synchronous `TryLoad` is removed to reduce iPhone/Android game-thread stalls.

Additional CI `Tools/test_cinematic_hero_install.py` exercises all 28 installs, SHA and CRC corruption rejection, ZIP path traversal, file clobber prevention and missing art detection; source tests assert runtime async behavior. **No new Unreal `.uasset`, high-fidelity 3D hero rig or compiled APK/IPA is produced here.** See `Docs/CinematicHeroes_v75_InstallAndStreaming_TR.md`.

## v74 — Four cinematic hero artworks wired into native UMG

The mobile hero selector now has **Rovan, Aldren, Lyra and Vesper** buttons, authored 2D cinematic splash/card/portrait slots and four illustrated skill concepts per hero (16 icons). A selected hero's displayed level and training are taken only from the authenticated **correct** `FStarfortProgressSummary.HeroLevels` entry, never local mock stats. The low-quality old Rovan preview rig is hidden; no false 3D animation button. `Inspect` switches between real imported splash and card artwork.

`Tools/import_cinematic_hero_ui.py` verifies a **separately supplied 28-PNG artwork package** (SHA-256, binary PNG, dimensions) and imports it as `UTexture2D` inside Unreal 5.8, without overwriting other artist assets. Dynamic sprite paths are explicitly cooked by `Config/DefaultGame.ini`. The 28 binary source images are delivered separately in `STARFORT_v74_Unreal_Gorsel_Entegrasyon.zip`; they are **not yet committed as Unreal .uasset files**. See `Docs/CinematicHeroes_v74_TR.md` for the exact extraction/import workflow.

**This is functioning source-level native selection/2D UI integration, not four finished 3D character meshes or a compiled mobile app.** UE Editor compilation and on-phone tests still required.

## Seven redesigned cinematic 3D heroes — v71 source milestone

The player-facing roster keeps the **same seven server IDs and all saved progress**: Aldren, Lyra, Rovan (the approved gold/blue Royal Gunner), Mira, Doran, Vesper and Eira. `ContentPipeline/hero_redesign_v2.json` defines seven independent cinematic PBR character designs and the exact source-package contract.

Native `UStarfortHeroCombatAsset` **refuses all legacy placeholder art**: it needs visual generation 2, independent real-art approval, a rig, five unique character montages, an AnimBP, weapon, Niagara, sound and mobile LODs. The old **shared generic montage fallback** is removed from `AStarfortBattleStage`. `Tools/validate_hero_v2_models.py` inspects actual GLB bytes for real skin weights, keyed animations, embedded PBR textures and 3 LODs; `Tools/stage_hero_v2_in_unreal.py` prepares importing actual, checked packages into isolated Unreal staging folders.

**None of the new real skinned character files have been created yet.** Previous web portrait/sprite files are retained only to avoid breaking the running web client, but are forbidden as native replacement geometry. The connected generation library has no completed 3D assets and the prior external 3D generation was billing-blocked; this repo change does not imply Unreal compilation, art signoff or phone playtest. See `Docs/SevenHero3DReplacement_v71_TR.md`.

## Native session, navigation and network recovery — v70

Map transitions now detach the Village, Battle and Hero PlayerController delegates from the persistent Supabase GameInstance subsystem, avoiding stale listeners and account-data mixups. Expired sessions in battle/hero worlds route back to the native login entry instead of a blank scene. Verified village resources remain visible **but explicitly stale/read-only** during temporary network failures. Battle UMG offers a `SUNUCUYU YENİLE` control that only fetches current progress (`get`), never repeats an uncertain attack. Pending progress requests now report a recoverable error rather than silently leaving UMG buttons locked. Hero Back can return to the native entry village when a full 3D map has not yet been authored.

Documentation and on-device regression scenarios: `Docs/NativeNavigationAndRecovery_v70_TR.md`. This is native Unreal source only—UE Editor compilation, production art and physical iOS/Android tests remain pending.
## Non-blocking three-hero 3D art and real editor QA — v69

Three approved hero Data Assets now load through UE's asynchronous `UAssetManager`/`FStreamableManager` API, not blocking `LoadSynchronous()` on the battle render/game thread. Generation-scoped cancellation and account/room validation reject stale callbacks and suppress historical combat replays. `AStarfortBattleController` no longer duplicates a placed battle actor when a designer assigns a different BP stage subclass.

The source tree now includes **actual Unreal Automation Framework C++ tests** under `STARFORT.Native` plus `Tools/run_editor_qa.py` to run the installed engine and verify its real JSON report. `Tools/editor_visual_preflight.py` runs *inside* the Unreal Editor and deliberately blocks visual release if authentic approved maps, widget assets, 7 licensed rigged hero Data Assets, 18 production art items or real device evidence are missing.

These engine tests are **not executed in GitHub source-only CI** (Unreal Engine and SDKs are absent). The final compiled project, art, animation clips and TestFlight/Android APK remain pending. See `Docs/AsyncBattleArtAndEditorQA_v69_TR.md` for exact testing steps.
## Three individually rigged heroes and see-through battle stage — v68

The native battle renderer now supports **three separate skinned heroes**, each bound to the authenticated server roster order and its own weapon mesh, action montages, special Niagara FX and sounds. A named skill plays only on the matching hero. The former full-screen opaque QA battle menu was replaced with a transparent-center HUD so the actual Unreal 3D stage is visible between the top indicators and bottom tactical controls.

Authoring uses `UStarfortHeroCombatAsset` (one licensed PBR rig/weapon/motion asset per server hero) and a quality-gated `HeroArtCatalog` on `AStarfortBattleStage`. The required production art manifest is now **18 entries**, including all seven player heroes. Initial route loading reuses a placed stage or creates the C++ scene, and the Editor map authoring tool places a native three-hero stage.

**No real hero data assets, high-quality meshes, montage files, cinematic environment or physical-device builds are present yet.** Code and static QA do not prove a visual playable app. See `Docs/ThreeHeroCinematic_v68_TR.md` for exact import, asset and test steps.
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

`UStarfortLoginScreen` and `UStarfortSceneRouter` prepare native UMG login and transitions to authored UE maps. The router deliberately rejects missing maps. `ContentPipeline/required_premium_assets.json` defines 18 required premium-quality 3D art deliverables, including all seven playable heroes. `python3 Tools/validate_premium_art.py --release` stays red until licensed textured models, LODs, reviewed animations and mobile device evidence exist.

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
