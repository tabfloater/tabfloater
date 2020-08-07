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

#include "logutil.h"

#ifdef _WIN32
    #include <io.h>
    #include <fileapi.h>
    #define GetCurrentDir _getcwd
    #define PATH_SEPARATOR "\\\\"
    #define TABFLOATER_LOG_DIR "TabFloater Companion"

    // inline int access(const char *pathname, int mode) {
    //     return _access_s(pathname, mode);
    // }
#endif

#ifdef linux
    #include <unistd.h>
    #include <sys/types.h>
    #include <pwd.h>
    #define GetCurrentDir getcwd
    #define PATH_SEPARATOR "/"
    #define TABFLOATER_LOG_DIR ".tabfloater_companion"
#endif


std::string getCurrentWorkingDirectory()
{
    char buffer[FILENAME_MAX];
    GetCurrentDir(buffer, FILENAME_MAX);
    std::string workingDir(buffer);

#ifdef _WIN32
    for (int i = 0; i < workingDir.size(); i++)
    {
        if (workingDir[i] == '\\')
        {
            workingDir.insert(i, "\\");
            i++;
        }
    }
#endif

    return workingDir;
}

#ifdef linux
std::string getHomeDirectory() {
    const char *homeDir;

    if ((homeDir = getenv("HOME")) == NULL) {
        homeDir = getpwuid(getuid())->pw_dir;
    }

    return std::string(homeDir);
}
#endif

#ifdef _WIN32
std::string getAppDataDirectory() {
    return "C:\\work";
}
#endif

std::string getLogBaseDirectory() {
#ifdef _WIN32
    return getAppDataDirectory();
#endif
#ifdef linux
    return getHomeDirectory();
#endif
}

std::string constructLogFilePath() {
    std::string currentDir = getCurrentWorkingDirectory();

    std::string logFileDir = currentDir;
    // if (access(currentDir.c_str(), W_OK) == 0) {
    //     logFileDir = currentDir;
    // } else {
    //     logFileDir = getLogBaseDirectory() + PATH_SEPARATOR + TABFLOATER_LOG_DIR;
    // }

    //TODO windows

    std::string logfile;
    HANDLE testFileHandle = CreateFileA("C:\\work\\1", GENERIC_WRITE, 0, NULL, CREATE_NEW, FILE_ATTRIBUTE_NORMAL, NULL);


    // if (access("c:\\Program Files (x86)\\Microsoft SDKs\\", 6) == 0) {
    //     logfile = "got";
    // } else {
    //     logfile = "nojoy";
    // }


    return logFileDir + PATH_SEPARATOR + LOG_FILE;
}
