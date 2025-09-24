@echo off
echo Checking Prescripto Server Status...
echo.

echo Backend Server (Port 5000):
netstat -an | findstr :5000
echo.

echo Frontend Server (Port 5173):
netstat -an | findstr :5173
echo.

echo Frontend Server (Port 5177):
netstat -an | findstr :5177
echo.

echo If you see "LISTENING" above, the servers are running!
echo.
pause
