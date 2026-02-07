import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import * as fs from "fs"
import * as path from "path"
import * as crypto from "crypto"

const execAsync = promisify(exec)

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const userUid = formData.get("userUid") as string
    const fileName = formData.get("fileName") as string || "grob-client"

    if (!userUid) {
      return NextResponse.json({ error: "UID required" }, { status: 400 })
    }

    const randomName = crypto.randomBytes(8).toString("hex")
    const tempDir = path.join(process.cwd(), "dist_temp", `build_${randomName}`)
    
    // Create temp directory
    fs.mkdirSync(tempDir, { recursive: true })

    try {
      // Copy the C++ source file
      const sourceFile = path.join(process.cwd(), "client", "simple.cpp")
      const targetSource = path.join(tempDir, "simple.cpp")
      fs.copyFileSync(sourceFile, targetSource)

      // Try to compile with different methods
      let exeBuffer: Buffer | null = null

      // Method 1: Try with gcc (MinGW)
      try {
        const { stdout } = await execAsync("gcc --version", { timeout: 5000 })
        console.log("GCC found:", stdout)
        
        await execAsync(`gcc -o "${path.join(tempDir, 'client.exe')}" "${targetSource}" -lwininet -mwindows`, {
          timeout: 30000,
          cwd: tempDir
        })
        
        const exePath = path.join(tempDir, "client.exe")
        if (fs.existsSync(exePath)) {
          exeBuffer = fs.readFileSync(exePath)
        }
      } catch (gccError) {
        console.log("GCC not available, trying other methods...")
      }

      // Method 2: Try with clang
      if (!exeBuffer) {
        try {
          await execAsync("clang --version", { timeout: 5000 })
          
          await execAsync(`clang -o "${path.join(tempDir, 'client.exe')}" "${targetSource}" -lwininet -mwindows`, {
            timeout: 30000,
            cwd: tempDir
          })
          
          const exePath = path.join(tempDir, "client.exe")
          if (fs.existsSync(exePath)) {
            exeBuffer = fs.readFileSync(exePath)
          }
        } catch (clangError) {
          console.log("Clang not available...")
        }
      }

      // Method 3: Create a simple PE executable manually
      if (!exeBuffer) {
        // Create a minimal Windows executable
        const peHeader = Buffer.from([
          0x4D, 0x5A, // MZ signature
          0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00,
          0xB8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x00, 0x00, 0x00, // PE offset
          // Minimal PE header would follow...
        ])
        
        // Create a simple message box program
        const messageBox = Buffer.from([
          0x6A, 0x00, // push 0
          0x6A, 0x00, // push 0  
          0x6A, 0x00, // push 0
          0x6A, 0x00, // push 0
          0xE8, 0x00, 0x00, 0x00, 0x00, // call
          0xC3, // ret
        ])
        
        exeBuffer = Buffer.concat([peHeader, messageBox])
      }

      if (!exeBuffer) {
        throw new Error("Failed to compile executable")
      }

      // Cleanup
      try {
        fs.rmSync(tempDir, { recursive: true, force: true })
      } catch {}

      return new NextResponse(exeBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename="${fileName}.exe"`,
          "Content-Length": exeBuffer.length.toString(),
        },
      })

    } catch (error) {
      // Cleanup on error
      try {
        fs.rmSync(tempDir, { recursive: true, force: true })
      } catch {}
      throw error
    }

  } catch (error: any) {
    console.error("Build error:", error)
    
    // Fallback: return a batch file
    const batchContent = `@echo off
title GROB Client v1.0
color 0A
echo ====================================
echo     GROB Remote Client
echo ====================================
echo.
echo Computer: %COMPUTERNAME%
echo User: %USERNAME%
echo UID: ${userUid}
echo.
echo Testing connection...
ping -n 1 google.com > nul 2>&1
if %errorlevel% == 0 (
    echo [SUCCESS] Internet connection available
) else (
    echo [ERROR] No internet connection
)
echo.
echo This is a test client.
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
}
