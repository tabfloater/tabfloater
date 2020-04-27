#include "windowhandler.h"
#include "../libs/loguru/src/loguru.hpp"
#include <X11/Xlib.h>
#include <stdexcept>
#include <tuple>
#include <X11/Xatom.h>

#define _NET_WM_STATE_ADD 1

std::string getWindowName(Display *display, Window window)
{
    Atom actualType, filterAtom;
    int actualFormat, status;
    unsigned long itemCount, bytesAfter;
    unsigned char *prop;

    filterAtom = XInternAtom(display, "_NET_WM_NAME", True);
    status = XGetWindowProperty(display, window, filterAtom, 0, 1000, False, AnyPropertyType,
                                &actualType, &actualFormat, &itemCount, &bytesAfter, &prop);

    if (status != Success)
    {
        throw std::runtime_error("Unable to get _NET_WM_NAME property of window. Status code: " + std::to_string(status));
    }

    if (prop == NULL || prop[0] == '\0')
    {
        return std::string();
    }

    std::string windowName(reinterpret_cast<char *>(prop));
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
    if (windowName.compare(name) == 0)
    {
        return (window);
    }

    if (!XQueryTree(display, window, &dummy, &dummy, &children, &nchildren))
    {
        return (0);
    }

    for (i = 0; i < nchildren; i++)
    {
        w = findWindowByName(display, children[i], name);
        if (w)
        {
            break;
        }
    }
    if (children)
    {
        XFree((char *)children);
    }

    return (w);
}

// std::tuple<Window*, Window*> findWindowByName2(Display *display, Window window, Window parentWindow, std::string name)
// {
//     Window *children, dummy;
//     unsigned int nchildren;
//     unsigned int i;
//     std::tuple<Window*, Window*> tup = std::make_tuple(nullptr, nullptr);
//     std::string windowName;

//     windowName = getWindowName(display, window);
//     if (windowName.compare(name) == 0)
//     {
//         LOG_F(INFO, "found child window: %s", windowName.c_str());
//         return std::make_tuple(&window, &parentWindow);
//     }

//     if (!XQueryTree(display, window, &dummy, &dummy, &children, &nchildren))
//     {
//         return std::make_tuple(nullptr, nullptr);
//     }

//     for (i = 0; i < nchildren; i++)
//     {
//         std::tuple<Window*, Window*> tup = findWindowByName2(display, children[i], window, name);
//         if (std::get<0>(tup))
//         {
//             break;
//         }
//     }
//     if (children)
//     {
//         XFree((char *)children);
//     }

//     return tup;
// }

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
    event.xclient.data.l[1] = XInternAtom(display, "_NET_WM_STATE_SKIP_TASKBAR", False);
    // event.xclient.data.l[2] = XInternAtom(display, "_NET_WM_STATE_SKIP_TASKBAR", False);

    return XSendEvent(display, DefaultRootWindow(display), False,
                      SubstructureRedirectMask | SubstructureNotifyMask, &event);

   
}

void setDisallowMaximize(Display *display, Window window) {
    //disable maximize
    Atom type = XInternAtom(display, "_NET_WM_ALLOWED_ACTIONS", False);
    // Atom value = XInternAtom(display, "_NET_WM_STATE_ABOVE", False);
    // XChangeProperty(display, window, type, XA_ATOM, 32, PropModeReplace, reinterpret_cast<unsigned char*>(&value), 1);

    // https://github.com/bbidulock/etwm/blob/master/ewmh.c
    // https://tronche.com/gui/x/xlib/window-information/XGetWindowProperty.html
    // https://specifications.freedesktop.org/wm-spec/wm-spec-latest.html
}


void setWindowAlwaysOnTopAndSkipTaskbar(std::string windowName, std::string parentWindowName)
{
    Display *display = XOpenDisplay(NULL);
    if (!display)
    {
        throw std::runtime_error("Unable to open display");
    }

    Window rootWindow = DefaultRootWindow(display);
    if (!rootWindow)
    {
        throw std::runtime_error("Unable to get root window");
    }

    LOG_F(INFO, "starting to find window");

    Window window = findWindowByName(display, rootWindow, windowName);
    Window parentWindow = findWindowByName(display, rootWindow, parentWindowName);

    // Window *children, dummy;
    // unsigned int i;
    // Window parentWindow;
    // XQueryTree(display, window, &dummy, &parentWindow, &children, &i);
    // std::string parentWindowName = getWindowName(display, parentWindow);
    // LOG_F(INFO, "got parent: %p", parentWindow);
    // LOG_F(INFO, "got parent name: %p", parentWindowName);

    // std::tuple<Window*, Window*> windowAndParent = findWindowByName2(display, rootWindow, NULL, windowName);
    // LOG_F(INFO, "found it");
    

    // Window* child = std::get<0>(windowAndParent);
    // Window* parent = std::get<1>(windowAndParent);
    // LOG_F(INFO, "child: %p", child);
    // LOG_F(INFO, "parent: %p",  parent);

    // LOG_F(INFO, "got tuple stuff");
    // std::string childTitle = getWindowName(display, *child);
    // LOG_F(INFO, "got child name");
    // std::string parentTitle = getWindowName(display, *parent);

    // LOG_F(INFO, "got names too");
    // LOG_F(INFO, "child title: %s", childTitle.c_str());
    // LOG_F(INFO, "parent title: %s",  parentTitle.c_str());

    // if (!window)
    // {
    //     throw std::runtime_error("Unable to find window with name \"" + windowName + "\"");
    // }
    // else
    // {
    //     LOG_F(INFO, "Window found: %p", &window);
    // }

    XSetTransientForHint(display, window, parentWindow);
    sendXEventAboveAndSkipTaskbar(display, window);
      
    setDisallowMaximize(display, window);
    


    XFlush(display);
    XCloseDisplay(display);
}
void setWindowAlwaysOnTopAndSkipTaskbar2(std::string windowName)
{
    Display *display = XOpenDisplay(NULL);
    if (!display)
    {
        throw std::runtime_error("Unable to open display");
    }

    Window rootWindow = DefaultRootWindow(display);
    if (!rootWindow)
    {
        throw std::runtime_error("Unable to get root window");
    }

    Window window = findWindowByName(display, rootWindow, windowName);

    if (!window)
    {
        throw std::runtime_error("Unable to find window with name \"" + windowName + "\"");
    }
    else
    {
        LOG_F(INFO, "Window found: %p", &window);
    }

    sendXEventAboveAndSkipTaskbar2(display, window);

    XFlush(display);
    XCloseDisplay(display);
}
