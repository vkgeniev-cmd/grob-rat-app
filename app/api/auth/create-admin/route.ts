import { type NextRequest, NextResponse } from "next/server"
import { getUserByUsername, createAdminUser } from "@/lib/db-server"

export async function POST(request: NextRequest) {
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

    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json({ error: "Логин и пароль обязательны" }, { status: 400 })
    }

    if (typeof username !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Неверный формат данных" }, { status: 400 })
    }

    const sanitizedUsername = username.trim().slice(0, 50)

    if (sanitizedUsername.length < 3) {
      return NextResponse.json(
        { error: "Имя пользователя должно быть не менее 3 символов" },
        { status: 400 },
      )
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: "Пароль должен быть не менее 4 символов" },
        { status: 400 },
      )
    }

    // Check if user already exists
    const existingUser = getUserByUsername(sanitizedUsername)
    if (existingUser) {
      return NextResponse.json(
        { error: "Пользователь с таким именем уже существует" },
        { status: 400 },
      )
    }

    // Create admin user
    const newUser = createAdminUser(sanitizedUsername, password)

    if (!newUser) {
      return NextResponse.json({ error: "Ошибка создания администратора" }, { status: 500 })
    }

    return NextResponse.json({
      user: {
        id: newUser.id,
        username: newUser.username,
        is_admin: Boolean(newUser.is_admin),
        uid: newUser.uid,
      },
      message: "Администратор успешно создан!",
    })
  } catch (error: any) {
    console.error("[Auth Create Admin Error]", error)

    if (error.code === "SQLITE_CORRUPT") {
      return NextResponse.json(
        { error: "База данных повреждена. Перезапустите сервер для восстановления" },
        { status: 500 },
      )
    }

    return NextResponse.json({ error: "Ошибка сервера. Попробуйте позже" }, { status: 500 })
  }
}
