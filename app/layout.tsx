import type { Metadata } from 'next'
import { Outfit, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { PatternProvider } from "@/components/shared/PatternProvider";

import { Toaster } from 'sonner'

export const dynamic = 'force-dynamic'

const sans = Outfit({ subsets: ['latin'], variable: '--font-sans' })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: {
    default: 'Club-Eve | College Event Management & Collaboration Portal',
    template: '%s | Club-Eve'
  },
  description: 'Club-Eve is the ultimate event coordination, hackathon submission, attendance tracking, and student club collaboration platform.',
  metadataBase: new URL('https://club-eve.vercel.app'),
  keywords: ['club-eve', 'college event management', 'hackathon evaluation', 'student portal', 'attendance scanner', 'IIC report generator'],
  authors: [{ name: 'Club-Eve Team' }],
  creator: 'Club-Eve Developers',
  publisher: 'Club-Eve',
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://club-eve.vercel.app',
    title: 'Club-Eve | College Event Management Portal',
    description: 'Simplify college event management, team formations, and hackathon submittals with Club-Eve.',
    siteName: 'Club-Eve',
    images: [
      {
        url: '/logo.png',
        width: 512,
        height: 512,
        alt: 'Club-Eve Logo',
      }
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Club-Eve | College Event Management Portal',
    description: 'Simplify college event management, team formations, and hackathon submittals with Club-Eve.',
    images: ['/logo.png'],
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
