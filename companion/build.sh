#!/bin/bash

rm -rf ./bin
mkdir ./bin
g++ -o ./bin/tabfloater_companion ./src/windowhandler_linux.cpp ./src/tabfloater_companion.cpp -lX11
