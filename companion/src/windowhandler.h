#include <string>

/**
 * Sets a window as a modeless dialog of another window. A modeless dialog is
 * a window that does not block interaction with its owner window, but always
 * stays on top of the owner window. The modeless dialog window does not have
 * a taskbar entry and moves together with its owner. For example, if the
 * owner window is minimized, the dialog window is minimized as well.
 *
 * The windows are matched by title prefix. Any window that starts with the
 * specified arguments are matched. If there are more than one window that has
 * the same prefix title, only one is picked nondeterministically.
 *
 * @param windowTitlePrefix the prefix title of the window that should be set as modeless dialog
 * @param ownerWindowTitlePrefix the prefix title of the window that should own the dialog
 */
void setAsModelessDialog(std::string windowTitlePrefix, std::string ownerWindowTitlePrefix);
