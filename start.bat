@echo off
setlocal
echo ========================================================
echo  Starting CivicLens AI Triage Server (Port 3000)
echo ========================================================
echo.

set PATH=C:\Program Files\nodejs;C:\Users\shrid\AppData\Local\Programs\Git\cmd;%PATH%

cd /d "%~dp0"

echo Opening browser at http://localhost:3000 ...
start http://localhost:3000

echo Starting Next.js development server...
call npm run dev

pause
