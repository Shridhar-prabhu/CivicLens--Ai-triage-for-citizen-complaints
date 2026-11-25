@echo off
setlocal
echo ========================================================
echo  Syncing and Pushing Complete CivicLens to GitHub
echo ========================================================
echo.

set PATH=C:\Program Files\nodejs;C:\Users\shrid\AppData\Local\Programs\Git\cmd;%PATH%
cd /d "%~dp0"

echo Pushing complete codebase and commits to GitHub (main)...
git push -u origin main --force

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo  SUCCESS! Complete project has been pushed to GitHub.
    echo ========================================================
) else (
    echo.
    echo [ERROR] Push failed. Please check the message above.
)
pause
