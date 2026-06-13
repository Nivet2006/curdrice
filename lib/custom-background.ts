import React from 'react'

export interface BackgroundConfig {
  type: 'none' | 'preset' | 'solid' | 'gradient' | 'image'
  presetKey?: string
  solidColor?: string
  gradientStart?: string
  gradientEnd?: string
  gradientAngle?: string
  opacity?: number // For image overlays, 0-100
  blur?: 'none' | 'sm' | 'md' | 'lg'
  glassmorphism?: boolean
  textColor?: 'light' | 'dark' | 'default'
}

export interface ParsedBackground {
  pageStyle: React.CSSProperties
  pageClass: string
  cardClass: string
  textClass: string
  linkClass: string
  glassClass: string
  bannerOverlayStyle: React.CSSProperties
  bannerOverlayClass: string
  hasCustomBg: boolean
  
  // Full-viewport background properties
  backdropStyle: React.CSSProperties
  backdropClass: string
  backdropOverlayStyle: React.CSSProperties
  backdropOverlayClass: string

  // Compatibility aliases for manager/teacher card-based previews
  hasBg: boolean
  containerStyle: React.CSSProperties
  containerClass: string
  overlayStyle: React.CSSProperties
  overlayClass: string
}

// Preset definitions (must match components/shared/EventBackgroundCustomizer.tsx)
const PRESETS: Record<string, { classes: string; textColor: 'light' | 'dark' }> = {
  sunset: { classes: 'bg-gradient-to-br from-[#ff5e62] to-[#ff9966]', textColor: 'light' },
  midnight: { classes: 'bg-gradient-to-br from-[#3f2b96] to-[#a8c0ff]', textColor: 'light' },
  forest: { classes: 'bg-gradient-to-br from-[#11998e] to-[#38ef7d]', textColor: 'light' },
  cyberpunk: { classes: 'bg-gradient-to-br from-[#00f2fe] to-[#4facfe]', textColor: 'dark' },
  gold: { classes: 'bg-gradient-to-br from-[#1e1b18] via-[#433b32] to-[#d4af37]', textColor: 'light' },
  velvet: { classes: 'bg-gradient-to-br from-[#3d000f] to-[#000000]', textColor: 'light' },
  aurora: { classes: 'bg-gradient-to-br from-[#0575e6] to-[#00f260]', textColor: 'light' },
  slate: { classes: 'bg-gradient-to-br from-[#232526] to-[#414345]', textColor: 'light' },
  candy: { classes: 'bg-gradient-to-br from-[#ec008c] to-[#fc6767]', textColor: 'light' }
}

