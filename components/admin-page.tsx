// t.me/SentinelLinks

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  RefreshCw,
  Users,
  Key,
  Trash2,
  Ban,
  CheckCircle,
  Copy,
  Shuffle,
  Shield,
  Clock,
  UserCheck,
  FileText,
} from "lucide-react"
import { toast } from "sonner"
import { getUsers, getLicenseKeys, createLicenseKey, deleteLicenseKey, type User, type LicenseKey } from "@/lib/db"
import { NewsManager } from "@/components/news-manager"

interface AdminPageProps {
  currentUser?: User | null
}

// t.me/SentinelLinks
export function AdminPage({ currentUser }: AdminPageProps) {
  const [users, setUsers] = useState<User[]>([])
  const [licenseKeys, setLicenseKeys] = useState<LicenseKey[]>([])

  const [newKeyDuration, setNewKeyDuration] = useState<string>("30")
  const [newKeyForever, setNewKeyForever] = useState(false)
  const [newKeyMaxActivations, setNewKeyMaxActivations] = useState("1")
  const [generatedKey, setGeneratedKey] = useState("")

  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  useEffect(() => {
    refreshData()
  }, [])

  const refreshData = async () => {
    try {
      const [usersData, keysData] = await Promise.all([getUsers(), getLicenseKeys()])
      setUsers(usersData)
      setLicenseKeys(keysData)
    } catch (error) {
      toast.error("Ошибка загрузки данных")
    }
  }

  const handleCreateKey = async () => {
    const duration = newKeyForever ? "forever" : Number.parseInt(newKeyDuration)
    const maxActivations = Number.parseInt(newKeyMaxActivations) || 1

    if (!newKeyForever && (isNaN(duration as number) || (duration as number) <= 0)) {
      toast.error("Введите корректное количество дней")
      return
    }

    try {
      const newKey = await createLicenseKey(currentUser?.username || "admin", duration, maxActivations)
      setGeneratedKey(newKey.key)
      await refreshData()
      toast.success("Ключ создан")
    } catch (error) {
      toast.error("Ошибка создания ключа")
    }
  }

  const handleGenerateRandomKey = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = ""
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) result += "-"
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setGeneratedKey(result)
  }

  const handleDeleteKey = async (keyId: string) => {
    try {
      await deleteLicenseKey(keyId)
      await refreshData()
      toast.success("Ключ удален")
    } catch (error) {
      toast.error("Ошибка удаления ключа")
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch("/api/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      if (response.ok) {
        await refreshData()
        toast.success("Пользователь удален")
      } else {
        toast.error("Невозможно удалить этого пользователя")
      }
    } catch (error) {
      toast.error("Ошибка удаления пользователя")
    }
  }

  const handleToggleAdmin = async (userId: string, isAdmin: boolean) => {
    if (currentUser?.username !== "ORIXMAN") {
      toast.error("Только ORIXMAN может выдавать админ права")
      return
    }

    try {
      const response = await fetch("/api/users/toggle-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          isAdmin: !isAdmin,
          requesterId: currentUser?.id,
        }),
      })

      if (response.ok) {
        await refreshData()
        toast.success(isAdmin ? "Админ права сняты" : "Админ права выданы")
      } else {
        const data = await response.json()
        toast.error(data.error || "Ошибка изменения прав")
      }
    } catch (error) {
      toast.error("Ошибка изменения прав")
    }
  }

  const handleBlockUser = async (userId: string, blocked: boolean) => {
    try {
      const response = await fetch("/api/users/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, blocked }),
      })

      if (response.ok) {
        await refreshData()
        toast.success(blocked ? "Пользователь заблокирован" : "Пользователь разблокирован")
      } else {
        toast.error("Ошибка изменения статуса пользователя")
      }
    } catch (error) {
      toast.error("Ошибка изменения статуса")
    }
  }

  const handleRemoveSubscription = async (userId: string) => {
    try {
      const response = await fetch("/api/users/remove-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

// t.me/SentinelLinks
      if (response.ok) {
        await refreshData()
        toast.success("Подписка снята")
      } else {
        toast.error("Ошибка снятия подписки")
      }
    } catch (error) {
      toast.error("Ошибка снятия подписки")
    }
  }

  const copyToClipboard = async (text: string, id: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        // Fallback for environments without clipboard API
        const textArea = document.createElement("textarea")
        textArea.value = text
        textArea.style.position = "fixed"
        textArea.style.left = "-999999px"
        textArea.style.top = "-999999px"
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand("copy")
        textArea.remove()
      }
      setCopiedKey(id)
      setTimeout(() => setCopiedKey(null), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
      toast.error("Не удалось скопировать")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (!currentUser?.is_admin) {
    return (
      <div className="flex-1 bg-background p-6 flex items-center justify-center">
        <Card className="p-8 text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-bold mb-2">Доступ запрещен</h2>
          <p className="text-muted-foreground">У вас нет прав для доступа к админ-панели</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-background p-6 overflow-auto pb-16">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Админ панель
          </h2>
          <p className="text-muted-foreground">Управление пользователями и ключами</p>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              Пользователи
            </TabsTrigger>
            <TabsTrigger value="keys" className="gap-2">
              <Key className="w-4 h-4" />
              Ключи
            </TabsTrigger>
            <TabsTrigger value="news" className="gap-2">
              <FileText className="w-4 h-4" />
              Новости
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Управление пользователями</h3>
              <Button variant="outline" size="sm" onClick={refreshData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Обновить
              </Button>
            </div>

            <div className="grid gap-3">
              {users.map((user) => (
                <Card key={user.id} className={user.blocked ? "opacity-60" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${user.is_admin ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
                        >
                          {user.is_admin ? <Shield className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{user.username}</span>
                            {user.is_admin && (
                              <Badge variant="default" className="text-xs">
                                Админ
                              </Badge>
                            )}
                            {user.blocked && (
                              <Badge variant="destructive" className="text-xs">
                                Заблокирован
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Создан: {formatDate(user.created_at)}
                            {user.license_expiry && (
                              <span className="ml-2">
                                | Лицензия до:{" "}
                                {user.license_expiry === "forever" ? "Навсегда" : formatDate(user.license_expiry)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {currentUser?.is_admin && user.username !== "ORIXMAN" && (
                        <div className="flex items-center gap-2">
                          {currentUser?.username === "ORIXMAN" && user.username !== "ORIXMAN" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                              className={user.is_admin ? "text-orange-500" : "text-blue-500"}
                            >
                              <Shield className="w-4 h-4" />
                            </Button>
                          )}
                          {user.license_expiry && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveSubscription(user.id)}
                              className="text-orange-500"
                            >
                              <Clock className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBlockUser(user.id, !user.blocked)}
                            className={user.blocked ? "text-green-500" : "text-amber-500"}
                          >
                            {user.blocked ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteUser(user.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Keys Tab */}
          <TabsContent value="keys" className="space-y-4">
            <Card className="p-4">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-base">Создать новый ключ</CardTitle>
                <CardDescription>Сгенерируйте лицензионный ключ для пользователей</CardDescription>
              </CardHeader>
              <CardContent className="p-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Срок действия (дней)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="30"
                        value={newKeyDuration}
                        onChange={(e) => setNewKeyDuration(e.target.value)}
                        disabled={newKeyForever}
                      />
                      <Button
                        variant={newKeyForever ? "default" : "outline"}
                        size="sm"
                        onClick={() => setNewKeyForever(!newKeyForever)}
                        className="whitespace-nowrap"
                      >
                        Навсегда
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Макс. активаций</Label>
                    <Input
                      type="number"
                      placeholder="1"
                      value={newKeyMaxActivations}
                      onChange={(e) => setNewKeyMaxActivations(e.target.value)}
                    />
                  </div>
                </div>

                {generatedKey && (
                  <div className="p-3 bg-secondary rounded-lg">
                    <Label className="text-xs text-muted-foreground">Сгенерированный ключ:</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 font-mono text-sm">{generatedKey}</code>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generatedKey, "generated")}>
                        {copiedKey === "generated" ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                <Button onClick={handleCreateKey} className="gap-2 w-full">
                  <Shuffle className="w-4 h-4" />
                  Генерировать и создать ключ
                </Button>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Существующие ключи</h3>
              <Button variant="outline" size="sm" onClick={refreshData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Обновить
              </Button>
            </div>

            <div className="grid gap-3">
              {licenseKeys.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">Ключи не созданы</CardContent>
                </Card>
              ) : (
                licenseKeys.map((key) => (
                  <Card key={key.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <code className="font-mono text-sm bg-secondary px-2 py-1 rounded">{key.key}</code>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => copyToClipboard(key.key, key.id)}
                            >
                              {copiedKey === key.id ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {key.duration === "forever" ? "Навсегда" : `${key.duration} дней`}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {key.activations}/{key.max_activations} активаций
                            </span>
                            <span>Создан: {formatDate(key.created_at)}</span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteKey(key.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* News Tab */}
          <TabsContent value="news" className="space-y-4">
            <NewsManager currentUser={currentUser} />
          </TabsContent>
        </Tabs>
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
