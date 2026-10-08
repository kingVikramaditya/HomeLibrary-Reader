@echo off
title HomeLibrary EBook Reader
cd /d "%~dp0"

echo Starting HomeLibrary Desktop Application...

:: Start the background local server if not already running
powershell -Command "if (-not (Get-NetTCPConnection -LocalPort 4891 -ErrorAction SilentlyContinue)) { Start-Process powershell -WindowStyle Hidden -ArgumentList '-ExecutionPolicy Bypass -File ""%~dp0server.ps1""' }"

:: Small wait for port binding
timeout /t 1 /nobreak >nul

:: Find Microsoft Edge or Google Chrome to launch in standalone Desktop App Mode
set "BROWSER="
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" set "BROWSER=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if exist "C:\Program Files\Microsoft\Edge\Application\msedge.exe" set "BROWSER=C:\Program Files\Microsoft\Edge\Application\msedge.exe"
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" set "BROWSER=C:\Program Files\Google\Chrome\Application\chrome.exe"
if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" set "BROWSER=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"

if defined BROWSER (
    start "" "%BROWSER%" --app="http://localhost:4891" --window-size=1280,820
) else (
    start http://localhost:4891
)

exit
