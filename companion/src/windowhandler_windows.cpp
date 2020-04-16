#include "windowhandler.h"
#include <fstream>

void setWindowAlwaysOnTopAndSkipTaskbar(std::string windowName) {
    std::ofstream out("c:\\work\\out.txt");
    out << windowName;
    out.close();
}