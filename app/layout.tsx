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
    default: 'ClubEve | College Event Management & Collaboration Portal',
    template: '%s | ClubEve'
  },
  description: 'ClubEve is the ultimate college event management, hackathon submission, attendance tracking, and student club collaboration portal.',
  metadataBase: new URL('https://club-eve.vercel.app'),
  keywords: [
    'ClubEve',
    'club-eve',
    'college event management',
    'hackathon evaluation',
    'student portal',
    'attendance scanner',
    'IIC report generator'
  ],
  authors: [],
  creator: 'ClubEve Team',
  publisher: 'ClubEve',
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: 's7Nr0V21DnrbKmNKWXGDUMz0Woj3lrH89xvSDIySyHo',
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://club-eve.vercel.app',
    title: 'ClubEve | College Event Management Portal',
    description: 'Simplify college event management, team formations, and hackathon submittals with ClubEve.',
    siteName: 'ClubEve',
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
    title: 'ClubEve | College Event Management Portal',
    description: 'Simplify college event management, team formations, and hackathon submittals with ClubEve.',
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
    <html lang="en" data-theme="light" className={`${sans.variable} ${mono.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('theme');
                  var theme = saved || 'light';
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`font-sans antialiased min-h-screen tracking-tight`}>
        <AuthListener />
        <PatternProvider>{children}</PatternProvider>
        <BugReporterWidget />
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  )
}
