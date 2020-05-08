import { loadOptions } from "../background.js";

export async function getPositionData(parentWindow, requestedFixedPosition) {
    const result = {
        position: undefined,
        coordinates: undefined
    };

    const options = await loadOptions();

    if (options.positioningStrategy === "fixed") {
        const fixedPosition = requestedFixedPosition || options.fixedPosition;
        result.position = fixedPosition;
        result.coordinates = getFixedPositionCoordinates(parentWindow, fixedPosition);
    } else if (options.positioningStrategy === "smart") {
        result.position = "smart";
        result.coordinates = getSmartPositionCoordinates(parentWindow);
    }

    return result;
}

function getFixedPositionCoordinates(parentWindow, requestedFixedPosition) {
    const padding = 50;
    const extraPaddingAtTop = 50;

    const halfWidth = parseInt(parentWindow.width / 2);
    const halfHeight = parseInt(parentWindow.height / 2);
    let newTop = parentWindow.top + padding;
    let newLeft = parentWindow.left + padding;

    if (requestedFixedPosition.startsWith("top")) {
        newTop += extraPaddingAtTop;
    }
    if (requestedFixedPosition.startsWith("bottom")) {
        newTop += halfHeight;
    }
    if (requestedFixedPosition.endsWith("Right")) {
        newLeft += halfWidth;
    }

    return {
        top: newTop,
        left: newLeft,
        width: halfWidth - padding * 2,
        height: halfHeight - padding * 2
    };
}

function getSmartPositionCoordinates(parentWindow) {
    // TODO implement smart positioning

    return {
        top: parentWindow.top + 200,
        left: parentWindow.left + 200,
        width: parentWindow.width - 500,
        height: parentWindow.height - 500
    };
}
