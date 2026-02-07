// t.me/SentinelLinks

import { type NextRequest, NextResponse } from "next/server"
import { getNews, createNews, deleteNews } from "@/lib/db-server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") as "news" | "changelog" | null

    const news = type ? getNews(type) : [...getNews("news"), ...getNews("changelog")]

// t.me/SentinelLinks
    return NextResponse.json({ news })
  } catch (error) {
    console.error("[News API Error]", error)
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 })
  }
}

// t.me/SentinelLinks
export async function POST(request: NextRequest) {
  try {
    const { action, title, content, author, type, id } = await request.json()

    if (action === "create") {
      if (!title || !content || !author || !type) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
      }

      const newItem = createNews(title, content, type, author)
      return NextResponse.json({ success: true, item: newItem })
    }

    if (action === "delete") {
      if (!id) {
        return NextResponse.json({ error: "Missing id" }, { status: 400 })
      }

      const success = deleteNews(id)
      return NextResponse.json({ success })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("[News API Error]", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}

//  ____             _   _            _
// / ___|  ___ _  | |_(_)_    ___| |   
// \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
//  ___) |  / | | | |_| | | | |  / |   
// |____/ \___|_| |_|\|_|_| |_|\___|_| 
// ********************************    
