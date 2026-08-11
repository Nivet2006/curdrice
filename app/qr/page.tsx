'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  QrCode,
  Download,
  Copy,
  Check,
  Sun,
  Moon,
  Palette,
  Link2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react'
import { renderQRToCanvas, downloadCanvasAsImage } from '@/lib/utils/qr-canvas'
import { toast } from 'sonner'
import { Navbar } from '@/components/shared/Navbar'
import { supabase } from '@/lib/supabase/client'

export default function CustomQRCreatorPage() {
  const [role, setRole] = useState<any>(null)
  const [name, setName] = useState<string>('')

  const [url, setUrl] = useState('https://clubeve.nivet2006.in')
  const [customCode, setCustomCode] = useState('')
  const [title, setTitle] = useState('')
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'custom'>('light')

  // Color Pickers
  const [fgColor, setFgColor] = useState('#0a0a0a')
  const [bgColor, setBgColor] = useState('#ffffff')

  // Logo settings
  const [includeLogo, setIncludeLogo] = useState(true)
  const [logoRatio, setLogoRatio] = useState(0.22)

  // Link redirect creation state
  const [shortUrl, setShortUrl] = useState('')
  const [isCreatingRedirect, setIsCreatingRedirect] = useState(false)
  const [copied, setCopied] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const transparentCanvasRef = useRef<HTMLCanvasElement | null>(null)

  // Check user role on load for Navbar compatibility
  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', user.id)
          .single()

        if (profile) {
          setRole(profile.role)
          setName(profile.full_name)
        }
      }
    }
    loadUser()
  }, [])

  // Handle Preset Theme Changes
  const handleThemeChange = (mode: 'light' | 'dark' | 'custom') => {
    setThemeMode(mode)
    if (mode === 'light') {
      setFgColor('#0a0a0a') // Black QR
      setBgColor('#ffffff')
    } else if (mode === 'dark') {
      setFgColor('#ffffff') // White QR
      setBgColor('#141414') // Dark card canvas
    }
  }

  // Active target for QR code rendering
  const qrTargetText = shortUrl || (url.trim() ? url.trim() : 'https://clubeve.nivet2006.in')

  // Re-render canvas whenever options change
  useEffect(() => {
    if (canvasRef.current) {
      renderQRToCanvas(canvasRef.current, {
        text: qrTargetText,
        fgColor: themeMode === 'light' ? '#0a0a0a' : themeMode === 'dark' ? '#ffffff' : fgColor,
        bgColor: themeMode === 'light' ? '#ffffff' : themeMode === 'dark' ? '#141414' : bgColor,
        transparentBg: false,
        logoSrc: includeLogo ? '/logo.png' : '',
        logoRatio,
        size: 1000,
      })
    }

    if (transparentCanvasRef.current) {
      renderQRToCanvas(transparentCanvasRef.current, {
        text: qrTargetText,
        fgColor: themeMode === 'light' ? '#0a0a0a' : themeMode === 'dark' ? '#ffffff' : fgColor,
        bgColor: themeMode === 'light' ? '#ffffff' : themeMode === 'dark' ? '#141414' : bgColor,
        transparentBg: true,
        logoSrc: includeLogo ? '/logo.png' : '',
        logoRatio,
        size: 1000,
      })
    }
  }, [qrTargetText, themeMode, fgColor, bgColor, includeLogo, logoRatio])

  // Create Short Redirect Link
  const handleCreateRedirect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) {
      toast.error('Please enter a destination URL')
      return
    }

    setIsCreatingRedirect(true)
    try {
      const res = await fetch('/api/qr/redirect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination_url: url,
          title: title || undefined,
          custom_code: customCode || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create redirect link')
      }

      setShortUrl(data.short_url)
      toast.success('Custom redirect link generated successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Error generating link')
    } finally {
      setIsCreatingRedirect(false)
    }
  }

  // Download QR Code Handler
  const handleDownload = (withBackground: boolean) => {
    const targetCanvas = withBackground ? canvasRef.current : transparentCanvasRef.current
    if (!targetCanvas) return
    const modeSuffix = withBackground ? `${themeMode}-bg` : 'no-bg-transparent'
    downloadCanvasAsImage(targetCanvas, `clubeve-qr-${modeSuffix}.png`)
    toast.success(withBackground ? 'Downloaded QR Code with background!' : 'Downloaded Transparent QR Code!')
  }

  // Copy Short Link
  const handleCopyLink = () => {
    if (!shortUrl) return
    navigator.clipboard.writeText(shortUrl)
    setCopied(true)
    toast.success('Short redirect URL copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] transition-colors duration-200">
      {/* Platform Standard Navigation Bar */}
      <Navbar role={role} name={name} />

      {/* Main Content Area */}
      <main className="max-w-[1280px] mx-auto px-4 md:px-8 py-10 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-[var(--border)] pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-black tracking-tight text-[var(--fg)]">
                QR Studio
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://clubeve.nivet2006.in"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-mono font-bold uppercase tracking-wider px-4 py-2 rounded-xl border border-[var(--border)] hover:border-[var(--fg)] transition-all flex items-center gap-2 bg-[var(--bg-card)]"
            >
              Main Site <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {/* Studio Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Column (Left - 7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Card 1: Target Link & Redirector */}
            <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[2rem] p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
                  <Link2 size={20} className="text-[var(--fg)]" />
                  1. Target Link & Redirector
                </h2>
                <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1">
                  <ShieldCheck size={12} /> Public
                </span>
              </div>

              <form onSubmit={handleCreateRedirect} className="space-y-4">
                <div>
                  <label className="block font-mono text-xs uppercase tracking-wider text-[var(--fg-muted)] mb-1.5 font-semibold">
                    Destination URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value)
                      setShortUrl('')
                    }}
                    placeholder="https://clubeve.nivet2006.in/events/my-event"
                    className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] text-sm font-sans focus:outline-none focus:border-[var(--fg)] transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-[var(--fg-muted)] mb-1.5 font-semibold">
                      Custom Short Slug (Optional)
                    </label>
                    <div className="flex items-center">
                      <span className="font-mono text-xs bg-[var(--bg-subtle)] text-[var(--fg-muted)] px-3 py-3 rounded-l-xl border border-r-0 border-[var(--border)] font-semibold">
                        /r/
                      </span>
                      <input
                        type="text"
                        value={customCode}
                        onChange={(e) => setCustomCode(e.target.value.replace(/\s+/g, '-'))}
                        placeholder="fest-2026"
                        className="w-full px-3 py-3 rounded-r-xl border border-[var(--border)] bg-[var(--bg-subtle)] text-sm focus:outline-none focus:border-[var(--fg)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-[var(--fg-muted)] mb-1.5 font-semibold">
                      Title / Label (Optional)
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Hackathon Poster QR"
                      className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] text-sm focus:outline-none focus:border-[var(--fg)]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isCreatingRedirect}
                  className="w-full py-3 px-4 rounded-xl bg-[var(--fg)] text-[var(--bg)] text-sm font-bold tracking-tight hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  {isCreatingRedirect ? (
                    <RefreshCw className="animate-spin" size={16} />
                  ) : (
                    <Sparkles size={16} />
                  )}
                  {shortUrl ? 'Update Redirect Link' : 'Generate Short Redirect Link (/r/...)'}
                </button>
              </form>

              {/* Display Short Redirect URL if generated */}
              {shortUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3"
                >
                  <div className="truncate">
                    <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-emerald-600 dark:text-emerald-400">
                      Redirect Link Active
                    </p>
                    <p className="text-sm font-mono font-bold text-[var(--fg)] truncate">
                      {shortUrl}
                    </p>
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="flex-shrink-0 px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold font-mono flex items-center gap-1.5 hover:bg-emerald-700 transition-colors"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'COPIED' : 'COPY'}
                  </button>
                </motion.div>
              )}
            </section>

            {/* Card 2: Theme Presets & Custom Palette */}
            <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[2rem] p-6 shadow-sm space-y-6">
              <div className="border-b border-[var(--border)] pb-4">
                <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
                  <Palette size={20} className="text-[var(--fg)]" />
                  2. Theme Presets & Styling
                </h2>
              </div>

              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-[var(--fg-muted)] mb-3 font-semibold">
                  Theme Presets
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {/* Light Theme */}
                  <button
                    type="button"
                    onClick={() => handleThemeChange('light')}
                    className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                      themeMode === 'light'
                        ? 'border-[var(--fg)] bg-[var(--bg-subtle)] font-bold shadow-sm'
                        : 'border-[var(--border)] hover:border-[var(--fg-muted)]'
                    }`}
                  >
                    <Sun size={20} />
                    <span className="text-xs font-semibold">Light Theme</span>
                    <span className="font-mono text-[10px] text-[var(--fg-muted)]">(BLACK QR)</span>
                  </button>

                  {/* Dark Theme */}
                  <button
                    type="button"
                    onClick={() => handleThemeChange('dark')}
                    className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                      themeMode === 'dark'
                        ? 'border-[var(--fg)] bg-[var(--bg-subtle)] font-bold shadow-sm'
                        : 'border-[var(--border)] hover:border-[var(--fg-muted)]'
                    }`}
                  >
                    <Moon size={20} />
                    <span className="text-xs font-semibold">Dark Theme</span>
                    <span className="font-mono text-[10px] text-[var(--fg-muted)]">(WHITE QR)</span>
                  </button>

                  {/* Custom Palette */}
                  <button
                    type="button"
                    onClick={() => handleThemeChange('custom')}
                    className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                      themeMode === 'custom'
                        ? 'border-[var(--fg)] bg-[var(--bg-subtle)] font-bold shadow-sm'
                        : 'border-[var(--border)] hover:border-[var(--fg-muted)]'
                    }`}
                  >
                    <Palette size={20} />
                    <span className="text-xs font-semibold">Custom</span>
                    <span className="font-mono text-[10px] text-[var(--fg-muted)]">(Pick Colors)</span>
                  </button>
                </div>
              </div>

              {/* Custom Color Pickers */}
              {themeMode === 'custom' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)]"
                >
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-[var(--fg-muted)] mb-1.5 font-semibold">
                      QR Foreground Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={fgColor}
                        onChange={(e) => setFgColor(e.target.value)}
                        className="w-9 h-9 rounded-lg cursor-pointer border-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={fgColor}
                        onChange={(e) => setFgColor(e.target.value)}
                        className="w-full font-mono text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-[var(--fg-muted)] mb-1.5 font-semibold">
                      Canvas Background Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-9 h-9 rounded-lg cursor-pointer border-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-full font-mono text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)]"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Logo Overlay Toggle & Scaling */}
              <div className="space-y-4 pt-2 border-t border-[var(--border)]">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold flex items-center gap-2">
                    <ImageIcon size={18} className="text-[var(--fg-muted)]" />
                    ClubEve Branding Logo Overlay
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeLogo}
                      onChange={(e) => setIncludeLogo(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--fg)]"></div>
                  </label>
                </div>

                {includeLogo && (
                  <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)] space-y-2">
                    <div className="flex justify-between font-mono text-xs">
                      <span className="text-[var(--fg-muted)]">Logo Scale Ratio</span>
                      <span className="font-bold">{Math.round(logoRatio * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.15"
                      max="0.30"
                      step="0.01"
                      value={logoRatio}
                      onChange={(e) => setLogoRatio(parseFloat(e.target.value))}
                      className="w-full accent-[var(--fg)]"
                    />
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Live Canvas Preview & Export Column (Right - 5 Cols) */}
          <div className="lg:col-span-5 sticky top-24 space-y-6">
            <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[2rem] p-6 shadow-sm space-y-6 flex flex-col items-center">
              <div className="w-full flex items-center justify-between border-b border-[var(--border)] pb-3">
                <h3 className="text-base font-bold tracking-tight flex items-center gap-2">
                  <QrCode size={18} />
                  Live Preview
                </h3>
                <span className="font-mono text-[10px] uppercase tracking-widest bg-[var(--bg-subtle)] border border-[var(--border)] px-2.5 py-0.5 rounded-full font-bold">
                  {themeMode.toUpperCase()}
                </span>
              </div>

              {/* Visible Render Canvas */}
              <div
                className={`p-6 rounded-2xl border border-[var(--border)] shadow-sm flex items-center justify-center ${
                  themeMode === 'dark' ? 'bg-[#141414]' : 'bg-white'
                }`}
              >
                <canvas
                  ref={canvasRef}
                  className="w-64 h-64 sm:w-72 sm:h-72 object-contain rounded-lg"
                />
              </div>

              {/* Offscreen Canvas for Transparent Output */}
              <canvas ref={transparentCanvasRef} className="hidden" />

              <p className="text-center font-mono text-xs text-[var(--fg-muted)] max-w-xs break-all">
                Destination Target:{' '}
                <span className="text-[var(--fg)] font-bold block mt-0.5">
                  {qrTargetText}
                </span>
              </p>

              {/* Action Buttons */}
              <div className="w-full space-y-3 pt-2">
                <button
                  onClick={() => handleDownload(true)}
                  className="w-full py-3 px-4 rounded-xl bg-[var(--fg)] text-[var(--bg)] text-xs font-mono uppercase tracking-wider font-bold shadow-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  Download With Background
                </button>

                <button
                  onClick={() => handleDownload(false)}
                  className="w-full py-3 px-4 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] hover:border-[var(--fg)] text-[var(--fg)] text-xs font-mono uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  Download Without Background (Transparent)
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
