// t.me/SentinelLinks

"use client"

// t.me/SentinelLinks
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Palette, Sparkles, Moon, Sun } from "lucide-react"
import { toast } from "sonner"

export function DesignSettings() {
  const [theme, setTheme] = useState("dark")
  const [selectedScheme, setSelectedScheme] = useState("blue")

  const colorSchemes = [
    {
      name: "blue",
      label: "Синий",
      previewPrimary: "#3b82f6",
      previewAccent: "#06b6d4",
    },
    {
      name: "purple",
      label: "Фиолетовый",
      previewPrimary: "#8b5cf6",
      previewAccent: "#d946ef",
    },
    {
      name: "green",
      label: "Зеленый",
      previewPrimary: "#10b981",
      previewAccent: "#14b8a6",
    },
    {
      name: "red",
      label: "Красный",
      previewPrimary: "#ef4444",
      previewAccent: "#f97316",
    },
    {
      name: "pink",
      label: "Розовый",
      previewPrimary: "#ec4899",
      previewAccent: "#f43f5e",
    },
  ]

// t.me/SentinelLinks
  useEffect(() => {
    const savedTheme = localStorage.getItem("grob-theme") || "dark"
    const savedScheme = localStorage.getItem("grob-color-scheme") || "blue"

    setTheme(savedTheme)
    setSelectedScheme(savedScheme)

    applyTheme(savedTheme)
    applyColorScheme(savedScheme)
  }, [])

  const applyTheme = (newTheme: string) => {
    const html = document.documentElement

    if (newTheme === "dark") {
      html.classList.add("dark")
    } else {
      html.classList.remove("dark")
    }
  }

  const applyColorScheme = (schemeName: string) => {
    const html = document.documentElement

    colorSchemes.forEach((scheme) => {
      html.classList.remove(`theme-${scheme.name}`)
    })

    // Добавляем новый класс
    html.classList.add(`theme-${schemeName}`)
  }

  const handleSchemeChange = (scheme: (typeof colorSchemes)[0]) => {
    setSelectedScheme(scheme.name)
    applyColorScheme(scheme.name)
    localStorage.setItem("grob-color-scheme", scheme.name)

// t.me/SentinelLinks
    toast.success("Цветовая схема изменена", {
      description: `Применена схема "${scheme.label}"`,
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

  return (
    <div className="flex-1 bg-background p-6 overflow-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Настройки дизайна
          </h2>
          <p className="text-muted-foreground">Измените внешний вид интерфейса GROB</p>
        </div>

        <Card className="p-6 bg-card">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Palette className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Цветовая схема</h3>
              <p className="text-sm text-muted-foreground">Выберите основные цвета интерфейса</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {colorSchemes.map((scheme) => (
              <button
                key={scheme.name}
                onClick={() => handleSchemeChange(scheme)}
                className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                  selectedScheme === scheme.name ? "border-primary shadow-lg ring-2 ring-primary/20" : "border-border"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-8 h-8 rounded-lg shadow-md"
                    style={{ background: `linear-gradient(135deg, ${scheme.previewPrimary}, ${scheme.previewAccent})` }}
                  />
                  <span className="font-medium text-sm">{scheme.label}</span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 h-2 rounded" style={{ backgroundColor: scheme.previewPrimary }} />
                  <div className="flex-1 h-2 rounded" style={{ backgroundColor: scheme.previewAccent }} />
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-6 bg-card">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Тема интерфейса</h3>
              <p className="text-sm text-muted-foreground">Переключение между светлой и темной темой</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant={theme === "dark" ? "default" : "outline"}
              className="flex-1 h-16"
              onClick={() => handleThemeChange("dark")}
            >
              <Moon className="w-5 h-5 mr-2" />
              Темная тема
            </Button>
            <Button
              variant={theme === "light" ? "default" : "outline"}
              className="flex-1 h-16"
              onClick={() => handleThemeChange("light")}
            >
              <Sun className="w-5 h-5 mr-2" />
              Светлая тема
            </Button>
          </div>
        </Card>

        <Card className="p-4 bg-secondary/20 border-primary/20">
          <p className="text-xs text-muted-foreground">
            Примечание: Изменения дизайна сохраняются локально в браузере и применяются ко всем сессиям
          </p>
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
