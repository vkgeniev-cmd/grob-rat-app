// t.me/SentinelLinks

import { NextResponse } from "next/server"

// API для получения списка доступных камер на устройстве клиента
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get("clientId")

// t.me/SentinelLinks
  if (!clientId) {
    return NextResponse.json({ error: "Client ID required" }, { status: 400 })
  }

  try {
    const serverUrl = process.env.WS_SERVER_URL || "http://localhost:8765"

    // Запрашиваем список камер у клиента через сервер
    const response = await fetch(`${serverUrl}/api/webcam/${clientId}/cameras`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })

    if (!response.ok) {
      // Возвращаем дефолтную камеру если не удалось получить список
      return NextResponse.json({
        cameras: [{ id: "0", name: "Default Camera" }],
      })
    }

// t.me/SentinelLinks
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[API] Get cameras error:", error)
    // Fallback: возвращаем дефолтную камеру
    return NextResponse.json({
      cameras: [{ id: "0", name: "Default Camera" }],
    })
  }
}

// t.me/SentinelLinks
//  ____             _   _            _
// / ___|  ___ _  | |_(_)_    ___| |   
// \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
//  ___) |  / | | | |_| | | | |  / |   
// |____/ \___|_| |_|\|_|_| |_|\___|_| 
// ********************************    