export function parseCustomBackground(
  customBackgroundStr: string | null | undefined,
  bannerUrl?: string | null
): ParsedBackground {
  // Default fallback (no custom background)
  const defaultRes: ParsedBackground = {
    pageStyle: {},
    pageClass: 'w-full min-h-screen',
    cardClass: 'bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm',
    textClass: 'text-[#0a0a0a] dark:text-white',
    linkClass: 'text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white',
    glassClass: 'bg-[#f5f5f5] dark:bg-zinc-900 border border-[#e0e0e0] dark:border-zinc-800',
    bannerOverlayStyle: {},
    bannerOverlayClass: 'bg-gradient-to-t from-black/60 to-transparent',
    hasCustomBg: false,
    backdropStyle: {},
    backdropClass: '',
    backdropOverlayStyle: {},
    backdropOverlayClass: '',
    hasBg: false,
    containerStyle: {},
    containerClass: '',
    overlayStyle: {},
    overlayClass: ''
  }

  if (!customBackgroundStr) {
    return defaultRes
  }

  try {
    const config: BackgroundConfig = JSON.parse(customBackgroundStr)
    
    if (config.type === 'none') {
      return defaultRes
    }

    const pageStyle: React.CSSProperties = {}
    let pageClass = 'w-full min-h-screen relative overflow-hidden transition-all'
    let textClass = 'text-white' // default for gradients/colors
    let linkClass = 'text-white/80 hover:text-white'
    let glassClass = 'bg-black/30 backdrop-blur-[1px]'
    
    let bannerOverlayStyle: React.CSSProperties = {}
    let bannerOverlayClass = ''

    const backdropStyle: React.CSSProperties = {}
    let backdropClass = ''
    let backdropOverlayStyle: React.CSSProperties = {}
    let backdropOverlayClass = ''

    // 1. Resolve Background Type
    if (config.type === 'preset' && config.presetKey) {
      const preset = PRESETS[config.presetKey]
      if (preset) {
        backdropClass = preset.classes
        textClass = preset.textColor === 'light' ? 'text-white' : 'text-zinc-950'
        linkClass = preset.textColor === 'light' ? 'text-white/80 hover:text-white' : 'text-zinc-800 hover:text-zinc-950'
      } else {
        backdropClass = PRESETS.sunset.classes
      }
    } else if (config.type === 'solid' && config.solidColor) {
      backdropStyle.backgroundColor = config.solidColor
    } else if (config.type === 'gradient' && config.gradientStart && config.gradientEnd) {
      backdropStyle.backgroundImage = `linear-gradient(135deg, ${config.gradientStart}, ${config.gradientEnd})`
    } else if (config.type === 'image' && bannerUrl) {
      backdropStyle.backgroundImage = `url(${bannerUrl})`
      backdropStyle.backgroundSize = 'cover'
      backdropStyle.backgroundPosition = 'center'
      backdropStyle.backgroundAttachment = 'fixed'
      
      const blurLevel = config.blur || 'none'
      const opacity = config.opacity !== undefined ? config.opacity : 80

      backdropOverlayStyle = {
        backgroundColor: `rgba(0, 0, 0, ${opacity / 100})`
      }
      backdropOverlayClass = `absolute inset-0 z-0 pointer-events-none ${
        blurLevel === 'sm' ? 'backdrop-blur-sm' :
        blurLevel === 'md' ? 'backdrop-blur-md' :
        blurLevel === 'lg' ? 'backdrop-blur-lg' : ''
      }`

      // For backwards compatibility preview cards, keep rounded layout
      bannerOverlayStyle = backdropOverlayStyle
      bannerOverlayClass = `absolute inset-0 z-0 pointer-events-none rounded-[2.5rem] ${
        blurLevel === 'sm' ? 'backdrop-blur-sm' :
        blurLevel === 'md' ? 'backdrop-blur-md' :
        blurLevel === 'lg' ? 'backdrop-blur-lg' : ''
      }`
    } else {
      // Fallback
      backdropClass = 'bg-zinc-800'
    }

    // 2. Resolve Text Contrast override
    if (config.textColor === 'light') {
      textClass = 'text-white'
      linkClass = 'text-white/80 hover:text-white'
    } else if (config.textColor === 'dark') {
      textClass = 'text-zinc-950'
      linkClass = 'text-zinc-800 hover:text-zinc-950'
    }

    // 3. Resolve Glassmorphism Layer
    if (config.glassmorphism) {
      glassClass = 'backdrop-blur-md bg-white/10 dark:bg-black/20 border border-white/20'
    }

    // 4. Resolve Card Class
    let cardClass = ''
    if (config.glassmorphism) {
      cardClass = 'backdrop-blur-md bg-white/10 dark:bg-black/20 border border-white/20 rounded-3xl p-6 shadow-xl ' + textClass
    } else {
      cardClass = 'bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-md ' + (textClass === 'text-white' ? 'text-zinc-900 dark:text-zinc-100' : textClass)
    }

    return {
      pageStyle,
      pageClass,
      cardClass,
      textClass,
      linkClass,
      glassClass,
      bannerOverlayStyle,
      bannerOverlayClass,
      hasCustomBg: true,
      backdropStyle,
      backdropClass,
      backdropOverlayStyle,
      backdropOverlayClass,
      
      // compatibility fields
      hasBg: true,
      containerStyle: backdropStyle,
      containerClass: backdropClass,
      overlayStyle: bannerOverlayStyle,
      overlayClass: bannerOverlayClass
    }
  } catch (e) {
    return defaultRes
  }
}
