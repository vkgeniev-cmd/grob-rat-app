import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const userUid = formData.get("userUid") as string
    const fileName = formData.get("fileName") as string || "grob-client"

    if (!userUid) {
      return NextResponse.json({ error: "UID required" }, { status: 400 })
    }

    // Create the MOST SIMPLE batch file EVER
    const batchContent = `@echo off
echo GROB CLIENT WORKS!
echo Computer: %COMPUTERNAME%
echo User: %USERNAME%
echo UID: ${userUid}
echo.
echo SUCCESS! Client is running!
pause`

    return new NextResponse(batchContent, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": `attachment; filename="${fileName}.bat"`,
      },
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: "Build failed", details: error.message },
      { status: 500 }
    )
  }
}
