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

#include "interactive.h"
#include <iomanip>
#include <iostream>
#include <fstream>
#include <linux/limits.h>
#include <pwd.h>
#include <sys/stat.h>
#include <unistd.h>

#define MANIFEST_FILE_NAME "io.github.tabfloater.companion.json"

#define CHROMIUM 0
#define CHROMIUM_SNAP 1
#define GOOGLE_CHROME 2
#define FIREFOX 3
#define VIVALDI 4

const std::string BROWSER_NAMES[] = {
    "Chromium",
    "Chromium (Snap)",
    "Google Chrome",
    "Firefox",
    "Vivaldi"
};

const std::string MANIFEST_PATHS[] = {
    "/.config/chromium/NativeMessagingHosts/",
    "/snap/chromium/common/chromium/NativeMessagingHosts/",
    "/.config/google-chrome/NativeMessagingHosts/",
    "/.mozilla/native-messaging-hosts/",
    "/.config/vivaldi/NativeMessagingHosts/"
};

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
    return getAppImageEnvVarValue() != nullptr;
}

std::string getHomeDirectory()
{
    const char *homeDir;

    if ((homeDir = getenv("HOME")) == nullptr)
    {
        homeDir = getpwuid(getuid())->pw_dir;
    }

    return std::string(homeDir);
}

std::string getCurrentExecutablePath()
{
    const char *appImagePath;
    if ((appImagePath = getAppImageEnvVarValue()) != nullptr)
    {
        return std::string(appImagePath);
    }

    char path[PATH_MAX + 1] = {0};
    readlink("/proc/self/exe", path, sizeof(path));
    return std::string(path);
}

bool isCurrentExecutableInHomeDirectory()
{
    std::string currentExecutablePath = getCurrentExecutablePath();
    std::string homeDirectoryPath = getHomeDirectory();

    return currentExecutablePath.rfind(homeDirectoryPath, 0) == 0;
}

bool directoryExists(std::string path)
{
    struct stat info;
    return stat(path.c_str(), &info) == 0 && info.st_mode & S_IFDIR != 0;
}

