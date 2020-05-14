import { CompanionName } from "./constants.js";
import { CompanionLatestVersions } from "./constants.js";
import { loadOptionsAsync } from "./main.js";

export async function getCompanionInfoAsync(logger) {
    try {
        const debug = await isDebuggingEnabledAsync();
        const companionInfo = await browser.runtime.sendNativeMessage(CompanionName, {
            action: "ping",
            debug: debug.toString()
        });

        logger.info(`Companion responded to ping request. Status: '${companionInfo.status}', Version: ${companionInfo.version} (${companionInfo.os})`);

        if (companionInfo.status === "ok") {
            const isOutdated = isOutdatedVersion(companionInfo);

            return {
                status: "connected",
                version: companionInfo.version,
                latestVersion: getLatestCompanionVersion(companionInfo),
                isOutdated: isOutdated,
                latestVersionHasBreakingChanges: isOutdated ? latestVersionHasBreakingChanges(companionInfo) : false,
                logFilePath: companionInfo.logfile
            };
        } else {
            // TODO handle error somehow. show it in tooltip? extra status?
            return {
                status: "error"
            };
        }
    }
    catch (error) {
        logger.warn(`Unable to contact companion for ping request: ${error}, message: '${error.message}'`);

        return {
            status: "unavailable"
        };
    }
}

export async function sendMakeDialogRequestAsync(windowTitle, parentWindowTitle, logger) {
    logger.info(`MakeDialog request received. Window title: '${windowTitle}', parent window title: '${parentWindowTitle}'`);

    try {
        const debug = await isDebuggingEnabledAsync();
        await browser.runtime.sendNativeMessage(CompanionName, {
            action: "setAsModelessDialog",
            windowTitle: windowTitle,
            parentWindowTitle: parentWindowTitle,
            debug: debug.toString()
        });
    } catch (error) {
        logger.error(`Unable to contact companion for MakeDialog request. Error: ${error}, message: '${error.message}'`);
    }
}

function isOutdatedVersion(companionInfo) {
    return companionInfo.version !== getLatestCompanionVersion(companionInfo);
}

function latestVersionHasBreakingChanges(companionInfo) {
    return getMajorVersion(companionInfo.version) < getMajorVersion(getLatestCompanionVersion(companionInfo));
}

function getLatestCompanionVersion(companionInfo) {
    switch (companionInfo.os) {
        case "Linux": return CompanionLatestVersions.Linux;
        case "Windows": return CompanionLatestVersions.Windows;
        default: return "unknown";
    }
}

function getMajorVersion(version) {
    return parseInt(version.substring(0, version.indexOf(".")));
}

async function isDebuggingEnabledAsync() {
    const options = await loadOptionsAsync();
    return options.debug;
}
