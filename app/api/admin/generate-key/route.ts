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

    // Simple admin check - don't rely on database for now
    if (username !== "ORIXMAN") {
      console.log("❌ Access denied - not ORIXMAN")
      return NextResponse.json({ error: "Access denied. Admin only." }, { status: 403 })
    }

    console.log("✅ ORIXMAN admin confirmed")

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

  } catch (error: any) {
    console.error("❌ License generation error:", error)
    console.error("❌ Error stack:", error.stack)
    return NextResponse.json(
      { error: "Failed to generate license key", details: error.message },
      { status: 500 }
    )
  }
}
