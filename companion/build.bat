@echo off

rmdir /S/Q bin
mkdir bin
g++ -o bin/tabfloater_companion.exe src/windowhandler_windows.cpp src/tabfloater_companion.cpp
