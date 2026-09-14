@echo off
title AltOptimizer Desktop Launcher (Admin)

:: Check for Administrator privileges; if not elevated, request UAC elevation automatically
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [AltOptimizer] Requesting Administrator privileges for deep NT memory management...
    powershell -NoProfile -Command "Start-Process cmd.exe -ArgumentList '/c \"\"%~f0\"\"' -Verb RunAs"
    exit /b
)

cd /d "%~dp0"
echo ===================================================
echo   AltOptimizer Desktop - Administrator Mode
echo ===================================================
echo [AltOptimizer] Starting AltOptimizer Standalone Desktop App...
call npx electron .
exit
