# Copyright 2020 Balazs Gyurak
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

cmake_minimum_required(VERSION 3.15.7)

if(WIN32)
    set(CMAKE_C_COMPILER gcc)
    set(CMAKE_CXX_COMPILER g++)
    add_definitions(-DUNICODE -D_UNICODE)
endif()

# Variables
set(MAIN_TARGET "tabfloater-companion" CACHE STRING "Main executable name")
set(VERSION "0.8.9" CACHE STRING "Application version")
set(GIT_COMMIT_HASH "" CACHE STRING "Git commit hash the application is being built from")
set(DEV_BUILD false CACHE BOOL "If true, the application is built for development")

if (NOT GIT_COMMIT_HASH)
    # Git commit hash was not passed as a parameter
    execute_process(
         COMMAND git rev-parse HEAD
         COMMAND tr -d '\n'
         RESULTS_VARIABLE GIT_COMMAND_RESULTS
         OUTPUT_VARIABLE GIT_COMMIT_HASH)

    if(NOT GIT_COMMAND_RESULTS MATCHES "0;0")
        # We are not in a git repository, try and read the .gitrev file

        if(EXISTS ${CMAKE_SOURCE_DIR}/.gitrev)
            file(READ ${CMAKE_SOURCE_DIR}/.gitrev GIT_COMMIT_HASH)
        else()
            set(GIT_COMMIT_HASH "unknown")
        endif()
    endif()
endif()

project(tabfloater-companion VERSION ${VERSION} DESCRIPTION "Companion application for the TabFloater browser extension")

set(CMAKE_CXX_STANDARD 11)
set(SOURCE_LIST)

message("GIT_COMMIT_HASH: ${GIT_COMMIT_HASH}")
message("DEV_BUILD: ${DEV_BUILD}")

if(UNIX)
    list(APPEND SOURCE_LIST "${CMAKE_CURRENT_SOURCE_DIR}/src/logutil_linux.cpp")
    list(APPEND SOURCE_LIST "${CMAKE_CURRENT_SOURCE_DIR}/src/interactive_linux.cpp")
    list(APPEND SOURCE_LIST "${CMAKE_CURRENT_SOURCE_DIR}/src/windowhandler_linux.cpp")
endif()

if(WIN32)
    list(APPEND SOURCE_LIST "${CMAKE_CURRENT_SOURCE_DIR}/src/logutil_windows.cpp")
    list(APPEND SOURCE_LIST "${CMAKE_CURRENT_SOURCE_DIR}/src/windowhandler_windows.cpp")
endif()

list(APPEND SOURCE_LIST "${CMAKE_CURRENT_SOURCE_DIR}/src/tabfloater_companion.cpp")

# Includes
add_subdirectory(${CMAKE_CURRENT_SOURCE_DIR}/libs/loguru)
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/src)

