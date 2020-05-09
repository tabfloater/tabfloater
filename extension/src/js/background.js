import * as floater from "./floater.js";
import { getCompanionStatusAsync } from "./companion.js";

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

const activeTabChangedListenerAsync = async activeInfo => {
    const { floatingTab, tabProps } = await floater.tryGetFloatingTabAsync();
    if (floatingTab && tabProps.position === "smart" && tabProps.parentWindowId === activeInfo.windowId) {
        await floater.repositionFloatingTabAsync();
    }
};

export async function loadOptionsAsync() {
    const optionsData = await browser.storage.sync.get(["options"]);
    return optionsData.options;
}

function setDefaultOptions() {
    browser.storage.sync.set({
        options: {
            positioningStrategy: "smart",
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

browser.runtime.onInstalled.addListener(() => {
    startup();
    setDefaultOptions();
});

browser.runtime.onStartup.addListener(() => {
    startup();
});

browser.tabs.onRemoved.addListener(async closingTabId => {
    const { floatingTab } = await floater.tryGetFloatingTabAsync();

    if (floatingTab && floatingTab.id === closingTabId) {
        floater.clearFloatingTab();
    }
});

browser.windows.onRemoved.addListener(async closingWindowId => {
    const { floatingTab, tabProps } = await floater.tryGetFloatingTabAsync();

    if (floatingTab && tabProps.parentWindowId === closingWindowId) {
        await browser.tabs.remove(floatingTab.id);
        floater.clearFloatingTab();
    }
});

browser.commands.onCommand.addListener(async command => {
    const { floatingTab, tabProps } = await floater.tryGetFloatingTabAsync();
    const options = await loadOptionsAsync();

    if (floatingTab) {
        if (options.positioningStrategy === "smart" || tabProps.position === "smart") {
            if (command === "moveUp") {
                await floater.unfloatTabAsync();
            }
        } else if (options.positioningStrategy === "fixed") {
            const currentPosition = tabProps.position;
            const inUpperHalf = currentPosition === "topLeft" || currentPosition === "topRight";
            if (inUpperHalf && command === "moveUp") {
                await floater.unfloatTabAsync();
            } else {
                const newPosition = CommandToPositionMapping[currentPosition + "," + command];
                if (newPosition) {
                    tabProps.position = newPosition;
                    await floater.setFloatingTabAsync(tabProps);
                    await floater.repositionFloatingTabAsync();
                }
            }
        }
    } else if (command === "moveDown") {
        await floater.floatTabAsync();
    }
});

browser.runtime.onMessage.addListener(async request => {
    switch (request) {
        case "canFloatCurrentTab": return await floater.canFloatCurrentTabAsync();
        case "getFloatingTab": {
            const { floatingTab } = await floater.tryGetFloatingTabAsync();
            return floatingTab;
        }
        case "getCompanionStatus": return await getCompanionStatusAsync();
        case "floatTab": await floater.floatTabAsync(); break;
        case "unfloatTab": await floater.unfloatTabAsync(); break;
        case "loadOptions": return await loadOptionsAsync();
    }
});

browser.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName === "sync") {
        const newOptions = changes.options.newValue;

        if (newOptions.smartPositioningFollowTabSwitches) {
            browser.tabs.onActivated.addListener(activeTabChangedListenerAsync);
        } else {
            browser.tabs.onActivated.removeListener(activeTabChangedListenerAsync);
        }
    }
});
