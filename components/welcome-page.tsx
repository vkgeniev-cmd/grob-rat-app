// t.me/SentinelLinks

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, AlertCircle, Newspaper, History, Monitor } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import type { NewsItem } from "@/lib/news"

interface WelcomePageProps {
  serverError?: string | null
  onRefresh?: () => void
}

export function WelcomePage({ serverError, onRefresh }: WelcomePageProps = {}) {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([])

  useEffect(() => {
    loadNews()
  }, [])

  const loadNews = async () => {
    try {
      const response = await fetch("/api/news")
      const data = await response.json()
      setNewsItems(data.news || [])
    } catch (error) {
      console.error("Failed to load news")
    }
  }

  const news = newsItems.filter((item) => item.type === "news").slice(0, 5)
  const changelog = newsItems.filter((item) => item.type === "changelog").slice(0, 5)

// t.me/SentinelLinks
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="flex flex-col items-center justify-center space-y-6 max-w-2xl w-full">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-4 animate-glow">
            <Monitor className="w-10 h-10" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight">Grob rat</h1>
          <p className="text-muted-foreground text-lg">Remote Administration Platform</p>
          <p className="text-sm text-muted-foreground/70">Select a device from the sidebar to begin</p>

// t.me/SentinelLinks
          {serverError && (
            <div className="mt-4 max-w-md mx-auto">
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="flex-1 text-left">
                    <h3 className="text-sm font-semibold text-destructive mb-1">Connection Error</h3>
                    <p className="text-xs text-muted-foreground">{serverError}</p>
                  </div>
                </div>
                {onRefresh && (
                  <Button onClick={onRefresh} variant="outline" className="w-full bg-transparent" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry Connection
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        <Card className="w-full border shadow-lg">
          <Tabs defaultValue="news" className="w-full">
            <CardHeader className="pb-3">
              <TabsList className="grid w-full grid-cols-2 h-10">
                <TabsTrigger value="news" className="gap-2 text-xs">
                  <Newspaper className="w-3.5 h-3.5" />
                  News
                </TabsTrigger>
                <TabsTrigger value="changelog" className="gap-2 text-xs">
                  <History className="w-3.5 h-3.5" />
                  Changelog
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <TabsContent value="news" className="space-y-3 px-6 pb-6 mt-0">
              {news.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground">No news yet</div>
              ) : (
                news.map((item) => (
                  <Card key={item.id} className="border">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm font-semibold">{item.title}</CardTitle>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">{item.author}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {item.content}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="changelog" className="space-y-3 px-6 pb-6 mt-0">
              {changelog.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground">No changelog yet</div>
              ) : (
                changelog.map((item) => (
                  <Card key={item.id} className="border">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm font-semibold">{item.title}</CardTitle>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">{item.author}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {item.content}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}

//  ____             _   _            _
// / ___|  ___ _  | |_(_)_    ___| |   
// \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
//  ___) |  / | | | |_| | | | |  / |   
// |____/ \___|_| |_|\|_|_| |_|\___|_| 
// ********************************    
