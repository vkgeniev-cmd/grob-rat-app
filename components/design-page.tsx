// t.me/SentinelLinks

"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Palette, Moon, Sun, Check, Sparkles } from "lucide-react"
import { toast } from "sonner"

export function DesignPage() {
  const [theme, setTheme] = useState("dark")
  const [selectedScheme, setSelectedScheme] = useState("blue")
  const [rgbEnabled, setRgbEnabled] = useState(false)

  const colorSchemes = [
    {
      name: "blue",
      label: "Синий",
      preview: { primary: "#60a5fa", accent: "#22d3ee" },
    },
    {
      name: "purple",
      label: "Фиолетовый",
      preview: { primary: "#a78bfa", accent: "#e879f9" },
    },
    {
      name: "green",
      label: "Зеленый",
      preview: { primary: "#34d399", accent: "#2dd4bf" },
    },
    {
      name: "red",
      label: "Красный",
      preview: { primary: "#f87171", accent: "#fb923c" },
    },
    {
      name: "pink",
      label: "Розовый",
      preview: { primary: "#f472b6", accent: "#fb7185" },
    },
  ]

  useEffect(() => {
    const savedTheme = localStorage.getItem("grob-theme") || "dark"
    const savedScheme = localStorage.getItem("grob-color-scheme") || "blue"
    const savedRgb = localStorage.getItem("grob-rgb-effects") === "true"

    setTheme(savedTheme)
    setSelectedScheme(savedScheme)
    setRgbEnabled(savedRgb)

    applyTheme(savedTheme)
    applyColorScheme(savedScheme)
    applyRgbEffects(savedRgb)
  }, [])

  const applyTheme = (newTheme: string) => {
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  const applyColorScheme = (schemeName: string) => {
    const root = document.documentElement

    // Удаляем все существующие theme-* классы
    colorSchemes.forEach((scheme) => {
      root.classList.remove(`theme-${scheme.name}`)
    })

    // Добавляем новый класс темы
    root.classList.add(`theme-${schemeName}`)
  }

  const applyRgbEffects = (enabled: boolean) => {
    if (enabled) {
      document.documentElement.classList.add("rgb-effects-enabled")
    } else {
      document.documentElement.classList.remove("rgb-effects-enabled")
    }
  }

  const handleSchemeChange = (schemeName: string) => {
    setSelectedScheme(schemeName)
    applyColorScheme(schemeName)
    localStorage.setItem("grob-color-scheme", schemeName)

    const scheme = colorSchemes.find((s) => s.name === schemeName)
    toast.success("Цветовая схема изменена", {
      description: `Применена схема "${scheme?.label}"`,
    })
  }

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    applyTheme(newTheme)
    localStorage.setItem("grob-theme", newTheme)

    toast.success("Тема изменена", {
      description: `Применена ${newTheme === "dark" ? "темная" : "светлая"} тема`,
    })
  }

  const handleRgbToggle = (enabled: boolean) => {
    setRgbEnabled(enabled)
    applyRgbEffects(enabled)
    localStorage.setItem("grob-rgb-effects", String(enabled))

    toast.success(enabled ? "RGB эффекты включены" : "RGB эффекты выключены", {
      description: enabled ? "Интерфейс теперь светится переливающимися цветами" : "Переливающиеся эффекты отключены",
    })
  }

  return (
    <div className="flex-1 bg-background p-6 overflow-auto">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Настройки дизайна</h1>
          <p className="text-muted-foreground text-lg">
            Персонализируйте внешний вид интерфейса GROB под свои предпочтения
          </p>
        </div>

        <Card className="p-8 bg-card/50 backdrop-blur border-2">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border-2 border-primary/30">
                {theme === "dark" ? (
                  <Moon className="w-7 h-7 text-primary" />
                ) : (
                  <Sun className="w-7 h-7 text-primary" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-semibold">Тема интерфейса</h2>
                <p className="text-muted-foreground">Выберите светлую или темную тему</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleThemeChange("dark")}
                className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${
                  theme === "dark"
                    ? "border-primary bg-primary/5 shadow-lg scale-105"
                    : "border-border hover:border-primary/50 hover:bg-accent/5"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <Moon className="w-8 h-8" />
                  {theme === "dark" && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-lg mb-1">Темная тема</h3>
                  <p className="text-sm text-muted-foreground">Комфортная для глаз</p>
                </div>
              </button>

              <button
                onClick={() => handleThemeChange("light")}
                className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${
                  theme === "light"
                    ? "border-primary bg-primary/5 shadow-lg scale-105"
                    : "border-border hover:border-primary/50 hover:bg-accent/5"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <Sun className="w-8 h-8" />
                  {theme === "light" && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-lg mb-1">Светлая тема</h3>
                  <p className="text-sm text-muted-foreground">Яркая и контрастная</p>
                </div>
              </button>
            </div>
          </div>
        </Card>

        <Card className="p-8 bg-card/50 backdrop-blur border-2">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border-2 border-primary/30">
                <Palette className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">Цветовая схема</h2>
                <p className="text-muted-foreground">Выберите основные цвета интерфейса</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {colorSchemes.map((scheme) => {
                return (
                  <button
                    key={scheme.name}
                    onClick={() => handleSchemeChange(scheme.name)}
                    className={`relative p-5 rounded-2xl border-2 transition-all duration-300 ${
                      selectedScheme === scheme.name
                        ? "border-primary shadow-lg scale-105"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {selectedScheme === scheme.name && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}

                    <div className="space-y-3">
                      <div
                        className="w-full h-20 rounded-xl shadow-md"
                        style={{
                          background: `linear-gradient(135deg, ${scheme.preview.primary} 0%, ${scheme.preview.accent} 100%)`,
                        }}
                      />
                      <div>
                        <h3 className="font-semibold">{scheme.label}</h3>
                        <div className="flex gap-1.5 mt-2">
                          <div
                            className="flex-1 h-1.5 rounded-full"
                            style={{ backgroundColor: scheme.preview.primary }}
                          />
                          <div
                            className="flex-1 h-1.5 rounded-full"
                            style={{ backgroundColor: scheme.preview.accent }}
                          />
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </Card>

// t.me/SentinelLinks
        <Card className="p-8 bg-card/50 backdrop-blur border-2">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border-2 border-primary/30">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">RGB эффекты</h2>
                <p className="text-muted-foreground">Переливающиеся радужные цвета</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleRgbToggle(true)}
                className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${
                  rgbEnabled
                    ? "border-primary bg-primary/5 shadow-lg scale-105"
                    : "border-border hover:border-primary/50 hover:bg-accent/5"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <Sparkles className="w-8 h-8" />
                  {rgbEnabled && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-lg mb-1">Включены</h3>
                  <p className="text-sm text-muted-foreground">Радужные переливы активны</p>
                </div>
                {rgbEnabled && (
                  <div className="absolute inset-0 rounded-2xl opacity-30 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-cyan-500 to-blue-500 animate-pulse" />
                  </div>
                )}
              </button>

              <button
                onClick={() => handleRgbToggle(false)}
                className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${
                  !rgbEnabled
                    ? "border-primary bg-primary/5 shadow-lg scale-105"
                    : "border-border hover:border-primary/50 hover:bg-accent/5"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-8 h-8 rounded-full bg-muted" />
                  {!rgbEnabled && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-lg mb-1">Выключены</h3>
                  <p className="text-sm text-muted-foreground">Стандартный вид</p>
                </div>
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

// t.me/SentinelLinks
//  ____             _   _            _
// / ___|  ___ _  | |_(_)_    ___| |   
// \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
//  ___) |  / | | | |_| | | | |  / |   
// |____/ \___|_| |_|\|_|_| |_|\___|_| 
// ********************************    
