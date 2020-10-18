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

#include "interactive.h"
#include <iomanip>
#include <iostream>
#include <fstream>
#include <linux/limits.h>
#include <pwd.h>
#include <unistd.h>

#define EXECUTABLE_CHROMIUM "chromium-browser"
#define EXECUTABLE_CHROMIUM_SNAP "chromium"
#define EXECUTABLE_CHROME "google-chrome"
#define EXECUTABLE_FIREFOX "firefox"

#define MANIFEST_FILE_NAME "io.github.tabfloater.companion.json"
#define MANIFEST_PATH_CHROMIUM "/.config/chromium/NativeMessagingHosts/" + MANIFEST_FILE_NAME
#define MANIFEST_PATH_CHROMIUM_SNAP "/snap/chromium/common/chromium/NativeMessagingHosts/" + MANIFEST_FILE_NAME
#define MANIFEST_PATH_CHROME "/.config/google-chrome/NativeMessagingHosts/" + MANIFEST_FILE_NAME
#define MANIFEST_PATH_FIREFOX "/.mozilla/native-messaging-hosts/" + MANIFEST_FILE_NAME

const std::string WHITESPACE = " \n\r\t\f\v";

std::string trim(const std::string &str)
{
    size_t first = str.find_first_not_of(WHITESPACE);

    if (std::string::npos == first)
    {
        return str;
    }

    size_t last = str.find_last_not_of(WHITESPACE);
    return str.substr(first, (last - first + 1));
}

const char *getAppImageEnvVarValue()
{
    return getenv("APPIMAGE");
}

bool isRunningAsAppImage()
{
    return getAppImageEnvVarValue() != NULL;
}

std::string getHomeDirectory()
{
    const char *homeDir;

    if ((homeDir = getenv("HOME")) == NULL)
    {
        homeDir = getpwuid(getuid())->pw_dir;
    }

    return std::string(homeDir);
}

std::string getCurrentExecutablePath()
{
    const char *appImagePath;
    if ((appImagePath = getAppImageEnvVarValue()) != NULL)
    {
        return std::string(appImagePath);
    }

    char path[PATH_MAX + 1] = {0};
    readlink("/proc/self/exe", path, sizeof(path));
    return std::string(path);
}

std::string readStringFromFile(std::string filePath)
{
    std::ifstream in(filePath);
    std::string str((std::istreambuf_iterator<char>(in)),
                    std::istreambuf_iterator<char>());

    return str;
}

bool writeStringToFile(std::string filePath, std::string contents)
{
    std::ofstream out(filePath);
    if (out.fail())
    {
        return false;
    }
    out << contents;
    out.close();
    return true;
}

bool isBrowserInstalled(std::string executable)
{
    return system(std::string("which " + executable + " > /dev/null").c_str()) == 0;
}

std::string buildChromeManifest(std::string executablePath)
{
    return std::string(R"({
  "name": "io.github.tabfloater.companion",
  "description": "Tabfloater Companion",
  "path": ")" + executablePath +
                       R"(",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://iojgbjjdoanmhcmmihbapiejfbbadhjd/"
  ]
})");
}

std::string buildFirefoxManifest(std::string executablePath)
{
    return std::string(R"({
  "name": "io.github.tabfloater.companion",
  "description": "Tabfloater Companion",
  "path": ")" + executablePath +
                       R"(",
  "type": "stdio",
  "allowed_extensions": [
    "tabfloater@tabfloater.io"
  ]
})");
}

bool doesManifestExist(std::string manifestPath)
{
    return access(manifestPath.c_str(), 0) == 0;
}

bool isManifestCorrect(std::string manifestPath, std::string expectedManifestContent)
{
    std::string fileContents = trim(readStringFromFile(manifestPath));
    return fileContents.compare(expectedManifestContent) == 0;
}

std::string getManifestStatus(std::string browserExecutable, std::string manifestPath, std::string expectedManifestContent)
{
    bool browserInstalled = isBrowserInstalled(browserExecutable);
    bool manifestExists = doesManifestExist(manifestPath);
    bool manifestCorrect = isManifestCorrect(manifestPath, expectedManifestContent);

    if (manifestExists)
    {
        return browserInstalled
                   ? (manifestCorrect ? "registered ✓" : "corrupted !")
                   : (manifestCorrect ? "registered (browser not found)" : "corrupted (browser not found)");
    }

    return browserInstalled ? "unregistered" : "(browser not found)";
}

void printOption(std::string option, std::string description)
{
    std::cout << std::left << std::setw(4) << std::setfill(' ') << " ";
    std::cout << std::left << std::setw(15) << std::setfill(' ') << option;
    std::cout << std::left << std::setw(65) << std::setfill(' ') << description;
    std::cout << std::endl;
}

