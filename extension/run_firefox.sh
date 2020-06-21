#!/bin/bash

mv src/manifest.json src/manifest_chrome.json
mv src/manifest_firefox.json src/manifest.json

web-ext run --source-dir=src

mv src/manifest.json src/manifest_firefox.json
mv src/manifest_chrome.json src/manifest.json
