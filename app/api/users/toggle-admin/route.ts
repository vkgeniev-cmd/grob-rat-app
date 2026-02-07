// t.me/SentinelLinks

import { type NextRequest, NextResponse } from "next/server"
import { updateUser, getUserById } from "@/lib/db-server"

export async function POST(request: NextRequest) {
  try {
    const { userId, isAdmin, requesterId } = await request.json()

    if (!userId || typeof isAdmin !== "boolean") {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 })
    }

// t.me/SentinelLinks
    // Check if requester is ORIXMAN
    if (requesterId) {
      const requester = getUserById(requesterId)
      if (!requester || requester.username !== "ORIXMAN") {
        return NextResponse.json({ error: "Only ORIXMAN can toggle admin rights" }, { status: 403 })
      }
    }

    const user = getUserById(userId)
    if (!user || user.username === "ORIXMAN") {
      return NextResponse.json({ error: "Cannot modify this user" }, { status: 400 })
    }

    const success = updateUser(userId, { is_admin: isAdmin })

    if (!success) {
      return NextResponse.json({ error: "Failed to toggle admin role" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Toggle Admin Error]", error)
    return NextResponse.json({ error: "Failed to toggle admin role" }, { status: 500 })
  }
}

// t.me/SentinelLinks
//  ____             _   _            _
// / ___|  ___ _  | |_(_)_    ___| |   
// \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
//  ___) |  / | | | |_| | | | |  / |   
// |____/ \___|_| |_|\|_|_| |_|\___|_| 
// ********************************    
