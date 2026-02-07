// t.me/SentinelLinks

// t.me/SentinelLinks
import { type NextRequest, NextResponse } from "next/server"
import Database from "better-sqlite3"
import { join } from "path"

let db: Database.Database | null = null

function getDB() {
  if (!db) {
    const dbPath = join(process.cwd(), "database.db")
    db = new Database(dbPath)
    db.pragma("journal_mode = WAL")
  }
  return db
}

export async function POST(request: NextRequest) {
  try {
    const { sql, params = [], execute = false } = await request.json()

// t.me/SentinelLinks
    const database = getDB()

    if (execute) {
      const stmt = database.prepare(sql)
      const result = stmt.run(...params)
      return NextResponse.json({
        changes: result.changes,
        lastInsertRowid: result.lastInsertRowid,
      })
    }

    const stmt = database.prepare(sql)
    const rows = stmt.all(...params)

// t.me/SentinelLinks
    return NextResponse.json({ rows })
  } catch (error: any) {
    console.error("[DB Error]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

//  ____             _   _            _
// / ___|  ___ _  | |_(_)_    ___| |   
// \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
//  ___) |  / | | | |_| | | | |  / |   
// |____/ \___|_| |_|\|_|_| |_|\___|_| 
// ********************************    
