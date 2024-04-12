/*
 * Copyright 2023 SNSJ LLC
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

import "../libs/uuid/uuidv4.min.js";
import "../libs/webextension-polyfill/browser-polyfill.min.js";

import * as constants from "./constants.js";
import * as env from "./environment.js";
import * as floater from "./floater.js";
import * as companion from "./companion.js";
import * as analytics from "./analytics/analytics.js";
import * as googleAnalytics from "./analytics/googleAnalytics.js";
import { NullAnalytics } from "./analytics/nullAnalytics.js";
import * as logger from "./logging/logger.js";
import { ConsoleLogger } from "./logging/consoleLogger.js";
import { NullLogger } from "./logging/nullLogger.js";

const activeTabChangedListenerAsync = async activeInfo => {
    const { floatingTab, tabProps } = await floater.tryGetFloatingTabAsync();

    logger.info(`Active tab changed. floatingTab: ${floatingTab}, tabProps: '${JSON.stringify(tabProps)}', activeWindowId: ${activeInfo.windowId}`);

    if (floatingTab && tabProps.position === "smart" && tabProps.parentWindowId === activeInfo.windowId) {
        await floater.repositionFloatingTabIfExistsAsync();
    }
};

export async function loadOptionsAsync() {
    const optionsData = await browser.storage.sync.get(["options"]);
    return optionsData.options;
}

async function initializeOptionsAsync(isDevelopment) {
    const defaultOptions = isDevelopment
        ? constants.DefaultOptionsDev
        : constants.DefaultOptions;

    const currentOptionsData = await browser.storage.sync.get(["options"]);

    if (!currentOptionsData) {
        await browser.storage.sync.set({ options: defaultOptions });
    } else {
        // If we already had saved options, we need to merge that
        // object with the default options. This way, any newly added
        // options will have the correct values.
        const currentOptions = currentOptionsData.options;
        const newOptions = Object.assign({}, defaultOptions, currentOptions);
        await browser.storage.sync.set({ options: newOptions });
    }
}

function initLogger(debug) {
    logger.setLoggerImpl(debug ? ConsoleLogger : NullLogger);
}

function initAnalytics(collectUsageStats) {
    analytics.setAnalyticsImpl(collectUsageStats ? googleAnalytics.GoogleAnalytics : NullAnalytics);
}

async function showPageAsync(url) {
    await browser.tabs.create({ url: browser.runtime.getURL(url) });
}

async function startupAsync() {
    const options = await loadOptionsAsync();
    initLogger(options.debug);
    initAnalytics(options.collectUsageStats);

    if (options.positioningStrategy === "smart" && options.smartPositioningFollowTabSwitches) {
        browser.tabs.onActivated.addListener(activeTabChangedListenerAsync);
    }

    await companion.fetchLatestVersionsAsync();
    await floater.clearFloatingTabAsync();
    await floater.clearFloatingProgressAsync();

    if (await floater.getFloatCountAsync() >= constants.FloatCountToShowReviewPageOn) {
        await showReviewPageOnFloatCountHitAsync();
    }
}

async function showReviewPageOnFloatCountHitAsync() {
    await showPageAsync("html/review.html");
    await browser.storage.local.set({ floatCount: -1 });
}

async function floatTabIfPossibleAsync() {
    if (await floater.canFloatCurrentTabAsync()) {
        await floater.floatTabAsync();
    } else {
        logger.info("Unable to float current tab: either parent window only has one tab, or another floating is already in progress");
    }
}

browser.runtime.onInstalled.addListener(async details => {
    const isFirstTimeInstall = details.reason === "install";
    const isUpdate = details.reason === "update";
    const isDevelopment = await env.isDevelopmentAsync();

    await initializeOptionsAsync(isDevelopment);

    if (isFirstTimeInstall) {
        await googleAnalytics.generateClientIdAsync();
    }

    await startupAsync();

    if (!isDevelopment) {
        await window.browser.runtime.setUninstallURL("https://www.tabfloater.io/uninstall");

        if (isFirstTimeInstall) {
            await showPageAsync("html/welcome.html");
        } else if (isUpdate && (await loadOptionsAsync()).showUpdatePage) {
            await showPageAsync("html/updated.html");
        }
    }

    const os = await env.getOperatingSystemAsync();
    const browser = await env.getBrowserAsync();

    await analytics.reportInstalledEventAsync(os, browser);
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

browser.action.onClicked.addListener(async () => {
    const { floatingTab } = await floater.tryGetFloatingTabAsync();

    if (floatingTab) {
        await floater.unfloatTabAsync();
    } else {
        await floatTabIfPossibleAsync();
    }
});

browser.commands.onCommand.addListener(async command => {
    const { floatingTab, tabProps } = await floater.tryGetFloatingTabAsync();
    const options = await loadOptionsAsync();

    logger.info(`Command received: ${command}`);

    if (floatingTab) {
        logger.info(`Positioning strategy: ${options.positioningStrategy}, current position: ${tabProps.position}`);

        if (options.positioningStrategy === "smart" || options.positioningStrategy === "custom" || tabProps.position === "smart") {
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
                    await floater.repositionFloatingTabIfExistsAsync();
                    await analytics.reportTabMoveEventAsync();
                }
            }
        }
    } else if (command === "moveDown") {
        await floatTabIfPossibleAsync();
    }
});

browser.runtime.onMessage.addListener(async request => {
    logger.info(`Request received: ${request.action}`);

    switch (request.action) {
        case "getCompanionInfo": return await companion.getCompanionInfoAsync();
        case "loadOptions": return await loadOptionsAsync();
        case "runningOnFirefox": return await env.runningOnFirefoxAsync();
        case "runningOnVivaldi": return await env.runningOnVivaldiAsync();
        case "isDevelopmentEnv": return await env.isDevelopmentAsync();
        case "reportOptionsEvent": await analytics.reportOptionsEventAsync(request.data);
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

        if (!parseInt(newOptions.viewportTopOffset)) {
            newOptions.viewportTopOffset = changes.options.oldValue.viewportTopOffset;
            await browser.storage.sync.set({ options: newOptions });
        }

        initLogger(newOptions.debug);
        initAnalytics(newOptions.collectUsageStats);
    }
});
