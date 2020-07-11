@echo off

if exist dist ( rmdir /S/Q dist )
mkdir dist

cmake -G "MinGW Makefiles" -S . -B dist
cmake --build dist --target package
