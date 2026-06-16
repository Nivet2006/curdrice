'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { createFacultyEvent } from '@/lib/actions/teacher-events'
import Link from 'next/link'
import { ArrowLeft, Send, BookOpen, Mic, GraduationCap, Star, MoreHorizontal, Truck, AlertCircle, Users } from 'lucide-react'
import { EventBackgroundCustomizer } from '@/components/shared/EventBackgroundCustomizer'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { LocationPicker } from '@/components/teacher/LocationPicker'
import { LocationMapEmbed } from '@/components/shared/LocationMapEmbed'
import PosterDesigner from '@/components/shared/PosterDesigner'
import { ImagePreview } from '@/components/shared/ImagePreview'
import { v4 as uuidv4 } from 'uuid'
import { VenueSelector } from '@/components/shared/VenueSelector'

const EVENT_CATEGORIES = [
  { value: 'faculty', label: 'Faculty Initiative', icon: GraduationCap, desc: 'Department-led academic activity' },
  { value: 'guest_lecture', label: 'Guest Lecture', icon: Mic, desc: 'External speaker or industry expert' },
  { value: 'workshop', label: 'Workshop', icon: BookOpen, desc: 'Hands-on learning session' },
  { value: 'seminar', label: 'Seminar', icon: Star, desc: 'Academic seminar or talk' },
  { value: 'industrial_visit', label: 'Industrial Visit', icon: Truck, desc: 'Industry/company site visit' },
  { value: 'others', label: 'Others', icon: MoreHorizontal, desc: 'Any other event type' },
]

const DEPARTMENTS = ['CSE', 'ECE', 'ME', 'CV', 'ISE', 'EEE']

