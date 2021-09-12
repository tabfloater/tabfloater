/*
 * Copyright 2021 Balazs Gyurak
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

export const CompanionName = "io.github.tabfloater.companion";
export const CompanionLatestVersionsFallback = {
    Linux: "1.2.0",
    Windows: "1.2.0"
};

export const CommandToPositionMapping = {
    "topLeft,moveDown": "bottomLeft",
    "topLeft,moveRight": "topRight",
    "bottomLeft,moveUp": "topLeft",
    "bottomLeft,moveRight": "bottomRight",
    "topRight,moveLeft": "topLeft",
    "topRight,moveDown": "bottomRight",
    "bottomRight,moveUp": "topRight",
    "bottomRight,moveLeft": "bottomLeft",
};

export const DefaultOptions = {
    alwaysOnTopAllApps: false,
    positioningStrategy: "fixed",
    fixedPosition: "topRight",
    fixedTabSize: "standard",
    customPosition: undefined,
    viewportTopOffset: 150,
    smartPositioningFollowTabSwitches: true,
    smartPositioningRestrictMaxFloatingTabSize: true,
    collectUsageStats: true,
    showUpdatePage: true,
    debug: false
};

export const DefaultOptionsDev = Object.assign({}, DefaultOptions, {
    collectUsageStats: false,
    debug: true
});

export const FloatCountToShowReviewPageOn = 30;

export const GoogleAnalyticsTrackingId = {
    Production: "UA-175107528-2",
    Development: "UA-175107528-1"
};

export const FloatingTabPaddings = {
    fixedPositioning: 50,
    smartPositioning: 25
};

export const MinimumFloatingTabSideLength = 300;

export const UsageDataToCustomDimensionMapping = {
    positioningStrategy: "cd1",
    fixedPosition: "cd2",
    fixedTabSize: "cd3",
    viewportTopOffset: "cd4",
    smartPositioningFollowTabSwitches: "cd5",
    smartPositioningRestrictMaxFloatingTabSize: "cd6",
    debug: "cd7",
    companionStatus: "cd8",
    companionVersion: "cd9",
    companionOs: "cd10",
    companionErrorMessage: "cd11"
};
