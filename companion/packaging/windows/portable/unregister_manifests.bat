@echo off

echo.
net session >nul 2>&1
if not %errorLevel% == 0 (
    echo Please run this script as Adminstrator.
    pause > nul
    exit /b
)

echo Removing native messaging host registry keys...
echo.

REG DELETE HKLM\Software\Google\Chrome\NativeMessagingHosts\io.github.tabfloater.companion /f
REG DELETE HKLM\Software\Mozilla\NativeMessagingHosts\io.github.tabfloater.companion /f

echo.
if %errorLevel% == 0 (
    echo Manifest registrations removed successfully.
) else (
    echo An error occurred while removing manifest registrations. Code: %errorLevel%
)

pause > nul
