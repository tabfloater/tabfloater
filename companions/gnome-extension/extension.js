// Always have this as the first line of your file. Google for an explanation.
'use strict';

// This is a handy import we'll use to grab our extension's object
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Lang = imports.lang;
const Util = imports.misc.util;


// Like `init()` below, code *here* in the top-level of your script is executed
// when your extension is loaded. You MUST NOT make any changes to GNOME Shell
// here and typically you should do nothing but assign variables.
const SOME_CONSTANT = 42;


// This function is called once when your extension is loaded, not enabled. This
// is a good time to setup translations or anything else you only do once.
//
// You MUST NOT make any changes to GNOME Shell, connect any signals or add any
// MainLoop sources here.
function init() {
    log(`initializing ${Me.metadata.name} version ${Me.metadata.version}`);
}

// This function could be called after your extension is enabled, which could
// be done from GNOME Tweaks, when you log in or when the screen is unlocked.
//
// This is when you setup any UI for your extension, change existing widgets,
// connect signals or modify GNOME Shell's behaviour.
function enable() {
    let display = global.display;
    display.connect('window-created', Lang.bind(this, this.update));
    
    log(`enabling ${Me.metadata.name} version ${Me.metadata.version}`);
}

function update(display, window, userData) {

    if (window.get_role() == "pop-up" && window.get_title() == "oowq2wjZo6bcXEaHXcQrKNxHDTMUd3hBECDFKWuF") {
	log("--- new window created " + new Date().getTime());
	Util.spawn(['/home/balazs/work/tabfloater-companion/linux/tabfloater_companion', 'oowq2wjZo6bcXEaHXcQrKNxHDTMUd3hBECDFKWuF', 'on']);
//	window["skip-taskbar"] = false;
    }

//    log("--- new window created " + new Date().getTime());
//    log("window type: " + window.get_window_type());
//    log("gtk app ID: " + window["gtk-application-id"]);
//    log("gtk unique bus name: " + window["gtk-unique-bus-name"]);
//    log("gtk app obj path: " + window["gtk-application-object-path"]);
//    log("gtk windows obj path: " + window["gtk-window-object-path"]);
//    log("gtk app menu obj path: " + window["gtk-app-menu-object-path"]);
//    log("gtk app menubar obj path: " + window["gtk-menubar-object-path"]);
//    log("mutter hints: " + window["mutter-hints"]);
//    log("wm-class: " + window["wm-class"]);
//    log("startup id: " + window.get_startup_id());
//    log("role: " + window.get_role());
//    log("stable seq: " + window.get_stable_sequence());
//    log("pid: " + window.get_pid());
//    log("title" + window.get_title());
}

// This function could be called after your extension is uninstalled, disabled
// in GNOME Tweaks, when you log out or when the screen locks.
//
// Anything you created, modifed or setup in enable() MUST be undone here. Not
// doing so is the most common reason extensions are rejected during review!
function disable() {
    log(`disabling ${Me.metadata.name} version ${Me.metadata.version}`);
}

