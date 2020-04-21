@echo off

if exist bin ( rmdir /S/Q bin )
mkdir bin
g++ -static -o bin/tabfloater_companion.exe libs/loguru/src/loguru.cpp src/windowhandler_windows.cpp src/tabfloater_companion.cpp -lole32
