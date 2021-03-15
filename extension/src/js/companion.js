/*
 * Copyright 2021 Balazs Gyurak
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

import { CompanionName } from "./constants.js";
import { CompanionLatestVersionsFallback } from "./constants.js";
import { loadOptionsAsync } from "./main.js";
import * as logger from "./logging/logger.js";

export async function getCompanionInfoAsync() {
    try {
        const options = await loadOptionsAsync();
        const companionInfo = await browser.runtime.sendNativeMessage(CompanionName, {
            action: "ping",
            debug: options.debug.toString()
        });

        logger.info(`Companion responded to ping request. Status: '${companionInfo.status}', Version: ${companionInfo.version} (${companionInfo.os})`);

        if (companionInfo.status === "ok") {
            const latestVersion = await getLatestCompanionVersionAsync(companionInfo);
            const isOutdated = isOutdatedVersion(companionInfo, latestVersion);

            return {
                status: "connected",
                version: companionInfo.version,
                os: companionInfo.os,
                latestVersion: latestVersion,
                isOutdated: isOutdated,
                latestVersionHasBreakingChanges: isOutdated ? latestVersionHasBreakingChanges(companionInfo, latestVersion) : false,
                logFilePath: companionInfo.logfile
            };
        } else {
            // should never happen - the companion only sends "ok" to a ping request
        }
    }
    catch (error) {
        logger.warn(`Unable to contact companion for ping request: '${JSON.stringify(error)}'`);

        return {
            status: "unavailable",
            errorMessage: error.message
        };
    }
}

export async function sendMakeDialogRequestAsync(windowTitle, parentWindowTitle) {
    logger.info(`MakeDialog request received. Window title: '${windowTitle}', parent window title: '${parentWindowTitle}'`);

    try {
        const options = await loadOptionsAsync();
        const maxRetryCount = 5;
        let retryCount = 0;
        const action = options.alwaysOnTopAllApps
            ? "setAlwaysOnTop"
            : "setAsModelessDialog";

        while (retryCount <= maxRetryCount) {
            const result = await browser.runtime.sendNativeMessage(CompanionName, {
                action: action,
                windowTitle: windowTitle,
                parentWindowTitle: parentWindowTitle,
                debug: options.debug.toString()
            });

            if (result.status === "ok") {
                return {
                    success: true
                };
            }

            await sleepAsync(100 + retryCount * 200);
            retryCount++;
        }

        return {
            success: false,
            reason: "error"
        };
    } catch (error) {
        logger.error(`Unable to contact companion for MakeDialog request. Error: '${JSON.stringify(error)}'`);
        return {
            success: false,
            reason: "unavailable"
        };
    }
}

export async function fetchLatestVersionsAsync() {
    await fetchAndSaveLatestCompanionVersionAsync("linux", CompanionLatestVersionsFallback.Linux);
    await fetchAndSaveLatestCompanionVersionAsync("windows", CompanionLatestVersionsFallback.Windows);
}

async function fetchAndSaveLatestCompanionVersionAsync(platform, fallbackValue) {
    const url = `https://www.tabfloater.io/companion-latest-${platform}`;
    let version;

    try {
        const response = await fetch(url, { cache: "no-cache" });
        version = await response.text();
    } catch (error) {
        logger.warn(`Error while fetching latest companion version: ${error}`);
        logger.warn(`Falling back to hardcoded value: ${fallbackValue}`);
        version = fallbackValue;
    }

    const latestVersion = {};
    latestVersion[`companion-latest-${platform}`] = version;
    await browser.storage.local.set(latestVersion);
}

function isOutdatedVersion(companionInfo, latest) {
    const current = companionInfo.version.replace("-dev", "");

    logger.info(`Companion version check. Current version: ${current}, latest version: ${latest}`);

    const currentMajor = getMajorVersion(current);
    const latestMajor = getMajorVersion(latest);

    if (currentMajor < latestMajor) {
        return true;
    }

    if (currentMajor === latestMajor) {
        const currentMinor = getMinorVersion(current);
        const latestMinor = getMinorVersion(latest);

        if (currentMinor < latestMinor) {
            return true;
        }

        if (currentMinor === latestMinor) {
            const currentPatch = getPatchVersion(current);
            const latestPatch = getPatchVersion(latest);

            if (currentPatch < latestPatch) {
                return true;
            }
        }
    }

    return false;
}

async function getLatestCompanionVersionAsync(companionInfo) {
    const storageKey = `companion-latest-${companionInfo.os.toLowerCase()}`;
    var versionObject = await browser.storage.local.get(storageKey);
    return versionObject[storageKey];
}

function latestVersionHasBreakingChanges(companionInfo, latest) {
    return getMajorVersion(companionInfo.version) < getMajorVersion(latest);
}

function getMajorVersion(version) {
    return parseInt(version.substring(0, version.indexOf(".")));
}

function getMinorVersion(version) {
    return parseInt(version.substring(version.indexOf(".") + 1, version.lastIndexOf(".")));
}

function getPatchVersion(version) {
    return parseInt(version.substring(version.lastIndexOf(".") + 1, version.length));
}

async function sleepAsync(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
