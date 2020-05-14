import { sendMakeDialogRequestAsync } from "./companion.js";
import * as positioner from "./positioning/positioner.js";

export async function tryGetFloatingTabAsync(logger) {
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
            logger.error(`Unable to fetch floating tab, will clear saved value. Error: '${error}'`);
            await clearFloatingTabAsync();
        }
    }

    return result;
}

export async function floatTabAsync(logger) {
    const { floatingTab } = await tryGetFloatingTabAsync(logger);

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

            logger.info(`Will float current tab. TabProps: ${JSON.stringify(tabProps)}`);

            const succeedingActiveTab = await getSucceedingActiveTabAsync();
            try {
                await browser.tabs.update(succeedingActiveTab.id, { active: true });
            } catch (error) {
                logger.error(`Unable to update active tab before floating action. Error: '${error}'`);
            }

            const coordinates = await positioner.calculateCoordinatesAsync(logger);

            await browser.windows.create({
                "tabId": currentTab.id,
                "type": "popup",
                "top": coordinates.top,
                "left": coordinates.left,
                "width": coordinates.width,
                "height": coordinates.height,
            });

            const parentWindowTitle = succeedingActiveTab.title;
            await sendMakeDialogRequestAsync(currentTab.title, parentWindowTitle, logger);
            await setFloatingTabAsync(tabProps);
        } else {
            logger.warn("Tried to float current tab, but no active tab found - this should not happen");
        }
    }
}

export async function unfloatTabAsync(logger) {
    const { floatingTab, tabProps } = await tryGetFloatingTabAsync(logger);

    if (floatingTab) {
        await browser.tabs.move(tabProps.tabId, { windowId: tabProps.parentWindowId, index: tabProps.originalIndex });
        await clearFloatingTabAsync();
    }
}

export async function repositionFloatingTabIfExistsAsync(logger) {
    const { floatingTab } = await tryGetFloatingTabAsync(logger);

    if (floatingTab) {
        const coordinates = await positioner.calculateCoordinatesAsync(logger);
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

export async function clearFloatingTabAsync() {
    await browser.storage.local.remove(["floatingTabProperties"]);
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
