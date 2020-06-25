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
    list(APPEND SOURCE_LIST "./src/windowhandler_linux.cpp")
endif()

if(WIN32)
    list(APPEND SOURCE_LIST "./src/windowhandler_windows.cpp")
endif()

list(APPEND SOURCE_LIST "./src/tabfloater_companion.cpp")

# includes
add_subdirectory(./libs/loguru)
include_directories(./src)

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
