@echo off
echo ========================================
echo INSTALLING ALL DEPENDENCIES
echo ========================================
echo.

echo [1/4] Installing Backend Dependencies...
call npm install

IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Backend installation failed!
    pause
    exit /b 1
)

echo.
echo ✅ Backend dependencies installed successfully!
echo.

echo [2/4] Running Database Migrations...
call npx sequelize-cli db:migrate

IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Database migrations failed!
    echo Please check your .env file has correct database credentials:
    echo   DB_USER=your_mysql_username
    echo   DB_PASSWORD=your_mysql_password
    echo   DB_NAME=your_database_name
    echo   DB_HOST=localhost
    echo   DB_PORT=3306
    pause
    exit /b 1
)

echo.
echo ✅ Database migrations completed successfully!
echo.

echo [2.5/4] Running Database Seeders...
call npx sequelize-cli db:seed:all

IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo ⚠️ Seeders failed or no seeders found!
    echo Note: This is not critical if you don't have seeders yet.
    echo.
) else (
    echo.
    echo ✅ Database seeders completed successfully!
    echo.
)
 
echo [3/4] Installing Frontend Dependencies...
cd ..\frontend
call npm install

IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Frontend installation failed!
    pause
    exit /b 1
)

echo.
echo ✅ Frontend dependencies installed successfully!
echo.

cd ..\backend

echo ========================================
echo 🎉 INSTALLATION COMPLETE!
echo ========================================
echo.
echo ✅ Backend dependencies installed
echo ✅ Frontend dependencies installed
echo ✅ Database migrations applied
echo ✅ Database seeders applied (if available)
echo.
echo NEXT STEPS:
echo.
echo 1. Start the backend server:
echo    cd c:\Lora\LABcourse\backend
echo    npm start
echo.
echo 2. In a NEW terminal, start the frontend:
echo    cd c:\Lora\LABcourse\frontend
echo    npm run dev
echo.
echo 3. Open your browser to: http://localhost:5173
echo.
echo ========================================
pause
