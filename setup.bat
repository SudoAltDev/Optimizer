@echo off
setlocal EnableDelayedExpansion
title AltOptimizer - Complete 1-Click Environment Setup

:: 1. Self-Elevation to Administrator (required for system-wide package installs)
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ========================================================
    echo   [AltOptimizer Setup] Requesting Administrator Privileges...
    echo ========================================================
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

cd /d "%~dp0"
cls
echo ==============================================================================
echo   ⚡ AltOptimizer - Complete 1-Click Environment Setup
echo ==============================================================================
echo   Verifying all required software components on your system:
echo   - If ALREADY AVAILABLE : Automatically detected and skipped (no re-install).
echo   - If NOT AVAILABLE     : Automatically downloaded and installed for you.
echo ==============================================================================
echo.

:: Ensure standard paths are included in session PATH
set "PATH=%SystemRoot%\system32;%SystemRoot%;%SystemRoot%\System32\Wbem;%SystemRoot%\System32\WindowsPowerShell\v1.0\;C:\Program Files\nodejs\;C:\Program Files\dotnet\;%APPDATA%\npm;%PATH%"

:: --------------------------------------------------------------------------
:: [STEP 1] Check Node.js and npm
:: --------------------------------------------------------------------------
echo [1/4] Checking Node.js and npm runtime...
set "HAS_NODE=0"
where node >nul 2>&1
if %errorlevel% equ 0 set "HAS_NODE=1"
if exist "C:\Program Files\nodejs\node.exe" set "HAS_NODE=1"

if "!HAS_NODE!"=="1" (
    for /f "tokens=*" %%i in ('node -v 2^>nul') do set "NODE_VER=%%i"
    if "!NODE_VER!"=="" set "NODE_VER=Installed"
    echo   [STATUS] AVAILABLE (!NODE_VER!)
    echo   -- Node.js is already installed on your system.
    echo   -- No installation needed. Skipping!
) else (
    echo   [STATUS] NOT AVAILABLE
    echo   -- Node.js is not found on your system.
    echo   -- Action: Installing Node.js LTS via Windows Package Manager (winget)...
    echo   -- Please wait while it downloads and installs...
    echo.
    winget install --id OpenJS.NodeJS.LTS -e --accept-package-agreements --accept-source-agreements
    if %errorlevel% neq 0 (
        echo.
        echo   [!] Warning: Winget installation was cancelled or encountered an error.
        echo       You can install Node.js manually from: https://nodejs.org/
    ) else (
        echo.
        echo   [+] SUCCESS: Node.js LTS has been installed successfully!
        if exist "C:\Program Files\nodejs" set "PATH=C:\Program Files\nodejs;%APPDATA%\npm;%PATH%"
    )
)
echo.

:: --------------------------------------------------------------------------
:: [STEP 2] Check Microsoft .NET 10 SDK
:: --------------------------------------------------------------------------
echo [2/4] Checking Microsoft .NET 10 SDK...
set "HAS_DOTNET=0"
where dotnet >nul 2>&1
if %errorlevel% equ 0 set "HAS_DOTNET=1"
if exist "C:\Program Files\dotnet\dotnet.exe" set "HAS_DOTNET=1"

if "!HAS_DOTNET!"=="1" (
    for /f "tokens=*" %%i in ('dotnet --version 2^>nul') do set "DOTNET_VER=%%i"
    if "!DOTNET_VER!"=="" set "DOTNET_VER=Installed"
    echo   [STATUS] AVAILABLE (.NET SDK !DOTNET_VER!)
    echo   -- Microsoft .NET is already installed on your system.
    echo   -- No installation needed. Skipping!
) else (
    echo   [STATUS] NOT AVAILABLE
    echo   -- Microsoft .NET 10 SDK is not found on your system.
    echo   -- Action: Installing Microsoft .NET 10 SDK via Windows Package Manager (winget)...
    echo   -- Please wait while it downloads and installs...
    echo.
    winget install --id Microsoft.DotNet.SDK.10 -e --accept-package-agreements --accept-source-agreements
    if %errorlevel% neq 0 (
        echo.
        echo   [!] Warning: Winget installation was cancelled or encountered an error.
        echo       You can install .NET 10 manually from: https://dotnet.microsoft.com/download/dotnet
    ) else (
        echo.
        echo   [+] SUCCESS: Microsoft .NET 10 SDK has been installed successfully!
        if exist "C:\Program Files\dotnet" set "PATH=C:\Program Files\dotnet;%PATH%"
    )
)
echo.

