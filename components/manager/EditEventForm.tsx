'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { updateEvent } from '@/lib/actions/events'
import Link from 'next/link'
import type { Event, EventConstraint } from '@/lib/types'

export function EditEventForm({ event, constraints }: { event: Event, constraints: EventConstraint | null }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [semesters, setSemesters] = useState<number[]>(constraints?.allowed_semesters || [])
  const [years, setYears] = useState<number[]>(constraints?.allowed_years || [])
  const [depts, setDepts] = useState<string[]>(constraints?.allowed_departments || [])

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

  // Formatting date strings to datetime-local values (YYYY-MM-DDThh:mm)
  const formatForInput = (isoStr: string | null) => {
    if (!isoStr) return ''
    return new Date(isoStr).toISOString().slice(0, 16)
  }

  return (
    <form action={handleSubmit} className="w-full flex-1 flex flex-col relative h-full">
      <div className="flex flex-col lg:flex-row gap-12 flex-1 pb-32">
        <div className="flex-[2]">
          <h2 className="font-mono text-xs uppercase tracking-widest text-[#555555] border-b border-[#e0e0e0] pb-2 mb-6">Edit Current Details</h2>
          
          <div className="space-y-6">
            <Input label="Event Title" name="title" required defaultValue={event.title} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Club / Host Identity" name="clubName" required defaultValue={event.club_name} />
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
              <textarea name="description" rows={4} defaultValue={event.description || ''} className="rounded-xl border border-[#d0d0d0] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a0a0a] resize-none"></textarea>
            </div>

            <Input label="Physical Location" name="location" defaultValue={event.location || ''} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Event Date & Time" name="eventDate" type="datetime-local" required defaultValue={formatForInput(event.event_date)} />
              <Input label="Registration Hard Deadline" name="deadline" type="datetime-local" defaultValue={formatForInput(event.registration_deadline)} />
            </div>

            <Input label="Attendee Capacity Maximum (0/blank for infinite)" name="capacity" type="number" min="0" defaultValue={event.max_capacity?.toString() || "0"} />

            <Input 
              label="Poster / Banner Image URL (e.g. .png, .jpg, .jpeg)" 
              name="bannerUrl" 
              placeholder="https://example.com/poster.jpg"
              defaultValue={event.banner_url || ''} 
            />
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
