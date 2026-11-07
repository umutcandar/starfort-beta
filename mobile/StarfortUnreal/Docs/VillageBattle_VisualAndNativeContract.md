# STARFORT — premium native mobile village and battle interface

**Platform:** Unreal Engine 5.8, native iOS/Android in landscape. This spec continues the approved gold-and-navy Royal Gunner hero screen. No WebView, Three.js, web-player embed or low-poly placeholder as the final visual.

## Visual system
- Visual palette: `UStarfortVisualTheme` gold (royal highlights), deep navy (negative space), dark panel navy, bright sapphire (energy), crimson (banners/capes), verification green (confirmed buffs only).
- Deep metallic PBR plates, physically grounded stone walls, sculpted wooden scaffolding, atmospheric distant mountains, large fortifications and restrained glowing blue magic.
- Vertical hierarchy: readable buildings first, resources and construction status second, cinematic ambience behind.
- 48 dp minimum touch targets; safe zones on both iOS and Android; design and performance checked independently at 16:9 and 19.5:9 landscape sizes.

## Native village
- `AStarfortVillageGameMode` + `AStarfortVillageController` + `AStarfortVillageCameraPawn` are the new map-specific native entry. A future real UE map `L_StarfortVillage` must be authored in Unreal Editor. **No packaged map is present yet.**
- One-finger drag pans the isometric camera. Pinch zoom is clamped. Tapping an approved 3D building emits its server ID and highlights the actual mesh only.
- `AStarfortVillageBuilding` demands **explicit** `bArtApprovedForMobile` and nonempty building ID, a static mesh and a material slot. Art review must verify silhouette, real PBR textures, LODs, collisions and frame rate before setting that flag.
- `UStarfortVillageScreen` (native UMG) shows real village name, gold, wood, stone, star essence, building level and availability returned through an authenticated server adapter.
- Layout: top slim royal resource bar ~9% height; left ~12% quick navigation; center/world ~62% for interactive isometric village; right ~26% selected building cards; lower dock ~11%. Overlap fractions denote responsive zones, not strict fixed pixels.
- `WBP_VillageHUD` must inherit `UStarfortVillageScreen` and bind widgets `TxtVillageName`, `TxtGold`, `TxtWood`, `TxtStone`, `TxtStarEssence`, `TxtBuildingName`, `TxtBuildingLevel`, `TxtConnectionStatus`, `BtnUpgrade`, `BtnHeroes`, `BtnBattles`, `BtnAlliance`.
- `BP_StarfortVillageController` inherits `AStarfortVillageController` and sets `VillageScreenClass=WBP_VillageHUD`; configure that Blueprint in the village GameMode. Nav delegates need actual map transitions after network/account lifecycle is ported.
- Drag and building taps are constrained to the unoccluded central region to avoid the main HUD. Any modal must disable world touches with `SetWorldInteractionEnabled(false)`.

## Native battles
- `UStarfortBattleScreen` is the battle HUD data contract. Bind `WBP_BattleHUD` to HP bars, confirmed damage, battle state and tactical actions. Available IDs reflect existing STARFORT server contract: `strike`, `guard`, `feint`, `rally`, and `skill:<id>`.
- Only authenticated snapshots set `FStarfortVerifiedBattleTurn`. The C++ bool is not cryptographic verification: the future authenticated API adapter must validate the response and ownership *before* setting it.
- Only a server-listed action can be dispatched. Pressing a skill disables further actions pending a newer confirmed turn; lost connections reset the HUD instead of inventing outcomes. The application must dispatch `OnActionRequested` through a secured existing API.
- `AStarfortBattleStage` is a native Unreal cinematic 3D scene presenter with separate hero/enemy skeletal mesh sockets, an actual authored energy cannon, a Niagara muzzle effect and a 3/4-angle camera. It plays a shot only after a newer accepted server turn; it never computes damage locally.
- The stage starts **blank** without quality-approved rigs/weapon. There is intentionally no toy fallback. Authored real mobile arena art, combat rig animations, enemy skills, audio, network dispatch and real device optimization remain required.
- Layout: battle arena is the main central view, small server-verified HP/turn overlays at top, verified tactical command bar bottom; allow finger-accessible 48 dp controls, non-blocking 3D hero and readable damage.

## Artistic asset gates, not optional
1. Royal Gunner + enemies: actual textured skinned 3D character meshes, PBR textures, authored idle/run/fire/special/hit/death clips, socket-correct weapon, valid in Unreal 5.8, artist-reviewed visual parity against the approved hero screen.
2. Fortress props: realistic castle keep, walls, gates, training grounds, farm, barracks, forge, research tower; each approved individually. Do not reuse primitive cube house meshes for shipping.
3. World dressing: instanced foliage/rocks, lighting, atmospheric effects with LODs and mobile-friendly overdraw; emissive effects limited by phone GPU budgets.
4. Retain a server-authoritative backend and account migration. Upgrades, rewards, premium items, combat HP and anti-cheat must be calculated by the server.
5. Build with Unreal Editor, compile on target engine, make actual Android/iOS packages, perform GPU profiling on multiple low/high-end devices. **CI here checks source strings only and does not prove UE compile or visual quality.**

## What exists in this PR / what does not
**Added code:** shared palette, 3D village building selection and camera, authenticated village HUD contract, native village map GameMode/controller, verified tactical battle HUD, and a quality-gated cinematic battle presenter.

**Not yet present:** authored Unreal `.umap`, Widget Blueprints (`.uasset`), licensed cinematic castle/hero models, full native server adapter, mobile installation builds or verified screenshots from real Android/iOS devices. The former web app remains as legacy reference and is not the native client.
