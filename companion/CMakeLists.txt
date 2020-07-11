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

cmake_minimum_required(VERSION 3.13.4)

if(WIN32)
    set(CMAKE_C_COMPILER gcc)
    set(CMAKE_CXX_COMPILER g++)
    add_definitions(-DUNICODE -D_UNICODE)
endif()

project(tabfloater_companion)

# variables
set(CMAKE_CXX_STANDARD 11)
set(TARGET "tabfloater_companion")
set(SOURCE_LIST)
set(VERSION "0.7.0")

if(UNIX)
    list(APPEND SOURCE_LIST "${CMAKE_CURRENT_SOURCE_DIR}/src/windowhandler_linux.cpp")
endif()

if(WIN32)
    list(APPEND SOURCE_LIST "${CMAKE_CURRENT_SOURCE_DIR}/src/windowhandler_windows.cpp")

endif()

list(APPEND SOURCE_LIST "${CMAKE_CURRENT_SOURCE_DIR}/src/tabfloater_companion.cpp")

# includes
add_subdirectory(${CMAKE_CURRENT_SOURCE_DIR}/libs/loguru)
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/src)

# targets
add_executable(${TARGET} ${SOURCE_LIST})
target_compile_definitions(${TARGET} PRIVATE VERSION=\"${VERSION}\")

# libraries
if(WIN32)
    set(CMAKE_EXE_LINKER_FLAGS " -static")
endif()

target_link_libraries(${TARGET} loguru)

if(UNIX)
    target_link_libraries(${TARGET} X11)
endif()

# Windows installer
if(WIN32)
    set(CPACK_GENERATOR WIX)
    set(WINDOWS_PACKAGE_RESOURCES_DIR "${CMAKE_CURRENT_SOURCE_DIR}/packaging/windows")

    set(CPACK_PACKAGE_NAME "TabFloater Companion")
    set(CPACK_PACKAGE_DESCRIPTION "TabFloater Companion Installer")
    set(CPACK_PACKAGE_VENDOR "Balazs Gyurak")
    set(CPACK_PACKAGE_VERSION ${VERSION})
    set(CPACK_WIX_PRODUCT_GUID "BCF1D253-9DDA-4531-9831-4069633335D6")
    set(CPACK_WIX_UPGRADE_GUID "E6DE015D-5A6B-481D-A32C-AFCF5ED4F8C0")

    set(CPACK_WIX_PATCH_FILE "${WINDOWS_PACKAGE_RESOURCES_DIR}/registry_patch.xml")
    set(CPACK_RESOURCE_FILE_LICENSE "${WINDOWS_PACKAGE_RESOURCES_DIR}/license.rtf")
    set(CPACK_WIX_PRODUCT_ICON "${WINDOWS_PACKAGE_RESOURCES_DIR}/tabfloater.ico")
    set(CPACK_WIX_UI_BANNER "${WINDOWS_PACKAGE_RESOURCES_DIR}/banner.bmp")
    set(CPACK_WIX_UI_DIALOG "${WINDOWS_PACKAGE_RESOURCES_DIR}/dialog.bmp")

    install(TARGETS ${TARGET})
    install(FILES "${CMAKE_CURRENT_SOURCE_DIR}/manifests/manifest_chrome.json" DESTINATION ".")
    install(FILES "${CMAKE_CURRENT_SOURCE_DIR}/manifests/manifest_firefox.json" DESTINATION ".")

    include(CPack)
endif()
