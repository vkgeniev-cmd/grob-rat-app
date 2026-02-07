// t.me/SentinelLinks

// Client-side news management (for type definitions and client-side operations)

// t.me/SentinelLinks
export interface NewsItem {
  id: string
  title: string
  content: string
  author: string
  createdAt: string
  type: "news" | "changelog"
}

// t.me/SentinelLinks
// Client-side functions (use API endpoints on server)
export function getNews(): NewsItem[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem("grob-news")
  return data ? JSON.parse(data) : []
}

export function saveNews(news: NewsItem[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem("grob-news", JSON.stringify(news))
}

export function createNews(title: string, content: string, author: string, type: "news" | "changelog"): NewsItem {
  const newItem: NewsItem = {
    id: `${Date.now()}-${Math.random()}`,
    title,
    content,
    author,
    createdAt: new Date().toISOString(),
    type,
  }

  const items = getNews()
  items.unshift(newItem)
  saveNews(items)
  return newItem
}

export function deleteNews(id: string): boolean {
  const items = getNews()
  const filtered = items.filter((item) => item.id !== id)
  if (filtered.length === items.length) return false
  saveNews(filtered)
  return true
}

export function updateNews(id: string, title: string, content: string): boolean {
  const items = getNews()
  const index = items.findIndex((item) => item.id === id)
  if (index === -1) return false
  items[index] = { ...items[index], title, content }
  saveNews(items)
  return true
}

//  ____             _   _            _
// / ___|  ___ _  | |_(_)_    ___| |   
// \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
//  ___) |  / | | | |_| | | | |  / |   
// |____/ \___|_| |_|\|_|_| |_|\___|_| 
// ********************************    
