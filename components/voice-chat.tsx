// t.me/SentinelLinks

"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Mic, MicOff, Volume2, VolumeX, Radio, ChevronDown, ChevronUp } from "lucide-react"
import type { User } from "@/app/page"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface VoiceChatProps {
  selectedUser: User | null
}

interface Microphone {
  id: number
  name: string
  channels: number
  sampleRate: number
}

export function VoiceChat({ selectedUser }: VoiceChatProps) {
  const [isMicActive, setIsMicActive] = useState(false)
  const [isSpeakerActive, setIsSpeakerActive] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMinimized, setIsMinimized] = useState(true)
  const [microphones, setMicrophones] = useState<Microphone[]>([])
  const [selectedMic, setSelectedMic] = useState<number | null>(null)
  const [isLoadingMics, setIsLoadingMics] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null)

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
      const apiUrl = localStorage.getItem("grob-api-url") || "127.0.0.1"
      const apiPort = localStorage.getItem("grob-api-port") || "8001"

      const response = await fetch(`http://${apiUrl}:${apiPort}/api/audio/microphones`)
      const data = await response.json()

      if (data.success) {
        setMicrophones(data.microphones)
        if (data.microphones.length > 0) {
          setSelectedMic(data.microphones[0].id)
        }
      }
    } catch (error) {
      console.error("[v0] Ошибка загрузки микрофонов:", error)
    } finally {
      setIsLoadingMics(false)
    }
  }

  const toggleMic = async () => {
    if (!selectedUser || selectedMic === null) return

    const apiUrl = localStorage.getItem("grob-api-url") || "127.0.0.1"
    const apiPort = localStorage.getItem("grob-api-port") || "8001"

    if (!isMicActive) {
      if (audioContextRef.current) {
        await audioContextRef.current.close()
        audioContextRef.current = null
      }

      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current)
        audioIntervalRef.current = null
      }

      try {
        const response = await fetch(`http://${apiUrl}:${apiPort}/api/audio/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ microphoneId: selectedMic }),
        })

        const data = await response.json()

        if (data.success) {
          setIsMicActive(true)

          if (isSpeakerActive) {
            startAudioPlayback()
          }
        }
      } catch (error) {
        console.error("Ошибка начала прослушивания:", error)
      }
    } else {
      try {
        const response = await fetch(`http://${apiUrl}:${apiPort}/api/audio/stop`, {
          method: "POST",
        })

        const data = await response.json()

        if (data.success) {
          setIsMicActive(false)
          stopAudioPlayback()
          if (audioContextRef.current) {
            await audioContextRef.current.close()
            audioContextRef.current = null
          }
        }
      } catch (error) {
        console.error("Ошибка остановки прослушивания:", error)
      }
    }
  }

  const startAudioPlayback = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({ sampleRate: 44100 })
    }

    const apiUrl = localStorage.getItem("grob-api-url") || "127.0.0.1"
    const apiPort = localStorage.getItem("grob-api-port") || "8001"

    // Получаем аудио данные каждые 50мс
    audioIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`http://${apiUrl}:${apiPort}/api/audio/chunk`)
        const data = await response.json()

        if (data.success && data.audio) {
          // Декодируем base64
          const audioData = Uint8Array.from(atob(data.audio), (c) => c.charCodeAt(0))

          // Преобразуем в Float32Array для Web Audio API
          const float32 = new Float32Array(audioData.length / 2)
          const view = new DataView(audioData.buffer)
          for (let i = 0; i < float32.length; i++) {
            float32[i] = view.getInt16(i * 2, true) / 32768.0
          }

          // Создаем аудио буфер и воспроизводим
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
    } else {
      stopAudioPlayback()
    }
  }

  const toggleConnection = () => {
    setIsConnected(!isConnected)
  }

// t.me/SentinelLinks
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  useEffect(() => {
    return () => {
      stopAudioPlayback()
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
    }
  }, [])

// t.me/SentinelLinks
  useEffect(() => {
    if (!isConnected) {
      setIsMicActive(false)
      setIsSpeakerActive(false)
      stopAudioPlayback()
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
    }
  }, [isConnected])

  if (!selectedUser) return null

  if (isMinimized) {
    return (
      <Button
        onClick={toggleMinimize}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl bg-gradient-to-br from-primary to-accent hover:opacity-90 transition-all z-50"
        size="icon"
      >
        <Radio className="w-6 h-6 text-primary-foreground" />
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-6 right-6 bg-card shadow-2xl border-2 border-primary/30 w-80 transition-all duration-300 z-50">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Radio className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">Голосовой чат</h3>
            <p className="text-xs text-muted-foreground">{selectedUser.name}</p>
          </div>
          <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-muted"}`} />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleMinimize}>
            <ChevronDown className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleCollapse}>
            {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {!isCollapsed && (
          <div className="space-y-3">
            <Button
              onClick={toggleConnection}
              variant={isConnected ? "default" : "outline"}
              className="w-full"
              size="sm"
            >
              {isConnected ? "Отключить голосовой чат" : "Подключить голосовой чат"}
            </Button>

            {isConnected && (
              <>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Микрофон собеседника</label>
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
                          {mic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={toggleMic}
                    variant={isMicActive ? "default" : "outline"}
                    className="flex-1"
                    size="sm"
                    disabled={selectedMic === null}
                  >
                    {isMicActive ? <Mic className="w-4 h-4 mr-1" /> : <MicOff className="w-4 h-4 mr-1" />}
                    {isMicActive ? "Остановить" : "Прослушать"}
                  </Button>

                  <Button
                    onClick={toggleSpeaker}
                    variant={isSpeakerActive ? "default" : "outline"}
                    className="flex-1"
                    size="sm"
                    disabled={!isMicActive}
                  >
                    {isSpeakerActive ? <Volume2 className="w-4 h-4 mr-1" /> : <VolumeX className="w-4 h-4 mr-1" />}
                    {isSpeakerActive ? "Выкл. звук" : "Вкл. звук"}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {!isCollapsed && isConnected && isMicActive && (
          <div className="mt-3 p-2 bg-secondary/40 rounded text-xs text-muted-foreground text-center">
            {isMicActive && "Микрофон прослушивается"}
            {isSpeakerActive && " • Динамик активен"}
          </div>
        )}
      </div>
    </Card>
  )
}

//  ____             _   _            _
// / ___|  ___ _  | |_(_)_    ___| |   
// \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
//  ___) |  / | | | |_| | | | |  / |   
// |____/ \___|_| |_|\|_|_| |_|\___|_| 
// ********************************    
