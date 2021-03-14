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

#include "windowhandler.h"
#include "../libs/loguru/src/loguru.hpp"
#include <X11/Xlib.h>
#include <stdexcept>
#include <vector>

#define _NET_WM_STATE_ADD 1

Display* getDisplay() {
    Display *display = XOpenDisplay(NULL);
    if (!display)
    {
        throw std::runtime_error("Unable to open display");
    }

    return display;
}

void throwIfNotFoundOrLog(Window window, std::string windowTitlePrefix)
{
    if (!window)
    {
        throw std::runtime_error("Unable to find window with title prefix \"" + windowTitlePrefix + "\"");
    }
    else
    {
        LOG_F(INFO, "Window found: %ld", window);
    }
}

std::string getWindowTitle(Display *display, Window window)
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

std::vector<Window> getWindowListInStackingOrderTopMostFirst(Display *display)
{
    Window rootWindow = DefaultRootWindow(display);
    if (!rootWindow)
    {
        throw std::runtime_error("Unable to get root window");
    }

    Atom actualType, filterAtom;
    int actualFormat, status;
    unsigned long itemCount, bytesAfter;
    unsigned char *data;

    filterAtom = XInternAtom(display, "_NET_CLIENT_LIST_STACKING", True);
    status = XGetWindowProperty(display, rootWindow, filterAtom, 0L, 8192L, False, AnyPropertyType,
                                &actualType, &actualFormat, &itemCount, &bytesAfter, &data);

    if (status != Success)
    {
        throw std::runtime_error("Unable to get _NET_CLIENT_LIST_STACKING property of root window. Status code: " + std::to_string(status));
    }

    Window *windowArray = reinterpret_cast<Window *>(data);
    std::vector<Window> windowVector;

    // _NET_CLIENT_LIST_STACKING returns windows in stacking order: bottom->top,
    // so we need to iterate backwards to get the topmost window as the first item
    for (int i = itemCount - 1; i >= 0; i--)
    {
        Window w = windowArray[i];
        windowVector.push_back(w);
    }

    XFree(data);

    return windowVector;
}

bool windowTitleStartsWith(Display *display, Window window, std::string titlePrefix)
{
    std::string title = getWindowTitle(display, window);
    return title.rfind(titlePrefix, 0) == 0;
}

Window findSingleWindowInStackingOrder(Display *display, std::string windowTitlePrefix)
{
    std::vector<Window> windows = getWindowListInStackingOrderTopMostFirst(display);
    Window window = 0;

    for (auto w = windows.begin(); w != windows.end(); ++w)
    {
        if (!window && windowTitleStartsWith(display, *w, windowTitlePrefix))
        {
            window = *w;
            break;
        }
    }

    throwIfNotFoundOrLog(window, windowTitlePrefix);

    return window;
}

std::pair<Window, Window> findWindowsInStackingOrder(Display *display, std::string windowTitlePrefix, std::string ownerWindowTitlePrefix)
{
    std::vector<Window> windows = getWindowListInStackingOrderTopMostFirst(display);
    Window window = 0;
    Window ownerWindow = 0;

    for (auto w = windows.begin(); w != windows.end(); ++w)
    {
        if (!window && windowTitleStartsWith(display, *w, windowTitlePrefix))
        {
            window = *w;

            // If we found the floating window, don't even try to check the owner
            // window. Otherwise, if the two title prefixes are the same, we would
            // match the same window as both the floating and the owner window.
            continue;
        }
        if (!ownerWindow && windowTitleStartsWith(display, *w, ownerWindowTitlePrefix))
        {
            ownerWindow = *w;
        }

        if (window && ownerWindow)
        {
            // Found both windows
            break;
        }
    }

    throwIfNotFoundOrLog(window, windowTitlePrefix);
    throwIfNotFoundOrLog(ownerWindow, ownerWindowTitlePrefix);

    return std::make_pair(window, ownerWindow);
}

void sendXEvent(Display *display, Window window, std::vector<std::string> eventNames)
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

    int eventCounter = 1;
    for (auto e = eventNames.begin(); e != eventNames.end(); ++e) {
        event.xclient.data.l[eventCounter++] = XInternAtom(display, (*e).c_str(), False);
    }

    XSendEvent(display, DefaultRootWindow(display), False,
               SubstructureRedirectMask | SubstructureNotifyMask, &event);
}

void setWindowAlwaysOnTopAndSkipTaskbar(std::string windowTitlePrefix)
{
    Display *display = getDisplay();

    Window window = findSingleWindowInStackingOrder(display, windowTitlePrefix);

    std::vector<std::string> eventsToSet = {"_NET_WM_STATE_SKIP_TASKBAR", "_NET_WM_STATE_ABOVE"};
    sendXEvent(display, window, eventsToSet);

    XFlush(display);
    XCloseDisplay(display);
}

void setAsModelessDialog(std::string windowTitlePrefix, std::string ownerWindowTitlePrefix)
{
    Display *display = getDisplay();

    std::pair<Window, Window> windowPair = findWindowsInStackingOrder(display, windowTitlePrefix, ownerWindowTitlePrefix);
    Window window = windowPair.first;
    Window ownerWindow = windowPair.second;

    XSetTransientForHint(display, window, ownerWindow);

    std::vector<std::string> eventsToSet = {"_NET_WM_STATE_SKIP_TASKBAR"};
    sendXEvent(display, window, eventsToSet);

    XFlush(display);
    XCloseDisplay(display);
}
