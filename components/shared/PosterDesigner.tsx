'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Sparkles, Code, Music, GraduationCap, Mic, Megaphone, Users, Calendar, 
  MapPin, Terminal, Award, BookOpen, Coffee, Flame, Heart, Lightbulb, 
  Smile, Star, Target, Trophy, HelpCircle, X, Download, Upload, AlignLeft, 
  AlignCenter, AlignRight, Type, Palette, Layout, Settings, Play, RefreshCw,
  Plus, Trash2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Eye
} from 'lucide-react'
import { toPng, toJpeg } from 'html-to-image'
import { PDFDocument } from 'pdf-lib'
import QRCode from 'qrcode'
import { toast } from 'sonner'

// List of available icons for stickers
const STICKER_ICONS: Record<string, React.ComponentType<any>> = {
  Sparkles, Code, Music, GraduationCap, Mic, Megaphone, Users, Calendar, 
  MapPin, Terminal, Award, BookOpen, Coffee, Flame, Heart, Lightbulb, 
  Smile, Star, Target, Trophy
}

interface Sticker {
  id: string
  iconName: string
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

  // Design state
  const [activeTemplate, setActiveTemplate] = useState<'cyberpunk' | 'vibrant' | 'corporate' | 'minimalist' | 'retro'>('vibrant')
  
  // Customization controls
  const [titleColor, setTitleColor] = useState('#ffffff')
  const [titleSize, setTitleSize] = useState(36) // px
  const [titleFont, setTitleFont] = useState('font-sans') // font-sans, font-serif, font-mono
  const [titleAlign, setTitleAlign] = useState<'left' | 'center' | 'right'>('center')
  
  const [clubColor, setClubColor] = useState('#a855f7')
  const [clubSize, setClubSize] = useState(14)
  
  const [descColor, setDescColor] = useState('#d1d5db')
  const [descSize, setDescSize] = useState(14)
  const [showDesc, setShowDesc] = useState(true)

  const [detailsColor, setDetailsColor] = useState('#ffffff')
  const [detailsBg, setDetailsBg] = useState('rgba(255, 255, 255, 0.1)')
  const [detailsBorderColor, setDetailsBorderColor] = useState('rgba(255, 255, 255, 0.15)')

  // Background Customization
  const [bgColorType, setBgColorType] = useState<'gradient' | 'solid'>('gradient')
  const [bgSolidColor, setBgSolidColor] = useState('#0f172a')
  const [bgGradStart, setBgGradStart] = useState('#3b82f6')
  const [bgGradEnd, setBgGradEnd] = useState('#ec4899')
  const [bgGradAngle, setBgGradAngle] = useState('to bottom right')

  // QR Code settings
  const [showQr, setShowQr] = useState(true)
  const [qrSize, setQrSize] = useState(90)
  const [qrPosition, setQrPosition] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'center-bottom' | 'custom'>('bottom-right')
  const [qrColorDark, setQrColorDark] = useState('#000000')
  const [qrColorLight, setQrColorLight] = useState('#ffffff')
  const [qrX, setQrX] = useState(80) // percentage
  const [qrY, setQrY] = useState(80) // percentage

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

  // QR code URL generator
  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/events/${eventId}`
    : `https://clubeve.nivet2006.in/events/${eventId}`

  // Re-generate QR Data URL when colors or URL changes
  useEffect(() => {
    QRCode.toDataURL(
      publicUrl,
      {
        width: 200,
        margin: 1,
        color: {
          dark: qrColorDark,
          light: qrColorLight
        }
      },
      (err, dataUrl) => {
        if (!err) {
          setQrDataUrl(dataUrl)
        }
      }
    )
  }, [publicUrl, qrColorDark, qrColorLight])

