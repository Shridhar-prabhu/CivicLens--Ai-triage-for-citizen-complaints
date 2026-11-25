@echo off
setlocal
echo ========================================================
echo  Pushing Latest Changes to GitHub
echo ========================================================
echo.

set PATH=C:\Program Files\nodejs;C:\Users\shrid\AppData\Local\Programs\Git\cmd;%PATH%
cd /d "%~dp0"

echo Pushing latest commits to origin main...
git push origin main

echo.
echo ========================================================
echo  DONE! GitHub repository is now completely up to date.
echo ========================================================
pause
