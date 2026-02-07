// t.me/SentinelLinks

// t.me/SentinelLinks
"use client"

// t.me/SentinelLinks
import { Moon, Sun, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState, useEffect } from "react"

export function ThemeSelector() {
  const [theme, setTheme] = useState("dark")
  const [colorScheme, setColorScheme] = useState("blue")

  useEffect(() => {
    const savedTheme = localStorage.getItem("grob-theme") || "dark"
    const savedScheme = localStorage.getItem("grob-color-scheme") || "blue"
    setTheme(savedTheme)
    setColorScheme(savedScheme)
  }, [])

  const changeTheme = (newTheme: string) => {
    setTheme(newTheme)
    localStorage.setItem("grob-theme", newTheme)

    if (newTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  const changeColorScheme = (scheme: string) => {
    setColorScheme(scheme)
    localStorage.setItem("grob-color-scheme", scheme)

    document.documentElement.classList.remove(
      "theme-blue",
      "theme-purple",
      "theme-green",
      "theme-red",
      "theme-pink",
      "theme-orange",
      "theme-cyan",
    )
    document.documentElement.classList.add(`theme-${scheme}`)
  }

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2 h-8 px-2">
            {theme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            <span className="text-xs">Theme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuLabel className="text-xs">Appearance</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => changeTheme("light")} className="text-xs gap-2">
            <Sun className="w-3.5 h-3.5" />
            Light
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => changeTheme("dark")} className="text-xs gap-2">
            <Moon className="w-3.5 h-3.5" />
            Dark
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2 h-8 px-2">
            <Palette className="w-4 h-4" />
            <span className="text-xs">Color</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuLabel className="text-xs">Color Scheme</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => changeColorScheme("blue")} className="text-xs gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            Blue
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => changeColorScheme("purple")} className="text-xs gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            Purple
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => changeColorScheme("green")} className="text-xs gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            Green
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => changeColorScheme("red")} className="text-xs gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            Red
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => changeColorScheme("pink")} className="text-xs gap-2">
            <div className="w-3 h-3 rounded-full bg-pink-500" />
            Pink
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => changeColorScheme("orange")} className="text-xs gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            Orange
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => changeColorScheme("cyan")} className="text-xs gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-500" />
            Cyan
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

//  ____             _   _            _
// / ___|  ___ _  | |_(_)_    ___| |   
// \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
//  ___) |  / | | | |_| | | | |  / |   
// |____/ \___|_| |_|\|_|_| |_|\___|_| 
// ********************************    
