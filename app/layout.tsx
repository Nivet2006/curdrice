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
    default: 'Clubeve by nived | College Event Management & Collaboration Portal',
    template: '%s | Clubeve by nived'
  },
  description: 'Clubeve by nived (nivet2006, nivet.2006, clubeve nivet, clubevenived) is the ultimate college event management, hackathon submission, attendance tracking, and student club collaboration portal developed by nived.',
  metadataBase: new URL('https://club-eve.vercel.app'),
  keywords: [
    'Clubeve by nived',
    'nived',
    'nivet2006',
    'nivet.2006',
    'clubeve nivet',
    'clubevenived',
    'club-eve',
    'college event management',
    'hackathon evaluation',
    'student portal',
    'attendance scanner',
    'IIC report generator'
  ],
  authors: [{ name: 'nived (nivet2006)', url: 'https://github.com/nivet2006' }],
  creator: 'nived (nivet2006)',
  publisher: 'Clubeve by nived',
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
    title: 'Clubeve by nived | College Event Management Portal',
    description: 'Simplify college event management, team formations, and hackathon submittals with Clubeve by nived (nivet2006).',
    siteName: 'Clubeve by nived',
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
    title: 'Clubeve by nived | College Event Management Portal',
    description: 'Simplify college event management, team formations, and hackathon submittals with Clubeve by nived (nivet2006).',
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
