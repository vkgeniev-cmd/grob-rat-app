import { NextResponse } from "next/server"
import { type NextRequest } from "next/server"
import { getDb } from "@/lib/db-server"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    const { userId, licenseKey = "ADMIN-PERMANENT" } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID required" }, { status: 400 })
    }
    
    const db = getDb()
    
    // Create the key if it doesn't exist
    const keyId = uuidv4()
    db.prepare(`
      INSERT OR IGNORE INTO license_keys (id, key, created_by, created_at, duration, max_activations, activations, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      keyId,
      licenseKey,
      "admin-001", 
      new Date().toISOString(),
      "forever",
      999,
      0,
      1
    )
    
    // Get the key
    const key = db.prepare("SELECT * FROM license_keys WHERE key = ?").get(licenseKey)
    
    if (!key) {
      return NextResponse.json({ success: false, message: "Failed to create license key" })
    }
    
    // Remove any existing activation
    db.prepare("DELETE FROM license_activations WHERE license_id = ? AND user_id = ?").run(key.id, userId)
    
    // Create activation
    db.prepare(`
      INSERT INTO license_activations (id, license_id, user_id)
      VALUES (?, ?, ?)
    `).run(uuidv4(), key.id, userId)
    
    // Update user
    db.prepare(`
      UPDATE users SET license_key = ?, license_expiry = ? WHERE id = ?
    `).run(licenseKey, "forever", userId)
    
    // Get updated user
    const updatedUser = db.prepare("SELECT * FROM users WHERE id = ?").get(userId)
    
    return NextResponse.json({ 
      success: true, 
      message: "License force-activated successfully",
      user: updatedUser
    })
  } catch (error) {
    console.error("Error force-activating license:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
