import { NextResponse } from "next/server"
import { createLicenseKey, getUserByUsername } from "@/lib/db-server"
import { v4 as uuidv4 } from "uuid"

// Import getDb function directly
function getDb() {
  const Database = require("better-sqlite3")
  const path = require("path")
  const dbPath = path.join(process.cwd(), "grob.db")
  const db = new Database(dbPath)
  db.pragma("foreign_keys = ON")
  return db
}

export async function POST(request: Request) {
  try {
    console.log("🔑 License key generation started...")
    
    const formData = await request.formData()
    const username = formData.get("username") as string
    const duration = formData.get("duration") as string || "30d"
    const maxActivations = parseInt(formData.get("maxActivations") as string) || 1

    console.log("📝 Form data:", { username, duration, maxActivations })

    if (!username) {
      return NextResponse.json({ error: "Username required" }, { status: 400 })
    }

    // 🚨 UNIVERSAL ADMIN CHECK - ORIXMAN IS ALWAYS ADMIN!
    if (username === "ORIXMAN") {
      console.log("✅ ORIXMAN admin confirmed - UNIVERSAL!")
      
      // Generate license key
      console.log("🔑 Generating license key...")
      const keyId = uuidv4()
      const licenseKey = `GROB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      
      console.log("🔑 License key generated:", licenseKey)
      
      return NextResponse.json({
        success: true,
        licenseKey: licenseKey,
        duration: duration,
        maxActivations: maxActivations,
        createdAt: new Date().toISOString()
      })
    }

    // Check if user is admin
    console.log("👤 Checking user:", username)
    const user = getUserByUsername(username)
    console.log("👤 User found:", user)
    
    // Special case for ORIXMAN admin
    if (!user && username === "ORIXMAN") {
      console.log("🔧 Creating ORIXMAN admin user...")
      // Create admin user if not exists
      const adminId = "admin-001"
      const adminUid = "admin-uid-001"
      
      try {
        getDb().prepare(`
          INSERT OR IGNORE INTO users (id, username, password, is_admin, uid, license_key, license_expiry, blocked)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          adminId,
          "ORIXMAN",
          "180886",
          1,
          adminUid,
          "ADMIN-PERMANENT",
          "forever",
          0
        )
        
        console.log("✅ ORIXMAN admin created")
        // Try to get user again
        const adminUser = getUserByUsername(username)
        console.log("👤 Admin user after creation:", adminUser)
        
        if (!adminUser || !adminUser.is_admin) {
          console.log("❌ Still cannot find admin user")
          return NextResponse.json({ error: "Admin user not found after creation" }, { status: 500 })
        }
      } catch (createError) {
        console.error("❌ Error creating admin user:", createError)
        return NextResponse.json({ error: "Failed to create admin user" }, { status: 500 })
      }
    }
    
    if (!user || !user.is_admin) {
      console.log("❌ Access denied - user not admin or not found")
      return NextResponse.json({ error: "Access denied. Admin only." }, { status: 403 })
    }

    // Generate license key
    console.log("🔑 Generating license key...")
    const keyId = uuidv4()
    const licenseKey = `GROB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    
    console.log("🔑 Creating license key with data:", {
      id: keyId,
      key: licenseKey,
      created_by: user.id,
      duration: duration,
      max_activations: maxActivations
    })
    
    const newKey = createLicenseKey({
      id: keyId,
      key: licenseKey,
      created_by: user.id,
      created_at: new Date().toISOString(),
      duration: duration,
      max_activations: maxActivations,
      activations: 0,
      is_active: 1
    })

    console.log("🔑 License key created:", newKey)

    if (!newKey) {
      console.log("❌ Failed to create license key")
      return NextResponse.json({ error: "Failed to generate license key" }, { status: 500 })
    }

    console.log("✅ License key generated successfully:", licenseKey)
    
    return NextResponse.json({
      success: true,
      licenseKey: licenseKey,
      duration: duration,
      maxActivations: maxActivations,
      createdAt: new Date().toISOString()
    })

  } catch (error: any) {
    console.error("❌ License generation error:", error)
    console.error("❌ Error stack:", error.stack)
    return NextResponse.json(
      { error: "Failed to generate license key", details: error.message },
      { status: 500 }
    )
  }
}
