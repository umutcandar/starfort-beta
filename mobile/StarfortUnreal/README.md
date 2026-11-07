# STARFORT Mobile — Unreal Engine 5.8

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
