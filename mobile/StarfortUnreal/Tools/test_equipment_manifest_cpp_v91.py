#!/usr/bin/env python3
"""Compiles the REAL native item-art resolver with small Unreal API shims.
Not UHT/UBT, not an Editor run, and not a mobile build.
"""
from pathlib import Path
import shutil
import subprocess
import tempfile
import textwrap
import unittest

NATIVE=Path(__file__).resolve().parents[1]/"Source/StarfortUnreal"

class VerifiedEquipmentResolverCpp(unittest.TestCase):
 def test_real_cpp_rejects_unknown_wrong_slot_duplicate_missing_mesh(self):
  if not shutil.which("c++"):
   self.skipTest("standalone C++ compiler unavailable")
  with tempfile.TemporaryDirectory(prefix="starfort-v91-equip-") as work:
   root=Path(work)
   for d in ("Engine","UObject"):
    (root/d).mkdir()
   (root/"CoreMinimal.h").write_text(textwrap.dedent("""
    #pragma once
    #include <string>
    #include <vector>
    #define STARFORTUNREAL_API
    #define TEXT(x) x
    #define NAME_None ""
    #define UPROPERTY(...)
    #define USTRUCT(...)
    #define UCLASS(...)
    #define GENERATED_BODY()
    struct FString:std::string {
     using std::string::string;
     FString(const std::string& s):std::string(s){}
     bool IsEmpty() const{return empty();}
    };
    struct FName {
     std::string str;
     FName(const char* s=""):str(s){}
     FString ToString()const{return FString(str);}
    };
    template<class T>using TArray=std::vector<T>;
   """),encoding="utf-8")
   (root/"Engine/DataAsset.h").write_text("#pragma once\nclass UDataAsset {};\n",encoding="utf-8")
   (root/"UObject/SoftObjectPtr.h").write_text(textwrap.dedent("""
    #pragma once
    template<class T> struct TSoftObjectPtr {
     bool present=false;
     bool IsNull()const{return !present;}
    };
   """),encoding="utf-8")
   (root/"StarfortEquipmentArtManifest.generated.h").write_text("#pragma once\n",encoding="utf-8")
   (root/"StarfortBagCatalog.h").write_text(textwrap.dedent("""
    #pragma once
    #include "CoreMinimal.h"
    struct FStarfortBagItemInfo {const char* Slot;};
    struct FStarfortBagCatalog {
     static const FStarfortBagItemInfo* Find(const FString& id) {
      static const FStarfortBagItemInfo sword{"weapon"},armor{"armor"},relic{"relic"};
      if(id=="iron_sword" || id=="royal_blade")return &sword;
      if(id=="ward_mail")return &armor;
      if(id=="lunar_charm")return &relic;
      return nullptr;
     }
    };
   """),encoding="utf-8")
   (root/"verify.cpp").write_text(textwrap.dedent("""
    #include "StarfortEquipmentArtManifest.h"
    #include <cassert>
    int main(){
     UStarfortEquipmentArtManifest manifest;
     FStarfortShowcaseGearArt sword;
     sword.ItemId="iron_sword";sword.Slot="weapon";sword.WeaponMesh.present=true;
     manifest.Entries.push_back(sword);
     assert(manifest.FindGearArt("iron_sword","weapon")!=nullptr);
     assert(manifest.FindGearArt("iron_sword","armor")==nullptr);
     assert(manifest.FindGearArt("made_up","weapon")==nullptr);
     assert(manifest.FindGearArt("","weapon")==nullptr);
     manifest.Entries.push_back(sword);
     assert(manifest.FindGearArt("iron_sword","weapon")==nullptr);
     manifest.Entries.pop_back();
     FStarfortShowcaseGearArt armor;
     armor.ItemId="ward_mail";armor.Slot="armor";armor.ArmorMesh.present=true;
     manifest.Entries.push_back(armor);
     assert(manifest.FindGearArt("ward_mail","armor")!=nullptr);
     assert(manifest.FindGearArt("ward_mail","weapon")==nullptr);
     assert(manifest.FindGearArt("lunar_charm","relic")==nullptr);
     FStarfortShowcaseGearArt missing;
     missing.ItemId="royal_blade";missing.Slot="weapon";
     manifest.Entries.push_back(missing);
     assert(manifest.FindGearArt("royal_blade","weapon")==nullptr);
     return 0;
    }
   """),encoding="utf-8")
   binary=root/"verify-art"
   cmd=["c++","-std=c++17","-Wall","-Wextra","-Werror",
    "-I",str(root),"-I",str(NATIVE/"Public"),
    str(root/"verify.cpp"),
    str(NATIVE/"Private/StarfortEquipmentArtManifest.cpp"),
    "-o",str(binary)]
   build=subprocess.run(cmd,text=True,capture_output=True,timeout=40)
   self.assertEqual(build.returncode,0,build.stderr)
   run=subprocess.run([str(binary)],text=True,capture_output=True,timeout=10)
   self.assertEqual(run.returncode,0,run.stderr)

if __name__=="__main__":
 unittest.main()
