#!/bin/bash
set -e
cd "$(dirname "$0")"
echo 'STARFORT · MAC OTOMATİK TARAYICI TESTİ'
if ! command -v node >/dev/null 2>&1; then
  echo 'Node.js 20+ gerekli. https://nodejs.org'
  exit 1
fi
if [ ! -f guild-server.mjs ]; then
  echo 'Bu iki QA dosyasını oyunun starfort klasörüne kopyalamalısın.'
  exit 1
fi
if ! node --input-type=module -e "await import('playwright')" >/dev/null 2>&1; then
  echo 'Playwright yükleniyor (ilk seferde internet gerekir)...'
  npm install --no-save --no-package-lock --ignore-scripts playwright
fi
node qa-browser-mac.mjs
