import * as floater from './floater.js';
import {getCompanionStatus} from './companion.js';

function setDefaultSettings() {
    chrome.storage.sync.set({ positioningStrategy: "fixed" });
    chrome.storage.sync.set({ fixedPosition: "bottomRight" });
    chrome.storage.sync.set({ smartPositioningFollowScrolling: false });
    chrome.storage.sync.set({ smartPositioningFollowTabSwitches: false });
    chrome.storage.sync.set({ debugging: false });
}

function extensionStartup() {
    floater.clearFloatingTab();
}

chrome.runtime.onInstalled.addListener(function () {
    extensionStartup();
    setDefaultSettings();
});

chrome.runtime.onStartup.addListener(function () {
    extensionStartup();
});

chrome.tabs.onRemoved.addListener(function (closingTabId) {
    floater.tryGetFloatingTab(function (floatingTab) {
        if (floatingTab && floatingTab.id === closingTabId) {
            floater.clearFloatingTab();
        }
    });
});

chrome.windows.onRemoved.addListener(function (closingWindowId) {
    floater.tryGetFloatingTab(function (floatingTab, floatingTabProperties) {
        if (floatingTab && floatingTabProperties.parentWindowId === closingWindowId) {
            chrome.tabs.remove(floatingTab.id, function () {
                floater.clearFloatingTab();
            });
        }
    });
});

chrome.commands.onCommand.addListener(function (command) {
    floater.tryGetFloatingTab(function (floatingTab) {
        if (!floatingTab && command === "floatTab") {
            floater.canFloatCurrentTab(function (canFloat) {
                if (canFloat) {
                    floater.floatTab();
                }
            });
        }
        if (floatingTab && command === "unfloatTab") {
            floater.unfloatTab();
        }
    });
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    switch (request) {
    case "canFloatCurrentTab": {
        floater.canFloatCurrentTab(function(canFloat) {
            sendResponse(canFloat);
        });
        return true;
    }
    case "getFloatingTab": {
        floater.tryGetFloatingTab(function (floatingTab) {
            sendResponse(floatingTab);
        });
        return true;
    }
    case "getCompanionStatus": {
        getCompanionStatus(function(status) {
            sendResponse(status);
        });
        return true;
    }
    case "floatTab": floater.floatTab(); break;
    case "unfloatTab": floater.unfloatTab(); break;
    }
});
