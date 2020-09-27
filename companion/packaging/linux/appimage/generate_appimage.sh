#/bin/sh

set -e

EXECUTABLE_FILE=$1
EXECUTABLE_VERSION=$2
DESKTOP_FILE=$3
ICON_FILE=$4

echo "Downloading linuxdeploy..."
wget --no-verbose --show-progress https://github.com/linuxdeploy/linuxdeploy/releases/download/continuous/linuxdeploy-x86_64.AppImage
trap "rm ./linuxdeploy-x86_64.AppImage" EXIT

chmod +x ./linuxdeploy-x86_64.AppImage
echo "Generating AppImage..."
export VERSION=$EXECUTABLE_VERSION && ./linuxdeploy-x86_64.AppImage --appdir AppDir --executable ./$EXECUTABLE_FILE --desktop-file ./$DESKTOP_FILE --icon-file ./$ICON_FILE --output appimage
