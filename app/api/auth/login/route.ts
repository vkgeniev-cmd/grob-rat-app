// t.me/SentinelLinks

import { type NextRequest, NextResponse } from "next/server"
import { getUserByUsername } from "@/lib/db-server"

export async function POST(request: NextRequest) {
  try {
    let body: any

    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Неверный формат запроса" }, { status: 400 })
    }

// t.me/SentinelLinks
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Неверный формат запроса" }, { status: 400 })
    }

    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json({ error: "Логин и пароль обязательны" }, { status: 400 })
    }

    if (typeof username !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Неверный формат данных" }, { status: 400 })
    }

    const sanitizedUsername = username.trim().slice(0, 50)

    const user = getUserByUsername(sanitizedUsername)

    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 401 })
    }

    if (user.password !== password) {
      return NextResponse.json({ error: "Неверный пароль" }, { status: 401 })
    }

// t.me/SentinelLinks
    if (user.blocked) {
      return NextResponse.json({ error: "Аккаунт заблокирован" }, { status: 403 })
    }

    if (!user.is_admin && user.license_expiry && user.license_expiry !== "forever") {
      const expiryDate = new Date(user.license_expiry)
      if (expiryDate < new Date()) {
        return NextResponse.json({ error: "Срок действия лицензии истёк" }, { status: 403 })
      }
    }

// t.me/SentinelLinks
    const userData = {
      id: user.id,
      username: user.username,
      is_admin: Boolean(user.is_admin),
      blocked: Boolean(user.blocked),
      uid: user.uid,
      license_key: user.license_key,
      license_expiry: user.license_expiry,
      created_at: user.created_at,
    }

    return NextResponse.json({ user: userData })
  } catch (error: any) {
    console.error("[Auth Login Error]", error)

    if (error.code === "SQLITE_CORRUPT") {
      return NextResponse.json({ error: "База данных повреждена. Перезапустите сервер" }, { status: 500 })
    }

    return NextResponse.json({ error: "Ошибка сервера. Попробуйте позже" }, { status: 500 })
  }
}

//  ____             _   _            _
// / ___|  ___ _  | |_(_)_    ___| |   
// \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
//  ___) |  / | | | |_| | | | |  / |   
// |____/ \___|_| |_|\|_|_| |_|\___|_| 
// ********************************    
