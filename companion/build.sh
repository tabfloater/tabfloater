#!/bin/bash

function clean() {
    cmake --build build --target clean_manifests
    rm -rf build
}

function full_build() {
    cmake -S . -B build -DDEV_BUILD:STRING=true
    cmake --build build --target all install_manifests
}

_MODE=$1

if [[ "$_MODE" == "-h" || "$_MODE" == "--help" ]]; then
    echo
    echo "Builds/packages TabFloater Companion and installs native messaging host manifests."
    echo
    echo "When invoked without arguments, the script performs a full build and manifest installation if no build"
    echo "directory exists. A normal build is performed otherwise, without manifest installation."
    echo
    echo "Usage: $0 [-c | --clean] [-p | --package] [-r | --rebuild]"
    echo
    echo "  -c  --clean      Deletes the build directory and removes the manifests. The dist directory is kept."
    echo "  -p  --package    Packages the companion into the dist directory. The directory is cleaned first."
    echo "  -r  --rebuild    Performs a full rebuild. Same as '--clean', then performing a build."
    echo
    exit
fi

if [[ "$_MODE" == "-c" || "$_MODE" == "--clean" ]]; then
    if [ -e "build" ]; then
        clean
    fi
    exit
fi

if [[ "$_MODE" == "-p" || "$_MODE" == "--package" ]]; then
    if [ -e "dist" ]; then
        rm -rf dist
    fi
    cmake -S . -B dist
    cmake --build dist --target package package_source # TODO do we need binary packaging?
    exit
fi

if [[ "$_MODE" == "-r" || "$_MODE" == "--rebuild" ]]; then
    if [ -e "build" ]; then
        clean
    fi
    full_build
    exit
fi

if [ ! -e "build" ]; then
    full_build
    exit
fi

cmake --build build
