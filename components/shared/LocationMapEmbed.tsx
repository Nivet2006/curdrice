'use client'

import React from 'react'
import { MapPin, ExternalLink, Navigation } from 'lucide-react'

interface LocationMapEmbedProps {
  lat: number
  lng: number
  name?: string
  /** compact = smaller iframe for sidebars/cards */
  compact?: boolean
}

export function LocationMapEmbed({ lat, lng, name, compact = false }: LocationMapEmbedProps) {
  // Build the OSM embed URL — no API key needed
  const delta = 0.015 // ~1.5 km bounding box
  const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`
  const osmEmbed = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`

  // Universal deep-link: works on iOS (Apple Maps), Android (Google Maps), Desktop (Google Maps)
  const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`
  // For Apple Maps (iOS will intercept the geo: URI or the maps.apple.com link)
  const appleMapsUrl = `https://maps.apple.com/?ll=${lat},${lng}&q=${encodeURIComponent(name || 'Visit Location')}`

  const handleOpenMaps = () => {
    // Try to open the platform-native maps app
    const ua = navigator.userAgent.toLowerCase()
    const isIOS = /iphone|ipad|ipod/.test(ua)
    window.open(isIOS ? appleMapsUrl : mapsUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
      {/* Map header */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center gap-2 min-w-0">
          <MapPin size={14} className="text-rose-500 shrink-0" />
          <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 truncate">
            {name || 'Industrial Visit Location'}
          </span>
        </div>
        <button
          type="button"
          onClick={handleOpenMaps}
          className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-black dark:text-white bg-black dark:bg-white text-white dark:text-black px-3 py-1.5 rounded-lg hover:opacity-80 active:scale-95 transition-all shrink-0 ml-2"
          title="Open in Maps"
        >
          <Navigation size={11} />
          Open in Maps
          <ExternalLink size={10} />
        </button>
      </div>

      {/* OSM iframe — no API key required */}
      <iframe
        src={osmEmbed}
        width="100%"
        height={compact ? 200 : 320}
        loading="lazy"
        className="w-full border-0 block"
        title={`Map: ${name || 'Industrial Visit Location'}`}
        sandbox="allow-scripts allow-same-origin"
      />

      {/* Coords footer */}
      <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border-t border-zinc-100 dark:border-zinc-700 flex items-center justify-between">
        <span className="text-[10px] font-mono text-zinc-400">
          {lat.toFixed(5)}, {lng.toFixed(5)}
        </span>
        <span className="text-[9px] font-mono text-zinc-300">© OpenStreetMap contributors</span>
      </div>
    </div>
  )
}
