@echo off

if exist bin ( rmdir /S/Q bin )
mkdir bin
g++ -o bin/tabfloater_companion.exe src/windowhandler_windows.cpp src/tabfloater_companion.cpp -lole32
