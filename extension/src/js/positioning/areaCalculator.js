// for testing only
// eslint-disable-next-line no-unused-vars
function markArea(rect, highlight) {
    const div = document.createElement("div");
    div.style.width = rect.width + "px";
    div.style.height = rect.height + "px";
    div.style.position = "absolute";
    div.style.top = rect.top + window.scrollY + "px";
    div.style.left = rect.left + window.scrollX + "px";

    div.style.borderWidth = highlight ? "thick" : "thin";
    div.style.borderStyle = "solid";
    div.style.borderColor = "red";

    document.body.appendChild(div);
}


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

    forEachVisibleElement(document.body, (elementRectangle) => {

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

// eslint-disable-next-line no-unused-vars
function calculateMaxEmptyArea() {
    if (!window.screenLeft) {
        window.screenLeft = window.screenX;
        window.screenTop = window.screenY;
    }

    const cellSize = 30;
    const matrix = mapViewportToMatrixWithEmptyMarkers(cellSize);
    const maxRect = getMaxRectangleInMatrix(matrix);

    return {
        top: maxRect.row * cellSize + window.screenTop,  //TODO window.screenY not tested yet
        left: maxRect.column * cellSize + window.screenLeft,
        width: maxRect.width * cellSize,
        height: maxRect.height * cellSize
    };
}


browser.runtime.onMessage.addListener(async function (request) {
    if (request === "calculateMaxEmptyArea") {
        var qq = calculateMaxEmptyArea();
        markArea(qq);
        return qq;
    }
});
