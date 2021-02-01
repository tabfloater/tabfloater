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

#include "logutil.h"

#include <pwd.h>
#include <unistd.h>

#define PATH_SEPARATOR "/"


std::string getCurrentWorkingDirectory()
{
    char buffer[FILENAME_MAX];
    getcwd(buffer, FILENAME_MAX);
    std::string workingDir(buffer);

    return workingDir;
}

std::string getTabFloaterDirectoryInHome() {
    const char *homeDir;

    if ((homeDir = getenv("HOME")) == nullptr) {
        homeDir = getpwuid(getuid())->pw_dir;
    }

    return std::string(homeDir) + PATH_SEPARATOR + ".tabfloater-companion";
}

std::string constructLogFilePath(bool useWorkingDirectory) {
    std::string logFileDir = useWorkingDirectory
                                ? getCurrentWorkingDirectory()
                                : getTabFloaterDirectoryInHome();

    return logFileDir + PATH_SEPARATOR + LOG_FILE;
}
