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

#define LOG_FILE "tabfloater_companion.log"

#ifdef _WIN32
    #include <fcntl.h>
    #include <direct.h>
    #define GetCurrentDir _getcwd
    #define PATH_SEPARATOR "\\\\"

    inline int access(const char *pathname, int mode) {
        return _access(pathname, mode);
    }
#endif

#ifdef linux
    #include <unistd.h>
    #include <sys/types.h>
    #include <pwd.h>
    #define GetCurrentDir getcwd
    #define PATH_SEPARATOR "/"
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

std::string getHomeDirectory() {
    const char *homeDir;

    if ((homeDir = getenv("HOME")) == NULL) {
        homeDir = getpwuid(getuid())->pw_dir;
    }

    return std::string(homeDir);
}

std::string constructLogFilePath() {
    std::string currentDir = getCurrentWorkingDirectory();

    std::string logFileDir;
    if (access(currentDir.c_str(), W_OK) == 0) {
        logFileDir = currentDir;
    } else {
        logFileDir = getHomeDirectory() + PATH_SEPARATOR + ".tabfloater";
    }

    //TODO windows

    return logFileDir + PATH_SEPARATOR + LOG_FILE;
}
