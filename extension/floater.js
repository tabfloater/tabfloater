const DefaultPosition = "topRight";

floatTab = function () {
    chrome.storage.local.get(['floatingTabProperties'], function (data) {
        let floatingTabAlreadyExists = data.floatingTabProperties != undefined;

        if (!floatingTabAlreadyExists) {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                var currentTab = tabs[0];
                if (currentTab) {
                    // chrome.tabs.executeScript(currentTab.id, { code: "document.title = '" + FloatingWindowTitle + "'" });

                    let tabProps = {
                        tabId: currentTab.id,
                        parentWindowId: currentTab.windowId,
                        originalIndex: currentTab.index,
                        position: DefaultPosition
                    };

                    chrome.windows.get(currentTab.windowId, function (window) {
                        var positionData = getPositionDataForFloatingTab(window, DefaultPosition);

                        chrome.windows.create({
                            'tabId': currentTab.id,
                            'type': 'popup',
                            'top': positionData.top,
                            'left': positionData.left,
                            'width': positionData.width,
                            'height': positionData.height,
                            // setSelfAsOpener': true
                            // focused: false     
                        }, function () {
                            chrome.storage.local.set({ floatingTabProperties: tabProps });
                        });
                    });
                }
            });
        }
    });
}


unfloatTab = function () {
    chrome.storage.local.get(['floatingTabProperties'], function (data) {
        if (data.floatingTabProperties) {
            let tabProps = data.floatingTabProperties;
            chrome.tabs.get(tabProps.tabId, function () {
                chrome.tabs.move(tabProps.tabId, { windowId: tabProps.parentWindowId, index: tabProps.originalIndex }, function () {
                    chrome.storage.local.remove(['floatingTabProperties']);
                });
            });
        }
    });
}

repositionFloatingTab = function (newPosition) {
    chrome.storage.local.get(['floatingTabProperties'], function (data) {
        if (data.floatingTabProperties) {
            let tabProps = data.floatingTabProperties;

            chrome.tabs.get(tabProps.tabId, function (floatingTab) {
                chrome.windows.get(tabProps.parentWindowId, function (parentWindow) {
                    let newPositionData = getPositionDataForFloatingTab(parentWindow, newPosition);

                    chrome.windows.update(floatingTab.windowId, newPositionData, function () {
                        tabProps.position = newPosition;
                        chrome.storage.local.set({ floatingTabProperties: tabProps });
                    });
                });
            });
        }
    });
}

getPositionDataForFloatingTab = function (parentWindow, position) {
    const padding = 50;
    let halfWidth = parseInt(parentWindow.width / 2);
    let halfHeight = parseInt(parentWindow.height / 2);
    let newTop = parentWindow.top + padding;
    let newLeft = parentWindow.left + padding;

    if (position.startsWith("bottom")) {
        newTop += halfHeight;
    }
    if (position.endsWith("Right")) {
        newLeft += halfWidth;
    }

    return {
        top: newTop,
        left: newLeft,
        width: halfWidth - padding * 2,
        height: halfHeight - padding * 2
    };
}
