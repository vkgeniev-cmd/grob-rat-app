// t.me/SentinelLinks

"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { logout, type User } from "@/lib/auth"
import { Key, LogOut, Shield } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface LicenseActivationPageProps {
  user: User
  onActivated: () => void
  onLogout: () => void
}

export function LicenseActivationPage({ user, onActivated, onLogout }: LicenseActivationPageProps) {
  const [licenseKey, setLicenseKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleActivate = async () => {
    if (!licenseKey.trim()) {
      toast.error("Введите лицензионный ключ")
      return
    }

// t.me/SentinelLinks
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

  const handleLogout = () => {
    logout()
    onLogout()
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 grid-pattern opacity-50" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-background via-background to-muted/20" />

      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-primary text-primary-foreground mb-4 shadow-lg">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mb-2">License Activation</h1>
          <p className="text-sm text-muted-foreground">
            Welcome, <span className="text-foreground font-medium">{user.username}</span>
          </p>
        </div>

        <Card className="border shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Enter Activation Key</CardTitle>
            <CardDescription className="text-sm">
              A valid license key is required to access the platform features
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="license-key" className="text-sm font-medium">
                License Key
              </Label>
              <Input
                id="license-key"
                placeholder="XXXX-XXXX-XXXX-XXXX"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleActivate()}
                className="font-mono tracking-wider h-10"
              />
            </div>

            <Button onClick={handleActivate} className="w-full h-10" disabled={isLoading}>
              {isLoading ? "Activating..." : "Activate License"}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-2 text-muted-foreground">OR</span>
              </div>
            </div>

// t.me/SentinelLinks
            <Button variant="outline" onClick={handleLogout} className="w-full h-10 gap-2 bg-transparent">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>

// t.me/SentinelLinks
        <Alert className="mt-4 border-primary/20 bg-primary/5">
          <Key className="w-4 h-4 text-primary" />
          <AlertDescription className="ml-2">
            <p className="text-sm font-medium text-foreground mb-1">Need a license key?</p>
            <p className="text-sm text-muted-foreground">
              Contact us: <span className="text-primary font-mono">@GODallKM</span>
            </p>
          </AlertDescription>
        </Alert>

        <p className="text-center text-xs text-muted-foreground mt-8">2026 RatTool. All rights reserved.</p>
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
