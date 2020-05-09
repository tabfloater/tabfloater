const floatTabButton = window.floatTabButton;
const unfloatTabButton = window.unfloatTabButton;
const optionsButton = window.optionsButton;
const companionStatusConnecting = window.companionStatusConnecting;
const companionStatusConnected = window.companionStatusConnected;
const companionStatusError = window.companionStatusError;
const companionStatusUnavailable = window.companionStatusUnavailable;

async function setButtonStatesAsync() {
    const floatingTab = await browser.runtime.sendMessage("getFloatingTab");

    if (floatingTab) {
        floatTabButton.disabled = true;
        unfloatTabButton.disabled = false;
    } else {
        unfloatTabButton.disabled = true;

        const canFloatCurrentTab = await browser.runtime.sendMessage("canFloatCurrentTab");
        floatTabButton.disabled = !canFloatCurrentTab;
    }
}

async function setCompanionStatusIndicatorAsync() {
    const status = await browser.runtime.sendMessage("getCompanionStatus");

    companionStatusConnecting.classList.add("is-hidden");

    if (status === "connected") {
        companionStatusConnected.classList.remove("is-hidden");
    } else if (status === "error") {
        companionStatusError.classList.remove("is-hidden");
    } else {
        companionStatusUnavailable.classList.remove("is-hidden");
    }
}

window.onload = async function () {
    await setButtonStatesAsync();
    await setCompanionStatusIndicatorAsync();
};

floatTabButton.onclick = function () {
    window.close();
    browser.runtime.sendMessage("floatTab");
};

unfloatTabButton.onclick = function () {
    window.close();
    browser.runtime.sendMessage("unfloatTab");
};

optionsButton.onclick = function () {
    if (browser.runtime.openOptionsPage) {
        browser.runtime.openOptionsPage();
    } else {
        window.open(browser.runtime.getURL("../html/options.html"));
    }
};
