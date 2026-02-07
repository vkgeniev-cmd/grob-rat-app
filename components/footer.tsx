// t.me/SentinelLinks

// t.me/SentinelLinks
"use client"

import { getLicenseRemainingTime, type User } from "@/lib/auth"
import { Clock, Key } from "lucide-react"

interface FooterProps {
  user: User | null
}

// t.me/SentinelLinks
export function Footer({ user }: FooterProps) {
  const remainingTime = getLicenseRemainingTime(user)

  if (!user || !remainingTime) return null

  const licenseKey = (user as any).license_key || user.licenseKey

  return (
    <div className="fixed bottom-0 left-0 right-0 h-7 bg-background/80 backdrop-blur-sm border-t flex items-center justify-center gap-3 text-[10px] text-muted-foreground z-50">
      <div className="flex items-center gap-1">
        <Key className="w-3 h-3" />
        <span>License: {licenseKey?.slice(0, 8)}...</span>
      </div>
      <div className="w-px h-3 bg-border" />
      <div className="flex items-center gap-1">
        <Clock className="w-3 h-3" />
        <span>Time left: {remainingTime}</span>
      </div>
    </div>
  )
}

//  ____             _   _            _
// / ___|  ___ _  | |_(_)_    ___| |   
// \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
//  ___) |  / | | | |_| | | | |  / |   
// |____/ \___|_| |_|\|_|_| |_|\___|_| 
// ********************************    
