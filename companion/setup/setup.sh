#!/bin/sh

SETUP_DIR=`dirname $0 | xargs realpath`
COMPANION_EXECUTABLE=`realpath "$SETUP_DIR/../build/tabfloater_companion"`

sed "s|COMPANION_EXECUTABLE_PLACEHOLDER|$COMPANION_EXECUTABLE|g" io.github.tabfloater.companion_SAMPLE.json > io.github.tabfloater.companion.json
