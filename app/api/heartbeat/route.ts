import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { uid, status } = body

    if (!uid) {
      return NextResponse.json({ error: "UID required" }, { status: 400 })
    }

    // Update device status in database
    console.log(`Heartbeat from ${uid}: ${status}`)

    return NextResponse.json({ 
      success: true, 
      message: "Heartbeat received" 
    })
  } catch (error: any) {
    console.error("Heartbeat error:", error)
    return NextResponse.json(
      { error: "Heartbeat failed", details: error.message },
      { status: 500 }
    )
  }
}
