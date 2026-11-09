#!/bin/zsh
# STARFORT original Mac helper: local Unreal Editor opens; Epic EULA stays in your control.
set -euo pipefail
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT="$PROJECT_DIR/StarfortUnreal.uproject"
echo "STARFORT - yedi ucretsiz Fab/Paragon 3D karakter ozel test hazirligi"
echo "NOT: Bu araci calistirmak Epic modellerini kendiliginden indirmez veya lisans kabul etmez."
echo "Kendi Epic hesabinizdan yedi ucretsiz paketi Fab kutuphanenize ekleyip projeye indirin."
echo
echo "Paket tarama (UE5.8 > Tools > Execute Python Script):"
echo "  $PROJECT_DIR/Tools/STARFORT_7_KAHRAMAN_TARA.py"
echo
echo "Sonra Saved/QA/fab_seven_private_selection_v80.json dosyasindaki"
echo "user_confirmed_fab_license alanini, lisanslari kabul ettiyseniz true yapin."
echo
echo "Yedi karakter galerisi ve 3v1 animasyonlu test sahnesini kur:"
echo "  $PROJECT_DIR/Tools/STARFORT_7_KAHRAMAN_KUR.py"
echo
echo "Haritalar (yalnizca yerel Editor ozel test):"
echo "  /Game/Maps/L_StarfortPrivateFabPlaytest_v80"
echo "  /Game/Maps/L_StarfortPrivateFabBattle_v80"
echo
if [[ -f "$PROJECT" ]]; then
  echo "Proje aciliyor: $PROJECT"
  open "$PROJECT" || echo "UE5.8 yukluysa Unreal Editor icerisinden $PROJECT dosyasini acin."
else
  echo "HATA: StarfortUnreal.uproject bulunamadi: $PROJECT"
  exit 2
fi
echo "Guvenlik: Oyuncu hesabi, Supabase, satin alma ve canli sunucu degismez."
