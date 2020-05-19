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

#include "windowhandler.h"
#include "../libs/loguru/src/loguru.hpp"
#include <iostream>
#include <string>
#include <regex>

#define LOG_FILE "tabfloater_companion.log"

#ifndef VERSION
#define VERSION "unknown"
#endif

#ifdef _WIN32
#include <fcntl.h>
#include <direct.h>
#define GetCurrentDir _getcwd
#define PATH_SEPARATOR "\\\\"
#else
#include <unistd.h>
#define GetCurrentDir getcwd
#define PATH_SEPARATOR "/"
#endif

void initLogging()
{
    loguru::add_file(LOG_FILE, loguru::Append, loguru::Verbosity_MAX);
    std::string initMessage = std::string("TabFloater Companion started. Version: ") + VERSION + ", OS: ";

#ifdef _WIN32
    initMessage += "Windows";
#endif
#ifdef linux
    initMessage += "Linux";
#endif

    LOG_F(INFO, initMessage.c_str());
}

void logStartUpError(std::string errorMessage)
{
    initLogging();
    LOG_F(ERROR, errorMessage.c_str());
}

#ifdef _WIN32
int setBinaryMode(FILE *file)
{
    int result;

    result = _setmode(_fileno(file), _O_BINARY);
    if (result == -1)
    {
        logStartUpError("Unable to set binary mode. Result: " + std::to_string(result));
        abort();
    }

    result = setvbuf(file, NULL, _IONBF, 0);
    if (result != 0)
    {
        logStartUpError("Unable to set buffer. Result: " + std::to_string(result));
        abort();
    }

    return 0;
}
#endif

unsigned int readFirstFourBytesFromStdIn()
{
    char buffer[4];

    std::cin.read(buffer, 4);
    if (std::cin.eof())
    {
        return 0;
    }

    return *reinterpret_cast<unsigned int *>(buffer);
}

std::string readStringFromStdIn(unsigned int length)
{
    char *buffer = new char[length];

    std::cin.read(buffer, length);
    std::string json(buffer);
    delete[] buffer;

    return json;
}

std::string unescapeQuotes(std::string str)
{
    // We need to match the string '\"' and replace it with '"'
    // The regex to match this string is '\\"', and we need to
    // escape each character with an additional backslash.
    // So it becomes '\\ \\ \"', which is '\\\\\"'.
    return std::regex_replace(str, std::regex("\\\\\""), "\"");
}

std::string getJsonValueByKey(std::string jsonContents, std::string key)
{
    // We are looking for the JSON value with a format like this: "key": "value"
    // This regex also allows the '\"' character in the value. It looks for the
    // closing '"' character and allows a comma at the end. The full value is the
    // first capture grop. This wouldn't work for nested JSONs, but TabFloater
    // only sends non-nested JSON.
    std::regex jsonRegex(R"(\")" + key + R"(\"\s*:\s*\"(([^\"]?(\\\")*)*)\",?)");
    std::smatch matches;

    if (std::regex_search(jsonContents, matches, jsonRegex) && matches.size() >= 1)
    {
        std::string value = matches[1].str();
        return unescapeQuotes(value);
    }

    return std::string();
}

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

void sendMessage(std::string message)
{
    unsigned int len = message.length();

    LOG_F(INFO, "Sending JSON: \"%s\", length: %d", message.c_str(), len);

    std::cout << char(len >> 0)
              << char(len >> 8)
              << char(len >> 16)
              << char(len >> 24);

    std::cout << message;
}

void sendPingResponse(bool debugging)
{
    std::string responseJson = std::string("{\"status\":\"ok\",\"version\":\"") + VERSION + "\",\"os\":\"";

#ifdef _WIN32
    responseJson += "Windows";
#endif
#ifdef linux
    responseJson += "Linux";
#endif
    responseJson += "\"";

    if (debugging)
    {
        std::string logFilePath = getCurrentWorkingDirectory() + PATH_SEPARATOR + LOG_FILE;
        responseJson += ",\"logfile\":\"" + logFilePath + "\"";
    }

    responseJson += "}";

    sendMessage(responseJson);
}

void sendStatus(std::string status)
{
    std::string statusJson = "{\"status\":\"" + status + "\"}";
    sendMessage(statusJson);
}

int main(int argc, char *argv[])
{
    loguru::g_stderr_verbosity = loguru::Verbosity_OFF;

#ifdef _WIN32
    setBinaryMode(stdin);
    setBinaryMode(stdout);
#endif

    int returnValue = 0;

    while (1)
    {
        // See https://developer.chrome.com/extensions/nativeMessaging
        // As described in the Chrome native messaging protocol, the JSON message
        // is preceded with the message length in the first 4 bytes. We need to
        // read that, and then read that many characters that will make up the message.
        // If the message length is 0, Chrome has closed the message port and we can
        // stop reading.

        unsigned int messageLength = readFirstFourBytesFromStdIn();
        if (!messageLength)
        {
            break;
        }

        std::string json = readStringFromStdIn(messageLength);
        std::string action = getJsonValueByKey(json, "action");
        std::string debug = getJsonValueByKey(json, "debug");
        bool debugging = debug.compare("true") == 0;

        if (debugging)
        {
            loguru::init(argc, argv);
            initLogging();
        }

        LOG_F(INFO, "Input JSON: \"%s\"", json.c_str());
        LOG_F(INFO, "Action: \"%s\"", action.c_str());

        if (action.compare("ping") == 0)
        {
            LOG_F(INFO, "Ping received");
            sendPingResponse(debugging);
        }
        else if (action.compare("setAsModelessDialog") == 0)
        {
            LOG_F(INFO, "setAsModelessDialog request received");

            std::string windowTitle = getJsonValueByKey(json, "windowTitle");
            std::string parentWindowTitle = getJsonValueByKey(json, "parentWindowTitle");
            LOG_F(INFO, "Window title: \"%s\"", windowTitle.c_str());
            LOG_F(INFO, "Parent window title: \"%s\"", parentWindowTitle.c_str());

            try
            {
                setAsModelessDialog(windowTitle, parentWindowTitle);
                sendStatus("ok");
            }
            catch (std::exception &ex)
            {
                LOG_F(ERROR, "An error occurred while manipulating window: %s", ex.what());
                sendStatus("error");
                returnValue = 1;
            }
        }
    }

    return returnValue;
}
