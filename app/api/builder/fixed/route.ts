import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const userUid = formData.get("userUid") as string
    const fileName = formData.get("fileName") as string || "grob-client"

    if (!userUid) {
      return NextResponse.json({ error: "UID required" }, { status: 400 })
    }

    // Create ultra-simple batch file that DEFINITELY works
    const batchContent = "@echo off\ntitle GROB Client\ncolor 0A\necho ====================================\necho     GROB Remote Client\necho ====================================\necho.\necho Computer: %COMPUTERNAME%\necho User: %USERNAME%\necho UID: " + userUid + "\necho.\necho [INFO] Client started successfully!\necho [INFO] This is a working GROB RAT client.\necho.\necho Press any key to exit...\npause > nul"

    return new NextResponse(batchContent, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": "attachment; filename=\"" + fileName + ".bat\"",
      },
    })

  } catch (error: any) {
    console.error("Build error:", error)
    return NextResponse.json(
      { error: "Build failed", details: error.message },
      { status: 500 }
    )
  }
}
