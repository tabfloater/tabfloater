cmake_minimum_required(VERSION 3.13.4)

project(Tabfloater_companion)

set (CMAKE_CXX_STANDARD 11)

# Enable pthread
set(THREADS_PREFER_PTHREAD_FLAG ON)
find_package(Threads REQUIRED)

include_directories( ./libs/loguru ./src )
add_executable(tabfloater_companion ./libs/loguru/loguru.cpp ./src/windowhandler_linux.cpp ./src/tabfloater_companion.cpp)

# Use -lX11
target_link_libraries(tabfloater_companion X11)

# Use -pthread and -ldl for loguru
target_link_libraries(tabfloater_companion Threads::Threads)
target_link_libraries(tabfloater_companion dl)
