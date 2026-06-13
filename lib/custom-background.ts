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
  containerStyle: React.CSSProperties
  containerClass: string
  overlayStyle: React.CSSProperties
  overlayClass: string
  textClass: string
  glassClass: string
  hasBg: boolean
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
  const defaultRes: ParsedBackground = {
    containerStyle: {},
    containerClass: 'bg-[#f5f5f5] dark:bg-zinc-900 border border-[#e0e0e0] dark:border-zinc-800',
    overlayStyle: {},
    overlayClass: 'bg-gradient-to-t from-black/60 to-transparent',
    textClass: 'text-zinc-950 dark:text-white',
    glassClass: 'bg-black/30 backdrop-blur-[1px]',
    hasBg: !!bannerUrl
  }

  if (!customBackgroundStr) {
    if (bannerUrl) {
      defaultRes.containerStyle = {
        backgroundImage: `url(${bannerUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }
      // Since it has a banner background, text needs to be light for readability on overlay
      defaultRes.textClass = 'text-white'
    }
    return defaultRes
  }

  try {
    const config: BackgroundConfig = JSON.parse(customBackgroundStr)
    
    if (config.type === 'none') {
      if (bannerUrl) {
        defaultRes.containerStyle = {
          backgroundImage: `url(${bannerUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }
        defaultRes.textClass = 'text-white'
      }
      return defaultRes
    }

    const containerStyle: React.CSSProperties = {}
    let containerClass = ''
    const overlayStyle: React.CSSProperties = {}
    let overlayClass = ''
    let textClass = 'text-white' // Default for custom color backgrounds
    let glassClass = 'bg-black/30 backdrop-blur-[1px]'

    // 1. Resolve Background Type
    if (config.type === 'preset' && config.presetKey) {
      const preset = PRESETS[config.presetKey]
      if (preset) {
        containerClass = preset.classes
        textClass = preset.textColor === 'light' ? 'text-white' : 'text-zinc-950'
      } else {
        containerClass = PRESETS.sunset.classes
      }
    } else if (config.type === 'solid' && config.solidColor) {
      containerStyle.backgroundColor = config.solidColor
    } else if (config.type === 'gradient' && config.gradientStart && config.gradientEnd) {
      containerStyle.backgroundImage = `linear-gradient(135deg, ${config.gradientStart}, ${config.gradientEnd})`
    } else if (config.type === 'image' && bannerUrl) {
      containerStyle.backgroundImage = `url(${bannerUrl})`
      containerStyle.backgroundSize = 'cover'
      containerStyle.backgroundPosition = 'center'
      
      // Handle blur level
      if (config.blur === 'sm') {
        overlayClass = 'backdrop-blur-sm'
      } else if (config.blur === 'md') {
        overlayClass = 'backdrop-blur-md'
      } else if (config.blur === 'lg') {
        overlayClass = 'backdrop-blur-lg'
      }

      // Handle opacity of dark overlay for images
      const opacity = config.opacity !== undefined ? config.opacity : 80
      overlayStyle.backgroundColor = `rgba(0, 0, 0, ${opacity / 100})`
    } else {
      // Fallback if type is image but no bannerUrl
      containerClass = 'bg-zinc-800'
    }

    // 2. Resolve Text Contrast override
    if (config.textColor === 'light') {
      textClass = 'text-white'
    } else if (config.textColor === 'dark') {
      textClass = 'text-zinc-950'
    }

    // 3. Resolve Glassmorphism Layer
    if (config.glassmorphism) {
      glassClass = 'backdrop-blur-md bg-white/10 dark:bg-black/20 border border-white/20'
    }

    return {
      containerStyle,
      containerClass,
      overlayStyle,
      overlayClass,
      textClass,
      glassClass,
      hasBg: true
    }
  } catch (e) {
    // If JSON parsing fails, fallback to default behavior
    if (bannerUrl) {
      defaultRes.containerStyle = {
        backgroundImage: `url(${bannerUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }
      defaultRes.textClass = 'text-white'
    }
    return defaultRes
  }
}