  // Pre-configured Design Presets
  const applyPreset = (presetName: 'cyberpunk' | 'vibrant' | 'corporate' | 'minimalist' | 'retro') => {
    setActiveTemplate(presetName)
    switch(presetName) {
      case 'cyberpunk':
        setBgColorType('solid')
        setBgSolidColor('#080710')
        setTitleColor('#00f2fe')
        setTitleSize(38)
        setTitleFont('font-mono')
        setTitleAlign('center')
        setClubColor('#ec4899')
        setDescColor('#00f2fe')
        setDetailsColor('#00f2fe')
        setDetailsBg('rgba(0, 0, 0, 0.6)')
        setDetailsBorderColor('#00f2fe')
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
        setDescColor('#f3f4f6')
        setDetailsColor('#ffffff')
        setDetailsBg('rgba(255, 255, 255, 0.15)')
        setDetailsBorderColor('rgba(255, 255, 255, 0.25)')
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
        setDescColor('#94a3b8')
        setDetailsColor('#ffffff')
        setDetailsBg('rgba(15, 23, 42, 0.8)')
        setDetailsBorderColor('#f59e0b')
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
        setDescColor('#374151')
        setDetailsColor('#000000')
        setDetailsBg('transparent')
        setDetailsBorderColor('#000000')
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
        setDescColor('#1e293b')
        setDetailsColor('#000000')
        setDetailsBg('#ffffff')
        setDetailsBorderColor('#000000')
        setQrColorDark('#000000')
        setQrColorLight('#ffffff')
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

  // Handle dragging for QR code
  const handleQrDragStart = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    if (qrPosition !== 'custom') return
    if ('button' in e && e.button !== 0) return // Only drag on left click
    e.preventDefault()
    e.stopPropagation()

    const startX = qrX
    const startY = qrY

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

      setQrX(newX)
      setQrY(newY)
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

  // Render poster element to an image url
  const getRenderedImageBlob = async (format: 'png' | 'jpeg' | 'jpg'): Promise<Blob | null> => {
    if (!posterRef.current) return null
    try {
      // Unselect sticker before capturing
      setSelectedStickerId(null)
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
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-5 py-2.5 bg-[#f4f4f5] dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-bold font-mono tracking-wider transition-all"
      >
        <Sparkles size={14} className="text-purple-600 dark:text-purple-400" />
        🎨 Design Poster (Canva-style)
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
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
              <div className="flex-1 bg-zinc-100 dark:bg-zinc-900/60 p-6 flex flex-col items-center justify-center overflow-y-auto min-h-[350px]">
                <div className="w-full flex justify-between items-center mb-3">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Eye size={12} /> Interactive Poster Canvas (400 × 560 px)
                  </span>
                  <span className="text-[9px] font-mono text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 px-2 py-0.5 rounded-full border border-purple-200/50 dark:border-purple-800/30">
                    🖐️ Drag stickers or QR directly to position
                  </span>
                </div>

                {/* Actual Poster Element */}
                <div 
                  ref={posterRef}
                  style={getPosterBgStyle()}
                  className={`w-[400px] h-[560px] rounded-2xl relative overflow-hidden shadow-2xl flex flex-col justify-between p-7 select-none ${
                    activeTemplate === 'cyberpunk' ? 'border-2 border-[#00f2fe]' : 
                    activeTemplate === 'corporate' ? 'border-4 border-double border-[#f59e0b]' : 
                    activeTemplate === 'retro' ? 'border-4 border-black' : ''
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

                  {/* Header / Club Identity */}
                  <div className="z-10 flex justify-between items-start">
                    <div className="flex flex-col">
                      <span 
                        style={{ color: clubColor, fontSize: `${clubSize}px` }}
                        className={`uppercase tracking-widest font-bold font-mono`}
                      >
                        {clubName || 'Host Club'}
                      </span>
                      {activeTemplate === 'cyberpunk' && (
                        <span className="text-[8px] text-zinc-500 font-mono tracking-tighter mt-0.5">Club-Eve System v1.0</span>
                      )}
                    </div>
                  </div>

                  {/* Dynamic Stickers / Decals */}
                  {stickers.map(sticker => {
                    const StickerIcon = STICKER_ICONS[sticker.iconName] || HelpCircle
                    const isSelected = selectedStickerId === sticker.id
                    return (
                      <div
                        key={sticker.id}
                        onMouseDown={(e) => handleStickerDragStart(e, sticker.id)}
                        onTouchStart={(e) => handleStickerDragStart(e, sticker.id)}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedStickerId(sticker.id)
                        }}
                        style={{
                          position: 'absolute',
                          left: `${sticker.x}%`,
                          top: `${sticker.y}%`,
                          transform: 'translate(-50%, -50%)',
                          cursor: isSelected ? 'grabbing' : 'grab',
                          zIndex: 20
                        }}
                        className={`group relative p-1 rounded-lg border transition-all ${
                          isSelected ? 'border-dashed border-red-500 ring-2 ring-red-500/20 bg-black/5 dark:bg-white/5' : 'border-transparent hover:border-zinc-300 dark:hover:border-zinc-700'
                        }`}
                      >
                        <StickerIcon size={sticker.size} style={{ color: sticker.color }} />
                      </div>
                    )
                  })}

                  {/* Main Event Title & Description */}
                  <div className="z-10 my-auto flex flex-col justify-center py-4">
                    <h1 
                      style={{ 
                        color: titleColor, 
                        fontSize: `${titleSize}px`,
                        textAlign: titleAlign
                      }}
                      className={`font-black tracking-tight leading-none uppercase select-text break-words ${titleFont} ${
                        activeTemplate === 'cyberpunk' ? 'text-shadow-neon' : ''
                      } ${
                        activeTemplate === 'retro' ? 'drop-shadow-[3px_3px_0px_#000000]' : ''
                      }`}
                    >
                      {title || 'EXQUISITE EVENT'}
                    </h1>
                    
                    {showDesc && (
                      <p 
                        style={{ color: descColor, fontSize: `${descSize}px` }}
                        className={`mt-4 leading-relaxed font-sans line-clamp-3 select-text ${
                          activeTemplate === 'retro' ? 'font-medium' : 'font-light'
                        }`}
                      >
                        {description || 'Join us for this exciting departmental event packed with learning, collaboration, and certificate outcomes.'}
                      </p>
                    )}
                  </div>

                  {/* Footer (Details Grid & QR Code) */}
                  <div className="z-10 flex items-end justify-between gap-4 mt-auto">
                    
                    {/* Event Logistics (Time / Venue) */}
                    <div 
                      style={{ 
                        backgroundColor: detailsBg, 
                        borderColor: detailsBorderColor,
                        color: detailsColor
                      }}
                      className={`flex-1 rounded-xl p-3 border backdrop-blur-sm space-y-1.5 text-left ${
                        activeTemplate === 'retro' ? 'border-2 border-black shadow-[3px_3px_0px_#000000] text-black font-semibold' : ''
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="shrink-0 opacity-80" />
                        <span className="text-[10px] font-mono leading-none truncate">
                          {getFormattedDate(eventDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} className="shrink-0 opacity-80" />
                        <span className="text-[10px] font-mono leading-none truncate">
                          {location || 'Venue: TBA'}
                        </span>
                      </div>
                    </div>

                    {/* QR Code Container (Standard Positions) */}
                    {showQr && qrDataUrl && qrPosition !== 'custom' && qrPosition !== 'top-right' && (
                      <div 
                        style={{ 
                          width: `${qrSize}px`, 
                          height: `${qrSize}px`,
                          backgroundColor: qrColorLight,
                          borderColor: activeTemplate === 'retro' ? '#000000' : detailsBorderColor
                        }}
                        className={`shrink-0 aspect-square rounded-xl p-1.5 border flex items-center justify-center bg-white ${
                          activeTemplate === 'retro' ? 'border-2 border-black shadow-[3px_3px_0px_#000000]' : ''
                        } ${
                          qrPosition === 'bottom-left' ? 'order-first' : ''
                        }`}
                      >
                        <img 
                          src={qrDataUrl} 
                          alt="Event QR code" 
                          className="w-full h-full object-contain pointer-events-none"
                        />
                      </div>
                    )}

                  </div>

                  {/* Absolute / Draggable QR Code */}
                  {showQr && qrDataUrl && (qrPosition === 'custom' || qrPosition === 'top-right') && (
                    <div 
                      onMouseDown={(e) => qrPosition === 'custom' && handleQrDragStart(e)}
                      onTouchStart={(e) => qrPosition === 'custom' && handleQrDragStart(e)}
                      style={{ 
                        width: `${qrSize}px`, 
                        height: `${qrSize}px`,
                        backgroundColor: qrColorLight,
                        borderColor: activeTemplate === 'retro' ? '#000000' : detailsBorderColor,
                        position: 'absolute',
                        left: qrPosition === 'custom' ? `${qrX}%` : undefined,
                        right: qrPosition === 'top-right' ? '28px' : undefined,
                        top: qrPosition === 'custom' ? `${qrY}%` : '28px',
                        transform: qrPosition === 'custom' ? 'translate(-50%, -50%)' : undefined,
                        cursor: qrPosition === 'custom' ? 'grab' : 'default',
                        zIndex: 30
                      }}
                      className={`shrink-0 aspect-square rounded-xl p-1.5 border flex items-center justify-center bg-white ${
                        activeTemplate === 'retro' ? 'border-2 border-black shadow-[3px_3px_0px_#000000]' : ''
                      } ${
                        qrPosition === 'custom' ? 'hover:ring-2 hover:ring-purple-500/50' : ''
                      }`}
                    >
                      <img 
                        src={qrDataUrl} 
                        alt="Event QR code" 
                        className="w-full h-full object-contain pointer-events-none"
                      />
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
                          if(s) updateSticker(selectedStickerId, { y: Math.max(0, s.y - 2) })
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
                          if(s) updateSticker(selectedStickerId, { y: Math.min(100, s.y + 2) })
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
                          if(s) updateSticker(selectedStickerId, { x: Math.max(0, s.x - 2) })
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
                          if(s) updateSticker(selectedStickerId, { x: Math.min(100, s.x + 2) })
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

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px]">Color:</span>
                      <input 
                        type="color"
                        value={stickers.find(st => st.id === selectedStickerId)?.color || '#ffffff'}
                        onChange={e => updateSticker(selectedStickerId, { color: e.target.value })}
                        className="w-6 h-6 rounded cursor-pointer border border-zinc-200" 
                      />
                    </div>

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
              <div className="w-full md:w-[450px] border-t md:border-t-0 md:border-l border-zinc-200 dark:border-zinc-800 flex flex-col bg-white dark:bg-zinc-950 overflow-y-auto">
                <div className="p-5 space-y-6">
                  
                  {/* Presets & Templates */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                      <Layout size={12} /> Choose Template Design
                    </span>
                    <div className="grid grid-cols-5 gap-1.5">
                      {(['vibrant', 'cyberpunk', 'corporate', 'minimalist', 'retro'] as const).map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => applyPreset(p)}
                          className={`py-2 px-0.5 rounded-lg text-[9px] font-bold font-mono border transition-all text-center uppercase tracking-tighter ${
                            activeTemplate === p
                              ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow'
                              : 'border-zinc-200 dark:border-zinc-800 hover:border-black text-zinc-600 dark:text-zinc-400'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
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
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono uppercase text-zinc-400">Location</label>
                          <input 
                            type="text" 
                            value={location}
                            onChange={e => setLocation(e.target.value)}
                            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-purple-500" 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono uppercase text-zinc-400">Date/Time</label>
                          <input 
                            type="text" 
                            value={eventDate}
                            onChange={e => setEventDate(e.target.value)}
                            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-purple-500" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Layout & Typography Tuning */}
                  <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-900">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                      <Settings size={12} /> Typography & Colors
                    </span>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono text-zinc-500 uppercase">Title Font</span>
                        <select
                          value={titleFont}
                          onChange={e => setTitleFont(e.target.value)}
                          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-xs"
                        >
                          <option value="font-sans">Modern Sans</option>
                          <option value="font-serif">Classic Serif</option>
                          <option value="font-mono">Mono Code</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono text-zinc-500 uppercase">Title Align</span>
                        <div className="flex border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden h-7">
                          {(['left', 'center', 'right'] as const).map(align => (
                            <button
                              key={align}
                              type="button"
                              onClick={() => setTitleAlign(align)}
                              className={`flex-1 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                                titleAlign === align ? 'bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white font-bold' : 'text-zinc-400'
                              }`}
                            >
                              {align === 'left' ? <AlignLeft size={12} /> : align === 'center' ? <AlignCenter size={12} /> : <AlignRight size={12} />}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <div className="space-y-1 flex flex-col">
                        <span className="text-[9px] font-mono text-zinc-500 uppercase">Title Color</span>
                        <div className="flex items-center gap-1.5">
                          <input type="color" value={titleColor} onChange={e => setTitleColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border border-zinc-200" />
                          <span className="text-[9px] font-mono truncate">{titleColor}</span>
                        </div>
                      </div>
                      <div className="space-y-1 flex flex-col">
                        <span className="text-[9px] font-mono text-zinc-500 uppercase">Club Color</span>
                        <div className="flex items-center gap-1.5">
                          <input type="color" value={clubColor} onChange={e => setClubColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border border-zinc-200" />
                          <span className="text-[9px] font-mono truncate">{clubColor}</span>
                        </div>
                      </div>
                      <div className="space-y-1 flex flex-col">
                        <span className="text-[9px] font-mono text-zinc-500 uppercase">Text Size</span>
                        <input type="range" min="20" max="60" value={titleSize} onChange={e => setTitleSize(parseInt(e.target.value))} className="w-full mt-2" />
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
                    <div className="grid grid-cols-10 gap-1.5 max-h-[85px] overflow-y-auto p-1 border border-zinc-100 dark:border-zinc-900 rounded-lg">
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
                          <span className="text-[9px] font-mono text-zinc-500 uppercase">QR Position</span>
                          <select
                            value={qrPosition}
                            onChange={e => setQrPosition(e.target.value as any)}
                            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-[10px] outline-none"
                          >
                            <option value="bottom-right">Bottom Right (Standard)</option>
                            <option value="bottom-left">Bottom Left</option>
                            <option value="top-right">Top Right Corner</option>
                            <option value="custom">Custom Position (Draggable 🖐️)</option>
                          </select>
                        </div>

                        {qrPosition === 'custom' && (
                          <div className="space-y-2 col-span-2 grid grid-cols-2 gap-3.5 border border-zinc-100 dark:border-zinc-900 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/20">
                            <div className="space-y-1">
                              <span className="text-[9px] font-mono text-zinc-500 uppercase flex justify-between">
                                <span>QR X (Left)</span>
                                <span>{Math.round(qrX)}%</span>
                              </span>
                              <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                value={Math.round(qrX)} 
                                onChange={e => setQrX(parseInt(e.target.value))} 
                                className="w-full mt-1 accent-purple-600" 
                              />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] font-mono text-zinc-500 uppercase flex justify-between">
                                <span>QR Y (Top)</span>
                                <span>{Math.round(qrY)}%</span>
                              </span>
                              <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                value={Math.round(qrY)} 
                                onChange={e => setQrY(parseInt(e.target.value))} 
                                className="w-full mt-1 accent-purple-600" 
                              />
                            </div>
                          </div>
                        )}

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
