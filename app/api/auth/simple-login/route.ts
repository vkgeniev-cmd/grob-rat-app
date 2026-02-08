import { NextResponse } from "next/server"

// Simple hardcoded login system
const USERS = {
  "ORIXMAN": {
    username: "ORIXMAN",
    password: "180886",
    is_admin: true,
    uid: "admin-uid-001",
    license_key: "ADMIN-PERMANENT",
    license_expiry: "forever"
  }
}

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 })
    }

    const user = USERS[username as keyof typeof USERS]

    if (!user || user.password !== password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    return NextResponse.json({
      user: {
        id: username,
        username: user.username,
        is_admin: user.is_admin,
        uid: user.uid,
        license_key: user.license_key,
        license_expiry: user.license_expiry,
      }
    })

  } catch (error: any) {
    console.error("Simple login error:", error)
    return NextResponse.json(
      { error: "Login failed", details: error.message },
      { status: 500 }
    )
  }
}
