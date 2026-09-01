'use client'

import React, { useState, useEffect, useRef, Suspense } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
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
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Sliders,
  ShieldAlert,
  Layers,
  CheckCircle2
} from 'lucide-react'
import {
  renderQRToCanvas,
  downloadCanvasAsImage,
  LogoBgStyle,
  GradientDirection,
  analyzeQRReadability,
  getLuminance
} from '@/lib/utils/qr-canvas'
import { toast } from 'sonner'
import { Navbar } from '@/components/shared/Navbar'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { supabase } from '@/lib/supabase/client'

function QROptionsQueryHandler({
  setSelectedTedxSlug,
  setUrl,
  setIncludeLogo,
  setLogoOption
}: {
  setSelectedTedxSlug: (slug: string) => void
  setUrl: (url: string) => void
  setIncludeLogo: (inc: boolean) => void
  setLogoOption: (opt: 'clubeve' | 'onepercent' | 'tedx') => void
}) {
  const searchParams = useSearchParams()
  const slug = searchParams.get('slug')
  const logo = searchParams.get('logo')

  useEffect(() => {
    if (slug) {
      setSelectedTedxSlug(slug)
      setUrl(`https://clubeve.nivet2006.in/tedx/${slug}`)
    }
    if (logo === 'tedx' || slug) {
      setIncludeLogo(true)
      setLogoOption('tedx')
    }
  }, [slug, logo, setSelectedTedxSlug, setUrl, setIncludeLogo, setLogoOption])

  return null
}

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

  // Base Logo settings
  const [includeLogo, setIncludeLogo] = useState(true)
  const [selectedLogo, setSelectedLogo] = useState<string>('/logo.png')
  const [logoOption, setLogoOption] = useState<'clubeve' | 'onepercent' | 'tedx'>('clubeve')
  const [logoRotation, setLogoRotation] = useState<number>(15)
  const [logoRatio, setLogoRatio] = useState(0.16)
  const [showLogoBg, setShowLogoBg] = useState(false)
  const [logoOpacity, setLogoOpacity] = useState(1.0)
  const [logoGlow, setLogoGlow] = useState(false)
  const [logoGlowColor, setLogoGlowColor] = useState('#eb0028')
  const [logoGlowBlur, setLogoGlowBlur] = useState(20)

  // Advanced TEDx Branding state
  const [logoBgStyle, setLogoBgStyle] = useState<LogoBgStyle>('adaptive')
  const [logoPadding, setLogoPadding] = useState<number>(10)
  const [logoRadius, setLogoRadius] = useState<number>(16)
  const [borderWidth, setBorderWidth] = useState<number>(2)
  const [bgColorMode, setBgColorMode] = useState<'auto' | 'white' | 'black' | 'custom'>('auto')
  const [customBgColor, setCustomBgColor] = useState<string>('#ffffff')
  const [borderColorMode, setBorderColorMode] = useState<'auto' | 'white' | 'black' | 'custom'>('auto')
  const [customBorderColor, setCustomBorderColor] = useState<string>('#000000')
  const [gradientStart, setGradientStart] = useState<string>('#eb0028')
  const [gradientEnd, setGradientEnd] = useState<string>('#000000')
  const [gradientDirection, setGradientDirection] = useState<GradientDirection>('diagonal')

  // Dynamic TEDx Portfolio state
  const [tedxPortfolios, setTedxPortfolios] = useState<any[]>([])
  const [selectedTedxSlug, setSelectedTedxSlug] = useState<string>('')

  // Link redirect creation state
  const [shortUrl, setShortUrl] = useState('')
  const [isCreatingRedirect, setIsCreatingRedirect] = useState(false)
  const [copied, setCopied] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const transparentCanvasRef = useRef<HTMLCanvasElement | null>(null)

  // Check user role and load TEDx portfolios on load
  useEffect(() => {
    async function loadUserAndPortfolios() {
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

      const { data: portfolios } = await supabase
        .from('tedx_portfolios')
        .select('*')
        .eq('is_active', true)
        .order('display_name', { ascending: true })

      if (portfolios && portfolios.length > 0) {
        setTedxPortfolios(portfolios)
      }
    }
    loadUserAndPortfolios()
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

  // Determine effective canvas background luminance & active dark/light mode
  const effectiveBgHex = themeMode === 'light' ? '#ffffff' : themeMode === 'dark' ? '#141414' : bgColor
  const effectiveFgHex = themeMode === 'light' ? '#0a0a0a' : themeMode === 'dark' ? '#ffffff' : fgColor
  const isCanvasDark = getLuminance(effectiveBgHex) < 0.5

  // Determine actual effective logo asset path based on logoOption and actual canvas theme contrast
  const getEffectiveLogoSrc = () => {
    if (logoOption === 'clubeve') return '/logo.png'
    if (logoOption === 'onepercent') return '/onepercent.png'
    if (logoOption === 'tedx') {
      // Dark QR / Light Canvas -> tedxlogo-black.png
      // Light QR / Dark Canvas -> tedxlogo-white.png
      return isCanvasDark ? '/tedxlogo-white.png' : '/tedxlogo-black.png'
    }
    return selectedLogo
  }

  const effectiveLogoSrc = getEffectiveLogoSrc()

  // Apply TEDx Branding Presets
  const applyTedxPreset = (presetKey: string) => {
    setLogoOption('tedx')
    setIncludeLogo(true)

    switch (presetKey) {
      case 'clean':
        setLogoBgStyle('none')
        setLogoRotation(0)
        setLogoRatio(0.16)
        setLogoPadding(4)
        setLogoOpacity(1.0)
        break
      case 'classic':
        setLogoBgStyle('square')
        setLogoRotation(0)
        setLogoRatio(0.16)
        setLogoPadding(8)
        setBgColorMode('auto')
        setLogoOpacity(1.0)
        break
      case 'diagonal':
        setLogoBgStyle('adaptive')
        setLogoRotation(15)
        setLogoRatio(0.16)
        setLogoPadding(10)
        setLogoRadius(14)
        setBgColorMode('auto')
        setLogoOpacity(1.0)
        break
      case 'minimal':
        setLogoBgStyle('none')
        setLogoRotation(0)
        setLogoRatio(0.14)
        setLogoPadding(2)
        setLogoOpacity(1.0)
        break
      case 'premium':
      case 'adaptive':
      default:
        setLogoBgStyle('adaptive')
        setLogoRotation(15)
        setLogoRatio(0.16)
        setLogoPadding(10)
        setLogoRadius(16)
        setBgColorMode('auto')
        setLogoOpacity(1.0)
        break
    }
    toast.success(`Applied TEDx ${presetKey.toUpperCase()} Preset`)
  }

  // Reset TEDx branding settings to recommended defaults
  const handleResetBranding = () => {
    applyTedxPreset('adaptive')
    toast.success('Reset TEDx branding settings to recommended defaults')
  }

  // Calculate readability safety score
  const readability = analyzeQRReadability(logoRatio, logoPadding, logoRotation, logoBgStyle)

  // Active target for QR code rendering
  const qrTargetText = shortUrl || (url.trim() ? url.trim() : 'https://clubeve.nivet2006.in')

  // Re-render canvas whenever options change
  useEffect(() => {
    const commonAdvanced = {
      bgStyle: logoOption === 'tedx' ? logoBgStyle : (showLogoBg ? 'rounded' : 'none'),
      bgColorMode,
      customBgColor,
      opacity: logoOpacity,
      padding: logoPadding,
      radius: logoRadius,
      borderWidth,
      borderColorMode,
      customBorderColor,
      gradientStart,
      gradientEnd,
      gradientDirection
    }

    if (canvasRef.current) {
      renderQRToCanvas(canvasRef.current, {
        text: qrTargetText,
        fgColor: effectiveFgHex,
        bgColor: effectiveBgHex,
        transparentBg: false,
        logoSrc: includeLogo ? effectiveLogoSrc : '',
        logoRatio,
        logoPadding,
        logoRotation,
        showLogoBg,
        logoOpacity,
        logoGlow,
        logoGlowColor,
        logoGlowBlur,
        size: 1000,
        advancedLogo: commonAdvanced
      })
    }

    if (transparentCanvasRef.current) {
      renderQRToCanvas(transparentCanvasRef.current, {
        text: qrTargetText,
        fgColor: effectiveFgHex,
        bgColor: effectiveBgHex,
        transparentBg: true,
        logoSrc: includeLogo ? effectiveLogoSrc : '',
        logoRatio,
        logoPadding,
        logoRotation,
        showLogoBg,
        logoOpacity,
        logoGlow,
        logoGlowColor,
        logoGlowBlur,
        size: 1000,
        advancedLogo: commonAdvanced
      })
    }
  }, [
    qrTargetText,
    themeMode,
    fgColor,
    bgColor,
    effectiveFgHex,
    effectiveBgHex,
    includeLogo,
    logoOption,
    effectiveLogoSrc,
    logoRatio,
    logoRotation,
    showLogoBg,
    logoOpacity,
    logoGlow,
    logoGlowColor,
    logoGlowBlur,
    logoBgStyle,
    logoPadding,
    logoRadius,
    borderWidth,
    bgColorMode,
    customBgColor,
    borderColorMode,
    customBorderColor,
    gradientStart,
    gradientEnd,
    gradientDirection
  ])

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
    const logoTag = logoOption === 'tedx' ? `tedx-${logoBgStyle}` : logoOption
    downloadCanvasAsImage(targetCanvas, `clubeve-qr-${logoTag}-${modeSuffix}.png`)
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
      {/* Search Params query parser wrapper */}
      <Suspense fallback={null}>
        <QROptionsQueryHandler
          setSelectedTedxSlug={setSelectedTedxSlug}
          setUrl={setUrl}
          setIncludeLogo={setIncludeLogo}
          setLogoOption={setLogoOption}
        />
      </Suspense>

      {/* Role-Specific Navigation Bar */}
      {role === 'admin' ? (
        <AdminHeader role="admin" name={name || undefined} />
      ) : (
        <Navbar role={role || undefined} name={name || undefined} />
      )}

      {/* Main Content Area */}
      <main className="max-w-[1280px] mx-auto px-4 md:px-8 py-10 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-[var(--border)] pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-black tracking-tight text-[var(--fg)] flex items-center gap-3">
                <QrCode className="text-[var(--fg)]" size={32} />
                QR Studio
              </h1>
              <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 flex items-center gap-1.5">
                <Sparkles size={14} /> TEDxGCEM Advanced Branding
              </span>
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
                    placeholder="https://clubeve.nivet2006.in/tedx/nived-shaji"
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
                        placeholder="tedx-2026"
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
                      placeholder="e.g. TEDxGCEM Speaker Badge"
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

            {/* Card 2: Theme Presets & Styling */}
            <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[2rem] p-6 shadow-sm space-y-6">
              <div className="border-b border-[var(--border)] pb-4">
                <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
                  <Palette size={20} className="text-[var(--fg)]" />
                  2. Theme Presets & Canvas Styling
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

              {/* Logo Overlay Toggle */}
              <div className="space-y-4 pt-2 border-t border-[var(--border)]">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold flex items-center gap-2">
                    <ImageIcon size={18} className="text-[var(--fg-muted)]" />
                    Branding Logo Overlay
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
                  <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)] space-y-5">
                    {/* Logo Selection */}
                    <div>
                      <label className="block font-mono text-xs uppercase tracking-wider text-[var(--fg-muted)] mb-2 font-semibold">
                        Select Branding Logo
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* ClubEve Logo */}
                        <button
                          type="button"
                          onClick={() => {
                            setLogoOption('clubeve')
                            setSelectedLogo('/logo.png')
                          }}
                          className={`p-3 rounded-xl border flex flex-col sm:flex-row items-center gap-3 transition-all ${
                            logoOption === 'clubeve'
                              ? 'border-[var(--fg)] bg-[var(--bg-card)] font-bold shadow-sm'
                              : 'border-[var(--border)] bg-transparent hover:border-[var(--fg-muted)]'
                          }`}
                        >
                          <img src="/logo.png" alt="ClubEve Logo" className="w-7 h-7 object-contain rounded" />
                          <div className="text-left">
                            <p className="text-xs font-semibold">ClubEve Logo</p>
                            <p className="font-mono text-[10px] text-[var(--fg-muted)]">/logo.png</p>
                          </div>
                        </button>

                        {/* One Percent Logo */}
                        <button
                          type="button"
                          onClick={() => {
                            setLogoOption('onepercent')
                            setSelectedLogo('/onepercent.png')
                          }}
                          className={`p-3 rounded-xl border flex flex-col sm:flex-row items-center gap-3 transition-all ${
                            logoOption === 'onepercent'
                              ? 'border-[var(--fg)] bg-[var(--bg-card)] font-bold shadow-sm'
                              : 'border-[var(--border)] bg-transparent hover:border-[var(--fg-muted)]'
                          }`}
                        >
                          <img src="/onepercent.png" alt="One Percent Logo" className="w-7 h-7 object-contain rounded" />
                          <div className="text-left">
                            <p className="text-xs font-semibold">One Percent Logo</p>
                            <p className="font-mono text-[10px] text-[var(--fg-muted)]">/onepercent.png</p>
                          </div>
                        </button>

                        {/* TEDxGCEM Branding */}
                        <button
                          type="button"
                          onClick={() => {
                            setLogoOption('tedx')
                          }}
                          className={`p-3 rounded-xl border flex flex-col sm:flex-row items-center gap-3 transition-all ${
                            logoOption === 'tedx'
                              ? 'border-red-500 bg-red-500/10 font-bold shadow-sm'
                              : 'border-[var(--border)] bg-transparent hover:border-red-500/50'
                          }`}
                        >
                          <img
                            src={isCanvasDark ? '/tedxlogo-white.png' : '/tedxlogo-black.png'}
                            alt="TEDxGCEM Logo"
                            className="w-10 h-7 object-contain rounded"
                          />
                          <div className="text-left">
                            <p className="text-xs font-bold text-red-600 dark:text-red-400">TEDxGCEM</p>
                            <p className="font-mono text-[9px] text-[var(--fg-muted)]">
                              Auto: {isCanvasDark ? 'White Logo' : 'Black Logo'}
                            </p>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Dynamic TEDx Portfolio Route Selector */}
                    {tedxPortfolios.length > 0 && (
                      <div className="pt-3 border-t border-[var(--border)]">
                        <label className="block font-mono text-xs uppercase tracking-wider text-[var(--fg-muted)] mb-1.5 font-semibold flex items-center gap-2">
                          <Sparkles size={14} className="text-red-500" />
                          Load Dynamic TEDx Crew Target (/tedx/[slug])
                        </label>
                        <select
                          value={selectedTedxSlug}
                          onChange={(e) => {
                            const slug = e.target.value
                            setSelectedTedxSlug(slug)
                            if (slug) {
                              setUrl(`https://clubeve.nivet2006.in/tedx/${slug}`)
                              setLogoOption('tedx')
                              toast.success(`Target URL set to /tedx/${slug}`)
                            }
                          }}
                          className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-xs font-sans focus:outline-none"
                        >
                          <option value="">-- Custom Target / Enter URL manually above --</option>
                          {tedxPortfolios.map((p) => (
                            <option key={p.id} value={p.slug}>
                              {p.display_name} ({p.role} - {p.team_name || 'Crew'})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* TEDx ADVANCED BRANDING PANEL */}
                    {logoOption === 'tedx' && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-5 pt-3 border-t border-red-500/20"
                      >
                        {/* Presets */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-xs uppercase tracking-wider text-[var(--fg-muted)] font-semibold flex items-center gap-1.5">
                              <Sparkles size={14} className="text-red-500" />
                              TEDx Style Presets
                            </span>
                            <button
                              type="button"
                              onClick={handleResetBranding}
                              className="text-[10px] font-mono font-bold text-[var(--fg-muted)] hover:text-[var(--fg)] flex items-center gap-1"
                            >
                              <RotateCcw size={12} /> Reset Branding
                            </button>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {[
                              { id: 'premium', label: 'TEDx PREMIUM (Default)' },
                              { id: 'clean', label: 'TEDx CLEAN' },
                              { id: 'classic', label: 'TEDx CLASSIC' },
                              { id: 'diagonal', label: 'TEDx DIAGONAL' },
                              { id: 'minimal', label: 'TEDx MINIMAL' },
                            ].map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => applyTedxPreset(p.id)}
                                className={`px-2.5 py-1.5 rounded-lg border text-left text-xs font-mono font-semibold transition-all ${
                                  logoBgStyle === p.id || (p.id === 'premium' && logoBgStyle === 'adaptive')
                                    ? 'bg-red-500/10 border-red-500 text-red-600 dark:text-red-400 font-bold'
                                    : 'border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--fg-muted)]'
                                }`}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Logo Size Control */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between font-mono text-xs">
                            <span className="text-[var(--fg-muted)] font-semibold">Logo Size</span>
                            <span className="font-bold">{Math.round(logoRatio * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0.10"
                            max="0.30"
                            step="0.01"
                            value={logoRatio}
                            onChange={(e) => setLogoRatio(parseFloat(e.target.value))}
                            className="w-full accent-red-600"
                          />
                          <p className="font-mono text-[10px] text-[var(--fg-muted)]">
                            Safe range: 10% → 30% relative to QR matrix. Aspect ratio is preserved.
                          </p>
                        </div>

                        {/* Logo Rotation Control */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center font-mono text-xs">
                            <span className="text-[var(--fg-muted)] font-semibold">Logo & Badge Group Rotation</span>
                            <span className="font-bold">{logoRotation}°</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {[0, 15, 30, 45].map((deg) => (
                              <button
                                key={deg}
                                type="button"
                                onClick={() => setLogoRotation(deg)}
                                className={`px-3 py-1 rounded-lg border text-xs font-mono font-bold transition-all ${
                                  logoRotation === deg
                                    ? 'bg-[var(--fg)] text-[var(--bg)] border-[var(--fg)]'
                                    : 'border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--fg-muted)]'
                                }`}
                              >
                                {deg}°
                              </button>
                            ))}
                            <input
                              type="range"
                              min="-45"
                              max="45"
                              step="5"
                              value={logoRotation}
                              onChange={(e) => setLogoRotation(parseInt(e.target.value))}
                              className="w-full ml-2 accent-red-600"
                            />
                          </div>
                        </div>

                        {/* Logo Background Style Selector */}
                        <div>
                          <label className="block font-mono text-xs uppercase tracking-wider text-[var(--fg-muted)] mb-1.5 font-semibold">
                            Logo Background Style
                          </label>
                          <select
                            value={logoBgStyle}
                            onChange={(e) => setLogoBgStyle(e.target.value as LogoBgStyle)}
                            className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-xs font-mono font-bold focus:outline-none"
                          >
                            <option value="adaptive">Adaptive (Auto Readability)</option>
                            <option value="none">None / Transparent</option>
                            <option value="square">Solid Square</option>
                            <option value="rounded">Rounded Badge</option>
                            <option value="circle">Circle Badge</option>
                            <option value="pill">Pill Badge</option>
                            <option value="outline">Outline Badge</option>
                            <option value="soft">Soft Contrast</option>
                            <option value="frosted">Translucent / Frosted</option>
                            <option value="inverted">Inverted Badge</option>
                            <option value="gradient">Gradient Badge</option>
                          </select>
                        </div>

                        {/* Contextual Style Controls (Progressive Disclosure) */}
                        {logoBgStyle !== 'none' && (
                          <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] space-y-4">
                            {/* Logo Padding */}
                            <div className="space-y-1.5">
                              <div className="flex justify-between font-mono text-xs">
                                <span className="text-[var(--fg-muted)] font-semibold">Logo Padding</span>
                                <span className="font-bold">{logoPadding} px</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="40"
                                step="2"
                                value={logoPadding}
                                onChange={(e) => setLogoPadding(parseInt(e.target.value))}
                                className="w-full accent-red-600"
                              />
                            </div>

                            {/* Corner Radius (for Rounded, Outline, Soft, Frosted, Inverted, Gradient, Adaptive) */}
                            {['rounded', 'outline', 'soft', 'frosted', 'inverted', 'gradient', 'adaptive'].includes(logoBgStyle) && (
                              <div className="space-y-1.5">
                                <div className="flex justify-between font-mono text-xs">
                                  <span className="text-[var(--fg-muted)] font-semibold">Corner Radius</span>
                                  <span className="font-bold">{logoRadius} px</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="30"
                                  step="2"
                                  value={logoRadius}
                                  onChange={(e) => setLogoRadius(parseInt(e.target.value))}
                                  className="w-full accent-red-600"
                                />
                              </div>
                            )}

                            {/* Border Width (for Outline Badge) */}
                            {logoBgStyle === 'outline' && (
                              <div className="space-y-1.5">
                                <div className="flex justify-between font-mono text-xs">
                                  <span className="text-[var(--fg-muted)] font-semibold">Border Width</span>
                                  <span className="font-bold">{borderWidth} px</span>
                                </div>
                                <input
                                  type="range"
                                  min="1"
                                  max="8"
                                  step="1"
                                  value={borderWidth}
                                  onChange={(e) => setBorderWidth(parseInt(e.target.value))}
                                  className="w-full accent-red-600"
                                />
                              </div>
                            )}

                            {/* Background Color Mode */}
                            {['square', 'rounded', 'circle', 'pill', 'soft', 'frosted', 'adaptive'].includes(logoBgStyle) && (
                              <div>
                                <label className="block font-mono text-xs uppercase tracking-wider text-[var(--fg-muted)] mb-1.5 font-semibold">
                                  Background Color
                                </label>
                                <div className="flex items-center gap-2">
                                  <select
                                    value={bgColorMode}
                                    onChange={(e) => setBgColorMode(e.target.value as any)}
                                    className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] text-xs font-mono"
                                  >
                                    <option value="auto">Auto (Theme Contrast)</option>
                                    <option value="white">White</option>
                                    <option value="black">Black</option>
                                    <option value="custom">Custom Color</option>
                                  </select>
                                  {bgColorMode === 'custom' && (
                                    <input
                                      type="color"
                                      value={customBgColor}
                                      onChange={(e) => setCustomBgColor(e.target.value)}
                                      className="w-8 h-8 rounded border-0 bg-transparent cursor-pointer"
                                    />
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Opacity Control */}
                            {['square', 'rounded', 'circle', 'pill', 'soft', 'frosted', 'inverted', 'gradient', 'adaptive'].includes(logoBgStyle) && (
                              <div className="space-y-1.5">
                                <div className="flex justify-between font-mono text-xs">
                                  <span className="text-[var(--fg-muted)] font-semibold">Badge Opacity</span>
                                  <span className="font-bold">{Math.round(logoOpacity * 100)}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="0.10"
                                  max="1.0"
                                  step="0.05"
                                  value={logoOpacity}
                                  onChange={(e) => setLogoOpacity(parseFloat(e.target.value))}
                                  className="w-full accent-red-600"
                                />
                              </div>
                            )}

                            {/* Gradient Controls */}
                            {logoBgStyle === 'gradient' && (
                              <div className="space-y-3 pt-2 border-t border-[var(--border)]">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block font-mono text-[10px] uppercase font-bold text-[var(--fg-muted)] mb-1">
                                      Gradient Start
                                    </label>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="color"
                                        value={gradientStart}
                                        onChange={(e) => setGradientStart(e.target.value)}
                                        className="w-7 h-7 rounded border-0 cursor-pointer"
                                      />
                                      <input
                                        type="text"
                                        value={gradientStart}
                                        onChange={(e) => setGradientStart(e.target.value)}
                                        className="w-full font-mono text-xs px-2 py-1 rounded border border-[var(--border)] bg-[var(--bg-subtle)]"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block font-mono text-[10px] uppercase font-bold text-[var(--fg-muted)] mb-1">
                                      Gradient End
                                    </label>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="color"
                                        value={gradientEnd}
                                        onChange={(e) => setGradientEnd(e.target.value)}
                                        className="w-7 h-7 rounded border-0 cursor-pointer"
                                      />
                                      <input
                                        type="text"
                                        value={gradientEnd}
                                        onChange={(e) => setGradientEnd(e.target.value)}
                                        className="w-full font-mono text-xs px-2 py-1 rounded border border-[var(--border)] bg-[var(--bg-subtle)]"
                                      />
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <label className="block font-mono text-[10px] uppercase font-bold text-[var(--fg-muted)] mb-1">
                                    Direction
                                  </label>
                                  <div className="grid grid-cols-3 gap-2">
                                    {(['horizontal', 'vertical', 'diagonal'] as GradientDirection[]).map((d) => (
                                      <button
                                        key={d}
                                        type="button"
                                        onClick={() => setGradientDirection(d)}
                                        className={`py-1 text-xs font-mono uppercase font-bold rounded-lg border ${
                                          gradientDirection === d
                                            ? 'bg-red-500/10 border-red-500 text-red-500'
                                            : 'border-[var(--border)] bg-[var(--bg-subtle)]'
                                        }`}
                                      >
                                        {d}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Readability & Scannability Safety Indicator */}
                        <div
                          className={`p-4 rounded-xl border flex items-start gap-3 ${
                            readability.status === 'SAFE'
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                              : readability.status === 'WARNING'
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                              : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {readability.status === 'SAFE' ? (
                            <CheckCircle2 size={20} className="mt-0.5 flex-shrink-0" />
                          ) : readability.status === 'WARNING' ? (
                            <AlertTriangle size={20} className="mt-0.5 flex-shrink-0" />
                          ) : (
                            <ShieldAlert size={20} className="mt-0.5 flex-shrink-0" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-black uppercase tracking-wider">
                                Readability Status: {readability.status}
                              </span>
                              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-current/10 font-bold">
                                {readability.coveragePercent}% Area Covered
                              </span>
                            </div>
                            <p className="text-xs font-sans mt-0.5 opacity-90 leading-snug">
                              {readability.message}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Legacy controls for ClubEve and One Percent logos */}
                    {logoOption !== 'tedx' && (
                      <div className="space-y-4 pt-3 border-t border-[var(--border)]">
                        {/* Scale Size */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between font-mono text-xs">
                            <span className="text-[var(--fg-muted)] font-semibold">Scale Size</span>
                            <span className="font-bold">{Math.round(logoRatio * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0.10"
                            max="0.40"
                            step="0.01"
                            value={logoRatio}
                            onChange={(e) => setLogoRatio(parseFloat(e.target.value))}
                            className="w-full accent-[var(--fg)]"
                          />
                        </div>

                        {/* Background Badge Toggle */}
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold">Solid Background Badge</p>
                            <p className="font-mono text-[10px] text-[var(--fg-muted)]">
                              {showLogoBg ? 'Enabled' : 'Disabled'}
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={showLogoBg}
                              onChange={(e) => setShowLogoBg(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--fg)]"></div>
                          </label>
                        </div>
                      </div>
                    )}
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
                  isCanvasDark ? 'bg-[#141414]' : 'bg-white'
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
                  Download Transparent PNG
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

