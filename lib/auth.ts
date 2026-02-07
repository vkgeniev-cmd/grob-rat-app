// t.me/SentinelLinks

// Authentication and License Key Management Library
import { v4 as uuidv4 } from "uuid"

export interface User {
  id: string
  username: string
  password: string // In production, this should be hashed
  isAdmin: boolean
  createdAt: string
  licenseKey?: string
  licenseExpiry?: string // ISO date string or "forever"
  uid: string // Unique identifier for builds
  blocked: boolean
}

export interface LicenseKey {
  id: string
  key: string
  createdBy: string
  createdAt: string
  duration: number | "forever" // days or forever
  maxActivations: number
  activations: number
  activatedBy: string[]
  isActive: boolean
}

// t.me/SentinelLinks
export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  rememberMe: boolean
}

// Default admin user
const DEFAULT_ADMIN: User = {
  id: "admin-001",
  username: "ORIXMAN",
  password: "180886",
  isAdmin: true,
  createdAt: new Date().toISOString(),
  licenseKey: "ADMIN-PERMANENT",
  licenseExpiry: "forever",
  uid: "admin-uid-001",
  blocked: false,
}

// Initialize storage with default admin
export function initializeAuth(): void {
  const users = getUsers()
  const adminExists = users.some((u) => u.username === "ORIXMAN")

  if (!adminExists) {
    users.push(DEFAULT_ADMIN)
    saveUsers(users)
  }

  // Initialize license keys storage if not exists
  if (!localStorage.getItem("grob-license-keys")) {
    localStorage.setItem("grob-license-keys", JSON.stringify([]))
  }
}

// User management
export function getUsers(): User[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem("grob-users")
  if (!data) {
    localStorage.setItem("grob-users", JSON.stringify([DEFAULT_ADMIN]))
    return [DEFAULT_ADMIN]
  }
  return JSON.parse(data)
}

export function saveUsers(users: User[]): void {
  localStorage.setItem("grob-users", JSON.stringify(users))
}

export function getUserByUsername(username: string): User | undefined {
  return getUsers().find((u) => u.username.toLowerCase() === username.toLowerCase())
}

export function createUser(username: string, password: string): User | null {
  const users = getUsers()
  if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    return null // User already exists
  }

  const newUser: User = {
    id: uuidv4(),
    username,
    password,
    isAdmin: false,
    createdAt: new Date().toISOString(),
    uid: uuidv4(),
    blocked: false,
  }

  users.push(newUser)
  saveUsers(users)
  return newUser
}

export function updateUser(userId: string, updates: Partial<User>): boolean {
  const users = getUsers()
  const index = users.findIndex((u) => u.id === userId)
  if (index === -1) return false

  users[index] = { ...users[index], ...updates }
  saveUsers(users)
  return true
}

export function deleteUser(userId: string): boolean {
  const users = getUsers()
  const filtered = users.filter((u) => u.id !== userId && u.username !== "ORIXMAN")
  if (filtered.length === users.length) return false
  saveUsers(filtered)
  return true
}

export function blockUser(userId: string, blocked: boolean): boolean {
  return updateUser(userId, { blocked })
}

export function toggleAdminRole(userId: string, isAdmin: boolean): boolean {
  const users = getUsers()
  const user = users.find((u) => u.id === userId)
  if (!user || user.username === "ORIXMAN") return false // Cannot modify root admin
  return updateUser(userId, { isAdmin })
}

export function removeSubscription(userId: string): boolean {
  return updateUser(userId, { licenseKey: undefined, licenseExpiry: undefined })
}

// Authentication
export function login(username: string, password: string, rememberMe: boolean): AuthState {
  const user = getUserByUsername(username)

  if (!user || user.password !== password) {
    return { isAuthenticated: false, user: null, rememberMe: false }
  }

  if (user.blocked) {
    return { isAuthenticated: false, user: null, rememberMe: false }
  }

  const authState: AuthState = {
    isAuthenticated: true,
    user,
    rememberMe,
  }

  if (rememberMe) {
    localStorage.setItem("grob-auth", JSON.stringify(authState))
  } else {
    sessionStorage.setItem("grob-auth", JSON.stringify(authState))
  }

  return authState
}

export function logout(): void {
  localStorage.removeItem("grob-auth")
  sessionStorage.removeItem("grob-auth")
}

export function getAuthState(): AuthState {
  if (typeof window === "undefined") {
    return { isAuthenticated: false, user: null, rememberMe: false }
  }

  // Check localStorage first (remember me)
  const localAuth = localStorage.getItem("grob-auth")
  if (localAuth) {
    const state = JSON.parse(localAuth) as AuthState
    // Verify user still exists and not blocked
    const user = getUserByUsername(state.user?.username || "")
    if (user && !user.blocked) {
      return { ...state, user }
    }
    localStorage.removeItem("grob-auth")
  }

  // Check sessionStorage
  const sessionAuth = sessionStorage.getItem("grob-auth")
  if (sessionAuth) {
    const state = JSON.parse(sessionAuth) as AuthState
    const user = getUserByUsername(state.user?.username || "")
    if (user && !user.blocked) {
      return { ...state, user }
    }
    sessionStorage.removeItem("grob-auth")
  }

  return { isAuthenticated: false, user: null, rememberMe: false }
}

