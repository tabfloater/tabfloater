#include "windowhandler.h"
#include <X11/Xlib.h>

#define _NET_WM_STATE_ADD 1

std::string getWindowName(Display *display, Window window) {
    Atom actualType, filterAtom;
    int actualFormat, status;
    unsigned long itemCount, bytesAfter;
    unsigned char *prop;

    filterAtom = XInternAtom(display, "_NET_WM_NAME", True);
    status = XGetWindowProperty(display, window, filterAtom, 0, 1000, False, AnyPropertyType,
                                &actualType, &actualFormat, &itemCount, &bytesAfter, &prop);

    if (status != Success) {
        exit(EXIT_FAILURE);
    }

    if (prop == NULL || prop[0] == '\0') {
        return std::string();
    }

    std::string windowName(reinterpret_cast<char*>(prop));
    return windowName;
}

Window findWindowByName(Display *display, Window window, std::string name)
{
    Window *children, dummy;
    unsigned int nchildren;
    unsigned int i;
    Window w = 0;
    std::string windowName;

    windowName = getWindowName(display, window);
    if (windowName.compare(name) == 0) {
        return (window);
    }

    if (!XQueryTree(display, window, &dummy, &dummy, &children, &nchildren)) {
        return (0);
    }

    for (i = 0; i < nchildren; i++)
    {
        w = findWindowByName(display, children[i], name);
        if (w) {
            break;
        }
            
    }
    if (children) {
        XFree((char *)children);
    }
        
    return (w);
}

Status sendXEventAboveAndSkipTaskbar(Display *display, Window window)
{
    XEvent event;
    event.xclient.type = ClientMessage;
    event.xclient.serial = 0;
    event.xclient.send_event = True;
    event.xclient.display = display;
    event.xclient.window = window;
    event.xclient.message_type = XInternAtom(display, "_NET_WM_STATE", False);
    event.xclient.format = 32;

    event.xclient.data.l[0] = _NET_WM_STATE_ADD;
    event.xclient.data.l[1] = XInternAtom(display, "_NET_WM_STATE_ABOVE", False);
    event.xclient.data.l[2] = XInternAtom(display, "_NET_WM_STATE_SKIP_TASKBAR", False);

    return XSendEvent(display, DefaultRootWindow(display), False,
                      SubstructureRedirectMask | SubstructureNotifyMask, &event);
}

void setWindowAlwaysOnTopAndSkipTaskbar(std::string windowName) {
    Display *display = XOpenDisplay(NULL);
    if (!display) {
        exit(EXIT_FAILURE);
    }

    Window window_root = DefaultRootWindow(display);
    if (!window_root) {
        exit(EXIT_FAILURE);
    }

    Window window = findWindowByName(display, window_root, windowName);

    if (!window)
    {
        exit(EXIT_FAILURE);
    }

    sendXEventAboveAndSkipTaskbar(display, window);

    XFlush(display);
    XCloseDisplay(display);
}
