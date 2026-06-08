'use client'

import React, { useState, useCallback, useRef } from 'react'
import { Search, MapPin, X, Loader2, Navigation } from 'lucide-react'

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
  type: string
  importance: number
}

interface LocationPickerProps {
  /** Called when the user selects a location */
  onSelect: (location: { name: string; displayName: string; lat: number; lng: number }) => void
  /** Currently selected location (for reset) */
  selected?: { name: string; lat: number; lng: number } | null
}

export function LocationPicker({ onSelect, selected }: LocationPickerProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NominatimResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(async (q: string) => {
    if (q.length < 3) { setResults([]); setOpen(false); return }
    setLoading(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const data: NominatimResult[] = await res.json()
      setResults(data)
      setOpen(true)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 400)
  }

  const handleSelect = (r: NominatimResult) => {
    // Shorten display name: take first 2 comma-separated parts
    const parts = r.display_name.split(',')
    const shortName = parts.slice(0, 2).join(',').trim()
    setQuery(r.display_name)
    setOpen(false)
    setResults([])
    onSelect({
      name: shortName,
      displayName: r.display_name,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
    })
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setOpen(false)
    onSelect({ name: '', displayName: '', lat: 0, lng: 0 })
  }

  return (
    <div className="relative w-full">
      <label className="text-xs font-mono text-[#555555] dark:text-zinc-400 uppercase tracking-widest block mb-1">
        Destination / Visit Location *
      </label>
      <div className="relative flex items-center">
        <Search size={16} className="absolute left-4 text-zinc-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleInput}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search for company, place, city…"
          className="w-full pl-10 pr-10 py-3 rounded-xl border border-[#d0d0d0] dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-black outline-none dark:text-white"
          autoComplete="off"
        />
        {loading && (
          <Loader2 size={16} className="absolute right-4 text-zinc-400 animate-spin" />
        )}
        {!loading && query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-4 text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Dropdown results */}
      {open && results.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-xl overflow-hidden">
          {results.map((r) => (
            <button
              key={r.place_id}
              type="button"
              onClick={() => handleSelect(r)}
              className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border-b border-zinc-100 dark:border-zinc-800 last:border-0"
            >
              <MapPin size={16} className="text-zinc-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                  {r.display_name.split(',')[0]}
                </p>
                <p className="text-[11px] text-zinc-400 font-mono truncate">
                  {r.display_name.split(',').slice(1, 3).join(',').trim()}
                </p>
              </div>
            </button>
          ))}
          <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800">
            <p className="text-[9px] font-mono text-zinc-400">© OpenStreetMap contributors</p>
          </div>
        </div>
      )}

      {/* Selected preview badge */}
      {selected && selected.lat !== 0 && (
        <div className="mt-2 flex items-center gap-2 text-[11px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-800">
          <Navigation size={12} className="shrink-0" />
          <span className="truncate">Pinned: {selected.name}</span>
          <span className="text-zinc-400 ml-auto shrink-0">
            {selected.lat.toFixed(4)}, {selected.lng.toFixed(4)}
          </span>
        </div>
      )}
    </div>
  )
}
