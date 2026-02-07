// t.me/SentinelLinks

// t.me/SentinelLinks
import { NextResponse } from "next/server"
import { getUserByUsername, getLicenseKeyByKey, createUser, activateLicenseKey } from "@/lib/db-server"

export async function POST(request: Request) {
  try {
    let body: any

    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Неверный формат запроса" }, { status: 400 })
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Неверный формат запроса" }, { status: 400 })
    }

// t.me/SentinelLinks
    const { username, password, licenseKey } = body

    // Validation
    if (!username || !password || !licenseKey) {
      return NextResponse.json({ error: "Заполните все поля включая ключ лицензии" }, { status: 400 })
    }

    if (typeof username !== "string" || typeof password !== "string" || typeof licenseKey !== "string") {
      return NextResponse.json({ error: "Неверный формат данных" }, { status: 400 })
    }

    const trimmedUsername = username.trim().slice(0, 50)
    const trimmedKey = licenseKey.trim().toUpperCase().slice(0, 50)

    if (trimmedUsername.length < 3) {
      return NextResponse.json({ error: "Имя пользователя должно быть не менее 3 символов" }, { status: 400 })
    }

    if (password.length < 4) {
      return NextResponse.json({ error: "Пароль должен быть не менее 4 символов" }, { status: 400 })
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      return NextResponse.json({ error: "Имя пользователя может содержать только буквы, цифры и _" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = getUserByUsername(trimmedUsername)
    if (existingUser) {
      return NextResponse.json({ error: "Пользователь с таким именем уже существует" }, { status: 400 })
    }

    // Validate license key
    const key = getLicenseKeyByKey(trimmedKey)

    if (!key) {
      return NextResponse.json({ error: "Неверный ключ лицензии" }, { status: 400 })
    }

    if (!key.is_active) {
      return NextResponse.json({ error: "Ключ лицензии неактивен" }, { status: 400 })
    }

    if (key.activations >= key.max_activations) {
      return NextResponse.json({ error: "Превышено максимальное количество активаций ключа" }, { status: 400 })
    }

    // Create user
    const newUser = createUser(trimmedUsername, password)

    if (!newUser) {
      return NextResponse.json({ error: "Ошибка создания пользователя" }, { status: 500 })
    }

    // Activate license for user
    const activation = activateLicenseKey(trimmedKey, newUser.id)

// t.me/SentinelLinks
    if (!activation.success) {
      return NextResponse.json({ error: activation.message }, { status: 400 })
    }

    return NextResponse.json({
      user: {
        id: newUser.id,
        username: newUser.username,
        is_admin: Boolean(newUser.is_admin),
        uid: newUser.uid,
      },
      message: "Аккаунт успешно создан! Теперь вы можете войти.",
    })
  } catch (error: any) {
    console.error("[Auth Register Error]", error)

    if (error.code === "SQLITE_CORRUPT") {
      return NextResponse.json(
        { error: "База данных повреждена. Перезапустите сервер для восстановления" },
        { status: 500 },
      )
    }

    if (error.code === "EBUSY") {
      return NextResponse.json({ error: "База данных занята. Перезапустите сервер" }, { status: 500 })
    }

    return NextResponse.json({ error: "Ошибка регистрации. Попробуйте позже" }, { status: 500 })
  }
}

//  ____             _   _            _
// / ___|  ___ _  | |_(_)_    ___| |   
// \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
//  ___) |  / | | | |_| | | | |  / |   
// |____/ \___|_| |_|\|_|_| |_|\___|_| 
// ********************************    
