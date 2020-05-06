const fixedPositionRadioButton = window.fixedPositionRadioButton;
const smartPositionRadioButton = window.smartPositionRadioButton;
const topLeftRadioButton = window.topLeftRadioButton;
const topRightRadioButton = window.topRightRadioButton;
const bottomLeftRadioButton = window.bottomLeftRadioButton;
const bottomRightRadioButton = window.bottomRightRadioButton;
const followScrollCheckbox = window.followScrollCheckbox;
const followTabSwitchCheckbox = window.followTabSwitchCheckbox;
const debugCheckbox = window.debugCheckbox;

// TODO rewrite this to use single object in settings

function setPositionButtonStates() {
    const positioningStrategy = fixedPositionRadioButton.checked ? "fixed" : "smart";
    browser.storage.sync.set({ positioningStrategy: positioningStrategy });

    topLeftRadioButton.disabled = smartPositionRadioButton.checked;
    topRightRadioButton.disabled = smartPositionRadioButton.checked;
    bottomLeftRadioButton.disabled = smartPositionRadioButton.checked;
    bottomRightRadioButton.disabled = smartPositionRadioButton.checked;

    followScrollCheckbox.disabled = fixedPositionRadioButton.checked;
    followTabSwitchCheckbox.disabled = fixedPositionRadioButton.checked;
}

function fixedPositionRadioButtonChanged() {
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

    browser.storage.sync.set({ fixedPosition: fixedPosition });
}

window.onload = async function () {
    const positioningStrategyData = await browser.storage.sync.get(["positioningStrategy"]);

    if (positioningStrategyData.positioningStrategy === "fixed") {
        fixedPositionRadioButton.checked = true;
    } else if (positioningStrategyData.positioningStrategy === "smart") {
        smartPositionRadioButton.checked = true;
    }

    setPositionButtonStates();

    const fixedPositionData = await browser.storage.sync.get(["fixedPosition"]);
    switch (fixedPositionData.fixedPosition) {
    case "topLeft": topLeftRadioButton.checked = true; break;
    case "topRight": topRightRadioButton.checked = true; break;
    case "bottomLeft": bottomLeftRadioButton.checked = true; break;
    case "bottomRight": bottomRightRadioButton.checked = true; break;
    }

    const smartPositioningFollowScrollingData = await browser.storage.sync.get(["smartPositioningFollowScrolling"]);
    followScrollCheckbox.checked = smartPositioningFollowScrollingData.smartPositioningFollowScrolling;

    const smartPositioningFollowTabSwitchesData = await browser.storage.sync.get(["smartPositioningFollowTabSwitches"]);
    followTabSwitchCheckbox.checked = smartPositioningFollowTabSwitchesData.smartPositioningFollowTabSwitches;

    const debuggingData = await browser.storage.sync.get(["debugging"]);
    debugCheckbox.checked = debuggingData.debugging;
};

fixedPositionRadioButton.onchange = setPositionButtonStates;
smartPositionRadioButton.onchange = setPositionButtonStates;
topLeftRadioButton.onchange = fixedPositionRadioButtonChanged;
topRightRadioButton.onchange = fixedPositionRadioButtonChanged;
bottomLeftRadioButton.onchange = fixedPositionRadioButtonChanged;
bottomRightRadioButton.onchange = fixedPositionRadioButtonChanged;

followScrollCheckbox.onchange = function () {
    browser.storage.sync.set({ smartPositioningFollowScrolling: followScrollCheckbox.checked });
};

followTabSwitchCheckbox.onchange = function () {
    browser.storage.sync.set({ smartPositioningFollowTabSwitches: followTabSwitchCheckbox.checked });
};

debugCheckbox.onchange = function () {
    browser.storage.sync.set({ debugging: debugCheckbox.checked });
};
