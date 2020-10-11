#!/bin/bash

set -e

export DEBFULLNAME="Balazs Gyurak"
export DEBEMAIL="balazs@tabfloater.io"

_COMPANION_DIR=$(git rev-parse --show-toplevel)/companion

cd $_COMPANION_DIR/packaging/linux/ubuntu-ppa
rm -f debian/changelog.dch

dch --distribution=SERIES --force-distribution --local "-SERIES"
