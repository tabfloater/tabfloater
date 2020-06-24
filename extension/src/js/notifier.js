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

export function setFloatingSuccessIndicator() {
    setIconProperties("Unfloat tab! The floating tab will be restored to its original position.", "F", "info");
}

export function setErrorIndicator(message) {
    setIconProperties(message, "!", "error");
}

export function setUpdateAvailableIndicator() {
    setIconProperties("A companion update is available! Go to the Options page to download it.", "U", "warn");
}

export function clearIndicator() {
    setIconProperties("Float tab! The current tab will be extracted into a floating window.", "", "info");
}

export function setIconProperties(tooltip, badgeText, level) {
    let color;

    switch (level) {
        case "info": color = "#3DCBA8"; break;
        case "warn": color = "#F4CA16"; break;
        case "error": color = "#DC143C"; break;
    }

    browser.browserAction.setTitle({ title: tooltip });
    browser.browserAction.setBadgeText({ text: badgeText });
    browser.browserAction.setBadgeBackgroundColor({ color: color });
}
