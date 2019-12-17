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

getSupportedOperations = function(callback) {
    chrome.runtime.sendNativeMessage(CompanionName, {
        action: "operations"
    }, function (response) {
        if (chrome.runtime.lastError || !response) {
            callback("unavailable");
        } else {
            callback(response.operations);
        }
    });
}

sendMakePanelRequest = function() {
    chrome.runtime.sendNativeMessage(CompanionName, {
        action: "makepanel",
        operations : [
            "alwaysontop",
            "undecorate",
            "notaskbar"
        ]
    }, function (response) {
        if (chrome.runtime.lastError || !response) {
            // TODO handle error
        } else {
            // TODO do something
        }
    });
}