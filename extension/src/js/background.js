import * as floater from "./floater.js";
import {getCompanionStatus} from "./companion.js";

function setDefaultSettings() {
    browser.storage.sync.set({ positioningStrategy: "fixed" });
    browser.storage.sync.set({ fixedPosition: "bottomRight" });
    browser.storage.sync.set({ smartPositioningFollowScrolling: false });
    browser.storage.sync.set({ smartPositioningFollowTabSwitches: false });
    browser.storage.sync.set({ debugging: false });
}

function startup() {
    floater.clearFloatingTab();
}

browser.runtime.onInstalled.addListener(function () {
    startup();
    setDefaultSettings();
});

browser.runtime.onStartup.addListener(function () {
    startup();
});

browser.tabs.onRemoved.addListener(async function (closingTabId) {
    const {floatingTab} = await floater.tryGetFloatingTab();

    if (floatingTab && floatingTab.id === closingTabId) {
        floater.clearFloatingTab();
    }
});

browser.windows.onRemoved.addListener(async function (closingWindowId) {
    const {floatingTab, tabProps} = await floater.tryGetFloatingTab();

    if (floatingTab && tabProps.parentWindowId === closingWindowId) {
        await browser.tabs.remove(floatingTab.id);
        floater.clearFloatingTab();
    }
});

browser.commands.onCommand.addListener(async function (command) {
    const {floatingTab} = await floater.tryGetFloatingTab();

    if (!floatingTab && command === "floatTab") {
        if (await floater.canFloatCurrentTab()) {
            await floater.floatTab();
        }
    }
    if (floatingTab && command === "unfloatTab") {
        await floater.unfloatTab();
    }
});

browser.runtime.onMessage.addListener(async function(request) {
    switch (request) {
    case "canFloatCurrentTab": return await floater.canFloatCurrentTab();
    case "getFloatingTab": {
        const {floatingTab} = await floater.tryGetFloatingTab();
        return floatingTab;
    }
    case "getCompanionStatus": return await getCompanionStatus();
    case "floatTab": await floater.floatTab(); break;
    case "unfloatTab": await floater.unfloatTab(); break;
    }
});
