// t.me/SentinelLinks

// t.me/SentinelLinks
import { NextResponse } from "next/server"
import { resetDatabase } from "@/lib/db-server"

export async function POST() {
  try {
    const success = resetDatabase()

// t.me/SentinelLinks
    if (success) {
      return NextResponse.json({
        message: "База данных успешно сброшена. Создан админ аккаунт: Bogratkm / Cooldoxer67",
      })
    } else {
      return NextResponse.json({ error: "Не удалось сбросить базу данных" }, { status: 500 })
    }
  } catch (error: any) {
    console.error("[DB Reset Error]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

//  ____             _   _            _
// / ___|  ___ _  | |_(_)_    ___| |   
// \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
//  ___) |  / | | | |_| | | | |  / |   
// |____/ \___|_| |_|\|_|_| |_|\___|_| 
// ********************************    
