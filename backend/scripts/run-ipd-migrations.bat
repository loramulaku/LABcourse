@echo off
echo ================================================
echo   IPD Module - Database Migration Runner
echo ================================================
echo.
echo This will create the IPD tables and add clinical
echo assessment fields to appointments table.
echo.
pause

echo.
echo Running migrations...
echo.

npx sequelize-cli db:migrate

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================
    echo   SUCCESS! IPD Module database ready
    echo ================================================
    echo.
    echo Next steps:
    echo 1. Start your backend server
    echo 2. Start your frontend server
    echo 3. Login as Admin to create Wards/Rooms/Beds
    echo 4. Login as Doctor to test Clinical Assessment
    echo.
) else (
    echo.
    echo ================================================
    echo   ERROR! Migration failed
    echo ================================================
    echo.
    echo Please check the error messages above
    echo.
)

pause
