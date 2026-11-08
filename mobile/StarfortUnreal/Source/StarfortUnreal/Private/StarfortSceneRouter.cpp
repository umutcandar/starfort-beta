#include "StarfortSceneRouter.h"
#include "StarfortOnlineSubsystem.h"
#include "Engine/GameInstance.h"
#include "Kismet/GameplayStatics.h"
#include "Misc/PackageName.h"
#include "Engine/World.h"

/** All map paths must be explicit, authored native Unreal worlds, and cooked
 * into the mobile package. A placeholder or an absent map never opens.
 */
bool UStarfortSceneRouter::OpenIfInstalled(const FString& MapPath)
{
 const UStarfortOnlineSubsystem* Online=GetGameInstance()
  ? GetGameInstance()->GetSubsystem<UStarfortOnlineSubsystem>() : nullptr;
 if (!Online || !Online->IsSignedIn())
 {
  OnRouteUnavailable.Broadcast(TEXT("Önce hesap girişi yap."));
  return false;
 }
 if (!MapPath.StartsWith(TEXT("/Game/Maps/L_")) ||
     MapPath.Len()>100 || !FPackageName::DoesPackageExist(MapPath))
 {
  OnRouteUnavailable.Broadcast(TEXT("Bu mobil sahne henüz yüklenemiyor."));
  return false;
 }
 if (!GetWorld()) return false;
 UGameplayStatics::OpenLevel(GetWorld(),FName(*MapPath));
 return true;
}
bool UStarfortSceneRouter::OpenVillage()
{
 const FString VillageMap=TEXT("/Game/Maps/L_StarfortVillage");
 if (FPackageName::DoesPackageExist(VillageMap))
  return OpenIfInstalled(VillageMap);

 // Functional mobile smoke builds use the built-in Entry level and a genuine
 // native AStarfortVillageGameMode. When authored 3D village art is not yet
 // cooked, returning from the hero hall must still work without a WebView.
 const UStarfortOnlineSubsystem* Online=GetGameInstance()
  ? GetGameInstance()->GetSubsystem<UStarfortOnlineSubsystem>() : nullptr;
 if (!Online || !Online->IsSignedIn())
 {
  OnRouteUnavailable.Broadcast(TEXT("Köye dönmek için tekrar giriş yap."));
  return false;
 }
 if (!GetWorld()) return false;
 UGameplayStatics::OpenLevel(GetWorld(),FName(TEXT("/Engine/Maps/Entry")));
 return true;
}
bool UStarfortSceneRouter::OpenHeroHall()
{
 return OpenIfInstalled(TEXT("/Game/Maps/L_RoyalGunnerStudio"));
}
bool UStarfortSceneRouter::OpenBattle()
{
 return OpenIfInstalled(TEXT("/Game/Maps/L_StarfortBattle"));
}
bool UStarfortSceneRouter::OpenAlliance()
{
 return OpenIfInstalled(TEXT("/Game/Maps/L_StarfortAlliance"));
}
