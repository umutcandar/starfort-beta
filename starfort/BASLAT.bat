@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 20 veya uzeri gerekli: https://nodejs.org/
  pause
  exit /b 1
)
echo Starfort v2.5.3 yeni baglanti hazirlaniyor (oncelik: 8897)...
node launch-starfort.mjs
if errorlevel 1 pause
