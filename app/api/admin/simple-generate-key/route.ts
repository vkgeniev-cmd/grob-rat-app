import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"

// Simple license key generation
export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const username = formData.get("username") as string
    const duration = formData.get("duration") as string || "30d"
    const maxActivations = parseInt(formData.get("maxActivations") as string) || 1

    if (!username) {
      return NextResponse.json({ error: "Username required" }, { status: 400 })
    }

    // Simple admin check
    if (username !== "ORIXMAN") {
      return NextResponse.json({ error: "Access denied. Admin only." }, { status: 403 })
    }

    // Generate license key
    const licenseKey = `GROB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    
    return NextResponse.json({
      success: true,
      licenseKey: licenseKey,
      duration: duration,
      maxActivations: maxActivations,
      createdAt: new Date().toISOString()
    })

  } catch (error: any) {
    console.error("Simple license generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate license key", details: error.message },
      { status: 500 }
    )
  }
}
