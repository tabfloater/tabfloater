/*
 * Copyright 2020 Balazs Gyurak
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
const companionLogFilePathLabel = window.companionLogFilePathLabel;
const copyCompanionLogFilePathButton = window.copyCompanionLogFilePathButton;

async function saveOptionsAsync() {
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

    await browser.storage.sync.set({ options: options });
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
    saveOptionsAsync();
}

async function setCompanionLogFileLabelAndButtonAsync() {
    if (debugCheckbox.checked) {
        companionLogFilePathLabel.disabled = false;
        copyCompanionLogFilePathButton.disabled = false;
        // TODO unhide companion log label and button instead of enabling

        if (companionLogFilePathLabel.textContent === "") {
            const companionInfo = await browser.runtime.sendMessage("getCompanionInfo");
            companionLogFilePathLabel.textContent = companionInfo.logFilePath;
        }
    } else {
        companionLogFilePathLabel.disabled = true;
        copyCompanionLogFilePathButton.disabled = true;
        // TODO hide companion log label and button instead of disabling
    }
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

    await setCompanionLogFileLabelAndButtonAsync();
};

fixedPositionRadioButton.onchange = positioningStrategyChanged;
smartPositionRadioButton.onchange = positioningStrategyChanged;
topLeftRadioButton.onchange = saveOptionsAsync;
topRightRadioButton.onchange = saveOptionsAsync;
bottomLeftRadioButton.onchange = saveOptionsAsync;
bottomRightRadioButton.onchange = saveOptionsAsync;
smallSizeRadioButton.onchange = saveOptionsAsync;
standardSizeRadioButton.onchange = saveOptionsAsync;
viewportTopOffsetInput.onblur = saveOptionsAsync;
followTabSwitchCheckbox.onchange = saveOptionsAsync;
restrictMaxFloatingTabSizeCheckbox.onchange = saveOptionsAsync;

debugCheckbox.onchange = async function () {
    await saveOptionsAsync();
    await setCompanionLogFileLabelAndButtonAsync();
};

copyCompanionLogFilePathButton.onclick = async function () {
    const logFilePath = companionLogFilePathLabel.textContent;

    try {
        await navigator.clipboard.writeText(logFilePath);
        // TODO show 'Copied' notification on the dialog
    } catch (error) {
        // TODO handle error - maybe show notification on the UI?
    }
};