void printStatusRow(std::string col1, std::string col2)
{
    std::cout << std::left << std::setw(2) << std::setfill(' ') << " ";
    std::cout << std::left << std::setw(20) << std::setfill(' ') << col1;
    std::cout << std::left << std::setw(25) << std::setfill(' ') << col2 << std::endl;
}

void printAppImageWarning()
{
    std::cout << "Warning: you are running TabFloater Companion as AppImage. This will not work with Snap Chromium." << std::endl;
    std::cout << "To learn more about alternatives, visit TODO" << std::endl;
    std::cout << std::endl;
}

void printStatus()
{
    std::string homeDirectory = getHomeDirectory();
    std::string executablePath = getCurrentExecutablePath();
    std::string chromeManifest = buildChromeManifest(executablePath);
    std::string firefoxManifest = buildFirefoxManifest(executablePath);

    std::cout << std::endl;
    printStatusRow("BROWSER", "TABFLOATER STATUS");
    std::cout << std::endl;
    printStatusRow("Chromium", getManifestStatus(EXECUTABLE_CHROMIUM, homeDirectory + MANIFEST_PATH_CHROMIUM, chromeManifest));
    printStatusRow("Chromium (Snap)", getManifestStatus(EXECUTABLE_CHROMIUM_SNAP, homeDirectory + MANIFEST_PATH_CHROMIUM_SNAP, chromeManifest));
    printStatusRow("Chrome", getManifestStatus(EXECUTABLE_CHROME, homeDirectory + MANIFEST_PATH_CHROME, chromeManifest));
    printStatusRow("Firefox", getManifestStatus(EXECUTABLE_FIREFOX, homeDirectory + MANIFEST_PATH_FIREFOX, firefoxManifest));
    std::cout << std::endl;
    std::cout << "Note: on Ubuntu 19.10 and up, Chromium is only available via Snap. On these systems, 'Chromium'" << std::endl;
    std::cout << "is reported to be installed, but it is actually identical to the Snap version." << std::endl;
    std::cout << std::endl;

    if (isRunningAsAppImage())
    {
        printAppImageWarning();
    }
}

bool registerManifestForSingleBrowser(std::string browserName, std::string browserExecutable, std::string manifestPath, bool force, bool useFirefoxManifest = false)
{
    if (!force && !isBrowserInstalled(browserExecutable))
    {
        std::cout << browserName + " not found, no changes were made." << std::endl;
        return false;
    }

    std::string executablePath = getCurrentExecutablePath();
    std::string manifest = useFirefoxManifest ? buildFirefoxManifest(executablePath) : buildChromeManifest(executablePath);

    if (!force && doesManifestExist(manifestPath) && isManifestCorrect(manifestPath, manifest))
    {
        std::cout << "TabFloater Companion for " + browserName + " is already registered, no changes were made." << std::endl;
        return false;
    }

    if (!writeStringToFile(manifestPath, manifest))
    {
        std::cerr << "Failed to register TabFloater Companion for " << browserName << ": unable to write to '" << manifestPath << "'" << std::endl;
        return false;
    }

    std::cout << "Registered TabFloater Companion for " << browserName << "." << std::endl;

    if (browserExecutable.compare(EXECUTABLE_CHROMIUM_SNAP) == 0 && isRunningAsAppImage())
    {
        std::cout << std::endl;
        printAppImageWarning();
    }

    return true;
}

bool registerManifestForAllBrowsers(std::string homeDirectory, bool force)
{
    bool registeredChromium = false;
    bool registeredChromiumSnap = false;
    bool registeredChrome = false;
    bool registeredFirefox = false;
    bool atLeastOneOperationOccurred = false;

    if (force || isBrowserInstalled(EXECUTABLE_CHROMIUM))
    {
        registeredChromium = registerManifestForSingleBrowser("Chromium", EXECUTABLE_CHROMIUM, homeDirectory + MANIFEST_PATH_CHROMIUM, force);
        atLeastOneOperationOccurred = true;
    }
    if (force || isBrowserInstalled(EXECUTABLE_CHROMIUM_SNAP))
    {
        registeredChromiumSnap = registerManifestForSingleBrowser("Chromium (Snap)", EXECUTABLE_CHROMIUM_SNAP, homeDirectory + MANIFEST_PATH_CHROMIUM_SNAP, force);
        atLeastOneOperationOccurred = true;
    }
    if (force || isBrowserInstalled(EXECUTABLE_CHROME))
    {
        registeredChrome = registerManifestForSingleBrowser("Google Chrome", EXECUTABLE_CHROME, homeDirectory + MANIFEST_PATH_CHROME, force);
        atLeastOneOperationOccurred = true;
    }
    if (force || isBrowserInstalled(EXECUTABLE_FIREFOX))
    {
        registeredFirefox = registerManifestForSingleBrowser("Firefox", EXECUTABLE_FIREFOX, homeDirectory + MANIFEST_PATH_FIREFOX, force, true);
        atLeastOneOperationOccurred = true;
    }

    if (!atLeastOneOperationOccurred)
    {
        std::cout << "No installed browsers found." << std::endl;
    }

    return registeredChromium || registeredChromiumSnap || registeredChrome || registeredFirefox;
}

