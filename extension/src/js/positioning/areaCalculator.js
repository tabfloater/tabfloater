function isTextNode(node) {
    return node.nodeType === 3;
}

function isElementNode(node) {
    return node.nodeType === 1;
}

function isImage(node) {
    return isElementNode(node) && node.tagName && node.tagName.toString().toLowerCase() === "img";
}

function isInput(node) {
    return isElementNode(node) && node.tagName && node.tagName.toString().toLowerCase() === "input";
}

function isInViewport(rect) {
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

    return rect.top >= 0
        && rect.left >= 0
        && rect.right <= viewportWidth
        && rect.bottom <= viewportHeight;
}

function isVisibleElement(node) {
    if (node.style && (node.style.display === "none" || node.style.visibility === "hidden")) {
        return false;
    }

    if (isTextNode(node)) {
        return node.textContent.trim().length > 0;
    }

    if (!isElementNode(node) || !node.tagName) {
        return false;
    }

    return ["iframe", "textarea", "input", "button", "img", "svg", "title", "h1", "h2", "h3"]
        .includes(node.tagName.toString().toLowerCase());
}

function forEachVisibleElement(node, callback) {
    const childNodes = node.childNodes;

    if (childNodes) {
        for (let i = 0; i < childNodes.length; i++) {
            const child = childNodes[i];
            if (isVisibleElement(child)) {
                const node = (isImage(child) || isInput(child)) && child.parentElement !== document.body
                    ? child.parentElement
                    : child;
                const range = document.createRange();
                range.selectNodeContents(node);
                const clientRect = range.getBoundingClientRect();

                if (clientRect.width > 0 && clientRect.height > 0 && isInViewport(clientRect)) {
                    if (callback) {
                        callback(clientRect);
                    }
                }
            }

            forEachVisibleElement(child, callback);
        }
    }
}

function mapViewportToMatrixWithEmptyMarkers(cellSize) {
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

    const rowCount = Math.floor(viewportHeight / cellSize);
    const columnCount = Math.floor(viewportWidth / cellSize);

    var emptyMarkers = Array(rowCount).fill(true).map(() => Array(columnCount).fill(true));

    forEachVisibleElement(document.body, elementRectangle => {
        let rowStartIndex = Math.floor(elementRectangle.top / cellSize);
        let colStartIndex = Math.floor(elementRectangle.left / cellSize);
        let rowEndIndex = rowStartIndex + Math.ceil(elementRectangle.height / cellSize);
        let columnEndIndex = colStartIndex + Math.ceil(elementRectangle.width / cellSize);

        // add 1 cell padding on each side, while ensuring we don't go over
        rowStartIndex = Math.max(rowStartIndex - 1, 0);
        colStartIndex = Math.max(colStartIndex - 1, 0);
        rowEndIndex = Math.min(rowEndIndex + 1, rowCount);
        columnEndIndex = Math.min(columnEndIndex + 1, columnCount);

        for (let r = rowStartIndex; r < rowEndIndex; r++) {
            for (let c = colStartIndex; c < columnEndIndex; c++) {
                emptyMarkers[r][c] = false;
            }
        }
    });

    return emptyMarkers;
}

function getColumnHeight(matrix, row, column) {
    let height = 0;

    while (row >= 0 && matrix[row][column]) {
        height++;
        row--;
    }

    return height;
}

function getMaxRectangleAreaForRow(matrix, row) {
    const heights = [];

    for (let column = 0; column < matrix[row].length; column++) {
        heights.push(getColumnHeight(matrix, row, column));
    }

    let maxRectangleForRow = {
        row: 0,
        column: 0,
        width: 0,
        height: 0,
        area: 0
    };

    for (let c1 = 0; c1 < matrix[row].length; c1++) {
        let currentMaxForC1 = heights[c1];
        let currentMinHeight = heights[c1];
        let widthOfCurrentMax = 1;
        let heightOfCurrentMax = heights[c1];

        for (let c2 = c1 + 1; c2 < matrix[row].length; c2++) {
            currentMinHeight = Math.min(currentMinHeight, heights[c2]);
            const width = c2 - c1 + 1;
            const currentMaxForC2 = currentMinHeight * width;

            if (currentMaxForC2 > currentMaxForC1) {
                currentMaxForC1 = currentMaxForC2;
                widthOfCurrentMax = width;
                heightOfCurrentMax = currentMinHeight;
            }
        }

        if (currentMaxForC1 > maxRectangleForRow.area) {
            maxRectangleForRow = {
                row: row - (heightOfCurrentMax - 1),
                column: c1,
                width: widthOfCurrentMax,
                height: heightOfCurrentMax,
                area: currentMaxForC1
            };
        }
    }

    return maxRectangleForRow;
}

function getMaxRectangleInMatrix(matrix) {
    let maxRectangle = {
        row: 0,
        column: 0,
        width: 0,
        height: 0,
        area: 0
    };

    for (let row = 0; row < matrix.length; row++) {
        const maxRectangleForRow = getMaxRectangleAreaForRow(matrix, row);

        if (maxRectangleForRow.area > maxRectangle.area) {
            maxRectangle = maxRectangleForRow;
        }
    }

    return maxRectangle;
}

function calculateMaxEmptyArea(logger) {
    const cellSize = 30;
    const matrix = mapViewportToMatrixWithEmptyMarkers(cellSize);
    const maxRect = getMaxRectangleInMatrix(matrix);

    logger.info(`maxRect: ${JSON.stringify(maxRect)}`);

    return {
        top: maxRect.row * cellSize,
        left: maxRect.column * cellSize,
        width: maxRect.width * cellSize,
        height: maxRect.height * cellSize
    };
}

function getScreenCoordinatesOfViewport(logger) {
    if (!window.screenTop) {
        window.screenTop = window.screenY;
        window.screenLeft = window.screenX;
    }

    logger.info(`w.st: ${window.screenTop}, w.sl: ${window.screenLeft}`);
    logger.info(`w.ow: ${window.outerWidth}, w.iw: ${window.innerWidth}, w.oh: ${window.outerHeight}, w.ih: ${window.innerHeight}`);

    const viewportWidthOffsetRelativeToWindow = window.outerWidth - window.innerWidth;
    const viewportHeightOffsetRelativeToWindow = window.outerHeight - window.innerHeight;

    return {
        top: window.screenTop + viewportHeightOffsetRelativeToWindow,
        left: window.screenLeft + viewportWidthOffsetRelativeToWindow
    };
}

browser.runtime.onMessage.addListener(async function (request) {
    if (request.action === "calculateMaxEmptyArea") {
        const logger = getLogger(request.debug);

        try {
            const viewportCoordinates = getScreenCoordinatesOfViewport(logger);
            const maxEmptyAreaInViewport = calculateMaxEmptyArea(logger);

            logger.info(`viewportCoordinates: ${JSON.stringify(viewportCoordinates)}`);
            logger.info(`maxEmptyAreaInViewport: ${JSON.stringify(maxEmptyAreaInViewport)}`);

            return {
                top: viewportCoordinates.top + maxEmptyAreaInViewport.top,
                left: viewportCoordinates.left + maxEmptyAreaInViewport.left,
                width: maxEmptyAreaInViewport.width,
                height: maxEmptyAreaInViewport.height
            };
        } catch (error) {
            logger.error(`Error while calculating max empty area. Error: '${error}'`);
        }
    }
});

function getLogger(debug) {
    return {
        info: debug ? message => console.log(`[TABFLOATER] ${message}`) : () => { },
        error: debug ? message => console.error(`[TABFLOATER] ${message}`) : () => { }
    };
}
