'use client'

import React, { useState, useEffect } from 'react'
import { Eye, Settings2, Palette, Sliders, Type, Grid, Activity, Layers } from 'lucide-react'
import { parseCustomBackground, BackgroundConfig } from '@/lib/custom-background'

// Preset definitions with modern premium gradients (synchronized with lib/custom-background.ts)
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
  },
  nebula: {
    name: 'Cosmic Nebula',
    classes: 'bg-gradient-to-br from-[#8a2be2] via-[#41006f] to-[#ff007f]',
    textColor: 'light'
  },
  ocean: {
    name: 'Deep Ocean',
    classes: 'bg-gradient-to-br from-[#00c6ff] to-[#0072ff]',
    textColor: 'light'
  },
  toxic: {
    name: 'Toxic Lime',
    classes: 'bg-gradient-to-br from-[#0d0d0d] via-[#1a3c00] to-[#7fff00]',
    textColor: 'light'
  }
}

interface EventBackgroundCustomizerProps {
  initialValue?: string | null
  bannerUrl?: string | null
}

export function EventBackgroundCustomizer({ initialValue, bannerUrl }: EventBackgroundCustomizerProps) {
  // Parse initial config or use defaults
  const getInitialConfig = (): BackgroundConfig => {
    if (initialValue) {
      try {
        return JSON.parse(initialValue)
      } catch (e) {
        // Fallback if not JSON
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
      textColor: 'default',
      animate: false,
      animationSpeed: 'medium',
      meshPattern: 'none',
      meshOpacity: 15,
      cardOpacity: 80,
      cardBlur: 'md',
      borderIntensity: 'low'
    }
  }

  const [config, setConfig] = useState<BackgroundConfig>(getInitialConfig())

  // Sync state changes
  const updateConfig = (updates: Partial<BackgroundConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }

  // Parse configuration using the exact same style parser engine
  const bg = parseCustomBackground(JSON.stringify(config), bannerUrl)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Palette size={16} className="text-zinc-400" />
        <h3 className="font-mono text-xs uppercase tracking-widest text-[#555555] dark:text-zinc-400 font-bold">
          Custom Event Styling Engine
        </h3>
      </div>

      {/* Hidden input to pass state to server actions */}
      <input type="hidden" name="customBackground" value={JSON.stringify(config)} />

      {/* Grid: Preview & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Live Preview Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-3 lg:sticky lg:top-24">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
            <Eye size={12} /> Live Preview
          </span>
          
          <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-md flex items-end p-5 transition-all">
            {/* Inline CSS style block for preview animation */}
            {bg.customStyleBlock && (
              <style dangerouslySetInnerHTML={{ __html: bg.customStyleBlock.replace(/\.animate-gradient-shift/g, '.preview-gradient-shift') }} />
            )}
            
            {/* Background Layer */}
            <div 
              style={bg.backdropStyle} 
              className={`absolute inset-0 w-full h-full z-0 transition-all ${
                bg.backdropClass ? bg.backdropClass.replace(/animate-gradient-shift/g, 'preview-gradient-shift') : ''
              }`} 
            />

            {/* Pattern Mesh Layer */}
            {bg.meshPatternStyle && (
              <div 
                style={bg.meshPatternStyle} 
                className="absolute inset-0 w-full h-full z-10 pointer-events-none" 
              />
            )}

            {/* Backdrop Overlay Layer */}
            {bg.backdropOverlayClass && (
              <div 
                style={bg.backdropOverlayStyle} 
                className={`absolute inset-0 w-full h-full z-10 pointer-events-none ${bg.backdropOverlayClass}`} 
              />
            )}
            
            {/* Simulated Event Details Card */}
            <div 
              style={bg.cardStyle}
              className={`w-full p-4 rounded-xl relative z-20 transition-all border ${bg.cardClass}`}
            >
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
            This styling will apply directly to the detail page for attendees.
          </p>
        </div>

        {/* Controls Panel (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-6">
          
          {/* Background Type selection */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              <Settings2 size={12} /> Background Style Type
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {(['none', 'preset', 'solid', 'gradient', 'image'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => updateConfig({ type: t })}
                  className={`py-2 px-1 rounded-lg text-[10px] font-mono border transition-all text-center ${
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
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-900 space-y-6">
              
              {/* 1. Shifting Animation Settings */}
              {(config.type === 'gradient' || config.type === 'preset') && (
                <div className="space-y-3">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                    <Activity size={12} /> Shifting Animations
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="flex items-center gap-2 cursor-pointer h-9">
                      <input
                        type="checkbox"
                        checked={config.animate || false}
                        onChange={e => updateConfig({ animate: e.target.checked })}
                        className="w-4 h-4 rounded border-zinc-300 text-black focus:ring-black cursor-pointer"
                      />
                      <span className="text-xs font-mono text-zinc-600 dark:text-zinc-300">
                        Enable Shifting Motion
                      </span>
                    </label>
                    
                    {config.animate && (
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                          Animation Speed
                        </span>
                        <select
                          value={config.animationSpeed || 'medium'}
                          onChange={e => updateConfig({ animationSpeed: e.target.value as any })}
                          className="w-full rounded-lg border border-[#d0d0d0] dark:border-zinc-800 px-3 py-1 text-xs outline-none focus:ring-1 focus:ring-black bg-white dark:bg-zinc-900"
                        >
                          <option value="fast">Fast (8s Loop)</option>
                          <option value="medium">Medium (16s Loop)</option>
                          <option value="slow">Slow (32s Loop)</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 2. Mesh Overlay Textures */}
              <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-900">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                  <Grid size={12} /> Pattern Textures
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                      Mesh Grid Style
                    </span>
                    <select
                      value={config.meshPattern || 'none'}
                      onChange={e => updateConfig({ meshPattern: e.target.value as any })}
                      className="w-full rounded-lg border border-[#d0d0d0] dark:border-zinc-800 px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-black bg-white dark:bg-zinc-900"
                    >
                      <option value="none">No Pattern (Smooth)</option>
                      <option value="dots">Subtle Dot Matrix</option>
                      <option value="grid">Technical Grid Mesh</option>
                      <option value="stripes">Diagonal Stripes</option>
                    </select>
                  </div>

                  {config.meshPattern && config.meshPattern !== 'none' && (
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                        <span>Pattern Opacity</span>
                        <span>{config.meshOpacity !== undefined ? config.meshOpacity : 15}%</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="50"
                        value={config.meshOpacity !== undefined ? config.meshOpacity : 15}
                        onChange={e => updateConfig({ meshOpacity: parseInt(e.target.value) })}
                        className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-black dark:accent-white mt-3"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Card Container Customizer */}
              <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-900">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                  <Layers size={12} /> Glass & Card Controls
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Card Opacity */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                      <span>Card Transparency</span>
                      <span>{config.cardOpacity !== undefined ? config.cardOpacity : 80}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={config.cardOpacity !== undefined ? config.cardOpacity : 80}
                      onChange={e => updateConfig({ cardOpacity: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-black dark:accent-white mt-3"
                    />
                  </div>

                  {/* Card Blur */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                      Card Backdrop Blur
                    </span>
                    <select
                      value={config.cardBlur || 'md'}
                      onChange={e => updateConfig({ cardBlur: e.target.value as any })}
                      className="w-full rounded-lg border border-[#d0d0d0] dark:border-zinc-800 px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-black bg-white dark:bg-zinc-900"
                    >
                      <option value="none">No Blur (Opaque/Flat)</option>
                      <option value="sm">Subtle Blur (sm)</option>
                      <option value="md">Standard Glass (md)</option>
                      <option value="lg">Heavy Frosted (lg)</option>
                    </select>
                  </div>

                  {/* Border Intensity */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                      Border Visibility
                    </span>
                    <select
                      value={config.borderIntensity || 'low'}
                      onChange={e => updateConfig({ borderIntensity: e.target.value as any })}
                      className="w-full rounded-lg border border-[#d0d0d0] dark:border-zinc-800 px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-black bg-white dark:bg-zinc-900"
                    >
                      <option value="none">No Border</option>
                      <option value="low">Low (Faint Edge)</option>
                      <option value="medium">Medium (Crisp Edge)</option>
                      <option value="high">High (High Contrast Edge)</option>
                    </select>
                  </div>

                  {/* Text Color / Contrast */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-1">
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

                </div>
              </div>

              {/* 4. Blur config & overlay opacity for image types */}
              {config.type === 'image' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-900">
                  {/* Blur intensity */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                      Background Image Blur
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
                    <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                      <span>Image Overlay Opacity</span>
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
