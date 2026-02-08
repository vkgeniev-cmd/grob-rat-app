"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Key, Plus, Copy, Check } from "lucide-react"
import { toast } from "sonner"

export function AdminKeysPage() {
  const [user, setUser] = useState<any>(null)
  const [licenseKey, setLicenseKey] = useState("")
  const [duration, setDuration] = useState("30d")
  const [maxActivations, setMaxActivations] = useState("1")
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const userStr = sessionStorage.getItem("grob-auth") || sessionStorage.getItem("user")
    if (userStr) {
      try {
        const authData = JSON.parse(userStr)
        setUser(authData.user || authData)
      } catch (e) {
        console.error("Failed to parse user:", e)
      }
    }
  }, [])

  const handleGenerateKey = async () => {
    if (!user?.username) {
      toast.error("User not found")
      return
    }

    setIsGenerating(true)
    try {
      const formData = new FormData()
      formData.append("username", user.username)
      formData.append("duration", duration)
      formData.append("maxActivations", maxActivations)

      const response = await fetch("/api/admin/generate-key", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to generate key")
      }

      const data = await response.json()
      setLicenseKey(data.licenseKey)
      
      toast.success("License key generated!", {
        description: `Key: ${data.licenseKey}`
      })
    } catch (error) {
      console.error("Generation error:", error)
      toast.error("Failed to generate license key", {
        description: error instanceof Error ? error.message : "Unknown error"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyKey = () => {
    if (licenseKey) {
      navigator.clipboard.writeText(licenseKey)
      setCopied(true)
      toast.success("Key copied to clipboard!")
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!user?.is_admin) {
    return (
      <div className="flex-1 bg-background p-6 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <Card className="p-6">
            <div className="text-center">
              <Key className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">Admin access required to view this page.</p>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-background p-6 overflow-auto">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">License Keys</h1>
          <p className="text-lg text-muted-foreground">Generate license keys for users</p>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <select 
                  id="duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="7d">7 days</option>
                  <option value="30d">30 days</option>
                  <option value="90d">90 days</option>
                  <option value="365d">1 year</option>
                  <option value="forever">Forever</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxActivations">Max Activations</Label>
                <Input
                  id="maxActivations"
                  type="number"
                  min="1"
                  max="10"
                  value={maxActivations}
                  onChange={(e) => setMaxActivations(e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={handleGenerateKey}
              disabled={isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Generate License Key
                </>
              )}
            </Button>

            {licenseKey && (
              <Card className="p-4 bg-green-500/10 border-green-500/20">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-green-700 font-medium">Generated Key</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyKey}
                      className="h-8"
                    >
                      {copied ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <div className="font-mono text-sm bg-green-500/5 p-3 rounded border break-all">
                    {licenseKey}
                  </div>
                  <p className="text-xs text-green-600">
                    Duration: {duration} | Max activations: {maxActivations}
                  </p>
                </div>
              </Card>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
