#!/bin/zsh
# STARFORT v83 — local user-only free Fab real 3D battle device preflight.
# Does NOT accept Epic/Fab licenses, install Unreal SDKs, or manufacture an IPA.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
echo "STARFORT v83 — Özel 3D Fab mobil test ön kontrolü"
echo "Gerçek Epic/Fab karakterlerini önce Unreal 5.8 Editor'a ekleyip"
echo "özel .umap haritalarını ve 3v1 denetim raporunu oluşturmuş olmalısın."
echo
if [[ -z "${UE_ROOT:-}" ]]; then
  echo "UE_ROOT ayarlı değil. Örnek: export UE_ROOT='/Users/Shared/Epic Games/UE_5.8'"
  echo
fi
python3 Tools/native_mobile_build.py --platform ios --profile private-preview --dry-run || {
  echo
  echo "Ön kontrol eksikleri var; gerçek IPA/APK oluşturulmadı."
  echo "Detaylı rehber: Docs/PrivateMobileFabDevicePreview_v83_TR.md"
  exit 2
}
echo
echo "Ön kontrol başarılı. iOS Development paketi oluşturmak için şu komutu"
echo "Terminal içinde, Xcode signing hazır olduğunda kendin çalıştır:"
echo "python3 Tools/native_mobile_build.py --platform ios --profile private-preview"
echo
echo "Android için ayrı SDK kuruluysa --platform android kullanılabilir."
