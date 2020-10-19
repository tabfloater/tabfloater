#!/bin/bash

set -e

_SIGNING_KEY_ID="balazs@tabfloater.io"
_COMPANION_DIR=$(git rev-parse --show-toplevel)/companion
_APPIMAGE_RESOURCES_DIR=$_COMPANION_DIR/packaging/linux/appimage
_DESKTOP_FILE=$_APPIMAGE_RESOURCES_DIR/tabfloater-companion.desktop
_ICON_FILE=$_APPIMAGE_RESOURCES_DIR/tabfloater-companion.svg
_BUILD_DIR=$_COMPANION_DIR/dist
_SIGN=""

function print_usage() {
    echo
    echo "Builds TabFloater Companion AppImage."
    echo
    echo "Usage: $0 [options]"
    echo
    echo "Options:"
    echo "  -h   --help     Displays this information"
    echo "  -s   --sign     Sign the generated AppImage (using the key '$_SIGNING_KEY_ID')"
    echo
    exit
}

while [ $# -ge 1 ]; do
    _arg="$1"
    case "$_arg" in
        -h|--help)
            print_usage
            exit ;;
        -s|--sign)
            _SIGN=true ;;
        *)
            echo "Error: uknown option: $_arg"
            print_usage
            exit 1 ;;
    esac
    shift
done

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

if [ "$_SIGN" = true ]; then
    # Environment variables for linuxdeploy-plugin-appimage. See:
    # https://github.com/linuxdeploy/linuxdeploy-plugin-appimage
    export SIGN=1
    export SIGN_KEY="$_SIGNING_KEY_ID"
fi

chmod +x ./linuxdeploy-x86_64.AppImage
echo "Generating AppImage..."
export VERSION=$_VERSION && ./linuxdeploy-x86_64.AppImage --appdir AppDir --executable ./$_EXECUTABLE_NAME --desktop-file $_DESKTOP_FILE --icon-file $_ICON_FILE --output appimage

_APPIMAGE_FILENAME=$_BUILD_DIR/$(ls tabfloater-companion*.AppImage)
echo
echo "Successfully built:"
echo $_APPIMAGE_FILENAME
