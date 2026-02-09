# Resume Parser Startup Script for Windows

Write-Host "================================================"
Write-Host "Resume Parser - Local Development Setup"
Write-Host "================================================"
Write-Host ""

# Check Python
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Python not found. Please install Python 3.8+"
    exit 1
}

# Check Node/npm
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "Error: npm not found. Please install Node.js"
    exit 1
}

Write-Host "✓ Python and npm found"
Write-Host ""

# Start Backend
Write-Host "Starting Backend on http://127.0.0.1:5000..."
$backendPath = Join-Path $PSScriptRoot "backend"
Push-Location $backendPath
python -m pip install -r requirements.txt -q
python -m spacy download en_core_web_sm -q
Start-Process python -ArgumentList "backend.py" -NoNewWindow
Pop-Location
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "Starting Frontend on http://localhost:3000..."
$frontendPath = Join-Path $PSScriptRoot "frontend"
Push-Location $frontendPath
npm install -q
$env:BACKEND_URL = "http://127.0.0.1:5000"
Start-Process cmd -ArgumentList "/k npm run dev" -NoNewWindow
Pop-Location

Write-Host ""
Write-Host "✓ Both services started!"
Write-Host ""
Write-Host "Open your browser and go to: http://localhost:3000"
Write-Host ""
Write-Host "Backend API: http://127.0.0.1:5000"
Write-Host ""
Write-Host "Press any key to keep the script running..."
Read-Host
