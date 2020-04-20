cmake_minimum_required(VERSION 3.13.4)

project(Tabfloater_companion)

set (CMAKE_CXX_STANDARD 11)

set(TARGET "tabfloater_companion")

# Enable pthread
set(THREADS_PREFER_PTHREAD_FLAG ON)
find_package(Threads REQUIRED)

include_directories( ./libs/loguru ./src )
add_executable(${TARGET} ./libs/loguru/loguru.cpp ./src/windowhandler_linux.cpp ./src/tabfloater_companion.cpp)

# Use -lX11
target_link_libraries(${TARGET} X11)

# Use -pthread and -ldl for loguru
target_link_libraries(${TARGET} Threads::Threads)
target_link_libraries(${TARGET} dl)
