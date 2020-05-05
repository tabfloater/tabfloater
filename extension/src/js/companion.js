const CompanionName = "io.github.ba32107.tabfloater";

export function getCompanionStatus(callback) {
    chrome.runtime.sendNativeMessage(CompanionName, {
        action: "ping",
        debug: "true"
    }, function (response) {
        if (chrome.runtime.lastError || !response) {
            callback("unavailable");
        } else {
            if (response.status == "ok") {
                callback("connected");
            } else if (response.status == "inactive") {
                callback("inactive");
            } else {
                callback("error");
            }
        }
    });
}

export function sendMakePanelRequest(windowTitle, parentWindowTitle) {
    chrome.runtime.sendNativeMessage(CompanionName, {
        action: "setAsModelessDialog",
        windowTitle: windowTitle,
        parentWindowTitle: parentWindowTitle,
        debug: "true"
    }, function (response) {
        if (chrome.runtime.lastError || !response) {
            // TODO handle error
        } else {
            // TODO do something
        }
    });
}
