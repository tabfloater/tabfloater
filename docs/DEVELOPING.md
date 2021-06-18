# Developing

TabFloater consists of two components: the browser extension and the companion application. Unless explicitly stated, all steps should work on both Linux and Windows.

## Extension

Prerequisites:
 * [npm](https://www.npmjs.com/)
 * [web-ext](https://github.com/mozilla/web-ext) (only for Firefox)

To build the extension, run the following. You only need to do this once.

```Shell
cd extension
npm install
```

Once built, load the extension into your browser:
 * **Brave/Chrome/Chromium/Vivaldi**:
   * Go to
     * `brave://extensions/` for Brave
     * `chrome://extensions/` for Chrome/Chromium
     * `vivaldi://extensions/` for Vivaldi
   * Enable "Developer mode", then click "Load unpacked", and browse the `extension/src` directory. You will need to manually reload the extension after each code change.
 * **Firefox**: simply run `npm run run-ff`. This will set up the manifest files and use `web-ext` to load the extension into Firefox and launch the browser. Your changes will also be reloaded automatically.

**Important:** you cannot run the Chrome-based browsers (Brave, Vivaldi) and Firefox at the same time. This is because the manifest files are different, but both need to be named `manifest.json`, so you cannot run these browsers at the same time with the extension loaded.

Once you're done with your changes, run `npm run lint` to lint your Javascript code.

## Companion

The Companion is a C++ application that implements the [native messaging protocol](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Native_messaging). This allows the browser extension to contact the Companion and send it a command. The only purpose of the Companion is set the floating browser window "always-on-top".

Prerequisites:
 * [cmake](https://cmake.org/) 3.15.7
 * [Mingw-w64](http://mingw-w64.org/) (Windows)
 * `sudo apt install libx11-dev` (Linux)

To build the companion, simply run `build.sh` (`build.bat` on Windows). This will build the application and also register the native messaging host manifests, required for the browsers to find the Companion. You can read about the manifest [here for Chrome](https://developer.chrome.com/docs/apps/nativeMessaging/#native-messaging-host-location) and [here for Firefox](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Native_manifests#manifest_location).

You can unregister the manifests with `build.sh --clean`.

See also `build.sh --help` for more details.
