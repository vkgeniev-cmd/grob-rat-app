import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const userUid = formData.get("userUid") as string
    const fileName = formData.get("fileName") as string || "grob-client"

    if (!userUid) {
      return NextResponse.json({ error: "UID required" }, { status: 400 })
    }

    // Create batch file that ACTUALLY connects to server
    const batchContent = `@echo off
title GROB Client
color 0A
echo ====================================
echo     GROB Remote Client
echo ====================================
echo.
echo Computer: %COMPUTERNAME%
echo User: %USERNAME%
echo UID: ${userUid}
echo.
echo [INFO] Connecting to server...
powershell.exe -Command "try { $response = Invoke-RestMethod -Uri 'https://glistening-mindfulness.up.railway.app/api/connect' -Method POST -Body '{uid: ''${userUid}'', computer_name: ''%COMPUTERNAME%'', username: ''%USERNAME%'', status: ''online''}' -ContentType 'application/json' -TimeoutSec 10; Write-Host '[SUCCESS] Connected to server!' } catch { Write-Host '[ERROR] Connection failed' }"
echo.
echo [SUCCESS] Client is running!
echo User should appear in admin panel now.
echo.
echo Press any key to exit...
pause > nul`

    return new NextResponse(batchContent, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": `attachment; filename="${fileName}.bat"`,
      },
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: "Build failed", details: error.message },
      { status: 500 }
    )
  }
}
