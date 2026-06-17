'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { updateEventDraft } from '@/lib/actions/cc-events'
import Link from 'next/link'
import { ArrowLeft, Save, Send, AlertCircle } from 'lucide-react'
import { FeedbackFormBuilder, Question } from '@/components/cc/FeedbackFormBuilder'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { EventBackgroundCustomizer } from '@/components/shared/EventBackgroundCustomizer'
import PosterDesigner from '@/components/shared/PosterDesigner'
import { ImagePreview } from '@/components/shared/ImagePreview'
import { VenueSelector } from '@/components/shared/VenueSelector'
import { HackathonConfigPanel } from '@/components/student/HackathonConfigPanel'

interface EditEventFormProps {
  event: any
  constraints: any
}

export default function EditEventForm({ event, constraints }: EditEventFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Format dates for input[type="datetime-local"]
  const formatForInput = (dateStr: string) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  }

  const [eventDate, setEventDate] = useState(formatForInput(event.event_date))
  const [endTime, setEndTime] = useState(formatForInput(event.end_time))
  const [deadline, setDeadline] = useState(formatForInput(event.registration_deadline))
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(event.venue_id || null)

  const [semesters, setSemesters] = useState<number[]>(constraints?.allowed_semesters || [])
  const [years, setYears] = useState<number[]>(constraints?.allowed_years || [])
  const [questions, setQuestions] = useState<Question[]>(event.feedback_config || [])
  const [isPublic, setIsPublic] = useState(!!event.is_public)

  const [eventType, setEventType] = useState(event.event_type || 'general')
  const [teamFormationEnabled, setTeamFormationEnabled] = useState(event.team_formation_enabled || false)
  const [minTeamMembers, setMinTeamMembers] = useState(event.min_team_members || 2)
  const [maxTeamMembers, setMaxTeamMembers] = useState(event.max_team_members || 4)

  // Poster Lab specific states
  const [title, setTitle] = useState(event.title || '')
  const [clubName, setClubName] = useState(event.club_name || '')
  const [description, setDescription] = useState(event.description || '')
  const [location, setLocation] = useState(event.location || '')
  const [bannerUrl, setBannerUrl] = useState(event.banner_url || '')

  const toggleSem = (s: number) => setSemesters(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  const toggleYear = (y: number) => setYears(prev => prev.includes(y) ? prev.filter(x => x !== y) : [...prev, y])

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
    formData.append('endTime', endTime)
    formData.append('venueId', selectedVenueId || '')
    formData.append('semesters', JSON.stringify(semesters))
    formData.append('years', JSON.stringify(years))
    formData.append('feedbackConfig', JSON.stringify(questions))
    formData.append('isPublic', isPublic ? 'true' : 'false')
    formData.append('submitForReview', isFinalSubmit ? 'true' : 'false')

    const result = await updateEventDraft(event.id, formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      toast.success(isFinalSubmit ? "Event updated successfully!" : "Changes saved successfully!")
      router.push(`/cc/events/${event.id}`)
      router.refresh()
    }
  }

  return (
    <div className="max-w-[1000px] mx-auto">
      <div className="mb-10 flex items-center justify-between">
        <Link href={`/cc/events/${event.id}`} className="flex items-center gap-2 text-zinc-400 hover:text-black font-mono text-xs uppercase tracking-widest transition-colors">
          <ArrowLeft size={14} />
          Back to Detail
        </Link>
        <div className="flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
           <span className="font-mono text-[10px] uppercase text-zinc-400 tracking-tighter">Editing Active Draft</span>
        </div>
      </div>

      <form className="space-y-12">
        <header className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-[#0a0a0a]">Revise Proposal</h1>
          {(() => {
            const rejectionData = Array.isArray(event.rejection_data)
              ? event.rejection_data
              : (typeof event.rejection_data === 'string'
                ? (JSON.parse(event.rejection_data) || [])
                : []);
            if (!rejectionData || rejectionData.length === 0) return null;
            return (
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex gap-3">
                <AlertCircle className="text-rose-600 shrink-0" size={20} />
                <div>
                  <p className="text-xs font-bold text-rose-600 uppercase tracking-widest mb-2">Reviewer Feedback</p>
                  <div className="space-y-2">
                    {rejectionData.map((r: any, i: number) => (
                      <p key={i} className="text-sm text-rose-900 border-l-2 border-rose-200 pl-3"><span className="font-bold">{r.field}:</span> {r.reason}</p>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
             <section className="space-y-6">
                <h2 className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 border-b border-zinc-100 pb-2">Primary Content</h2>
                 <Input label="Title of the Event *" name="title" value={title} onChange={e => setTitle(e.target.value)} required />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Club Identity *" name="clubName" value={clubName} onChange={e => setClubName(e.target.value)} required />
                    <div className="w-full flex flex-col gap-1">
                      <label className="text-xs font-mono text-[#555555] uppercase tracking-widest">Target Department *</label>
                      <select name="targetedDepartment" defaultValue={event.targeted_department} required className="rounded-xl border border-[#d0d0d0] bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-black outline-none flex-1">
                         {['CSE','ECE','ME','CV','ISE','EEE'].map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="w-full flex flex-col gap-1">
                      <label className="text-xs font-mono text-[#555555] uppercase tracking-widest">Event Type *</label>
                      <select
                        name="eventType"
                        value={eventType}
                        onChange={e => setEventType(e.target.value as 'general' | 'hackathon')}
                        className="rounded-xl border border-[#d0d0d0] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a0a0a]"
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

                  {eventType === 'hackathon' && (
                    <div className="mt-6">
                      <HackathonConfigPanel
                        eventId={event.id}
                        initialCriteria={event.hackathon_criteria as any}
                        initialShowCriteria={event.show_evaluation_criteria ?? true}
                        initialShowScoreboard={event.show_scoreboard ?? false}
                        initialSubmissionsEnabled={event.submissions_enabled ?? true}
                        initialSubmissionConfig={event.submission_config as any}
                        cardClass="border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 bg-zinc-50/50 dark:bg-zinc-900/30"
                        cardStyle={{}}
                      />
                    </div>
                  )}
                 <div className="w-full flex flex-col gap-1">
                   <label className="text-xs font-mono text-[#555555] uppercase tracking-widest">Detailed Pitch / Description *</label>
                   <textarea name="description" rows={6} value={description} onChange={e => setDescription(e.target.value)} required className="rounded-xl border border-[#d0d0d0] bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-black outline-none resize-none" />
                 </div>
             </section>


             <section className="pt-8 border-t border-zinc-100">
                <FeedbackFormBuilder 
                  questions={questions} 
                  onChange={setQuestions} 
                />
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
                   excludingEventId={event.id}
                 />
                 <input type="hidden" name="venueId" value={selectedVenueId || ''} />
                 <input type="hidden" name="location" value={location || ''} />

                  <div className="grid grid-cols-2 gap-4">
                     <Input label="Attendee Capacity" name="capacity" type="number" defaultValue={event.max_capacity || 0} />
                     <Input label="Waitlist Max Capacity" name="waitlistMax" type="number" defaultValue={event.waitlist_max || 0} />
                  </div>
              </section>

              <section className="space-y-6">
                 <h2 className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 border-b border-zinc-100 pb-2">Visual Branding</h2>
                 <EventBackgroundCustomizer initialValue={event.custom_background} />
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
                           eventId={event.id}
                           initialTitle={title}
                           initialClubName={clubName}
                           initialDescription={description}
                           initialLocation={location}
                           initialDate={eventDate}
                           onApply={setBannerUrl}
                         />
                       </div>
                     </div>
                  </div>
              </section>
          </div>

          <aside className="space-y-8">
             <div className="bg-white border border-black rounded-3xl p-6 shadow-xl space-y-6 sticky top-8">
                <h3 className="font-bold text-lg">Filters & Eligibility</h3>
                <div className="space-y-4">
                   <div>
                      <p className="text-[10px] font-mono uppercase text-zinc-400 mb-2">Semesters</p>
                      <div className="flex flex-wrap gap-2">
                         {[1,2,3,4,5,6,7,8].map(s => (
                           <button type="button" key={s} onClick={() => toggleSem(s)} className={`w-8 h-8 rounded-full border text-[10px] font-mono transition-all ${semesters.includes(s) ? 'bg-black text-white border-black' : 'border-zinc-200 hover:border-black'}`}>{s}</button>
                         ))}
                      </div>
                   </div>
                   <div>
                      <p className="text-[10px] font-mono uppercase text-zinc-400 mb-2">Years</p>
                      <div className="flex flex-wrap gap-2">
                         {[1,2,3,4].map(y => (
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
                
                <div className="pt-6 border-t border-zinc-100 flex flex-col gap-3">
                   {error && <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-[10px] font-mono">{error}</div>}
                   
                   <button 
                    type="button" 
                    onClick={(e) => {
                      const form = e.currentTarget.closest('form');
                      if(form) handleAction(form, true);
                    }}
                    disabled={loading}
                    className="w-full bg-black text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                  >
                    <Send size={18} />
                    {loading ? 'Processing...' : 'Submit Revision'}
                  </button>
                  <button 
                    type="button" 
                    onClick={(e) => {
                      const form = e.currentTarget.closest('form');
                      if(form) handleAction(form, false);
                    }}
                    disabled={loading}
                    className="w-full bg-white border border-zinc-200 text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-50 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Save size={18} />
                    {loading ? 'Saving...' : 'Save Draft Changes'}
                  </button>
                </div>
             </div>
          </aside>
        </div>
      </form>
    </div>
  )
}
