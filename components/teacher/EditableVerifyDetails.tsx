'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { updateFacultyEvent } from '@/lib/actions/teacher-events'
import { 
  Edit, X, Save, ArrowLeft, Send, BookOpen, Mic, 
  GraduationCap, Star, MoreHorizontal, Truck, AlertCircle, 
  Users, MapPin, User, CheckCircle2 
} from 'lucide-react'
import { EventBackgroundCustomizer } from '@/components/shared/EventBackgroundCustomizer'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { LocationPicker } from '@/components/teacher/LocationPicker'
import { LocationMapEmbed } from '@/components/shared/LocationMapEmbed'
import PosterDesigner from '@/components/shared/PosterDesigner'
import { ImagePreview } from '@/components/shared/ImagePreview'
import { VenueSelector } from '@/components/shared/VenueSelector'
import { parseCustomBackground } from '@/lib/custom-background'

const EVENT_CATEGORIES = [
  { value: 'faculty', label: 'Faculty Initiative', icon: GraduationCap, desc: 'Department-led academic activity' },
  { value: 'guest_lecture', label: 'Guest Lecture', icon: Mic, desc: 'External speaker or industry expert' },
  { value: 'workshop', label: 'Workshop', icon: BookOpen, desc: 'Hands-on learning session' },
  { value: 'seminar', label: 'Seminar', icon: Star, desc: 'Academic seminar or talk' },
  { value: 'industrial_visit', label: 'Industrial Visit', icon: Truck, desc: 'Industry/company site visit' },
  { value: 'others', label: 'Others', icon: MoreHorizontal, desc: 'Any other event type' },
]

const DEPARTMENTS = ['CSE', 'ECE', 'ME', 'CV', 'ISE', 'EEE']

interface EditableVerifyDetailsProps {
  event: any
  constraints: any
}

