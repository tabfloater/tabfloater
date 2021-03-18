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

export async function getOperatingSystemAsync() {
    return (await browser.runtime.getPlatformInfo()).os;
}

export async function getBrowserAsync() {
    if (await runningOnFirefoxAsync()) {
        return "firefox";
    }

    if (await runningOnVivaldiAsync()) {
        return "vivaldi";
    }

    return "chrome";
}

export async function runningOnFirefoxAsync() {
    if (browser.runtime.getBrowserInfo) {
        const browserInfo = await browser.runtime.getBrowserInfo();
        return browserInfo.name.toLowerCase().includes("firefox");
    }

    return false;
}

export async function runningOnVivaldiAsync() {
    const tabs = await browser.tabs.query({ active: true });

    if (tabs && tabs.length > 0) {
        // this property is only available on Vivaldi
        return tabs[0].extData;
    }

    return false;
}

export async function isDevelopmentAsync() {
    const extensionInfo = await browser.management.getSelf();
    return extensionInfo.installType === "development";
}
