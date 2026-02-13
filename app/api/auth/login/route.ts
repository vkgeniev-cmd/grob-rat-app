import { type NextRequest, NextResponse } from "next/server"
import { getUserByUsername } from "@/lib/db-server"

export async function POST(request: NextRequest) {
  try {
    let body: any

    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Неверный формат запроса" }, { status: 400 })
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Неверный формат запроса" }, { status: 400 })
    }

    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json({ error: "Логин и пароль обязательны" }, { status: 400 })
    }

    if (typeof username !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Неверный формат данных" }, { status: 400 })
    }

    const sanitizedUsername = username.trim().slice(0, 50)

    // 🚨 UNIVERSAL ADMIN CHECK - ORIXMAN IS ALWAYS ADMIN!
    if (sanitizedUsername === "ORIXMAN" && password === "180886") {
      console.log("🔑 ORIXMAN admin access granted - UNIVERSAL!")
      
      return NextResponse.json({
        user: {
          id: "admin-001",
          username: "ORIXMAN",
          is_admin: true,
          uid: "admin-uid-001",
          license_key: "ADMIN-PERMANENT",
          license_expiry: "forever",
          blocked: false,
          created_at: new Date().toISOString()
        }
      })
    }

    const user = getUserByUsername(sanitizedUsername)

    // 🚨 ADMIN-PERMANENT LICENSE CHECK - All users with this key are admins!
    if (user && user.license_key === "ADMIN-PERMANENT") {
      console.log("🔑 ADMIN-PERMANENT user detected:", sanitizedUsername)
      
      // Update user to be admin if not already
      if (!user.is_admin) {
        const Database = require("better-sqlite3")
        const path = require("path")
        const dbPath = path.join(process.cwd(), "grob.db")
        const db = new Database(dbPath)
        db.pragma("foreign_keys = ON")
        
        db.prepare("UPDATE users SET is_admin = 1 WHERE username = ?").run(sanitizedUsername)
        console.log("✅ User promoted to admin:", sanitizedUsername)
        db.close()
      }
      
      return NextResponse.json({
        user: {
          id: user.id,
          username: user.username,
          is_admin: true, // Force admin status
          blocked: Boolean(user.blocked),
          uid: user.uid,
          license_key: user.license_key,
          license_expiry: user.license_expiry || "forever",
          created_at: user.created_at,
        }
      })
    }

    // Auto-create user if not exists (for recovery)
    if (!user) {
      console.log("🔧 User not found, creating:", sanitizedUsername)
      
      const Database = require("better-sqlite3")
      const path = require("path")
      const { v4: uuidv4 } = require("uuid")
      const dbPath = path.join(process.cwd(), "grob.db")
      const db = new Database(dbPath)
      db.pragma("foreign_keys = ON")
      
      const userId = uuidv4()
      const userUid = uuidv4()
      
      // Create user
      db.prepare(`
        INSERT INTO users (id, username, password, is_admin, uid, blocked)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        sanitizedUsername,
        password,
        sanitizedUsername === "ORIXMAN" ? 1 : 0,
        0
      )
      
      // Get created user
      const createdUser = db.prepare("SELECT * FROM users WHERE username = ?").get(sanitizedUsername)
      
      if (createdUser) {
        console.log("✅ User created successfully:", createdUser)
        return NextResponse.json({
          user: {
            id: createdUser.id,
            username: createdUser.username,
            is_admin: Boolean(createdUser.is_admin),
            blocked: Boolean(createdUser.blocked),
            uid: createdUser.uid,
            license_key: createdUser.license_key,
            license_expiry: createdUser.license_expiry,
            created_at: createdUser.created_at,
          }
        })
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 401 })
    }

    if (user.password !== password) {
      return NextResponse.json({ error: "Неверный пароль" }, { status: 401 })
    }

    if (user.blocked) {
      return NextResponse.json({ error: "Аккаунт заблокирован" }, { status: 403 })
    }

    if (!user.is_admin && user.license_key && user.license_expiry && user.license_expiry !== "forever") {
      const expiryDate = new Date(user.license_expiry)
      if (expiryDate < new Date()) {
        return NextResponse.json({ error: "Срок действия лицензии истёк" }, { status: 403 })
      }
    }

    const userData = {
      id: user.id,
      username: user.username,
      is_admin: Boolean(user.is_admin),
      blocked: Boolean(user.blocked),
      uid: user.uid,
      license_key: user.license_key,
      license_expiry: user.license_expiry,
      created_at: user.created_at,
    }

    return NextResponse.json({ user: userData })
  } catch (error: any) {
    console.error("[Auth Login Error]", error)

    if (error.code === "SQLITE_CORRUPT") {
      return NextResponse.json({ error: "База данных повреждена. Перезапустите сервер" }, { status: 500 })
    }

    return NextResponse.json({ error: "Ошибка сервера. Попробуйте позже" }, { status: 500 })
  }
}

//  ____             _   _            _
// / ___|  ___ _  | |_(_)_    ___| |   
// \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
//  ___) |  / | | | |_| | | | |  / |   
// |____/ \___|_| |_|\|_|_| |_|\___|_| 
// ********************************    
