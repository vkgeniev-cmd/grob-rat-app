"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Lock } from "lucide-react"
import { toast } from "sonner"

export function SimpleAuthPage({ onAuth }: { onAuth: (user: any) => void }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    if (!username || !password) {
      toast.error("Заполните все поля")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/simple-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok && data.user) {
        toast.success(`Добро пожаловать, ${data.user.username}!`)
        onAuth(data.user)
      } else {
        const errorMsg = data.error || "Неверный логин или пароль"
        toast.error(errorMsg)
      }
    } catch (error) {
      console.error("Login error:", error)
      toast.error("Ошибка подключения к серверу")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <User className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">GROB RAT</h1>
            <p className="text-muted-foreground text-sm">
              Вход в систему управления
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Имя пользователя</Label>
              <Input
                id="username"
                type="text"
                placeholder="ORIXMAN"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="180886"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <Button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Вход...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Войти
              </>
            )}
          </Button>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Администратор: ORIXMAN / 180886
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
