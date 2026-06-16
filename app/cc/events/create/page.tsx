'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createDraftEvent } from '@/lib/actions/cc-events'
import Link from 'next/link'
import { ArrowLeft, Save, Send, Sparkles } from 'lucide-react'
import { FeedbackFormBuilder, Question } from '@/components/cc/FeedbackFormBuilder'
import { EventBackgroundCustomizer } from '@/components/shared/EventBackgroundCustomizer'
import PosterDesigner from '@/components/shared/PosterDesigner'
import { ImagePreview } from '@/components/shared/ImagePreview'
import { VenueSelector } from '@/components/shared/VenueSelector'
import { v4 as uuidv4 } from 'uuid'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function CCCreateEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [eventDate, setEventDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [deadline, setDeadline] = useState('')
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null)

  const [semesters, setSemesters] = useState<number[]>([])
  const [years, setYears] = useState<number[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [isPublic, setIsPublic] = useState(false)

  const [eventType, setEventType] = useState('general')
  const [teamFormationEnabled, setTeamFormationEnabled] = useState(false)
  const [minTeamMembers, setMinTeamMembers] = useState(2)
  const [maxTeamMembers, setMaxTeamMembers] = useState(4)

  // Poster Lab specific states
  const [eventId] = useState(() => uuidv4())
  const [title, setTitle] = useState('')
  const [clubName, setClubName] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')

  const toggleSem = (s: number) => setSemesters(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  const toggleYear = (y: number) => setYears(prev => prev.includes(y) ? prev.filter(x => x !== y) : [...prev, y])

  const handleRandomPopulate = async () => {
    const now = new Date()
    
    const startDate = new Date(now)
    startDate.setDate(now.getDate() + 7)
    startDate.setHours(10, 0, 0, 0)
    
    const endDate = new Date(startDate)
    endDate.setHours(16, 0, 0, 0)
    
    const deadlineDate = new Date(now)
    deadlineDate.setDate(now.getDate() + 5)
    deadlineDate.setHours(23, 59, 0, 0)
    
    const formatDate = (d: Date) => {
      const pad = (n: number) => n.toString().padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    }
    
    const startStr = formatDate(startDate)
    const endStr = formatDate(endDate)
    const deadlineStr = formatDate(deadlineDate)
    
    setEventDate(startStr)
    setEndTime(endStr)
    setDeadline(deadlineStr)
    
    const templates = [
      {
        title: 'Quantum Hackathon 2026',
        club: 'Coding Club',
        desc: 'Join us for a 24-hour sprint developing algorithms and applications utilizing quantum computing frameworks. Mentorship will be provided by top experts in the field.',
        type: 'hackathon',
        banner: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800'
      },
      {
        title: 'RoboWars Arena Clash',
        club: 'Robotics Club',
        desc: 'Experience high-octane mechanical combat! Teams from across departments design and battle custom combat robots in our custom-built arena.',
        type: 'general',
        banner: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800'
      },
      {
        title: 'PixelPerfect UI/UX Design Jam',
        club: 'Design Studio',
        desc: 'A fast-paced interactive design challenge focusing on accessibility, micro-interactions, and premium aesthetics. Create a stunning case study in 6 hours.',
        type: 'general',
        banner: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800'
      },
      {
        title: 'Full-Stack Next.js 15 Masterclass',
        club: 'Coding Club',
        desc: 'An intensive hands-on workshop covering Server Actions, partial pre-rendering, advanced caching mechanisms, and building production-grade web applications.',
        type: 'general',
        banner: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800'
      }
    ]
    
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)]
    
    setTitle(randomTemplate.title)
    setClubName(randomTemplate.club)
    setDescription(randomTemplate.desc)
    setEventType(randomTemplate.type)
    setBannerUrl(randomTemplate.banner)
    
    if (randomTemplate.type === 'hackathon') {
      setTeamFormationEnabled(true)
      setMinTeamMembers(2)
      setMaxTeamMembers(Math.floor(Math.random() * 3) + 4)
    } else {
      setTeamFormationEnabled(false)
    }
    
    const possibleSems = [1, 2, 3, 4, 5, 6, 7, 8]
    const possibleYears = [1, 2, 3, 4]
    
    if (Math.random() > 0.4) {
      const selectedSems = possibleSems.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 4) + 1)
      setSemesters(selectedSems.sort((a,b) => a-b))
    } else {
      setSemesters([])
    }
    
    if (Math.random() > 0.4) {
      const selectedYears = possibleYears.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 2) + 1)
      setYears(selectedYears.sort((a,b) => a-b))
    } else {
      setYears([])
    }
    
    setIsPublic(Math.random() > 0.5)
    
    const capacityInput = document.querySelector('input[name="capacity"]') as HTMLInputElement
    const waitlistInput = document.querySelector('input[name="waitlistMax"]') as HTMLInputElement
    if (capacityInput) {
      capacityInput.value = (Math.floor(Math.random() * 3) * 50 + 50).toString()
    }
    if (waitlistInput) {
      waitlistInput.value = (Math.floor(Math.random() * 3) * 10 + 10).toString()
    }
    
    const feedbackTemplates: Question[] = [
      { id: uuidv4(), type: 'rating', label: 'Overall rating of the event', required: true },
      { id: uuidv4(), type: 'long_text', label: 'What did you like the most about the event?', required: false },
      { id: uuidv4(), type: 'multiple_choice', label: 'Was the content relevant to your studies?', options: ['Highly Relevant', 'Somewhat Relevant', 'Not Relevant'], required: true },
      { id: uuidv4(), type: 'boolean', label: 'Would you attend future events by this club?', required: true }
    ]
    setQuestions(feedbackTemplates)
    
    try {
      const { getVenuesWithStatus } = await import('@/lib/actions/venue-actions')
      const res = await getVenuesWithStatus(startStr, endStr)
      if (res.venues && res.venues.length > 0) {
        const availableVenues = res.venues.filter(v => v.status === 'available')
        if (availableVenues.length > 0) {
          const chosen = availableVenues[0]
          setSelectedVenueId(chosen.id)
          setLocation(chosen.name)
          toast.success(`Populated details & selected venue: ${chosen.name}`)
          return
        }
      }
    } catch (e) {
      console.error(e)
    }
    toast.success('Populated all details randomly!')
  }

  async function handleAction(form: HTMLFormElement, isFinalSubmit: boolean) {
    setError(null)

    if (!eventDate || !endTime || !deadline) {
      setError('Event Date, End Time, and Deadline are required.')
      return
    }

    if (!selectedVenueId) {
      setError('Please select a venue.')
      return
    }

    setLoading(true)

    const formData = new FormData(form)
    formData.append('id', eventId)
    formData.append('endTime', endTime)
    formData.append('venueId', selectedVenueId || '')
    formData.append('semesters', JSON.stringify(semesters))
    formData.append('years', JSON.stringify(years))
    formData.append('feedbackConfig', JSON.stringify(questions))
    formData.append('isPublic', isPublic ? 'true' : 'false')
    formData.append('submitForReview', isFinalSubmit ? 'true' : 'false')

    const result = await createDraftEvent(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      toast.success(isFinalSubmit ? "Event submitted for review!" : "Draft saved successfully!")
      router.push('/cc/dashboard')
    }
  }

  return (
    <div className="max-w-[1000px] mx-auto">
      <div className="mb-10 flex items-center justify-between">
        <Link href="/cc/dashboard" className="flex items-center gap-2 text-zinc-400 hover:text-black font-mono text-xs uppercase tracking-widest transition-colors">
          <ArrowLeft size={14} />
          Back to Pipeline
        </Link>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-zinc-300"></span>
          <span className="font-mono text-[10px] uppercase text-zinc-400 tracking-tighter">New Draft Session</span>
        </div>
      </div>

      <form onSubmit={(e) => e.currentTarget.setAttribute('data-submit-type', 'draft')} className="space-y-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-[#0a0a0a]">Proposal Draft</h1>
            <p className="text-[#555] mt-2">Initialize your club event. This draft will be reviewed by Faculty (Teacher & HOD) before being published to students.</p>
          </div>
          <button
            type="button"
            onClick={handleRandomPopulate}
            className="shrink-0 flex items-center gap-2 px-5 py-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all duration-200 active:scale-95 shadow-sm"
          >
            <Sparkles size={14} className="text-amber-600 animate-pulse" />
            Randomly Populate
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <section className="space-y-6">
              <h2 className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 border-b border-zinc-100 pb-2">Primary Content</h2>
              <Input label="Title of the Event *" name="title" required placeholder="Ex: AI Innovation Summit 2024" value={title} onChange={e => setTitle(e.target.value)} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Club Identity *" name="clubName" required placeholder="Ex: Coding Club" value={clubName} onChange={e => setClubName(e.target.value)} />
                <div className="w-full flex flex-col gap-1">
                  <label className="text-xs font-mono text-[#555555] uppercase tracking-widest">Target Department *</label>
                  <select name="targetedDepartment" required className="rounded-xl border border-[#d0d0d0] bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-black outline-none flex-1">
                    {['CSE', 'ECE', 'ME', 'CV', 'ISE', 'EEE'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="w-full flex flex-col gap-1">
                  <label className="text-xs font-mono text-[#555555] uppercase tracking-widest">Event Type *</label>
                  <select
                    name="eventType"
                    value={eventType}
                    onChange={e => setEventType(e.target.value)}
                    className="rounded-xl border border-[#d0d0d0] bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-black outline-none flex-1"
                  >
                    <option value="general">General (Standard Event)</option>
                    <option value="hackathon">Hackathon (Requires Team Portal)</option>
                  </select>
                </div>
              </div>

              {eventType === 'hackathon' && (
                <div className="border border-[#e0e0e0] rounded-2xl p-6 bg-zinc-50/50 dark:bg-zinc-900/30 space-y-4">
                  <p className="font-mono text-[10px] uppercase text-zinc-400 tracking-wider font-bold">Hackathon Team Formation Portal Configuration</p>
                  <div className="flex items-center gap-3">
                    <input
                      id="teamFormationEnabled"
                      name="teamFormationEnabled"
                      type="checkbox"
                      checked={teamFormationEnabled}
                      onChange={e => setTeamFormationEnabled(e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-300 text-black focus:ring-black cursor-pointer"
                    />
                    <label htmlFor="teamFormationEnabled" className="text-sm font-semibold text-black dark:text-zinc-200 select-none cursor-pointer">
                      Enable Student Team Formation Portal for this Hackathon
                    </label>
                  </div>

                  {teamFormationEnabled && (
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <Input
                        label="Minimum Team Size *"
                        name="minTeamMembers"
                        type="number"
                        min="1"
                        value={minTeamMembers}
                        onChange={e => setMinTeamMembers(parseInt(e.target.value) || 2)}
                      />
                      <Input
                        label="Maximum Team Size *"
                        name="maxTeamMembers"
                        type="number"
                        min="1"
                        value={maxTeamMembers}
                        onChange={e => setMaxTeamMembers(parseInt(e.target.value) || 4)}
                      />
                    </div>
                  )}
                </div>
              )}
              <div className="w-full flex flex-col gap-1">
                <label className="text-xs font-mono text-[#555555] uppercase tracking-widest">Detailed Pitch / Description *</label>
                <textarea name="description" rows={6} required className="rounded-xl border border-[#d0d0d0] bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-black outline-none resize-none" placeholder="What is this event about?" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 border-b border-zinc-100 pb-2">Logistics & Venue</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-mono text-[#555555] uppercase tracking-widest">Event Date (Start) *</label>
                  <input type="datetime-local" name="eventDate" required value={eventDate} onChange={e => setEventDate(e.target.value)} className="rounded-xl border border-[#d0d0d0] bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-black" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-mono text-[#555555] uppercase tracking-widest">Event End Time *</label>
                  <input type="datetime-local" name="endTime" required value={endTime} onChange={e => setEndTime(e.target.value)} className="rounded-xl border border-[#d0d0d0] bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-black" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-mono text-[#555555] uppercase tracking-widest">Registration Deadline *</label>
                  <input type="datetime-local" name="deadline" required value={deadline} onChange={e => setDeadline(e.target.value)} className="rounded-xl border border-[#d0d0d0] bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-black" />
                </div>
              </div>

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

              <div className="grid grid-cols-2 gap-4">
                <Input label="Attendee Capacity" name="capacity" type="number" defaultValue={0} placeholder="0 for unlimited" />
                <Input label="Waitlist Max Capacity" name="waitlistMax" type="number" defaultValue={0} placeholder="0 for no waitlist" />
              </div>
            </section>

            <section className="pt-8 border-t border-zinc-100">
              <FeedbackFormBuilder
                questions={questions}
                onChange={setQuestions}
              />
            </section>

            <section className="space-y-6">
              <h2 className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 border-b border-zinc-100 pb-2">Visual Branding</h2>
              <EventBackgroundCustomizer />
              <div className="bg-zinc-50 dark:bg-zinc-950 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-4">
                <div className="flex justify-between items-end gap-4">
                  <div className="flex-1">
                    <Input
                      label="Banner / Poster Image URL (e.g. .png, .jpg, .jpeg) *"
                      name="bannerUrl"
                      placeholder="https://example.com/poster.jpg"
                      required
                      value={bannerUrl}
                      onChange={e => setBannerUrl(e.target.value)}
                    />
                    <ImagePreview url={bannerUrl} />
                  </div>
                  <div className="pb-1">
                    <PosterDesigner
                      eventId={eventId}
                      initialTitle={title}
                      initialClubName={clubName}
                      initialDescription={description}
                      initialLocation={location}
                      initialDate={eventDate}
                      onApply={setBannerUrl}
                    />
                  </div>
                </div>
                <p className="text-[10px] font-mono text-zinc-400 italic">This will appear on the student dashboard once approved by HOD.</p>
              </div>
            </section>
          </div>

          <aside className="space-y-8">
            <div className="bg-white border border-black rounded-3xl p-6 shadow-xl space-y-6">
              <h3 className="font-bold text-lg">Filters & Eligibility</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-mono uppercase text-zinc-400 mb-2">Semesters</p>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <button type="button" key={s} onClick={() => toggleSem(s)} className={`w-8 h-8 rounded-full border text-[10px] font-mono transition-all ${semesters.includes(s) ? 'bg-black text-white border-black' : 'border-zinc-200 hover:border-black'}`}>{s}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase text-zinc-400 mb-2">Years</p>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4].map(y => (
                      <button type="button" key={y} onClick={() => toggleYear(y)} className={`w-8 h-8 rounded-full border text-[10px] font-mono transition-all ${years.includes(y) ? 'bg-black text-white border-black' : 'border-zinc-200 hover:border-black'}`}>{y}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase text-zinc-400 mb-2">Public Shareability</p>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={e => setIsPublic(e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-300 text-black focus:ring-black cursor-pointer"
                    />
                    <span className="text-xs font-mono text-zinc-600 group-hover:text-black transition-colors">
                      Make Event Public
                    </span>
                  </label>
                </div>
              </div>
              <p className="text-[9px] text-zinc-400 italic">None selected = Open to all students in targeted department.</p>
            </div>

            {error && <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-mono">{error}</div>}

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={(e) => {
                  const form = e.currentTarget.closest('form');
                  if (form) handleAction(form, true);
                }}
                disabled={loading}
                className="w-full bg-black text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all shadow-lg active:scale-95 disabled:opacity-50"
              >
                <Send size={18} />
                {loading ? 'Processing...' : 'Submit for Review'}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  const form = e.currentTarget.closest('form');
                  if (form) handleAction(form, false);
                }}
                disabled={loading}
                className="w-full bg-white border border-zinc-200 text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-50 transition-all active:scale-95 disabled:opacity-50"
              >
                <Save size={18} />
                {loading ? 'Saving...' : 'Save as Local Draft'}
              </button>
            </div>
          </aside>
        </div>
      </form>
    </div>
  )
}
