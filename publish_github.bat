@echo off
setlocal
echo ===================================================
echo   Publish HomeLibrary to GitHub (kingVikramaditya)
echo ===================================================
echo.

rem Add git and gh to current session path
set "PATH=%PATH%;C:\Users\USER\AppData\Local\Programs\MinGit\cmd;C:\Program Files\GitHub CLI"

rem Check if logged into GitHub CLI
gh auth status >nul 2>&1
if %errorlevel% neq 0 (
    echo [*] Logging into GitHub...
    echo [*] Please follow the prompt to authorize your browser:
    gh auth login -h github.com -p https -w
)

echo.
echo [*] Creating and pushing repository to kingVikramaditya/HomeLibrary-Reader...
gh repo create kingVikramaditya/HomeLibrary-Reader --public --source=. --remote=origin --push

if %errorlevel% equ 0 (
    echo.
    echo ===================================================
    echo [SUCCESS] Published to: https://github.com/kingVikramaditya/HomeLibrary-Reader
    echo ===================================================
) else (
    echo.
    echo [*] If the repository already exists on GitHub, attempting push to main...
    git remote add origin https://github.com/kingVikramaditya/HomeLibrary-Reader.git 2>nul
    git branch -M main
    git push -u origin main
)

pause
