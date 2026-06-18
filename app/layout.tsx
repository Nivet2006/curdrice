import type { Metadata } from 'next'
import { Outfit, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { PatternProvider } from "@/components/shared/PatternProvider";

import { Toaster } from 'sonner'

export const dynamic = 'force-dynamic'

const sans = Outfit({ subsets: ['latin'], variable: '--font-sans' })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'Club-Eve',
  description: 'Club-Eve portal',
  icons: {
    icon: '/logo.png',
  }
}

import { BugReporterWidget } from '@/components/BugReporterWidget'
import AuthListener from '@/components/shared/AuthListener'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className={`font-sans antialiased min-h-screen tracking-tight`}>
        <AuthListener />
        <PatternProvider>{children}</PatternProvider>
        <BugReporterWidget />
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  )
}
