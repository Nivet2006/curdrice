'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { updateFacultyEvent } from '@/lib/actions/teacher-events'
import Link from 'next/link'
import { ArrowLeft, Send, BookOpen, Mic, GraduationCap, Star, MoreHorizontal, Truck, AlertCircle, Users, Save } from 'lucide-react'
import { EventBackgroundCustomizer } from '@/components/shared/EventBackgroundCustomizer'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { LocationPicker } from '@/components/teacher/LocationPicker'
import { LocationMapEmbed } from '@/components/shared/LocationMapEmbed'
import PosterDesigner from '@/components/shared/PosterDesigner'
import { ImagePreview } from '@/components/shared/ImagePreview'
import { VenueSelector } from '@/components/shared/VenueSelector'
import { type EventDraft } from '@/components/teacher/DraftManager'

const EVENT_CATEGORIES = [
  { value: 'faculty', label: 'Faculty Initiative', icon: GraduationCap, desc: 'Department-led academic activity' },
  { value: 'guest_lecture', label: 'Guest Lecture', icon: Mic, desc: 'External speaker or industry expert' },
  { value: 'workshop', label: 'Workshop', icon: BookOpen, desc: 'Hands-on learning session' },
  { value: 'seminar', label: 'Seminar', icon: Star, desc: 'Academic seminar or talk' },
  { value: 'industrial_visit', label: 'Industrial Visit', icon: Truck, desc: 'Industry/company site visit' },
  { value: 'others', label: 'Others', icon: MoreHorizontal, desc: 'Any other event type' },
]

const DEPARTMENTS = ['CSE', 'ECE', 'ME', 'CV', 'ISE', 'EEE']

interface EditEventFormProps {
  event: any
  constraints: any
}

