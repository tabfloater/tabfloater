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

const companionStatusIndicatorConnected = window.companionStatusIndicatorConnected;
const companionStatusIndicatorUnavailable = window.companionStatusIndicatorUnavailable;
const companionUnavailableMessageCard = window.companionUnavailableMessageCard;
const companionVersionField = window.companionVersionField;
const fixedPositionRadioButton = window.fixedPositionRadioButton;
const fixPositionSelect = window.fixPositionSelect;
const tabSizeSelect = window.tabSizeSelect;
const viewportTopOffsetInput = window.viewportTopOffsetInput;
const smartPositionRadioButton = window.smartPositionRadioButton;
const followTabSwitchCheckbox = window.followTabSwitchCheckbox;
const restrictMaxFloatingTabSizeCheckbox = window.restrictMaxFloatingTabSizeCheckbox;
const hotkeyMoveDownDescription = window.hotkeyMoveDownDescription;
const hotkeyMoveDown = window.hotkeyMoveDown;
const hotkeyMoveUpDescription = window.hotkeyMoveUpDescription;
const hotkeyMoveUp = window.hotkeyMoveUp;
const hotkeyMoveLeftDescription = window.hotkeyMoveLeftDescription;
const hotkeyMoveLeft = window.hotkeyMoveLeft;
const hotkeyMoveRightDescription = window.hotkeyMoveRightDescription;
const hotkeyMoveRight = window.hotkeyMoveRight;
const hotkeyChangeButton = window.hotkeyChangeButton;
const debugCheckbox = window.debugCheckbox;
const companionLogFileField = window.companionLogFileField;
const copyCompanionLogFilePathButton = window.copyCompanionLogFilePathButton;
const copyCompanionLogFilePathSuccessIcon = window.copyCompanionLogFilePathSuccessIcon;
const copyCompanionLogFilePathSuccessMessage = window.copyCompanionLogFilePathSuccessMessage;
const tabFloaterVersionField = window.tabFloaterVersionField;

async function saveOptionsAsync() {
    const options = {};

    options.positioningStrategy = fixedPositionRadioButton.checked ? "fixed" : "smart";
    options.fixedPosition = fixPositionSelect.value;
    options.fixedTabSize = tabSizeSelect.value;

    if (isNumberInputValid(viewportTopOffsetInput)) {
        viewportTopOffsetInput.classList.remove("uk-form-danger");
        options.viewportTopOffset = viewportTopOffsetInput.value;
    } else {
        viewportTopOffsetInput.classList.add("uk-form-danger");
    }

    options.smartPositioningFollowTabSwitches = followTabSwitchCheckbox.checked;
    options.smartPositioningRestrictMaxFloatingTabSize = restrictMaxFloatingTabSizeCheckbox.checked;
    options.debug = debugCheckbox.checked;

    await browser.storage.sync.set({ options: options });
}

function setPositionButtonStates() {
    fixPositionSelect.disabled = smartPositionRadioButton.checked;
    tabSizeSelect.disabled = smartPositionRadioButton.checked;
    viewportTopOffsetInput.disabled = smartPositionRadioButton.checked;
    followTabSwitchCheckbox.disabled = fixedPositionRadioButton.checked;
    restrictMaxFloatingTabSizeCheckbox.disabled = fixedPositionRadioButton.checked;
}

function setCompanionFields(companionInfo) {
    if (companionInfo.status === "unavailable") {
        companionStatusIndicatorUnavailable.hidden = false;
        companionUnavailableMessageCard.textContent += companionInfo.errorMessage;
    } else if (companionInfo.status === "connected") {
        companionStatusIndicatorConnected.hidden = false;
        companionVersionField.textContent = `${companionInfo.version} (${companionInfo.os})`;
    }
}

