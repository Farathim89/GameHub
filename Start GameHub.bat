@echo off
rem ============================================================
rem  GAME HUB - portable launcher (Pinokio-style)
rem  Everything lives in this folder. On first run, if the PC has
rem  no Python, a portable Python (~11 MB) is downloaded ONCE into
rem  .\runtime\python\ - after that the app is fully self-contained
rem  and works offline, from USB, on any Windows 10/11 PC.
rem   - Server: .\runtime\python -> system Python -> PowerShell
rem   - Window: Chrome app mode -> Edge -> default browser
rem  The server closes itself when you close the app window.
rem ============================================================
setlocal
cd /d "%~dp0"
set "URL=http://localhost:8123/index.html"
set "PYEXE="

rem ---- 1) our own bundled runtime? ----
if exist "%~dp0runtime\python\python.exe" set "PYEXE=%~dp0runtime\python\python.exe"
if defined PYEXE goto server

rem ---- 2) system Python? ----
where python >nul 2>nul
if not errorlevel 1 set "PYEXE=python"
if defined PYEXE goto server

rem ---- 3) first run: download portable Python into our own folder ----
echo First run: downloading portable Python runtime (about 11 MB, one time only)...
if not exist "%~dp0runtime" mkdir "%~dp0runtime"
if not exist "%~dp0runtime\python" mkdir "%~dp0runtime\python"
curl -L --silent --show-error --max-time 120 -o "%~dp0runtime\python-embed.zip" "https://www.python.org/ftp/python/3.12.8/python-3.12.8-embed-amd64.zip"
if not exist "%~dp0runtime\python-embed.zip" goto dl_failed
tar -xf "%~dp0runtime\python-embed.zip" -C "%~dp0runtime\python" 2>nul
del "%~dp0runtime\python-embed.zip" >nul 2>nul
if exist "%~dp0runtime\python\python.exe" set "PYEXE=%~dp0runtime\python\python.exe"
if defined PYEXE echo Portable Python installed to runtime\python\ - done!
if defined PYEXE goto server

:dl_failed
echo Download not possible (offline?) - using built-in PowerShell server instead.

rem ---- start server (skip if one is already running) ----
:server
netstat -ano | findstr ":8123 " >nul 2>nul
if not errorlevel 1 goto browser
if defined PYEXE goto pysrv
start "GameHub Server" /min powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
goto wait
:pysrv
start "GameHub Server" /min "%PYEXE%" "%~dp0server.py"
:wait
timeout /t 1 >nul

rem ---- open app window: Chrome -> Edge -> default browser ----
:browser
set "BROWSER="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "BROWSER=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if defined BROWSER goto launch
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "BROWSER=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if defined BROWSER goto launch
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "BROWSER=%LocalAppData%\Google\Chrome\Application\chrome.exe"
if defined BROWSER goto launch
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if defined BROWSER goto launch
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if defined BROWSER goto launch

rem no Chrome/Edge found - open in default browser
start "" "%URL%"
goto :eof

:launch
start "" "%BROWSER%" --app=%URL%
