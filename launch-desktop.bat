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

:: 2. Already running as Administrator - launch directly
cd /d "%~dp0"
echo ========================================================
echo   AltOptimizer Desktop - Administrator Mode
echo ========================================================
echo [AltOptimizer] Starting AltOptimizer Standalone Desktop App...

if exist "node_modules\.bin\electron.cmd" (
    call node_modules\.bin\electron.cmd .
) else (
    call npx electron .
)
exit

