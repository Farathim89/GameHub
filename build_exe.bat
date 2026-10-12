@echo off
rem ============================================================
rem  Build GameHub.exe  (needs: Python + "pip install pyinstaller")
rem  Output: dist\GameHub.exe  -> copy it into this folder to run.
rem  The exe serves the game files sitting next to it, and also
rem  carries a bundled copy so it still runs on its own.
rem ============================================================
setlocal
cd /d "%~dp0"

where python >nul 2>nul || (echo Python not found on PATH. & pause & exit /b 1)

python -m PyInstaller --version >nul 2>nul || (
  echo Installing PyInstaller...
  python -m pip install pyinstaller || (echo pip install failed. & pause & exit /b 1)
)

echo Building GameHub.exe ...
python -m PyInstaller --noconfirm --onefile --windowed --name GameHub ^
  --icon "icons\gamehub.ico" ^
  --add-data "index.html;." ^
  --add-data "manifest.json;." ^
  --add-data "sw.js;." ^
  --add-data "games;games" ^
  --add-data "themes;themes" ^
  --add-data "lang;lang" ^
  --add-data "backgrounds;backgrounds" ^
  --add-data "icons;icons" ^
  launcher.py

if exist "dist\GameHub.exe" (
  copy /y "dist\GameHub.exe" "GameHub.exe" >nul
  echo.
  echo DONE -^> GameHub.exe is ready. Double-click it to play.
) else (
  echo.
  echo BUILD FAILED - see messages above.
)
pause
