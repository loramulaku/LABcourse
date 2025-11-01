@echo off
echo ========================================
echo Running Database Migrations and Seeders
echo ========================================
echo.

echo [1/2] Running Migrations...
npx sequelize-cli db:migrate

IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Migration failed!
    pause
    exit /b 1
)

echo.
echo ✅ Migrations completed successfully!
echo.

echo [2/2] Running Seeders...
npx sequelize-cli db:seed:all

IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo ⚠️ Seeders failed or no seeders found!
    echo Note: This is not critical if you don't have seeders yet.
) else (
    echo.
    echo ✅ Seeders completed successfully!
)

echo.
echo ========================================
echo Database setup complete!
echo ========================================
echo.
echo You can now start the server with: npm start
pause
