# Releasing TabFloater

> ℹ️ This document is intended for maintainers only.

The release pipeline of TabFloater is mostly automated, but there's some manual work involved.

### Preparing the release

 1. Update dependencies by running `npm update` in the [`extension`](../extension) directory
 2. Bump the version number in [`package.json`](../extension/package.json)
 3. Bump the version in the manifest files, both for [Chrome](../extension/src/manifest.json) and [Firefox](../extension/src/manifest_firefox.json)
 4. Update the [user changelog](../extension/src/html/updated.html) (optional)
 5. If you also want to release the companion:
   * Bump the version in [`CMakeLists.txt`](../companion/CMakeLists.txt)
   * Add a changelog entry for the Ubuntu PPA by running [`add_changelog.sh`](../companion/packaging/linux/add_changelog.sh). Describe your changes and set the new version header to `<version>-SERIES1`.
   * Set the companion [fallback versions](../extension/src/js/constants.js) (optional). These values are only used if the versions on tabfloater.io are not reachable for some reason.

An example release preparatory PR: https://github.com/tabfloater/tabfloater/pull/266

### Executing the release

 1. Make sure the above changes are merged to `master`
 2. Draft a [new release](https://github.com/tabfloater/tabfloater/releases/new)
 3. Pick a new tag name. If you are releasing only the extension, use the format `v<version>`. If you are also releasing the companion, use `v<version>_companion`. For example, `v1.2.1_companion`.
 4. Publish the new release. This will kick off the deployment workflows.
 5. The Chrome Web Store publication is fully automated.
 6. If you used the tag format `v<version>_companion`, the companion release workflow is triggered as well:
   * The Windows companion is built and uploaded to the release
   * The Linux AppImage is built and uploaded to the release
   * The Ubuntu package is built and uploaded to the PPA
   * Download links are updated for the tabfloater.io site
 7. The Firefox publication is partially manual. The release workflow will upload the Firefox packages to the GitHub release, which you need to upload to the Firefox Web Store:
   * Download `tabfloater_picture-in-picture_for_any_tab_-<version>.zip` and `extension-firefox-source-package.zip` from the newly created GitHub release
   * Go to TabFloater's add-on page at https://addons.mozilla.org/en-GB/developers/addons, and click `Upload New Version`
   * Follow the instructions. When prompted, choose "Yes, I need to upload a source package" and use the file downloaded at the previous step.
 
An example release: https://github.com/tabfloater/tabfloater/releases/tag/v1.2.1_companion

Once https://github.com/tabfloater/tabfloater/issues/227 is solved, the Firefox release pipeline will be fully automated as well.

## One-time setup

The automated release pipeline requires setting up some secrets. The pipeline uploads assets to two destinations: the Chrome Web Store and Launchpad. Secrets need to be set up for both.

#### Chrome Web Store

Uploading to the Chrome Web Store in an automated fashion requires 3 secrets: a client ID, a client secret, and a refresh token. All these are associated with the Google account that owns the Chrome Web Store item. The values are [used here](https://github.com/tabfloater/tabfloater/blob/master/.github/workflows/release_extension.yaml#L33).

 * Refer to [this guide](https://github.com/fregante/chrome-webstore-upload/blob/c4f264605ff0618b268a38924332bc217fa7ca49/How%20to%20generate%20Google%20API%20keys.md) to generate the values
 * Save the values in the [corresponding secrets in this repo](https://github.com/tabfloater/tabfloater/settings/secrets/actions)
