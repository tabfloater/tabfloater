#!/bin/bash

set -e

_COMPANION_DIR=$(git rev-parse --show-toplevel)/companion
_APPIMAGE_RESOURCES_DIR=$_COMPANION_DIR/packaging/linux/appimage
_DESKTOP_FILE=$_APPIMAGE_RESOURCES_DIR/tabfloater-companion.desktop
_ICON_FILE=$_APPIMAGE_RESOURCES_DIR/tabfloater-companion.svg
_BUILD_DIR=$_COMPANION_DIR/dist

cd $_COMPANION_DIR

rm -rf $_BUILD_DIR
cmake -S . -B $_BUILD_DIR
cmake --build $_BUILD_DIR

_EXECUTABLE_NAME=$(cmake -L -N dist | grep MAIN_TARGET | cut -f 2 -d "=")
_VERSION=$(cmake -L -N dist | grep VERSION | cut -f 2 -d "=")

echo
echo "Package name: $_EXECUTABLE_NAME"
echo "Version: $_VERSION"
echo

cd $_BUILD_DIR

echo "Downloading linuxdeploy..."
wget --no-verbose --show-progress https://github.com/linuxdeploy/linuxdeploy/releases/download/continuous/linuxdeploy-x86_64.AppImage
trap "rm ./linuxdeploy-x86_64.AppImage" EXIT

chmod +x ./linuxdeploy-x86_64.AppImage
echo "Generating AppImage..."
export VERSION=$_VERSION && ./linuxdeploy-x86_64.AppImage --appdir AppDir --executable ./$_EXECUTABLE_NAME --desktop-file $_DESKTOP_FILE --icon-file $_ICON_FILE --output appimage

_APPIMAGE_FILENAME=$_BUILD_DIR/$(ls tabfloater-companion*.AppImage)
echo
echo "Successfully built:"
echo $_APPIMAGE_FILENAME
