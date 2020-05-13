const fixedPositionRadioButton = window.fixedPositionRadioButton;
const smartPositionRadioButton = window.smartPositionRadioButton;
const topLeftRadioButton = window.topLeftRadioButton;
const topRightRadioButton = window.topRightRadioButton;
const bottomLeftRadioButton = window.bottomLeftRadioButton;
const bottomRightRadioButton = window.bottomRightRadioButton;
const smallSizeRadioButton = window.smallSizeRadioButton;
const standardSizeRadioButton = window.normalSizeRadioButton;
const viewportTopOffsetInput = window.viewportTopOffsetInput;
const followTabSwitchCheckbox = window.followTabSwitchCheckbox;
const restrictMaxFloatingTabSizeCheckbox = window.restrictMaxFloatingTabSizeCheckbox;
const debugCheckbox = window.debugCheckbox;

function saveOptions() {
    const options = {};

    options.positioningStrategy = fixedPositionRadioButton.checked ? "fixed" : "smart";

    if (topLeftRadioButton.checked) {
        options.fixedPosition = "topLeft";
    } else if (topRightRadioButton.checked) {
        options.fixedPosition = "topRight";
    } else if (bottomLeftRadioButton.checked) {
        options.fixedPosition = "bottomLeft";
    } else if (bottomRightRadioButton.checked) {
        options.fixedPosition = "bottomRight";
    }

    if (smallSizeRadioButton.checked) {
        options.fixedTabSize = "small";
    } else if (standardSizeRadioButton.checked) {
        options.fixedTabSize = "standard";
    }

    // TODO validation (as part of UI rework). negative numbers allowed
    options.viewportTopOffset = parseInt(viewportTopOffsetInput.value);
    options.smartPositioningFollowTabSwitches = followTabSwitchCheckbox.checked;
    options.smartPositioningRestrictMaxFloatingTabSize = restrictMaxFloatingTabSizeCheckbox.checked;
    options.debug = debugCheckbox.checked;

    browser.storage.sync.set({ options: options });
}

function setPositionButtonStates() {
    topLeftRadioButton.disabled = smartPositionRadioButton.checked;
    topRightRadioButton.disabled = smartPositionRadioButton.checked;
    bottomLeftRadioButton.disabled = smartPositionRadioButton.checked;
    bottomRightRadioButton.disabled = smartPositionRadioButton.checked;
    smallSizeRadioButton.disabled = smartPositionRadioButton.checked;
    standardSizeRadioButton.disabled = smartPositionRadioButton.checked;
    viewportTopOffsetInput.disabled = smartPositionRadioButton.checked;
    followTabSwitchCheckbox.disabled = fixedPositionRadioButton.checked;
    restrictMaxFloatingTabSizeCheckbox.disabled = fixedPositionRadioButton.checked;
}

function positioningStrategyChanged() {
    setPositionButtonStates();
    saveOptions();
}

window.onload = async function () {
    const options = await browser.runtime.sendMessage("loadOptions");

    if (options.positioningStrategy === "fixed") {
        fixedPositionRadioButton.checked = true;
    } else if (options.positioningStrategy === "smart") {
        smartPositionRadioButton.checked = true;
    }

    setPositionButtonStates();

    switch (options.fixedPosition) {
        case "topLeft": topLeftRadioButton.checked = true; break;
        case "topRight": topRightRadioButton.checked = true; break;
        case "bottomLeft": bottomLeftRadioButton.checked = true; break;
        case "bottomRight": bottomRightRadioButton.checked = true; break;
    }

    switch (options.fixedTabSize) {
        case "small": smallSizeRadioButton.checked = true; break;
        case "standard": standardSizeRadioButton.checked = true; break;
    }

    viewportTopOffsetInput.value = options.viewportTopOffset;
    followTabSwitchCheckbox.checked = options.smartPositioningFollowTabSwitches;
    restrictMaxFloatingTabSizeCheckbox.checked = options.smartPositioningRestrictMaxFloatingTabSize;
    debugCheckbox.checked = options.debug;
};

fixedPositionRadioButton.onchange = positioningStrategyChanged;
smartPositionRadioButton.onchange = positioningStrategyChanged;
topLeftRadioButton.onchange = saveOptions;
topRightRadioButton.onchange = saveOptions;
bottomLeftRadioButton.onchange = saveOptions;
bottomRightRadioButton.onchange = saveOptions;
smallSizeRadioButton.onchange = saveOptions;
standardSizeRadioButton.onchange = saveOptions;
viewportTopOffsetInput.onblur = saveOptions;
followTabSwitchCheckbox.onchange = saveOptions;
restrictMaxFloatingTabSizeCheckbox.onchange = saveOptions;
debugCheckbox.onchange = saveOptions;
