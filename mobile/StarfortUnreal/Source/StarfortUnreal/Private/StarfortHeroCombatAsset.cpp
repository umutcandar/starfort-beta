#include "StarfortHeroCombatAsset.h"
#include "Animation/AnimMontage.h"
#include "Engine/SkeletalMesh.h"
#include "Engine/StaticMesh.h"
#include "NiagaraSystem.h"
#include "Containers/Set.h"

bool UStarfortHeroCombatAsset::HasDistinctCombatChoreography() const
{
 // Five server actions must not secretly play the same generic swing or VFX.
 const UAnimMontage* Motions[] = {
  StrikeMontage.Get(),GuardMontage.Get(),FeintMontage.Get(),
  RallyMontage.Get(),SpecialMontage.Get()
 };
 TSet<const UAnimMontage*> UniqueMotions;
 for (const UAnimMontage* Motion : Motions)
 {
  if (!Motion || UniqueMotions.Contains(Motion)) return false;
  UniqueMotions.Add(Motion);
 }

 const UNiagaraSystem* Effects[] = {
  StrikeEffect.Get(),GuardEffect.Get(),FeintEffect.Get(),
  RallyEffect.Get(),SpecialEffect.Get()
 };
 TSet<const UNiagaraSystem*> UniqueEffects;
 for (const UNiagaraSystem* Effect : Effects)
 {
  if (!Effect || UniqueEffects.Contains(Effect)) return false;
  UniqueEffects.Add(Effect);
 }
 return true;
}

bool UStarfortHeroCombatAsset::HasProductionReadyGeometryAndMotion() const
{
 // This structural gate complements HUMAN art/lighting/LOD and licence review.
 // A toy mannequin with 40 joints must not pass just because it has a rig.
 if (!bArtApprovedForMobile || VisualGeneration!=2 || bLegacyPlaceholder ||
     VisualReviewId.IsEmpty() || HeroId.IsNone() || !HeroMesh || !WeaponMesh ||
     WeaponSocket.IsNone() || ImpactSocket.IsNone() || !AnimInstanceClass ||
     AuthoredMobileLODCount < 3 ||
     HeroMesh->GetRefSkeleton().GetNum() < 40)
  return false;

 // A typed-in LOD count must not substitute for real generated mesh LODs.
 // Montage skeletons must agree with the actual hero mesh, or they cannot play.
 if (HeroMesh->GetLODNum() < AuthoredMobileLODCount ||
     !HeroMesh->GetSkeleton() || !HasDistinctCombatChoreography())
  return false;
 const UAnimMontage* Motions[] = {
  StrikeMontage.Get(),GuardMontage.Get(),FeintMontage.Get(),
  RallyMontage.Get(),SpecialMontage.Get()
 };
 for (const UAnimMontage* Motion : Motions)
  if (Motion->GetSkeleton() != HeroMesh->GetSkeleton()) return false;
 return BasicAttackSound && SpecialAttackSound;
}
