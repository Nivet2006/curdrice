import type { Metadata } from 'next'
import { Outfit, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { PatternProvider } from "@/components/shared/PatternProvider";

import { Toaster } from 'sonner'

const sans = Outfit({ subsets: ['latin'], variable: '--font-sans' })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'Club-Eve',
  description: 'Mini Project Sem 4',
  icons: {
    icon: '/apple-icon.png',
  }
}

import { BugReporterWidget } from '@/components/BugReporterWidget'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className={`font-sans antialiased min-h-screen tracking-tight`}>
        <PatternProvider>{children}</PatternProvider>
        <BugReporterWidget />
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  )
}
