@echo off

move src\\manifest.json src\\manifest_chrome.json
move src\\manifest_firefox.json src\\manifest.json

call web-ext run --source-dir=src

move src\\manifest.json src\\manifest_firefox.json
move src\\manifest_chrome.json src\\manifest.json
