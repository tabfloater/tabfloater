const CompanionName = "io.github.ba32107.tabfloater";

export async function getCompanionStatus() {
    try {
        const response = await browser.runtime.sendNativeMessage(CompanionName, {
            action: "ping",
            debug: "true"
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

export async function sendMakeDialogRequest(windowTitle, parentWindowTitle) {
    try {
        await browser.runtime.sendNativeMessage(CompanionName, {
            action: "setAsModelessDialog",
            windowTitle: windowTitle,
            parentWindowTitle: parentWindowTitle,
            debug: "true"
        });
    } catch (error) {
        // TODO handle error
    }
}
