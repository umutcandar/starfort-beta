#include "StarfortHeroCombatAsset.h"
#include "Animation/AnimMontage.h"
#include "Engine/SkeletalMesh.h"
#include "Engine/StaticMesh.h"

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

 // The server's five distinct combat actions cannot all use a generic swing.
 return StrikeMontage && GuardMontage && FeintMontage &&
        RallyMontage && SpecialMontage && SpecialEffect &&
        BasicAttackSound && SpecialAttackSound;
}
