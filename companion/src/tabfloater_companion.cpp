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
#include "windowhandler.h"
#include "../libs/loguru/src/loguru.hpp"
#include <iostream>
#include <string>
#include <regex>
#include <codecvt>

#ifndef VERSION
    #define VERSION "unknown"
#endif

#ifndef DEV_BUILD
    #define DEV_BUILD false
#endif

#ifdef _WIN32
    #include <fcntl.h>
    #define OS "Windows"
#endif
#ifdef linux
    #define OS "Linux"
#endif


std::string getVersion() {
    return DEV_BUILD
            ? VERSION + std::string("-dev")
            : VERSION;
}

void initLogging(std::string logFilePath)
{
    loguru::add_file(logFilePath.c_str(), loguru::Append, loguru::Verbosity_MAX);
    std::string initMessage = std::string("TabFloater Companion started. Version: ") + getVersion() + ", OS: " + OS;

    LOG_F(INFO, initMessage.c_str());
}

void logStartUpError(std::string logFilePath, std::string errorMessage)
{
    initLogging(logFilePath);
    LOG_F(ERROR, errorMessage.c_str());
}

#ifdef _WIN32
int setBinaryMode(FILE *file, std::string logFilePath)
{
    int result;

    result = _setmode(_fileno(file), _O_BINARY);
    if (result == -1)
    {
        logStartUpError(logFilePath, "Unable to set binary mode. Result: " + std::to_string(result));
        abort();
    }

    result = setvbuf(file, NULL, _IONBF, 0);
    if (result != 0)
    {
        logStartUpError(logFilePath, "Unable to set buffer. Result: " + std::to_string(result));
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
    // std::wcin.imbue(std::locale(std::locale::empty(), new std::codecvt_utf8<wchar_t>));
    // std::wstringstream wss;


    // std::wifstream wif(filename);
    // wif.imbue(std::locale(std::locale::empty(), new std::codecvt_utf8<wchar_t>));
    // std::wstringstream wss;
    // wss << wif.rdbuf();
    // return wss.str();

    std::string msg = "";
    for (int i = 0; i < length; i++)
    {
        msg += getchar();
    }

    return msg;

    // wchar_t *buffer = new wchar_t[length];

    // std::wcin.imbue(std::locale(std::locale(""), new std::codecvt_utf8<wchar_t>));
    // std::wcin.read(buffer, length);
    // std::wstring json(buffer);
    // delete[] buffer;

    // std::wstring_convert<std::codecvt_utf8<wchar_t>> convert;
    // return convert.to_bytes(json);
    // return json;
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

void sendPingResponse(std::string logFilePath)
{
#ifdef _WIN32
    for (int i = 0; i < logFilePath.size(); i++)
    {
        if (logFilePath[i] == '\\')
        {
            logFilePath.insert(i, "\\");
            i++;
        }
    }
#endif

    std::string responseJson = std::string("{\"status\":\"ok\",\"version\":\"") +
                                getVersion() + "\",\"os\":\"" + OS
                               + "\",\"logfile\":\"" + logFilePath + "\"}";
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
    std::string logFilePath = constructLogFilePath(DEV_BUILD);

#ifdef _WIN32
    setBinaryMode(stdin, logFilePath);
    setBinaryMode(stdout, logFilePath);
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
            initLogging(logFilePath);
        }

        LOG_F(INFO, "Input JSON: \"%s\"", json.c_str());
        LOG_F(INFO, "Action: \"%s\"", action.c_str());
        LOG_F(INFO, "message length: \"%d\"", messageLength);

        if (action.compare("ping") == 0)
        {
            LOG_F(INFO, "Ping received");
            sendPingResponse(logFilePath);
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
