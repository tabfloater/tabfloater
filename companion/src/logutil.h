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

#include <string>
#define LOG_FILE "tabfloater-companion.log"

/**
 * Returns a path to the desired log file location, including the file name.
 * This location is either the current working directory, or another directory
 * where the user has write access to. This will be "$HOME/.tabfloater_companion"
 * on Linux and "%APPDATA%\TabFloater Companion" on Windows.
 *
 * The log file name is always "tabfloater_companion.log".
 *
 * @param useWorkingDirectory if true, the current working directory will be used,
 * otherwise the above specified directory
 */
std::string constructLogFilePath(bool useWorkingDirectory);
