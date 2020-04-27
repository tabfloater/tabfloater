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

chrome.windows.onFocusChanged.addListener(function (windowId) {
  tryGetFloatingTab(function (floatingTab, floatingTabProperties) {
    if (floatingTab) {

      if (floatingTab.windowId === windowId) {
        // console.log("floatin tab focus");

        //chrome.windows.update(floatingTabProperties.parentWindowId, { focused: true });
        // chrome.windows.get(floatingTabProperties.parentWindowId, function(parentWindow) {
          
        //   if (parentWindow.state === "minimized") {
        //     console.log("yes");
        //     console.log(floatingTabProperties.title);
        //     qq(floatingTabProperties.title, function() {
        //       console.log("done");
        //       chrome.windows.update(floatingTab.windowId, { state: "minimized" });

        //     });
            
        //   }

        // });
      } else if (floatingTabProperties.parentWindowId === windowId) {
        // console.log("parent window focus");
      } else {
        // console.log("not sure - " + windowId);
      }
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

