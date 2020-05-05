const floatTabButton = window.floatTabButton;
const unfloatTabButton = window.unfloatTabButton;
const optionsButton = window.optionsButton;
const companionStatusConnecting = window.companionStatusConnecting;
const companionStatusConnected = window.companionStatusConnected;
const companionStatusInactive = window.companionStatusInactive;
const companionStatusError = window.companionStatusError;
const companionStatusUnavailable = window.companionStatusUnavailable;

function setButtonStates() {
    chrome.runtime.sendMessage("getFloatingTab", function(floatingTab) {
        const floatingTabAlreadyExists = floatingTab != undefined;

        if (floatingTabAlreadyExists) {
            floatTabButton.disabled = true;
            unfloatTabButton.disabled = false;
        } else {
            unfloatTabButton.disabled = true;
            chrome.runtime.sendMessage("canFloatCurrentTab", function(canFloat) {
                floatTabButton.disabled = !canFloat;
            });
        }
    });
}

function setCompanionStatusIndicator() {
    chrome.runtime.sendMessage("getCompanionStatus", function (status) {
        companionStatusConnecting.classList.add("is-hidden");

        if (status == "connected") {
            companionStatusConnected.classList.remove("is-hidden");
        } else if (status == "inactive") {
            companionStatusInactive.classList.remove("is-hidden");
        } else if (status == "error") {
            companionStatusError.classList.remove("is-hidden");
        } else {
            companionStatusUnavailable.classList.remove("is-hidden");
        }
    });
}

window.onload = function () {
    setButtonStates();
    setCompanionStatusIndicator();
};

floatTabButton.onclick = function () {
    window.close();
    chrome.runtime.sendMessage("floatTab");
};

unfloatTabButton.onclick = function () {
    window.close();
    chrome.runtime.sendMessage("unfloatTab");
};

optionsButton.onclick = function () {
    if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
    } else {
        window.open(chrome.runtime.getURL("options.html"));
    }
};
