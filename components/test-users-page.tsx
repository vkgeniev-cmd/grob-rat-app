"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus, Download, Users, Monitor, PlayCircle, PauseCircle, Zap } from "lucide-react"
import { toast } from "sonner"

export function TestUsersPage() {
  const [username, setUsername] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [testUsers, setTestUsers] = useState([
    { username: "test_user_001", uid: "test-001", status: "online", created_at: new Date().toISOString() },
    { username: "test_user_002", uid: "test-002", status: "online", created_at: new Date().toISOString() },
  ])

  const handleCreateInstantTestUser = async () => {
    try {
      const formData = new FormData()
      formData.append("action", "instant")
      formData.append("username", username || "")

      toast.info("Создание мгновенного тестового пользователя...", {
        description: "Пользователь появится в админке сразу",
      })

      const response = await fetch("/api/admin/test-users", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Ошибка создания тестового пользователя")
      }

      const result = await response.json()
      
      if (result.success) {
        toast.success("Тестовый пользователь создан!", {
          description: result.message,
        })

        // Add to list
        setTestUsers([...testUsers, result.test_user])
        setUsername("")
      } else {
        throw new Error(result.message || "Ошибка создания")
      }

    } catch (error) {
      console.error("Ошибка создания тестового пользователя:", error)
      toast.error("Ошибка создания", {
        description: error instanceof Error ? error.message : "Попробуйте снова",
      })
    }
  }

  const handleCreateTestUser = async () => {
    try {
      setIsCreating(true)
      
      const formData = new FormData()
      formData.append("action", "create")
      formData.append("username", username || "")

      toast.info("Создание тестового пользователя...", {
        description: "Генерация .bat файла для тестового клиента",
      })

      const response = await fetch("/api/admin/test-users", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Ошибка создания тестового пользователя")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `test_user_${username || "random"}.bat`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success("Тестовый пользователь создан!", {
        description: `.bat файл скачан успешно`,
      })

      // Add to list
      const newTestUser = {
        username: username || `test_user_${Date.now()}`,
        uid: `test-${Date.now()}`,
        status: "offline",
        created_at: new Date().toISOString(),
      }
      setTestUsers([...testUsers, newTestUser])
      setUsername("")

    } catch (error) {
      console.error("Ошибка создания тестового пользователя:", error)
      toast.error("Ошибка создания", {
        description: error instanceof Error ? error.message : "Попробуйте снова",
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="flex-1 bg-background p-6 overflow-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Тестовые пользователи</h1>
          <p className="text-lg text-muted-foreground">
            Создайте тестовых клиентов для проверки функциональности
          </p>
        </div>

        <Card className="p-4 bg-green-500/10 border-green-500/20">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-500">Мгновенное создание</p>
              <p className="text-xs text-muted-foreground mt-1">
                Нажмите "Мгновенный пользователь" и бот появится в админке СРАЗУ!
                Никаких файлов и запусков - чистая магия!
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-blue-500/10 border-blue-500/20">
          <div className="flex items-start gap-3">
            <Monitor className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-500">Тестовый режим</p>
              <p className="text-xs text-muted-foreground mt-1">
                Тестовые пользователи подключаются к серверу но не выполняют команды.
                Они только логируют полученные команды и отправляют heartbeat.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-base font-medium flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Имя тестового пользователя
              </Label>
              <Input
                id="username"
                placeholder="test_user_001"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                Оставьте пустым для автоматической генерации имени
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCreateInstantTestUser}
                disabled={isCreating}
                className="flex-1 h-12 text-base bg-green-600 hover:bg-green-700"
              >
                <Zap className="w-5 h-5 mr-2" />
                Мгновенный пользователь
              </Button>

              <Button
                onClick={handleCreateTestUser}
                disabled={isCreating}
                className="flex-1 h-12 text-base"
              >
                {isCreating ? (
                  <>
                    <PauseCircle className="w-5 h-5 mr-2 animate-spin" />
                    Создание...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Скачать .bat
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Активные тестовые пользователи</h2>
            </div>
            
            <div className="space-y-3">
              {testUsers.map((user, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserPlus className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{user.username}</p>
                      <p className="text-sm text-muted-foreground">UID: {user.uid}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      user.status === "online" ? "bg-green-500" : "bg-gray-400"
                    }`} />
                    <span className="text-sm text-muted-foreground">
                      {user.status === "online" ? "Онлайн" : "Офлайн"}
                    </span>
                  </div>
                </div>
              ))}
              
              {testUsers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Нет тестовых пользователей</p>
                  <p className="text-sm">Создайте первого тестового пользователя выше</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-amber-500/10 border-amber-500/20">
          <div className="flex items-start gap-3">
            <Download className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-500">Как использовать</p>
              <ol className="text-xs text-muted-foreground mt-1 space-y-1 list-decimal list-inside">
                <li>Создайте тестового пользователя</li>
                <li>Скачайте .bat файл</li>
                <li>Запустите на любом Windows PC</li>
                <li>Пользователь появится в админке как онлайн</li>
                <li>Команды будут логироваться но не выполняться</li>
              </ol>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
