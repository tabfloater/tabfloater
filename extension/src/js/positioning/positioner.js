import { loadOptionsAsync } from "../background.js";
import { tryGetFloatingTabAsync } from "../floater.js";

/**
 * Returns the textual representation of the position that a new floating tab should have.
 */
export async function getStartingPositionAsync() {
    const options = await loadOptionsAsync();

    let startingPosition;

    if (options.positioningStrategy === "fixed") {
        startingPosition = options.fixedPosition;
    } else if (options.positioningStrategy === "smart") {
        startingPosition = "smart";
    }

    return startingPosition;
}

/**
 * Calculates the coordinates (top, left, width, height) of the floating tab, regardless of
 * whether it exists. If the floating tab already exists, this method calculates the position
 * against the active tab of the parent window.
 *
 * If there is no floating tab yet, the result is calculated against the active tab of the
 * current window, so the caller must set the active tab to the desired parent window tab
 * before calling this method.
 */
export async function calculateCoordinatesAsync() {
    const options = await loadOptionsAsync();
    const { floatingTab, tabProps } = await tryGetFloatingTabAsync();
    let coordinates;

    if (options.positioningStrategy === "fixed") {
        let parentWindow;
        let fixedPosition;

        if (floatingTab) {
            parentWindow = await browser.windows.get(tabProps.parentWindowId);
            fixedPosition = tabProps.position;
        } else {
            parentWindow = await browser.windows.getLastFocused({ populate: true });
            fixedPosition = options.fixedPosition;
        }

        coordinates = getFixedPositionCoordinates(parentWindow, fixedPosition);
    } else if (options.positioningStrategy === "smart") {
        let allActiveTabsOnParentWindow;

        if (floatingTab) {
            allActiveTabsOnParentWindow = await browser.tabs.query({ active: true, windowId: tabProps.parentWindowId });
        } else {
            allActiveTabsOnParentWindow = await browser.tabs.query({ active: true, lastFocusedWindow: true });
        }

        const parentWindowActiveTab = allActiveTabsOnParentWindow[0];
        coordinates = await getSmartPositionCoordinatesAsync(parentWindowActiveTab);
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

async function getSmartPositionCoordinatesAsync(parentWindowActiveTab) {
    try {
        await browser.tabs.executeScript(parentWindowActiveTab.id, { file: "js/libs/webextension-polyfill/browser-polyfill.min.js" });
        await browser.tabs.executeScript(parentWindowActiveTab.id, { file: "js/positioning/contentScripts/areaCalculator.js" });

        return await browser.tabs.sendMessage(parentWindowActiveTab.id, {
            action: "calculateMaxEmptyArea",
            debug: true // TODO implement debugging with marking & wire in debugging option
        });
    } catch (error) {
        // TODO notify the user that smart positioning failed

        // The content script can fail sometimes, for example if we want to inject
        // it into a chrome:// page. In this case, we fall back to fixed positioning.

        const parentWindow = await browser.windows.get(parentWindowActiveTab.windowId);
        const options = await loadOptionsAsync();

        return getFixedPositionCoordinates(parentWindow, options.fixedPosition);
    }
}
