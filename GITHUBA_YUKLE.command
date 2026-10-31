#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
REPO='https://github.com/umutcandar/starfort-beta.git'
if ! command -v git >/dev/null 2>&1; then echo 'Git bulunamadı. GitHub Desktop veya Git kurmalısın.'; exit 1; fi
if [ ! -f render.yaml ] || [ ! -f starfort/guild-server.mjs ]; then echo 'Yanlış klasör. Dosyayı ZIP ana klasöründen çalıştır.'; exit 1; fi
if [ ! -d .git ]; then git init -b main; else git branch -M main; fi
if ! git config user.name >/dev/null 2>&1; then echo 'Git kullanıcı adı henüz ayarlı değil.'; read -r -p 'GitHub kullanıcı adın: ' gname; git config user.name "$gname"; fi
if ! git config user.email >/dev/null 2>&1; then echo 'Git e-posta adresi henüz ayarlı değil.'; read -r -p 'GitHub hesabında kullandığın e-posta: ' gemail; git config user.email "$gemail"; fi
if git remote get-url origin >/dev/null 2>&1; then
  if [ "$(git remote get-url origin)" != "$REPO" ]; then echo 'Güvenlik: farklı bir GitHub origin adresi bulundu; işlem durduruldu.'; exit 1; fi
else git remote add origin "$REPO"; fi
# Never upload test code, passwords, accounts or server data.
git add -- .gitignore render.yaml STARFORT_ONLINE_KURULUM.md GITHUBA_YUKLE.command GITHUB_YUKLEME_KILAVUZU.txt .github STARFORT_V2_8_NOTLAR.md starfort
if ! git diff --cached --quiet; then git commit -m 'Starfort v2.8.0 public beta journey and CI'; fi
echo 'Kod şimdi GitHub deposuna gönderiliyor. Git kimlik doğrulaması istenebilir.'
git push -u origin main
printf '\nYÜKLENDİ: https://github.com/umutcandar/starfort-beta\n'
