import { sendMakeDialogRequestAsync } from "./companion.js";
import * as positioner from "./positioning/positioner.js";

export async function tryGetFloatingTabAsync() {
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

export async function floatTabAsync() {
    const { floatingTab } = await tryGetFloatingTabAsync();

    if (!floatingTab) {
        const allActiveTabs = await browser.tabs.query({ active: true, lastFocusedWindow: true });
        const currentTab = allActiveTabs[0];

        if (currentTab) {
            const tabProps = {
                tabId: currentTab.id,
                parentWindowId: currentTab.windowId,
                originalIndex: currentTab.index,
                position: await positioner.getStartingPositionAsync()
            };

            const succeedingActiveTab = await getSucceedingActiveTabAsync();
            await browser.tabs.update(succeedingActiveTab.id, { active: true });

            const coordinates = await positioner.calculateCoordinatesAsync();

            await browser.windows.create({
                "tabId": currentTab.id,
                "type": "popup",
                "top": coordinates.top,
                "left": coordinates.left,
                "width": coordinates.width,
                "height": coordinates.height,
            });

            await setFloatingTabAsync(tabProps);

            const parentWindowTitle = succeedingActiveTab.title;
            await sendMakeDialogRequestAsync(currentTab.title, parentWindowTitle);
        }
    }
}

export async function unfloatTabAsync() {
    const { floatingTab, tabProps } = await tryGetFloatingTabAsync();

    if (floatingTab) {
        await browser.tabs.move(tabProps.tabId, { windowId: tabProps.parentWindowId, index: tabProps.originalIndex });
        clearFloatingTab();
    }
}

export async function repositionFloatingTabAsync() {
    const { floatingTab } = await tryGetFloatingTabAsync();

    if (floatingTab) {
        const coordinates = await positioner.calculateCoordinatesAsync();
        await browser.windows.update(floatingTab.windowId, coordinates);
    }
}

export async function canFloatCurrentTabAsync() {
    const parentWindow = await browser.windows.getLastFocused({ populate: true });
    return parentWindow.tabs.length > 1;
}

export async function setFloatingTabAsync(tabProps) {
    await browser.storage.local.set({ floatingTabProperties: tabProps });
}

export function clearFloatingTab() {
    browser.storage.local.remove(["floatingTabProperties"]);
}

/**
 * Returns the tab that is going to be active after the float action happens.
 * This is always the tab right to the active tab, except when the active
 * tab is the last one, in which case it's the one to the left.
 */
async function getSucceedingActiveTabAsync() {
    const allTabsOnCurrentWindow = await browser.tabs.query({ lastFocusedWindow: true });
    allTabsOnCurrentWindow.sort((tab1, tab2) => tab1.index < tab2.index);

    const currentTab = allTabsOnCurrentWindow.find(tab => tab.active);
    const currentTabIsLast = currentTab.index === allTabsOnCurrentWindow.length - 1;

    return currentTabIsLast
        ? allTabsOnCurrentWindow[currentTab.index - 1]
        : allTabsOnCurrentWindow[currentTab.index + 1];
}
