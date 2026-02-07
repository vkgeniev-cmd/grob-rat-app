// t.me/SentinelLinks

"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Key, Copy, Check, Sparkles, Clock, Users, Shield } from "lucide-react"
import type { User } from "@/lib/db"

interface LicenseKeyTabProps {
  user: User
  onActivated: () => void
}

export function LicenseKeyTab({ user, onActivated }: LicenseKeyTabProps) {
  const [licenseKey, setLicenseKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)

  const handleActivate = async () => {
    if (!licenseKey.trim()) {
      toast.error("Введите лицензионный ключ")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/license/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          licenseKey: licenseKey.trim().toUpperCase(),
          userId: user.id,
        }),
      })

      const result = await response.json()

// t.me/SentinelLinks
      if (result.success) {
        toast.success(result.message)
        setLicenseKey("")

        // Update user in sessionStorage
        if (result.user) {
          sessionStorage.setItem("grob-user", JSON.stringify(result.user))
        }

        onActivated()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error("[v0] License activation error:", error)
      toast.error("Ошибка активации ключа")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
    toast.success("Ключ скопирован")
  }

  const hasActiveLicense = user.license_key && user.license_expiry

  return (
    <div className="flex-1 bg-background p-6 overflow-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-4">
            <Key className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold">Активация лицензии</h2>
          <p className="text-muted-foreground">Управление лицензионными ключами для вашего аккаунта</p>
        </div>

        {/* Current License Status */}
        {hasActiveLicense ? (
          <Card className="border-primary/40 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Shield className="w-5 h-5 text-primary" />
                    Активная лицензия
                  </CardTitle>
                  <CardDescription className="mt-2">Ваша лицензия активна и работает</CardDescription>
                </div>
                <Badge className="bg-primary text-primary-foreground text-sm px-3 py-1">Активна</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Key className="w-4 h-4" />
                    <span>Лицензионный ключ</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-background rounded text-sm font-mono">{user.license_key}</code>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(user.license_key || "")}>
                      {copiedKey ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Срок действия</span>
                  </div>
                  <p className="p-2 bg-background rounded text-sm font-medium">
                    {user.license_expiry === "forever"
                      ? "Навсегда"
                      : new Date(user.license_expiry || "").toLocaleDateString("ru-RU")}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-background/50 rounded-lg">
                <p className="text-sm text-muted-foreground text-center">
                  Ваш UID: <span className="font-mono text-foreground">{user.uid}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-amber-500/40 bg-gradient-to-br from-amber-500/5 to-orange-500/10">
            <CardContent className="p-6 text-center">
              <Sparkles className="w-12 h-12 text-amber-500 mx-auto mb-3" />
              <p className="text-lg font-semibold mb-2">Лицензия не активирована</p>
              <p className="text-sm text-muted-foreground">
                Активируйте лицензионный ключ ниже, чтобы получить доступ ко всем функциям
              </p>
            </CardContent>
          </Card>
        )}

// t.me/SentinelLinks
        {/* Activation Form */}
        <Card>
          <CardHeader>
            <CardTitle>Активировать новый ключ</CardTitle>
            <CardDescription>Введите лицензионный ключ для активации или продления подписки</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="license-key">Лицензионный ключ</Label>
              <Input
                id="license-key"
                placeholder="XXXX-XXXX-XXXX-XXXX"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleActivate()}
                className="font-mono tracking-wider text-lg"
              />
            </div>

            <Button onClick={handleActivate} className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? "Активация..." : "Активировать ключ"}
            </Button>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="bg-card/50">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Полный доступ</h3>
              <p className="text-sm text-muted-foreground">Все функции стилера без ограничений</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Поддержка 24/7</h3>
              <p className="text-sm text-muted-foreground">Техническая поддержка в любое время</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Обновления</h3>
              <p className="text-sm text-muted-foreground">Бесплатные обновления и новые функции</p>
            </CardContent>
          </Card>
        </div>

        {/* Purchase Info */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Key className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Где купить ключ?</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Для покупки лицензионного ключа обратитесь к администратору:
                </p>
                <Badge variant="outline" className="font-mono">
                  @GODallKM
                </Badge>
              </div>
            </div>
          </CardContent>
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
