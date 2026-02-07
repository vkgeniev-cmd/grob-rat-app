import { NextResponse } from "next/server"
import { type NextRequest } from "next/server"
import { getUserByUsername, activateLicenseKey } from "@/lib/db-server"

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json()
    
    if (!username) {
      return NextResponse.json({ success: false, message: "Username required" }, { status: 400 })
    }
    
    // Get user
    const user = getUserByUsername(username)
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }
    
    // Auto-activate for ORIXMAN or admin users
    if (username === "ORIXMAN" || user.is_admin) {
      const result = activateLicenseKey("ADMIN-PERMANENT", user.id)
      if (result.success) {
        // Return redirect response
        return NextResponse.redirect(new URL('/admin', request.url))
      }
    }
    
    return NextResponse.json({ success: false, message: "Auto-activation not available" })
  } catch (error: any) {
    console.error("Error auto-activating:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
