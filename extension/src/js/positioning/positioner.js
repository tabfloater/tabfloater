import { loadOptions } from "../background.js";
import { tryGetFloatingTab } from "../floater.js";

export async function getStartingPosition() {
    const options = await loadOptions();

    let startingPosition;

    if (options.positioningStrategy === "fixed") {
        startingPosition = options.fixedPosition;
    } else if (options.positioningStrategy === "smart") {
        startingPosition = "smart";
    }

    return startingPosition;
}

export async function getCoordinates() {
    const options = await loadOptions();
    const { floatingTab, tabProps } = await tryGetFloatingTab();

    let coordinates;
    if (options.positioningStrategy === "fixed") {
        let window;
        let fixedPosition;
        if (floatingTab) {
            window = await browser.windows.get(tabProps.parentWindowId);
            fixedPosition = tabProps.position;
        } else {
            const allActiveTabs = await browser.tabs.query({ active: true, lastFocusedWindow: true });
            const currentTab = allActiveTabs[0];
            window = await browser.windows.get(currentTab.windowId);
            fixedPosition = options.fixedPosition;
        }

        coordinates = getFixedPositionCoordinates(window, fixedPosition);
    } else if (options.positioningStrategy === "smart") {
        coordinates = getSmartPositionCoordinates();
    }

    return coordinates;
}

function getFixedPositionCoordinates(parentWindow, position) {
    const padding = 50;
    const extraPaddingAtTop = 50;

    const halfWidth = parseInt(parentWindow.width / 2);
    const halfHeight = parseInt(parentWindow.height / 2);
    let newTop = parentWindow.top + padding;
    let newLeft = parentWindow.left + padding;

    if (position.startsWith("top")) {
        newTop += extraPaddingAtTop;
    }
    if (position.startsWith("bottom")) {
        newTop += halfHeight;
    }
    if (position.endsWith("Right")) {
        newLeft += halfWidth;
    }

    return {
        top: newTop,
        left: newLeft,
        width: halfWidth - padding * 2,
        height: halfHeight - padding * 2
    };
}

function getSmartPositionCoordinates() {
    // TODO implement smart positioning

    // const allActiveTabs = await browser.tabs.query({ active: true, lastFocusedWindow: true });
    // const currentTab = allActiveTabs[0];

    // try {
    //     await browser.tabs.executeScript(currentTab.id, {
    //         file: "js/libs/webextension-polyfill/browser-polyfill.min.js"});
    //     await browser.tabs.executeScript(currentTab.id, {
    //         file: "js/positioning/areaCalculator.js"
    //     });
    //     var res = await browser.tabs.sendMessage(currentTab.id, "calculateMaxEmptyArea");
    //     alert("top: " + res.top + ", left: " + res.left + ", width: " + res.width + ", height: " + res.height);
    // } catch (error) {
    //     alert(error.message);
    // }

    return {
        top: 100,
        left: 100,
        width: 500,
        height: 500
    };
}
