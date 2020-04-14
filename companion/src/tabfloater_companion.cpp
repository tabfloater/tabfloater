// compile with gcc wind.c -lX11

#include <iostream>
#include <string>

int main(int argc, char **argv)
{
    std::string oneLine = "";

    while (1){
        unsigned int length = 0;

        //read the first four bytes (=> Length)
        /*for (int i = 0; i < 4; i++)
        {
            int read_char = getchar();
            length += read_char * (int) pow(2.0, i*8);
            std::string s = std::to_string((long long)read_char) + "\n";
            fwrite(s.c_str(), sizeof(char), s.size(), f);
            fflush(f);
        }*/

        //Neat way!
        for (int i = 0; i < 4; i++)
        {
            unsigned int read_char = getchar();
            length = length | (read_char << i*8);
        }

        //read the json-message
        std::string msg = "";
        for (int i = 0; i < length; i++)
        {
            msg += getchar();
        }

        std::string message = "{\"status\":\"ok\"}";
        // Collect the length of the message
        unsigned int len = message.length();

        // Now we can output our message
        if (msg == "{\"action\":\"ping\"}"){
            message = "{\"status\":\"ok\"}";
            len = message.length();

            std::cout   << char(len>>0)
                        << char(len>>8)
                        << char(len>>16)
                        << char(len>>24);

            std::cout << message;
            break;
        }

        len = length;
        std::cout   << char(len>>0)
                    << char(len>>8)
                    << char(len>>16)
                    << char(len>>24);

        std::cout << msg << std::flush;
    }

    return 0;
}
