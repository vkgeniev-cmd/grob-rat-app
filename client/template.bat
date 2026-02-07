@echo off
title GROB Remote Client
color 0A

echo ====================================
echo     GROB Remote Client v1.0
echo ====================================
echo.
echo Server: wss://glistening-mindfulness.up.railway.app
echo Your UID: %1
echo.
echo Connecting to server...
echo.

:: Test connection to server
powershell -Command "try { $test = Test-NetConnection -ComputerName 'glistening-mindfulness.up.railway.app' -Port 443; Write-Host 'Connection test:' $test.TcpTestSucceeded } catch { Write-Host 'Connection failed' }"

echo.
echo Client is running...
echo Press CTRL+C to stop
echo.

:: Keep the window open
timeout /t 300 /nobreak > nul

echo.
echo Session ended. Press any key to exit...
pause > nul
