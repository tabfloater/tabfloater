cmake_minimum_required(VERSION 3.13.4)

project(loguru)

# variables
set(CMAKE_CXX_STANDARD 11)
set(TARGET "loguru")
set(THREADS_PREFER_PTHREAD_FLAG ON)
find_package(Threads REQUIRED)

# targets
add_library(${TARGET} STATIC ./src/loguru.cpp)

# libraries
target_link_libraries(${TARGET} Threads::Threads)
target_link_libraries(${TARGET} dl)
