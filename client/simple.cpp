#include <windows.h>
#include <wininet.h>
#include <iostream>
#include <string>

#pragma comment(lib, "wininet.lib")

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    // Get computer information
    char computerName[256] = {0};
    DWORD size = sizeof(computerName);
    GetComputerNameA(computerName, &size);
    
    char username[256] = {0};
    DWORD usernameSize = sizeof(username);
    GetUserNameA(username, &usernameSize);
    
    // Create a simple message box to show it's working
    char message[512];
    sprintf(message, "GROB Client Connected!\n\nComputer: %s\nUser: %s\n\nThis client will now connect to the server.", computerName, username);
    
    MessageBoxA(NULL, message, "GROB Remote Client", MB_OK | MB_ICONINFORMATION);
    
    // Test internet connection
    HINTERNET hInternet = InternetOpenA("GROBClient", INTERNET_OPEN_TYPE_DIRECT, NULL, NULL, 0);
    if (hInternet) {
        HINTERNET hConnect = InternetConnectA(hInternet, "httpbin.org", INTERNET_DEFAULT_HTTP_PORT, NULL, NULL, INTERNET_SERVICE_HTTP, 0, 0);
        if (hConnect) {
            // Send a simple GET request to test connectivity
            HINTERNET hRequest = HttpOpenRequestA(hConnect, "GET", "/get", NULL, NULL, NULL, 0, 0);
            if (hRequest) {
                HttpSendRequestA(hRequest, NULL, 0, NULL, 0);
                
                // Read response
                char buffer[1024];
                DWORD bytesRead;
                if (InternetReadFile(hRequest, buffer, sizeof(buffer) - 1, &bytesRead)) {
                    buffer[bytesRead] = 0;
                    MessageBoxA(NULL, "Internet connection successful!", "Connection Test", MB_OK | MB_ICONINFORMATION);
                }
                
                InternetCloseHandle(hRequest);
            }
            InternetCloseHandle(hConnect);
        }
        InternetCloseHandle(hInternet);
    } else {
        MessageBoxA(NULL, "No internet connection available", "Error", MB_OK | MB_ICONERROR);
    }
    
    return 0;
}
