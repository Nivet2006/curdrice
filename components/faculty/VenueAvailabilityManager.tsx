'use client'

import React, { useEffect, useState } from 'react'
import { getVenues, getVenueAvailabilities, createVenueAvailability, deleteVenueAvailability, createVenue } from '@/lib/actions/venue-actions'
import { Trash2, Plus, Calendar, Clock, MapPin, Check } from 'lucide-react'
import { toast } from 'sonner'

interface Venue {
  id: string
  name: string
  capacity: number | null
}

interface Availability {
  id: string
  venue_id: string
  date: string
  start_time: string
  end_time: string
  venues?: {
    name: string
  }
}

export function VenueAvailabilityManager() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [availabilities, setAvailabilities] = useState<Availability[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [selectedVenueId, setSelectedVenueId] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')

  // Add new venue inline state
  const [showAddVenueForm, setShowAddVenueForm] = useState(false)
  const [newVenueName, setNewVenueName] = useState('')
  const [newVenueCapacity, setNewVenueCapacity] = useState('')
  const [newVenueDesc, setNewVenueDesc] = useState('')
  const [addingVenue, setAddingVenue] = useState(false)

  async function loadData() {
    setLoading(true)
    const [venuesRes, availsRes] = await Promise.all([
      getVenues(),
      getVenueAvailabilities()
    ])
    if (venuesRes.venues) setVenues(venuesRes.venues)
    if (availsRes.availabilities) setAvailabilities(availsRes.availabilities as any)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedVenueId || !date || !startTime || !endTime) {
      toast.error('Please fill in all fields.')
      return
    }

    setSubmitting(true)
    const formData = new FormData()
    formData.append('venueId', selectedVenueId)
    formData.append('date', date)
    formData.append('startTime', startTime + ':00')
    formData.append('endTime', endTime + ':00')

    const res = await createVenueAvailability(formData)
    setSubmitting(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Venue availability added successfully!')
      loadData()
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this availability slot?')) return

    const res = await deleteVenueAvailability(id)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Slot removed successfully.')
      loadData()
    }
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-6 md:p-8 space-y-8 shadow-sm">
      <div>
        <h2 className="text-2xl font-black uppercase tracking-tighter text-[#0a0a0a] dark:text-white mb-2">Venue Availability Feeds</h2>
        <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest">Feed available venue slots for the week / month</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form to Add Availability */}
        <form onSubmit={handleSubmit} className="space-y-6 lg:border-r lg:border-zinc-100 dark:lg:border-zinc-800 lg:pr-8">
          <h3 className="font-bold text-sm text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Feed New Availability Slot</h3>

          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Select Venue</label>
                {!showAddVenueForm && (
                  <button
                    type="button"
                    onClick={() => setShowAddVenueForm(true)}
                    className="text-[10px] font-mono text-amber-600 hover:underline"
                  >
                    + Add New Venue
                  </button>
                )}
              </div>

              {!showAddVenueForm ? (
                <select
                  value={selectedVenueId}
                  onChange={e => setSelectedVenueId(e.target.value)}
                  required
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black dark:focus:ring-white dark:text-white"
                >
                  <option value="">-- Choose Venue --</option>
                  {venues.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              ) : (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold font-mono text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Create Venue</span>
                    <button
                      type="button"
                      onClick={() => setShowAddVenueForm(false)}
                      className="text-[10px] font-mono text-rose-500 hover:underline"
                    >
                      cancel
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Venue Name (e.g. 6TH FLOOR seminar hall)"
                    value={newVenueName}
                    onChange={e => setNewVenueName(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-black dark:text-white"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Capacity"
                      value={newVenueCapacity}
                      onChange={e => setNewVenueCapacity(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-black dark:text-white"
                    />
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
                          setShowAddVenueForm(false)
                          setNewVenueName('')
                          setNewVenueCapacity('')
                          setNewVenueDesc('')
                          // Reload
                          const venuesRes = await getVenues()
                          if (venuesRes.venues) setVenues(venuesRes.venues)
                          // Select the new venue
                          setSelectedVenueId(res.venue.id)
                        }
                      }}
                      className="bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-white rounded-xl text-[10px] font-mono uppercase tracking-wider font-bold"
                    >
                      {addingVenue ? 'Saving...' : 'Save & Select'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black dark:focus:ring-white dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  required
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black dark:focus:ring-white dark:text-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  required
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black dark:focus:ring-white dark:text-white"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-white rounded-xl font-bold flex items-center justify-center gap-2 text-xs uppercase tracking-widest transition-all active:scale-98 disabled:opacity-50"
          >
            <Plus size={14} />
            {submitting ? 'Feeding Slot...' : 'Feed Availability'}
          </button>
        </form>

        {/* List of Active Availability slots */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Active Availability Slots ({availabilities.length})</h3>
            <button type="button" onClick={loadData} className="text-[10px] font-mono text-zinc-400 hover:text-black dark:hover:text-white uppercase tracking-widest">Refresh</button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(n => (
                <div key={n} className="h-16 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 animate-pulse" />
              ))}
            </div>
          ) : availabilities.length > 0 ? (
            <div className="max-h-[350px] overflow-y-auto pr-2 space-y-3 divide-y divide-zinc-50 dark:divide-zinc-800/50">
              {availabilities.map((avail) => (
                <div key={avail.id} className="flex justify-between items-center pt-3 first:pt-0 group">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <MapPin size={12} className="text-zinc-400" />
                      <span className="font-bold text-sm text-zinc-800 dark:text-zinc-200">{avail.venues?.name || 'Venue'}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        {new Date(avail.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {avail.start_time.slice(0, 5)} - {avail.end_time.slice(0, 5)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(avail.id)}
                    className="p-2.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all"
                    title="Delete Slot"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-3xl">
              <Calendar size={32} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
              <p className="text-xs text-zinc-400 font-mono uppercase tracking-widest">No availability slots loaded</p>
              <p className="text-[10px] text-zinc-400 mt-1">Feeded slots will allow CCs to select these venues in that timeframe.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
