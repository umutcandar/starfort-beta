#if WITH_DEV_AUTOMATION_TESTS

#include "Misc/AutomationTest.h"
#include "StarfortBattleStage.h"
#include "StarfortBattleScreen.h"
#include "StarfortHeroCombatAsset.h"
#include "StarfortOnlineSubsystem.h"
#include "Camera/CameraComponent.h"
#include "Components/SkeletalMeshComponent.h"
#include "Components/StaticMeshComponent.h"
#include "UObject/UObjectGlobals.h"
#include "Animation/AnimMontage.h"
#include "NiagaraSystem.h"

IMPLEMENT_SIMPLE_AUTOMATION_TEST(
 FStarfortNativeAssetGateTest,
 "STARFORT.Native.Art.StrictHeroAssetGate",
 EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)

bool FStarfortNativeAssetGateTest::RunTest(const FString& Parameters)
{
 UStarfortHeroCombatAsset* Art=NewObject<UStarfortHeroCombatAsset>(
  GetTransientPackage());
 TestNotNull(TEXT("Native hero data asset constructed"),Art);
 if (!Art) return false;
 TestFalse(TEXT("Default hero is not approved"),Art->bArtApprovedForMobile);
 TestFalse(TEXT("Missing mesh/rig/animation is not production-ready"),
  Art->HasProductionReadyGeometryAndMotion());

 Art->bArtApprovedForMobile=true;
 Art->HeroId=FName(TEXT("rovan"));
 Art->AuthoredMobileLODCount=3;
 TestFalse(TEXT("Manual flag and LOD claim alone cannot approve missing art"),
  Art->HasProductionReadyGeometryAndMotion());

 UAnimMontage* Motions[5] = {
  NewObject<UAnimMontage>(Art),NewObject<UAnimMontage>(Art),
  NewObject<UAnimMontage>(Art),NewObject<UAnimMontage>(Art),
  NewObject<UAnimMontage>(Art)
 };
 UNiagaraSystem* Effects[5] = {
  NewObject<UNiagaraSystem>(Art),NewObject<UNiagaraSystem>(Art),
  NewObject<UNiagaraSystem>(Art),NewObject<UNiagaraSystem>(Art),
  NewObject<UNiagaraSystem>(Art)
 };
 Art->StrikeMontage=Motions[0]; Art->GuardMontage=Motions[1];
 Art->FeintMontage=Motions[2]; Art->RallyMontage=Motions[3];
 Art->SpecialMontage=Motions[4];
 Art->StrikeEffect=Effects[0]; Art->GuardEffect=Effects[1];
 Art->FeintEffect=Effects[2]; Art->RallyEffect=Effects[3];
 Art->SpecialEffect=Effects[4];
 TestTrue(TEXT("Five original motions and effects satisfy uniqueness"),
  Art->HasDistinctCombatChoreography());
 Art->GuardMontage=Motions[0];
 TestFalse(TEXT("Reused generic montage is rejected"),
  Art->HasDistinctCombatChoreography());
 Art->GuardMontage=Motions[1];
 Art->SpecialEffect=Effects[0];
 TestFalse(TEXT("Reused Niagara system is rejected"),
  Art->HasDistinctCombatChoreography());
 TestFalse(TEXT("No real mesh/LOD means no art approval, even with original FX"),
  Art->HasProductionReadyGeometryAndMotion());
 return true;
}

IMPLEMENT_SIMPLE_AUTOMATION_TEST(
 FStarfortThreeHeroSceneComponentsTest,
 "STARFORT.Native.Battle.ThreeSkeletalRigsAndCamera",
 EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)

bool FStarfortThreeHeroSceneComponentsTest::RunTest(const FString& Parameters)
{
 const AStarfortBattleStage* Stage=
  AStarfortBattleStage::StaticClass()->GetDefaultObject<AStarfortBattleStage>();
 TestNotNull(TEXT("Stage class default object"),Stage);
 if (!Stage) return false;
 TestNotNull(TEXT("Hero slot 1"),Stage->HeroRig.Get());
 TestNotNull(TEXT("Hero slot 2"),Stage->HeroRig2.Get());
 TestNotNull(TEXT("Hero slot 3"),Stage->HeroRig3.Get());
 TestNotNull(TEXT("Enemy slot"),Stage->EnemyRig.Get());
 TestNotNull(TEXT("Lead weapon"),Stage->HeroWeapon.Get());
 TestNotNull(TEXT("Second weapon"),Stage->HeroWeapon2.Get());
 TestNotNull(TEXT("Third weapon"),Stage->HeroWeapon3.Get());
 TestNotNull(TEXT("Cinema camera"),Stage->CinemaCamera.Get());
 TestFalse(TEXT("No licensed/approved art ships in the source-only test"),
  Stage->HasApprovedStage());
 TestFalse(TEXT("Three-hero formation is not configured without server roster"),
  Stage->HasConfiguredThreeHeroTeam());
 return true;
}

IMPLEMENT_SIMPLE_AUTOMATION_TEST(
 FStarfortServerSafetyDefaultsTest,
 "STARFORT.Native.Battle.ServerOnlyDefaults",
 EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)

bool FStarfortServerSafetyDefaultsTest::RunTest(const FString& Parameters)
{
 FStarfortVerifiedBattleTurn Turn;
 TestFalse(TEXT("Untrusted/blank battle is never verified"),Turn.bServerVerified);
 TestEqual(TEXT("No remote room by default"),Turn.RoomId,FString());
 TestEqual(TEXT("No fabricated server damage"),Turn.VerifiedDamageDealt,
  static_cast<int64>(0));
 TestEqual(TEXT("No unsanctioned skills"),Turn.TeamHeroes.Num(),0);

 const UStarfortOnlineSubsystem* Online=
  GetDefault<UStarfortOnlineSubsystem>();
 TestNotNull(TEXT("Native online default class is registered"),Online);
 if (Online)
  TestFalse(TEXT("Default online session has no guest account or access token"),
   Online->IsSignedIn());
 return true;
}
#endif
