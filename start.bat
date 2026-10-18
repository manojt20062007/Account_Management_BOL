@echo off
title Bridge of Love Trust Account Pro
echo ========================================================
echo   Starting Bridge of Love Trust Accounting Application
echo ========================================================
echo.
echo Starting Backend API Server on http://localhost:5000 ...
start "Bridge of Love - Server" cmd /k "cd /d %~dp0server && node --watch index.js"

echo Starting Frontend Web App on http://localhost:5173 ...
start "Bridge of Love - Client" cmd /k "cd /d %~dp0client && npm run dev -- --host"

timeout /t 3 /nobreak >nul
start http://localhost:5173
echo.
echo Application started! Opening browser at http://localhost:5173 ...
echo You can close this window now.
pause