:: Refresh environment PATH with standard installation targets
set "PATH=%SystemRoot%\system32;%SystemRoot%;%SystemRoot%\System32\Wbem;%SystemRoot%\System32\WindowsPowerShell\v1.0\;C:\Program Files\nodejs\;C:\Program Files\dotnet\;%LOCALAPPDATA%\Microsoft\WindowsApps;%APPDATA%\npm;%PATH%"

:: --------------------------------------------------------------------------
:: [STEP 3] Check Project NPM Dependencies (node_modules)
:: --------------------------------------------------------------------------
echo [3/4] Checking project dependencies (node_modules)...
if exist "node_modules\.package-lock.json" (
    echo   [STATUS] AVAILABLE
    echo   -- 'node_modules' packages are already installed and ready.
    echo   -- No installation needed. Skipping!
) else if exist "node_modules" (
    echo   [STATUS] AVAILABLE
    echo   -- 'node_modules' folder is already present.
    echo   -- No installation needed. Skipping!
) else (
    echo   [STATUS] NOT AVAILABLE
    echo   -- Dependencies are not yet installed.
    echo   -- Action: Running 'npm install' to download Electron, React, and backend packages...
    echo   -- Please wait while packages download...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo   [!] Warning: 'npm install' reported an issue.
        echo       If you just installed Node.js in this session, please close this window
        echo       and run 'setup.bat' again so Windows can refresh your system PATH.
    ) else (
        echo.
        echo   [+] SUCCESS: All project dependencies installed successfully!
    )
)
echo.

:: --------------------------------------------------------------------------
:: [STEP 4] Check Native Memory Engine Binary
:: --------------------------------------------------------------------------
echo [4/4] Checking Native C# Memory Engine binary...
if exist "bin\MemoryEngine.exe" (
    echo   [STATUS] AVAILABLE
    echo   -- Pre-compiled 'bin\MemoryEngine.exe' is already present.
    echo   -- No compilation needed. Skipping!
) else (
    echo   [STATUS] NOT AVAILABLE
    echo   -- Native binary 'bin\MemoryEngine.exe' is missing.
    echo   -- Action: Compiling native C# Memory Engine via 'npm run build:native'...
    echo.
    call npm run build:native
    if %errorlevel% neq 0 (
        echo.
        echo   [!] Warning: Native build failed. Ensure .NET 9 SDK is installed.
    ) else (
        echo.
        echo   [+] SUCCESS: Native C# Memory Engine compiled into 'bin\MemoryEngine.exe'!
    )
)
echo.

:: --------------------------------------------------------------------------
:: Final Summary & Launch Prompt
:: --------------------------------------------------------------------------
echo ==============================================================================
echo   All checks and verifications completed!
echo ==============================================================================
echo.
echo   You can launch AltOptimizer anytime by double-clicking:
echo   -- launch-desktop.bat (or launch.bat)
echo.
set /p LAUNCH_CHOICE="Would you like to launch AltOptimizer now? (Y/N, default Y): "
if /i "!LAUNCH_CHOICE!"=="N" (
    echo.
    echo Exiting setup. Enjoy AltOptimizer!
    timeout /t 3 >nul
    exit /b 0
)

echo.
echo [AltOptimizer] Starting standalone desktop app...
if exist "node_modules\electron\dist\electron.exe" (
    start "" "%~dp0node_modules\electron\dist\electron.exe" "%~dp0." --elevated
) else if exist "node_modules\.bin\electron.cmd" (
    start "" node_modules\.bin\electron.cmd . --elevated
) else (
    start "" npx electron . --elevated
)
exit /b 0
