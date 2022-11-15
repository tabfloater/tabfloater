/*
 * Copyright 2021 Balazs Gyurak
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
const companionUnavailableMessage = window.companionUnavailableMessage;
const companionVersionField = window.companionVersionField;
const companionRequiredIndicator = window.companionRequiredIndicator;
const companionUpdateIndicator = window.companionUpdateIndicator;
const companionUpdateVersionText = window.companionUpdateVersionText;
const companionBreakingChangesIndicator = window.companionBreakingChangesIndicator;
const companionStatusHiddenField = window.companionStatusHiddenField;
const companionVersionHiddenField = window.companionVersionHiddenField;
const companionOsHiddenField = window.companionOsHiddenField;
const companionErrorMessageHiddenField = window.companionErrorMessageHiddenField;
const downloadCompanionButton = window.downloadCompanionButton;
const downloadCompanionLink = window.downloadCompanionLink;
const alwaysOnTopAllAppsCheckbox = window.alwaysOnTopAllAppsCheckbox;
const fixedPositionRadioButton = window.fixedPositionRadioButton;
const fixPositionSelect = window.fixPositionSelect;
const tabSizeSelect = window.tabSizeSelect;
const viewportTopOffsetInput = window.viewportTopOffsetInput;
const viewportRightOffsetInput = window.viewportRightOffsetInput;
const smartPositionRadioButton = window.smartPositionRadioButton;
const followTabSwitchCheckbox = window.followTabSwitchCheckbox;
const followTabSwitchSlider = window.followTabSwitchSlider;
const restrictMaxFloatingTabSizeCheckbox = window.restrictMaxFloatingTabSizeCheckbox;
const restrictMaxFloatingTabSizeSlider = window.restrictMaxFloatingTabSizeSlider;
const customPositionRadioButton = window.customPositionRadioButton;
const hotkeyVivaldiWarning = window.hotkeyVivaldiWarning;
const hotkeyMoveDownDescription = window.hotkeyMoveDownDescription;
const hotkeyMoveDown = window.hotkeyMoveDown;
const hotkeyMoveUpDescription = window.hotkeyMoveUpDescription;
const hotkeyMoveUp = window.hotkeyMoveUp;
const hotkeyMoveLeftDescription = window.hotkeyMoveLeftDescription;
const hotkeyMoveLeft = window.hotkeyMoveLeft;
const hotkeyMoveRightDescription = window.hotkeyMoveRightDescription;
const hotkeyMoveRight = window.hotkeyMoveRight;
const hotkeyChangeButton = window.hotkeyChangeButton;
const firefoxHotKeyChangeInfo = window.firefoxHotKeyChangeInfo;
const collectUsageStatsCheckbox = window.collectUsageStatsCheckbox;
const showUpdatePageCheckbox = window.showUpdatePageCheckbox;
const debugCheckbox = window.debugCheckbox;
const chromeDebugInfo = window.chromeDebugInfo;
const firefoxDebugInfo = window.firefoxDebugInfo;
const companionLogFileField = window.companionLogFileField;
const copyCompanionLogFilePathButton = window.copyCompanionLogFilePathButton;
const copyCompanionLogFilePathSuccessIcon = window.copyCompanionLogFilePathSuccessIcon;
const copyCompanionLogFilePathSuccessMessage = window.copyCompanionLogFilePathSuccessMessage;
const tabFloaterVersionField = window.tabFloaterVersionField;

function buildOptionsObject() {
    return {
        alwaysOnTopAllApps: alwaysOnTopAllAppsCheckbox.checked,
        positioningStrategy: getPositioningStrategy(),
        fixedPosition: fixPositionSelect.value,
        fixedTabSize: tabSizeSelect.value,top
        viewportTopOffset: parseInt(viewportTopOffsetInput.value),
        viewportRightOffset: parseInt(viewportRightOffset.value),
        smartPositioningFollowTabSwitches: followTabSwitchCheckbox.checked,
        smartPositioningRestrictMaxFloatingTabSize: restrictMaxFloatingTabSizeCheckbox.checked,
        collectUsageStats: collectUsageStatsCheckbox.checked,
        showUpdatePage: showUpdatePageCheckbox.checked,
        debug: debugCheckbox.checked
    };
}

async function saveOptionsAsync() {
    await browser.storage.sync.set({ options: buildOptionsObject() });
}

function setPositioningControlStates() {
    fixPositionSelect.disabled = smartPositionRadioButton.checked || customPositionRadioButton.checked;
    tabSizeSelect.disabled = smartPositionRadioButton.checked || customPositionRadioButton.checked;
    viewportTopOffsetInput.disabled = smartPositionRadioButton.checked || customPositionRadioButton.checked;
    viewportRightOffset.disabled = smartPositionRadioButton.checked || customPositionRadioButton.checked;
    followTabSwitchCheckbox.disabled = fixedPositionRadioButton.checked || customPositionRadioButton.checked;
    restrictMaxFloatingTabSizeCheckbox.disabled = fixedPositionRadioButton.checked || customPositionRadioButton.checked;

    if (smartPositionRadioButton.checked) {
        followTabSwitchSlider.classList.remove("uk-switch-slider-disabled");
        restrictMaxFloatingTabSizeSlider.classList.remove("uk-switch-slider-disabled");
    } else {
        followTabSwitchSlider.classList.add("uk-switch-slider-disabled");
        restrictMaxFloatingTabSizeSlider.classList.add("uk-switch-slider-disabled");
    }
}

function setCompanionFields(companionInfo) {
    const isConnected = companionInfo.status === "connected";

    companionStatusHiddenField.textContent = companionInfo.status;
    companionVersionHiddenField.textContent = isConnected ? companionInfo.version : "n/a";
    companionOsHiddenField.textContent = isConnected ? companionInfo.os : "n/a";
    companionErrorMessageHiddenField.textContent = companionInfo.errorMessage || "n/a";

    if (isConnected) {
        // The "connected" indicator is invisible rather than hidden, because
        // we need a div to take up the space until the page fully loads. If
        // this were hidden instead of invisible, the page would jump around
        // while loading.
        companionStatusIndicatorConnected.classList.remove("uk-invisible");
        companionVersionField.textContent = `${companionInfo.version} (${companionInfo.os})`;

        if (companionInfo.isOutdated) {
            companionUpdateIndicator.hidden = false;
            companionUpdateVersionText.textContent += companionInfo.latestVersion;
            downloadCompanionButton.hidden = false;
            downloadCompanionLink.textContent = "Update the companion...";

            if (companionInfo.latestVersionHasBreakingChanges) {
                companionBreakingChangesIndicator.hidden = false;
            }
        }

        companionLogFileField.value = companionInfo.logFilePath;
    } else {
        companionStatusIndicatorConnected.hidden = true;
        companionStatusIndicatorUnavailable.hidden = false;
        companionUnavailableMessage.textContent += companionInfo.errorMessage;
        companionRequiredIndicator.hidden = false;
        downloadCompanionButton.hidden = false;
        downloadCompanionLink.textContent = "Get the companion...";
        companionLogFileField.value = "";
    }
}

async function setHotKeysLabelsAsync(positioningStrategy) {
    const hotkeys = await browser.commands.getAll();
    const moveDownHotKey = hotkeys.filter(k => k.name === "moveDown")[0];
    const moveUpHotKey = hotkeys.filter(k => k.name === "moveUp")[0];
    const moveLeftHotKey = hotkeys.filter(k => k.name === "moveLeft")[0];
    const moveRightHotKey = hotkeys.filter(k => k.name === "moveRight")[0];

    hotkeyMoveDown.textContent = moveDownHotKey.shortcut;
    hotkeyMoveUp.textContent = moveUpHotKey.shortcut;

    if (positioningStrategy === "fixed") {
        hotkeyMoveDownDescription.textContent = moveDownHotKey.description;
        hotkeyMoveUpDescription.textContent = moveUpHotKey.description;
        hotkeyMoveLeftDescription.textContent = moveLeftHotKey.description;
        hotkeyMoveLeft.textContent = moveLeftHotKey.shortcut;
        hotkeyMoveRightDescription.textContent = moveRightHotKey.description;
        hotkeyMoveRight.textContent = moveRightHotKey.shortcut;
    } else {
        hotkeyMoveDownDescription.textContent = "Float tab";
        hotkeyMoveUpDescription.textContent = "Unfloat tab";
        hotkeyMoveLeftDescription.textContent = "Unused";
        hotkeyMoveLeft.textContent = "";
        hotkeyMoveRightDescription.textContent = "Unused";
        hotkeyMoveRight.textContent = "";
    }
}

async function positioningStrategyChangedAsync() {
    const selectedPositioningStrategy = getPositioningStrategy();
    let preventSwitchToSmartPositioning = false;

    if (selectedPositioningStrategy === "smart") {
        const permissions = await browser.permissions.getAll();

        if (!permissions.origins.includes("<all_urls>")) {
            preventSwitchToSmartPositioning = true;

            try {
                await UIkit.modal.confirm("Smart positioning works by examining the website layout " +
                    "and calculating the optimal position for the floating tab. In order to do this, " +
                    "the extension requires additional permissions from the browser. It will not read " +
                    "any data on the websites you visit and will not track your browsing history. " +
                    "Learn more about this by visiting our <a href=\"https://www.tabfloater.io/privacy\" " +
                    "target=\"_blank\">privacy policy</a>." +
                    "<br/><br/>" +
                    "If you wish to proceed, click OK and grant the permissions. You only need to do this once.");

                const granted = await browser.permissions.request({ origins: ["<all_urls>"] });

                if (granted) {
                    preventSwitchToSmartPositioning = false;
                }
            } catch (ignore) {
                // user clicked cancel
            }
        }
    }

    if (preventSwitchToSmartPositioning) {
        fixedPositionRadioButton.checked = true;
        smartPositionRadioButton.checked = false;
    } else {
        setPositioningControlStates();
        setHotKeysLabelsAsync(selectedPositioningStrategy);
        saveOptionsAsync();
    }
}

window.onload = async function () {
    const options = await browser.runtime.sendMessage({ action: "loadOptions" });
    const companionInfo = await browser.runtime.sendMessage({ action: "getCompanionInfo" });
    const runningOnFirefox = await browser.runtime.sendMessage({ action: "runningOnFirefox" });
    const runningOnVivaldi = await browser.runtime.sendMessage({ action: "runningOnVivaldi" });
    const isDevelopmentEnv = await browser.runtime.sendMessage({ action: "isDevelopmentEnv" });

    setCompanionFields(companionInfo);

    alwaysOnTopAllAppsCheckbox.checked = options.alwaysOnTopAllApps;

    switch (options.positioningStrategy) {
        case "fixed": fixedPositionRadioButton.checked = true; break;
        case "smart": smartPositionRadioButton.checked = true; break;
        case "custom": customPositionRadioButton.checked = true; break;
    }

    setPositioningControlStates();

    fixPositionSelect.value = options.fixedPosition;
    tabSizeSelect.value = options.fixedTabSize;
    viewportTopOffsetInput.value = options.viewportTopOffset;
    followTabSwitchCheckbox.checked = options.smartPositioningFollowTabSwitches;
    restrictMaxFloatingTabSizeCheckbox.checked = options.smartPositioningRestrictMaxFloatingTabSize;

    await setHotKeysLabelsAsync(options.positioningStrategy);
    if (runningOnFirefox) {
        firefoxHotKeyChangeInfo.hidden = false;
        hotkeyChangeButton.classList.add("uk-link-muted");
    } else {
        hotkeyChangeButton.onclick = function () {
            browser.tabs.create({ url: "chrome://extensions/shortcuts/" });
        };
    }

    if (runningOnVivaldi) {
        hotkeyVivaldiWarning.hidden = false;
    }

    collectUsageStatsCheckbox.checked = options.collectUsageStats;
    showUpdatePageCheckbox.checked = options.showUpdatePage;
    debugCheckbox.checked = options.debug;
    if (runningOnFirefox) {
        chromeDebugInfo.hidden = true;
        firefoxDebugInfo.hidden = false;
    }

    let version = `TabFloater ${await browser.runtime.getManifest().version}`;
    if (isDevelopmentEnv) {
        version += " - dev";
    }
    tabFloaterVersionField.textContent = version;
};

window.onunload = async function () {
    const data = Object.assign(buildOptionsObject(), {
        companionStatus: companionStatusHiddenField.textContent,
        companionVersion: companionVersionHiddenField.textContent,
        companionOs: companionOsHiddenField.textContent,
        companionErrorMessage: companionErrorMessageHiddenField.textContent
    });

    await browser.runtime.sendMessage({
        action: "reportOptionsEvent",
        data: data
    });
};

alwaysOnTopAllAppsCheckbox.onchange = saveOptionsAsync;
fixedPositionRadioButton.onchange = positioningStrategyChangedAsync;
smartPositionRadioButton.onchange = positioningStrategyChangedAsync;
customPositionRadioButton.onchange = positioningStrategyChangedAsync;
fixPositionSelect.onchange = saveOptionsAsync;
tabSizeSelect.onchange = saveOptionsAsync;
viewportTopOffsetInput.onblur = async function () {
    if (isNumberInputValid(viewportTopOffsetInput)) {
        viewportTopOffsetInput.classList.remove("uk-form-danger");
    } else {
        viewportTopOffsetInput.classList.add("uk-form-danger");
    }

    await saveOptionsAsync();
};
followTabSwitchCheckbox.onchange = saveOptionsAsync;
restrictMaxFloatingTabSizeCheckbox.onchange = saveOptionsAsync;
collectUsageStatsCheckbox.onchange = saveOptionsAsync;
showUpdatePageCheckbox.onchange = saveOptionsAsync;
debugCheckbox.onchange = saveOptionsAsync;
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

function getPositioningStrategy() {
    return fixedPositionRadioButton.checked
        ? "fixed"
        : (smartPositionRadioButton.checked ? "smart" : "custom");
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
