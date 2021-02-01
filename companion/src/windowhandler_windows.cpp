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
#include <codecvt>
#include <regex>
#include <windows.h>
#include <stdexcept>
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

std::string wstringToUtf8String(const std::wstring &str)
{
    std::wstring_convert<std::codecvt_utf8<wchar_t>> convert;
    return convert.to_bytes(str);
}

std::string getWindowTitle(HWND window)
{
    int length = GetWindowTextLengthW(window);

    if (length == 0)
    {
        return std::string();
    }

    wchar_t *buffer = new wchar_t[length + 1];
    GetWindowTextW(window, buffer, length + 1);
    buffer[length] = 0;

    std::wstring titleAsWString = std::wstring(buffer);
    std::string title = wstringToUtf8String(titleAsWString);

    delete[] buffer;
    return title;
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
    std::string title = getWindowTitle(window);
    return title.rfind(titlePrefix, 0) == 0;
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
