import { CompanionName } from "./constants.js";
import { CompanionLatestVersions } from "./constants.js";

export async function getCompanionInfoAsync() {
    try {
        const companionInfo = await browser.runtime.sendNativeMessage(CompanionName, {
            action: "ping",
            debug: "true" // TODO wire debugging option
        });

        if (companionInfo.status === "ok") {
            const isOutdated = isOutdatedVersion(companionInfo);

            return {
                status: "connected",
                version: companionInfo.version,
                latestVersion: getLatestCompanionVersion(companionInfo),
                isOutdated: isOutdated,
                latestVersionHasBreakingChanges: isOutdated ? latestVersionHasBreakingChanges(companionInfo) : false
            };
        } else {
            // TODO handle error somehow. show it in tooltip? extra status?
            return {
                status: "error"
            };
        }
    }
    catch (error) {
        return {
            status: "unavailable"
        };
    }
}

export async function sendMakeDialogRequestAsync(windowTitle, parentWindowTitle) {
    try {
        await browser.runtime.sendNativeMessage(CompanionName, {
            action: "setAsModelessDialog",
            windowTitle: windowTitle,
            parentWindowTitle: parentWindowTitle,
            debug: "true" // TODO wire debugging option
        });
    } catch (error) {
        // TODO handle error
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
