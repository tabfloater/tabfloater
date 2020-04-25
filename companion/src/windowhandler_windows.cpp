#include "windowhandler.h"
#include <shobjidl.h>

const GUID CLSID_TaskbarList = {0x56FDF344, 0xFD6D, 0x11D0, {0x95, 0x8A, 0x00, 0x60, 0x97, 0xC9, 0xA0, 0x90}};
const GUID IID_ITaskbarList = {0x56FDF342, 0xFD6D, 0x11D0, {0x95, 0x8A, 0x00, 0x60, 0x97, 0xC9, 0xA0, 0x90}};

void setWindowAlwaysOnTopAndSkipTaskbar(std::string windowName)
{
    HWND windowHandler = FindWindowA(NULL, windowName.c_str());

    SetWindowPos(windowHandler, HWND_TOPMOST, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE);

    CoInitialize(NULL);

    ITaskbarList *pTaskbarList = NULL;
    if (FAILED(CoCreateInstance(CLSID_TaskbarList, NULL, CLSCTX_ALL, IID_ITaskbarList, (void **)&pTaskbarList)))
    {
        // error
    }
    else
    {
        if (SUCCEEDED(pTaskbarList->HrInit()))
        {
            pTaskbarList->DeleteTab(windowHandler);
        }
        else
        {
            //log warn
        }

        pTaskbarList->Release();
    }

    CoUninitialize();
}