// t.me/SentinelLinks

// t.me/SentinelLinks
import { type NextRequest, NextResponse } from "next/server"
import { activateLicenseKey, getUserById } from "@/lib/db-server"

export async function POST(request: NextRequest) {
  try {
    const { licenseKey, userId } = await request.json()

    if (!licenseKey || !userId) {
      return NextResponse.json({ success: false, message: "Отсутствуют необходимые данные" }, { status: 400 })
    }

// t.me/SentinelLinks
    const result = activateLicenseKey(licenseKey, userId)

    if (result.success) {
      // Return updated user data
      const updatedUser = getUserById(userId)
      return NextResponse.json({ success: true, message: result.message, user: updatedUser })
    }

    return NextResponse.json({ success: false, message: result.message }, { status: 400 })
  } catch (error) {
    console.error("Error activating license:", error)
    return NextResponse.json({ success: false, message: "Ошибка сервера" }, { status: 500 })
  }
}

// t.me/SentinelLinks
//  ____             _   _            _
// / ___|  ___ _  | |_(_)_    ___| |   
// \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
//  ___) |  / | | | |_| | | | |  / |   
// |____/ \___|_| |_|\|_|_| |_|\___|_| 
// ********************************    
