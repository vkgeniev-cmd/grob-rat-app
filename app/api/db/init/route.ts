// t.me/SentinelLinks

import { type NextRequest, NextResponse } from "next/server"
import { initializeDatabase } from "@/lib/db-server"

export async function GET(request: NextRequest) {
  try {
    initializeDatabase()
    return NextResponse.json({ success: true, message: "База данных инициализирована" })
  } catch (error: any) {
    console.error("[DB Init Error]", error)
    return NextResponse.json({ error: "Ошибка инициализации БД" }, { status: 500 })
  }
}
