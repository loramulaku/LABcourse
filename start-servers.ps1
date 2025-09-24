# Prescripto Server Starter Script
Write-Host "Starting Prescripto Application..." -ForegroundColor Green
Write-Host ""

# Kill any existing Node.js processes
Write-Host "Stopping any existing servers..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

# Wait a moment
Start-Sleep -Seconds 2

# Start the servers
Write-Host "Starting backend and frontend servers..." -ForegroundColor Green
npm start
