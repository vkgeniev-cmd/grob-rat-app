// t.me/SentinelLinks

"use client"

import type React from "react"

// t.me/SentinelLinks
import { useState } from "react"
import { Monitor, MoreVertical, Link2, Info, Power, RefreshCw, Search } from "lucide-react"
import { OSIcon } from "@/components/os-icon"
import type { User } from "@/app/page"
import { cn } from "@/lib/utils"

interface UsersPageProps {
  users: User[]
  onConnect: (user: User) => void
  isScanning?: boolean
  onRefresh?: () => void
}

// t.me/SentinelLinks
export function UsersPage({ users, onConnect, isScanning = false, onRefresh }: UsersPageProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; user: User } | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"online" | "offline">("online")

  const handleRightClick = (e: React.MouseEvent, user: User) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, user })
    setSelectedUserId(user.id)
  }

  const handleConnect = (user: User) => {
    onConnect(user)
    setContextMenu(null)
  }

  const handleCloseContextMenu = () => {
    setContextMenu(null)
  }

  // Filter users based on search and status
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.ip.includes(searchQuery)

    const matchesFilter = user.status === filterStatus

    return matchesSearch && matchesFilter
  })

  const onlineCount = users.filter((u) => u.status === "online").length
  const offlineCount = users.filter((u) => u.status === "offline").length

// t.me/SentinelLinks
  return (
    <>
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-1">Connected Users</h1>
                <p className="text-sm text-muted-foreground">
                  Manage and connect to your devices ({onlineCount} online, {offlineCount} offline)
                </p>
              </div>
              <button
                onClick={onRefresh}
                disabled={isScanning}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw className={cn("w-4 h-4", isScanning && "animate-spin")} />
                Refresh
              </button>
            </div>

            {/* Search and Filter */}
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name, hostname, or IP..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex items-center gap-2 border rounded-md p-1">
                <button
                  onClick={() => setFilterStatus("online")}
                  className={cn(
                    "px-3 py-1 rounded text-xs font-medium transition-colors",
                    filterStatus === "online" ? "bg-primary text-primary-foreground" : "hover:bg-accent",
                  )}
                >
                  Online ({onlineCount})
                </button>
                <button
                  onClick={() => setFilterStatus("offline")}
                  className={cn(
                    "px-3 py-1 rounded text-xs font-medium transition-colors",
                    filterStatus === "offline" ? "bg-primary text-primary-foreground" : "hover:bg-accent",
                  )}
                >
                  Offline ({offlineCount})
                </button>
              </div>
            </div>
          </div>

          {/* Users Grid */}
          {isScanning && users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <RefreshCw className="w-12 h-12 text-primary animate-spin mb-4" />
              <h3 className="text-lg font-semibold mb-2">Scanning for devices...</h3>
              <p className="text-sm text-muted-foreground">Please wait while we search for connected devices</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Monitor className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? "No devices found" : `No ${filterStatus} devices`}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery
                  ? "Try adjusting your search"
                  : filterStatus === "online"
                    ? "No devices are currently online"
                    : "No offline devices"}
              </p>
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Refresh List
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  onContextMenu={(e) => handleRightClick(e, user)}
                  onClick={() => setSelectedUserId(user.id)}
                  className={cn(
                    "group relative p-4 rounded-lg border bg-card hover:border-primary/50 transition-all cursor-pointer",
                    selectedUserId === user.id && "border-primary ring-2 ring-primary/20",
                    user.status === "offline" && "opacity-60",
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center",
                        user.status === "online" ? "bg-primary/10" : "bg-muted",
                      )}
                    >
                      <OSIcon
                        os={user.os}
                        className={cn("w-6 h-6", user.status === "online" ? "text-primary" : "text-muted-foreground")}
                      />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRightClick(e, user)
                      }}
                      className="p-1.5 rounded-md hover:bg-accent transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn("status-dot", user.status)} />
                      <h3 className="font-semibold text-sm">{user.name}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">{user.hostname}</p>
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-3 h-3" />
                      <span>{user.ip}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Power className="w-3 h-3" />
                      <span className="capitalize">{user.status}</span>
                    </div>
                  </div>

                  {user.status === "online" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleConnect(user)
                      }}
                      className="w-full mt-4 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      Connect
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={handleCloseContextMenu} />
          <div
            className="fixed z-50 w-48 bg-popover border rounded-md shadow-lg py-1"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => handleConnect(contextMenu.user)}
              disabled={contextMenu.user.status !== "online"}
              className="w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Link2 className="w-4 h-4" />
              Connect
            </button>
            <button
              onClick={() => {
                alert(
                  `Device Info:\n\nName: ${contextMenu.user.name}\nHostname: ${contextMenu.user.hostname}\nIP: ${contextMenu.user.ip}\nOS: ${contextMenu.user.os}\nStatus: ${contextMenu.user.status}\nLast Seen: ${contextMenu.user.lastSeen}`,
                )
                setContextMenu(null)
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center gap-2"
            >
              <Info className="w-4 h-4" />
              Device Info
            </button>
          </div>
        </>
      )}
    </>
  )
}

//  ____             _   _            _
// / ___|  ___ _  | |_(_)_    ___| |   
// \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
//  ___) |  / | | | |_| | | | |  / |   
// |____/ \___|_| |_|\|_|_| |_|\___|_| 
// ********************************    
