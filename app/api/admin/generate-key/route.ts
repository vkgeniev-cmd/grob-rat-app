import { NextResponse } from "next/server"
import { createLicenseKey, getUserByUsername } from "@/lib/db-server"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const username = formData.get("username") as string
    const duration = formData.get("duration") as string || "30d"
    const maxActivations = parseInt(formData.get("maxActivations") as string) || 1

    if (!username) {
      return NextResponse.json({ error: "Username required" }, { status: 400 })
    }

    // Check if user is admin
    const user = getUserByUsername(username)
    if (!user || !user.is_admin) {
      return NextResponse.json({ error: "Access denied. Admin only." }, { status: 403 })
    }

    // Generate license key
    const keyId = uuidv4()
    const licenseKey = `GROB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    
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

    if (!newKey) {
      return NextResponse.json({ error: "Failed to generate license key" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      licenseKey: licenseKey,
      duration: duration,
      maxActivations: maxActivations,
      createdAt: new Date().toISOString()
    })

  } catch (error: any) {
    console.error("License generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate license key", details: error.message },
      { status: 500 }
    )
  }
}
