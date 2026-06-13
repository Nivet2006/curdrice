'use client'

import React, { useState, useEffect } from 'react'
import { Eye, Settings2, Palette, Sliders, Type } from 'lucide-react'

// Define the structure of our background configuration
export interface BackgroundConfig {
  type: 'none' | 'preset' | 'solid' | 'gradient' | 'image'
  presetKey?: string
  solidColor?: string
  gradientStart?: string
  gradientEnd?: string
  gradientAngle?: string
  opacity?: number // For image or gradient overlays, 0-100
  blur?: 'none' | 'sm' | 'md' | 'lg'
  glassmorphism?: boolean
  textColor?: 'light' | 'dark' | 'default'
}

// Preset definitions with modern premium gradients
export const PRESETS: Record<string, { name: string; classes: string; textColor: 'light' | 'dark' }> = {
  sunset: {
    name: 'Sunset Glow',
    classes: 'bg-gradient-to-br from-[#ff5e62] to-[#ff9966]',
    textColor: 'light'
  },
  midnight: {
    name: 'Midnight Indigo',
    classes: 'bg-gradient-to-br from-[#3f2b96] to-[#a8c0ff]',
    textColor: 'light'
  },
  forest: {
    name: 'Forest Emerald',
    classes: 'bg-gradient-to-br from-[#11998e] to-[#38ef7d]',
    textColor: 'light'
  },
  cyberpunk: {
    name: 'Cyberpunk Neon',
    classes: 'bg-gradient-to-br from-[#00f2fe] to-[#4facfe]',
    textColor: 'dark'
  },
  gold: {
    name: 'Royal Gold',
    classes: 'bg-gradient-to-br from-[#1e1b18] via-[#433b32] to-[#d4af37]',
    textColor: 'light'
  },
  velvet: {
    name: 'Deep Velvet',
    classes: 'bg-gradient-to-br from-[#3d000f] to-[#000000]',
    textColor: 'light'
  },
  aurora: {
    name: 'Aurora Lights',
    classes: 'bg-gradient-to-br from-[#0575e6] to-[#00f260]',
    textColor: 'light'
  },
  slate: {
    name: 'Slate Minimal',
    classes: 'bg-gradient-to-br from-[#232526] to-[#414345]',
    textColor: 'light'
  },
  candy: {
    name: 'Candy Pink',
    classes: 'bg-gradient-to-br from-[#ec008c] to-[#fc6767]',
    textColor: 'light'
  }
}

interface EventBackgroundCustomizerProps {
  initialValue?: string | null
}

