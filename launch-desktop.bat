@echo off
title AltOptimizer Desktop Launcher

:: 1. Request Administrator privileges if not elevated (single prompt, clean exit)
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ========================================================
    echo   [AltOptimizer] Requesting Administrator Privileges...
    echo ========================================================
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

:: 2. Switch to project root directory
cd /d "%~dp0"

:: 3. Check if dependencies are installed; if missing, direct user to setup.bat
if not exist "node_modules" (
    echo.
    echo ==============================================================================
    echo   [!] AltOptimizer dependencies not found.
    echo.
    echo   Please double-click 'setup.bat' first to install Node.js, .NET and packages!
    echo ==============================================================================
    echo.
    pause
    exit /b 1
)

:: 4. Ensure complete system and runtime paths are accessible
set "PATH=%SystemRoot%\system32;%SystemRoot%;%SystemRoot%\System32\Wbem;%SystemRoot%\System32\WindowsPowerShell\v1.0\;C:\Program Files\nodejs\;C:\Program Files\dotnet\;%APPDATA%\npm;%PATH%"

:: 5. Launch AltOptimizer Desktop App directly (single instance with --elevated flag)
echo [AltOptimizer] Starting AltOptimizer Standalone Desktop App...

if exist "node_modules\electron\dist\electron.exe" (
    start "" "%~dp0node_modules\electron\dist\electron.exe" "%~dp0." --elevated
    exit /b 0
)

if exist "node_modules\.bin\electron.cmd" (
    start "" node_modules\.bin\electron.cmd . --elevated
    exit /b 0
)

call npx electron . --elevated
exit /b 0
