'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Sparkles, Code, Music, GraduationCap, Mic, Megaphone, Users, Calendar,
  MapPin, Terminal, Award, BookOpen, Coffee, Flame, Heart, Lightbulb,
  Smile, Star, Target, Trophy, HelpCircle, X, Download, Upload, AlignLeft,
  AlignCenter, AlignRight, Type, Palette, Layout, Settings, Play, RefreshCw,
  Plus, Trash2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Eye, Clock
} from 'lucide-react'
import { toPng, toJpeg } from 'html-to-image'
import { PDFDocument } from 'pdf-lib'
import QRCode from 'qrcode'
import { toast } from 'sonner'
import { GOOGLE_FONTS } from '../../lib/fonts-list'

const loadGoogleFont = (fontFamily: string) => {
  if (typeof window === 'undefined') return
  if (!fontFamily || fontFamily.startsWith('font-')) return
  const fontId = `google-font-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`
  if (document.getElementById(fontId)) return
  
  const link = document.createElement('link')
  link.id = fontId
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;500;700;900&display=swap`
  document.head.appendChild(link)
}

const getFontFamily = (fontName: string) => {
  if (fontName === 'font-sans') return 'system-ui, -apple-system, sans-serif'
  if (fontName === 'font-serif') return 'Georgia, serif'
  if (fontName === 'font-mono') return 'monospace'
  return fontName
}

const PRESET_SWATCHES = [
  '#ffffff', '#000000', '#f43f5e', '#ec4899', '#a855f7', '#6366f1', 
  '#3b82f6', '#60a5fa', '#00f2fe', '#10b981', '#22c55e', '#facc15', 
  '#f97316', '#ef4444', '#d4af37', '#94a3b8', '#1e293b', '#0f172a'
]

const ColorSwatches = ({
  value,
  onChange
}: {
  value: string
  onChange: (val: string) => void
}) => {
  return (
    <div className="flex flex-wrap gap-1 mt-1.5 max-w-[220px]">
      {PRESET_SWATCHES.map(color => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          style={{ backgroundColor: color }}
          className={`w-4 h-4 rounded-full border transition-all ${
            value.toLowerCase() === color.toLowerCase()
              ? 'ring-2 ring-purple-500 border-white scale-110 z-10'
              : 'border-zinc-200 dark:border-zinc-800 hover:scale-105'
          }`}
          title={color}
        />
      ))}
    </div>
  )
}

const FontSelector = ({
  value,
  onChange
}: {
  value: string
  onChange: (val: string) => void
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const displayFontName = value.startsWith('font-') 
    ? value.replace('font-', '').toUpperCase() 
    : value

  // Filter fonts
  const filteredFonts = React.useMemo(() => {
    const systemFonts = [
      { name: 'font-sans', category: 'sans-serif' },
      { name: 'font-serif', category: 'serif' },
      { name: 'font-mono', category: 'monospace' }
    ]
    
    const all = [...systemFonts, ...GOOGLE_FONTS]

    return all.filter(font => {
      return font.name.toLowerCase().includes(search.toLowerCase()) ||
             (font.name.startsWith('font-') && font.name.replace('font-', '').toLowerCase().includes(search.toLowerCase()))
    })
  }, [search])

  // Take top 60 matches for performance
  const visibleFonts = filteredFonts.slice(0, 60)

  // Load fonts when visible list changes
  useEffect(() => {
    visibleFonts.forEach(font => {
      if (!font.name.startsWith('font-')) {
        loadGoogleFont(font.name)
      }
    })
  }, [visibleFonts])

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2 py-1 text-[11px] w-28 text-left truncate flex items-center justify-between outline-none hover:border-purple-500/50 animate-none"
      >
        <span className="truncate">{displayFontName}</span>
        <span className="text-[8px] text-zinc-400 ml-1">▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-[99] overflow-hidden flex flex-col max-h-[240px]">
          {/* Search bar */}
          <div className="p-2 border-b border-zinc-100 dark:border-zinc-850 flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-950">
            <input
              type="text"
              placeholder="Search fonts..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-[11px] outline-none focus:ring-1 focus:ring-purple-500"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 px-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Fonts List */}
          <div className="overflow-y-auto flex-1 divide-y divide-zinc-50 dark:divide-zinc-850 custom-scrollbar">
            {visibleFonts.length === 0 ? (
              <div className="p-3 text-[10px] text-zinc-400 text-center">No fonts found</div>
            ) : (
              visibleFonts.map(font => {
                const fontName = font.name
                const isSelected = value === fontName
                const fontStyleName = fontName.startsWith('font-') ? getFontFamily(fontName) : fontName
                return (
                  <button
                    key={fontName}
                    type="button"
                    onClick={() => {
                      onChange(fontName)
                      setIsOpen(false)
                    }}
                    style={{ fontFamily: fontStyleName }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors ${
                      isSelected ? 'bg-purple-50/50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 font-bold' : 'text-zinc-800 dark:text-zinc-200'
                    }`}
                  >
                    <span>{fontName.startsWith('font-') ? fontName.replace('font-', '').toUpperCase() : fontName}</span>
                    {isSelected && <span className="text-[10px] text-purple-600 dark:text-purple-400">✓</span>}
                  </button>
                )
              })
            )}
            {filteredFonts.length > 60 && (
              <div className="p-1.5 text-[9px] text-zinc-400 text-center font-mono bg-zinc-50 dark:bg-zinc-950">
                showing 60 of {filteredFonts.length} (type to filter)
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// List of available icons for stickers
const STICKER_ICONS: Record<string, React.ComponentType<any>> = {
  Sparkles, Code, Music, GraduationCap, Mic, Megaphone, Users, Calendar,
  MapPin, Terminal, Award, BookOpen, Coffee, Flame, Heart, Lightbulb,
  Smile, Star, Target, Trophy
}

interface Sticker {
  id: string
  iconName: string
  imageUrl?: string // optional image URL for logos
  x: number // percentage 0-100
  y: number // percentage 0-100
  size: number
  color: string
}

interface PosterDesignerProps {
  eventId: string
  initialTitle?: string
  initialClubName?: string
  initialDescription?: string
  initialLocation?: string
  initialDate?: string
  onApply: (url: string) => void
}

export default function PosterDesigner({
  eventId,
  initialTitle = '',
  initialClubName = '',
  initialDescription = '',
  initialLocation = '',
  initialDate = '',
  onApply
}: PosterDesignerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const posterRef = useRef<HTMLDivElement>(null)

  // Content state (starts with form values, customizable in editor)
  const [title, setTitle] = useState(initialTitle)
  const [clubName, setClubName] = useState(initialClubName)
  const [description, setDescription] = useState(initialDescription)
  const [location, setLocation] = useState(initialLocation)
  const [eventDate, setEventDate] = useState(initialDate)
  const [eventTime, setEventTime] = useState('1:30 PM')

  // Design state
  const [activeTemplate, setActiveTemplate] = useState<'cyberpunk' | 'vibrant' | 'corporate' | 'minimalist' | 'retro' | 'techconf' | 'creative' | 'formal-gold' | 'midnight-hacker' | 'glassmorphic-glow' | 'gala-athletic' | 'eco-minimal'>('vibrant')

  // Customization controls
  const [titleColor, setTitleColor] = useState('#ffffff')
  const [titleSize, setTitleSize] = useState(36) // px
  const [titleFont, setTitleFont] = useState('font-sans') // font-sans, font-serif, font-mono
  const [titleAlign, setTitleAlign] = useState<'left' | 'center' | 'right'>('center')

  const [clubColor, setClubColor] = useState('#a855f7')
  const [clubSize, setClubSize] = useState(14)
  const [clubFont, setClubFont] = useState('font-sans')

  const [descColor, setDescColor] = useState('#d1d5db')
  const [descSize, setDescSize] = useState(14)
  const [descFont, setDescFont] = useState('font-sans')
  const [showDesc, setShowDesc] = useState(true)

  const [detailsColor, setDetailsColor] = useState('#ffffff')
  const [detailsBg, setDetailsBg] = useState('rgba(255, 255, 255, 0.1)')
  const [detailsBorderColor, setDetailsBorderColor] = useState('rgba(255, 255, 255, 0.15)')

  const [dateColor, setDateColor] = useState('#ffffff')
  const [dateFont, setDateFont] = useState('font-sans')
  const [timeColor, setTimeColor] = useState('#ffffff')
  const [timeFont, setTimeFont] = useState('font-sans')
  const [venueColor, setVenueColor] = useState('#ffffff')
  const [venueFont, setVenueFont] = useState('font-sans')

  const [speakerNameColor, setSpeakerNameColor] = useState('#0f172a')
  const [speakerNameFont, setSpeakerNameFont] = useState('font-sans')
  const [speakerTitleColor, setSpeakerTitleColor] = useState('#475569')
  const [speakerTitleFont, setSpeakerTitleFont] = useState('font-sans')

  // Selection & drag-resizing states
  const [selectedElement, setSelectedElement] = useState<'club' | 'title' | 'desc' | 'details' | 'qr' | 'speaker' | null>(null)
  const [detailsSize, setDetailsSize] = useState(10) // default 10px
  const [speakerScale, setSpeakerScale] = useState(100) // default 100% (scale 1.0)

  // Background Customization
  const [bgColorType, setBgColorType] = useState<'gradient' | 'solid'>('gradient')
  const [bgSolidColor, setBgSolidColor] = useState('#0f172a')
  const [bgGradStart, setBgGradStart] = useState('#3b82f6')
  const [bgGradEnd, setBgGradEnd] = useState('#ec4899')
  const [bgGradAngle, setBgGradAngle] = useState('to bottom right')

  // QR Code settings
  const [showQr, setShowQr] = useState(true)
  const [qrSize, setQrSize] = useState(90)
  const [qrPosition, setQrPosition] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'center-bottom' | 'custom'>('custom')
  const [qrColorDark, setQrColorDark] = useState('#000000')
  const [qrColorLight, setQrColorLight] = useState('#ffffff')
  const [qrX, setQrX] = useState(85) // percentage
  const [qrY, setQrY] = useState(88) // percentage

  // Coordinates for draggable layout components
  const [clubX, setClubX] = useState(50)
  const [clubY, setClubY] = useState(12)
  const [titleX, setTitleX] = useState(50)
  const [titleY, setTitleY] = useState(42)
  const [descX, setDescX] = useState(50)
  const [descY, setDescY] = useState(66)
  const [detailsX, setDetailsX] = useState(35)
  const [detailsY, setDetailsY] = useState(88)

  // Speaker details & coordinates
  const [showSpeaker, setShowSpeaker] = useState(false)
  const [speakerName, setSpeakerName] = useState('Nived Shaji')
  const [speakerTitle, setSpeakerTitle] = useState('Resource Person')
  const [speakerX, setSpeakerX] = useState(25)
  const [speakerY, setSpeakerY] = useState(80)

  // Stickers / Decals
  const [stickers, setStickers] = useState<Sticker[]>([])
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null)

  // Sync with form updates when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialTitle) setTitle(initialTitle)
      if (initialClubName) setClubName(initialClubName)
      if (initialDescription) setDescription(initialDescription)
      if (initialLocation) setLocation(initialLocation)
      if (initialDate) setEventDate(initialDate)
    }
  }, [isOpen, initialTitle, initialClubName, initialDescription, initialLocation, initialDate])

  // Load Google Fonts dynamically when they are selected
  useEffect(() => {
    const activeFonts = [
      clubFont,
      titleFont,
      descFont,
      dateFont,
      timeFont,
      venueFont,
      speakerNameFont,
      speakerTitleFont
    ]
    activeFonts.forEach(font => {
      if (font && !font.startsWith('font-')) {
        loadGoogleFont(font)
      }
    })
  }, [
    clubFont,
    titleFont,
    descFont,
    dateFont,
    timeFont,
    venueFont,
    speakerNameFont,
    speakerTitleFont
  ])

  // QR code URL generator
  const getAppUrl = () => {
    // Check NEXT_PUBLIC_SITE_URL first (configured in your .env)
    const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      return envUrl
    }
    if (typeof window !== 'undefined') {
      const origin = window.location.origin
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return 'https://cooking.nivet2006.in'
      }
      return origin
    }
    return 'https://cooking.nivet2006.in'
  }

  const publicUrl = `${getAppUrl()}/events/${eventId}`

  // Re-generate QR Data URL when colors or URL changes
  useEffect(() => {
    if (typeof window === 'undefined') return

    const canvas = document.createElement('canvas')
    canvas.width = 400
    canvas.height = 400

    // Use error correction level H (High) to allow 30% area recovery,
    // ensuring the QR remains readable even with a brand logo in the center.
    QRCode.toCanvas(
      canvas,
      publicUrl,
      {
        width: 400,
        margin: 1,
        color: {
          dark: qrColorDark,
          light: qrColorLight
        },
        errorCorrectionLevel: 'H'
      },
      (err) => {
        if (err) {
          console.error('QR generation error:', err)
          return
        }

        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.src = `${window.location.origin}/logo.png`
        img.onload = () => {
          const ctx = canvas.getContext('2d')
          if (!ctx) return

          const size = canvas.width
          const center = size / 2

          // Logo size is 38% of QR code size for maximum visual branding prominence
          const logoSize = size * 0.38
          const x = center - logoSize / 2
          const y = center - logoSize / 2

          // Clear the modules in the center matching the QR light background color (no backing card/border)
          ctx.fillStyle = qrColorLight
          ctx.fillRect(x, y, logoSize, logoSize)

          // Draw Club-Eve logo directly in the center
          ctx.drawImage(img, x, y, logoSize, logoSize)

          setQrDataUrl(canvas.toDataURL('image/png'))
        }

        img.onerror = () => {
          console.warn('Failed to load brand logo for QR code, falling back to clean QR.')
          setQrDataUrl(canvas.toDataURL('image/png'))
        }
      }
    )
  }, [publicUrl, qrColorDark, qrColorLight])

  // Pre-configured Design Presets
  const applyPreset = (presetName: 'cyberpunk' | 'vibrant' | 'corporate' | 'minimalist' | 'retro' | 'techconf' | 'creative' | 'formal-gold' | 'midnight-hacker' | 'glassmorphic-glow' | 'gala-athletic' | 'eco-minimal') => {
    setActiveTemplate(presetName)
    setClubX(50)
    setClubY(12)
    setTitleX(50)
    setTitleY(42)
    setDescX(50)
    setDescY(66)
    setDetailsX(35)
    setDetailsY(88)
    setQrX(85)
    setQrY(88)
    setQrPosition('custom')
    setShowSpeaker(false)
    setDetailsSize(10)
    setSpeakerScale(100)
    setSelectedElement(null)
    switch (presetName) {
      case 'cyberpunk':
        setBgColorType('solid')
        setBgSolidColor('#080710')
        setTitleColor('#00f2fe')
        setTitleSize(38)
        setTitleFont('font-mono')
        setTitleAlign('center')
        setClubColor('#ec4899')
        setClubFont('font-mono')
        setDescColor('#00f2fe')
        setDescFont('font-mono')
        setDetailsColor('#00f2fe')
        setDetailsBg('rgba(0, 0, 0, 0.6)')
        setDetailsBorderColor('#00f2fe')
        setDateColor('#00f2fe')
        setDateFont('font-mono')
        setTimeColor('#00f2fe')
        setTimeFont('font-mono')
        setVenueColor('#00f2fe')
        setVenueFont('font-mono')
        setSpeakerNameColor('#00f2fe')
        setSpeakerNameFont('font-mono')
        setSpeakerTitleColor('#ec4899')
        setSpeakerTitleFont('font-mono')
        setQrColorDark('#00f2fe')
        setQrColorLight('#080710')
        break
      case 'vibrant':
        setBgColorType('gradient')
        setBgGradStart('#8b5cf6')
        setBgGradEnd('#ec4899')
        setBgGradAngle('to bottom right')
        setTitleColor('#ffffff')
        setTitleSize(36)
        setTitleFont('font-sans')
        setTitleAlign('center')
        setClubColor('#ffffff')
        setClubFont('font-sans')
        setDescColor('#f3f4f6')
        setDescFont('font-sans')
        setDetailsColor('#ffffff')
        setDetailsBg('rgba(255, 255, 255, 0.15)')
        setDetailsBorderColor('rgba(255, 255, 255, 0.25)')
        setDateColor('#ffffff')
        setDateFont('font-sans')
        setTimeColor('#ffffff')
        setTimeFont('font-sans')
        setVenueColor('#ffffff')
        setVenueFont('font-sans')
        setSpeakerNameColor('#ffffff')
        setSpeakerNameFont('font-sans')
        setSpeakerTitleColor('#f3f4f6')
        setSpeakerTitleFont('font-sans')
        setQrColorDark('#000000')
        setQrColorLight('#ffffff')
        break
      case 'corporate':
        setBgColorType('solid')
        setBgSolidColor('#0b1a30')
        setTitleColor('#f59e0b')
        setTitleSize(32)
        setTitleFont('font-serif')
        setTitleAlign('left')
        setClubColor('#ffffff')
        setClubFont('font-sans')
        setDescColor('#94a3b8')
        setDescFont('font-sans')
        setDetailsColor('#ffffff')
        setDetailsBg('rgba(15, 23, 42, 0.8)')
        setDetailsBorderColor('#f59e0b')
        setDateColor('#ffffff')
        setDateFont('font-sans')
        setTimeColor('#ffffff')
        setTimeFont('font-sans')
        setVenueColor('#ffffff')
        setVenueFont('font-sans')
        setSpeakerNameColor('#f59e0b')
        setSpeakerNameFont('font-serif')
        setSpeakerTitleColor('#94a3b8')
        setSpeakerTitleFont('font-sans')
        setQrColorDark('#0b1a30')
        setQrColorLight('#ffffff')
        break
      case 'minimalist':
        setBgColorType('solid')
        setBgSolidColor('#f4f1ea')
        setTitleColor('#000000')
        setTitleSize(34)
        setTitleFont('font-mono')
        setTitleAlign('left')
        setClubColor('#4b5563')
        setClubFont('font-mono')
        setDescColor('#374151')
        setDescFont('font-sans')
        setDetailsColor('#000000')
        setDetailsBg('transparent')
        setDetailsBorderColor('#000000')
        setDateColor('#000000')
        setDateFont('font-mono')
        setTimeColor('#000000')
        setTimeFont('font-mono')
        setVenueColor('#000000')
        setVenueFont('font-mono')
        setSpeakerNameColor('#000000')
        setSpeakerNameFont('font-mono')
        setSpeakerTitleColor('#4b5563')
        setSpeakerTitleFont('font-mono')
        setQrColorDark('#000000')
        setQrColorLight('#f4f1ea')
        break
      case 'retro':
        setBgColorType('gradient')
        setBgGradStart('#f97316')
        setBgGradEnd('#facc15')
        setBgGradAngle('to top right')
        setTitleColor('#000000')
        setTitleSize(36)
        setTitleFont('font-sans')
        setTitleAlign('center')
        setClubColor('#000000')
        setClubFont('font-sans')
        setDescColor('#1e293b')
        setDescFont('font-sans')
        setDetailsColor('#000000')
        setDetailsBg('#ffffff')
        setDetailsBorderColor('#000000')
        setDateColor('#000000')
        setDateFont('font-sans')
        setTimeColor('#000000')
        setTimeFont('font-sans')
        setVenueColor('#000000')
        setVenueFont('font-sans')
        setSpeakerNameColor('#000000')
        setSpeakerNameFont('font-sans')
        setSpeakerTitleColor('#1e293b')
        setSpeakerTitleFont('font-sans')
        setQrColorDark('#000000')
        setQrColorLight('#ffffff')
        break
      case 'techconf':
        setBgColorType('gradient')
        setBgGradStart('#09090b')
        setBgGradEnd('#020617')
        setBgGradAngle('to bottom')
        setTitleColor('#ffffff')
        setTitleSize(34)
        setTitleFont('font-mono')
        setTitleAlign('center')
        setClubColor('#60a5fa') // light blue
        setClubFont('font-mono')
        setDescColor('#a1a1aa')
        setDescFont('font-mono')
        setDetailsColor('#ffffff')
        setDetailsBg('rgba(9, 9, 11, 0.5)')
        setDetailsBorderColor('#3b82f6')
        setDateColor('#ffffff')
        setDateFont('font-mono')
        setTimeColor('#ffffff')
        setTimeFont('font-mono')
        setVenueColor('#ffffff')
        setVenueFont('font-mono')
        setSpeakerNameColor('#60a5fa')
        setSpeakerNameFont('font-mono')
        setSpeakerTitleColor('#a1a1aa')
        setSpeakerTitleFont('font-mono')
        setQrColorDark('#ffffff')
        setQrColorLight('#09090b')

        setClubX(50)
        setClubY(12)
        setTitleX(50)
        setTitleY(38)
        setDescX(50)
        setDescY(58)
        setDetailsX(35)
        setDetailsY(86)
        setQrX(85)
        setQrY(86)
        setShowSpeaker(false)
        break
      case 'creative':
        setBgColorType('gradient')
        setBgGradStart('#7c3aed') // violet-600
        setBgGradEnd('#f97316') // orange-500
        setBgGradAngle('to top right')
        setTitleColor('#ffffff')
        setTitleSize(36)
        setTitleFont('font-sans')
        setTitleAlign('center')
        setClubColor('#fef08a') // yellow-200
        setClubFont('font-sans')
        setDescColor('#f3f4f6')
        setDescFont('font-sans')
        setDetailsColor('#ffffff')
        setDetailsBg('rgba(0, 0, 0, 0.3)')
        setDetailsBorderColor('rgba(255, 255, 255, 0.4)')
        setDateColor('#ffffff')
        setDateFont('font-sans')
        setTimeColor('#ffffff')
        setTimeFont('font-sans')
        setVenueColor('#ffffff')
        setVenueFont('font-sans')
        setSpeakerNameColor('#fef08a')
        setSpeakerNameFont('font-sans')
        setSpeakerTitleColor('#f3f4f6')
        setSpeakerTitleFont('font-sans')
        setQrColorDark('#000000')
        setQrColorLight('#ffffff')

        setClubX(50)
        setClubY(12)
        setTitleX(50)
        setTitleY(40)
        setDescX(50)
        setDescY(64)
        setDetailsX(35)
        setDetailsY(86)
        setQrX(85)
        setQrY(86)
        setShowSpeaker(false)
        break
      case 'formal-gold':
        setBgColorType('solid')
        setBgSolidColor('#0b0f19')
        setTitleColor('#d4af37') // Gold
        setTitleSize(32)
        setTitleFont('font-serif')
        setTitleAlign('center')
        setClubColor('#ffffff')
        setClubFont('font-sans')
        setDescColor('#94a3b8')
        setDescFont('font-sans')
        setDetailsColor('#d4af37')
        setDetailsBg('rgba(11, 15, 25, 0.95)')
        setDetailsBorderColor('#d4af37')
        setDateColor('#d4af37')
        setDateFont('font-serif')
        setTimeColor('#d4af37')
        setTimeFont('font-serif')
        setVenueColor('#d4af37')
        setVenueFont('font-serif')
        setSpeakerNameColor('#d4af37')
        setSpeakerNameFont('font-serif')
        setSpeakerTitleColor('#94a3b8')
        setSpeakerTitleFont('font-sans')
        setQrColorDark('#0b0f19')
        setQrColorLight('#ffffff')

        setClubX(50)
        setClubY(16)
        setTitleX(50)
        setTitleY(38)
        setDescX(50)
        setDescY(58)
        setDetailsX(35)
        setDetailsY(84)
        setQrX(82)
        setQrY(84)

        setShowSpeaker(true)
        setSpeakerName('Dr. Sarah Jenkins')
        setSpeakerTitle('Keynote Speaker')
        setSpeakerX(25)
        setSpeakerY(80)
        break
      case 'midnight-hacker':
        setBgColorType('solid')
        setBgSolidColor('#030712')
        setTitleColor('#22c55e') // Matrix Green
        setTitleSize(34)
        setTitleFont('font-mono')
        setTitleAlign('left')
        setClubColor('#3b82f6') // Hacker blue
        setClubFont('font-mono')
        setDescColor('#a1a1aa')
        setDescFont('font-mono')
        setDetailsColor('#22c55e')
        setDetailsBg('rgba(3, 7, 18, 0.85)')
        setDetailsBorderColor('#22c55e')
        setDateColor('#22c55e')
        setDateFont('font-mono')
        setTimeColor('#22c55e')
        setTimeFont('font-mono')
        setVenueColor('#22c55e')
        setVenueFont('font-mono')
        setSpeakerNameColor('#22c55e')
        setSpeakerNameFont('font-mono')
        setSpeakerTitleColor('#3b82f6')
        setSpeakerTitleFont('font-mono')
        setQrColorDark('#22c55e')
        setQrColorLight('#030712')

        setClubX(50)
        setClubY(18)
        setTitleX(50)
        setTitleY(40)
        setDescX(50)
        setDescY(60)
        setDetailsX(32)
        setDetailsY(84)
        setQrX(82)
        setQrY(84)

        setShowSpeaker(true)
        setSpeakerName('root@clubeve:~#')
        setSpeakerTitle('Whitehat Guest')
        setSpeakerX(24)
        setSpeakerY(80)
        break
      case 'glassmorphic-glow':
        setBgColorType('gradient')
        setBgGradStart('#1e1b4b') // deep indigo
        setBgGradEnd('#311042') // deep purple
        setBgGradAngle('to bottom right')
        setTitleColor('#ffffff')
        setTitleSize(32)
        setTitleFont('font-sans')
        setTitleAlign('center')
        setClubColor('#c084fc')
        setClubFont('font-sans')
        setDescColor('#e2e8f0')
        setDescFont('font-sans')
        setDetailsColor('#ffffff')
        setDetailsBg('rgba(255, 255, 255, 0.08)')
        setDetailsBorderColor('rgba(255, 255, 255, 0.18)')
        setDateColor('#ffffff')
        setDateFont('font-sans')
        setTimeColor('#ffffff')
        setTimeFont('font-sans')
        setVenueColor('#ffffff')
        setVenueFont('font-sans')
        setSpeakerNameColor('#ffffff')
        setSpeakerNameFont('font-sans')
        setSpeakerTitleColor('#c084fc')
        setSpeakerTitleFont('font-sans')
        setQrColorDark('#1e1b4b')
        setQrColorLight('#ffffff')

        setClubX(50)
        setClubY(14)
        setTitleX(50)
        setTitleY(38)
        setDescX(50)
        setDescY(58)
        setDetailsX(35)
        setDetailsY(84)
        setQrX(82)
        setQrY(84)

        setShowSpeaker(true)
        setSpeakerName('Alex Rivera')
        setSpeakerTitle('Industry Expert')
        setSpeakerX(25)
        setSpeakerY(80)
        break
      case 'gala-athletic':
        setBgColorType('gradient')
        setBgGradStart('#111827')
        setBgGradEnd('#7f1d1d') // deep red
        setBgGradAngle('to top right')
        setTitleColor('#facc15') // dynamic yellow
        setTitleSize(36)
        setTitleFont('font-sans')
        setTitleAlign('center')
        setClubColor('#ffffff')
        setClubFont('font-sans')
        setDescColor('#f3f4f6')
        setDescFont('font-sans')
        setDetailsColor('#ffffff')
        setDetailsBg('#1f2937')
        setDetailsBorderColor('#ef4444')
        setDateColor('#ffffff')
        setDateFont('font-sans')
        setTimeColor('#ffffff')
        setTimeFont('font-sans')
        setVenueColor('#ffffff')
        setVenueFont('font-sans')
        setSpeakerNameColor('#facc15')
        setSpeakerNameFont('font-sans')
        setSpeakerTitleColor('#ffffff')
        setSpeakerTitleFont('font-sans')
        setQrColorDark('#000000')
        setQrColorLight('#ffffff')

        setClubX(50)
        setClubY(14)
        setTitleX(50)
        setTitleY(40)
        setDescX(50)
        setDescY(64)
        setDetailsX(35)
        setDetailsY(86)
        setQrX(82)
        setQrY(86)
        setShowSpeaker(false)
        break
      case 'eco-minimal':
        setBgColorType('gradient')
        setBgGradStart('#f0fdf4') // light emerald
        setBgGradEnd('#ffffff')
        setBgGradAngle('to bottom')
        setTitleColor('#065f46') // emerald-800
        setTitleSize(30)
        setTitleFont('font-sans')
        setTitleAlign('left')
        setClubColor('#059669')
        setClubFont('font-sans')
        setDescColor('#374151')
        setDescFont('font-sans')
        setDetailsColor('#065f46')
        setDetailsBg('rgba(255, 255, 255, 0.9)')
        setDetailsBorderColor('#a7f3d0')
        setDateColor('#065f46')
        setDateFont('font-sans')
        setTimeColor('#065f46')
        setTimeFont('font-sans')
        setVenueColor('#065f46')
        setVenueFont('font-sans')
        setSpeakerNameColor('#065f46')
        setSpeakerNameFont('font-sans')
        setSpeakerTitleColor('#374151')
        setSpeakerTitleFont('font-sans')
        setQrColorDark('#065f46')
        setQrColorLight('#ffffff')

        setClubX(50)
        setClubY(14)
        setTitleX(50)
        setTitleY(38)
        setDescX(50)
        setDescY(58)
        setDetailsX(35)
        setDetailsY(84)
        setQrX(82)
        setQrY(84)
        setShowSpeaker(false)
        break
    }
  }

  // Add a sticker
  const addSticker = (iconName: string) => {
    const newSticker: Sticker = {
      id: crypto.randomUUID(),
      iconName,
      x: 50,
      y: 35,
      size: 48,
      color: activeTemplate === 'minimalist' || activeTemplate === 'retro' ? '#000000' : '#ffffff'
    }
    setStickers([...stickers, newSticker])
    setSelectedStickerId(newSticker.id)
  }

  // Add a logo sticker
  const addLogoSticker = (imageUrl: string) => {
    const newSticker: Sticker = {
      id: crypto.randomUUID(),
      iconName: 'Sparkles',
      imageUrl,
      x: 50,
      y: 35,
      size: 56,
      color: '#ffffff'
    }
    setStickers([...stickers, newSticker])
    setSelectedStickerId(newSticker.id)
  }

  // Remove selected sticker
  const deleteSticker = (id: string) => {
    setStickers(stickers.filter(s => s.id !== id))
    if (selectedStickerId === id) setSelectedStickerId(null)
  }

  const updateSticker = (id: string, updates: Partial<Sticker>) => {
    setStickers(stickers.map(s => s.id === id ? { ...s, ...updates } : s))
  }

  // Handle dragging for stickers
  const handleStickerDragStart = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
    stickerId: string
  ) => {
    if ('button' in e && e.button !== 0) return // Only drag on left click
    e.preventDefault()
    e.stopPropagation()
    setSelectedStickerId(stickerId)

    const sticker = stickers.find(s => s.id === stickerId)
    if (!sticker) return

    const startX = sticker.x
    const startY = sticker.y

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    const startMouseX = clientX
    const startMouseY = clientY

    const handleDragMove = (moveEvent: MouseEvent | TouchEvent) => {
      const currentClientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX
      const currentClientY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY

      const dx = currentClientX - startMouseX
      const dy = currentClientY - startMouseY

      // Convert dx, dy to percentage of the canvas (400x560)
      const dxPercent = (dx / 400) * 100
      const dyPercent = (dy / 560) * 100

      const newX = Math.max(0, Math.min(100, startX + dxPercent))
      const newY = Math.max(0, Math.min(100, startY + dyPercent))

      setStickers(prev => prev.map(s => s.id === stickerId ? { ...s, x: newX, y: newY } : s))
    }

    const handleDragEnd = () => {
      document.removeEventListener('mousemove', handleDragMove)
      document.removeEventListener('mouseup', handleDragEnd)
      document.removeEventListener('touchmove', handleDragMove)
      document.removeEventListener('touchend', handleDragEnd)
    }

    document.addEventListener('mousemove', handleDragMove)
    document.addEventListener('mouseup', handleDragEnd)
    document.addEventListener('touchmove', handleDragMove, { passive: false })
    document.addEventListener('touchend', handleDragEnd)
  }

  // Generic handler for dragging any absolute layout component
  const handleElementDragStart = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
    elementKey: 'club' | 'title' | 'desc' | 'details' | 'qr' | 'speaker'
  ) => {
    if ('button' in e && e.button !== 0) return // Only drag on left click
    e.preventDefault()
    e.stopPropagation()

    let startX = 0
    let startY = 0

    if (elementKey === 'club') {
      startX = clubX
      startY = clubY
    } else if (elementKey === 'title') {
      startX = titleX
      startY = titleY
    } else if (elementKey === 'desc') {
      startX = descX
      startY = descY
    } else if (elementKey === 'details') {
      startX = detailsX
      startY = detailsY
    } else if (elementKey === 'qr') {
      if (qrPosition !== 'custom') {
        setQrPosition('custom')
      }
      startX = qrX
      startY = qrY
    } else if (elementKey === 'speaker') {
      startX = speakerX
      startY = speakerY
    }

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    const startMouseX = clientX
    const startMouseY = clientY

    const handleDragMove = (moveEvent: MouseEvent | TouchEvent) => {
      const currentClientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX
      const currentClientY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY

      const dx = currentClientX - startMouseX
      const dy = currentClientY - startMouseY

      // Convert dx, dy to percentage of the canvas (400x560)
      const dxPercent = (dx / 400) * 100
      const dyPercent = (dy / 560) * 100

      const newX = Math.max(0, Math.min(100, startX + dxPercent))
      const newY = Math.max(0, Math.min(100, startY + dyPercent))

      if (elementKey === 'club') {
        setClubX(newX)
        setClubY(newY)
      } else if (elementKey === 'title') {
        setTitleX(newX)
        setTitleY(newY)
      } else if (elementKey === 'desc') {
        setDescX(newX)
        setDescY(newY)
      } else if (elementKey === 'details') {
        setDetailsX(newX)
        setDetailsY(newY)
      } else if (elementKey === 'qr') {
        setQrX(newX)
        setQrY(newY)
      } else if (elementKey === 'speaker') {
        setSpeakerX(newX)
        setSpeakerY(newY)
      }
    }

    const handleDragEnd = () => {
      document.removeEventListener('mousemove', handleDragMove)
      document.removeEventListener('mouseup', handleDragEnd)
      document.removeEventListener('touchmove', handleDragMove)
      document.removeEventListener('touchend', handleDragEnd)
    }

    document.addEventListener('mousemove', handleDragMove)
    document.addEventListener('mouseup', handleDragEnd)
    document.addEventListener('touchmove', handleDragMove, { passive: false })
    document.addEventListener('touchend', handleDragEnd)
  }

  // Resize handler for elements via bottom-right drag handles
  const handleResizeStart = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
    elementKey: 'club' | 'title' | 'desc' | 'details' | 'qr' | 'speaker' | string // string is for sticker ids
  ) => {
    if ('button' in e && e.button !== 0) return // Only on left click
    e.preventDefault()
    e.stopPropagation()

    // Determine initial values
    let startSize = 0
    if (elementKey === 'club') {
      startSize = clubSize
    } else if (elementKey === 'title') {
      startSize = titleSize
    } else if (elementKey === 'desc') {
      startSize = descSize
    } else if (elementKey === 'details') {
      startSize = detailsSize
    } else if (elementKey === 'qr') {
      startSize = qrSize
    } else if (elementKey === 'speaker') {
      startSize = speakerScale
    } else {
      // It's a sticker ID
      const sticker = stickers.find(s => s.id === elementKey)
      if (sticker) {
        startSize = sticker.size
      }
    }

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    const startMouseX = clientX
    const startMouseY = clientY

    const handleResizeMove = (moveEvent: MouseEvent | TouchEvent) => {
      const currentClientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX
      const currentClientY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY

      const dx = currentClientX - startMouseX
      const dy = currentClientY - startMouseY

      // Pulling bottom-right increases size with positive delta
      // Let's use average delta to size
      const delta = (dx + dy) / 2

      if (elementKey === 'club') {
        // Font sizes are smaller, let's scale delta
        const newSize = Math.max(8, Math.min(32, startSize + delta / 4))
        setClubSize(newSize)
      } else if (elementKey === 'title') {
        const newSize = Math.max(16, Math.min(80, startSize + delta / 3))
        setTitleSize(newSize)
      } else if (elementKey === 'desc') {
        const newSize = Math.max(8, Math.min(28, startSize + delta / 4))
        setDescSize(newSize)
      } else if (elementKey === 'details') {
        const newSize = Math.max(6, Math.min(20, startSize + delta / 5))
        setDetailsSize(newSize)
      } else if (elementKey === 'qr') {
        const newSize = Math.max(50, Math.min(200, startSize + delta))
        setQrSize(newSize)
      } else if (elementKey === 'speaker') {
        const newScale = Math.max(50, Math.min(180, startSize + delta / 2))
        setSpeakerScale(newScale)
      } else {
        // It is a sticker ID
        const newSize = Math.max(16, Math.min(150, startSize + delta))
        updateSticker(elementKey, { size: newSize })
      }
    }

    const handleResizeEnd = () => {
      document.removeEventListener('mousemove', handleResizeMove)
      document.removeEventListener('mouseup', handleResizeEnd)
      document.removeEventListener('touchmove', handleResizeMove)
      document.removeEventListener('touchend', handleResizeEnd)
    }

    document.addEventListener('mousemove', handleResizeMove)
    document.addEventListener('mouseup', handleResizeEnd)
    document.addEventListener('touchmove', handleResizeMove, { passive: false })
    document.addEventListener('touchend', handleResizeEnd)
  }

  // Reset layout positions helper
  const resetLayoutPositions = () => {
    setClubX(50)
    setClubY(12)
    setTitleX(50)
    setTitleY(42)
    setDescX(50)
    setDescY(66)
    setDetailsX(35)
    setDetailsY(88)
    setQrX(85)
    setQrY(88)
    setQrPosition('custom')
    setSpeakerX(25)
    setSpeakerY(80)
    setDetailsSize(10)
    setSpeakerScale(100)
    setSelectedElement(null)
    toast.success('All element positions and sizes reset to defaults!')
  }

  // Render poster element to an image url
  const getRenderedImageBlob = async (format: 'png' | 'jpeg' | 'jpg'): Promise<Blob | null> => {
    if (!posterRef.current) return null
    try {
      // Unselect elements and stickers before capturing to hide handles/borders
      setSelectedStickerId(null)
      setSelectedElement(null)
      await new Promise(resolve => setTimeout(resolve, 100)) // Let UI re-render

      const renderFn = format === 'png' ? toPng : toJpeg
      const dataUrl = await renderFn(posterRef.current, {
        cacheBust: true,
        pixelRatio: 2, // High resolution capture
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      })

      const res = await fetch(dataUrl)
      return await res.blob()
    } catch (err) {
      console.error('Render error:', err)
      toast.error('Failed to render poster image.')
      return null
    }
  }

  // Export File (PNG, JPG)
  const handleExportFile = async (format: 'png' | 'jpeg' | 'jpg') => {
    const blob = await getRenderedImageBlob(format)
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `event-poster-${eventId}.${format === 'jpeg' ? 'jpg' : format}`
    link.click()
    toast.success(`Poster exported successfully as ${format.toUpperCase()}!`)
  }

  // Export PDF
  const handleExportPdf = async () => {
    try {
      const blob = await getRenderedImageBlob('png')
      if (!blob) return

      toast.info('Generating high-fidelity PDF container...')
      const arrayBuffer = await blob.arrayBuffer()
      const pdfDoc = await PDFDocument.create()

      // Typical standard A4 poster aspect ratio is roughly 800x1130 or 600x850. Let's match our canvas 400x560.
      const page = pdfDoc.addPage([500, 700])
      const embeddedImage = await pdfDoc.embedPng(arrayBuffer)

      page.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: 500,
        height: 700
      })

      const pdfBytes = await pdfDoc.save()
      const pdfBlob = new Blob([pdfBytes as any], { type: 'application/pdf' })
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `event-poster-${eventId}.pdf`
      link.click()
      toast.success('Poster exported successfully as PDF!')
    } catch (err) {
      console.error('PDF export error:', err)
      toast.error('Could not generate PDF.')
    }
  }

  // Upload to Backblaze storage and apply URL to form
  const handleApplyToForm = async () => {
    setLoading(true)
    toast.info('Rendering final poster asset...')

    const blob = await getRenderedImageBlob('png')
    if (!blob) {
      setLoading(false)
      return
    }

    try {
      toast.info('Uploading poster to Club-Eve media engine...')
      const file = new File([blob], `poster-${eventId}.png`, { type: 'image/png' })

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Server error uploading file')
      }

      toast.success('Poster successfully uploaded and set as Event Banner!')
      onApply(result.url)
      setIsOpen(false)
    } catch (err: any) {
      console.error('Upload error:', err)
      toast.error(`Upload failed: ${err.message || 'Unknown network error'}`)
    } finally {
      setLoading(false)
    }
  }

  // Dynamic Styles based on configurations
  const getPosterBgStyle = (): React.CSSProperties => {
    if (bgColorType === 'solid') {
      return { backgroundColor: bgSolidColor }
    }
    return {
      background: `linear-gradient(${bgGradAngle === 'to bottom right' ? '135deg' : bgGradAngle === 'to top right' ? '45deg' : '0deg'}, ${bgGradStart}, ${bgGradEnd})`
    }
  }

  // Formatted date string for poster details
  const getFormattedDate = (dateStr: string) => {
    if (!dateStr) return 'Date: TBA'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    } catch {
      return dateStr
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.3);
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.5);
        }
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
      ` }} />
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-5 py-2.5 bg-[#f4f4f5] dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-bold font-mono tracking-wider transition-all"
      >
        <Sparkles size={14} className="text-purple-600 dark:text-purple-400" />
        🎨 Design Poster (Canva-style)
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto custom-scrollbar">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-[1200px] h-full max-h-[85vh] rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-900 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950">
              <div>
                <h3 className="font-bold text-lg text-zinc-900 dark:text-white flex items-center gap-2">
                  <Palette size={18} className="text-purple-600" />
                  Club-Eve Poster Lab & Customizer
                </h3>
                <p className="text-xs font-mono text-zinc-500 mt-0.5">Design beautiful visual posters. 100% Free. No AI keys needed.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-600 dark:hover:text-white rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Split Screen Workspace */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

              {/* Left Side: Live Canvas Preview Container */}
              <div className="flex-1 bg-zinc-100 dark:bg-zinc-900/60 p-6 flex flex-col items-center justify-center overflow-y-auto min-h-[350px] custom-scrollbar">
                <div className="w-full flex justify-between items-center mb-3">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Eye size={12} /> Interactive Poster Canvas (400 × 560 px)
                  </span>
                  <span className="text-[9px] font-mono text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 px-2 py-0.5 rounded-full border border-purple-200/50 dark:border-purple-800/30">
                    🖐️ Click and drag ANY element to position it!
                  </span>
                </div>

                {/* Actual Poster Element */}
                <div
                  ref={posterRef}
                  onClick={() => {
                    setSelectedElement(null)
                    setSelectedStickerId(null)
                  }}
                  style={getPosterBgStyle()}
                  className={`w-[400px] h-[560px] rounded-2xl relative overflow-hidden shadow-2xl select-none ${activeTemplate === 'cyberpunk' ? 'border-2 border-[#00f2fe]' :
                      activeTemplate === 'corporate' ? 'border-4 border-double border-[#f59e0b]' :
                        activeTemplate === 'retro' ? 'border-4 border-black' :
                          activeTemplate === 'formal-gold' ? 'border-4 border-double border-[#d4af37]' :
                            activeTemplate === 'midnight-hacker' ? 'border-2 border-[#22c55e]' :
                              activeTemplate === 'glassmorphic-glow' ? 'border border-white/20 shadow-2xl' :
                                activeTemplate === 'gala-athletic' ? 'border border-zinc-800' :
                                  activeTemplate === 'eco-minimal' ? 'border border-emerald-200' : ''
                    }`}
                >
                  {/* Cyberpunk Grid Background Overlay */}
                  {activeTemplate === 'cyberpunk' && (
                    <div
                      className="absolute inset-0 pointer-events-none opacity-20"
                      style={{
                        backgroundImage: 'linear-gradient(to right, #00f2fe 1px, transparent 1px), linear-gradient(to bottom, #00f2fe 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                      }}
                    />
                  )}

                  {/* Vibrant background organic bubbles */}
                  {activeTemplate === 'vibrant' && (
                    <>
                      <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-pink-400/30 blur-2xl pointer-events-none animate-pulse" />
                      <div className="absolute bottom-16 right-10 w-40 h-40 rounded-full bg-blue-400/30 blur-2xl pointer-events-none" />
                    </>
                  )}

                  {/* Formal Gold Double Borders */}
                  {activeTemplate === 'formal-gold' && (
                    <div className="absolute inset-2 border border-[#d4af37]/60 pointer-events-none m-1">
                      <div className="absolute inset-1 border-[3px] border-[#d4af37]/80" />
                    </div>
                  )}

                  {/* Midnight Hacker Grid and Header Overlay */}
                  {activeTemplate === 'midnight-hacker' && (
                    <>
                      {/* Matrix Grid */}
                      <div
                        className="absolute inset-0 pointer-events-none opacity-10"
                        style={{
                          backgroundImage: 'linear-gradient(to right, #22c55e 1px, transparent 1px), linear-gradient(to bottom, #22c55e 1px, transparent 1px)',
                          backgroundSize: '30px 30px'
                        }}
                      />
                      {/* Mock Terminal Header */}
                      <div className="absolute top-0 left-0 w-full bg-[#030712] border-b border-[#22c55e]/20 px-3 py-1.5 flex items-center justify-between pointer-events-none z-10">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                          <span className="text-[8px] font-mono text-zinc-500 ml-2">bash - event_poster.sh</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Glassmorphic Glow Background Orbs */}
                  {activeTemplate === 'glassmorphic-glow' && (
                    <>
                      {/* Vivid back neon bubbles */}
                      <div className="absolute top-20 left-10 w-44 h-44 rounded-full bg-[#f43f5e]/20 blur-[50px] pointer-events-none" />
                      <div className="absolute bottom-20 right-10 w-44 h-44 rounded-full bg-[#3b82f6]/20 blur-[50px] pointer-events-none animate-pulse" />
                    </>
                  )}

                  {/* Gala Athletic sharp diagonal cuts */}
                  {activeTemplate === 'gala-athletic' && (
                    <div
                      className="absolute inset-0 pointer-events-none opacity-10"
                      style={{
                        backgroundImage: 'linear-gradient(115deg, transparent 70%, #ef4444 70%), linear-gradient(115deg, transparent 40%, #000000 40%)',
                        backgroundSize: '100% 100%'
                      }}
                    />
                  )}

                  {/* Eco Minimal clean layout details */}
                  {activeTemplate === 'eco-minimal' && (
                    <div
                      className="absolute inset-0 pointer-events-none opacity-[0.03]"
                      style={{
                        backgroundImage: 'radial-gradient(#059669 1.5px, transparent 1.5px)',
                        backgroundSize: '20px 20px'
                      }}
                    />
                  )}

                  {/* Tech Conference Background Overlay */}
                  {activeTemplate === 'techconf' && (
                    <>
                      <div
                        className="absolute inset-0 pointer-events-none opacity-20"
                        style={{
                          backgroundImage: 'linear-gradient(to right, #3b82f6 0.5px, transparent 0.5px), linear-gradient(to bottom, #8b5cf6 0.5px, transparent 0.5px)',
                          backgroundSize: '40px 40px'
                        }}
                      />
                      <div className="absolute -top-10 -left-10 w-48 h-48 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />
                      <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full bg-purple-600/20 blur-3xl pointer-events-none" />
                    </>
                  )}

                  {/* Header / Club Identity */}
                  <div
                    onMouseDown={(e) => handleElementDragStart(e, 'club')}
                    onTouchStart={(e) => handleElementDragStart(e, 'club')}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedElement('club')
                      setSelectedStickerId(null)
                    }}
                    style={{
                      position: 'absolute',
                      left: `${clubX}%`,
                      top: `${clubY}%`,
                      transform: 'translate(-50%, -50%)',
                      cursor: 'grab',
                      zIndex: 10
                    }}
                    className={`flex flex-col items-center p-1.5 rounded-lg border bg-transparent whitespace-nowrap transition-all ${selectedElement === 'club'
                        ? 'border-dashed border-white ring-2 ring-white/30'
                        : 'border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 hover:ring-2 hover:ring-purple-500/50'
                      }`}
                  >
                    <span
                      style={{ color: clubColor, fontSize: `${clubSize}px`, fontFamily: getFontFamily(clubFont) }}
                      className={`uppercase tracking-widest font-bold ${clubFont}`}
                    >
                      {clubName || 'Host Club'}
                    </span>
                    {activeTemplate === 'cyberpunk' && (
                      <span className="text-[8px] text-zinc-500 font-mono tracking-tighter mt-0.5 pointer-events-none">Club-Eve System v1.0</span>
                    )}
                    {selectedElement === 'club' && (
                      <div
                        onMouseDown={(e) => handleResizeStart(e, 'club')}
                        onTouchStart={(e) => handleResizeStart(e, 'club')}
                        className="absolute bottom-0 right-0 w-3 h-3 bg-purple-600 border border-white rounded-full cursor-se-resize z-30"
                        style={{ transform: 'translate(50%, 50%)' }}
                      />
                    )}
                  </div>

                  {/* Dynamic Stickers / Decals */}
                  {stickers.map(sticker => {
                    const isSelected = selectedStickerId === sticker.id
                    return (
                      <div
                        key={sticker.id}
                        onMouseDown={(e) => handleStickerDragStart(e, sticker.id)}
                        onTouchStart={(e) => handleStickerDragStart(e, sticker.id)}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedStickerId(sticker.id)
                          setSelectedElement(null)
                        }}
                        style={{
                          position: 'absolute',
                          left: `${sticker.x}%`,
                          top: `${sticker.y}%`,
                          transform: 'translate(-50%, -50%)',
                          cursor: isSelected ? 'grabbing' : 'grab',
                          zIndex: 20
                        }}
                        className={`group relative p-1 rounded-lg border transition-all ${isSelected
                            ? 'border-dashed border-white ring-2 ring-white/30'
                            : 'border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 hover:ring-2 hover:ring-purple-500/50'
                          }`}
                      >
                        {sticker.imageUrl ? (
                          <img
                            src={sticker.imageUrl}
                            alt="Sticker Logo"
                            style={{
                              width: `${sticker.size}px`,
                              height: 'auto',
                              maxHeight: `${sticker.size}px`,
                              objectFit: 'contain'
                            }}
                            className="pointer-events-none"
                          />
                        ) : (
                          (() => {
                            const StickerIcon = STICKER_ICONS[sticker.iconName] || HelpCircle
                            return <StickerIcon size={sticker.size} style={{ color: sticker.color }} />
                          })()
                        )}
                        {isSelected && (
                          <div
                            onMouseDown={(e) => handleResizeStart(e, sticker.id)}
                            onTouchStart={(e) => handleResizeStart(e, sticker.id)}
                            className="absolute bottom-0 right-0 w-3 h-3 bg-purple-600 border border-white rounded-full cursor-se-resize z-30"
                            style={{ transform: 'translate(50%, 50%)' }}
                          />
                        )}
                      </div>
                    )
                  })}

                  {/* Main Event Title */}
                  <div
                    onMouseDown={(e) => handleElementDragStart(e, 'title')}
                    onTouchStart={(e) => handleElementDragStart(e, 'title')}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedElement('title')
                      setSelectedStickerId(null)
                    }}
                    style={{
                      position: 'absolute',
                      left: `${titleX}%`,
                      top: `${titleY}%`,
                      transform: 'translate(-50%, -50%)',
                      cursor: 'grab',
                      width: '85%',
                      zIndex: 10
                    }}
                    className={`p-2 rounded-lg border bg-transparent flex flex-col justify-center items-center transition-all ${selectedElement === 'title'
                        ? 'border-dashed border-white ring-2 ring-white/30'
                        : 'border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 hover:ring-2 hover:ring-purple-500/50'
                      }`}
                  >
                    <h1
                      style={{
                        color: titleColor,
                        fontSize: `${titleSize}px`,
                        textAlign: titleAlign,
                        fontFamily: getFontFamily(titleFont)
                      }}
                      className={`font-black tracking-tight leading-none uppercase break-words w-full select-none ${titleFont} ${activeTemplate === 'cyberpunk' ? 'text-shadow-neon' : ''
                        } ${activeTemplate === 'retro' ? 'drop-shadow-[3px_3px_0px_#000000]' : ''
                        } ${activeTemplate === 'formal-gold' ? 'drop-shadow-[1px_1px_1px_rgba(0,0,0,0.5)]' : ''
                        }`}
                    >
                      {title || 'EXQUISITE EVENT'}
                    </h1>
                    {selectedElement === 'title' && (
                      <div
                        onMouseDown={(e) => handleResizeStart(e, 'title')}
                        onTouchStart={(e) => handleResizeStart(e, 'title')}
                        className="absolute bottom-0 right-0 w-3 h-3 bg-purple-600 border border-white rounded-full cursor-se-resize z-30"
                        style={{ transform: 'translate(50%, 50%)' }}
                      />
                    )}
                  </div>

                  {/* Event Description */}
                  {showDesc && (
                    <div
                      onMouseDown={(e) => handleElementDragStart(e, 'desc')}
                      onTouchStart={(e) => handleElementDragStart(e, 'desc')}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedElement('desc')
                        setSelectedStickerId(null)
                      }}
                      style={{
                        position: 'absolute',
                        left: `${descX}%`,
                        top: `${descY}%`,
                        transform: 'translate(-50%, -50%)',
                        cursor: 'grab',
                        width: '85%',
                        zIndex: 10
                      }}
                      className={`p-2 rounded-lg border bg-transparent flex flex-col justify-center items-center transition-all ${selectedElement === 'desc'
                          ? 'border-dashed border-white ring-2 ring-white/30'
                          : 'border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 hover:ring-2 hover:ring-purple-500/50'
                        }`}
                    >
                      <p
                        style={{ color: descColor, fontSize: `${descSize}px`, fontFamily: getFontFamily(descFont) }}
                        className={`leading-relaxed line-clamp-3 w-full text-center select-none ${descFont} ${activeTemplate === 'retro' ? 'font-medium' : 'font-light'
                          }`}
                      >
                        {description || 'Join us for this exciting departmental event packed with learning, collaboration, and certificate outcomes.'}
                      </p>
                      {selectedElement === 'desc' && (
                        <div
                          onMouseDown={(e) => handleResizeStart(e, 'desc')}
                          onTouchStart={(e) => handleResizeStart(e, 'desc')}
                          className="absolute bottom-0 right-0 w-3 h-3 bg-purple-600 border border-white rounded-full cursor-se-resize z-30"
                          style={{ transform: 'translate(50%, 50%)' }}
                        />
                      )}
                    </div>
                  )}

                  {/* Event Logistics (Time / Venue) */}
                  <div
                    onMouseDown={(e) => handleElementDragStart(e, 'details')}
                    onTouchStart={(e) => handleElementDragStart(e, 'details')}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedElement('details')
                      setSelectedStickerId(null)
                    }}
                    style={{
                      backgroundColor: detailsBg,
                      borderColor: detailsBorderColor,
                      color: detailsColor,
                      position: 'absolute',
                      left: `${detailsX}%`,
                      top: `${detailsY}%`,
                      transform: 'translate(-50%, -50%)',
                      cursor: 'grab',
                      width: '65%',
                      zIndex: 10
                    }}
                    className={`rounded-xl p-3 border backdrop-blur-md space-y-1.5 text-left transition-all ${selectedElement === 'details'
                        ? 'border-dashed border-white ring-2 ring-white/30'
                        : `hover:border-zinc-200 dark:hover:border-zinc-800 hover:ring-2 hover:ring-purple-500/50 ${activeTemplate === 'retro' ? 'border-2 border-black shadow-[3px_3px_0px_#000000] text-black font-semibold' : ''
                        }`
                      }`}
                  >
                    <>
                      <div className="flex items-center gap-1.5 pointer-events-none">
                        <Calendar size={12} className="shrink-0 opacity-80" style={{ color: dateColor }} />
                        <span style={{ color: dateColor, fontSize: `${detailsSize}px`, fontFamily: getFontFamily(dateFont) }} className={`leading-none truncate ${dateFont}`}>
                          {getFormattedDate(eventDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 pointer-events-none">
                        <Clock size={12} className="shrink-0 opacity-80" style={{ color: timeColor }} />
                        <span style={{ color: timeColor, fontSize: `${detailsSize}px`, fontFamily: getFontFamily(timeFont) }} className={`leading-none truncate ${timeFont}`}>
                          {eventTime || '1:30 PM'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 pointer-events-none">
                        <MapPin size={12} className="shrink-0 opacity-80" style={{ color: venueColor }} />
                        <span style={{ color: venueColor, fontSize: `${detailsSize}px`, fontFamily: getFontFamily(venueFont) }} className={`leading-none truncate ${venueFont}`}>
                          {location || 'Venue: TBA'}
                        </span>
                      </div>
                    </>
                    {selectedElement === 'details' && (
                      <div
                        onMouseDown={(e) => handleResizeStart(e, 'details')}
                        onTouchStart={(e) => handleResizeStart(e, 'details')}
                        className="absolute bottom-0 right-0 w-3 h-3 bg-purple-600 border border-white rounded-full cursor-se-resize z-30"
                        style={{ transform: 'translate(50%, 50%)' }}
                      />
                    )}
                  </div>

                  {/* Speaker Badge */}
                  {showSpeaker && (
                    <div
                      onMouseDown={(e) => handleElementDragStart(e, 'speaker')}
                      onTouchStart={(e) => handleElementDragStart(e, 'speaker')}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedElement('speaker')
                        setSelectedStickerId(null)
                      }}
                      style={{
                        position: 'absolute',
                        left: `${speakerX}%`,
                        top: `${speakerY}%`,
                        transform: `translate(-50%, -50%) scale(${speakerScale / 100})`,
                        cursor: 'grab',
                        zIndex: 15
                      }}
                      className={`flex flex-col items-center p-2.5 rounded-2xl border bg-white/95 dark:bg-zinc-950/95 shadow-xl backdrop-blur-sm w-36 text-center transition-all ${selectedElement === 'speaker'
                          ? 'border-dashed border-white ring-2 ring-white/30'
                          : `hover:border-zinc-300 dark:hover:border-zinc-700 hover:ring-2 hover:ring-purple-500/50 ${activeTemplate === 'formal-gold' ? 'border-[#d4af37]/60' :
                            activeTemplate === 'midnight-hacker' ? 'border-[#22c55e]/60 bg-[#030712]/95 text-[#22c55e]' :
                              'border-zinc-200 dark:border-zinc-850'
                          }`
                        }`}
                    >
                      {/* Speaker Photo Mockup - Blue Circle Ring just like the reference image! */}
                      <div className={`w-16 h-16 rounded-full border-[3px] overflow-hidden mb-1.5 flex items-center justify-center shadow-inner ${activeTemplate === 'formal-gold' ? 'border-[#d4af37]' :
                          activeTemplate === 'midnight-hacker' ? 'border-[#22c55e]' :
                            'border-purple-500 bg-purple-50'
                        }`}>
                        <Users size={28} className={
                          activeTemplate === 'formal-gold' ? 'text-[#d4af37]' :
                            activeTemplate === 'midnight-hacker' ? 'text-[#22c55e]' :
                              'text-purple-600'
                        } />
                      </div>
                      <span
                        style={{ color: speakerTitleColor, fontFamily: getFontFamily(speakerTitleFont) }}
                        className={`text-[8px] font-bold uppercase tracking-wider leading-none mb-1 ${speakerTitleFont}`}
                      >
                        {speakerTitle || 'Resource Person'}
                      </span>
                      <span
                        style={{ color: speakerNameColor, fontFamily: getFontFamily(speakerNameFont) }}
                        className={`text-xs font-black uppercase leading-tight tracking-tight text-center break-words w-full px-1 ${speakerNameFont}`}
                      >
                        {speakerName || 'Nived Shaji'}
                      </span>
                      {selectedElement === 'speaker' && (
                        <div
                          onMouseDown={(e) => handleResizeStart(e, 'speaker')}
                          onTouchStart={(e) => handleResizeStart(e, 'speaker')}
                          className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-purple-600 border border-white rounded-full cursor-se-resize z-30"
                          style={{ transform: 'translate(50%, 50%) scale(1.1)' }}
                        />
                      )}
                    </div>
                  )}

                  {/* Draggable QR Code */}
                  {showQr && qrDataUrl && (
                    <div
                      onMouseDown={(e) => handleElementDragStart(e, 'qr')}
                      onTouchStart={(e) => handleElementDragStart(e, 'qr')}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedElement('qr')
                        setSelectedStickerId(null)
                      }}
                      style={{
                        width: `${qrSize}px`,
                        height: `${qrSize}px`,
                        backgroundColor: qrColorLight,
                        borderColor: activeTemplate === 'retro' ? '#000000' : detailsBorderColor,
                        position: 'absolute',
                        left: `${qrX}%`,
                        top: `${qrY}%`,
                        transform: 'translate(-50%, -50%)',
                        cursor: 'grab',
                        zIndex: 30
                      }}
                      className={`shrink-0 aspect-square rounded-xl p-1.5 border flex items-center justify-center bg-white transition-all ${selectedElement === 'qr'
                          ? 'border-dashed border-white ring-2 ring-white/30'
                          : `hover:ring-2 hover:ring-purple-500/50 ${activeTemplate === 'retro' ? 'border-2 border-black shadow-[3px_3px_0px_#000000]' :
                            activeTemplate === 'formal-gold' ? 'border-2 border-[#d4af37]' :
                              activeTemplate === 'midnight-hacker' ? 'border-2 border-[#22c55e]' : 'border-zinc-200 dark:border-zinc-850'
                          }`
                        }`}
                    >
                      <img
                        src={qrDataUrl}
                        alt="Event QR code"
                        className="w-full h-full object-contain pointer-events-none"
                      />
                      {selectedElement === 'qr' && (
                        <div
                          onMouseDown={(e) => handleResizeStart(e, 'qr')}
                          onTouchStart={(e) => handleResizeStart(e, 'qr')}
                          className="absolute bottom-0 right-0 w-3 h-3 bg-purple-600 border border-white rounded-full cursor-se-resize z-30"
                          style={{ transform: 'translate(50%, 50%)' }}
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Sticker Quick Controls */}
                {selectedStickerId && (
                  <div className="mt-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl flex items-center gap-4 text-xs shadow-md">
                    <span className="font-mono text-zinc-400">Sticker Selected:</span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        title="Move Up"
                        onClick={() => {
                          const s = stickers.find(st => st.id === selectedStickerId)
                          if (s) updateSticker(selectedStickerId, { y: Math.max(0, s.y - 2) })
                        }}
                        className="p-1 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        type="button"
                        title="Move Down"
                        onClick={() => {
                          const s = stickers.find(st => st.id === selectedStickerId)
                          if (s) updateSticker(selectedStickerId, { y: Math.min(100, s.y + 2) })
                        }}
                        className="p-1 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded"
                      >
                        <ArrowDown size={12} />
                      </button>
                      <button
                        type="button"
                        title="Move Left"
                        onClick={() => {
                          const s = stickers.find(st => st.id === selectedStickerId)
                          if (s) updateSticker(selectedStickerId, { x: Math.max(0, s.x - 2) })
                        }}
                        className="p-1 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded"
                      >
                        <ArrowLeft size={12} />
                      </button>
                      <button
                        type="button"
                        title="Move Right"
                        onClick={() => {
                          const s = stickers.find(st => st.id === selectedStickerId)
                          if (s) updateSticker(selectedStickerId, { x: Math.min(100, s.x + 2) })
                        }}
                        className="p-1 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded"
                      >
                        <ArrowRight size={12} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px]">Size:</span>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        value={stickers.find(st => st.id === selectedStickerId)?.size || 48}
                        onChange={e => updateSticker(selectedStickerId, { size: parseInt(e.target.value) })}
                        className="w-16 h-1 bg-zinc-200 dark:bg-zinc-700"
                      />
                    </div>

                    {!stickers.find(st => st.id === selectedStickerId)?.imageUrl && (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px]">Color:</span>
                        <input
                          type="color"
                          value={stickers.find(st => st.id === selectedStickerId)?.color || '#ffffff'}
                          onChange={e => updateSticker(selectedStickerId, { color: e.target.value })}
                          className="w-6 h-6 rounded cursor-pointer border border-zinc-200"
                        />
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => deleteSticker(selectedStickerId)}
                      className="text-red-500 hover:text-red-700 font-bold flex items-center gap-1 font-mono text-[10px] pl-2 border-l border-zinc-200"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                )}
              </div>

              {/* Right Side: Canva Sidebar Customizer Options */}
              <div className="w-full md:w-[450px] border-t md:border-t-0 md:border-l border-zinc-200 dark:border-zinc-800 flex flex-col bg-white dark:bg-zinc-950 overflow-y-auto custom-scrollbar">
                <div className="p-5 space-y-6">

                  {/* Presets & Templates */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                      <Layout size={12} /> Choose Template Design
                    </span>
                    <div className="grid grid-cols-4 gap-2">
                      {(['vibrant', 'cyberpunk', 'corporate', 'minimalist', 'retro', 'techconf', 'creative', 'formal-gold', 'midnight-hacker', 'glassmorphic-glow', 'gala-athletic', 'eco-minimal'] as const).map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => applyPreset(p)}
                          className={`py-2 px-0.5 rounded-lg text-[9px] font-bold font-mono border transition-all text-center uppercase tracking-tighter ${activeTemplate === p
                              ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow'
                              : 'border-zinc-200 dark:border-zinc-800 hover:border-black text-zinc-600 dark:text-zinc-400'
                            }`}
                        >
                          {p.replace('-official', '').replace('-gold', '').replace('-hacker', '').replace('-glow', '')}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={resetLayoutPositions}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 border border-dashed border-zinc-300 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-xl text-xs font-mono font-bold text-zinc-600 dark:text-zinc-400 transition-all mt-2.5"
                    >
                      <RefreshCw size={12} className="animate-hover-spin" />
                      🔄 Reset Element Positions
                    </button>
                  </div>

                  {/* Real-time Content Text Tuning */}
                  <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-900">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                      <Type size={12} /> Customize Poster Text
                    </span>
                    <div className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-zinc-400">Club Host</label>
                        <input
                          type="text"
                          value={clubName}
                          onChange={e => setClubName(e.target.value)}
                          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-zinc-400">Event Title</label>
                        <input
                          type="text"
                          value={title}
                          onChange={e => setTitle(e.target.value)}
                          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-purple-500 font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-mono uppercase text-zinc-400">Description</label>
                          <label className="flex items-center gap-1.5 cursor-pointer text-[9px] font-mono text-zinc-500">
                            <input
                              type="checkbox"
                              checked={showDesc}
                              onChange={e => setShowDesc(e.target.checked)}
                              className="w-3 h-3 rounded"
                            /> Show on Poster
                          </label>
                        </div>
                        <textarea
                          rows={2}
                          value={description}
                          onChange={e => setDescription(e.target.value)}
                          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-purple-500 resize-none font-light"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono uppercase text-zinc-400">Date</label>
                          <input
                            type="text"
                            value={eventDate}
                            onChange={e => setEventDate(e.target.value)}
                            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-purple-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono uppercase text-zinc-400">Time</label>
                          <input
                            type="text"
                            value={eventTime}
                            onChange={e => setEventTime(e.target.value)}
                            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-purple-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono uppercase text-zinc-400">Venue</label>
                          <input
                            type="text"
                            value={location}
                            onChange={e => setLocation(e.target.value)}
                            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Layout & Typography Tuning */}
                  <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-900">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                      <Settings size={12} /> Typography & Layout
                    </span>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono text-zinc-500 uppercase">Title Size</span>
                        <input type="range" min="20" max="60" value={titleSize} onChange={e => setTitleSize(parseInt(e.target.value))} className="w-full mt-1.5 accent-purple-600" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono text-zinc-500 uppercase">Title Align</span>
                        <div className="flex border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden h-7 mt-0.5">
                          {(['left', 'center', 'right'] as const).map(align => (
                            <button
                              key={align}
                              type="button"
                              onClick={() => setTitleAlign(align)}
                              className={`flex-1 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 ${titleAlign === align ? 'bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white font-bold' : 'text-zinc-400'
                                }`}
                            >
                              {align === 'left' ? <AlignLeft size={12} /> : align === 'center' ? <AlignCenter size={12} /> : <AlignRight size={12} />}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Field-Specific Typography & Colors */}
                    <div className="space-y-2.5 pt-2">
                      <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block">Field Font & Color Settings</span>
                      <div className="space-y-2.5">
                        {/* Host Club Field */}
                        <div className="flex flex-col gap-1.5 p-2.5 border border-zinc-100 dark:border-zinc-900 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/10">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 font-bold shrink-0 w-20">Host Club</span>
                            <div className="flex items-center gap-2 flex-1 justify-end">
                              <FontSelector value={clubFont} onChange={setClubFont} />
                              <input type="color" value={clubColor} onChange={e => setClubColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border border-zinc-200 shrink-0" />
                            </div>
                          </div>
                          <div className="flex justify-end pl-20">
                            <ColorSwatches value={clubColor} onChange={setClubColor} />
                          </div>
                        </div>

                        {/* Event Title Field */}
                        <div className="flex flex-col gap-1.5 p-2.5 border border-zinc-100 dark:border-zinc-900 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/10">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 font-bold shrink-0 w-20">Title</span>
                            <div className="flex items-center gap-2 flex-1 justify-end">
                              <FontSelector value={titleFont} onChange={setTitleFont} />
                              <input type="color" value={titleColor} onChange={e => setTitleColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border border-zinc-200 shrink-0" />
                            </div>
                          </div>
                          <div className="flex justify-end pl-20">
                            <ColorSwatches value={titleColor} onChange={setTitleColor} />
                          </div>
                        </div>

                        {/* Description Field */}
                        {showDesc && (
                          <div className="flex flex-col gap-1.5 p-2.5 border border-zinc-100 dark:border-zinc-900 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/10">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 font-bold shrink-0 w-20">Description</span>
                              <div className="flex items-center gap-2 flex-1 justify-end">
                                <FontSelector value={descFont} onChange={setDescFont} />
                                <input type="color" value={descColor} onChange={e => setDescColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border border-zinc-200 shrink-0" />
                              </div>
                            </div>
                            <div className="flex justify-end pl-20">
                              <ColorSwatches value={descColor} onChange={setDescColor} />
                            </div>
                          </div>
                        )}

                        {/* Date Field */}
                        <div className="flex flex-col gap-1.5 p-2.5 border border-zinc-100 dark:border-zinc-900 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/10">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 font-bold shrink-0 w-20">Event Date</span>
                            <div className="flex items-center gap-2 flex-1 justify-end">
                              <FontSelector value={dateFont} onChange={setDateFont} />
                              <input type="color" value={dateColor} onChange={e => setDateColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border border-zinc-200 shrink-0" />
                            </div>
                          </div>
                          <div className="flex justify-end pl-20">
                            <ColorSwatches value={dateColor} onChange={setDateColor} />
                          </div>
                        </div>

                        {/* Time Field */}
                        <div className="flex flex-col gap-1.5 p-2.5 border border-zinc-100 dark:border-zinc-900 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/10">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 font-bold shrink-0 w-20">Event Time</span>
                            <div className="flex items-center gap-2 flex-1 justify-end">
                              <FontSelector value={timeFont} onChange={setTimeFont} />
                              <input type="color" value={timeColor} onChange={e => setTimeColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border border-zinc-200 shrink-0" />
                            </div>
                          </div>
                          <div className="flex justify-end pl-20">
                            <ColorSwatches value={timeColor} onChange={setTimeColor} />
                          </div>
                        </div>

                        {/* Venue Field */}
                        <div className="flex flex-col gap-1.5 p-2.5 border border-zinc-100 dark:border-zinc-900 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/10">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 font-bold shrink-0 w-20">Venue</span>
                            <div className="flex items-center gap-2 flex-1 justify-end">
                              <FontSelector value={venueFont} onChange={setVenueFont} />
                              <input type="color" value={venueColor} onChange={e => setVenueColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border border-zinc-200 shrink-0" />
                            </div>
                          </div>
                          <div className="flex justify-end pl-20">
                            <ColorSwatches value={venueColor} onChange={setVenueColor} />
                          </div>
                        </div>

                        {/* Speaker Fields */}
                        {showSpeaker && (
                          <>
                            <div className="flex flex-col gap-1.5 p-2.5 border border-zinc-100 dark:border-zinc-900 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/10">
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 font-bold shrink-0 w-20">Guest Name</span>
                                <div className="flex items-center gap-2 flex-1 justify-end">
                                  <FontSelector value={speakerNameFont} onChange={setSpeakerNameFont} />
                                  <input type="color" value={speakerNameColor} onChange={e => setSpeakerNameColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border border-zinc-200 shrink-0" />
                                </div>
                              </div>
                              <div className="flex justify-end pl-20">
                                <ColorSwatches value={speakerNameColor} onChange={setSpeakerNameColor} />
                              </div>
                            </div>

                            <div className="flex flex-col gap-1.5 p-2.5 border border-zinc-100 dark:border-zinc-900 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/10">
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 font-bold shrink-0 w-20">Guest Role</span>
                                <div className="flex items-center gap-2 flex-1 justify-end">
                                  <FontSelector value={speakerTitleFont} onChange={setSpeakerTitleFont} />
                                  <input type="color" value={speakerTitleColor} onChange={e => setSpeakerTitleColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border border-zinc-200 shrink-0" />
                                </div>
                              </div>
                              <div className="flex justify-end pl-20">
                                <ColorSwatches value={speakerTitleColor} onChange={setSpeakerTitleColor} />
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Canvas Background Settings */}
                  <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-900">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                      <Palette size={12} /> Canvas Background
                    </span>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-mono">
                        <input type="radio" checked={bgColorType === 'gradient'} onChange={() => setBgColorType('gradient')} /> Gradient Mix
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-mono">
                        <input type="radio" checked={bgColorType === 'solid'} onChange={() => setBgColorType('solid')} /> Solid Color
                      </label>
                    </div>

                    {bgColorType === 'solid' ? (
                      <div className="flex items-center gap-2">
                        <input type="color" value={bgSolidColor} onChange={e => setBgSolidColor(e.target.value)} className="w-8 h-8 rounded border" />
                        <span className="text-xs font-mono">{bgSolidColor}</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono text-zinc-500 uppercase">Start Color</span>
                          <input type="color" value={bgGradStart} onChange={e => setBgGradStart(e.target.value)} className="w-full h-8 rounded border" />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono text-zinc-500 uppercase">End Color</span>
                          <input type="color" value={bgGradEnd} onChange={e => setBgGradEnd(e.target.value)} className="w-full h-8 rounded border" />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono text-zinc-500 uppercase">Angle</span>
                          <select
                            value={bgGradAngle}
                            onChange={e => setBgGradAngle(e.target.value)}
                            className="w-full rounded-lg border h-8 text-[10px] px-1 bg-white dark:bg-zinc-900"
                          >
                            <option value="to bottom right">Diagonal (↘)</option>
                            <option value="to top right">Diagonal (↗)</option>
                            <option value="to bottom">Vertical (↓)</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Add Stickers Elements */}
                  <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-900">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                      <Plus size={12} /> Add Graphic Stickers
                    </span>
                    <div className="grid grid-cols-10 gap-1.5 p-1.5 border border-zinc-100 dark:border-zinc-900 rounded-xl">
                      {Object.keys(STICKER_ICONS).map(iconName => {
                        const IconComponent = STICKER_ICONS[iconName]
                        return (
                          <button
                            key={iconName}
                            type="button"
                            onClick={() => addSticker(iconName)}
                            className="p-1.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-black dark:hover:text-white rounded-lg flex items-center justify-center transition-colors"
                            title={`Add ${iconName} sticker`}
                          >
                            <IconComponent size={14} />
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  {/* Add Institutional Logos */}
                  <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-900">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                      <Award size={12} /> Add Institutional Logos
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => addLogoSticker('/iic/gcem-crest.png')}
                        className="p-2 border border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-xl flex flex-col items-center justify-center gap-1 transition-all"
                      >
                        <img src="/iic/gcem-crest.png" alt="GCEM Crest" className="h-8 object-contain" />
                        <span className="text-[8px] font-mono text-zinc-500 mt-1">GCEM Crest</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => addLogoSticker('/iic/iic-logo.png')}
                        className="p-2 border border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-xl flex flex-col items-center justify-center gap-1 transition-all"
                      >
                        <img src="/iic/iic-logo.png" alt="IIC Logo" className="h-8 object-contain" />
                        <span className="text-[8px] font-mono text-zinc-500 mt-1">IIC Logo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => addLogoSticker('/logo.png')}
                        className="p-2 border border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-xl flex flex-col items-center justify-center gap-1 transition-all"
                      >
                        <img src="/logo.png" alt="Club-Eve Logo" className="h-8 object-contain" />
                        <span className="text-[8px] font-mono text-zinc-500 mt-1">Club-Eve Logo</span>
                      </button>
                    </div>
                  </div>

                  {/* Speaker Details Control */}
                  <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-900">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                        <Users size={12} /> Speaker / Guest Details
                      </span>
                      <label className="flex items-center gap-1.5 cursor-pointer text-[9px] font-mono text-zinc-500">
                        <input
                          type="checkbox"
                          checked={showSpeaker}
                          onChange={e => setShowSpeaker(e.target.checked)}
                          className="w-3 h-3 rounded"
                        /> Enable Speaker
                      </label>
                    </div>

                    {showSpeaker && (
                      <div className="space-y-3 pt-1">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-mono uppercase text-zinc-400">Speaker Name</label>
                            <input
                              type="text"
                              value={speakerName}
                              onChange={e => setSpeakerName(e.target.value)}
                              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1 text-xs outline-none focus:ring-1 focus:ring-purple-500 font-bold"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-mono uppercase text-zinc-400">Speaker Role / Title</label>
                            <input
                              type="text"
                              value={speakerTitle}
                              onChange={e => setSpeakerTitle(e.target.value)}
                              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1 text-xs outline-none focus:ring-1 focus:ring-purple-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* QR Code Adjustments */}
                  <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-900">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                        <Terminal size={12} /> Event Link QR Settings
                      </span>
                      <label className="flex items-center gap-1.5 cursor-pointer text-[9px] font-mono text-zinc-500">
                        <input
                          type="checkbox"
                          checked={showQr}
                          onChange={e => setShowQr(e.target.checked)}
                          className="w-3 h-3 rounded"
                        /> Enable QR
                      </label>
                    </div>

                    {showQr && (
                      <div className="grid grid-cols-2 gap-3.5 pt-1">
                        <div className="space-y-1 col-span-2">
                          <span className="text-[9px] font-mono text-zinc-500 uppercase">QR Position Presets</span>
                          <select
                            value={qrPosition}
                            onChange={e => {
                              const val = e.target.value as any
                              setQrPosition(val)
                              if (val === 'bottom-right') {
                                setQrX(85)
                                setQrY(88)
                              } else if (val === 'bottom-left') {
                                setQrX(15)
                                setQrY(88)
                              } else if (val === 'top-right') {
                                setQrX(85)
                                setQrY(12)
                              }
                            }}
                            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-[10px] outline-none"
                          >
                            <option value="bottom-right">Bottom Right Preset</option>
                            <option value="bottom-left">Bottom Left Preset</option>
                            <option value="top-right">Top Right Preset</option>
                            <option value="custom">Custom (Draggable 🖐️)</option>
                          </select>
                        </div>

                        {/* QR Code Colors Customizer */}
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono text-zinc-500 uppercase">QR Pattern Color</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={qrColorDark}
                              onChange={e => setQrColorDark(e.target.value)}
                              className="w-7 h-7 rounded cursor-pointer border border-zinc-200 shrink-0"
                            />
                            <span className="text-[10px] font-mono">{qrColorDark.toUpperCase()}</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] font-mono text-zinc-500 uppercase">QR Background</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={qrColorLight}
                              onChange={e => setQrColorLight(e.target.value)}
                              className="w-7 h-7 rounded cursor-pointer border border-zinc-200 shrink-0"
                            />
                            <span className="text-[10px] font-mono">{qrColorLight.toUpperCase()}</span>
                          </div>
                        </div>

                        <div className="space-y-1 col-span-2">
                          <span className="text-[9px] font-mono text-zinc-500 uppercase">Quick QR Color Swatches</span>
                          <ColorSwatches value={qrColorDark} onChange={setQrColorDark} />
                        </div>

                        {/* Element Fine-Tuning Sliders */}
                        <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-900 col-span-2">
                          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                            <Settings size={12} /> Fine-Tune Coordinates (X / Y)
                          </span>
                          <div className="space-y-3.5 border border-zinc-100 dark:border-zinc-900 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/20 text-xs">
                            {/* Host Club Sliders */}
                            <div className="space-y-1">
                              <span className="text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-400">Host Club Position</span>
                              <div className="grid grid-cols-2 gap-3">
                                <label className="flex flex-col text-[9px] font-mono text-zinc-500">
                                  X: {Math.round(clubX)}%
                                  <input type="range" min="0" max="100" value={Math.round(clubX)} onChange={e => setClubX(parseInt(e.target.value))} className="mt-1 accent-purple-600" />
                                </label>
                                <label className="flex flex-col text-[9px] font-mono text-zinc-500">
                                  Y: {Math.round(clubY)}%
                                  <input type="range" min="0" max="100" value={Math.round(clubY)} onChange={e => setClubY(parseInt(e.target.value))} className="mt-1 accent-purple-600" />
                                </label>
                              </div>
                            </div>

                            {/* Title Sliders */}
                            <div className="space-y-1">
                              <span className="text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-400">Title Position</span>
                              <div className="grid grid-cols-2 gap-3">
                                <label className="flex flex-col text-[9px] font-mono text-zinc-500">
                                  X: {Math.round(titleX)}%
                                  <input type="range" min="0" max="100" value={Math.round(titleX)} onChange={e => setTitleX(parseInt(e.target.value))} className="mt-1 accent-purple-600" />
                                </label>
                                <label className="flex flex-col text-[9px] font-mono text-zinc-500">
                                  Y: {Math.round(titleY)}%
                                  <input type="range" min="0" max="100" value={Math.round(titleY)} onChange={e => setTitleY(parseInt(e.target.value))} className="mt-1 accent-purple-600" />
                                </label>
                              </div>
                            </div>

                            {/* Description Sliders */}
                            {showDesc && (
                              <div className="space-y-1">
                                <span className="text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-400">Description Position</span>
                                <div className="grid grid-cols-2 gap-3">
                                  <label className="flex flex-col text-[9px] font-mono text-zinc-500">
                                    X: {Math.round(descX)}%
                                    <input type="range" min="0" max="100" value={Math.round(descX)} onChange={e => setDescX(parseInt(e.target.value))} className="mt-1 accent-purple-600" />
                                  </label>
                                  <label className="flex flex-col text-[9px] font-mono text-zinc-500">
                                    Y: {Math.round(descY)}%
                                    <input type="range" min="0" max="100" value={Math.round(descY)} onChange={e => setDescY(parseInt(e.target.value))} className="mt-1 accent-purple-600" />
                                  </label>
                                </div>
                              </div>
                            )}

                            {/* Logistics details Sliders */}
                            <div className="space-y-1">
                              <span className="text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-400">Logistics Details Position</span>
                              <div className="grid grid-cols-2 gap-3">
                                <label className="flex flex-col text-[9px] font-mono text-zinc-500">
                                  X: {Math.round(detailsX)}%
                                  <input type="range" min="0" max="100" value={Math.round(detailsX)} onChange={e => setDetailsX(parseInt(e.target.value))} className="mt-1 accent-purple-600" />
                                </label>
                                <label className="flex flex-col text-[9px] font-mono text-zinc-500">
                                  Y: {Math.round(detailsY)}%
                                  <input type="range" min="0" max="100" value={Math.round(detailsY)} onChange={e => setDetailsY(parseInt(e.target.value))} className="mt-1 accent-purple-600" />
                                </label>
                              </div>
                            </div>

                            {/* QR Code Sliders */}
                            {showQr && (
                              <div className="space-y-1">
                                <span className="text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-400">QR Code Position</span>
                                <div className="grid grid-cols-2 gap-3">
                                  <label className="flex flex-col text-[9px] font-mono text-zinc-500">
                                    X: {Math.round(qrX)}%
                                    <input type="range" min="0" max="100" value={Math.round(qrX)} onChange={e => setQrX(parseInt(e.target.value))} className="mt-1 accent-purple-600" />
                                  </label>
                                  <label className="flex flex-col text-[9px] font-mono text-zinc-500">
                                    Y: {Math.round(qrY)}%
                                    <input type="range" min="0" max="100" value={Math.round(qrY)} onChange={e => setQrY(parseInt(e.target.value))} className="mt-1 accent-purple-600" />
                                  </label>
                                </div>
                              </div>
                            )}

                            {/* Speaker Sliders */}
                            {showSpeaker && (
                              <div className="space-y-1">
                                <span className="text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-400">Speaker Badge Position</span>
                                <div className="grid grid-cols-2 gap-3">
                                  <label className="flex flex-col text-[9px] font-mono text-zinc-500">
                                    X: {Math.round(speakerX)}%
                                    <input type="range" min="0" max="100" value={Math.round(speakerX)} onChange={e => setSpeakerX(parseInt(e.target.value))} className="mt-1 accent-purple-600" />
                                  </label>
                                  <label className="flex flex-col text-[9px] font-mono text-zinc-500">
                                    Y: {Math.round(speakerY)}%
                                    <input type="range" min="0" max="100" value={Math.round(speakerY)} onChange={e => setSpeakerY(parseInt(e.target.value))} className="mt-1 accent-purple-600" />
                                  </label>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1 col-span-2">
                          <span className="text-[9px] font-mono text-zinc-500 uppercase flex justify-between">
                            <span>QR Width</span>
                            <span>{qrSize}px</span>
                          </span>
                          <input
                            type="range"
                            min="60"
                            max="140"
                            value={qrSize}
                            onChange={e => setQrSize(parseInt(e.target.value))}
                            className="w-full mt-2"
                          />
                        </div>
                      </div>
                    )}
                    <p className="text-[9px] font-mono text-zinc-400 italic">QR scans directly to the public details & registration page of this event.</p>
                  </div>

                </div>
              </div>

            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-900 flex flex-wrap gap-3 items-center justify-between bg-zinc-50 dark:bg-zinc-950">
              {/* File Export options */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleExportFile('png')}
                  className="flex items-center gap-1.5 px-3 py-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-xs font-mono transition-all font-semibold"
                >
                  <Download size={12} /> PNG
                </button>
                <button
                  type="button"
                  onClick={() => handleExportFile('jpeg')}
                  className="flex items-center gap-1.5 px-3 py-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-xs font-mono transition-all font-semibold"
                >
                  <Download size={12} /> JPG
                </button>
                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="flex items-center gap-1.5 px-3 py-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-xs font-mono transition-all font-semibold"
                >
                  <Download size={12} /> PDF
                </button>
              </div>

              {/* Apply & Cancel */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-xs font-mono font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleApplyToForm}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-100 text-xs font-mono font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Uploading & Applying...
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      Apply as Event Banner
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  )
}
