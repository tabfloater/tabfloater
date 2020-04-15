const CompanionName = "io.github.ba32107.tabfloater"

getCompanionStatus = function(callback) {
    chrome.runtime.sendNativeMessage(CompanionName, {
        action: "ping"
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

sendMakePanelRequest = function(windowTitle) {
    chrome.runtime.sendNativeMessage(CompanionName, {
        action: "makepanel",
        title: windowTitle
    }, function (response) {
        if (chrome.runtime.lastError || !response) {
            // TODO handle error
        } else {
            // TODO do something
        }
    });
}