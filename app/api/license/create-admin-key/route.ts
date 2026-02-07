import { NextResponse } from "next/server"
import { getDb } from "@/lib/db-server"
import { v4 as uuidv4 } from "uuid"

export async function POST() {
  try {
    const db = getDb()
    
    // Create ADMIN-PERMANENT key
    const keyId = uuidv4()
    const result = db.prepare(`
      INSERT OR REPLACE INTO license_keys (id, key, created_by, created_at, duration, max_activations, activations, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      keyId,
      "ADMIN-PERMANENT", 
      "admin-001",
      new Date().toISOString(),
      "forever",
      999,
      0,
      1
    )
    
    // Verify key was created
    const keyCheck = db.prepare("SELECT * FROM license_keys WHERE key = ?").get("ADMIN-PERMANENT")
    
    return NextResponse.json({ 
      success: true, 
      message: "ADMIN-PERMANENT key created",
      key: keyCheck,
      changes: result.changes
    })
  } catch (error) {
    console.error("Error creating admin key:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
