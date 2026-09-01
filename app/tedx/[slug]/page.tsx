'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, ExternalLink, QrCode, ShieldCheck, ArrowLeft, Linkedin, Twitter, Github, Mail, Award, CheckCircle } from 'lucide-react'
import { getTedxPortfolioBySlug, TedxPortfolio } from '@/lib/actions/tedx'
import { renderQRToCanvas } from '@/lib/utils/qr-canvas'

export default function TedxPublicProfilePage() {
  const params = useParams()
  const slug = params?.slug as string
  const [portfolio, setPortfolio] = useState<TedxPortfolio | null>(null)
  const [loading, setLoading] = useState(true)
  const [showQrModal, setShowQrModal] = useState(false)
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    async function loadPortfolio() {
      if (!slug) return
      setLoading(true)
      const data = await getTedxPortfolioBySlug(slug)
      setPortfolio(data)
      setLoading(false)
    }
    loadPortfolio()
  }, [slug])

  useEffect(() => {
    if (showQrModal && canvasRef.current && portfolio) {
      renderQRToCanvas(canvasRef.current, {
        text: `https://clubeve.nivet2006.in/tedx/${portfolio.slug}`,
        logoSrc: '/tedxlogo-black.png',
        fgColor: '#0a0a0a',
        bgColor: '#ffffff',
        logoRatio: 0.22,
        size: 500,
      })
    }
  }, [showQrModal, portfolio])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center font-mono text-sm">
        <div className="flex items-center gap-3 animate-pulse">
          <Sparkles className="text-red-500" size={20} />
          <span>Loading TEDxGCEM Identity...</span>
        </div>
      </div>
    )
  }

  if (!portfolio || !portfolio.is_active || !portfolio.is_public) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 font-bold font-mono">
          TEDxGCEM
        </div>
        <h1 className="text-2xl font-black tracking-tight">Portfolio Not Found</h1>
        <p className="text-xs font-mono text-zinc-400 max-w-sm">
          The requested TEDxGCEM profile does not exist or has been made private.
        </p>
        <Link
          href="https://clubeve.nivet2006.in"
          className="px-4 py-2 rounded-xl bg-white text-black text-xs font-mono font-bold hover:bg-zinc-200 transition-colors"
        >
          Return to Club Eve
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-red-500 selection:text-white">
      {/* Top Banner */}
      <header className="border-b border-zinc-800 bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/tedxlogo-white.png" alt="TEDxGCEM" className="h-6 object-contain" />
            <span className="font-mono text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
              Verified Crew
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowQrModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
            >
              <QrCode size={14} /> Scan Badge
            </button>
          </div>
        </div>
      </header>

      {/* Main Profile Showcase */}
      <main className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        {/* Profile Card Header */}
        <section className="bg-gradient-to-b from-zinc-900 to-[#121212] border border-zinc-800 rounded-3xl p-8 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            {portfolio.profile_photo_url ? (
              <img
                src={portfolio.profile_photo_url}
                alt={portfolio.display_name}
                className="w-28 h-28 rounded-2xl object-cover border-2 border-red-500/40 shadow-xl"
              />
            ) : (
              <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-red-600 to-rose-900 text-white font-black text-4xl flex items-center justify-center border-2 border-red-500/40 shadow-xl font-mono">
                {portfolio.display_name.charAt(0)}
              </div>
            )}

            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="font-mono text-xs uppercase tracking-wider font-bold text-red-500 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                  {portfolio.team_name || 'TEDxGCEM Operations'}
                </span>
                <span className="font-mono text-xs text-zinc-400">
                  {portfolio.year || 2026} Edition
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                {portfolio.display_name}
              </h1>
              <p className="text-base text-zinc-300 font-semibold">
                {portfolio.role}
              </p>
            </div>
          </div>

          {/* Bio Statement */}
          {portfolio.bio && (
            <div className="pt-4 border-t border-zinc-800 text-sm text-zinc-300 leading-relaxed font-sans">
              <p className="italic">"{portfolio.bio}"</p>
            </div>
          )}

          {/* Verification Badge */}
          <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono text-zinc-400">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle size={14} /> Official TEDxGCEM Member Credentials
            </span>
            <span className="text-zinc-500 hidden sm:inline">
              Host: clubeve.nivet2006.in
            </span>
          </div>
        </section>
      </main>

      {/* QR Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-sm w-full space-y-5 text-center shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <span className="font-mono text-xs font-bold text-red-500">TEDxGCEM QR Badge</span>
              <button onClick={() => setShowQrModal(false)} className="text-zinc-400 hover:text-white font-mono">
                ✕
              </button>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-zinc-200 inline-block shadow-inner">
              <canvas ref={canvasRef} className="w-56 h-56 object-contain" />
            </div>

            <p className="font-mono text-xs text-zinc-400">
              Scan to view <span className="text-white font-bold">{portfolio.display_name}</span>'s profile
            </p>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 rounded-xl bg-white text-black text-xs font-mono font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
