'use client'

import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { updateEvent } from '@/lib/actions/events'
import Link from 'next/link'
import type { Event, EventConstraint } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { EventBackgroundCustomizer } from '@/components/shared/EventBackgroundCustomizer'
import PosterDesigner from '@/components/shared/PosterDesigner'
import { ImagePreview } from '@/components/shared/ImagePreview'

export function EditEventForm({ event, constraints }: { event: Event, constraints: EventConstraint | null }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [semesters, setSemesters] = useState<number[]>(constraints?.allowed_semesters || [])
  const [years, setYears] = useState<number[]>(constraints?.allowed_years || [])
  const [depts, setDepts] = useState<string[]>(constraints?.allowed_departments || [])
  const [teachers, setTeachers] = useState<{ id: string; full_name: string }[]>([])

  // Formatting date strings to datetime-local values (YYYY-MM-DDThh:mm)
  const formatForInput = (isoStr: string | null) => {
    if (!isoStr) return ''
    return new Date(isoStr).toISOString().slice(0, 16)
  }

  // Poster Lab specific states
  const [title, setTitle] = useState(event.title || '')
  const [clubName, setClubName] = useState(event.club_name || '')
  const [description, setDescription] = useState(event.description || '')
  const [location, setLocation] = useState(event.location || '')
  const [bannerUrl, setBannerUrl] = useState(event.banner_url || '')
  const [eventDate, setEventDate] = useState(formatForInput(event.event_date))

  const [eventType, setEventType] = useState(event.event_type || 'general')
  const [teamFormationEnabled, setTeamFormationEnabled] = useState(event.team_formation_enabled || false)
  const [minTeamMembers, setMinTeamMembers] = useState(event.min_team_members || 2)
  const [maxTeamMembers, setMaxTeamMembers] = useState(event.max_team_members || 4)

  useEffect(() => {
    async function loadTeachers() {
      const supabase = createClient()
      const { data } = await supabase.from('profiles').select('id, full_name').eq('role', 'teacher').order('full_name')
      if (data) setTeachers(data)
    }
    loadTeachers()
  }, [])

  const toggleSem = (s: number) => setSemesters(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  const toggleYear = (y: number) => setYears(prev => prev.includes(y) ? prev.filter(x => x !== y) : [...prev, y])
  const toggleDept = (d: string) => setDepts(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    
    formData.append('semesters', JSON.stringify(semesters))
    formData.append('years', JSON.stringify(years))
    formData.append('departments', JSON.stringify(depts))

    const result = await updateEvent(event.id, formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  // formatForInput helper moved above states

  return (
    <form action={handleSubmit} className="w-full flex-1 flex flex-col relative h-full">
      <div className="flex flex-col lg:flex-row gap-12 flex-1 pb-32">
        <div className="flex-[2]">
          <h2 className="font-mono text-xs uppercase tracking-widest text-[#555555] border-b border-[#e0e0e0] pb-2 mb-6">Edit Current Details</h2>
          
          <div className="space-y-6">
            <Input label="Event Title" name="title" required value={title} onChange={e => setTitle(e.target.value)} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Club / Host Identity" name="clubName" required value={clubName} onChange={e => setClubName(e.target.value)} />
              <div className="w-full flex flex-col gap-1">
                <label className="text-xs font-mono text-[#555555] uppercase tracking-widest">Visibility & Status</label>
                <select name="status" defaultValue={event.status} className="rounded-xl border border-[#d0d0d0] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a0a0a]">
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="w-full flex flex-col gap-1">
              <label className="text-xs font-mono text-[#555555] uppercase tracking-widest">Description</label>
              <textarea name="description" rows={4} value={description} onChange={e => setDescription(e.target.value)} className="rounded-xl border border-[#d0d0d0] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a0a0a] resize-none"></textarea>
            </div>

            <Input label="Physical Location" name="location" value={location} onChange={e => setLocation(e.target.value)} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Event Date & Time" name="eventDate" type="datetime-local" required value={eventDate} onChange={e => setEventDate(e.target.value)} />
              <Input label="Registration Hard Deadline" name="deadline" type="datetime-local" defaultValue={formatForInput(event.registration_deadline)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Attendee Capacity Maximum (0/blank for infinite)" name="capacity" type="number" min="0" defaultValue={event.max_capacity?.toString() || "0"} />
              <Input label="Waitlist Max Capacity (0 for no waitlist)" name="waitlistMax" type="number" min="0" defaultValue={event.waitlist_max?.toString() || "0"} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="w-full flex flex-col gap-1">
                <label className="text-xs font-mono text-[#555555] uppercase tracking-widest">Event Category</label>
                <select name="eventCategory" defaultValue={event.event_category || 'standard'} className="rounded-xl border border-[#d0d0d0] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a0a0a]">
                  <option value="standard">Standard</option>
                  <option value="guest_lecture">Guest Lecture</option>
                  <option value="alumni_talk">Alumni Talk</option>
                  <option value="industrial_visit">Industrial Visit</option>
                </select>
              </div>

              <div className="w-full flex flex-col gap-1">
                <label className="text-xs font-mono text-[#555555] uppercase tracking-widest">Assigned Faculty Advisor (Validator)</label>
                <select name="assignedFacultyId" defaultValue={event.assigned_faculty_id || ''} className="rounded-xl border border-[#d0d0d0] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a0a0a]">
                  <option value="">-- None --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.full_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="w-full flex flex-col gap-1">
                <label className="text-xs font-mono text-[#555555] uppercase tracking-widest">Event Type</label>
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

            <div className="border border-[#e0e0e0] rounded-2xl p-6 bg-zinc-50/50 dark:bg-zinc-900/30 space-y-4">
              <div className="flex items-center gap-3">
                <input
                  id="isCompulsory"
                  name="isCompulsory"
                  type="checkbox"
                  value="true"
                  defaultChecked={event.is_compulsory}
                  className="w-4 h-4 rounded border-zinc-300 text-black focus:ring-black"
                />
                <label htmlFor="isCompulsory" className="text-sm font-semibold text-black dark:text-zinc-200 select-none">
                  Compulsory Selective Event (Forcefully auto-register targeted students)
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="allowOpenRegistration"
                  name="allowOpenRegistration"
                  type="checkbox"
                  value="true"
                  defaultChecked={event.allow_open_registration}
                  className="w-4 h-4 rounded border-zinc-300 text-black focus:ring-black"
                />
                <label htmlFor="allowOpenRegistration" className="text-sm font-semibold text-black dark:text-zinc-200 select-none">
                  Allow Open Registrations alongside Compulsory Attendance
                </label>
              </div>
            </div>

             <div className="w-full flex flex-col gap-6 pt-4 border-t border-[#e0e0e0]">
               <EventBackgroundCustomizer initialValue={event.custom_background} />
               <div className="flex justify-between items-end gap-4 w-full">
                 <div className="flex-1">
                   <Input 
                     label="Poster / Banner Image URL (e.g. .png, .jpg, .jpeg)" 
                     name="bannerUrl" 
                     placeholder="https://example.com/poster.jpg"
                     value={bannerUrl} 
                     onChange={e => setBannerUrl(e.target.value)}
                   />
                   <ImagePreview url={bannerUrl} />
                 </div>
                 <div>
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
          </div>
        </div>

        <div className="flex-1 lg:max-w-[400px]">
          <div className="sticky top-24 rounded-2xl border border-[#e0e0e0] p-6 bg-white shadow-sm">
            <h2 className="font-mono text-xs uppercase tracking-widest text-[#555555] mb-6">Target Requirements</h2>
            
            <div className="mb-6">
              <p className="font-mono text-xs text-[#555555] mb-2">Permitted Semesters</p>
              <div className="flex flex-wrap gap-2">
                {[1,2,3,4,5,6,7,8].map(s => (
                  <button key={s} type="button" onClick={() => toggleSem(s)} className={`rounded-full px-3 py-1 text-xs font-mono border transition-colors ${semesters.includes(s) ? 'bg-[#0a0a0a] text-white border-[#0a0a0a]' : 'border-[#e0e0e0] text-[#0a0a0a] hover:bg-[#f5f5f5]'}`}>{s}</button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <p className="font-mono text-xs text-[#555555] mb-2">Permitted Years</p>
              <div className="flex flex-wrap gap-2">
                {[1,2,3,4].map(y => (
                  <button key={y} type="button" onClick={() => toggleYear(y)} className={`rounded-full px-3 py-1 text-xs font-mono border transition-colors ${years.includes(y) ? 'bg-[#0a0a0a] text-white border-[#0a0a0a]' : 'border-[#e0e0e0] text-[#0a0a0a] hover:bg-[#f5f5f5]'}`}>{y}</button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <p className="font-mono text-xs text-[#555555] mb-2">Permitted Departments</p>
              <div className="flex flex-wrap gap-2">
                {['CSE','ECE','ME','CV','ISE','EEE'].map(d => (
                  <button key={d} type="button" onClick={() => toggleDept(d)} className={`rounded-full px-3 py-1 text-xs font-mono border transition-colors ${depts.includes(d) ? 'bg-[#0a0a0a] text-white border-[#0a0a0a]' : 'border-[#e0e0e0] text-[#0a0a0a] hover:bg-[#f5f5f5]'}`}>{d}</button>
                ))}
              </div>
            </div>

            <p className="text-xs font-mono text-[#999999] italic mt-4">Tip: Leaving attributes completely empty allows entire platform accessibility unconditionally.</p>

            {error && <p className="text-sm text-[#eb4b4b] font-mono mt-6 p-3 bg-red-50 border border-red-200 rounded-lg">{error}</p>}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-[#e0e0e0] px-8 py-4 z-40">
        <div className="max-w-[1280px] mx-auto flex justify-between items-center">
          <Link href={`/manager/events/${event.id}`} className="border-[1.5px] border-[#0a0a0a] text-[#0a0a0a] bg-transparent rounded-full px-6 py-2.5 text-sm font-semibold hover:bg-[#f2f2f2]">
            Cancel Changes
          </Link>
          <Button type="submit" disabled={loading} className="bg-[#0a0a0a]">
            {loading ? 'Committing...' : 'Apply Modifications →'}
          </Button>
        </div>
      </div>
    </form>
  )
}
