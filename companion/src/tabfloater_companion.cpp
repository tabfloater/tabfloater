#include "windowhandler.h"
#include "../libs/loguru/src/loguru.hpp"
#include <iostream>
#include <string>
#include <regex>

#ifndef VERSION
#define VERSION "unknown"
#endif

#ifdef _WIN32
#include <fcntl.h>
#endif

void initLogging()
{
    loguru::add_file("tabfloater_companion.log", loguru::Append, loguru::Verbosity_MAX);
    std::string initMessage = std::string("TabFloater Companion started. Version: ") + VERSION + ", OS: ";

#ifdef _WIN32
    initMessage += "Windows";
#endif
#ifdef linux
    initMessage += "Linux";
    ;
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
        return matches[1].str();
    }

    return std::string();
}

void sendStatus(std::string status, bool appendVersion = false)
{
    LOG_F(INFO, "Sending status \"%s\"", status.c_str());

    std::string statusJson = "{\"status\":\"" + status + "\"";

    if (appendVersion)
    {
        statusJson += std::string(",\"version\":\"") + VERSION + "\"";
    }

    statusJson += "}";
    unsigned int len = statusJson.length();

    LOG_F(INFO, "statusJson: \"%s\", length: %d", statusJson.c_str(), len);

    std::cout << char(len >> 0)
              << char(len >> 8)
              << char(len >> 16)
              << char(len >> 24);

    std::cout << statusJson;
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

        if (debug.compare("true") == 0)
        {
            loguru::init(argc, argv);
            initLogging();
        }

        LOG_F(INFO, "Input JSON: \"%s\"", json.c_str());
        LOG_F(INFO, "Action: \"%s\"", action.c_str());

        if (action.compare("ping") == 0)
        {
            LOG_F(INFO, "Ping received");
            sendStatus("ok", true);
        }
        else if (action.compare("setAsChildWindow") == 0)
        {
            LOG_F(INFO, "setAsChildWindow request received");

            std::string windowTitle = getJsonValueByKey(json, "windowTitle");
            std::string parentWindowTitle = getJsonValueByKey(json, "parentWindowTitle");
            LOG_F(INFO, "Window title: \"%s\"", windowTitle.c_str());
            LOG_F(INFO, "Parent window title: \"%s\"", parentWindowTitle.c_str());

            try
            {
                setAsChildWindow(windowTitle, parentWindowTitle);
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
