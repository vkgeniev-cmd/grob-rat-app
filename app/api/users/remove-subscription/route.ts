// t.me/SentinelLinks

import { type NextRequest, NextResponse } from "next/server"
import { updateUser } from "@/lib/db-server"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const success = updateUser(userId, {
      license_key: undefined,
      license_expiry: undefined,
    })

// t.me/SentinelLinks
    if (!success) {
      return NextResponse.json({ error: "Failed to remove subscription" }, { status: 400 })
    }

// t.me/SentinelLinks
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Remove Subscription Error]", error)
    return NextResponse.json({ error: "Failed to remove subscription" }, { status: 500 })
  }
}

//  ____             _   _            _
// / ___|  ___ _  | |_(_)_    ___| |   
// \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
//  ___) |  / | | | |_| | | | |  / |   
// |____/ \___|_| |_|\|_|_| |_|\___|_| 
// ********************************    
