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

import { FloatingTabPadding, MinimumFloatingTabSideLength } from "../constants.js";
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
export async function calculateCoordinatesAsync(logger) {
    const options = await loadOptionsAsync();
    const { floatingTab, tabProps } = await tryGetFloatingTabAsync(logger);
    let parentWindow;
    let fixedPosition;

    if (floatingTab) {
        parentWindow = await browser.windows.get(tabProps.parentWindowId, { populate: true });
        fixedPosition = tabProps.position;
    } else {
        parentWindow = await browser.windows.getLastFocused({ populate: true });
        fixedPosition = options.fixedPosition;
    }

    let coordinates;

    if (options.positioningStrategy === "fixed") {
        coordinates = getFixedPositionCoordinates(parentWindow, fixedPosition, options, logger);
    } else if (options.positioningStrategy === "smart") {
        coordinates = await getSmartPositionCoordinatesAsync(parentWindow, options, logger);
    }

    const normalizedCoordinates = normalizeDimensions(coordinates);

    logger.info(`Calculated coordinates: ${JSON.stringify(coordinates)}, normalized coordinates: ${JSON.stringify(normalizedCoordinates)}`);

    return normalizedCoordinates;
}

function getFixedPositionCoordinates(parentWindow, position, options, logger) {
    const dimensions = getFixedFloatingTabDimensions(parentWindow, options, logger);

    logger.info(`Position: ${position}, parent window top: ${parentWindow.top}, left: ${parentWindow.left}, ` +
        `width: ${parentWindow.width}, height: ${parentWindow.height}`);

    dimensions.top = position.startsWith("top")
        ? parentWindow.top + options.viewportTopOffset
        : parentWindow.top + parentWindow.height - FloatingTabPadding - dimensions.height;

    dimensions.left = position.endsWith("Left")
        ? parentWindow.left + FloatingTabPadding
        : parentWindow.left + parentWindow.width - FloatingTabPadding - dimensions.width;

    return dimensions;
}

async function getSmartPositionCoordinatesAsync(parentWindow, options, logger) {
    const parentWindowActiveTab = parentWindow.tabs.find(tab => tab.active);

    try {
        await browser.tabs.executeScript(parentWindowActiveTab.id, { file: "libs/webextension-polyfill/browser-polyfill.min.js" });
        await browser.tabs.executeScript(parentWindowActiveTab.id, { file: "js/positioning/areaCalculator.js" });

        const coordinates = await browser.tabs.sendMessage(parentWindowActiveTab.id, {
            action: "calculateMaxEmptyArea",
            debug: options.debug
        });

        if (!coordinates) {
            throw "Unable to calculate coordinates";
        }

        if (options.smartPositioningRestrictMaxFloatingTabSize) {
            logger.info(`Restricting max size of smart positioned floating window. Original coordinates: ${JSON.stringify(coordinates)}`);

            const maxDimensions = getFixedFloatingTabDimensions(parentWindow, options, logger);
            coordinates.width = Math.min(coordinates.width, maxDimensions.width);
            coordinates.height = Math.min(coordinates.height, maxDimensions.height);
        }

        return coordinates;
    } catch (error) {
        // The content script can fail sometimes, for example if we want to inject
        // it into a chrome:// page. In this case, we fall back to fixed positioning.
        // TODO notify the user that smart positioning failed

        logger.warn("Unable to calculate smart positioning coordinates, falling back to fixed positioning. " +
            `Error: '${error}', message: '${error.message}'`);

        const options = await loadOptionsAsync();
        return getFixedPositionCoordinates(parentWindow, options.fixedPosition, options, logger);
    }
}

function getFixedFloatingTabDimensions(parentWindow, options, logger) {
    let divisor;

    switch (options.fixedTabSize) {
        case "small": divisor = 2.5; break;
        case "standard":
        default: divisor = 2; break;
    }

    const topOffset = Math.min(Math.max(options.viewportTopOffset, 0), parentWindow.height / divisor);
    const rawWidth = parseInt(parentWindow.width / divisor);
    const rawHeight = parseInt((parentWindow.height - topOffset) / divisor);

    logger.info(`viewportTopOffset: ${options.viewportTopOffset}, divisor: ${divisor}`);
    logger.info(`topOffset: ${topOffset}, rawWidth: ${rawWidth}, rawHeight: ${rawHeight}`);

    return {
        width: rawWidth - FloatingTabPadding * 2,
        height: rawHeight - FloatingTabPadding * 2
    };
}

function normalizeDimensions(coordinates) {
    return {
        top: coordinates.top,
        left: coordinates.left,
        width: Math.max(coordinates.width, MinimumFloatingTabSideLength),
        height: Math.max(coordinates.height, MinimumFloatingTabSideLength)

    };
}
