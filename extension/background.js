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

chrome.commands.onCommand.addListener(function (command) {
  chrome.storage.local.get(['floatingTabProperties'], function (data) {

    if (data.floatingTabProperties) {
      var currentPosition = data.floatingTabProperties.position;
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