bool createDirectory(std::string path)
{
    return system(("mkdir -p " + path + " > /dev/null 2>&1").c_str()) == 0;
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

std::string executeCommandAndGetStdOut(std::string command)
{
    char buffer[128];
    std::string result = "";
    FILE *pipe = popen((command + " 2> /dev/null").c_str(), "r");
    if (!pipe)
    {
        throw std::runtime_error("Unable to open process");
    }
    try
    {
        while (fgets(buffer, sizeof buffer, pipe) != nullptr)
        {
            result += buffer;
        }
    }
    catch (...)
    {
        pclose(pipe);
        throw;
    }
    pclose(pipe);
    return result;
}

bool isSnapPath(std::string path)
{
    return path.find("snap") != std::string::npos;
}

bool isBrowserInstalled(int browserId)
{
    try
    {
        switch (browserId)
        {
        case CHROMIUM:
        {
            if (!executeCommandAndGetStdOut("which chromium-browser").empty())
            {
                return true;
            }

            std::string stdOut = executeCommandAndGetStdOut("which chromium");
            return !stdOut.empty() && !isSnapPath(stdOut);
        }
        case CHROMIUM_SNAP:
        {
            std::string stdOut = executeCommandAndGetStdOut("which chromium");
            return !stdOut.empty() && isSnapPath(stdOut);
        }
        case GOOGLE_CHROME:
        {
            return !executeCommandAndGetStdOut("which google-chrome").empty();
        }
        case FIREFOX:
        {
            return !executeCommandAndGetStdOut("which firefox").empty();
        }
        case VIVALDI:
        {
            return !executeCommandAndGetStdOut("which vivaldi").empty();
        }
        default:
        {
            throw std::runtime_error("Unknown browser ID: " + browserId);
        }
        }
    }
    catch (...)
    {
        std::cerr << "An error occurred while checking if " + BROWSER_NAMES[browserId] + " is installed, will assume it is not." << std::endl;
        return false;
    }
}

std::string buildChromeManifest(std::string executablePath)
{
    return std::string(R"({
  "name": "io.github.tabfloater.companion",
  "description": "Tabfloater Companion",
  "path": ")" + executablePath + R"(",
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
  "path": ")" + executablePath + R"(",
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

std::string getManifestStatus(int browserId, std::string homeDirectory, std::string expectedManifestContent)
{
    std::string manifestPath = homeDirectory + MANIFEST_PATHS[browserId] + MANIFEST_FILE_NAME;
    bool browserInstalled = isBrowserInstalled(browserId);
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

void printChromiumSnapWarning()
{
    if (isRunningAsAppImage())
    {
        std::cout << std::endl;
        std::cout << "Warning: you are running TabFloater Companion as AppImage. This will not work with Snap browsers." << std::endl;
        std::cout << "To learn more about alternatives, visit https://www.tabfloater.io/documentation#browsers-installed-via-snap" << std::endl;
        std::cout << std::endl;
    }
    else if (!isCurrentExecutableInHomeDirectory())
    {
        std::cout << std::endl;
        std::cout << "Warning: this executable is not in your home directory. Snap browsers will not be able to communicate with it." << std::endl;
        std::cout << "In order to use TabFloater Companion with Snap browsers, copy this executable to your home directory," << std::endl;
        std::cout << "run it from there and register the desired Snap browsers. Learn more by running 'man tabfloater-companion'." << std::endl;
        std::cout << std::endl;
    }
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
    printStatusRow(BROWSER_NAMES[CHROMIUM], getManifestStatus(CHROMIUM, homeDirectory, chromeManifest));
    printStatusRow(BROWSER_NAMES[CHROMIUM_SNAP], getManifestStatus(CHROMIUM_SNAP, homeDirectory, chromeManifest));
    printStatusRow(BROWSER_NAMES[GOOGLE_CHROME], getManifestStatus(GOOGLE_CHROME, homeDirectory, chromeManifest));
    printStatusRow(BROWSER_NAMES[FIREFOX], getManifestStatus(FIREFOX, homeDirectory, firefoxManifest));
    printStatusRow(BROWSER_NAMES[VIVALDI], getManifestStatus(VIVALDI, homeDirectory, chromeManifest));
    std::cout << std::endl;
    std::cout << "Note: on Ubuntu 19.10 and up, Chromium is only available via Snap. On these systems, 'Chromium'" << std::endl;
    std::cout << "is reported to be installed, but it is actually identical to the Snap version." << std::endl;
    std::cout << std::endl;

    printChromiumSnapWarning();
}

bool registerManifestForSingleBrowser(int browserId, bool force, bool useFirefoxManifest = false)
{
    std::string browserName = BROWSER_NAMES[browserId];
    if (!force && !isBrowserInstalled(browserId))
    {
        std::cout << browserName + " not found, no changes were made." << std::endl;
        return false;
    }

    std::string executablePath = getCurrentExecutablePath();
    std::string manifest = useFirefoxManifest ? buildFirefoxManifest(executablePath) : buildChromeManifest(executablePath);
    std::string manifestDirectory = getHomeDirectory() + MANIFEST_PATHS[browserId];
    std::string manifestFullPath = manifestDirectory + MANIFEST_FILE_NAME;

    if (!force && doesManifestExist(manifestFullPath) && isManifestCorrect(manifestFullPath, manifest))
    {
        std::cout << "TabFloater Companion for " + browserName + " is already registered, no changes were made." << std::endl;
        return false;
    }

    if (!directoryExists(manifestDirectory))
    {
        if (!createDirectory(manifestDirectory))
        {
            std::cerr << "Failed to register TabFloater Companion for " << browserName << ": unable to create directory '" << manifestDirectory << "'" << std::endl;
            return false;
        }
    }

    if (!writeStringToFile(manifestFullPath, manifest))
    {
        std::cerr << "Failed to register TabFloater Companion for " << browserName << ": unable to write to '" << manifestFullPath << "'" << std::endl;
        return false;
    }

    std::cout << "Registered TabFloater Companion for " << browserName << "." << std::endl;

    if (browserId == CHROMIUM_SNAP)
    {
        printChromiumSnapWarning();
    }

    return true;
}

bool registerManifestForAllBrowsers(bool force)
{
    bool registeredChromium = false;
    bool registeredChromiumSnap = false;
    bool registeredChrome = false;
    bool registeredFirefox = false;
    bool registeredVivaldi = false;
    bool atLeastOneOperationOccurred = false;

    if (force || isBrowserInstalled(CHROMIUM))
    {
        registeredChromium = registerManifestForSingleBrowser(CHROMIUM, force);
        atLeastOneOperationOccurred = true;
    }
    if (force || isBrowserInstalled(CHROMIUM_SNAP))
    {
        registeredChromiumSnap = registerManifestForSingleBrowser(CHROMIUM_SNAP, force);
        atLeastOneOperationOccurred = true;
    }
    if (force || isBrowserInstalled(GOOGLE_CHROME))
    {
        registeredChrome = registerManifestForSingleBrowser(GOOGLE_CHROME, force);
        atLeastOneOperationOccurred = true;
    }
    if (force || isBrowserInstalled(FIREFOX))
    {
        registeredFirefox = registerManifestForSingleBrowser(FIREFOX, force, true);
        atLeastOneOperationOccurred = true;
    }
    if (force || isBrowserInstalled(VIVALDI))
    {
        registeredVivaldi = registerManifestForSingleBrowser(VIVALDI, force);
        atLeastOneOperationOccurred = true;
    }

    if (!atLeastOneOperationOccurred)
    {
        std::cout << "No installed browsers found." << std::endl;
    }

    return registeredChromium || registeredChromiumSnap || registeredChrome || registeredFirefox || registeredVivaldi;
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
    printOption("chromium", "Register for " + BROWSER_NAMES[CHROMIUM]);
    printOption("chromium-snap", "Register for " + BROWSER_NAMES[CHROMIUM_SNAP]);
    printOption("chrome", "Register for " + BROWSER_NAMES[GOOGLE_CHROME]);
    printOption("firefox", "Register for " + BROWSER_NAMES[FIREFOX]);
    printOption("vivaldi", "Register for " + BROWSER_NAMES[VIVALDI]);
    std::cout << std::endl;
    std::cout << "Options: " << std::endl;
    printOption("--force", "Register even if browser is not installed; overwrite existing file");
    std::cout << std::endl;
    std::cout << "Note: on Ubuntu 19.10 and up, Chromium is available only via Snap. On these systems," << std::endl;
    std::cout << "registering for 'chromium' has no effect." << std::endl;
    std::cout << std::endl;

    printChromiumSnapWarning();
}

void registerManifest(int argc, char *argv[])
{
    if (argc > 2)
    {
        std::string subCommand(argv[2]);
        bool force = argc > 3 && std::string(argv[3]).compare("--force") == 0;
        bool operationSucceeded = false;

        if (subCommand.compare("all") == 0)
        {
            operationSucceeded = registerManifestForAllBrowsers(force);
        }
        else if (subCommand.compare("chromium") == 0)
        {
            operationSucceeded = registerManifestForSingleBrowser(CHROMIUM, force);
        }
        else if (subCommand.compare("chromium-snap") == 0)
        {
            operationSucceeded = registerManifestForSingleBrowser(CHROMIUM_SNAP, force);
        }
        else if (subCommand.compare("chrome") == 0)
        {
            operationSucceeded = registerManifestForSingleBrowser(GOOGLE_CHROME, force);
        }
        else if (subCommand.compare("firefox") == 0)
        {
            operationSucceeded = registerManifestForSingleBrowser(FIREFOX, force, true);
        }
        else if (subCommand.compare("vivaldi") == 0)
        {
            operationSucceeded = registerManifestForSingleBrowser(VIVALDI, force);
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

void unregisterManifestFromSingleBrowser(int browserId)
{
    std::string browserName = BROWSER_NAMES[browserId];
    std::string manifestPath = getHomeDirectory() + MANIFEST_PATHS[browserId] + MANIFEST_FILE_NAME;
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

void printUnregisterUsage(std::string executableName)
{
    std::cout << std::endl;
    std::cout << "Usage: " << executableName << " unregister BROWSER" << std::endl;
    std::cout << std::endl;
    std::cout << "Unregister TabFloater Companion from browsers." << std::endl;
    std::cout << std::endl;
    std::cout << "Supported browsers: " << std::endl;
    printOption("all", "Unregister from all browsers");
    printOption("chromium", "Unregister from " + BROWSER_NAMES[CHROMIUM]);
    printOption("chromium-snap", "Unregister from " + BROWSER_NAMES[CHROMIUM_SNAP]);
    printOption("chrome", "Unregister from " + BROWSER_NAMES[GOOGLE_CHROME]);
    printOption("firefox", "Unregister from " + BROWSER_NAMES[FIREFOX]);
    printOption("vivaldi", "Unregister from " + BROWSER_NAMES[VIVALDI]);
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
            unregisterManifestFromSingleBrowser(CHROMIUM);
            unregisterManifestFromSingleBrowser(CHROMIUM_SNAP);
            unregisterManifestFromSingleBrowser(GOOGLE_CHROME);
            unregisterManifestFromSingleBrowser(FIREFOX);
            unregisterManifestFromSingleBrowser(VIVALDI);
        }
        else if (subCommand.compare("chromium") == 0)
        {
            unregisterManifestFromSingleBrowser(CHROMIUM);
        }
        else if (subCommand.compare("chromium-snap") == 0)
        {
            unregisterManifestFromSingleBrowser(CHROMIUM_SNAP);
        }
        else if (subCommand.compare("chrome") == 0)
        {
            unregisterManifestFromSingleBrowser(GOOGLE_CHROME);
        }
        else if (subCommand.compare("firefox") == 0)
        {
            unregisterManifestFromSingleBrowser(FIREFOX);
        }
        else if (subCommand.compare("vivaldi") == 0)
        {
            unregisterManifestFromSingleBrowser(VIVALDI);
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

void printVersion(std::string version, std::string gitCommitHash)
{
    std::cout << "TabFloater Companion version " << version << std::endl;
    std::cout << "Git commit hash: " << gitCommitHash << std::endl;
    std::cout << std::endl;
    std::cout << "Homepage: https://www.tabfloater.io/" << std::endl;
    std::cout << "Bug reports: https://github.com/tabfloater/tabfloater/" << std::endl;
    std::cout << std::endl;
    std::cout << "Copyright (C) 2021 TabFloater" << std::endl;
    std::cout << "Apache License 2.0" << std::endl;
    std::cout << std::endl;
}

void printMainUsage(std::string executableName)
{
    std::cout << std::endl;
    std::cout << "Usage: " << executableName << " COMMAND" << std::endl;
    std::cout << std::endl;
    std::cout << "Companion application for the TabFloater browser extension. Learn more about TabFloater at https://www.tabfloater.io/" << std::endl;
    std::cout << "The command line use of this application is only intended to register the Companion for your preferred browsers." << std::endl;
    std::cout << "Once registered, the TabFloater browser extension will work with the Companion seamlessly." << std::endl;
    std::cout << std::endl;
    std::cout << "Commands: " << std::endl;
    printOption("status", "Print registration status information for all supported browsers");
    printOption("register", "Register TabFloater Companion for your browsers");
    printOption("unregister", "Unregister TabFloater Companion from your browsers");
    printOption("version", "Print version information");
    std::cout << std::endl;
    std::cout << "To start using TabFloater, run '" + executableName + " register' and choose your preferred browser." << std::endl;

    if (!isRunningAsAppImage())
    {
        std::cout << std::endl;
        std::cout << "To learn more, run 'man tabfloater-companion'." << std::endl;
    }

    std::cout << std::endl;
}

int startInteractiveMode(std::string version, std::string gitCommitHash, int argc, char *argv[])
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
                printVersion(version, gitCommitHash);
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
