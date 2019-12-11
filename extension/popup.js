floatTabButton.onclick = function () {
    chrome.runtime.getBackgroundPage(function (backgroundPage) {
        backgroundPage.floatTab();
    });
};

restoreTabButton.onclick = function () {
    chrome.runtime.getBackgroundPage(function (backgroundPage) {
        backgroundPage.unfloatTab();
    });
};
