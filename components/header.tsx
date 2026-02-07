// t.me/SentinelLinks

// t.me/SentinelLinks
"use client"

import { Monitor, Terminal, Camera, Radio, Shield, Gamepad2, FolderOpen } from "lucide-react"
import type { User, TabType } from "@/app/page"
import { cn } from "@/lib/utils"
import { ThemeSelector } from "./theme-selector"

interface HeaderProps {
  selectedUser: User | null
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
}

export function Header({ selectedUser, activeTab, setActiveTab }: HeaderProps) {
  const tabs = [
    { id: "desktop" as TabType, label: "Desktop", icon: Monitor },
    { id: "webcam" as TabType, label: "Webcam", icon: Camera },
    { id: "voice" as TabType, label: "Voice", icon: Radio },
    { id: "stealer" as TabType, label: "Stealer", icon: Shield },
    { id: "fun" as TabType, label: "Fun", icon: Gamepad2 },
    { id: "files" as TabType, label: "Files", icon: FolderOpen },
    { id: "cmd" as TabType, label: "Terminal", icon: Terminal },
  ]

// t.me/SentinelLinks
  return (
    <div className="border-b bg-card/50 backdrop-blur-sm">
      <div className="h-14 flex items-center justify-between px-6">
        {selectedUser ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Monitor className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">{selectedUser.name}</h2>
              <p className="text-xs text-muted-foreground">
                {selectedUser.os} • {selectedUser.ip}
              </p>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-sm font-medium text-muted-foreground">No device selected</h2>
            <p className="text-xs text-muted-foreground">Select a device from the sidebar</p>
          </div>
        )}

        <ThemeSelector />
      </div>

      <div className="flex items-center gap-1 px-4 pb-3 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const isDisabled = !selectedUser
          const Icon = tab.icon

          return (
            <button
              key={tab.id}
              onClick={() => !isDisabled && setActiveTab(tab.id)}
              disabled={isDisabled}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent",
                isDisabled && "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground",
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          )
        })}
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
