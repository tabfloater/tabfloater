import { CompanionName } from "./constants.js";

export async function getCompanionStatusAsync() {
    try {
        const response = await browser.runtime.sendNativeMessage(CompanionName, {
            action: "ping",
            debug: "true" // TODO wire debugging option
        });

        if (response.status === "ok") {
            return "connected";
        } else {
            // TODO handle error somehow. show it in tooltip? extra status?
            return "error";
        }
    }
    catch (error) {
        return "unavailable";
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