export default function TeacherCreateEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [eventDate, setEventDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [deadline, setDeadline] = useState('')
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null)
  const [isPublic, setIsPublic] = useState(false)
  const [isCompulsory, setIsCompulsory] = useState(false)
  const [semesters, setSemesters] = useState<number[]>([])
  const [years, setYears] = useState<number[]>([])
  const [selectedCategory, setSelectedCategory] = useState('guest_lecture')
  const [visitLocation, setVisitLocation] = useState<{ name: string; displayName: string; lat: number; lng: number } | null>(null)

  const [eventType, setEventType] = useState('general')
  const [teamFormationEnabled, setTeamFormationEnabled] = useState(false)
  const [minTeamMembers, setMinTeamMembers] = useState(2)
  const [maxTeamMembers, setMaxTeamMembers] = useState(4)

  // Poster Lab specific states
  const [eventId] = useState(() => uuidv4())
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')

  const toggleSem = (s: number) => setSemesters(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  const toggleYear = (y: number) => setYears(prev => prev.includes(y) ? prev.filter(x => x !== y) : [...prev, y])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!eventDate || !deadline) {
      setError('Event Date and Registration Deadline are required.')
      return
    }

    if (selectedCategory !== 'industrial_visit') {
      if (!endTime) {
        setError('Event End Time is required.')
        return
      }
      if (!selectedVenueId) {
        setError('Please select a venue.')
        return
      }
    }

    if (selectedCategory === 'industrial_visit' && (!visitLocation || !visitLocation.lat)) {
      setError('Please search and pin a visit location on the map for Industrial Visit events.')
      return
    }

    if (isCompulsory && semesters.length === 0 && years.length === 0) {
      setError('For compulsory events, please select at least one target Semester or Year.')
      return
    }

    setLoading(true)
    const form = e.currentTarget
    const formData = new FormData(form)
    formData.set('id', eventId)
    formData.set('isPublic', isPublic ? 'true' : 'false')
    formData.set('eventCategory', selectedCategory)
    formData.set('isCompulsory', isCompulsory ? 'true' : 'false')
    formData.set('semesters', JSON.stringify(semesters))
    formData.set('years', JSON.stringify(years))
    
    if (selectedCategory !== 'industrial_visit') {
      formData.set('endTime', endTime)
      formData.set('venueId', selectedVenueId || '')
      formData.set('location', location)
    }

    if (visitLocation && selectedCategory === 'industrial_visit') {
      formData.set('locationLat', String(visitLocation.lat))
      formData.set('locationLng', String(visitLocation.lng))
      formData.set('location', visitLocation.displayName || visitLocation.name)
    }

    const result = await createFacultyEvent(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      toast.success(isCompulsory
        ? 'Compulsory event submitted! Students will be auto-registered on HOD approval.'
        : 'Event submitted to HOD for approval!')
      router.push('/teacher/dashboard')
    }
  }

  return (
    <div className="max-w-[1000px] mx-auto">
      {/* Header */}
      <div className="mb-10 flex items-center justify-between">
        <Link
          href="/teacher/dashboard"
          className="flex items-center gap-2 text-zinc-400 hover:text-black font-mono text-xs uppercase tracking-widest transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="font-mono text-[10px] uppercase text-zinc-400 tracking-tighter">Faculty Event Proposal</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        {/* Page title */}
        <header>
          <h1 className="text-4xl font-bold tracking-tight text-[#0a0a0a] dark:text-white">Faculty Event Proposal</h1>
          <p className="text-[#555] dark:text-zinc-400 mt-2">
            Submit a faculty-led event. It goes directly to HOD for approval.
          </p>
        </header>

        {/* Event Category Picker */}
        <section className="space-y-4">
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-2">
            Event Type
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {EVENT_CATEGORIES.map(({ value, label, icon: Icon, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setSelectedCategory(value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border text-center transition-all ${
                  selectedCategory === value
                    ? 'bg-black text-white border-black shadow-lg scale-105'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 hover:border-black dark:hover:border-white text-zinc-600 dark:text-zinc-300'
                }`}
              >
                <Icon size={20} className={selectedCategory === value ? 'text-white' : 'text-zinc-500 dark:text-zinc-400'} />
                <span className="font-bold text-xs">{label}</span>
                <span className={`text-[10px] font-mono ${selectedCategory === value ? 'text-zinc-300' : 'text-zinc-400'}`}>
                  {desc}
                </span>
              </button>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-8">

            {/* Event Details */}
            <section className="space-y-6">
              <h2 className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                Event Details
              </h2>
              <Input
                label="Title of the Event *"
                name="title"
                required
                placeholder="Ex: Guest Lecture on Distributed Systems"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
              {selectedCategory === 'guest_lecture' && (
                <Input
                  label="Guest Speaker / Expert Name"
                  name="guestName"
                  placeholder="Ex: Dr. Rajesh Kumar, IISc Bangalore"
                />
              )}

              {/* Industrial Visit — location picker appears here */}
              {selectedCategory === 'industrial_visit' && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
                    <p className="text-[10px] font-mono text-blue-700 dark:text-blue-400 uppercase tracking-wider font-bold mb-1">
                      Industrial Visit — Pin the Destination
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-500">
                      Search and select the visit location below. Students and HOD will see a live map with a direct link to Google Maps / Apple Maps.
                    </p>
                  </div>
                  <LocationPicker
                    onSelect={(loc) => setVisitLocation(loc.lat ? loc : null)}
                    selected={visitLocation}
                  />
                  {/* Hidden form value for server action */}
                  <input type="hidden" name="location" value={visitLocation?.displayName || visitLocation?.name || ''} />
                  {/* Map preview */}
                  {visitLocation && visitLocation.lat !== 0 && (
                    <LocationMapEmbed
                      lat={visitLocation.lat}
                      lng={visitLocation.lng}
                      name={visitLocation.name}
                      compact
                    />
                  )}
                </div>
              )}

              <div className="w-full flex flex-col gap-1">
                <label className="text-xs font-mono text-[#555555] dark:text-zinc-400 uppercase tracking-widest">
                  Detailed Description *
                </label>
                <textarea
                  name="description"
                  rows={5}
                  required
                  className="rounded-xl border border-[#d0d0d0] dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm focus:ring-2 focus:ring-black outline-none resize-none dark:text-white"
                  placeholder="What is this event about? What will students gain?"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
            </section>

            {/* Logistics & Venue */}
            <section className="space-y-6">
              <h2 className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                Logistics & Venue
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-mono text-[#555555] dark:text-zinc-400 uppercase tracking-widest">
                    Event Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="eventDate"
                    required
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    className="rounded-xl border border-[#d0d0d0] dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm focus:ring-2 focus:ring-black dark:text-white"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-mono text-[#555555] dark:text-zinc-400 uppercase tracking-widest">
                    Event End Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="endTime"
                    required
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="rounded-xl border border-[#d0d0d0] dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm focus:ring-2 focus:ring-black dark:text-white"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-mono text-[#555555] dark:text-zinc-400 uppercase tracking-widest">
                    Registration Deadline *
                  </label>
                  <input
                    type="datetime-local"
                    name="deadline"
                    required
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                    className="rounded-xl border border-[#d0d0d0] dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm focus:ring-2 focus:ring-black dark:text-white"
                  />
                </div>
              </div>

              {selectedCategory !== 'industrial_visit' ? (
                <>
                  <VenueSelector
                    selectedVenueId={selectedVenueId}
                    onSelectVenue={(id, name) => {
                      setSelectedVenueId(id)
                      setLocation(name)
                    }}
                    startTime={eventDate}
                    endTime={endTime}
                  />
                  <input type="hidden" name="venueId" value={selectedVenueId || ''} />
                  <input type="hidden" name="location" value={location || ''} />
                </>
              ) : (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400">
                  Location is set above via the pinned Map Destination.
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Attendee Capacity"
                  name="capacity"
                  type="number"
                  defaultValue={0}
                  placeholder="0 for unlimited"
                />
                <Input
                  label="Waitlist Max Capacity"
                  name="waitlistMax"
                  type="number"
                  defaultValue={0}
                  placeholder="0 for no waitlist"
                />
              </div>
            </section>

            {/* Visual Branding */}
            <section className="space-y-4">
              <h2 className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                Visual Branding
              </h2>
              <EventBackgroundCustomizer />
              <div className="bg-zinc-50 dark:bg-zinc-950 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-4">
                <div className="flex justify-between items-end gap-4">
                  <div className="flex-1">
                    <Input
                      label="Banner / Poster Image URL (optional)"
                      name="bannerUrl"
                      placeholder="https://example.com/poster.jpg"
                      value={bannerUrl}
                      onChange={e => setBannerUrl(e.target.value)}
                    />
                    <ImagePreview url={bannerUrl} />
                  </div>
                  <div className="pb-1">
                    <PosterDesigner
                      eventId={eventId}
                      initialTitle={title}
                      initialClubName={
                        selectedCategory === 'guest_lecture'
                          ? 'Guest Lecture'
                          : selectedCategory === 'industrial_visit'
                          ? 'Industrial Visit'
                          : 'Faculty Initiative'
                      }
                      initialDescription={description}
                      initialLocation={
                        selectedCategory === 'industrial_visit'
                          ? (visitLocation?.displayName || visitLocation?.name || '')
                          : location
                      }
                      initialDate={eventDate}
                      onApply={setBannerUrl}
                    />
                  </div>
                </div>
                <p className="text-[10px] font-mono text-zinc-400 italic">
                  This will appear on the student dashboard once approved by HOD.
                </p>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-black dark:border-zinc-700 rounded-3xl p-6 shadow-xl space-y-6">
              <h3 className="font-bold text-lg dark:text-white">Settings</h3>

              {/* Department */}
              <div>
                <label className="text-[10px] font-mono uppercase text-zinc-400 mb-2 block">
                  Target Department
                </label>
                <select
                  name="targetedDepartment"
                  required
                  className="w-full rounded-xl border border-[#d0d0d0] dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm focus:ring-2 focus:ring-black outline-none dark:text-white"
                >
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Event Type selection */}
              <div>
                <label className="text-[10px] font-mono uppercase text-zinc-400 mb-2 block">
                  Event Type
                </label>
                <select
                  name="eventType"
                  value={eventType}
                  onChange={e => setEventType(e.target.value)}
                  className="w-full rounded-xl border border-[#d0d0d0] dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm focus:ring-2 focus:ring-black outline-none dark:text-white"
                >
                  <option value="general">General (Standard Event)</option>
                  <option value="hackathon">Hackathon (Requires Team Portal)</option>
                </select>
              </div>

              {/* Hackathon Settings */}
              {eventType === 'hackathon' && (
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
                  <p className="font-mono text-[9px] uppercase text-zinc-400 tracking-wider font-bold">Hackathon Team Portal</p>
                  
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      name="teamFormationEnabled"
                      checked={teamFormationEnabled}
                      onChange={e => setTeamFormationEnabled(e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-300 text-black focus:ring-black cursor-pointer"
                    />
                    <span className="text-xs font-mono text-zinc-650 dark:text-zinc-305 group-hover:text-black dark:group-hover:text-white transition-colors">
                      Enable Student Team Formation
                    </span>
                  </label>

                  {teamFormationEnabled && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-mono uppercase text-zinc-400 mb-1 block">Min Members</label>
                        <input
                          type="number"
                          name="minTeamMembers"
                          min="1"
                          value={minTeamMembers}
                          onChange={e => setMinTeamMembers(parseInt(e.target.value) || 2)}
                          className="w-full rounded-xl border border-[#d0d0d0] dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs focus:ring-2 focus:ring-black outline-none dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-mono uppercase text-zinc-400 mb-1 block">Max Members</label>
                        <input
                          type="number"
                          name="maxTeamMembers"
                          min="1"
                          value={maxTeamMembers}
                          onChange={e => setMaxTeamMembers(parseInt(e.target.value) || 4)}
                          className="w-full rounded-xl border border-[#d0d0d0] dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs focus:ring-2 focus:ring-black outline-none dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Public toggle */}
              <div>
                <p className="text-[10px] font-mono uppercase text-zinc-400 mb-2">Public Shareability</p>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={e => setIsPublic(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-300 text-black focus:ring-black cursor-pointer"
                  />
                  <span className="text-xs font-mono text-zinc-600 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white transition-colors">
                    Make Event Public
                  </span>
                </label>
              </div>

              {/* ─── COMPULSORY TOGGLE ─── */}
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
                <div>
                  <p className="text-[10px] font-mono uppercase text-zinc-400 mb-1">Compulsory Event</p>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div
                      onClick={() => setIsCompulsory(v => !v)}
                      className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${isCompulsory ? 'bg-rose-500' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isCompulsory ? 'translate-x-5' : ''}`} />
                    </div>
                    <span className="text-xs font-mono text-zinc-600 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white transition-colors">
                      {isCompulsory ? 'Yes — Auto-register students' : 'No — Optional'}
                    </span>
                  </label>
                </div>

                {isCompulsory && (
                  <div className="space-y-4">
                    {/* Semester targets */}
                    <div>
                      <p className="text-[10px] font-mono uppercase text-zinc-400 mb-2 flex items-center gap-1">
                        <Users size={10} /> Target Semesters
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {[1,2,3,4,5,6,7,8].map(s => (
                          <button
                            type="button"
                            key={s}
                            onClick={() => toggleSem(s)}
                            className={`w-8 h-8 rounded-full border text-[10px] font-mono font-bold transition-all ${
                              semesters.includes(s)
                                ? 'bg-rose-500 text-white border-rose-500'
                                : 'border-zinc-200 dark:border-zinc-600 hover:border-rose-400 text-zinc-600 dark:text-zinc-300'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Year targets */}
                    <div>
                      <p className="text-[10px] font-mono uppercase text-zinc-400 mb-2">Target Years</p>
                      <div className="flex flex-wrap gap-2">
                        {[1,2,3,4].map(y => (
                          <button
                            type="button"
                            key={y}
                            onClick={() => toggleYear(y)}
                            className={`w-8 h-8 rounded-full border text-[10px] font-mono font-bold transition-all ${
                              years.includes(y)
                                ? 'bg-rose-500 text-white border-rose-500'
                                : 'border-zinc-200 dark:border-zinc-600 hover:border-rose-400 text-zinc-600 dark:text-zinc-300'
                            }`}
                          >
                            {y}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Warning */}
                    <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-100 dark:border-rose-800 flex items-start gap-2">
                      <AlertCircle size={14} className="text-rose-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] font-mono text-rose-600 dark:text-rose-400">
                        All matched students will be <strong>auto-registered with QR codes</strong> upon HOD approval. No manual action required.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Approval flow badge */}
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800">
                <p className="text-[10px] font-mono text-amber-700 dark:text-amber-400 uppercase tracking-wider font-bold mb-1">
                  Approval Flow
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-500">
                  Faculty events go directly to <strong>HOD</strong> for approval.
                  {isCompulsory && <span className="block mt-1 font-bold">Auto-registration triggers on HOD approval.</span>}
                </p>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-mono">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50 ${
                isCompulsory
                  ? 'bg-rose-500 hover:bg-rose-600 text-white'
                  : 'bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-100'
              }`}
            >
              <Send size={18} />
              {loading
                ? 'Submitting...'
                : isCompulsory
                ? 'Submit Compulsory Event to HOD'
                : 'Submit to HOD for Approval'
              }
            </button>
          </aside>
        </div>
      </form>
    </div>
  )
}
