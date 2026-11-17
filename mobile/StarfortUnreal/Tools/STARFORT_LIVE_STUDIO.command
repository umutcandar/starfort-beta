#!/bin/bash
# STARFORT native Editor studio startup. No forced build/restart.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO="$(cd "$ROOT/../.." && pwd)"
cd "$REPO" || exit 1

echo ""
echo "=============== STARFORT LIVE STUDIO ==============="
echo "Unreal Editor acik ve L_StarfortLogin haritasinda Play durmus olmali."
echo "Python Remote Execution, Proje Ayarlari > Plugins > Python icinde etkin olmali."
echo ""
echo "GitHub guncellemesi deneniyor; yerel degisiklikler asla silinmez."
git pull --ff-only origin feat/native-v91-verified-combat-gear || echo "Git pull atlandi."
echo ""
echo "Resimler YALNIZCA Play-disi, Unreal Editor 3D sanat goruntusudur."
echo "GitHub deposu HERKESE ACIKTIR."
read -r -p "Bu art-only resimleri GitHub QA dalinda paylasayim mi? [e/H] " choice

ARGS=("studio" "--ue-root" "/Users/macbook/Documents/UE_5.8")
case "$choice" in
  e|E|evet|EVET|yes|YES)
    ARGS+=("--public-preview")
    echo "Yalnizca Editor sanati GitHub'a paylasilacak." ;;
  *)
    echo "Paylasim kapali. Yerel rapor/fotograf uretilir." ;;
esac

echo "Durdurmak icin Ctrl+C."
python3 "$ROOT/Tools/mac_live_qa_v104.py" "${ARGS[@]}"
echo ""
read -r -p "Kapatmak icin Enter: " _
