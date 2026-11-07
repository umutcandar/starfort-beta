#include "StarfortVillageBuilding.h"
#include "Components/SceneComponent.h"
#include "Components/StaticMeshComponent.h"

AStarfortVillageBuilding::AStarfortVillageBuilding()
{
 PrimaryActorTick.bCanEverTick = false;
 BuildingRoot = CreateDefaultSubobject<USceneComponent>(TEXT("BuildingRoot"));
 RootComponent = BuildingRoot;
 DetailedBuildingMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("DetailedBuildingMesh"));
 DetailedBuildingMesh->SetupAttachment(BuildingRoot);
 DetailedBuildingMesh->SetCollisionEnabled(ECollisionEnabled::QueryOnly);
 DetailedBuildingMesh->SetCollisionResponseToAllChannels(ECR_Ignore);
 DetailedBuildingMesh->SetCollisionResponseToChannel(ECC_Visibility, ECR_Block);
 DetailedBuildingMesh->SetCastShadow(true);
}

bool AStarfortVillageBuilding::HasApprovedDisplayMesh() const
{
 return bArtApprovedForMobile && !BuildingId.IsNone() && DetailedBuildingMesh &&
  DetailedBuildingMesh->GetStaticMesh() != nullptr &&
  DetailedBuildingMesh->GetNumMaterials() > 0;
}
void AStarfortVillageBuilding::SetSelectionHighlight(bool bSelected)
{
 // Client-side selection only. Does not alter server-owned building levels.
 if (DetailedBuildingMesh)
  DetailedBuildingMesh->SetRenderCustomDepth(HasApprovedDisplayMesh() && bSelected);
}
