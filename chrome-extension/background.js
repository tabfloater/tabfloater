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
  console.log("comm rec: " + command);
  tryGetFloatingTab(function (floatingTab, tabProps) {
    if (!floatingTab && command === "key-pageDown") {
      floatTab();
    }
    if (floatingTab && command === "key-pageUp") {
      unfloatTab();
    }
  });
});

