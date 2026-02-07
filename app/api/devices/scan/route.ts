// t.me/SentinelLinks

// t.me/SentinelLinks
import { NextResponse } from "next/server"

export async function GET() {
  // В реальном сценарии устройства должны регистрироваться на центральном сервере
  // Пока возвращаем пустой список - устройства добавляются вручную через их IP

  return NextResponse.json({
    devices: [],
    message: "Для добавления устройства подключитесь к нему напрямую через IP адрес",
  })
}

// t.me/SentinelLinks
export async function POST(request: Request) {
  try {
    const { ip, port = 8000 } = await request.json()

    // Попытка подключения к WebSocket серверу для получения информации
    // В production это должно быть реализовано через SSE или long polling

    return NextResponse.json({
      success: true,
      device: {
        ip,
        port,
        status: "checking",
        message: "Подключитесь к устройству для получения информации",
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Ошибка проверки устройства" }, { status: 500 })
  }
}

//  ____             _   _            _
// / ___|  ___ _  | |_(_)_    ___| |   
// \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
//  ___) |  / | | | |_| | | | |  / |   
// |____/ \___|_| |_|\|_|_| |_|\___|_| 
// ********************************    
