// t.me/SentinelLinks

import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

// t.me/SentinelLinks
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Grob rat - Remote Administration",
  description: "Professional remote device management and control platform",
  generator: "v0.app",
  icons: null,
}

// t.me/SentinelLinks
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark theme-purple">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('grob-theme') || 'dark';
                  const scheme = localStorage.getItem('grob-color-scheme') || 'purple';
                  
                  const html = document.documentElement;
                  
                  if (theme === 'dark') {
                    html.classList.add('dark');
                  } else {
                    html.classList.remove('dark');
                  }
                  
                  html.classList.remove('theme-blue', 'theme-purple', 'theme-green', 'theme-red', 'theme-pink', 'theme-orange', 'theme-cyan');
                  html.classList.add('theme-' + scheme);
                } catch (e) {
                  console.error('Theme loading error:', e);
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}

// t.me/SentinelLinks
//  ____             _   _            _
// / ___|  ___ _  | |_(_)_    ___| |   
// \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
//  ___) |  / | | | |_| | | | |  / |   
// |____/ \___|_| |_|\|_|_| |_|\___|_| 
// ********************************    
