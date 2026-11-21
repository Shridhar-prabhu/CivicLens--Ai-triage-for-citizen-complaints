@echo off
setlocal
echo ========================================================
echo  Pushing CivicLens to GitHub
echo ========================================================
echo.

set PATH=C:\Program Files\nodejs;C:\Users\shrid\AppData\Local\Programs\Git\cmd;%PATH%

cd /d "%~dp0"

echo Enter your GitHub Repository URL (or press Enter for default):
set /p REPO_URL="Repo URL: "

if "%REPO_URL%"=="" (
    echo Please provide a valid GitHub repository URL.
    pause
    exit /b
)

git remote remove origin >nul 2>nul
git remote add origin %REPO_URL%
git branch -M main
echo Pushing branch main to %REPO_URL% ...
git push -u origin main --force

echo.
echo ========================================================
echo  DONE! Successfully pushed to GitHub.
echo ========================================================
pause
