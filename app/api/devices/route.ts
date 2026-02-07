// t.me/SentinelLinks

import { NextResponse } from "next/server"
import { getDevicesByUID, setDeviceOwner } from "@/lib/db-server"

// In-memory device storage (cleared on server restart)
// In production, use Redis or database
const devices = new Map<string, any>()

// WebSocket server URL for querying connected clients
const WS_SERVER_URL = process.env.GROB_WS_SERVER_URL || "http://localhost:8765"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const uid = searchParams.get("uid")

    // Try to get live clients from WebSocket server
    try {
      const response = await fetch(`${WS_SERVER_URL}/clients${uid ? `?uid=${uid}` : ""}`, {
        signal: AbortSignal.timeout(2000),
      })

      if (response.ok) {
        const data = await response.json()

        // Transform to expected format
        const deviceList = data.clients.map((c: any) => ({
          id: c.id,
          name: c.hostname,
          hostname: c.hostname,
          ip: c.ip,
          os: c.os,
          status: "online",
          lastSeen: c.lastSeen,
          hwid: c.id,
        }))

        return NextResponse.json({
          devices: deviceList,
          total: deviceList.length,
          source: "websocket",
        })
      }
    } catch (err) {
      // Silent fallback
    }

    // Fallback to in-memory storage
    const allDevices = Array.from(devices.values())

// t.me/SentinelLinks
    if (uid) {
      const deviceIds = getDevicesByUID(uid)
      const userDevices = allDevices.filter((d: any) => deviceIds.includes(d.id))

      return NextResponse.json({
        devices: userDevices,
        total: userDevices.length,
        uid: uid,
        source: "local",
      })
    }

    return NextResponse.json({
      devices: allDevices,
      total: allDevices.length,
      source: "local",
    })
  } catch (error) {
    return NextResponse.json({ error: "Error getting devices", devices: [] }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { device, userUid } = body

    if (!device) {
      return NextResponse.json({ error: "Missing device data" }, { status: 400 })
    }

// t.me/SentinelLinks
    if (!userUid || userUid === "null" || !userUid.trim()) {
      return NextResponse.json({ error: "Missing or invalid UID" }, { status: 400 })
    }

// t.me/SentinelLinks
    const deviceData = {
      ...device,
      lastSeen: new Date().toISOString(),
      status: "online",
    }

    devices.set(device.id, deviceData)
    setDeviceOwner(device.id, userUid)

    return NextResponse.json({
      success: true,
      device: deviceData,
      message: "Device registered successfully",
    })
  } catch (error) {
    return NextResponse.json({ error: "Error registering device" }, { status: 500 })
  }
}

//  ____             _   _            _
// / ___|  ___ _  | |_(_)_    ___| |   
// \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
//  ___) |  / | | | |_| | | | |  / |   
// |____/ \___|_| |_|\|_|_| |_|\___|_| 
// ********************************    
