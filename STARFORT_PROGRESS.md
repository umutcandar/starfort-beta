# STARFORT_PROGRESS.md
Date: 2026-11-17
Repository: umutcandar/starfort-beta
Development branch: feat/native-v91-verified-combat-gear
Base main commit: 2ea74c5b341e312eba8369870c72dfdb54678bee

## Implemented
- Native UE skeletal battle stage has three armor components, one per distinct hero rig.
- New UStarfortEquipmentArtManifest DataAsset resolves only existing authenticated server item IDs to soft weapon/armor meshes; unknown/wrong-slot/ambiguous items are rejected.
- Battle controller caches verified inventory and mission before presenting verified turns; gear art paths are streamed asynchronously and actual weapon/armor meshes are attached to the rig (same skeleton mandatory).
- Old gear state clears on mission end, network failure and account signout.
- Verified damage VFX hits follow played montage duration, never predict HP or awards.
- Preserved distinct authored innate weapon and hero mesh quality checks.
- No guest mode added. Existing Supabase RPC remains authoritative.
- Regression tests included in GitHub native source QA; one C++ standalone test compiles the actual art resolver with Unreal header shims.

## Validation and caveats
- Branch CI: native source/legacy web QA must be inspected at current head; previous green runs do not attest to newer commits.
- No installed Unreal 5.8 Editor, UE C++ compilation/UHT, iOS/Android packaging or device profiling in the current container.
- No imported licensed 3D character or matching armor/weapon .uasset assets in current repository. No complete vertical slice or shipping-quality hero.
- Earlier unmerged local v89/v90 ZIPs are separate. Hero Hall continues to show 2D art without their integration.
- Only separate feature branch changed; main not merged or deployed.

## Next verified work
1. UE5.8 UBT/UHT Editor compile for all touched files; repair any real engine/compiler errors.
2. Import one original, commercially licensed skeletal hero + socket-compatible weapon/armor, animation, enemy, authored Niagara and 3 mobile LODs.
3. Assign asset manifests to authored Stage BP and test real authenticated equipment changes and one mission on physical Android/iOS.
4. Bind same DataAsset into a live 3D Hero Hall portrait and production mobile navigation.

