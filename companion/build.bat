@echo off

set mode=%1

if "%mode%" == "-c" (
    set mode=--clean
)
if "%mode%" == "-h" (
    set mode=--help
)
if "%mode%" == "-p" (
    set mode=--package
)
if "%mode%" == "-r" (
    set mode=--rebuild
)

if "%mode%" == "--help" (
    echo.
    echo Builds/packages TabFloater Companion and installs native messaging host manifests to the registry.
    echo.
    echo When invoked without arguments, the script performs a full build and manifest installation if no build
    echo directory exists. A normal build is performed otherwise, without manifest installation.
    echo.
    echo Usage: %0 [-c ^| --clean] [-p ^| --package] [-r ^| --rebuild]
    echo.
    echo   -c  --clean      Deletes the build and dist directories and removes the manifest registry entries.
    echo   -p  --package    Packages the companion into the dist directory. The directory is cleaned first.
    echo   -r  --rebuild    Performs a full rebuild. Same as '--clean', then performing a build.
    echo.
    exit /b
)

if "%mode%" == "--clean" (
    if exist build (
        call :clean
    )
    exit /b
)

if "%mode%" == "--package" (
    if exist dist (
        rmdir /S/Q dist
    )
    cmake -G "MinGW Makefiles" -S . -B dist
    cmake --build dist --target package
    exit /b
)

if "%mode%" == "--rebuild" (
    if exist build (
        call :clean
    )
    call :full_build
    exit /b
)

if not exist build (
    call :full_build
    exit /b
)

cmake --build build

exit /b

:clean
cmake --build build --target clean_manifests
rmdir /S/Q build
rmdir /S/Q dist
goto:eof

:full_build
cmake -G "MinGW Makefiles" -S . -B build -DDEV_BUILD:STRING=true
cmake --build build --target all install_manifests
goto:eof
