@echo off

if exist build ( rmdir /S/Q build )
mkdir build && cd build

rem g++ -static -o bin/tabfloater_companion.exe libs/loguru/src/loguru.cpp src/windowhandler_windows.cpp src/tabfloater_companion.cpp -lole32
cmake -G "MinGW Makefiles" ..
mingw32-make
