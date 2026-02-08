"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus, Key } from "lucide-react"
import { toast } from "sonner"

export function UserRestorePage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [licenseKey, setLicenseKey] = useState("")
  const [isRestoring, setIsRestoring] = useState(false)

  const handleRestore = async () => {
    if (!username || !password) {
      toast.error("Заполните имя пользователя и пароль")
      return
    }

    setIsRestoring(true)
    try {
      const response = await fetch("/api/auth/restore-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          licenseKey: licenseKey || undefined
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success("Пользователь восстановлен!", {
          description: `Теперь можете войти как ${username}`
        })
        
        // Auto-login after restore
        const loginResponse = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username,
            password,
          }),
        })

        if (loginResponse.ok) {
          const loginData = await loginResponse.json()
          if (loginData.user) {
            sessionStorage.setItem("grob-auth", JSON.stringify(loginData.user))
            sessionStorage.setItem("user", JSON.stringify(loginData.user))
            window.location.reload()
          }
        }
      } else {
        toast.error("Ошибка восстановления", {
          description: data.error || "Не удалось восстановить пользователя"
        })
      }
    } catch (error) {
      console.error("Restore error:", error)
      toast.error("Ошибка подключения", {
        description: "Попробуйте снова"
      })
    } finally {
      setIsRestoring(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <UserPlus className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Восстановление аккаунта</h1>
            <p className="text-muted-foreground text-sm">
              Восстановите потерянный аккаунт после обновления системы
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Имя пользователя</Label>
              <Input
                id="username"
                type="text"
                placeholder="Ваше имя пользователя"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="Ваш пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="licenseKey" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                Ключ лицензии (опционально)
              </Label>
              <Input
                id="licenseKey"
                type="text"
                placeholder="GROB-XXXXX-XXXXX"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={handleRestore}
            disabled={isRestoring}
            className="w-full"
            size="lg"
          >
            {isRestoring ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Восстановление...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Восстановить аккаунт
              </>
            )}
          </Button>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              После восстановления вы автоматически войдёте в систему
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
