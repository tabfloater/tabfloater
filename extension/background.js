const CommandToPositionMapping = {
  "topLeft,key-down": "bottomLeft",
  "topLeft,key-right": "topRight",
  "bottomLeft,key-up": "topLeft",
  "bottomLeft,key-right": "bottomRight",
  "topRight,key-left": "topLeft",
  "topRight,key-down": "bottomRight",
  "bottomRight,key-up": "topRight",
  "bottomRight,key-left": "bottomLeft",
};

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
  getFloatingTab(function(floatingTab) {
    if (floatingTab && floatingTab.id == closingTabId) {
      clearFloatingTab();
    }
  });
});

chrome.commands.onCommand.addListener(function (command) {
  getFloatingTab(function (floatingTab, tabProps) {
    if (floatingTab) {
      var currentPosition = tabProps.position;
      let inUpperHalf = currentPosition == "topLeft" || currentPosition == "topRight";

      if (inUpperHalf && command == "key-up") {
        unfloatTab();
      } else {
        let newPosition = CommandToPositionMapping[currentPosition + "," + command];

        if (newPosition) {
          repositionFloatingTab(newPosition);
        }
      }
    } else {
      if (command == "key-down") {
        floatTab();
      }
    }
  });
});

