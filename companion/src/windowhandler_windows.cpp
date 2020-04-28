#include "windowhandler.h"
#include "../libs/loguru/src/loguru.hpp"
#include <shobjidl.h>
#include <stdexcept>
#include <tchar.h>

BOOL CALLBACK matchTitlePrefixProc(HWND hwnd, LPARAM lParam)
{
    std::pair<std::string, HWND> *pair = reinterpret_cast<std::pair<std::string, HWND> *>(lParam);
    std::string titlePrefix = (*pair).first;

    int windowTitleLength = GetWindowTextLengthA(hwnd) + 10; // add some extra characters just in case

    if (windowTitleLength == 0)
    {
        return TRUE;
    }

    TCHAR *buffer = new TCHAR[windowTitleLength];
    GetWindowText(hwnd, buffer, windowTitleLength);

    if (_tcsstr(buffer, titlePrefix.c_str()))
    {
        (*pair).second = hwnd;

        delete[] buffer;
        return FALSE;
    }

    delete[] buffer;
    return TRUE;
}

HWND findWindowWithTitlePrefix(std::string windowTitlePrefix)
{
    std::pair<std::string, HWND> pair = std::make_pair(windowTitlePrefix, nullptr);
    std::pair<std::string, HWND> *p = &pair;

    EnumWindows(matchTitlePrefixProc, reinterpret_cast<LPARAM>(p));

    HWND windowHandle = (*p).second;

    if (!windowHandle)
    {
        throw std::runtime_error("Unable to find window with title prefix \"" + windowTitlePrefix + "\"");
    }
    else
    {
        LOG_F(INFO, "Found window with title prefix \"%s\": %p", windowTitlePrefix, windowHandle);
    }

    return windowHandle;
}

void setAsModelessDialog(std::string windowTitlePrefix, std::string ownerWindowTitlePrefix)
{
    HWND windowHandle = findWindowWithTitlePrefix(windowTitlePrefix);
    HWND ownerWindowHandle = findWindowWithTitlePrefix(ownerWindowTitlePrefix);

    SetWindowLongPtr(windowHandle, GWLP_HWNDPARENT, reinterpret_cast<LONG_PTR>(ownerWindowHandle));
}