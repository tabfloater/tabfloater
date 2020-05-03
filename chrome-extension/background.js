chrome.runtime.onStartup.addListener(function () {
  extensionStartup();
});

chrome.runtime.onInstalled.addListener(function () {
  extensionStartup();
});

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