async function setHotKeysAsync() {
    const hotkeys = await browser.runtime.sendMessage("getHotkeys");
    const moveDownHotKey = hotkeys.filter(k => k.name === "moveDown")[0];
    const moveUpHotKey = hotkeys.filter(k => k.name === "moveUp")[0];
    const moveLeftHotKey = hotkeys.filter(k => k.name === "moveLeft")[0];
    const moveRightHotKey = hotkeys.filter(k => k.name === "moveRight")[0];

    hotkeyMoveDownDescription.textContent = moveDownHotKey.description;
    hotkeyMoveDown.textContent = moveDownHotKey.shortcut;
    hotkeyMoveUpDescription.textContent = moveUpHotKey.description;
    hotkeyMoveUp.textContent = moveUpHotKey.shortcut;
    hotkeyMoveLeftDescription.textContent = moveLeftHotKey.description;
    hotkeyMoveLeft.textContent = moveLeftHotKey.shortcut;
    hotkeyMoveRightDescription.textContent = moveRightHotKey.description;
    hotkeyMoveRight.textContent = moveRightHotKey.shortcut;
}

async function positioningStrategyChanged() {
    setPositionButtonStates();
    saveOptionsAsync();
}

window.onload = async function () {
    const options = await browser.runtime.sendMessage("loadOptions");
    const companionInfo = await browser.runtime.sendMessage("getCompanionInfo");

    setCompanionFields(companionInfo);

    if (options.positioningStrategy === "fixed") {
        fixedPositionRadioButton.checked = true;
    } else if (options.positioningStrategy === "smart") {
        smartPositionRadioButton.checked = true;
    }

    setPositionButtonStates();

    fixPositionSelect.value = options.fixedPosition;
    tabSizeSelect.value = options.fixedTabSize;
    viewportTopOffsetInput.value = options.viewportTopOffset;
    followTabSwitchCheckbox.checked = options.smartPositioningFollowTabSwitches;
    restrictMaxFloatingTabSizeCheckbox.checked = options.smartPositioningRestrictMaxFloatingTabSize;

    await setHotKeysAsync();

    debugCheckbox.checked = options.debug;
    companionLogFileField.value = companionInfo.logFilePath;

    tabFloaterVersionField.textContent = `TabFloater ${await browser.runtime.getManifest().version}`;
};

fixedPositionRadioButton.onchange = positioningStrategyChanged;
smartPositionRadioButton.onchange = positioningStrategyChanged;
fixPositionSelect.onchange = saveOptionsAsync;
tabSizeSelect.onchange = saveOptionsAsync;
viewportTopOffsetInput.onblur = saveOptionsAsync;
followTabSwitchCheckbox.onchange = saveOptionsAsync;
restrictMaxFloatingTabSizeCheckbox.onchange = saveOptionsAsync;
debugCheckbox.onchange = saveOptionsAsync;

hotkeyChangeButton.onclick = function () {
    browser.tabs.create({url: "chrome://extensions/shortcuts/"});
}

copyCompanionLogFilePathButton.onclick = async function () {
    const logFilePath = companionLogFileField.value;

    try {
        await navigator.clipboard.writeText(logFilePath);
        showCopySuccessIndicators(true);
        await delay(1500);
        showCopySuccessIndicators(false);
    } catch (error) {
        UIkit.notification({
            message: `Copy failed: '${JSON.stringify(error)}'`,
            status: "danger",
            pos: "bottom-right",
            timeout: 5000
        });

        // We also show an empty notification as extra bottom margin for the
        // first notification. If this wasn't here, the first notification
        // would be barely visible.
        UIkit.notification({
            message: "",
            status: "danger",
            pos: "bottom-right",
            timeout: 5000
        });
    }
};

function showCopySuccessIndicators(visible) {
    copyCompanionLogFilePathButton.hidden = visible;
    copyCompanionLogFilePathSuccessIcon.hidden = !visible;
    copyCompanionLogFilePathSuccessMessage.hidden = !visible;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function isNumberInputValid(input) {
    if (!input.value || input.value === "") {
        return false;
    }

    if (input.value.toString().includes(".")) {
        return false;
    }

    return Math.abs(input.value) <= 5000;
}
