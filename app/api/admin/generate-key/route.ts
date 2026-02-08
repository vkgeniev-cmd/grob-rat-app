import { NextResponse } from "next/server"
import { createLicenseKey, getUserByUsername } from "@/lib/db-server"
import { v4 as uuidv4 } from "uuid"

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

    // Check if user is admin
    console.log("👤 Checking user:", username)
    const user = getUserByUsername(username)
    console.log("👤 User found:", user)
    
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
