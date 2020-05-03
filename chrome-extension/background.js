chrome.runtime.onInstalled.addListener(function () {
  extensionStartup();
  setDefaultSettings();
});

chrome.runtime.onStartup.addListener(function () {
  extensionStartup();
});

setDefaultSettings = function () {
  chrome.storage.sync.set({ positioningStrategy: "fixed" });
  chrome.storage.sync.set({ fixedPosition: "bottomRight" });
  chrome.storage.sync.set({ smartPositioningFollowScrolling: false });
  chrome.storage.sync.set({ smartPositioningFollowTabSwitches: false });
  chrome.storage.sync.set({ debugging: false });
}

function extensionStartup() {
  clearFloatingTab();
}

chrome.tabs.onRemoved.addListener(function (closingTabId) {
  tryGetFloatingTab(function (floatingTab) {
    if (floatingTab && floatingTab.id === closingTabId) {
      clearFloatingTab();
    }
  });
});

chrome.windows.onRemoved.addListener(function (closingWindowId) {
  tryGetFloatingTab(function (floatingTab, floatingTabProperties) {
    if (floatingTab && floatingTabProperties.parentWindowId === closingWindowId) {
      chrome.tabs.remove(floatingTab.id, function () {
        clearFloatingTab();
      });
    }
  });
});

chrome.commands.onCommand.addListener(function (command) {
  tryGetFloatingTab(function (floatingTab) {
    if (!floatingTab && command === "floatTab") {
      canFloatCurrentTab(function (canFloat) {
        if (canFloat) {
          floatTab();
        }
      });
    }
    if (floatingTab && command === "unfloatTab") {
      unfloatTab();
    }
  });
});

