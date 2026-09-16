@echo off
setlocal EnableDelayedExpansion
title AltOptimizer Desktop Launcher

:: 1. Check for Administrator privileges; if not elevated, automatically prompt Windows UAC elevation
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ========================================================
    echo   [AltOptimizer] Requesting Administrator Privileges...
    echo ========================================================
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process cmd.exe -ArgumentList '/c call """"%~f0""""' -WorkingDirectory '%~dp0.' -Verb RunAs"
    exit /b
)

:: 2. Already running as Administrator
cd /d "%~dp0"
echo ========================================================
echo   AltOptimizer Desktop - Administrator Mode
echo ========================================================

:: 3. Verify Node.js & npm prerequisites
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Node.js is NOT installed or not detected in your system PATH!
    echo.
    echo AltOptimizer requires Node.js (v20+ LTS recommended) and npm.
    echo --------------------------------------------------------
    echo ⚡ Easiest Solution:
    echo    Double-click 'setup.bat' in this folder to automatically
    echo    install Node.js, .NET 9 SDK, and all dependencies for you!
    echo.
    echo Manual Solutions:
    echo 1. Open PowerShell or Windows Terminal and run:
    echo      winget install OpenJS.NodeJS.LTS
    echo 2. Or download the installer directly from:
    echo      https://nodejs.org/
    echo.
    echo After installing, close and relaunch this script!
    echo ========================================================
    echo.
    pause
    exit /b 1
)

:: 4. Check if dependencies are installed; auto-install if missing
if not exist "node_modules" (
    echo.
    echo [AltOptimizer] First-time launch detected!
    echo [AltOptimizer] Installing required packages via 'npm install'...
    echo This may take a moment. Please wait...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] 'npm install' encountered an error.
        echo Please check your internet connection and try running 'npm install' manually.
        echo.
        pause
        exit /b 1
    )
    echo.
    echo [AltOptimizer] Dependencies installed successfully!
    echo.
)

:: 5. Start AltOptimizer Desktop App
echo [AltOptimizer] Starting AltOptimizer Standalone Desktop App...

if exist "node_modules\.bin\electron.cmd" (
    call node_modules\.bin\electron.cmd .
) else (
    call npx electron .
)
exit
