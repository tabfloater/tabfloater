import * as floater from "./floater.js";
import { getCompanionStatus } from "./companion.js";

const CommandToPositionMapping = {
    "topLeft,moveDown": "bottomLeft",
    "topLeft,moveRight": "topRight",
    "bottomLeft,moveUp": "topLeft",
    "bottomLeft,moveRight": "bottomRight",
    "topRight,moveLeft": "topLeft",
    "topRight,moveDown": "bottomRight",
    "bottomRight,moveUp": "topRight",
    "bottomRight,moveLeft": "bottomLeft",
};

function setDefaultOptions() {
    browser.storage.sync.set({
        options: {
            positioningStrategy: "fixed",
            fixedPosition: "bottomRight",
            smartPositioningFollowScrolling: false,
            smartPositioningFollowTabSwitches: false,
            debugging: false
        }
    });
}

function startup() {
    floater.clearFloatingTab();
}

browser.runtime.onInstalled.addListener(function () {
    startup();
    setDefaultOptions();
});

browser.runtime.onStartup.addListener(function () {
    startup();
});

browser.tabs.onRemoved.addListener(async function (closingTabId) {
    const { floatingTab } = await floater.tryGetFloatingTab();

    if (floatingTab && floatingTab.id === closingTabId) {
        floater.clearFloatingTab();
    }
});

browser.windows.onRemoved.addListener(async function (closingWindowId) {
    const { floatingTab, tabProps } = await floater.tryGetFloatingTab();

    if (floatingTab && tabProps.parentWindowId === closingWindowId) {
        await browser.tabs.remove(floatingTab.id);
        floater.clearFloatingTab();
    }
});

browser.commands.onCommand.addListener(async function (command) {
    const { floatingTab, tabProps } = await floater.tryGetFloatingTab();

    if (floatingTab) {
        const currentPosition = tabProps.position;
        const inUpperHalf = currentPosition == "topLeft" || currentPosition == "topRight";
        if (inUpperHalf && command == "moveUp") {
            await floater.unfloatTab();
        } else {
            const newPosition = CommandToPositionMapping[currentPosition + "," + command];
            if (newPosition) {
                await floater.repositionFloatingTab(newPosition);
            }
        }
    } else if (command == "moveDown") {
        await floater.floatTab();
    }
});

browser.runtime.onMessage.addListener(async function (request) {
    switch (request) {
        case "canFloatCurrentTab": return await floater.canFloatCurrentTab();
        case "getFloatingTab": {
            const { floatingTab } = await floater.tryGetFloatingTab();
            return floatingTab;
        }
        case "getCompanionStatus": return await getCompanionStatus();
        case "floatTab": await floater.floatTab(); break;
        case "unfloatTab": await floater.unfloatTab(); break;
    }
});
