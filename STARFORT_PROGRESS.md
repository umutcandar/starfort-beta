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
