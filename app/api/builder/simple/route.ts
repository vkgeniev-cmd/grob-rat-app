import { NextResponse } from "next/server"
import * as fs from "fs"
import * as path from "path"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const userUid = formData.get("userUid") as string
    const fileName = formData.get("fileName") as string || "grob-client"

    if (!userUid) {
      return NextResponse.json({ error: "UID required" }, { status: 400 })
    }

    // Read pre-compiled client template
    const templatePath = path.join(process.cwd(), "client", "template.exe")
    
    if (!fs.existsSync(templatePath)) {
      // Create a simple batch file as fallback
      const batchContent = `@echo off
title GROB Client
echo Connecting to server...
echo Server: wss://glistening-mindfulness.up.railway.app
echo Your UID: ${userUid}
echo.
echo Press any key to exit...
pause > nul`

      return new NextResponse(batchContent, {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
          "Content-Disposition": `attachment; filename="${fileName}.bat"`,
        },
      })
    }

    // Read the executable template
    const exeBuffer = fs.readFileSync(templatePath)

    return new NextResponse(exeBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName}.exe"`,
        "Content-Length": exeBuffer.length.toString(),
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Build failed",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    )
  }
}