void printRegisterUsage(std::string executableName)
{
    std::cout << std::endl;
    std::cout << "Usage: " << executableName << " register BROWSER [--force]" << std::endl;
    std::cout << std::endl;
    std::cout << "Register TabFloater Companion for your browsers." << std::endl;
    std::cout << "For quick setup, run '" + executableName + " register all'." << std::endl;
    std::cout << std::endl;
    std::cout << "Supported browsers: " << std::endl;
    printOption("all", "Register for all installed browsers");
    printOption("chromium", "Register for Chromium");
    printOption("chromium-snap", "Register for Chromium (Snap)");
    printOption("chrome", "Register for Google Chrome");
    printOption("firefox", "Register for Firefox");
    std::cout << std::endl;
    std::cout << "Options: " << std::endl;
    printOption("--force", "Register even if browser is not installed; overwrite existing file");
    std::cout << std::endl;
    std::cout << "Note: on Ubuntu 19.10 and up, Chromium is available only via Snap. On these systems," << std::endl;
    std::cout << "registering for 'chromium' has no effect." << std::endl;
    std::cout << std::endl;

    if (isRunningAsAppImage())
    {
        printAppImageWarning();
    }
}

void registerManifest(int argc, char *argv[])
{
    if (argc > 2)
    {
        std::string subCommand(argv[2]);
        std::string homeDirectory = getHomeDirectory();
        bool force = argc > 3 && std::string(argv[3]).compare("--force") == 0;
        bool operationSucceeded = false;

        if (subCommand.compare("all") == 0)
        {
            operationSucceeded = registerManifestForAllBrowsers(homeDirectory, force);
        }
        else if (subCommand.compare("chromium") == 0)
        {
            operationSucceeded = registerManifestForSingleBrowser("Chromium", EXECUTABLE_CHROMIUM, homeDirectory + MANIFEST_PATH_CHROMIUM, force);
        }
        else if (subCommand.compare("chromium-snap") == 0)
        {
            operationSucceeded = registerManifestForSingleBrowser("Chromium (Snap)", EXECUTABLE_CHROMIUM_SNAP, homeDirectory + MANIFEST_PATH_CHROMIUM_SNAP, force);
        }
        else if (subCommand.compare("chrome") == 0)
        {
            operationSucceeded = registerManifestForSingleBrowser("Google Chrome", EXECUTABLE_CHROME, homeDirectory + MANIFEST_PATH_CHROME, force);
        }
        else if (subCommand.compare("firefox") == 0)
        {
            operationSucceeded = registerManifestForSingleBrowser("Firefox", EXECUTABLE_FIREFOX, homeDirectory + MANIFEST_PATH_FIREFOX, force, true);
        }
        else
        {
            std::cout << argv[0] << ": '" << subCommand << "' is not a command." << std::endl;
            printRegisterUsage(argv[0]);
            return;
        }

        std::cout << std::endl;
        if (operationSucceeded)
        {
            std::cout << "To undo this operation, run '" + std::string(argv[0]) + " unregister " + subCommand + "'." << std::endl;
            std::cout << "If you rename this executable or move it to another location, you need to register TabFloater Companion again." << std::endl;
            std::cout << std::endl;
        }
    }
    else
    {
        printRegisterUsage(argv[0]);
    }
}

void unregisterManifestFromSingleBrowser(std::string browserName, std::string manifestPath)
{
    if (doesManifestExist(manifestPath))
    {
        if (remove(manifestPath.c_str()) == 0)
        {
            std::cout << "Unregistered TabFloater Companion from " << browserName << "." << std::endl;
        }
        else
        {
            std::cerr << "Failed to unregister TabFloater Companion from " << browserName << ": unable to delete '" << manifestPath << "'" << std::endl;
        }
    }
    else
    {
        std::cout << "TabFloater companion is not registered for " << browserName << ", no changes were made." << std::endl;
    }
}

void unregisterManifestFromAllBrowsers(std::string homeDirectory)
{
    unregisterManifestFromSingleBrowser("Chromium", homeDirectory + MANIFEST_PATH_CHROMIUM);
    unregisterManifestFromSingleBrowser("Chromium (Snap)", homeDirectory + MANIFEST_PATH_CHROMIUM_SNAP);
    unregisterManifestFromSingleBrowser("Google Chrome", homeDirectory + MANIFEST_PATH_CHROME);
    unregisterManifestFromSingleBrowser("Firefox", homeDirectory + MANIFEST_PATH_FIREFOX);
}

