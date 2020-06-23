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
import * as env from "./environment.js";
import * as floater from "./floater.js";
import { getCompanionInfoAsync } from "./companion.js";
import { getLoggerAsync } from "./logger.js";

const activeTabChangedListenerAsync = async activeInfo => {
    const logger = await getLoggerAsync();
    const { floatingTab, tabProps } = await floater.tryGetFloatingTabAsync();

    logger.info(`Active tab changed. floatingTab: ${floatingTab}, tabProps: '${JSON.stringify(tabProps)}', activeWindowId: ${activeInfo.windowId}`);

    if (floatingTab && tabProps.position === "smart" && tabProps.parentWindowId === activeInfo.windowId) {
        await floater.repositionFloatingTabIfExistsAsync(logger);
    }
};

export async function loadOptionsAsync() {
    const optionsData = await browser.storage.sync.get(["options"]);
    return optionsData.options;
}

async function setDefaultOptionsAsync(isDevelopment) {
    const defaultOptions = constants.DefaultOptions;
    if (isDevelopment) {
        defaultOptions.debug = true;
    }

    await browser.storage.sync.set({ options: defaultOptions });

    if (constants.DefaultOptions.positioningStrategy === "smart" && constants.DefaultOptions.smartPositioningFollowTabSwitches) {
        browser.tabs.onActivated.addListener(activeTabChangedListenerAsync);
    }
}

async function startupAsync() {
    await floater.clearFloatingTabAsync();
    await floater.clearFloatingProgressAsync();
}

async function showWelcomePageOnFirstInstallationAsync() {
    await browser.tabs.create({ url: "html/welcome.html" });
}

async function floatTabIfPossibleAsync(logger) {
    if (await floater.canFloatCurrentTabAsync()) {
        await floater.floatTabAsync(logger);
    } else {
        logger.info("Unable to float current tab: either parent window only has one tab, or another floating is already in progress");
    }
}

browser.runtime.onInstalled.addListener(async () => {
    const isDevelopment = await env.isDevelopmentAsync();

    await setDefaultOptionsAsync(isDevelopment);
    await startupAsync();

    if (!isDevelopment) {
        await showWelcomePageOnFirstInstallationAsync();
    }
});

browser.runtime.onStartup.addListener(async () => {
    await startupAsync();
});

browser.tabs.onRemoved.addListener(async closingTabId => {
    const floatingTabData = await floater.tryGetFloatingTabAsync();

    if (floatingTabData.tabProps && floatingTabData.tabProps.tabId === closingTabId) {
        await floater.clearFloatingTabAsync();
    }
});

browser.windows.onRemoved.addListener(async closingWindowId => {
    const { floatingTab, tabProps } = await floater.tryGetFloatingTabAsync();

    if (floatingTab && tabProps.parentWindowId === closingWindowId) {
        await browser.tabs.remove(floatingTab.id);
        await floater.clearFloatingTabAsync();
    }
});

browser.browserAction.onClicked.addListener(async () => {
    const logger = await getLoggerAsync();
    const { floatingTab } = await floater.tryGetFloatingTabAsync();

    if (floatingTab) {
        await floater.unfloatTabAsync();
    } else {
        await floatTabIfPossibleAsync(logger);
    }
});

browser.commands.onCommand.addListener(async command => {
    const logger = await getLoggerAsync();
    const { floatingTab, tabProps } = await floater.tryGetFloatingTabAsync();
    const options = await loadOptionsAsync();

    logger.info(`Command received: ${command}`);

    if (floatingTab) {
        logger.info(`Positioning strategy: ${options.positioningStrategy}, current position: ${tabProps.position}`);

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
        await floatTabIfPossibleAsync(logger);
    }
});

browser.runtime.onMessage.addListener(async request => {
    const logger = await getLoggerAsync();

    logger.info(`Request received: ${request}`);

    switch (request) {
        case "getCompanionInfo": return await getCompanionInfoAsync(logger);
        case "loadOptions": return await loadOptionsAsync();
        case "getHotkeys": return await browser.commands.getAll();
        case "runningOnFirefox": return await env.runningOnFirefoxAsync();
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
