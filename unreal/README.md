# STARFORT – native iOS + Android (Unreal Engine 5.8)

**Product target changed: mobile-only native game.** Web, GitHub Pages, Three.js, HTML or browser preview is NOT the game client architecture. Old web implementation is retained as a legacy source of gameplay rules and online service behaviour while native clients are authored; the live web page is not the shipping target.

### What exists in this branch
- `STARFORT_UE58/StarfortUnreal.uproject`: Unreal Engine 5.8 C++ native project scaffold.
- `Source/StarfortUnreal/`: mobile touch orbit/pinch-to-zoom skeletal hero pawn and native game mode.
- `Config/`: horizontal iOS, Android arm64 and mobile-oriented quality profiles.
- `CONTENT_ASSET_REQUIREMENTS.md`: specific sign-off gate to prevent low-poly toy characters being silently shipped.

### How to open
1. Install the Unreal Engine 5.8 Editor and C++ toolchain; open `STARFORT_UE58/StarfortUnreal.uproject`.
2. Import the **actual approved high-detail rigged Royal Gunner** into `Content/Heroes/RoyalGunner`.
3. Create `BP_RoyalGunner` based on `AStarfortMobileHeroPawn`, assign the approved Skeletal Mesh and animations.
4. Create the native showcase map, set a map in project settings, and test on a phone via Unreal's mobile packaging tooling.
5. Build Android arm64 AAB and iOS IPA with appropriate SDK/Xcode signing. **Do not** publish until visual QA and mobile performance checks pass.

### Cautions
- Source code here is a **new mobile-native foundation** and has not been compiled in the Unreal Editor or tested on devices by this assistant.
- It does not itself recreate the photorealistic concept as geometry; a high-quality character creation pipeline and legal asset approval remain mandatory.
- Backend may still use internet APIs; the **game client itself is not web-based**.
