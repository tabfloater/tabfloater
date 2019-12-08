floatTabButton.onclick = function () {
    chrome.extension.getBackgroundPage().floatTab();
};

restoreTabButton.onclick = function () {
    chrome.extension.getBackgroundPage().unfloatTab();
};
