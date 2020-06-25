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

export const CompanionName = "io.github.tabfloater.companion";

export const CompanionLatestVersions = {
    Linux: "0.7.0",
    Windows: "0.7.0"
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
    positioningStrategy: "fixed",
    fixedPosition: "topRight",
    fixedTabSize: "standard",
    viewportTopOffset: 150,
    smartPositioningFollowTabSwitches: true,
    smartPositioningRestrictMaxFloatingTabSize: true,
    debug: false
};

export const FloatingTabPadding = 50;
export const MinimumFloatingTabSideLength = 300;
