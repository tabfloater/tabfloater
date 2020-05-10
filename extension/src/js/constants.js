export const CompanionName = "io.github.tabfloater.companion";

export const CompanionLatestVersions = {
    Linux: "0.4.0",
    Windows: "0.4.0"
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
    viewportTopOffset: 150,
    smartPositioningFollowTabSwitches: true,
    smartPositioningRestrictMaxFloatingTabSize: true,
    debugging: false
};

export const FloatingTabPadding = 50;
