window.onload = function() {
    setButtonStates();
}

floatTabButton.onclick = function () {
    window.close();
    chrome.runtime.getBackgroundPage(function (backgroundPage) {
        backgroundPage.floatTab();
    });
};

restoreTabButton.onclick = function () {
    window.close();
    chrome.runtime.getBackgroundPage(function (backgroundPage) {
        backgroundPage.unfloatTab();
    });
};

setButtonStates = function() {
    chrome.runtime.getBackgroundPage(function (backgroundPage) {
        backgroundPage.getFloatingTab(function (floatingTab) {
            let floatingTabAlreadyExists = floatingTab != undefined;
            floatTabButton.disabled = floatingTabAlreadyExists;
            restoreTabButton.disabled = !floatingTabAlreadyExists;
        });
    });
}