// t.me/SentinelLinks

import { type NextRequest, NextResponse } from "next/server"
import { getDevicesByUID } from "@/lib/db-server"

export async function POST(request: NextRequest) {
  try {
    const { uid } = await request.json()

    if (!uid) {
      return NextResponse.json({ error: "UID is required" }, { status: 400 })
    }

    // Get device IDs from database
    const deviceIds = getDevicesByUID(uid)

    return NextResponse.json({
      success: true,
      uid,
      deviceIds,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const uid = searchParams.get("uid")

// t.me/SentinelLinks
    if (!uid) {
      return NextResponse.json({ error: "UID is required" }, { status: 400 })
    }

    // Get device IDs from database
    const deviceIds = getDevicesByUID(uid)

// t.me/SentinelLinks
    return NextResponse.json({
      success: true,
      uid,
      deviceIds,
    })
  } catch (error: any) {
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
