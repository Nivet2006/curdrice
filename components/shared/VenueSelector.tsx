'use client'

import React, { useEffect, useState } from 'react'
import { getVenuesWithStatus, createVenue } from '@/lib/actions/venue-actions'
import { Lock, AlertTriangle, CheckCircle, Info, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface Venue {
  id: string
  name: string
  capacity: number | null
  description: string | null
  status: 'available' | 'locked' | 'unavailable'
  eventName?: string
  conflictTime?: string
  message: string
}

interface VenueSelectorProps {
  selectedVenueId: string | null
  onSelectVenue: (venueId: string, venueName: string) => void
  startTime: string // ISO or YYYY-MM-DDTHH:MM
  endTime: string
  excludingEventId?: string | null
}

export function VenueSelector({
  selectedVenueId,
  onSelectVenue,
  startTime,
  endTime,
  excludingEventId
}: VenueSelectorProps) {
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hoveredVenueId, setHoveredVenueId] = useState<string | null>(null)

  // New venue creation state
  const [showAddForm, setShowAddForm] = useState(false)
  const [newVenueName, setNewVenueName] = useState('')
  const [newVenueCapacity, setNewVenueCapacity] = useState('')
  const [newVenueDesc, setNewVenueDesc] = useState('')
  const [addingVenue, setAddingVenue] = useState(false)

  async function loadVenues() {
    if (!startTime || !endTime) {
      setVenues([])
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await getVenuesWithStatus(startTime, endTime, excludingEventId)
      if (res.error) {
        setError(res.error)
      } else if (res.venues) {
        setVenues(res.venues)
      }
    } catch (err: any) {
      setError('Failed to query venue statuses.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVenues()
  }, [startTime, endTime, excludingEventId])

  if (!startTime || !endTime) {
    return (
      <div className="p-4 border border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50 text-center text-xs text-zinc-400 font-mono">
        Please select Event Date & End Time first to load venue availability.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <label className="text-xs font-mono text-zinc-400 uppercase tracking-widest block">Checking Venue Availabilities...</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="text-xs font-mono text-[#555555] dark:text-zinc-400 uppercase tracking-widest font-bold">
          Select Venue *
        </label>
        <span className="text-[10px] font-mono text-zinc-400 italic">Includes 1-hour safety buffers</span>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-mono">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {venues.map(venue => {
          const isSelected = selectedVenueId === venue.id
          const isLocked = venue.status === 'locked'
          const isUnavailable = venue.status === 'unavailable'

          return (
            <div
              key={venue.id}
              className="relative"
              onMouseEnter={() => setHoveredVenueId(venue.id)}
              onMouseLeave={() => setHoveredVenueId(null)}
            >
              <button
                type="button"
                disabled={isLocked || isUnavailable}
                onClick={() => onSelectVenue(venue.id, venue.name)}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex justify-between items-center group relative overflow-hidden ${
                  isSelected
                    ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-md'
                    : isLocked
                    ? 'bg-zinc-50 border-zinc-200 text-zinc-400 cursor-not-allowed dark:bg-zinc-900/20 dark:border-zinc-800'
                    : isUnavailable
                    ? 'bg-amber-50/30 border-amber-100/50 text-zinc-400 cursor-not-allowed dark:bg-amber-950/5 dark:border-amber-900/20'
                    : 'bg-white border-zinc-200 hover:border-black dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-white text-[#0a0a0a] dark:text-zinc-200'
                }`}
              >
                <div className="space-y-1 z-10">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm tracking-tight">{venue.name}</span>
                    {venue.capacity && (
                      <span className={`text-[10px] font-mono border rounded-full px-2 py-0.5 ${
                        isSelected ? 'border-white/30 text-white/80' : 'border-zinc-100 text-zinc-400 dark:border-zinc-800'
                      }`}>
                        Cap: {venue.capacity}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs line-clamp-1 ${
                    isSelected ? 'text-zinc-300' : 'text-zinc-400'
                  }`}>
                    {venue.description || 'No description provided.'}
                  </p>
                </div>

                <div className="z-10 shrink-0">
                  {isLocked && (
                    <Lock size={16} className="text-rose-500 group-hover:scale-110 transition-transform" />
                  )}
                  {isUnavailable && (
                    <AlertTriangle size={16} className="text-amber-500" />
                  )}
                  {!isLocked && !isUnavailable && !isSelected && (
                    <span className="w-4 h-4 rounded-full border border-zinc-300 group-hover:border-black dark:border-zinc-700 dark:group-hover:border-white flex items-center justify-center transition-colors" />
                  )}
                  {isSelected && (
                    <CheckCircle size={16} className={isSelected ? 'text-white dark:text-black' : 'text-emerald-500'} />
                  )}
                </div>
              </button>

              {/* Tooltip for Locked / Overlapping booking */}
              {hoveredVenueId === venue.id && isLocked && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-zinc-900 text-white text-xs rounded-xl p-3 shadow-xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 border border-zinc-800">
                  <p className="font-bold flex items-center gap-1.5 text-rose-400 mb-1">
                    <Lock size={12} /> Venue Locked
                  </p>
                  <p className="font-mono text-[10px] leading-tight text-zinc-300 mb-1.5">
                    Overlap detected with safety buffers.
                  </p>
                  <div className="bg-black/40 rounded-lg p-2 font-mono text-[10px] space-y-0.5">
                    <p className="text-zinc-400">Event:</p>
                    <p className="text-white font-bold truncate">{venue.eventName}</p>
                    <p className="text-zinc-400 mt-1">Booked Slot:</p>
                    <p className="text-amber-400">{venue.conflictTime}</p>
                  </div>
                </div>
              )}

              {/* Tooltip for Unavailable slots */}
              {hoveredVenueId === venue.id && isUnavailable && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-zinc-900 text-white text-xs rounded-xl p-3 shadow-xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 border border-zinc-800">
                  <p className="font-bold flex items-center gap-1.5 text-amber-400 mb-1">
                    <AlertTriangle size={12} /> Unavailable
                  </p>
                  <p className="font-mono text-[10px] leading-tight text-zinc-300">
                    Faculty has not added this venue availability for this date/time window.
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add Custom Venue UI */}
      <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
        {!showAddForm ? (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 text-xs font-mono text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            <Plus size={14} />
            Can't find your venue? Click to add a new venue
          </button>
        ) : (
          <div className="bg-zinc-50 dark:bg-zinc-950 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
            <h4 className="text-xs font-bold font-mono text-[#0a0a0a] dark:text-white uppercase tracking-wider">Create New Physical Venue</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Venue Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Seminar Hall B"
                  value={newVenueName}
                  onChange={e => setNewVenueName(e.target.value)}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-black dark:focus:ring-white dark:text-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Capacity (optional)</label>
                <input
                  type="number"
                  placeholder="e.g., 100"
                  value={newVenueCapacity}
                  onChange={e => setNewVenueCapacity(e.target.value)}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-black dark:focus:ring-white dark:text-white"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Description (optional)</label>
              <input
                type="text"
                placeholder="e.g., Located on the 2nd floor, main building"
                value={newVenueDesc}
                onChange={e => setNewVenueDesc(e.target.value)}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-black dark:focus:ring-white dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false)
                  setNewVenueName('')
                  setNewVenueCapacity('')
                  setNewVenueDesc('')
                }}
                className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={addingVenue || !newVenueName}
                onClick={async () => {
                  setAddingVenue(true)
                  const formData = new FormData()
                  formData.append('name', newVenueName)
                  formData.append('capacity', newVenueCapacity)
                  formData.append('description', newVenueDesc)

                  const res = await createVenue(formData)
                  setAddingVenue(false)
                  if (res.error) {
                    toast.error(res.error)
                  } else if (res.venue) {
                    toast.success('Venue added successfully!')
                    setShowAddForm(false)
                    setNewVenueName('')
                    setNewVenueCapacity('')
                    setNewVenueDesc('')
                    // Re-query venue availability
                    await loadVenues()
                    // Auto-select the newly added venue
                    onSelectVenue(res.venue.id, res.venue.name)
                  }
                }}
                className="px-4 py-2 bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-white rounded-xl font-bold transition-all disabled:opacity-50"
              >
                {addingVenue ? 'Adding...' : 'Add Venue'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
