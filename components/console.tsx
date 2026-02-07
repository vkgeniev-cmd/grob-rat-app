// t.me/SentinelLinks

"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Terminal, Trash2, ChevronUp, ChevronDown } from "lucide-react"

type LogEntry = {
  id: number
  timestamp: string
  type: "info" | "success" | "warning" | "error"
  message: string
}

export function Console() {
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 1,
      timestamp: new Date().toLocaleTimeString(),
      type: "info",
      message: "GROB система инициализирована",
    },
    {
      id: 2,
      timestamp: new Date().toLocaleTimeString(),
      type: "success",
      message: "WebSocket сервер запущен на порту 8080",
    },
  ])
  const [isExpanded, setIsExpanded] = useState(true)
  const consoleRef = useRef<HTMLDivElement>(null)

  // Симуляция добавления логов
  useEffect(() => {
    const interval = setInterval(() => {
      const messages = [
        { type: "info" as const, message: "Проверка подключений..." },
        { type: "success" as const, message: "Клиент подключен: 192.168.1.105" },
        { type: "warning" as const, message: "Высокая загрузка CPU на устройстве PC-Office-01" },
        { type: "info" as const, message: "Отправка кадра экрана (1920x1080)" },
      ]
      const randomMessage = messages[Math.floor(Math.random() * messages.length)]

// t.me/SentinelLinks
      setLogs((prev) => [
        ...prev,
        {
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          type: randomMessage.type,
          message: randomMessage.message,
        },
      ])
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // Автоскролл вниз при новых логах
  useEffect(() => {
    if (consoleRef.current && isExpanded) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight
    }
  }, [logs, isExpanded])

// t.me/SentinelLinks
  const clearLogs = () => {
    setLogs([
      {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        type: "info",
        message: "Консоль очищена",
      },
    ])
  }

// t.me/SentinelLinks
  const getLogColor = (type: LogEntry["type"]) => {
    switch (type) {
      case "info":
        return "text-blue-400"
      case "success":
        return "text-green-400"
      case "warning":
        return "text-yellow-400"
      case "error":
        return "text-red-400"
    }
  }

  return (
    <Card className="fixed bottom-4 right-4 w-[500px] bg-card/95 backdrop-blur-lg border-primary/20 shadow-2xl overflow-hidden z-50">
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/20 to-accent/20 border-b border-border">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Консоль</span>
          <span className="text-xs text-muted-foreground">({logs.length} записей)</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={clearLogs} className="h-7 w-7 p-0">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="h-7 w-7 p-0">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div ref={consoleRef} className="p-3 h-[300px] overflow-y-auto font-mono text-xs space-y-1.5 bg-black/40">
          {logs.map((log) => (
            <div key={log.id} className="flex gap-2">
              <span className="text-muted-foreground shrink-0">[{log.timestamp}]</span>
              <span className={`shrink-0 font-semibold ${getLogColor(log.type)}`}>{log.type.toUpperCase()}:</span>
              <span className="text-foreground/80">{log.message}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

//  ____             _   _            _
// / ___|  ___ _  | |_(_)_    ___| |   
// \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
//  ___) |  / | | | |_| | | | |  / |   
// |____/ \___|_| |_|\|_|_| |_|\___|_| 
// ********************************    
