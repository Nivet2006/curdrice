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
  const [eventTime, setEventTime] = useState('1:30 PM')

  // Design state
  const [activeTemplate, setActiveTemplate] = useState<'cyberpunk' | 'vibrant' | 'corporate' | 'minimalist' | 'retro' | 'techconf' | 'creative' | 'academic-official' | 'formal-gold' | 'midnight-hacker' | 'glassmorphic-glow' | 'gala-athletic' | 'eco-minimal'>('vibrant')
  
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
  const applyPreset = (presetName: 'cyberpunk' | 'vibrant' | 'corporate' | 'minimalist' | 'retro' | 'techconf' | 'creative' | 'academic-official' | 'formal-gold' | 'midnight-hacker' | 'glassmorphic-glow' | 'gala-athletic' | 'eco-minimal') => {
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
        setDescColor('#a1a1aa')
        setDetailsColor('#ffffff')
        setDetailsBg('rgba(9, 9, 11, 0.5)')
        setDetailsBorderColor('#3b82f6')
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
        setDescColor('#f3f4f6')
        setDetailsColor('#ffffff')
        setDetailsBg('rgba(0, 0, 0, 0.3)')
        setDetailsBorderColor('rgba(255, 255, 255, 0.4)')
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
      case 'academic-official':
        setBgColorType('gradient')
        setBgGradStart('#eff6ff') // blue-50
        setBgGradEnd('#ffffff')
        setBgGradAngle('to bottom')
        setTitleColor('#1e3a8a') // dark blue (Gopalan style)
        setTitleSize(28)
        setTitleFont('font-sans')
        setTitleAlign('left')
        setClubColor('#2563eb')
        setDescColor('#475569')
        setDetailsColor('#1e3a8a')
        setDetailsBg('transparent')
        setDetailsBorderColor('transparent')
        setQrColorDark('#1e3a8a')
        setQrColorLight('#ffffff')
        
        setClubX(28)
        setClubY(20)
        setTitleX(45)
        setTitleY(32)
        setDescX(45)
        setDescY(47)
        setDetailsX(26)
        setDetailsY(62)
        setQrX(80)
        setQrY(86)
        
        setShowSpeaker(true)
        setSpeakerName('Nived Shaji')
        setSpeakerTitle('Resource Person')
        setSpeakerX(28)
        setSpeakerY(84)
        break
      case 'formal-gold':
        setBgColorType('solid')
        setBgSolidColor('#0b0f19')
        setTitleColor('#d4af37') // Gold
        setTitleSize(32)
        setTitleFont('font-serif')
        setTitleAlign('center')
        setClubColor('#ffffff')
        setDescColor('#94a3b8')
        setDetailsColor('#d4af37')
        setDetailsBg('rgba(11, 15, 25, 0.95)')
        setDetailsBorderColor('#d4af37')
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
        setDescColor('#a1a1aa')
        setDetailsColor('#22c55e')
        setDetailsBg('rgba(3, 7, 18, 0.85)')
        setDetailsBorderColor('#22c55e')
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
        setDescColor('#e2e8f0')
        setDetailsColor('#ffffff')
        setDetailsBg('rgba(255, 255, 255, 0.08)')
        setDetailsBorderColor('rgba(255, 255, 255, 0.18)')
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
        setDescColor('#f3f4f6')
        setDetailsColor('#ffffff')
        setDetailsBg('#1f2937')
        setDetailsBorderColor('#ef4444')
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
        setDescColor('#374151')
        setDetailsColor('#065f46')
        setDetailsBg('rgba(255, 255, 255, 0.9)')
        setDetailsBorderColor('#a7f3d0')
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
    toast.success('All element positions reset to defaults!')
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
                    🖐️ Click and drag ANY element to position it!
                  </span>
                </div>

                {/* Actual Poster Element */}
                <div 
                  ref={posterRef}
                  style={getPosterBgStyle()}
                  className={`w-[400px] h-[560px] rounded-2xl relative overflow-hidden shadow-2xl select-none ${
                    activeTemplate === 'cyberpunk' ? 'border-2 border-[#00f2fe]' : 
                    activeTemplate === 'corporate' ? 'border-4 border-double border-[#f59e0b]' : 
                    activeTemplate === 'retro' ? 'border-4 border-black' : 
                    activeTemplate === 'academic-official' ? 'border border-zinc-200 shadow-xl' : 
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

                  {/* Academic Official Top Logo Banner Header & Background Mesh (Matches Reference Image) */}
                  {activeTemplate === 'academic-official' && (
                    <>
                      {/* Soft tech nodes/shapes in background */}
                      <div className="absolute top-24 right-8 w-28 h-28 rounded-full bg-blue-400/10 blur-2xl pointer-events-none" />
                      <div className="absolute bottom-28 left-6 w-36 h-36 rounded-full bg-blue-300/10 blur-3xl pointer-events-none" />
                      {/* Big blue mesh sphere shape on bottom right */}
                      <div className="absolute right-[-40px] bottom-[40px] w-52 h-52 rounded-full border-[1.5px] border-blue-600/10 pointer-events-none flex items-center justify-center">
                        <div className="w-44 h-44 rounded-full border border-dashed border-blue-500/10" />
                        <div className="w-36 h-36 rounded-full border border-blue-400/5" />
                      </div>
                      
                      {/* Floating tech nodes */}
                      <div className="absolute top-[180px] right-[40px] w-2 h-2 rounded-full bg-blue-500/40 pointer-events-none animate-ping" />
                      <div className="absolute top-[240px] right-[80px] w-3 h-3 rounded-full bg-indigo-500/25 pointer-events-none animate-pulse" />
                      <div className="absolute top-[320px] right-[20px] w-1.5 h-1.5 rounded-full bg-blue-600/30 pointer-events-none" />
                      
                      {/* Logo Banner Header Row */}
                      <div className="absolute top-0 left-0 w-full bg-white border-b border-zinc-200 px-2 py-1.5 flex items-center justify-between z-10 pointer-events-none">
                        <div className="flex items-center gap-1">
                          {/* CSE Badge */}
                          <div className="w-6 h-6 rounded-full bg-[#1e3a8a] text-white flex flex-col items-center justify-center border border-zinc-200 shadow-sm shrink-0">
                            <span className="text-[4px] font-black tracking-tighter leading-none">DEPT</span>
                            <span className="text-[6px] font-black tracking-tight leading-none mt-0.5">CSE</span>
                          </div>
                          {/* AI&ML Badge */}
                          <div className="w-6 h-6 rounded-full bg-zinc-950 text-white flex flex-col items-center justify-center border border-zinc-200 shadow-sm shrink-0">
                            <span className="text-[4px] font-black tracking-tighter leading-none">DEPT</span>
                            <span className="text-[5px] font-black tracking-tight leading-none mt-0.5">AI/ML</span>
                          </div>
                          {/* Crest Badge */}
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-red-600 text-white flex items-center justify-center border border-zinc-200 shadow-sm shrink-0">
                            <span className="text-[5px] font-black uppercase text-white/90">GCEM</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-center text-center flex-1 mx-1 px-1 border-x border-zinc-200/50">
                          <span className="text-[6.5px] font-black text-zinc-900 tracking-tight leading-none uppercase">GOPALAN COLLEGE OF ENGINEERING</span>
                          <span className="text-[5px] font-bold text-zinc-500 uppercase tracking-widest leading-none mt-0.5">AND MANAGEMENT, BENGALURU</span>
                        </div>

                        <div className="flex items-center gap-1">
                          {/* TECHEON Logo */}
                          <div className="w-6 h-6 rounded bg-black text-[#f59e0b] border border-amber-500/30 flex items-center justify-center shrink-0">
                            <span className="text-[5px] font-mono font-bold tracking-tighter">TECH</span>
                          </div>
                          {/* GRAFIK Logo */}
                          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center border border-zinc-100 shadow-sm shrink-0">
                            <span className="text-[5px] font-black uppercase tracking-tighter">GFX</span>
                          </div>
                        </div>
                      </div>
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
                    style={{
                      position: 'absolute',
                      left: `${clubX}%`,
                      top: `${clubY}%`,
                      transform: 'translate(-50%, -50%)',
                      cursor: 'grab',
                      zIndex: 10
                    }}
                    className="flex flex-col items-center hover:ring-2 hover:ring-purple-500/50 p-1.5 rounded-lg border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 bg-transparent whitespace-nowrap"
                  >
                    <span 
                      style={{ color: clubColor, fontSize: `${clubSize}px` }}
                      className={`uppercase tracking-widest font-bold font-mono`}
                    >
                      {clubName || 'Host Club'}
                    </span>
                    {activeTemplate === 'cyberpunk' && (
                      <span className="text-[8px] text-zinc-500 font-mono tracking-tighter mt-0.5 pointer-events-none">Club-Eve System v1.0</span>
                    )}
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

                  {/* Main Event Title */}
                  <div 
                    onMouseDown={(e) => handleElementDragStart(e, 'title')}
                    onTouchStart={(e) => handleElementDragStart(e, 'title')}
                    style={{
                      position: 'absolute',
                      left: `${titleX}%`,
                      top: `${titleY}%`,
                      transform: 'translate(-50%, -50%)',
                      cursor: 'grab',
                      width: '85%',
                      zIndex: 10
                    }}
                    className="hover:ring-2 hover:ring-purple-500/50 p-2 rounded-lg border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 bg-transparent flex flex-col justify-center items-center"
                  >
                    <h1 
                      style={{ 
                        color: titleColor, 
                        fontSize: `${titleSize}px`,
                        textAlign: titleAlign
                      }}
                      className={`font-black tracking-tight leading-none uppercase break-words w-full select-none ${titleFont} ${
                        activeTemplate === 'cyberpunk' ? 'text-shadow-neon' : ''
                      } ${
                        activeTemplate === 'retro' ? 'drop-shadow-[3px_3px_0px_#000000]' : ''
                      } ${
                        activeTemplate === 'formal-gold' ? 'drop-shadow-[1px_1px_1px_rgba(0,0,0,0.5)]' : ''
                      } ${
                        activeTemplate === 'midnight-hacker' ? 'font-mono' : ''
                      }`}
                    >
                      {title || 'EXQUISITE EVENT'}
                    </h1>
                  </div>

                  {/* Event Description */}
                  {showDesc && (
                    <div 
                      onMouseDown={(e) => handleElementDragStart(e, 'desc')}
                      onTouchStart={(e) => handleElementDragStart(e, 'desc')}
                      style={{
                        position: 'absolute',
                        left: `${descX}%`,
                        top: `${descY}%`,
                        transform: 'translate(-50%, -50%)',
                        cursor: 'grab',
                        width: '85%',
                        zIndex: 10
                      }}
                      className="hover:ring-2 hover:ring-purple-500/50 p-2 rounded-lg border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 bg-transparent flex flex-col justify-center items-center"
                    >
                      <p 
                        style={{ color: descColor, fontSize: `${descSize}px` }}
                        className={`leading-relaxed font-sans line-clamp-3 w-full text-center select-none ${
                          activeTemplate === 'retro' ? 'font-medium' : 'font-light'
                        }`}
                      >
                        {description || 'Join us for this exciting departmental event packed with learning, collaboration, and certificate outcomes.'}
                      </p>
                    </div>
                  )}

                  {/* Event Logistics (Time / Venue) */}
                  <div 
                    onMouseDown={(e) => handleElementDragStart(e, 'details')}
                    onTouchStart={(e) => handleElementDragStart(e, 'details')}
                    style={{ 
                      backgroundColor: activeTemplate === 'academic-official' ? 'transparent' : detailsBg, 
                      borderColor: activeTemplate === 'academic-official' ? 'transparent' : detailsBorderColor,
                      color: detailsColor,
                      position: 'absolute',
                      left: `${detailsX}%`,
                      top: `${detailsY}%`,
                      transform: 'translate(-50%, -50%)',
                      cursor: 'grab',
                      width: '65%',
                      zIndex: 10
                    }}
                    className={`rounded-xl p-3 border backdrop-blur-md space-y-1.5 text-left hover:ring-2 hover:ring-purple-500/50 hover:border-zinc-200 dark:hover:border-zinc-800 ${
                      activeTemplate === 'retro' ? 'border-2 border-black shadow-[3px_3px_0px_#000000] text-black font-semibold' : ''
                    }`}
                  >
                    {activeTemplate === 'academic-official' ? (
                      <div className="space-y-1.5 select-none pointer-events-none">
                        <div className="flex items-center gap-2 px-2.5 py-0.5 bg-white border border-blue-600/30 text-blue-900 font-bold rounded-full text-[8px] w-fit shadow-[0_1px_3px_rgba(0,0,0,0.05)] whitespace-nowrap">
                          <Calendar size={10} className="text-blue-600 shrink-0" />
                          <span>{getFormattedDate(eventDate)}</span>
                        </div>
                        <div className="flex items-center gap-2 px-2.5 py-0.5 bg-white border border-blue-600/30 text-blue-900 font-bold rounded-full text-[8px] w-fit shadow-[0_1px_3px_rgba(0,0,0,0.05)] whitespace-nowrap">
                          <Clock size={10} className="text-blue-600 shrink-0" />
                          <span>{eventTime || '1:30 PM'}</span>
                        </div>
                        <div className="flex items-center gap-2 px-2.5 py-0.5 bg-white border border-blue-600/30 text-blue-900 font-bold rounded-full text-[8px] w-fit shadow-[0_1px_3px_rgba(0,0,0,0.05)] whitespace-nowrap">
                          <MapPin size={10} className="text-blue-600 shrink-0" />
                          <span>{location || 'Venue: TBA'}</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5 pointer-events-none">
                          <Calendar size={12} className="shrink-0 opacity-80" />
                          <span className="text-[10px] font-mono leading-none truncate">
                            {getFormattedDate(eventDate)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 pointer-events-none">
                          <Clock size={12} className="shrink-0 opacity-80" />
                          <span className="text-[10px] font-mono leading-none truncate">
                            {eventTime || '1:30 PM'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 pointer-events-none">
                          <MapPin size={12} className="shrink-0 opacity-80" />
                          <span className="text-[10px] font-mono leading-none truncate">
                            {location || 'Venue: TBA'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Speaker Badge */}
                  {showSpeaker && (
                    <div
                      onMouseDown={(e) => handleElementDragStart(e, 'speaker')}
                      onTouchStart={(e) => handleElementDragStart(e, 'speaker')}
                      style={{
                        position: 'absolute',
                        left: `${speakerX}%`,
                        top: `${speakerY}%`,
                        transform: 'translate(-50%, -50%)',
                        cursor: 'grab',
                        zIndex: 15
                      }}
                      className={`flex flex-col items-center hover:ring-2 hover:ring-purple-500/50 p-2.5 rounded-2xl border hover:border-zinc-300 dark:hover:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 shadow-xl backdrop-blur-sm w-36 text-center ${
                        activeTemplate === 'formal-gold' ? 'border-[#d4af37]/60' :
                        activeTemplate === 'midnight-hacker' ? 'border-[#22c55e]/60 bg-[#030712]/95 text-[#22c55e]' :
                        'border-zinc-200 dark:border-zinc-850'
                      }`}
                    >
                      {/* Speaker Photo Mockup - Blue Circle Ring just like the reference image! */}
                      <div className={`w-16 h-16 rounded-full border-[3px] overflow-hidden mb-1.5 flex items-center justify-center shadow-inner ${
                        activeTemplate === 'academic-official' ? 'border-blue-600/80 bg-blue-50 dark:bg-zinc-900' :
                        activeTemplate === 'formal-gold' ? 'border-[#d4af37]' :
                        activeTemplate === 'midnight-hacker' ? 'border-[#22c55e]' :
                        'border-purple-500 bg-purple-50'
                      }`}>
                        <Users size={28} className={
                          activeTemplate === 'academic-official' ? 'text-blue-600' :
                          activeTemplate === 'formal-gold' ? 'text-[#d4af37]' :
                          activeTemplate === 'midnight-hacker' ? 'text-[#22c55e]' :
                          'text-purple-600'
                        } />
                      </div>
                      <span className={`text-[8px] font-bold font-mono uppercase tracking-wider leading-none mb-1 ${
                        activeTemplate === 'formal-gold' ? 'text-[#d4af37]' :
                        activeTemplate === 'midnight-hacker' ? 'text-zinc-500' :
                        'text-zinc-500'
                      }`}>
                        {speakerTitle || 'Resource Person'}
                      </span>
                      <span className={`text-xs font-black uppercase leading-tight tracking-tight text-center break-words w-full px-1 ${
                        activeTemplate === 'midnight-hacker' ? 'text-[#22c55e]' :
                        activeTemplate === 'formal-gold' ? 'text-[#d4af37]' :
                        'text-zinc-900 dark:text-white'
                      }`}>
                        {speakerName || 'Nived Shaji'}
                      </span>
                    </div>
                  )}

                  {/* Draggable QR Code */}
                  {showQr && qrDataUrl && (
                    <div 
                      onMouseDown={(e) => handleElementDragStart(e, 'qr')}
                      onTouchStart={(e) => handleElementDragStart(e, 'qr')}
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
                      className={`shrink-0 aspect-square rounded-xl p-1.5 border flex items-center justify-center bg-white hover:ring-2 hover:ring-purple-500/50 ${
                        activeTemplate === 'retro' ? 'border-2 border-black shadow-[3px_3px_0px_#000000]' : 
                        activeTemplate === 'formal-gold' ? 'border-2 border-[#d4af37]' :
                        activeTemplate === 'midnight-hacker' ? 'border-2 border-[#22c55e]' : ''
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
                    <div className="grid grid-cols-4 gap-2">
                      {(['vibrant', 'cyberpunk', 'corporate', 'minimalist', 'retro', 'techconf', 'creative', 'academic-official', 'formal-gold', 'midnight-hacker', 'glassmorphic-glow', 'gala-athletic', 'eco-minimal'] as const).map(p => (
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
