import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { username, password, licenseKey } = await request.json()
    
    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 })
    }

    // Create a simple user restoration endpoint
    const Database = require("better-sqlite3")
    const path = require("path")
    const { v4: uuidv4 } = require("uuid")
    
    const dbPath = path.join(process.cwd(), "grob.db")
    const db = new Database(dbPath)
    db.pragma("foreign_keys = ON")

    // Check if user already exists
    const existingUser = db.prepare("SELECT * FROM users WHERE username = ?").get(username)
    
    if (existingUser) {
      return NextResponse.json({ 
        error: "User already exists",
        user: {
          id: existingUser.id,
          username: existingUser.username,
          is_admin: Boolean(existingUser.is_admin),
          uid: existingUser.uid,
        }
      }, { status: 400 })
    }

    // Create new user
    const userId = uuidv4()
    const userUid = uuidv4()
    
    const result = db.prepare(`
      INSERT INTO users (id, username, password, is_admin, uid, license_key, license_expiry, blocked)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      username,
      password,
      0, // not admin
      userUid,
      licenseKey || null,
      licenseKey ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null, // 30 days if key provided
      0 // not blocked
    )

    if (result.changes > 0) {
      const newUser = db.prepare("SELECT * FROM users WHERE id = ?").get(userId)
      
      return NextResponse.json({
        success: true,
        user: {
          id: newUser.id,
          username: newUser.username,
          is_admin: Boolean(newUser.is_admin),
          uid: newUser.uid,
          license_key: newUser.license_key,
          license_expiry: newUser.license_expiry,
        }
      })
    }

    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })

  } catch (error: any) {
    console.error("User restoration error:", error)
    return NextResponse.json(
      { error: "Failed to restore user", details: error.message },
      { status: 500 }
    )
  }
}
