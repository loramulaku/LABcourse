@echo off
echo Starting Prescripto Application...
echo.

REM Kill any existing Node.js processes
echo Stopping any existing servers...
taskkill /F /IM node.exe >nul 2>&1

REM Wait a moment
timeout /t 2 /nobreak >nul

REM Start the servers
echo Starting backend and frontend servers...
npm start

pause
