'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createEvent } from '@/lib/actions/events'
import Link from 'next/link'

export default function CreateEventPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [semesters, setSemesters] = useState<number[]>([])
  const [years, setYears] = useState<number[]>([])
  const [depts, setDepts] = useState<string[]>([])

  const toggleSem = (s: number) => setSemesters(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  const toggleYear = (y: number) => setYears(prev => prev.includes(y) ? prev.filter(x => x !== y) : [...prev, y])
  const toggleDept = (d: string) => setDepts(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    
    formData.append('semesters', JSON.stringify(semesters))
    formData.append('years', JSON.stringify(years))
    formData.append('departments', JSON.stringify(depts))

    const result = await createEvent(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="w-full flex-1 flex flex-col relative h-full">
      <div className="flex flex-col lg:flex-row gap-12 flex-1 pb-32">
        <div className="flex-[2]">
          <h2 className="font-mono text-xs uppercase tracking-widest text-[#555555] border-b border-[#e0e0e0] pb-2 mb-6">Event Details</h2>
          
          <div className="space-y-6">
            <Input label="Event Title" name="title" required placeholder="Annual Tech Symposium" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Club Name" name="clubName" required placeholder="GDSC" />
              <div className="w-full flex flex-col gap-1">
                <label className="text-xs font-mono text-[#555555] uppercase tracking-widest">Status</label>
                <select name="status" className="rounded-xl border border-[#d0d0d0] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a0a0a]">
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="w-full flex flex-col gap-1">
              <label className="text-xs font-mono text-[#555555] uppercase tracking-widest">Description</label>
              <textarea name="description" rows={4} className="rounded-xl border border-[#d0d0d0] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a0a0a] resize-none"></textarea>
            </div>

            <Input label="Location" name="location" placeholder="Main Auditorium" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Event Date & Time" name="eventDate" type="datetime-local" required />
              <Input label="Registration Deadline" name="deadline" type="datetime-local" />
            </div>

            <Input label="Max Capacity (0 for unlimited)" name="capacity" type="number" min="0" defaultValue="0" />

            <div className="w-full flex flex-col gap-1">
              <label className="text-xs font-mono text-[#555555] uppercase tracking-widest">Banner Upload</label>
              <div className="border-2 border-dashed border-[#d0d0d0] rounded-2xl p-8 text-center bg-[#f9f9f9] flex flex-col items-center justify-center cursor-pointer hover:bg-[#f2f2f2] transition-colors">
                 <span className="font-mono text-xs text-[#999999]">Drop banner here or click to upload</span>
                 <Input className="mt-4" name="bannerUrl" placeholder="https://example.com/banner.jpg" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 lg:max-w-[400px]">
          <div className="sticky top-24 rounded-2xl border border-[#e0e0e0] p-6 bg-white shadow-sm">
            <h2 className="font-mono text-xs uppercase tracking-widest text-[#555555] mb-6">Registration Constraints</h2>
            
            <div className="mb-6">
              <p className="font-mono text-xs text-[#555555] mb-2">Allowed Semesters</p>
              <div className="flex flex-wrap gap-2">
                {[1,2,3,4,5,6,7,8].map(s => (
                  <button key={s} type="button" onClick={() => toggleSem(s)} className={`rounded-full px-3 py-1 text-xs font-mono border transition-colors ${semesters.includes(s) ? 'bg-[#0a0a0a] text-white border-[#0a0a0a]' : 'border-[#e0e0e0] text-[#0a0a0a] hover:bg-[#f5f5f5]'}`}>{s}</button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <p className="font-mono text-xs text-[#555555] mb-2">Allowed Years</p>
              <div className="flex flex-wrap gap-2">
                {[1,2,3,4].map(y => (
                  <button key={y} type="button" onClick={() => toggleYear(y)} className={`rounded-full px-3 py-1 text-xs font-mono border transition-colors ${years.includes(y) ? 'bg-[#0a0a0a] text-white border-[#0a0a0a]' : 'border-[#e0e0e0] text-[#0a0a0a] hover:bg-[#f5f5f5]'}`}>{y}</button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <p className="font-mono text-xs text-[#555555] mb-2">Allowed Departments</p>
              <div className="flex flex-wrap gap-2">
                {['CSE','ECE','ME','CV','ISE','EEE'].map(d => (
                  <button key={d} type="button" onClick={() => toggleDept(d)} className={`rounded-full px-3 py-1 text-xs font-mono border transition-colors ${depts.includes(d) ? 'bg-[#0a0a0a] text-white border-[#0a0a0a]' : 'border-[#e0e0e0] text-[#0a0a0a] hover:bg-[#f5f5f5]'}`}>{d}</button>
                ))}
              </div>
            </div>

            <p className="text-xs font-mono text-[#999999] italic mt-4">Leave none selected = open to all</p>

            {error && <p className="text-sm text-[#0a0a0a] italic mt-6">{error}</p>}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-[#e0e0e0] px-8 py-4 z-40">
        <div className="max-w-[1280px] mx-auto flex justify-between items-center">
          <Link href="/manager/dashboard" className="border-[1.5px] border-[#0a0a0a] text-black bg-transparent rounded-full px-6 py-2.5 text-sm font-semibold hover:bg-[#f2f2f2]">
            Cancel
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Event →'}
          </Button>
        </div>
      </div>
    </form>
  )
}
