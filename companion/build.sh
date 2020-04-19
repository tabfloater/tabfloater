#!/bin/bash

rm -rf ./bin
mkdir ./bin
g++ ./src/windowhandler_linux.cpp ./libs/loguru/loguru.cpp ./src/tabfloater_companion.cpp -I src -o ./bin/tabfloater_companion -lX11 -std=c++11 -lpthread -ldl
