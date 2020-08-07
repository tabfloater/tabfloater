/*
 * Copyright 2020 Balazs Gyurak
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

#define WINVER 0x0600
#define _WIN32_WINNT 0x0600

#include "logutil.h"
#include <codecvt>
#include <io.h>
#include <regex>
#include <shlobj.h>

#define PATH_SEPARATOR "\\"


std::string getCurrentWorkingDirectory()
{
    char buffer[FILENAME_MAX];
    _getcwd(buffer, FILENAME_MAX);
    std::string workingDir(buffer);

    return workingDir + PATH_SEPARATOR;
}

std::string getTabFloaterAppDataDirectory() {
    std::string tabFloaterAppDataPath = "";
    PWSTR path;

    HRESULT result = SHGetKnownFolderPath(FOLDERID_RoamingAppData, 0, nullptr, &path);

    if (result == S_OK) {
        std::wstring pathAsWstring = std::wstring(path);
        std::wstring_convert<std::codecvt_utf8<wchar_t>> convert;
        tabFloaterAppDataPath = convert.to_bytes(pathAsWstring) + PATH_SEPARATOR + "TabFloater Companion" + PATH_SEPARATOR;

        CreateDirectoryA(tabFloaterAppDataPath.c_str(), NULL);
    }

    CoTaskMemFree(path);

    return tabFloaterAppDataPath;
}

std::string constructLogFilePath(bool useWorkingDirectory) {
    std::string logFileDir = useWorkingDirectory
                                ? getCurrentWorkingDirectory()
                                : getTabFloaterAppDataDirectory();

    return logFileDir + LOG_FILE;
}
