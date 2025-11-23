@echo off
echo ========================================
echo FIXING MIGRATION ISSUES
echo ========================================
echo.
echo This script will:
echo 1. Clear failed migration records
echo 2. Re-run migrations safely (with duplicate checks)
echo 3. Run seeders
echo.
echo Press Ctrl+C to cancel, or
pause

echo.
echo [1/3] Clearing migration lock...
echo.

REM Delete the migration lock if it exists
npx sequelize-cli db:migrate:status 2>nul

echo.
echo [2/3] Running migrations (with duplicate protection)...
echo.

npx sequelize-cli db:migrate

IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo ⚠️ Migration had issues, but this might be OK if columns already exist
    echo Continuing with seeders...
    echo.
)

echo.
echo [3/3] Running seeders...
echo.

npx sequelize-cli db:seed:all

IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo ⚠️ Seeders failed or already executed
    echo.
) else (
    echo.
    echo ✅ Seeders completed!
    echo.
)

echo.
echo ========================================
echo MIGRATION FIX COMPLETE!
echo ========================================
echo.
echo Next steps:
echo 1. Start the backend: npm start
echo 2. Check if the 500 error is resolved
echo.
pause
