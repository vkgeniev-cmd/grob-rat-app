// t.me/SentinelLinks

import { NextResponse } from "next/server"

const WS_SERVER_URL = process.env.GROB_WS_SERVER_URL || "http://localhost:8765"

// t.me/SentinelLinks
export async function POST(request: Request) {
  try {
    const { deviceId, action, data } = await request.json()

    if (!deviceId || !action) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
    }

    const response = await fetch(`${WS_SERVER_URL}/command`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: deviceId,
        command: "fun",
        data: { action, ...data },
      }),
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Server error")
    }

    return NextResponse.json({
      success: true,
      message: "Command sent",
    })
  } catch (error: any) {
    console.error("Fun command error:", error)
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 })
  }
}

// t.me/SentinelLinks
//  ____             _   _            _
// / ___|  ___ _  | |_(_)_    ___| |   
// \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
//  ___) |  / | | | |_| | | | |  / |   
// |____/ \___|_| |_|\|_|_| |_|\___|_| 
// ********************************    