void printUnregisterUsage(std::string executableName)
{
    std::cout << std::endl;
    std::cout << "Usage: " << executableName << " unregister BROWSER" << std::endl;
    std::cout << std::endl;
    std::cout << "Unregister TabFloater Companion from browsers." << std::endl;
    std::cout << std::endl;
    std::cout << "Supported browsers: " << std::endl;
    printOption("all", "Unregister from all browsers");
    printOption("chromium", "Unregister from Chromium");
    printOption("chromium-snap", "Unregister from Chromium (Snap)");
    printOption("chrome", "Unregister from Google Chrome");
    printOption("firefox", "Unregister from Firefox");
    std::cout << std::endl;
}

void unregisterManifest(int argc, char *argv[])
{
    if (argc > 2)
    {
        std::string subCommand(argv[2]);
        std::string homeDirectory = getHomeDirectory();

        if (subCommand.compare("all") == 0)
        {
            unregisterManifestFromAllBrowsers(homeDirectory);
        }
        else if (subCommand.compare("chromium") == 0)
        {
            unregisterManifestFromSingleBrowser("Chromium", homeDirectory + MANIFEST_PATH_CHROMIUM);
        }
        else if (subCommand.compare("chromium-snap") == 0)
        {
            unregisterManifestFromSingleBrowser("Chromium (Snap)", homeDirectory + MANIFEST_PATH_CHROMIUM_SNAP);
        }
        else if (subCommand.compare("chrome") == 0)
        {
            unregisterManifestFromSingleBrowser("Google Chrome", homeDirectory + MANIFEST_PATH_CHROME);
        }
        else if (subCommand.compare("firefox") == 0)
        {
            unregisterManifestFromSingleBrowser("Firefox", homeDirectory + MANIFEST_PATH_FIREFOX);
        }
        else
        {
            std::cout << argv[0] << ": '" << subCommand << "' is not a command." << std::endl;
            printUnregisterUsage(argv[0]);
            return;
        }
        std::cout << std::endl;
    }
    else
    {
        printUnregisterUsage(argv[0]);
    }
}

void printVersion(std::string version)
{
    std::cout << "TabFloater Companion version " << version << std::endl;
    std::cout << std::endl;
    std::cout << "Homepage: https://tabfloater.io/" << std::endl;
    std::cout << "Bug reports: https://github.com/tabfloater/tabfloater/" << std::endl;
    std::cout << std::endl;
    std::cout << "Copyright (C) 2020 Balazs Gyurak" << std::endl;
    std::cout << "Apache License 2.0" << std::endl;
    std::cout << std::endl;
}

void printMainUsage(std::string executableName)
{
    std::cout << std::endl;
    std::cout << "Usage: " << executableName << " COMMAND" << std::endl;
    std::cout << std::endl;
    std::cout << "Companion application for the TabFloater browser extension. Learn more about TabFloater at https://tabfloater.io/" << std::endl;
    std::cout << "The command line use of this application is only intended to register the Companion for your preferred browsers." << std::endl;
    std::cout << "Once registered, the TabFloater browser extension will work with the Companion seamlessly." << std::endl;
    std::cout << std::endl;
    std::cout << "Commands: " << std::endl;
    printOption("register", "Register TabFloater Companion for your browsers");
    printOption("status", "Print registration status information for all supported browsers");
    printOption("unregister", "Unregister TabFloater Companion from your browsers");
    printOption("version", "Print version information");
    std::cout << std::endl;
    std::cout << "To start using TabFloater, run '" + executableName + " register' and choose your preferred browser." << std::endl;

    if (getAppImageEnvVarValue() == NULL)
    {
        std::cout << std::endl;
        std::cout << "To learn more, run 'man tabfloater-companion'." << std::endl;
    }

    std::cout << std::endl;
}

int startInteractiveMode(std::string version, int argc, char *argv[])
{
    try
    {
        if (argc > 1)
        {
            std::string command(argv[1]);

            if (command.compare("status") == 0)
            {
                printStatus();
            }
            else if (command.compare("register") == 0)
            {
                registerManifest(argc, argv);
            }
            else if (command.compare("unregister") == 0)
            {
                unregisterManifest(argc, argv);
            }
            else if (command.compare("version") == 0)
            {
                printVersion(version);
            }
            else if (command.compare("--help") == 0)
            {
                printMainUsage(argv[0]);
            }
            else
            {
                std::cout << argv[0] << ": '" << command << "' is not a command." << std::endl;
                printMainUsage(argv[0]);
            }
        }
        else
        {
            printMainUsage(argv[0]);
        }

        return EXIT_SUCCESS;
    }
    catch (std::exception &ex)
    {
        std::cerr << "An unexpected error occurred: " << ex.what() << std::endl;
        return EXIT_FAILURE;
    }
}
