const DefaultPosition = "topRight";

floatTab = function () {
    tryGetFloatingTab(function (floatingTab) {
        if (!floatingTab) {
            chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (tabs) {
                const currentTab = tabs[0];
                if (currentTab) {
                    const tabProps = {
                        tabId: currentTab.id,
                        parentWindowId: currentTab.windowId,
                        originalIndex: currentTab.index,
                        position: DefaultPosition
                    };

                    chrome.windows.get(currentTab.windowId, function (window) {
                        const positionData = getPositionDataForFloatingTab(window, DefaultPosition);

                        chrome.windows.create({
                            "tabId": currentTab.id,
                            "type": "popup",
                            "top": positionData.top,
                            "left": positionData.left,
                            "width": positionData.width,
                            "height": positionData.height,
                        }, function () {
                            setFloatingTab(tabProps, function () {
                                chrome.tabs.query({ active: true, windowId: tabProps.parentWindowId }, function (tabs) {
                                    const activeTabOnParentWindow = tabs[0];
                                    const parentWindowTitle = activeTabOnParentWindow.title;
                                    sendMakePanelRequest(currentTab.title, parentWindowTitle);
                                });
                            });
                        });
                    });
                }
            });
        }
    });
}

unfloatTab = function () {
    tryGetFloatingTab(function (floatingTab, tabProps) {
        if (floatingTab) {
            chrome.tabs.move(tabProps.tabId, { windowId: tabProps.parentWindowId, index: tabProps.originalIndex }, function () {
                clearFloatingTab();
            });
        }
    });
}

repositionFloatingTab = function (newPosition) {
    tryGetFloatingTab(function (floatingTab, tabProps) {
        if (floatingTab) {
            chrome.windows.get(tabProps.parentWindowId, function (parentWindow) {
                const newPositionData = getPositionDataForFloatingTab(parentWindow, newPosition);

                chrome.windows.update(floatingTab.windowId, newPositionData, function () {
                    tabProps.position = newPosition;
                    setFloatingTab(tabProps);
                });
            });
        }
    });
}

getPositionDataForFloatingTab = function (parentWindow, position) {
    const padding = 50;
    const extraPaddingAtTop = 50;

    const halfWidth = parseInt(parentWindow.width / 2);
    const halfHeight = parseInt(parentWindow.height / 2);
    let newTop = parentWindow.top + padding;
    let newLeft = parentWindow.left + padding;

    if (position.startsWith("top")) {
        newTop += extraPaddingAtTop;
    }
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

tryGetFloatingTab = function (callback) {
    chrome.storage.local.get(["floatingTabProperties"], function (data) {
        if (data.floatingTabProperties) {
            const tabProps = data.floatingTabProperties;
            chrome.tabs.get(tabProps.tabId, function (floatingTab) {
                if (!chrome.runtime.lastError) {
                    callback(floatingTab, tabProps);
                } else {
                    clearFloatingTab();
                    callback();
                }
            });
        } else {
            callback();
        }
    });
}

setFloatingTab = function (tabProps, callback) {
    chrome.storage.local.set({ floatingTabProperties: tabProps }, callback);
}

clearFloatingTab = function (callback) {
    chrome.storage.local.remove(["floatingTabProperties"], callback);
}