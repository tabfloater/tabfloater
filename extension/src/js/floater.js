import { sendMakeDialogRequest } from "./companion.js";
import { getPositionData } from "./positioning/positioner.js";

export async function tryGetFloatingTab() {
    const data = await browser.storage.local.get(["floatingTabProperties"]);
    const tabProps = data.floatingTabProperties;

    const result = {
        floatingTab: undefined,
        floatingTabProperties: undefined
    };

    if (tabProps) {
        try {
            const floatingTab = await browser.tabs.get(tabProps.tabId);
            result.floatingTab = floatingTab;
            result.tabProps = tabProps;
        } catch (error) {
            clearFloatingTab();
        }
    }

    return result;
}

export async function floatTab() {
    const { floatingTab } = await tryGetFloatingTab();

    if (!floatingTab) {
        const allActiveTabs = await browser.tabs.query({ active: true, lastFocusedWindow: true });
        const currentTab = allActiveTabs[0];

        if (currentTab) {
            const window = await browser.windows.get(currentTab.windowId);
            const { position, coordinates } = await getPositionData(window);

            const tabProps = {
                tabId: currentTab.id,
                parentWindowId: currentTab.windowId,
                originalIndex: currentTab.index,
                position: position
            };

            await browser.windows.create({
                "tabId": currentTab.id,
                "type": "popup",
                "top": coordinates.top,
                "left": coordinates.left,
                "width": coordinates.width,
                "height": coordinates.height,
            });

            await setFloatingTab(tabProps);

            const parentWindowActiveTabs = await browser.tabs.query({ active: true, windowId: tabProps.parentWindowId });
            const parentWindowTitle = parentWindowActiveTabs[0].title;

            await sendMakeDialogRequest(currentTab.title, parentWindowTitle);
        }
    }
}

export async function unfloatTab() {
    const { floatingTab, tabProps } = await tryGetFloatingTab();

    if (floatingTab) {
        await browser.tabs.move(tabProps.tabId, { windowId: tabProps.parentWindowId, index: tabProps.originalIndex });
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

export async function repositionFloatingTab(requestedPosition) {
    const { floatingTab, tabProps } = await tryGetFloatingTab();

    if (floatingTab) {
        const parentWindow = await browser.windows.get(tabProps.parentWindowId);
        const { position, coordinates } = await getPositionData(parentWindow, requestedPosition);


        await browser.windows.update(floatingTab.windowId, coordinates);

        tabProps.position = position;
        await setFloatingTab(tabProps);
    }
}

async function setFloatingTab(tabProps) {
    await browser.storage.local.set({ floatingTabProperties: tabProps });
}
