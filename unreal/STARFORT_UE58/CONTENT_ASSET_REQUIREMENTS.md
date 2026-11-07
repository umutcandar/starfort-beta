# STARFORT – Native mobile hero asset acceptance

## Design master
The previously agreed Royal Gunner concept is the **visual specification**: realistic face, human proportions, gilt engraved layered armour, cardinal-red cape, sapphire-blue reactor, large ornate rifle/cannon, no block geometry.

## Required before anyone calls this game-ready
- Rigged, fully skinned FBX or GLB (Unreal import converts to .uasset), licensed for commercial mobile games.
- Sensible real-human anatomy and **UV-mapped PBR textures**: albedo/base colour, normal, ORM or roughness/metallic, emissive.
- Meaningful sculpted torso, face, gauntlets, boots, plate layering and engraved detail; **high-poly offline sculpt followed by mobile retopology**.
- Character mobile LOD0 target **30k–100k triangles** for one hero closeup; LOD1/2/3 needed in Unreal; final budgets must be measured on representative mid-tier devices.
- At least **50 deforming bones** with correct left/right hands and stable weapon socket; named Idle, Walk, Run, Attack, Hit and Death action clips, with recoil and weapon follow-through authored for the rifle.
- Blue emissive reactor core and energy muzzle effects (Niagara), plus sound, hit reaction and grounded footsteps. A reference render or picture alone fails.
- No art accepted merely because it has many triangles: human visual review must compare face, silhouette, armour, weapon, textures, lighting, animation, cloth motion and effects at phone-screen size.
- Browser-only Three.js figures, sprite GIFs, cardboard 2.5D, rigid cubes and prior low-poly GLBs are **explicitly excluded**.

## Mobile platform strategy
- **Android:** native arm64 build (AAB for Google Play), Vulkan-capable path where available; device profile scalable.
- **iOS:** native signed IPA, Metal, Xcode on Mac and Apple signing; iOS real hardware review required.
- Mobile Deferred shading baseline; baked/lightmapped GI + reflection captures where feasible, dynamic lights budgeted. **Nanite/Lumen are NOT guaranteed mobile features** and the UE5 desktop renderer must not be assumed to run on iPhone.
- Landscape 16:9/19.5:9 adaptive UMG HUD, safe areas and touch interactions. No mobile gameplay dependent on a webview.

## Release blockers (not finished as of this project skeleton)
1. Obtain/author/reference-match and legally clear the **actual** hi-fidelity rigged Royal Gunner model and action clips.
2. Import into Unreal Editor and assign the approved skeletal asset to a Blueprint subclass of `AStarfortMobileHeroPawn`.
3. Create a native `/Game/Maps/MobileShowcase` level and set as default, along with UMG display and optional demo action logic; the current default is only an engine placeholder map.
4. Integrate existing server-authoritative combat/account/progression via a vetted native client API (no browser DOM/Three.js).
5. Build/package/sign/launch Android and iOS on actual devices; profile FPS, memory, thermal throttling and crashes. There is **no verified APK/IPA or playable Unreal build yet**.

Do not describe this scaffolding as a finished gameplay port.
