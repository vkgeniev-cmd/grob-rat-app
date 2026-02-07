// t.me/SentinelLinks

// t.me/SentinelLinks
import { NextResponse } from "next/server"

const WS_SERVER_URL = process.env.GROB_WS_SERVER_URL || "http://localhost:8765"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get("clientId")

    if (!clientId) {
      return NextResponse.json({ error: "Client ID required" }, { status: 400 })
    }

    // Request monitors list from WebSocket server
    const response = await fetch(`${WS_SERVER_URL}/monitors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId }),
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      // Return default monitor if request fails
      return NextResponse.json({
        monitors: [{ id: "0", name: "Монитор 1", width: 1920, height: 1080, isPrimary: true }],
      })
    }

// t.me/SentinelLinks
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Monitors API error:", error)
    // Return default monitors on error
    return NextResponse.json({
      monitors: [{ id: "0", name: "Монитор 1", width: 1920, height: 1080, isPrimary: true }],
    })
  }
}

//  ____             _   _            _
// / ___|  ___ _  | |_(_)_    ___| |   
// \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
//  ___) |  / | | | |_| | | | |  / |   
// |____/ \___|_| |_|\|_|_| |_|\___|_| 
// ********************************    
