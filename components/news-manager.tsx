// t.me/SentinelLinks

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Save, X } from "lucide-react"
import { toast } from "sonner"
import type { NewsItem } from "@/lib/news"
import type { User } from "@/lib/auth"

// t.me/SentinelLinks
interface NewsManagerProps {
  currentUser: User
}

export function NewsManager({ currentUser }: NewsManagerProps) {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState("")
  const [newContent, setNewContent] = useState("")
  const [newsType, setNewsType] = useState<"news" | "changelog">("news")

  useEffect(() => {
    loadNews()
  }, [])

  const loadNews = async () => {
    try {
      const response = await fetch("/api/news")
      const data = await response.json()
      setNewsItems(data.news || [])
    } catch (error) {
      toast.error("Ошибка загрузки новостей")
    }
  }

  const handleCreate = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error("Заполните все поля")
      return
    }

// t.me/SentinelLinks
    try {
      const response = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          title: newTitle,
          content: newContent,
          author: currentUser.username,
          type: newsType,
        }),
      })

      if (response.ok) {
        setNewTitle("")
        setNewContent("")
        setIsCreating(false)
        await loadNews()
        toast.success("Новость создана")
      }
    } catch (error) {
      toast.error("Ошибка создания новости")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      })

      if (response.ok) {
        await loadNews()
        toast.success("Новость удалена")
      }
    } catch (error) {
      toast.error("Ошибка удаления")
    }
  }

  const news = newsItems.filter((item) => item.type === "news")
  const changelog = newsItems.filter((item) => item.type === "changelog")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Управление новостями</h3>
          <p className="text-sm text-muted-foreground">Создавайте новости и changelog для пользователей</p>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)} className="gap-2">
          {isCreating ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isCreating ? "Отмена" : "Создать"}
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Новая публикация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Тип</Label>
              <Tabs value={newsType} onValueChange={(v) => setNewsType(v as "news" | "changelog")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="news">Новость</TabsTrigger>
                  <TabsTrigger value="changelog">Changelog</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="space-y-2">
              <Label>Заголовок</Label>
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Введите заголовок" />
            </div>
            <div className="space-y-2">
              <Label>Содержание</Label>
              <Textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Введите содержание"
                rows={5}
              />
            </div>
            <Button onClick={handleCreate} className="w-full gap-2">
              <Save className="w-4 h-4" />
              Сохранить
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="news" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="news">Новости ({news.length})</TabsTrigger>
          <TabsTrigger value="changelog">Changelog ({changelog.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="news" className="space-y-3">
          {news.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">Новостей пока нет</p>
              </CardContent>
            </Card>
          ) : (
            news.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{item.title}</CardTitle>
                      <CardDescription>
                        {item.author} • {new Date(item.createdAt).toLocaleDateString("ru-RU")}
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.content}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="changelog" className="space-y-3">
          {changelog.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">Changelog пока нет</p>
              </CardContent>
            </Card>
          ) : (
            changelog.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{item.title}</CardTitle>
                      <CardDescription>
                        {item.author} • {new Date(item.createdAt).toLocaleDateString("ru-RU")}
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.content}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// t.me/SentinelLinks
//  ____             _   _            _
// / ___|  ___ _  | |_(_)_    ___| |   
// \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
//  ___) |  / | | | |_| | | | |  / |   
// |____/ \___|_| |_|\|_|_| |_|\___|_| 
// ********************************    
