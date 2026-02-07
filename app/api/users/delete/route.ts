// t.me/SentinelLinks

import { type NextRequest, NextResponse } from "next/server"
import { deleteUser } from "@/lib/db-server"

// t.me/SentinelLinks
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    deleteUser(userId)

// t.me/SentinelLinks
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[Delete User Error]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

//  ____             _   _            _
// / ___|  ___ _  | |_(_)_    ___| |   
// \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
//  ___) |  / | | | |_| | | | |  / |   
// |____/ \___|_| |_|\|_|_| |_|\___|_| 
// ********************************    
