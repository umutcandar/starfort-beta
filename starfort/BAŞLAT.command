#!/bin/bash
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo 'Starfort için Node.js 20 veya üzeri gerekli: https://nodejs.org/'
  read -r -p 'Çıkmak için Enter...' _
  exit 1
fi
echo 'Starfort v2.5.3 yeni bağlantı hazırlanıyor (öncelik: 8897)...'
node launch-starfort.mjs
status=$?
if [ "$status" -ne 0 ]; then
  read -r -p 'Hata oluştu. Çıkmak için Enter...' _
fi
exit "$status"
