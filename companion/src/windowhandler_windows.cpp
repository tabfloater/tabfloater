#include "windowhandler.h"
#include "../libs/loguru/src/loguru.hpp"
#include <shobjidl.h>
#include <stdexcept>
#include <tchar.h>
#include <vector>

void throwIfNotFoundOrLog(HWND window, std::string windowTitlePrefix)
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

BOOL CALLBACK collectWindows(HWND hwnd, LPARAM lParam)
{
    std::vector<HWND> *windowList = reinterpret_cast<std::vector<HWND> *>(lParam);
    (*windowList).push_back(hwnd);

    return TRUE;
}

std::vector<HWND> getWindowListInStackingOrderTopMostFirst()
{
    std::vector<HWND> windowList;

    EnumWindows(collectWindows, reinterpret_cast<LPARAM>(&windowList));

    return windowList;
}

bool windowTitleStartsWith(HWND window, std::string titlePrefix)
{
    int windowTitleLength = GetWindowTextLengthA(window) + 10; // add some extra characters just in case

    if (windowTitleLength == 0)
    {
        return false;
    }

    TCHAR *buffer = new TCHAR[windowTitleLength];
    GetWindowText(window, buffer, windowTitleLength);

    if (_tcsstr(buffer, titlePrefix.c_str()))
    {
        delete[] buffer;
        return true;
    }

    delete[] buffer;
    return false;
}

std::pair<HWND, HWND> findWindowsInStackingOrder(std::string windowTitlePrefix, std::string ownerWindowTitlePrefix)
{
    std::vector<HWND> windows = getWindowListInStackingOrderTopMostFirst();
    HWND window = 0;
    HWND ownerWindow = 0;

    for (auto w = windows.begin(); w != windows.end(); ++w)
    {
        if (!window && windowTitleStartsWith(*w, windowTitlePrefix))
        {
            window = *w;

            // If we found the floating window, don't even try to check the owner
            // window. Otherwise, if the two title prefixes are the same, we would
            // match the same window as both the floating and the owner window.
            continue;
        }
        if (!ownerWindow && windowTitleStartsWith(*w, ownerWindowTitlePrefix))
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

void setAsModelessDialog(std::string windowTitlePrefix, std::string ownerWindowTitlePrefix)
{
    std::pair<HWND, HWND> windowPair = findWindowsInStackingOrder(windowTitlePrefix, ownerWindowTitlePrefix);
    HWND window = windowPair.first;
    HWND ownerWindow = windowPair.second;

    SetWindowLongPtr(window, GWLP_HWNDPARENT, reinterpret_cast<LONG_PTR>(ownerWindow));
}
