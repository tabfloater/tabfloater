import { FloatingTabPadding, ViewportTopOffset } from "../constants.js";
import { loadOptionsAsync } from "../main.js";
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
    let parentWindow;
    let fixedPosition;

    if (floatingTab) {
        parentWindow = await browser.windows.get(tabProps.parentWindowId, { populate: true });
        fixedPosition = tabProps.position;
    } else {
        parentWindow = await browser.windows.getLastFocused({ populate: true });
        fixedPosition = options.fixedPosition;
    }

    if (options.positioningStrategy === "fixed") {
        coordinates = getFixedPositionCoordinates(parentWindow, fixedPosition);
    } else if (options.positioningStrategy === "smart") {
        coordinates = await getSmartPositionCoordinatesAsync(parentWindow, options.smartPositioningRestrictMaxFloatingTabSize);
    }

    return coordinates;
}

function getFixedPositionCoordinates(parentWindow, position) {
    const dimensions = getFixedFloatingTabDimensions(parentWindow);

    let top = parentWindow.top + ViewportTopOffset + FloatingTabPadding;
    let left = parentWindow.left + FloatingTabPadding;

    if (position.startsWith("bottom")) {
        top += FloatingTabPadding + dimensions.height + FloatingTabPadding;
    }
    if (position.endsWith("Right")) {
        left += FloatingTabPadding + dimensions.width + FloatingTabPadding;
    }

    dimensions.top = top;
    dimensions.left = left;

    return dimensions;
}

async function getSmartPositionCoordinatesAsync(parentWindow, restrictMaxSize) {
    const parentWindowActiveTab = parentWindow.tabs.find(tab => tab.active);

    try {
        await browser.tabs.executeScript(parentWindowActiveTab.id, { file: "libs/webextension-polyfill/browser-polyfill.min.js" });
        await browser.tabs.executeScript(parentWindowActiveTab.id, { file: "js/positioning/areaCalculator.js" });

        const coordinates = await browser.tabs.sendMessage(parentWindowActiveTab.id, {
            action: "calculateMaxEmptyArea",
            debug: true // TODO implement debugging with marking & wire in debugging option
        });

        if (!coordinates) {
            throw "Unable to calculate coordinates";
        }

        if (restrictMaxSize) {
            const maxDimensions = getFixedFloatingTabDimensions(parentWindow);
            coordinates.width = Math.min(coordinates.width, maxDimensions.width);
            coordinates.height = Math.min(coordinates.height, maxDimensions.height);
        }

        return coordinates;
    } catch (error) {
        // TODO notify the user that smart positioning failed

        // The content script can fail sometimes, for example if we want to inject
        // it into a chrome:// page. In this case, we fall back to fixed positioning.

        const options = await loadOptionsAsync();
        return getFixedPositionCoordinates(parentWindow, options.fixedPosition);
    }
}

/**
 * Returns the dimensions of a fixed floating tab. Both the width and
 * the height are going to be half of the browser window's (taking the
 * extra top padding into account), minus the padding on each sides.
 */
function getFixedFloatingTabDimensions(parentWindow) {
    const halfWidth = parseInt(parentWindow.width / 2);
    const halfHeight = parseInt((parentWindow.height - ViewportTopOffset) / 2);

    return {
        width: halfWidth - FloatingTabPadding * 2,
        height: halfHeight - FloatingTabPadding * 2
    };
}
