const floatTabButton = window.floatTabButton;
const unfloatTabButton = window.unfloatTabButton;
const optionsButton = window.optionsButton;
const companionStatusConnecting = window.companionStatusConnecting;
const companionStatusConnected = window.companionStatusConnected;
const companionStatusError = window.companionStatusError;
const companionStatusUnavailable = window.companionStatusUnavailable;
const outDatedVersionWarning = window.outDatedVersionWarning;
const companionVersionLabel = window.companionVersionLabel;
const outDatedVersionBreakingChangesWarning = window.outDatedVersionBreakingChangesWarning;

function hide(element) {
    element.classList.add("is-hidden");
}

function unhide(element) {
    element.classList.remove("is-hidden");
}

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

function setCompanionStatusIndicator(status) {
    hide(companionStatusConnecting);

    if (status === "connected") {
        unhide(companionStatusConnected);
    } else if (status === "error") {
        unhide(companionStatusError);
    } else {
        unhide(companionStatusUnavailable);
    }
}

function setCompanionVersionWarningsIfOutdated(companionInfo) {
    if (companionInfo.isOutdated) {
        unhide(outDatedVersionWarning);
        companionVersionLabel.textContent = `Current version: ${companionInfo.version} New version: ${companionInfo.latestVersion}`;

        if (companionInfo.latestVersionHasBreakingChanges) {
            unhide(outDatedVersionBreakingChangesWarning);
        }
    }
}

window.onload = async function () {
    const companionInfo = await browser.runtime.sendMessage("getCompanionInfo");
    await setButtonStatesAsync();
    setCompanionStatusIndicator(companionInfo.status);
    setCompanionVersionWarningsIfOutdated(companionInfo);
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
