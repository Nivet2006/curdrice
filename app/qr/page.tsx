'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  QrCode,
  Download,
  Copy,
  Check,
  Sparkles,
  Sun,
  Moon,
  Palette,
  Link2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Sliders,
  Image as ImageIcon
} from 'lucide-react'
import { renderQRToCanvas, downloadCanvasAsImage } from '@/lib/utils/qr-canvas'
import { toast } from 'sonner'

export default function CustomQRCreatorPage() {
  const [url, setUrl] = useState('https://clubeve.nivet2006.in')
  const [customCode, setCustomCode] = useState('')
  const [title, setTitle] = useState('')
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'custom'>('light')

  // Color Pickers
  const [fgColor, setFgColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#FFFFFF')

  // Logo settings
  const [includeLogo, setIncludeLogo] = useState(true)
  const [logoRatio, setLogoRatio] = useState(0.22)

  // Link redirect creation state
  const [shortUrl, setShortUrl] = useState('')
  const [isCreatingRedirect, setIsCreatingRedirect] = useState(false)
  const [copied, setCopied] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const transparentCanvasRef = useRef<HTMLCanvasElement | null>(null)

  // Handle Preset Theme Changes
  const handleThemeChange = (mode: 'light' | 'dark' | 'custom') => {
    setThemeMode(mode)
    if (mode === 'light') {
      setFgColor('#000000') // Black QR
      setBgColor('#FFFFFF')
    } else if (mode === 'dark') {
      setFgColor('#FFFFFF') // White QR
      setBgColor('#0F172A') // Dark navy canvas
    }
  }

  // Active target for QR code rendering (uses shortUrl if generated, otherwise direct URL)
  const qrTargetText = shortUrl || (url.trim() ? url.trim() : 'https://clubeve.nivet2006.in')

  // Re-render canvas whenever options change
  useEffect(() => {
    if (canvasRef.current) {
      renderQRToCanvas(canvasRef.current, {
        text: qrTargetText,
        fgColor: themeMode === 'light' ? '#000000' : themeMode === 'dark' ? '#FFFFFF' : fgColor,
        bgColor: themeMode === 'light' ? '#FFFFFF' : themeMode === 'dark' ? '#0F172A' : bgColor,
        transparentBg: false,
        logoSrc: includeLogo ? '/logo.png' : '',
        logoRatio,
        size: 1000,
      })
    }

    if (transparentCanvasRef.current) {
      renderQRToCanvas(transparentCanvasRef.current, {
        text: qrTargetText,
        fgColor: themeMode === 'light' ? '#000000' : themeMode === 'dark' ? '#FFFFFF' : fgColor,
        bgColor: themeMode === 'light' ? '#FFFFFF' : themeMode === 'dark' ? '#0F172A' : bgColor,
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
    <div className="min-h-screen bg-[#F8F9FC] dark:bg-[#0B0F19] text-[#1E293B] dark:text-[#F1F5F9] font-sans antialiased transition-colors duration-300">
      {/* Background Decorator */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#003C5E]/5 via-transparent to-[#FFB703]/5 pointer-events-none" />

      {/* Header Banner */}
      <header className="border-b border-[#E2E8F0] dark:border-white/10 bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="ClubEve Logo" className="w-9 h-9 object-contain" />
            <div>
              <h1 className="font-bold text-lg leading-tight flex items-center gap-2">
                ClubEve QR Studio
                <span className="text-[10px] font-mono uppercase bg-[#003C5E] text-white px-2 py-0.5 rounded-full">
                  Public
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Custom branded QR generator with background removal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://clubeve.nivet2006.in"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-[#003C5E] flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
            >
              Main Site <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Panel (Left - 7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Destination URL & Redirect Setup */}
            <section className="bg-white dark:bg-[#151C2C] p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                <h2 className="font-semibold text-base flex items-center gap-2">
                  <Link2 className="text-[#003C5E] dark:text-[#FFB703]" size={18} />
                  1. Target Link & Redirector
                </h2>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                  <ShieldCheck size={12} /> Public Access
                </span>
              </div>

              <form onSubmit={handleCreateRedirect} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
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
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F19] text-sm focus:outline-none focus:ring-2 focus:ring-[#003C5E] transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                      Custom Short Slug (Optional)
                    </label>
                    <div className="flex items-center">
                      <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 px-2.5 py-2.5 rounded-l-xl border border-r-0 border-slate-200 dark:border-white/10">
                        /r/
                      </span>
                      <input
                        type="text"
                        value={customCode}
                        onChange={(e) => setCustomCode(e.target.value.replace(/\s+/g, '-'))}
                        placeholder="annual-fest"
                        className="w-full px-3 py-2.5 rounded-r-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F19] text-sm focus:outline-none focus:ring-2 focus:ring-[#003C5E]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                      Campaign Title (Optional)
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Spring Fest Poster QR"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F19] text-sm focus:outline-none focus:ring-2 focus:ring-[#003C5E]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isCreatingRedirect}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#003C5E] hover:bg-[#002B45] text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  {isCreatingRedirect ? (
                    <RefreshCw className="animate-spin" size={16} />
                  ) : (
                    <Sparkles size={16} />
                  )}
                  {shortUrl ? 'Update Redirect Short Link' : 'Generate Custom Redirector Link (/r/...)'}
                </button>
              </form>

              {/* Display Generated Short URL */}
              {shortUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3"
                >
                  <div className="truncate">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Redirect Link Active
                    </p>
                    <p className="text-sm font-mono font-bold text-slate-900 dark:text-white truncate">
                      {shortUrl}
                    </p>
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium flex items-center gap-1.5 hover:bg-emerald-700 transition-colors"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </motion.div>
              )}
            </section>

            {/* Step 2: Theme Presets & Custom Styling */}
            <section className="bg-white dark:bg-[#151C2C] p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm space-y-6">
              <div className="border-b border-slate-100 dark:border-white/5 pb-3">
                <h2 className="font-semibold text-base flex items-center gap-2">
                  <Palette className="text-[#003C5E] dark:text-[#FFB703]" size={18} />
                  2. Theme & Color Styling
                </h2>
              </div>

              {/* Theme Mode Selector Buttons */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                  Theme Presets
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {/* Light Theme (Black QR) */}
                  <button
                    type="button"
                    onClick={() => handleThemeChange('light')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                      themeMode === 'light'
                        ? 'border-[#003C5E] bg-[#003C5E]/5 ring-2 ring-[#003C5E]/20 font-bold'
                        : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100'
                    }`}
                  >
                    <Sun size={20} className="text-slate-900 dark:text-white" />
                    <span className="text-xs">Light Theme</span>
                    <span className="text-[10px] text-slate-500 font-mono">(Black QR)</span>
                  </button>

                  {/* Dark Theme (White QR) */}
                  <button
                    type="button"
                    onClick={() => handleThemeChange('dark')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                      themeMode === 'dark'
                        ? 'border-[#FFB703] bg-[#FFB703]/10 ring-2 ring-[#FFB703]/30 font-bold'
                        : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100'
                    }`}
                  >
                    <Moon size={20} className="text-[#FFB703]" />
                    <span className="text-xs">Dark Theme</span>
                    <span className="text-[10px] text-slate-500 font-mono">(White QR)</span>
                  </button>

                  {/* Custom Colors */}
                  <button
                    type="button"
                    onClick={() => handleThemeChange('custom')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                      themeMode === 'custom'
                        ? 'border-[#007F6E] bg-[#007F6E]/10 ring-2 ring-[#007F6E]/30 font-bold'
                        : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100'
                    }`}
                  >
                    <Palette size={20} className="text-[#007F6E]" />
                    <span className="text-xs">Custom Palette</span>
                    <span className="text-[10px] text-slate-500 font-mono">(Pick Colors)</span>
                  </button>
                </div>
              </div>

              {/* Custom Color Pickers (Visible when custom mode active) */}
              {themeMode === 'custom' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10"
                >
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      QR Foreground Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={fgColor}
                        onChange={(e) => setFgColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={fgColor}
                        onChange={(e) => setFgColor(e.target.value)}
                        className="w-full text-xs font-mono px-2 py-1 rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Canvas Background Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-full text-xs font-mono px-2 py-1 rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Logo Overlay Settings */}
              <div className="pt-2 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold flex items-center gap-2">
                    <ImageIcon size={16} className="text-slate-500" /> ClubEve Logo Overlay
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeLogo}
                      onChange={(e) => setIncludeLogo(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:peer-checked:after:border-slate-600 peer-checked:bg-[#003C5E]"></div>
                  </label>
                </div>

                {includeLogo && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-white/10 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400">Logo Scale Size</span>
                      <span className="font-mono">{Math.round(logoRatio * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.15"
                      max="0.30"
                      step="0.01"
                      value={logoRatio}
                      onChange={(e) => setLogoRatio(parseFloat(e.target.value))}
                      className="w-full accent-[#003C5E]"
                    />
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Live Preview & Export Panel (Right - 5 cols) */}
          <div className="lg:col-span-5 sticky top-24 space-y-6">
            <section className="bg-white dark:bg-[#151C2C] p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-lg space-y-6 flex flex-col items-center">
              <div className="w-full flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <QrCode className="text-[#003C5E] dark:text-[#FFB703]" size={18} />
                  Live Preview
                </h3>
                <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                  {themeMode.toUpperCase()}
                </span>
              </div>

              {/* Rendered Visible Canvas Container */}
              <div
                className={`p-6 rounded-2xl border shadow-inner flex items-center justify-center transition-all ${
                  themeMode === 'dark'
                    ? 'bg-[#0F172A] border-slate-800'
                    : 'bg-white border-slate-200'
                }`}
              >
                <canvas
                  ref={canvasRef}
                  className="w-64 h-64 sm:w-72 sm:h-72 object-contain rounded-lg shadow-sm"
                />
              </div>

              {/* Hidden Canvas for Transparent Export */}
              <canvas ref={transparentCanvasRef} className="hidden" />

              <p className="text-center text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                Scanning this QR redirects directly to:{' '}
                <span className="font-mono text-slate-700 dark:text-slate-300 break-all block mt-0.5">
                  {qrTargetText}
                </span>
              </p>

              {/* Download Action Buttons */}
              <div className="w-full space-y-3 pt-2">
                {/* 1. Download Standard PNG with Background */}
                <button
                  onClick={() => handleDownload(true)}
                  className="w-full py-3 px-4 rounded-xl bg-[#003C5E] hover:bg-[#002A43] text-white text-sm font-semibold shadow-md flex items-center justify-center gap-2 transition-all"
                >
                  <Download size={16} />
                  Download Standard QR (With Background)
                </button>

                {/* 2. Download Transparent Background PNG */}
                <button
                  onClick={() => handleDownload(false)}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-sm font-semibold shadow-md flex items-center justify-center gap-2 transition-all"
                >
                  <Download size={16} />
                  Download QR Without Background (Transparent PNG)
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