// License Key Management
export function getLicenseKeys(): LicenseKey[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem("grob-license-keys")
  return data ? JSON.parse(data) : []
}

export function saveLicenseKeys(keys: LicenseKey[]): void {
  localStorage.setItem("grob-license-keys", JSON.stringify(keys))
}

export function generateRandomKey(length = 16): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < length; i++) {
    if (i > 0 && i % 4 === 0) result += "-"
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function createLicenseKey(createdBy: string, duration: number | "forever", maxActivations: number): LicenseKey {
  const newKey: LicenseKey = {
    id: uuidv4(),
    key: generateRandomKey(),
    createdBy,
    createdAt: new Date().toISOString(),
    duration,
    maxActivations,
    activations: 0,
    activatedBy: [],
    isActive: true,
  }

  const keys = getLicenseKeys()
  keys.push(newKey)
  saveLicenseKeys(keys)
  return newKey
}

export function deleteLicenseKey(keyId: string): boolean {
  const keys = getLicenseKeys()
  const filtered = keys.filter((k) => k.id !== keyId)
  if (filtered.length === keys.length) return false
  saveLicenseKeys(filtered)
  return true
}

export function activateLicenseKey(keyString: string, userId: string): { success: boolean; message: string } {
  const keys = getLicenseKeys()
  const keyIndex = keys.findIndex((k) => k.key === keyString && k.isActive)

  if (keyIndex === -1) {
    return { success: false, message: "Ключ не найден или неактивен" }
  }

// t.me/SentinelLinks
  const key = keys[keyIndex]

  if (key.activations >= key.maxActivations) {
    return { success: false, message: "Превышено максимальное количество активаций" }
  }

  if (key.activatedBy.includes(userId)) {
    return { success: false, message: "Вы уже активировали этот ключ" }
  }

  // Activate key for user
  key.activations++
  key.activatedBy.push(userId)
  keys[keyIndex] = key
  saveLicenseKeys(keys)

  // Update user with license
  const users = getUsers()
  const userIndex = users.findIndex((u) => u.id === userId)
  if (userIndex !== -1) {
    let expiry: string
    if (key.duration === "forever") {
      expiry = "forever"
    } else {
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + key.duration)
      expiry = expiryDate.toISOString()
    }

    users[userIndex].licenseKey = key.key
    users[userIndex].licenseExpiry = expiry
    saveUsers(users)
  }

  return { success: true, message: "Ключ успешно активирован" }
}

export function hasValidLicense(user: User | null): boolean {
  if (!user) return false
  if (user.isAdmin) return true
  if (!user.licenseKey || !user.licenseExpiry) return false
  if (user.licenseExpiry === "forever") return true

  const expiry = new Date(user.licenseExpiry)
  return expiry > new Date()
}

export function getLicenseRemainingTime(user: User | null): string | null {
  if (!user) return null

  // Handle both camelCase (client) and snake_case (database) property names
  const licenseExpiry = (user as any).license_expiry || user.licenseExpiry

  if (!licenseExpiry) return null
  if (licenseExpiry === "forever") return "Навсегда"

  const expiry = new Date(licenseExpiry)
  const now = new Date()
  const diff = expiry.getTime() - now.getTime()

  if (diff <= 0) return "Истёк"

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (days > 0) return `${days}д ${hours}ч`
  if (hours > 0) return `${hours}ч ${minutes}м`
  return `${minutes}м`
}

export function getLicenseRemainingDays(user: User | null): number | "forever" | null {
  if (!user || !user.licenseExpiry) return null
  if (user.licenseExpiry === "forever") return "forever"

  const expiry = new Date(user.licenseExpiry)
  const now = new Date()
  const diff = expiry.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

// Device/Build ownership
export function getDevicesByUID(uid: string, showAll = false): string[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem("grob-device-owners")
  const owners: Record<string, string> = data ? JSON.parse(data) : {}

  if (showAll) {
    return Object.keys(owners)
  }

  const userDevices = Object.entries(owners)
    .filter(([_, ownerUid]) => ownerUid === uid)
    .map(([deviceId]) => deviceId)

  return userDevices
}

export function setDeviceOwner(deviceId: string, uid: string): void {
  if (typeof window === "undefined") return

  const data = localStorage.getItem("grob-device-owners")
  const owners: Record<string, string> = data ? JSON.parse(data) : {}
  owners[deviceId] = uid
  localStorage.setItem("grob-device-owners", JSON.stringify(owners))
}

//  ____             _   _            _
// / ___|  ___ _  | |_(_)_    ___| |   
// \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
//  ___) |  / | | | |_| | | | |  / |   
// |____/ \___|_| |_|\|_|_| |_|\___|_| 
// ********************************    
