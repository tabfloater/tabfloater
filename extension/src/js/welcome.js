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

const installCompanionDiv = window.installCompanionDiv;
const companionAlreadyInstalledDiv = window.companionAlreadyInstalledDiv;
const pinExtensionWarning = window.pinExtensionWarning;
const optionsButton = window.optionsButton;

optionsButton.onclick = async function () {
    await browser.tabs.create({ active: true });
    await browser.runtime.openOptionsPage();
};

window.onload = async function () {
    const companionInfo = await browser.runtime.sendMessage({ action: "getCompanionInfo" });
    const runningOnFirefox = await browser.runtime.sendMessage({ action: "runningOnFirefox" });

    if (companionInfo.status === "connected") {
        installCompanionDiv.hidden = true;
        companionAlreadyInstalledDiv.hidden = false;
    } else {
        // The "installCompanionDiv" is invisible rather than hidden, because
        // we need a div to take up the space until the page fully loads.
        installCompanionDiv.classList.remove("uk-invisible");
    }

    if (runningOnFirefox) {
        pinExtensionWarning.hidden = true;
    }
};