export function EditableVerifyDetails({ event, constraints }: EditableVerifyDetailsProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Format dates for input[type="datetime-local"]
  const formatForInput = (dateStr: string | null) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  }

  // Form states
  const [title, setTitle] = useState(event.title || '')
  const [description, setDescription] = useState(event.description || '')
  const [selectedCategory, setSelectedCategory] = useState(event.event_category || 'faculty')
  const [eventDate, setEventDate] = useState(formatForInput(event.event_date))
  const [endTime, setEndTime] = useState(formatForInput(event.end_time))
  const [deadline, setDeadline] = useState(formatForInput(event.registration_deadline))
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(event.venue_id || null)
  const [location, setLocation] = useState(event.location || '')
  const [capacity, setCapacity] = useState(event.max_capacity !== null ? String(event.max_capacity) : '')
  const [waitlistMax, setWaitlistMax] = useState(event.waitlist_max !== null ? String(event.waitlist_max) : '')
  const [bannerUrl, setBannerUrl] = useState(event.banner_url || '')
  const [customBackground, setCustomBackground] = useState(event.custom_background || '')
  
  // Settings states
  const [targetedDepartment, setTargetedDepartment] = useState(event.targeted_department || 'CSE')
  const [eventType, setEventType] = useState(event.event_type || 'general')
  const [teamFormationEnabled, setTeamFormationEnabled] = useState(event.team_formation_enabled || false)
  const [minTeamMembers, setMinTeamMembers] = useState(event.min_team_members || 2)
  const [maxTeamMembers, setMaxTeamMembers] = useState(event.max_team_members || 4)
  const [isPublic, setIsPublic] = useState(!!event.is_public)
  const [isCompulsory, setIsCompulsory] = useState(!!event.is_compulsory)
  const [semesters, setSemesters] = useState<number[]>(constraints?.allowed_semesters || [])
  const [years, setYears] = useState<number[]>(constraints?.allowed_years || [])

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

  const toggleSem = (s: number) => setSemesters(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  const toggleYear = (y: number) => setYears(prev => prev.includes(y) ? prev.filter(x => x !== y) : [...prev, y])

  async function handleSaveChanges(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!eventDate || !deadline) {
      setError('Event Date and Registration Deadline are required.')
      setLoading(false)
      return
    }

    if (selectedCategory !== 'industrial_visit') {
      if (!endTime) {
        setError('Event End Time is required.')
        setLoading(false)
        return
      }
      if (!selectedVenueId) {
        setError('Please select a venue.')
        setLoading(false)
        return
      }
    }

    if (selectedCategory === 'industrial_visit' && (!visitLocation || !visitLocation.lat)) {
      setError('Please search and pin a visit location on the map for Industrial Visit events.')
      setLoading(false)
      return
    }

    if (isCompulsory && semesters.length === 0 && years.length === 0) {
      setError('For compulsory events, please select at least one target Semester or Year.')
      setLoading(false)
      return
    }

    const formData = new FormData(e.currentTarget as HTMLFormElement)
    formData.set('id', event.id)
    formData.set('isPublic', isPublic ? 'true' : 'false')
    formData.set('eventCategory', selectedCategory)
    formData.set('isCompulsory', isCompulsory ? 'true' : 'false')
    formData.set('semesters', JSON.stringify(semesters))
    formData.set('years', JSON.stringify(years))
    formData.set('teamFormationEnabled', teamFormationEnabled ? 'true' : 'false')
    formData.set('minTeamMembers', String(minTeamMembers))
    formData.set('maxTeamMembers', String(maxTeamMembers))

    if (selectedCategory !== 'industrial_visit') {
      formData.set('venueId', selectedVenueId || '')
      formData.set('location', location)
    } else if (visitLocation && selectedCategory === 'industrial_visit') {
      formData.set('locationLat', String(visitLocation.lat))
      formData.set('locationLng', String(visitLocation.lng))
      formData.set('location', visitLocation.displayName || visitLocation.name)
    }

    const result = await updateFacultyEvent(event.id, formData)
    setLoading(false)

    if (result?.error) {
      setError(result.error)
      toast.error(result.error)
    } else {
      toast.success('Event details updated successfully!')
      setIsEditing(false)
      router.refresh()
    }
  }

  if (isEditing) {
    return (
      <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 space-y-8 shadow-lg transition-all">
        <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-900 pb-4">
          <h2 className="text-2xl font-black uppercase tracking-tight dark:text-white">Edit Event Details</h2>
          <button 
            type="button" 
            onClick={() => setIsEditing(false)}
            className="p-2 border-2 border-black dark:border-white rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all"
          >
            <X size={16} className="dark:text-white" />
          </button>
        </div>

        <form onSubmit={handleSaveChanges} className="space-y-8">
          {/* Event Category Picker */}
          <section className="space-y-4">
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 border-b border-zinc-150 dark:border-zinc-800 pb-2">
              Event Type
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {EVENT_CATEGORIES.map(({ value, label, icon: Icon, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectedCategory(value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border text-center transition-all ${
                    selectedCategory === value
                      ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-md scale-[1.02]'
                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 hover:border-black dark:hover:border-white text-zinc-650 dark:text-zinc-300'
                  }`}
                >
                  <Icon size={18} className={selectedCategory === value ? 'text-white dark:text-black' : 'text-zinc-500 dark:text-zinc-400'} />
                  <span className="font-bold text-xs">{label}</span>
                  <span className={`text-[9px] font-mono ${selectedCategory === value ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-400'}`}>
                    {desc}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Details */}
          <section className="space-y-6">
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 border-b border-zinc-150 dark:border-zinc-800 pb-2">
              Event Details
            </h3>
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

            {selectedCategory === 'industrial_visit' && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
                  <p className="text-[10px] font-mono text-blue-700 dark:text-blue-400 uppercase tracking-wider font-bold mb-1">
                    Industrial Visit — Pin the Destination
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

          {/* Logistics */}
          <section className="space-y-6">
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 border-b border-zinc-150 dark:border-zinc-800 pb-2">
              Logistics & Venue
            </h3>
            
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
                Location is set above via pinned destination.
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

          {/* Settings & Branding */}
          <section className="space-y-6">
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 border-b border-zinc-150 dark:border-zinc-800 pb-2">
              Advanced Settings
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>

            {eventType === 'hackathon' && (
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
                <p className="font-mono text-[9px] uppercase text-zinc-400 tracking-wider font-bold">Hackathon Team Portal</p>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
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

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
              <div>
                <p className="text-[10px] font-mono uppercase text-zinc-400 mb-1">Compulsory Event</p>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    onClick={() => setIsCompulsory(v => !v)}
                    className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${isCompulsory ? 'bg-rose-500' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isCompulsory ? 'translate-x-5' : ''}`} />
                  </div>
                  <span className="text-xs font-mono text-zinc-650 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white transition-colors">
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
                              ? 'bg-rose-500 text-white border-rose-500'
                              : 'border-zinc-200 dark:border-zinc-600 hover:border-rose-400 text-zinc-605 dark:text-zinc-300'
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
                              ? 'bg-rose-500 text-white border-rose-500'
                              : 'border-zinc-200 dark:border-zinc-600 hover:border-rose-400 text-zinc-605 dark:text-zinc-300'
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

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
              <EventBackgroundCustomizer initialValue={event.custom_background} />
              
              <div className="flex justify-between items-end gap-4 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
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

          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-mono">
              {error}
            </div>
          )}

          <div className="flex gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-900">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={loading}
              className="flex-1 py-4 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900 active:scale-95 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <Save size={16} />
              {loading ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    )
  }

  // Read-only static view (Same as left column in page.tsx)
  const bg = parseCustomBackground(event.custom_background, event.banner_url)

  return (
    <div className="space-y-5">
      <header className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter text-[#0a0a0a] dark:text-white leading-tight">
              {event.title}
            </h1>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-center">
            {(Array.isArray(event.profiles) ? event.profiles[0] : event.profiles)?.role === 'teacher' && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-950 border-2 border-black dark:border-white rounded-xl font-mono text-[10px] uppercase font-bold tracking-wider hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-all active:translate-y-[0px] active:shadow-none"
              >
                <Edit size={12} />
                Edit Details
              </button>
            )}
            <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-2 rounded-2xl">
              <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">ID</span>
              <span className="text-lg font-black font-mono text-[#0a0a0a] dark:text-white tracking-tighter italic">{event.id}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-mono text-zinc-500 uppercase tracking-wider">
          <div className="flex items-center gap-2 text-black dark:text-white font-bold">
            <span className="w-2 h-2 rounded-full bg-black dark:bg-white"></span>
            <span>{event.club_name === 'Others' ? `By: ${event.profiles?.full_name || 'Faculty'}` : `Club: ${event.club_name}`}</span>
          </div>
          {event.club_name !== 'Others' && (
            <>
              <span className="opacity-30">/</span>
              <span>Proposer: {event.profiles?.full_name || 'Faculty'}</span>
            </>
          )}
          <span className="opacity-30">/</span>
          <span className="text-black dark:text-white font-bold">Dept: {event.targeted_department || 'All'}</span>
          <span className="opacity-30">/</span>
          <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-[10px] font-black">Category: {event.event_category?.replace(/_/g, ' ').toUpperCase() || 'STANDARD'}</span>
          {event.event_type && (
            <>
              <span className="opacity-30">/</span>
              <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-[10px] font-black">Type: {event.event_type.toUpperCase()}</span>
            </>
          )}
        </div>
      </header>

      <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-4 shadow-sm transition-colors">
        <div>
          <h3 className="text-[10px] font-mono text-zinc-500 dark:text-zinc-600 uppercase tracking-[0.2em] mb-2">Executive Summary</h3>
          <p className="text-zinc-800 dark:text-zinc-300 leading-relaxed text-base font-medium whitespace-pre-wrap">{event.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-zinc-100 dark:border-zinc-900 pt-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-zinc-400">
              <MapPin size={14} />
              <h3 className="text-[10px] font-mono uppercase tracking-[0.2em]">Logistics</h3>
            </div>
            <p className="font-bold text-black dark:text-white">{event.location}</p>
            <p className="text-xs text-zinc-500">{new Date(event.event_date).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' })}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-zinc-400">
              <User size={14} />
              <h3 className="text-[10px] font-mono uppercase tracking-[0.2em]">Capacity</h3>
            </div>
            <p className="font-bold text-black dark:text-white">{event.max_capacity || 'Unlimited'}</p>
            <p className="text-xs text-zinc-500">Scheduled Attendee Limit</p>
          </div>
        </div>
      </div>

      {bg.hasBg && (
        <div className="w-full aspect-[16/9] rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-2xl relative group transition-all flex items-end p-6">
          {bg.customStyleBlock && <style dangerouslySetInnerHTML={{ __html: bg.customStyleBlock }} />}
          
          <div 
            style={bg.backdropStyle} 
            className={`absolute inset-0 w-full h-full pointer-events-none transition-all ${bg.backdropClass}`} 
          />
          
          {bg.backdropOverlayClass && (
            <div 
              style={bg.backdropOverlayStyle} 
              className={`absolute inset-0 w-full h-full pointer-events-none transition-all ${bg.backdropOverlayClass}`} 
            />
          )}

          {bg.meshPatternStyle && (
            <div 
              style={bg.meshPatternStyle} 
              className="absolute inset-0 w-full h-full pointer-events-none opacity-80" 
            />
          )}
          
          <div className={`w-full max-w-xl relative z-10 transition-all ${bg.cardClass}`} style={bg.cardStyle}>
            <p className="font-mono text-[10px] uppercase tracking-[0.5em] opacity-80 mb-2">Visual Asset Preview</p>
            <h4 className="text-xl font-bold tracking-tight uppercase">{event.title}</h4>
          </div>
        </div>
      )}
    </div>
  )
}