export default function EditEventForm({ event, constraints }: EditEventFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Format dates for input[type="datetime-local"]
  const formatForInput = (dateStr: string | null) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  }

  const [eventDate, setEventDate] = useState(formatForInput(event.event_date))
  const [endTime, setEndTime] = useState(formatForInput(event.end_time))
  const [deadline, setDeadline] = useState(formatForInput(event.registration_deadline))
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(event.venue_id || null)
  const [isPublic, setIsPublic] = useState(!!event.is_public)
  const [isCompulsory, setIsCompulsory] = useState(!!event.is_compulsory)
  const [semesters, setSemesters] = useState<number[]>(constraints?.allowed_semesters || [])
  const [years, setYears] = useState<number[]>(constraints?.allowed_years || [])
  const [selectedCategory, setSelectedCategory] = useState(event.event_category || 'faculty')
  
  // Industrial Visit specific
  const [visitLocation, setVisitLocation] = useState<{ name: string; displayName: string; lat: number; lng: number } | null>(() => {
    if (event.event_category === 'industrial_visit' && event.location_lat) {
      return {
        name: event.location || '',
        displayName: event.location || '',
        lat: event.location_lat,
        lng: event.location_lng || 0
      }
    }
    return null
  })

  const [eventType, setEventType] = useState(event.event_type || 'general')
  const [teamFormationEnabled, setTeamFormationEnabled] = useState(event.team_formation_enabled || false)
  const [minTeamMembers, setMinTeamMembers] = useState(event.min_team_members || 2)
  const [maxTeamMembers, setMaxTeamMembers] = useState(event.max_team_members || 4)

  const [title, setTitle] = useState(event.title || '')
  const [description, setDescription] = useState(event.description || '')
  const [location, setLocation] = useState(event.location || '')
  const [bannerUrl, setBannerUrl] = useState(event.banner_url || '')
  const [capacity, setCapacity] = useState(event.max_capacity !== null ? String(event.max_capacity) : '')
  const [waitlistMax, setWaitlistMax] = useState(event.waitlist_max !== null ? String(event.waitlist_max) : '')
  const [targetedDepartment, setTargetedDepartment] = useState(event.targeted_department || 'CSE')
  const [customBackground, setCustomBackground] = useState(event.custom_background || '')

  const toggleSem = (s: number) => setSemesters(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  const toggleYear = (y: number) => setYears(prev => prev.includes(y) ? prev.filter(x => x !== y) : [...prev, y])

  async function handleSaveDraft() {
    setLoading(true)
    setError(null)
    const formData = new FormData()
    formData.set('id', event.id)
    formData.set('title', title)
    formData.set('description', description)
    formData.set('eventCategory', selectedCategory)
    formData.set('eventDate', eventDate)
    formData.set('endTime', endTime)
    formData.set('deadline', deadline)
    formData.set('bannerUrl', bannerUrl)
    formData.set('isPublic', isPublic ? 'true' : 'false')
    formData.set('isCompulsory', isCompulsory ? 'true' : 'false')
    formData.set('semesters', JSON.stringify(semesters))
    formData.set('years', JSON.stringify(years))
    formData.set('targetedDepartment', targetedDepartment)
    formData.set('eventType', eventType)
    formData.set('teamFormationEnabled', teamFormationEnabled ? 'true' : 'false')
    formData.set('minTeamMembers', String(minTeamMembers))
    formData.set('maxTeamMembers', String(maxTeamMembers))
    formData.set('capacity', capacity)
    formData.set('waitlistMax', waitlistMax)
    formData.set('customBackground', customBackground)
    formData.set('submitForReview', 'false')

    if (selectedCategory !== 'industrial_visit') {
      formData.set('venueId', selectedVenueId || '')
      formData.set('location', location)
    }

    if (visitLocation && selectedCategory === 'industrial_visit') {
      formData.set('locationLat', String(visitLocation.lat))
      formData.set('locationLng', String(visitLocation.lng))
      formData.set('location', visitLocation.displayName || visitLocation.name)
    }

    const { saveTeacherEventDraft } = await import('@/lib/actions/teacher-events')
    const result = await saveTeacherEventDraft(formData)
    setLoading(false)

    if (result?.error) {
      setError(result.error)
      toast.error(result.error)
    } else {
      toast.success('Draft updated successfully!')
      router.refresh()
    }
  }

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
    formData.set('id', event.id)
    formData.set('isPublic', isPublic ? 'true' : 'false')
    formData.set('eventCategory', selectedCategory)
    formData.set('isCompulsory', isCompulsory ? 'true' : 'false')
    formData.set('semesters', JSON.stringify(semesters))
    formData.set('years', JSON.stringify(years))
    formData.set('submitForReview', 'true')
    
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

    const result = await updateFacultyEvent(event.id, formData)

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
          <span className="font-mono text-[10px] uppercase text-zinc-400 tracking-tighter">Edit Draft Proposal</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        <header>
          <h1 className="text-4xl font-bold tracking-tight text-[#0a0a0a] dark:text-white">Edit Event Draft</h1>
          <p className="text-[#555] dark:text-zinc-400 mt-2">
            Revise your saved draft. It goes to HOD for approval once submitted.
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
                  defaultValue={event.club_name?.startsWith('Guest Lecture — ') ? event.club_name.replace('Guest Lecture — ', '') : ''}
                />
              )}

              {/* Industrial Visit */}
              {selectedCategory === 'industrial_visit' && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
                    <p className="text-[10px] font-mono text-blue-700 dark:text-blue-400 uppercase tracking-wider font-bold mb-1">
                      Industrial Visit — Pin the Destination
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-500">
                      Search and select the visit location below. Students and HOD will see a live map.
                    </p>
                  </div>
                  <LocationPicker
                    onSelect={(loc) => setVisitLocation(loc.lat ? loc : null)}
                    selected={visitLocation}
                  />
                  <input type="hidden" name="location" value={visitLocation?.displayName || visitLocation?.name || ''} />
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
                    excludingEventId={event.id}
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
                  value={capacity}
                  onChange={e => setCapacity(e.target.value)}
                  placeholder="0 for unlimited"
                />
                <Input
                  label="Waitlist Max Capacity"
                  name="waitlistMax"
                  type="number"
                  value={waitlistMax}
                  onChange={e => setWaitlistMax(e.target.value)}
                  placeholder="0 for no waitlist"
                />
              </div>
            </section>

            {/* Visual Branding */}
            <section className="space-y-4">
              <h2 className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                Visual Branding
              </h2>
              <EventBackgroundCustomizer initialValue={event.custom_background} />
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
                      eventId={event.id}
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
                  value={targetedDepartment}
                  onChange={e => setTargetedDepartment(e.target.value)}
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
                    <span className="text-xs font-mono text-zinc-600 group-hover:text-black dark:group-hover:text-white transition-colors">
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

              {/* Compulsory toggle */}
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
                                ? 'bg-rose-50 text-white border-rose-500'
                                : 'border-zinc-200 dark:border-zinc-600 hover:border-rose-400 text-zinc-600 dark:text-zinc-300'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

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
                                ? 'bg-rose-50 text-white border-rose-500'
                                : 'border-zinc-200 dark:border-zinc-600 hover:border-rose-400 text-zinc-600 dark:text-zinc-300'
                            }`}
                          >
                            {y}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-mono">
                {error}
              </div>
            )}

            {/* Save Draft button */}
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={loading}
              className="w-full py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all border-2 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-amber-400 hover:text-amber-600 dark:hover:border-amber-500 dark:hover:text-amber-400 active:scale-95 disabled:opacity-50"
            >
              <Save size={16} />
              {loading ? 'Saving...' : 'Save Draft Changes'}
            </button>

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
