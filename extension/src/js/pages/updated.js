/*
 * Copyright 2023 SNSJ LLC
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

const reviewLink = window.reviewLink;
const doNotShowUpdatePageCheckbox = window.doNotShowUpdatePageCheckbox;

window.onload = async function () {
    const runningOnFirefox = await browser.runtime.sendMessage({ action: "runningOnFirefox" });

    if (runningOnFirefox) {
        reviewLink.href = "https://addons.mozilla.org/en-US/firefox/addon/tabfloater/";
    } else {
        reviewLink.href = "https://chrome.google.com/webstore/detail/iojgbjjdoanmhcmmihbapiejfbbadhjd";
    }

    doNotShowUpdatePageCheckbox.checked = !(await browser.runtime.sendMessage({ action: "loadOptions" })).showUpdatePage;
};

doNotShowUpdatePageCheckbox.onchange = async function () {
    const options = await browser.runtime.sendMessage({ action: "loadOptions" });
    options.showUpdatePage = !doNotShowUpdatePageCheckbox.checked;
    await browser.storage.sync.set({ options: options });
};
