window.onload = function () {
    chrome.storage.sync.get(["positioningStrategy"], function (data) {
        if (data.positioningStrategy === "fixed") {
            fixedPositionRadioButton.checked = true;
        } else if (data.positioningStrategy === "smart") {
            smartPositionRadioButton.checked = true;
        }

        setPositionButtonStates();
    });

    chrome.storage.sync.get(["fixedPosition"], function (data) {
        switch (data.fixedPosition) {
            case "topLeft": topLeftRadioButton.checked = true; break;
            case "topRight": topRightRadioButton.checked = true; break;
            case "bottomLeft": bottomLeftRadioButton.checked = true; break;
            case "bottomRight": bottomRightRadioButton.checked = true; break;
        }
    });

    chrome.storage.sync.get(["smartPositioningFollowScrolling"], function (data) {
        followScrollCheckbox.checked = data.smartPositioningFollowScrolling;
    });

    chrome.storage.sync.get(["smartPositioningFollowTabSwitches"], function (data) {
        followTabSwitchCheckbox.checked = data.smartPositioningFollowTabSwitches;
    });

    chrome.storage.sync.get(["debugging"], function (data) {
        debugCheckbox.checked = data.debugging;
    });
}

setPositionButtonStates = function () {
    const positioningStrategy = fixedPositionRadioButton.checked ? "fixed" : "smart";
    chrome.storage.sync.set({ positioningStrategy: positioningStrategy });

    topLeftRadioButton.disabled = smartPositionRadioButton.checked;
    topRightRadioButton.disabled = smartPositionRadioButton.checked;
    bottomLeftRadioButton.disabled = smartPositionRadioButton.checked;
    bottomRightRadioButton.disabled = smartPositionRadioButton.checked;

    followScrollCheckbox.disabled = fixedPositionRadioButton.checked;
    followTabSwitchCheckbox.disabled = fixedPositionRadioButton.checked;
}

fixedPositionRadioButtonChanged = function () {
    let fixedPosition;
    if (topLeftRadioButton.checked) {
        fixedPosition = "topLeft";
    } else if (topRightRadioButton.checked) {
        fixedPosition = "topRight";
    } else if (bottomLeftRadioButton.checked) {
        fixedPosition = "bottomLeft";
    } else if (bottomRightRadioButton.checked) {
        fixedPosition = "bottomRight";
    }

    chrome.storage.sync.set({ fixedPosition: fixedPosition });
}

fixedPositionRadioButton.onchange = setPositionButtonStates;
smartPositionRadioButton.onchange = setPositionButtonStates;
topLeftRadioButton.onchange = fixedPositionRadioButtonChanged;
topRightRadioButton.onchange = fixedPositionRadioButtonChanged;
bottomLeftRadioButton.onchange = fixedPositionRadioButtonChanged;
bottomRightRadioButton.onchange = fixedPositionRadioButtonChanged;

followScrollCheckbox.onchange = function () {
    chrome.storage.sync.set({ smartPositioningFollowScrolling: followScrollCheckbox.checked });
}

followTabSwitchCheckbox.onchange = function () {
    chrome.storage.sync.set({ smartPositioningFollowTabSwitches: followTabSwitchCheckbox.checked });
}

debugCheckbox.onchange = function () {
    chrome.storage.sync.set({ debugging: debugCheckbox.checked });
}
