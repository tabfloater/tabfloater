@echo off

echo.

net session >nul 2>&1
if not %errorLevel% == 0 (
    echo Please run this script as Adminstrator.
    pause > nul
    exit /b
)

echo Adding native messaging host registry keys...
echo.

SET SCRIPT_PATH=%~dp0
REG ADD HKLM\Software\Google\Chrome\NativeMessagingHosts\io.github.tabfloater.companion /f /ve /d "%SCRIPT_PATH%manifest_chrome.json"
REG ADD HKLM\Software\Mozilla\NativeMessagingHosts\io.github.tabfloater.companion /f /ve /d "%SCRIPT_PATH%manifest_firefox.json"

echo.
if %errorLevel% == 0 (
    echo Manifests registered successfully. To undo this operation, run "unregister_manifests.bat".
) else (
    echo An error occurred during manifest registration. Code: %errorLevel%
)

pause > nul
