#include "../libs/loguru/loguru.hpp"

int main(int argc, char* argv[]) 
{
    loguru::init(argc, argv);
    loguru::add_file("everything.log", loguru::Append, loguru::Verbosity_MAX);
    LOG_F(INFO, "I'm hungry for some %.3f!", 3.14159);

    return 0;
}
