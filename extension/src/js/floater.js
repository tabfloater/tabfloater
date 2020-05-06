import {sendMakePanelRequest} from "./companion.js";

const DefaultPosition = "topRight";

export async function tryGetFloatingTab() {
    const data = await browser.storage.local.get(["floatingTabProperties"]);
    const tabProps = data.floatingTabProperties;

    let result = {
        floatingTab: undefined,
        floatingTabProperties: undefined
    };

    if (tabProps) {
        try {
            const floatingTab = await browser.tabs.get(tabProps.tabId);
            result.floatingTab = floatingTab;
            result.tabProps = tabProps;
        } catch {
            clearFloatingTab();
        }
    }

    return result;
}

export async function floatTab() {
    const {floatingTab} = await tryGetFloatingTab();

    if (!floatingTab) {
        const allActiveTabs = await browser.tabs.query({ active: true, lastFocusedWindow: true });
        const currentTab = allActiveTabs[0];

        if (currentTab) {
            const tabProps = {
                tabId: currentTab.id,
                parentWindowId: currentTab.windowId,
                originalIndex: currentTab.index,
                position: DefaultPosition
            };

            const window = await browser.windows.get(currentTab.windowId);
            const positionData = getPositionDataForFloatingTab(window, DefaultPosition);

            await browser.windows.create({
                "tabId": currentTab.id,
                "type": "popup",
                "top": positionData.top,
                "left": positionData.left,
                "width": positionData.width,
                "height": positionData.height,
            });

            await setFloatingTab(tabProps);

            const parentWindowActiveTabs = await browser.tabs.query({ active: true, windowId: tabProps.parentWindowId });
            const parentWindowTitle = parentWindowActiveTabs[0].title;

            await sendMakePanelRequest(currentTab.title, parentWindowTitle);
        }
    }
}

export async function unfloatTab() {
    const {floatingTab, tabProps} = await tryGetFloatingTab();

    if (floatingTab) {
        await browser.tabs.move(tabProps.tabId, { windowId: tabProps.parentWindowId, index: tabProps.originalIndex })
        clearFloatingTab();
    }
}

export function clearFloatingTab() {
    browser.storage.local.remove(["floatingTabProperties"]);
}


export async function canFloatCurrentTab() {
    const parentWindow = await browser.windows.getLastFocused({ populate: true });
    return parentWindow.tabs.length > 1;
}

async function setFloatingTab(tabProps) {
    await browser.storage.local.set({ floatingTabProperties: tabProps });
}

// eslint-disable-next-line no-unused-vars
async function repositionFloatingTab(newPosition) {
    const {floatingTab, tabProps} = await tryGetFloatingTab();

    if (floatingTab) {
        const parentWindow = await browser.windows.get(tabProps.parentWindowId);
        const newPositionData = getPositionDataForFloatingTab(parentWindow, newPosition);

        await browser.windows.update(floatingTab.windowId, newPositionData);

        tabProps.position = newPosition;
        await setFloatingTab(tabProps);
    }
}

function getPositionDataForFloatingTab(parentWindow, position) {
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
