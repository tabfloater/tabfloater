# Developing

TabFloater consists of two components: the browser extension and the companion application. Unless explicitly stated, all steps should work on both Linux and Windows.

## Extension

Prerequisites:
 * [npm](https://www.npmjs.com/)
 * [web-ext](https://github.com/mozilla/web-ext) (only for Firefox)

To build the extension, run the following. You only need to do this for the first time.

```Shell
cd extension
npm install
```

Once built, load the extension into your browser:
 * **Chrome/Chromium**: go to `chrome://extensions/`, enable "Developer mode", then click "Load unpacked", and browse the `extension/src` directory. You will need to manually reload the extension after each code change.
 * **Firefox**: simply run `npm run run-ff`. This will set up the manifest files and use `web-ext` to load the extension into Firefox and launch the browser. Your changes will also be reloaded automatically.

**Important:** you can only run either Chrome/Chromium or Firefox at a time. This is because the manifest files are different for the two browsers, but both need to be named `manifest.json`.

Once you're done with your changes, run `npm run lint` to lint your Javascript code.

## Companion

The Companion is a C++ application that implements the [native messaging protocol](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Native_messaging). This allows the browser extension to contact the Companion and send it a command. The only purpose of the Companion is set the floating browser window "always-on-top".

Prerequisites:
 * [cmake](https://cmake.org/) 3.15.7
 * [Mingw-w64](http://mingw-w64.org/) (Windows)
 * `sudo apt install libx11-dev` ?

To build the companion, simply run `build.sh` (`build.bat` on Windows). This will build the application and register the native messaging host manifests as well, so 

See `build.sh --help` for more details.


