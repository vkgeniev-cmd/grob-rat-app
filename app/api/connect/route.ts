import { NextResponse } from "next/server"
import { getUserById } from "@/lib/db-server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { uid, computer_name, username, os_version, ip_address } = body

    if (!uid) {
      return NextResponse.json({ error: "UID required" }, { status: 400 })
    }

    // Get user by UID (we'll need to implement getUserByUid in db-server.ts)
    // For now, just log the connection
    const deviceId = `${computer_name}_${username}_${Date.now()}`
    const device = {
      id: deviceId,
      name: computer_name,
      hostname: computer_name,
      username: username,
      os: os_version || "Windows",
      ip: ip_address || "Unknown",
      status: "online" as const,
      lastSeen: new Date().toISOString(),
      userUid: uid,
    }

    // Store device connection
    console.log("Device connected:", device)

    return NextResponse.json({ 
      success: true, 
      message: "Device connected successfully",
      device 
    })
  } catch (error: any) {
    console.error("Connection error:", error)
    return NextResponse.json(
      { error: "Connection failed", details: error.message },
      { status: 500 }
    )
  }
}
