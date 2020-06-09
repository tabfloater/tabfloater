/*
 * Copyright 2020 Balazs Gyurak
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as constants from "./constants.js";
import * as floater from "./floater.js";
import { getCompanionInfoAsync } from "./companion.js";
import { getLoggerAsync } from "./logger.js";

const activeTabChangedListenerAsync = async activeInfo => {
    const logger = await getLoggerAsync();
    const { floatingTab, tabProps } = await floater.tryGetFloatingTabAsync(logger);

    logger.info(`Active tab changed. floatingTab: ${floatingTab}, tabProps: '${JSON.stringify(tabProps)}', activeWindowId: ${activeInfo.windowId}`);

    if (floatingTab && tabProps.position === "smart" && tabProps.parentWindowId === activeInfo.windowId) {
        await floater.repositionFloatingTabIfExistsAsync(logger);
    }
};

export async function loadOptionsAsync() {
    const optionsData = await browser.storage.sync.get(["options"]);
    return optionsData.options;
}

async function setDefaultOptionsAsync() {
    await browser.storage.sync.set({ options: constants.DefaultOptions });

    if (constants.DefaultOptions.positioningStrategy === "smart" && constants.DefaultOptions.smartPositioningFollowTabSwitches) {
        browser.tabs.onActivated.addListener(activeTabChangedListenerAsync);
    }
}

async function startupAsync() {
    await floater.clearFloatingTabAsync();
    await floater.clearFloatingProgressAsync();
}

browser.runtime.onInstalled.addListener(async () => {
    await startupAsync();
    await setDefaultOptionsAsync();
});

browser.runtime.onStartup.addListener(async () => {
    await startupAsync();
});

browser.tabs.onRemoved.addListener(async closingTabId => {
    const logger = await getLoggerAsync();
    const { floatingTab } = await floater.tryGetFloatingTabAsync(logger);

    if (floatingTab && floatingTab.id === closingTabId) {
        await floater.clearFloatingTabAsync();
    }
});

browser.windows.onRemoved.addListener(async closingWindowId => {
    const logger = await getLoggerAsync();
    const { floatingTab, tabProps } = await floater.tryGetFloatingTabAsync(logger);

    if (floatingTab && tabProps.parentWindowId === closingWindowId) {
        await browser.tabs.remove(floatingTab.id);
        await floater.clearFloatingTabAsync();
    }
});

browser.commands.onCommand.addListener(async command => {
    const logger = await getLoggerAsync();
    const { floatingTab, tabProps } = await floater.tryGetFloatingTabAsync(logger);
    const options = await loadOptionsAsync();

    logger.info(`Command received: ${command}`);

    if (floatingTab) {
        logger.info(`Positioning strategy: ${options.positioningStrategy}, current position: ${tabProps.position}`);

        if (options.positioningStrategy === "smart" || tabProps.position === "smart") {
            if (command === "moveUp") {
                await floater.unfloatTabAsync(logger);
            }
        } else if (options.positioningStrategy === "fixed") {
            const currentPosition = tabProps.position;
            const inUpperHalf = currentPosition === "topLeft" || currentPosition === "topRight";
            if (inUpperHalf && command === "moveUp") {
                await floater.unfloatTabAsync(logger);
            } else {
                const newPosition = constants.CommandToPositionMapping[`${currentPosition},${command}`];

                logger.info(`New position: ${newPosition}`);

                if (newPosition) {
                    tabProps.position = newPosition;
                    await floater.setFloatingTabAsync(tabProps);
                    await floater.repositionFloatingTabIfExistsAsync(logger);
                }
            }
        }
    } else if (command === "moveDown") {
        if (await floater.canFloatCurrentTabAsync()) {
            await floater.floatTabAsync(logger);
        } else {
            logger.info("Unable to float current tab: either parent window only has one tab, or another floating is already in progress");
        }
    }
});

browser.runtime.onMessage.addListener(async request => {
    const logger = await getLoggerAsync();

    logger.info(`Request received: ${request}`);

    switch (request) {
        case "canFloatCurrentTab": {
            const canFloatCurrentTab = await floater.canFloatCurrentTabAsync();
            logger.info(`canFloatCurrentTab: ${canFloatCurrentTab}`);
            return canFloatCurrentTab;
        }
        case "getFloatingTab": {
            const { floatingTab } = await floater.tryGetFloatingTabAsync(logger);
            logger.info(`floatingTab: ${floatingTab}`);
            return floatingTab;
        }
        case "getCompanionInfo": return await getCompanionInfoAsync(logger);
        case "floatTab": await floater.floatTabAsync(logger); break;
        case "unfloatTab": await floater.unfloatTabAsync(logger); break;
        case "loadOptions": return await loadOptionsAsync();
        case "getHotkeys": return await browser.commands.getAll();
    }
});

browser.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName === "sync") {
        const newOptions = changes.options.newValue;

        if (newOptions.positioningStrategy === "smart" && newOptions.smartPositioningFollowTabSwitches) {
            browser.tabs.onActivated.addListener(activeTabChangedListenerAsync);
        } else {
            browser.tabs.onActivated.removeListener(activeTabChangedListenerAsync);
        }
    }
});
