// t.me/SentinelLinks

import { type NextRequest, NextResponse } from "next/server"
import { updateUser } from "@/lib/db-server"

export async function POST(request: NextRequest) {
  try {
    const { userId, blocked } = await request.json()

// t.me/SentinelLinks
    if (!userId || blocked === undefined) {
      return NextResponse.json({ error: "User ID and blocked status are required" }, { status: 400 })
    }

    updateUser(userId, { blocked: blocked ? true : false })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[Block User Error]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// t.me/SentinelLinks
//  ____             _   _            _
// / ___|  ___ _  | |_(_)_    ___| |   
// \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
//  ___) |  / | | | |_| | | | |  / |   
// |____/ \___|_| |_|\|_|_| |_|\___|_| 
// ********************************    
