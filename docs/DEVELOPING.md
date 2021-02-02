# Developing

TabFloater consists of two components: the browser extension and the companion application. The latter is responsible for one thing only: to make a window "always-on-top".

## Extension

Prerequisites:
 * Install `npm`
 * Install [web-ext](https://github.com/mozilla/web-ext) (only for Firefox)

To build the extension, run the folliwng. You only need to do this for the first time.

```Shell
cd extension
npm install
```

This works on both Windows and Linux. `npm install` will invoke the post-install script, which copies the dependencies to the correct directory and generates the CSS files.

Once built, you can load the extension into your browser:
 * Chrome/Chromium: go to chrome://extensions/, enable Developer mode, then click "Load unpacked", and browse the `extension/src` directory.
 * Firefox: run `npm run run-ff`. This will set up the manifest files and use `web-ext` to load the extension into Firefox.

During development for Chrome, you need to manually reload the extension after each change. Firefox will reload your changes automatically.

Once you're done with your code change, run `npm run lint` to lint the source code.

## Companion

sudo apt install libx11-dev