# Targets
add_executable(${MAIN_TARGET} ${SOURCE_LIST})
target_compile_definitions(${MAIN_TARGET} PRIVATE VERSION=\"${PROJECT_VERSION}\" PRIVATE GIT_COMMIT_HASH=\"${GIT_COMMIT_HASH}\" PRIVATE DEV_BUILD=${DEV_BUILD})

# Libraries
if(WIN32)
    set(CMAKE_EXE_LINKER_FLAGS " -static")
endif()

target_link_libraries(${MAIN_TARGET} loguru)

if(UNIX)
    target_link_libraries(${MAIN_TARGET} X11)
endif()

if(DEV_BUILD)
    # Configure native messaging host manifests for development
    set(COMPANION_EXECUTABLE "${PROJECT_BINARY_DIR}/${MAIN_TARGET}${CMAKE_EXECUTABLE_SUFFIX}")
    configure_file("${CMAKE_CURRENT_SOURCE_DIR}/manifests/manifest_chrome.json" "${PROJECT_BINARY_DIR}/manifest_chrome_dev.json")
    configure_file("${CMAKE_CURRENT_SOURCE_DIR}/manifests/manifest_firefox.json" "${PROJECT_BINARY_DIR}/manifest_firefox_dev.json")

    # Custom target to install/clean manifests for development
    if(WIN32)
        add_custom_target(install_manifests
            WORKING_DIRECTORY ${PROJECT_BINARY_DIR}
            COMMAND REG ADD HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\io.github.tabfloater.companion /f /ve /d "${PROJECT_BINARY_DIR}/manifest_chrome_dev.json"
            COMMAND REG ADD HKCU\\Software\\Mozilla\\NativeMessagingHosts\\io.github.tabfloater.companion /f /ve /d "${PROJECT_BINARY_DIR}/manifest_firefox_dev.json"
            COMMENT "Install native messaging host manifests..."
        )
        add_custom_target(clean_manifests
            WORKING_DIRECTORY ${PROJECT_BINARY_DIR}
            COMMAND REG DELETE HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\io.github.tabfloater.companion /f
            COMMAND REG DELETE HKCU\\Software\\Mozilla\\NativeMessagingHosts\\io.github.tabfloater.companion /f
            COMMENT "Cleaning native messaging host manifests..."
        )
    endif()

    if(UNIX)
        add_custom_target(install_manifests
            WORKING_DIRECTORY ${PROJECT_BINARY_DIR}
            COMMAND trap 'test -d $ENV{HOME}/.config/chromium/NativeMessagingHosts && cp ${PROJECT_BINARY_DIR}/manifest_chrome_dev.json $ENV{HOME}/.config/chromium/NativeMessagingHosts/io.github.tabfloater.companion.json' EXIT
            COMMAND trap 'test -d $ENV{HOME}/snap/chromium/common/chromium/NativeMessagingHosts && cp ${PROJECT_BINARY_DIR}/manifest_chrome_dev.json $ENV{HOME}/snap/chromium/common/chromium/NativeMessagingHosts/io.github.tabfloater.companion.json' EXIT
            COMMAND trap 'test -d $ENV{HOME}/.mozilla/native-messaging-hosts && cp ${PROJECT_BINARY_DIR}/manifest_firefox_dev.json $ENV{HOME}/.mozilla/native-messaging-hosts/io.github.tabfloater.companion.json' EXIT
            COMMENT "Install native messaging host manifests..."
        )
        add_custom_target(clean_manifests
            WORKING_DIRECTORY ${PROJECT_BINARY_DIR}
            COMMAND trap 'test -f $ENV{HOME}/.config/chromium/NativeMessagingHosts/io.github.tabfloater.companion.json && rm $ENV{HOME}/.config/chromium/NativeMessagingHosts/io.github.tabfloater.companion.json' EXIT
            COMMAND trap 'test -f $ENV{HOME}/snap/chromium/common/chromium/NativeMessagingHosts/io.github.tabfloater.companion.json && rm $ENV{HOME}/snap/chromium/common/chromium/NativeMessagingHosts/io.github.tabfloater.companion.json' EXIT
            COMMAND trap 'test -f $ENV{HOME}/.mozilla/native-messaging-hosts/io.github.tabfloater.companion.json && rm $ENV{HOME}/.mozilla/native-messaging-hosts/io.github.tabfloater.companion.json' EXIT
            COMMENT "Cleaning native messaging host manifests..."
        )
    endif()

else()

    # Packaging
    set(CPACK_PACKAGE_VENDOR "TabFloater")

    if(WIN32)
        # Windows installer

        set(CPACK_PROJECT_CONFIG_FILE "${CMAKE_CURRENT_SOURCE_DIR}/CPackOptions_win.txt")

        set(CPACK_PACKAGE_NAME "TabFloater Companion")
        set(CPACK_PACKAGE_DESCRIPTION "TabFloater Companion Installer")

        # Configure native messaging host manifests for Windows. The executable can be a relative path.
        set(COMPANION_EXECUTABLE "./bin/${MAIN_TARGET}${CMAKE_EXECUTABLE_SUFFIX}")
        configure_file("${CMAKE_CURRENT_SOURCE_DIR}/manifests/manifest_chrome.json" "${PROJECT_BINARY_DIR}")
        configure_file("${CMAKE_CURRENT_SOURCE_DIR}/manifests/manifest_firefox.json" "${PROJECT_BINARY_DIR}")

        set(WINDOWS_PACKAGE_RESOURCES_DIR "${CMAKE_CURRENT_SOURCE_DIR}/packaging/windows")

        # Configure license text and README.txt to replace the version number
        configure_file("${WINDOWS_PACKAGE_RESOURCES_DIR}/portable/README.txt" "${PROJECT_BINARY_DIR}")
        configure_file("${WINDOWS_PACKAGE_RESOURCES_DIR}/installer/license.rtf" "${PROJECT_BINARY_DIR}")

        set(CPACK_GENERATOR WIX ZIP)

        # Wix properties
        set(CPACK_WIX_PRODUCT_GUID "BCF1D253-9DDA-4531-9831-4069633335D6")
        set(CPACK_WIX_UPGRADE_GUID "E6DE015D-5A6B-481D-A32C-AFCF5ED4F8C0")
        set(CPACK_WIX_PATCH_FILE "${WINDOWS_PACKAGE_RESOURCES_DIR}/installer/registry_patch.xml")
        set(CPACK_RESOURCE_FILE_LICENSE "${PROJECT_BINARY_DIR}/license.rtf")
        set(CPACK_WIX_PRODUCT_ICON "${WINDOWS_PACKAGE_RESOURCES_DIR}/installer/tabfloater.ico")
        set(CPACK_WIX_UI_BANNER "${WINDOWS_PACKAGE_RESOURCES_DIR}/installer/banner.bmp")
        set(CPACK_WIX_UI_DIALOG "${WINDOWS_PACKAGE_RESOURCES_DIR}/installer/dialog.bmp")

        # Set WixUI explicitly to InstallDir, so the component chooser screen is not shown
        set(CPACK_WIX_UI_REF "WixUI_InstallDir")

        # The Wix installer should only contain core. The ZIP generator should include all components.
        set(CPACK_COMPONENTS_ALL core)
        set(CPACK_ARCHIVE_COMPONENT_INSTALL OFF)

        install(TARGETS ${MAIN_TARGET} COMPONENT core)
        install(FILES "${PROJECT_BINARY_DIR}/manifest_chrome.json" DESTINATION "." COMPONENT core)
        install(FILES "${PROJECT_BINARY_DIR}/manifest_firefox.json" DESTINATION "." COMPONENT core)

        install(FILES "${WINDOWS_PACKAGE_RESOURCES_DIR}/portable/register_manifests.bat" DESTINATION "." COMPONENT portable)
        install(FILES "${WINDOWS_PACKAGE_RESOURCES_DIR}/portable/unregister_manifests.bat" DESTINATION "." COMPONENT portable)
        install(FILES "${PROJECT_BINARY_DIR}/README.txt" DESTINATION "." COMPONENT portable)
    endif()

    if(UNIX)
        # Linux packaging

        include(GNUInstallDirs)
        set(LINUX_PACKAGE_RESOURCES_DIR "${CMAKE_CURRENT_SOURCE_DIR}/packaging/linux/install-resources")

        # Install target for DEB package
        install(TARGETS ${MAIN_TARGET})
        install(FILES "${LINUX_PACKAGE_RESOURCES_DIR}/bash_completion.sh"
                DESTINATION "${CMAKE_INSTALL_DATAROOTDIR}/bash-completion/completions"
                RENAME ${MAIN_TARGET})

        set(CPACK_SOURCE_GENERATOR "TGZ")
        set(CPACK_SOURCE_IGNORE_FILES
            build
            dist.*
            manifests
            packaging\/linux\/appimage
            packaging\/linux\/ubuntu-ppa
            packaging\/linux\/[^\/]*$
            packaging\/windows\/
        )
    endif()

    include(CPack)
endif()
