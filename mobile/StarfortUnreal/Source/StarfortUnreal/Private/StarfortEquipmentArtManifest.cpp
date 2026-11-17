#include "StarfortEquipmentArtManifest.h"
#include "StarfortBagCatalog.h"

const FStarfortShowcaseGearArt* UStarfortEquipmentArtManifest::FindGearArt(
 const FString& ItemId,const FString& Slot) const
{
 if(ItemId.IsEmpty()) return nullptr;
 const FStarfortBagItemInfo* Known=FStarfortBagCatalog::Find(ItemId);
 if(!Known || Slot!=Known->Slot ||
    (Slot!=TEXT("weapon") && Slot!=TEXT("armor"))) return nullptr;
 const FStarfortShowcaseGearArt* Found=nullptr;
 for(const FStarfortShowcaseGearArt& Entry:Entries)
 {
  if(Entry.ItemId.ToString()!=ItemId || Entry.Slot.ToString()!=Slot)
   continue;
  if(Found) return nullptr; // duplicate mappings are ambiguous and unsafe
  Found=&Entry;
 }
 if(!Found || (Slot==TEXT("weapon") && Found->WeaponMesh.IsNull()) ||
    (Slot==TEXT("armor") && Found->ArmorMesh.IsNull())) return nullptr;
 return Found;
}
