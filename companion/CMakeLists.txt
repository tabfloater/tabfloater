cmake_minimum_required(VERSION 3.13.4)

project(tabfloater_companion)

# variables
set(CMAKE_CXX_STANDARD 11)
set(TARGET "tabfloater_companion")
set(SOURCE_LIST)

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

# libraries
target_link_libraries(${TARGET} loguru)

if(UNIX)
    target_link_libraries(${TARGET} X11)    
endif()