## v91 final polish
- Added per-equipped-weapon visual impact socket (do not use the prior weapon's muzzle socket).
- Added equipped item copy-count guard against inventory before any 3D mesh is streamed.
- Allowed visually identical weapons only when both heroes have the SAME authenticated equipped item ID; distinct hero body/innate art quality gates remain enforced.
- See mobile/StarfortUnreal/Docs/Native3DGearSetup_v91_TR.md for editor-only art gates.

## Mac bridge (2026-11-17)
- Added mac_ue_bridge.py to diagnose installed UE 5.8 + Xcode or to compile real StarfortUnrealEditor Mac Development locally.
- Safety: never automatically packages or publishes; `diagnose` never runs Unreal.
- A user-registered GitHub self-hosted runner or a local Mac Terminal invocation is still required for the real compile.
- Do not claim a successful UE Editor build from source-only CI.

## Manual GitHub/Mac runner review
- .github/workflows/starfort-mac-unreal-bridge.yml staged only on feature branch; uses workflow_dispatch and dedicated Mac M1 runner label starfort-unreal.
- Workflow cannot be invoked from GitHub UI until approved on default branch. Do not auto-push to main or run unattended on a Mac.
- Local Mac diagnostic and actual Development Editor build supported via mobile/StarfortUnreal/Tools/mac_ue_bridge.py.
- See mobile/StarfortUnreal/Docs/MacUE58Bridge_TR.md.

## Runner security hold
- Repository visibility verified PUBLIC. The Mac self-hosted runner workflow is additionally gated on github.event.repository.private == true.
- Do not register a personal Mac as a runner for this public repo until visibility and untrusted workflow risks are addressed by the owner.

## UE 5.8 first real Mac Build.sh result — 2026-11-17
- M1 / Xcode 26.0 / native Unreal 5.8 engine found locally at /Users/macbook/Documents/UE_5.8 (user-supplied machine path only).
- First actual UBT invocation stopped with exit code 6 (OtherCompilationError) BEFORE C++ compilation because both targets used BuildSettingsVersion.V5.
- UBT explicitly recommended BuildSettingsVersion.V7; upgraded both Editor and Game targets and pinned EngineIncludeOrderVersion.Unreal5_8.
- No BuildEnvironment.Unique or bOverrideBuildEnvironment workaround, no deployment or main merge.
- Added test_ue58_target_rules_v93.py, run in native QA. UE5.8 C++ still must be compiled on local Mac to verify.

## UE 5.8 real Mac C++ diagnostics 2026-11-17
- After V7 target defaults, compiler reached native source code (25/35 was visible).
- User-provided log tail identifies UE::TSharedString<TCHAR> / FString mismatch at StarfortOnlineSubsystem.cpp:520 and multiple other JSON map key uses.
- Converted JSON object keys explicitly with FString(*Key) before TSet/TMap/FDefaultValueHelper lookups. Maintained server ownership and item validation.
- Fixed NativeWidgetFactory ButtonColumn raw UButton*& against UPROPERTY TObjectPtr<UButton>; changed to TObjectPtr<UButton>&.
- Fixed FStreamableHandle class versus UE5.8 struct declaration in StarfortHeroScreen.h.
- Added source tests; THIS DOES NOT prove UE engine compile passes. A fresh full Mac build is still required; original pasted log is only last 150 lines.

## UE5.8 Apple real build #3 errors (2026-11-17)
- Native Mac UBT log identified two incorrect headers: Engine/SkeletalMeshActor.h. Changed both to Animation/SkeletalMeshActor.h as Epic UE5.8 API documents.
- Bag dynamic multicast declares FString by value, but screen handler took const FString&. Changed handler declaration and implementation to by-value FString (signature match) while preserving the verified inventory checks.
- BagScreen.cpp now includes Components/UniformGridSlot.h so AddChildToUniformGrid(...)->SetPadding has a complete slot class.
- StarfortHeroScreen.h now includes Engine/StreamableManager.h instead of forward-declaring FStreamableHandle, eliminating stale class/struct ambiguity at that header.
- Tests: added test_ue58_real_build_v95.py, source-only CI checks; true UE build must be retried on Mac.

## UE 5.8 real Mac compiler issues v96 (2026-11-17)
- After v95, confirmed UUniformGridSlot has no SetPadding method in UE5.8; previous fix only added the slot header and was insufficient. Changed BagScreen to set UUniformGridPanel::SetSlotPadding(FMargin(3.f,3.f)) and AddChildToUniformGrid without the invalid call. Four-column item grid and authenticated inventory remain unchanged.
- Scanned all 32 native headers and found a remaining incorrect class FStreamableHandle declaration in StarfortBattleStage.h; changed to struct FStreamableHandle to match the Unreal StreamableManager type. HeroScreen.h already includes the full engine declaration.
- Added v96 regressions and corrected v95 assertions. No real Unreal UBT/UHT build done here; only user can run the Mac build and provide new compiler diagnostics.

## Real Mac UE 5.8 Editor target build — CONFIRMED by user log (2026-11-17)
- MacBook Air M1 (ARM64), Xcode 26.0, local UE5.8 installed at /Users/macbook/Documents/UE_5.8.
- Exact user-local Build.sh runner: `python3 mobile/StarfortUnreal/Tools/mac_ue_bridge.py build --ue-root "/Users/macbook/Documents/UE_5.8"`.
- The user pasted the actual tool output: `built: true`, `exit_code: 0`; Unreal build log contains `Result: Succeeded` at line 39. This attests to native StarfortUnrealEditor Mac Development target compilation at branch commit ba35a35bf3805ef75a20da6d38db6c2511f03ebc.
- IMPORTANT: Editor GUI startup, PIE login, village UI, real 3D stage and mobile packaging/device test have NOT been verified yet.
- Current DefaultEngine.ini uses `/Engine/Maps/Entry` for both EditorStartupMap and GameDefaultMap; the git tree has NO native .umap/.uasset content. Blank geometry in the Editor is therefore expected; do not claim original 3D heroes are loaded.
- Next milestone: launch local UE Editor GUI, press Play (PIE), check whether login widget appears and authenticated flow works. Capture screenshot and `Saved/Logs/StarfortUnreal.log` if not.
## Cinematic login redesign (v97) — 2026-11-17
- User shared an actual PIE screenshot of the old login; visually unacceptable: 560×410 basic form scaled to viewport, oversized fields, no game identity.
- Implemented a new code-driven native Unreal UMG login in StarfortNativeWidgetFactory::BuildLogin, 1600×900, SafeZone+ScaleToFit, left typographic fantasy identity and right dark themed sign-in card.
- Preserved authenticated email/password behavior and existing login widget pointers; no guest auth and no backend edits.
- New source tests and setup instructions; Unreal macOS C++ compilation and actual PIE screenshot for v97 remain UNVERIFIED. Previous v96 Mac compilation was successful.

## Ultra Login 3D vertical slice v98 (2026-11-17)
- Added a real Unreal 3D login background actor with greybox fortress, camera, fog, mobile-budget torches, and optional approved hero/audio hooks.
- Integrated login-only camera takeover with village controller and cleanup on sign-in/sign-out.
- Login UI changed from opaque two-column to transparent native UMG overlay; email/password appear only after clicking KRALLIĞA GİR. Existing Supabase auth unchanged.
- Updated v97 source tests, added new v98 source contract and docs. Does NOT prove Unreal editor compile or visual quality for this revision. UE packaged original art and umap not yet present.

## Ultra Login Editor-authored native asset pipeline (v99)
- Unreal Python Editor-only tool now creates L_StarfortLogin.umap and original three native material assets on the user's Mac, idempotently, after successful C++ Editor compile. No .uasset/.umap binary was remotely created in this chat.
- Controller now reuses an authored AStarfortLoginCinematicStage placed in that map rather than duplicating it.
- Runtime 3D stage supports original material overrides for stone, banner and ember pieces; mobile shadows disabled and authentic hero/audio remain optional.
- Script checks for existing level and materials, saves a diagnostic JSON, and backs up DefaultEngine.ini before locally switching the startup map only after saved map success.
- test_ultra_login_authoring_v99.py checks Python AST and source safety contracts in GitHub CI. Mac Engine Editor Python execution remains UNVERIFIED.

- Created and structurally checked original downloadable Starfort Citadel GLB (single consolidated mesh, vertex-colored) in current conversation. GitHub C++ stage now accepts imported citadel mesh/material, and Editor Python auto-imports the downloaded GLB if found locally. The actual imported UE .uasset and in-editor visual QA are NOT confirmed.

## UE 5.8 Apple real build fix — 2026-11-17
- User's real Mac UBT log at StarfortVillageController.cpp:98 reports -Werror,-Wunreachable-code-loop-increment: one-iteration TActorIterator loop breaks before increment.
- Replaced the loop with a one-shot TActorIterator instance plus if(ExistingStage), preserving existing artist-authored cinematic stage selection, while still spawning a stage only if none was placed.
- Updated v99 static regression check to reject the old loop. Real Mac UBT must be rerun by user. The missing GLB in Downloads is a separate file-transfer issue and does not cause this C++ compiler diagnostic.

## REAL Unreal Engine 5.8 Mac C++ compilation — SUCCESS (2026-11-17)
- The user ran branch commit bc232f84d5b484448945dc8d4f73080c010dd6c8 through /Users/macbook/Documents/UE_5.8/Engine/Build/BatchFiles/Mac/Build.sh using mac_ue_bridge.py.
- Verified by user's terminal output: `built: true`, `exit_code: 0`, and native UnrealBuildTool log line 33 `Result: Succeeded`. Host: MacBook M1/arm64; Xcode 26.0.
- GitHub Starfort QA and Native Mobile Source QA also passed for that commit. This attests to the **UE Editor C++ target** compilation; does not establish a launch-ready mobile build or a polished 3D production asset.
- Next user-device checks: fully close/relaunch UnrealEditor, Play on Entry for transparent login CTA/camera and runtime greybox fortress; then run Tools/author_ultra_login_level_v99.py in the real Unreal Editor to create /Game/STARFORT/Login/L_StarfortLogin and optional GLB import. Do not confuse downloaded GLB with GitHub checkout: download must be saved to Mac Downloads manually.
- NOT YET VERIFIED: Editor Python runtime execution, saved .umap/.uasset creation, actual GLB import, visual result, login backend flow and physical iOS/Android gameplay.