export function EventBackgroundCustomizer({ initialValue }: EventBackgroundCustomizerProps) {
  // Parse initial config or use defaults
  const getInitialConfig = (): BackgroundConfig => {
    if (initialValue) {
      try {
        return JSON.parse(initialValue)
      } catch (e) {
        // Fallback if it's not JSON
      }
    }
    return {
      type: 'none',
      presetKey: 'sunset',
      solidColor: '#0a0a0a',
      gradientStart: '#3b82f6',
      gradientEnd: '#8b5cf6',
      gradientAngle: 'bg-gradient-to-br',
      opacity: 80,
      blur: 'none',
      glassmorphism: false,
      textColor: 'default'
    }
  }

  const [config, setConfig] = useState<BackgroundConfig>(getInitialConfig())

  // Sync state changes with our form
  const updateConfig = (updates: Partial<BackgroundConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }

  // Helper to resolve background preview style/class
  const getPreviewStyles = () => {
    const styles: React.CSSProperties = {}
    let classes = ''

    if (config.type === 'preset' && config.presetKey) {
      classes = PRESETS[config.presetKey]?.classes || ''
    } else if (config.type === 'solid' && config.solidColor) {
      styles.backgroundColor = config.solidColor
    } else if (config.type === 'gradient' && config.gradientStart && config.gradientEnd) {
      styles.backgroundImage = `linear-gradient(135deg, ${config.gradientStart}, ${config.gradientEnd})`
    } else if (config.type === 'image') {
      // Image type will fall back to using standard banner_url as background in main render.
      // In the preview, we'll show a nice textured card pattern or placeholder gradient.
      classes = 'bg-zinc-800'
    } else {
      classes = 'bg-[#f5f5f5] dark:bg-zinc-900 border border-[#e0e0e0] dark:border-zinc-800'
    }

    return { styles, classes }
  }

  const { styles: bgStyles, classes: bgClasses } = getPreviewStyles()

  // Resolve preview text color
  const getTextColorClass = () => {
    if (config.textColor === 'light') return 'text-white'
    if (config.textColor === 'dark') return 'text-zinc-950'
    
    // Auto resolution for presets
    if (config.type === 'preset' && config.presetKey) {
      return PRESETS[config.presetKey]?.textColor === 'light' ? 'text-white' : 'text-zinc-950'
    }
    
    // Default is white text for custom gradients, and default dark text for none/default
    if (config.type === 'none') return 'text-zinc-950 dark:text-white'
    return 'text-white'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Palette size={16} className="text-zinc-400" />
        <h3 className="font-mono text-xs uppercase tracking-widest text-[#555555] dark:text-zinc-400 font-bold">
          Custom Event Styling
        </h3>
      </div>

      {/* Hidden input to pass state to server actions */}
      <input type="hidden" name="customBackground" value={JSON.stringify(config)} />

      {/* Grid: Preview & Controls */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Live Preview Panel (5 cols) */}
        <div className="md:col-span-5 space-y-3">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
            <Eye size={12} /> Live Preview
          </span>
          
          <div 
            style={bgStyles}
            className={`w-full aspect-[21/9] rounded-2xl overflow-hidden relative shadow-md transition-all duration-300 flex items-end p-5 ${bgClasses}`}
          >
            {/* Glassmorphic card overlay simulated in preview */}
            <div className={`w-full p-4 rounded-xl transition-all duration-300 ${
              config.glassmorphism 
                ? 'backdrop-blur-md bg-white/10 dark:bg-black/20 border border-white/20' 
                : 'bg-black/30 backdrop-blur-[1px]'
            } ${getTextColorClass()}`}>
              <span className="text-[9px] font-mono uppercase tracking-widest opacity-80">
                Visual Branding Preview
              </span>
              <h4 className="text-base font-black tracking-tight leading-tight mt-0.5 truncate">
                Interactive Style Lab
              </h4>
              <p className="text-[9px] font-mono uppercase tracking-widest opacity-90 mt-1">
                By Coding Club
              </p>
            </div>
          </div>
          <p className="text-[9px] font-mono text-zinc-400 italic">
            This styling will apply directly to the detail page header for attendees.
          </p>
        </div>

        {/* Controls Panel (7 cols) */}
        <div className="md:col-span-7 bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-5">
          
          {/* Background Type selection */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              <Settings2 size={12} /> Background Style Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['none', 'preset', 'solid', 'gradient', 'image'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => updateConfig({ type: t })}
                  className={`py-2 px-3 rounded-lg text-xs font-mono border transition-all ${
                    config.type === t
                      ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-sm'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Conditional Options */}
          {config.type === 'preset' && (
            <div className="space-y-2">
              <label className="text-xs font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                <Palette size={12} /> Premium Presets
              </label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => updateConfig({ presetKey: key })}
                    className={`p-2.5 rounded-lg border text-left flex flex-col justify-between h-14 relative overflow-hidden transition-all ${
                      config.presetKey === key
                        ? 'border-black dark:border-white ring-2 ring-black/10 dark:ring-white/20'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white'
                    }`}
                  >
                    <div className={`absolute inset-0 opacity-80 ${preset.classes}`} />
                    <span className={`text-[10px] font-bold z-10 truncate w-full ${
                      preset.textColor === 'light' ? 'text-white' : 'text-zinc-900'
                    }`}>
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {config.type === 'solid' && (
            <div className="space-y-2">
              <label className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                Custom Color Picker
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={config.solidColor || '#0a0a0a'}
                  onChange={e => updateConfig({ solidColor: e.target.value })}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-zinc-200 dark:border-zinc-800"
                />
                <input
                  type="text"
                  value={config.solidColor || '#0a0a0a'}
                  onChange={e => updateConfig({ solidColor: e.target.value })}
                  className="rounded-lg border border-[#d0d0d0] dark:border-zinc-800 px-3 py-1.5 text-xs font-mono focus:ring-1 focus:ring-black outline-none flex-1 max-w-[120px]"
                />
              </div>
            </div>
          )}

          {config.type === 'gradient' && (
            <div className="space-y-3">
              <label className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                Gradient Color Mix
              </label>
              <div className="flex gap-4 items-center">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase">Start</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.gradientStart || '#3b82f6'}
                      onChange={e => updateConfig({ gradientStart: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-zinc-200"
                    />
                    <input
                      type="text"
                      value={config.gradientStart || '#3b82f6'}
                      onChange={e => updateConfig({ gradientStart: e.target.value })}
                      className="rounded-lg border border-[#d0d0d0] dark:border-zinc-800 px-2 py-1 text-xs font-mono max-w-[80px]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase">End</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.gradientEnd || '#8b5cf6'}
                      onChange={e => updateConfig({ gradientEnd: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-zinc-200"
                    />
                    <input
                      type="text"
                      value={config.gradientEnd || '#8b5cf6'}
                      onChange={e => updateConfig({ gradientEnd: e.target.value })}
                      className="rounded-lg border border-[#d0d0d0] dark:border-zinc-800 px-2 py-1 text-xs font-mono max-w-[80px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {config.type === 'image' && (
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2">
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-bold">
                Image Background Mode
              </p>
              <p className="text-xs text-zinc-500 leading-normal">
                This mode overlays styling configurations on top of the event&apos;s **Poster / Banner URL** specified below. Make sure to specify a banner image URL in the field below.
              </p>
            </div>
          )}

          {/* Shared Adjustments (Glassmorphism, Text Contrast, Opacity, Blur) */}
          {config.type !== 'none' && (
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-900 space-y-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                <Sliders size={12} /> Styling Enhancements
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Text Color / Contrast */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                    <Type size={10} /> Text Contrast
                  </span>
                  <select
                    value={config.textColor || 'default'}
                    onChange={e => updateConfig({ textColor: e.target.value as any })}
                    className="w-full rounded-lg border border-[#d0d0d0] dark:border-zinc-800 px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-black bg-white dark:bg-zinc-900"
                  >
                    <option value="default">Default / Auto-Detect</option>
                    <option value="light">Light Text (High Contrast White)</option>
                    <option value="dark">Dark Text (High Contrast Dark)</option>
                  </select>
                </div>

                {/* Glassmorphic Cards toggle */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                    Layout Enhancement
                  </span>
                  <label className="flex items-center gap-2 cursor-pointer h-9">
                    <input
                      type="checkbox"
                      checked={config.glassmorphism || false}
                      onChange={e => updateConfig({ glassmorphism: e.target.checked })}
                      className="w-4 h-4 rounded border-zinc-300 text-black focus:ring-black cursor-pointer"
                    />
                    <span className="text-xs font-mono text-zinc-600 dark:text-zinc-300">
                      Glassmorphic Panels
                    </span>
                  </label>
                </div>
              </div>

              {/* Blur config & overlay opacity for image/gradient types */}
              {config.type === 'image' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Blur intensity */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                      Background Blur
                    </span>
                    <select
                      value={config.blur || 'none'}
                      onChange={e => updateConfig({ blur: e.target.value as any })}
                      className="w-full rounded-lg border border-[#d0d0d0] dark:border-zinc-800 px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-black bg-white dark:bg-zinc-900"
                    >
                      <option value="none">No Blur (Crisp Image)</option>
                      <option value="sm">Subtle Blur (sm)</option>
                      <option value="md">Medium Blur (md)</option>
                      <option value="lg">Heavy Blur (lg)</option>
                    </select>
                  </div>

                  {/* Opacity slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                      <span>Overlay Opacity</span>
                      <span>{config.opacity || 80}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={config.opacity !== undefined ? config.opacity : 80}
                      onChange={e => updateConfig({ opacity: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-black dark:accent-white mt-3"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  )
}
