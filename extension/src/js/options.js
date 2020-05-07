const fixedPositionRadioButton = window.fixedPositionRadioButton;
const smartPositionRadioButton = window.smartPositionRadioButton;
const topLeftRadioButton = window.topLeftRadioButton;
const topRightRadioButton = window.topRightRadioButton;
const bottomLeftRadioButton = window.bottomLeftRadioButton;
const bottomRightRadioButton = window.bottomRightRadioButton;
const followScrollCheckbox = window.followScrollCheckbox;
const followTabSwitchCheckbox = window.followTabSwitchCheckbox;
const debugCheckbox = window.debugCheckbox;

async function loadOptions() {
    const optionsData = await browser.storage.sync.get(["options"]);
    return optionsData.options;
}

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

    options.smartPositioningFollowScrolling = followScrollCheckbox.checked;
    options.smartPositioningFollowTabSwitches = followTabSwitchCheckbox.checked;
    options.debugging = debugCheckbox.checked;

    browser.storage.sync.set({ options: options });
}

function setPositionButtonStates() {
    topLeftRadioButton.disabled = smartPositionRadioButton.checked;
    topRightRadioButton.disabled = smartPositionRadioButton.checked;
    bottomLeftRadioButton.disabled = smartPositionRadioButton.checked;
    bottomRightRadioButton.disabled = smartPositionRadioButton.checked;
    followScrollCheckbox.disabled = fixedPositionRadioButton.checked;
    followTabSwitchCheckbox.disabled = fixedPositionRadioButton.checked;
}

function positioningStrategyChanged() {
    setPositionButtonStates();
    saveOptions();
}

window.onload = async function () {
    const options = await loadOptions();

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

    followScrollCheckbox.checked = options.smartPositioningFollowScrolling;
    followTabSwitchCheckbox.checked = options.smartPositioningFollowTabSwitches;
    debugCheckbox.checked = options.debugging;
};

fixedPositionRadioButton.onchange = positioningStrategyChanged;
smartPositionRadioButton.onchange = positioningStrategyChanged;
topLeftRadioButton.onchange = saveOptions;
topRightRadioButton.onchange = saveOptions;
bottomLeftRadioButton.onchange = saveOptions;
bottomRightRadioButton.onchange = saveOptions;
followScrollCheckbox.onchange = saveOptions;
followTabSwitchCheckbox.onchange = saveOptions;
debugCheckbox.onchange = saveOptions;
