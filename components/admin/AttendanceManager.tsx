'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { manualCheckIn } from '@/lib/actions/admin'
import { CheckCircle } from 'lucide-react'
import { RegistrationExportMenu } from '@/components/manager/RegistrationExportMenu'

export function AttendanceManager({ event, initialRegistrations }: { event: { id: string; title: string }; initialRegistrations: { id: string; checked_in: boolean; checked_in_at: string | null; profiles: { full_name: string; usn: string; department: string; semester: number | string } | null }[] }) {
  const [activeTab, setActiveTab] = useState<'registered'|'attended'>('registered')
  const [usnInput, setUsnInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null)

  const studentIds = (initialRegistrations || []).map((r: { id: string }) => r.id) // Assuming student_id refers to registration.id
  const attended = initialRegistrations.filter((r: { checked_in: boolean }) => r.checked_in)
  const displayList = activeTab === 'registered' ? initialRegistrations : attended

  async function handleManualEntry(e: React.FormEvent) {
    e.preventDefault()
    if (!usnInput.trim()) return
    setIsSubmitting(true)
    setMessage(null)

    const res = await manualCheckIn(usnInput.trim(), event.id)
    if (res.error) setMessage({ type: 'error', text: res.error })
    else setMessage({ type: 'success', text: res.message || 'Checked in successfully.' })
    
    setUsnInput('')
    setIsSubmitting(false)
    setTimeout(() => setMessage(null), 5000)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-2 p-1 bg-[#f5f5f5] rounded-lg">
          <button 
            onClick={() => setActiveTab('registered')}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${activeTab === 'registered' ? 'bg-white shadow-sm text-[#0a0a0a]' : 'text-[#555555] hover:text-[#0a0a0a]'}`}
          >
            Registered ({initialRegistrations.length})
          </button>
          <button 
            onClick={() => setActiveTab('attended')}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${activeTab === 'attended' ? 'bg-white shadow-sm text-[#0a0a0a]' : 'text-[#555555] hover:text-[#0a0a0a]'}`}
          >
            Attendance ({attended.length})
          </button>
        </div>

        <RegistrationExportMenu registrations={displayList} eventTitle={event.title} />
      </div>

      {activeTab === 'attended' && (
        <Card className="p-6 bg-white border border-[#e0e0e0]">
          <h3 className="font-bold text-lg mb-4 text-[#0a0a0a] flex items-center gap-2">
            <CheckCircle size={20} className="text-green-600" />
            Manual Override Entry
          </h3>
          <form onSubmit={handleManualEntry} className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label className="text-xs font-mono text-[#555555] uppercase tracking-wider">Student USN</label>
              <input 
                type="text" 
                value={usnInput}
                onChange={e => setUsnInput(e.target.value)}
                placeholder="e.g. 1GD20CS001"
                className="w-full bg-[#fcfcfc] border-[1.5px] border-[#e0e0e0] px-4 py-2.5 rounded-lg focus:outline-none focus:border-[#0a0a0a] font-mono transition-colors uppercase"
              />
            </div>
            <Button type="submit" disabled={isSubmitting || !usnInput.trim()} className="bg-[#0a0a0a] text-white px-8 py-2.5 h-[42px]">
              {isSubmitting ? 'Processing...' : 'Mark as Present'}
            </Button>
          </form>
          {message && (
            <div className={`mt-4 p-3 rounded-md text-sm font-mono ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message.text}
            </div>
          )}
        </Card>
      )}

      <Card className="overflow-hidden border border-[#e0e0e0]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f5f5f5] text-[#555555] text-xs uppercase tracking-wider font-mono">
                <th className="p-4 font-semibold whitespace-nowrap">Student Name</th>
                <th className="p-4 font-semibold">USN</th>
                <th className="p-4 font-semibold">Department</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e0e0]">
              {displayList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#999] font-mono text-sm">No records found.</td>
                </tr>
              ) : (
                displayList.map((reg: { id: string; checked_in: boolean; checked_in_at: string | null; profiles: { full_name: string; usn: string; department: string } | null }) => (
                  <tr key={reg.id} className="hover:bg-[#fcfcfc] transition-colors">
                    <td className="p-4 font-medium text-[#0a0a0a] whitespace-nowrap">{reg.profiles?.full_name}</td>
                    <td className="p-4 font-mono text-sm text-[#555555]">{reg.profiles?.usn}</td>
                    <td className="p-4 text-sm text-[#555555]">{reg.profiles?.department || '-'}</td>
                    <td className="p-4">
                      {reg.checked_in ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-sm bg-[#f0fdf4] text-[#166534] text-xs font-mono uppercase tracking-widest">
                          <CheckCircle size={12} /> Present
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-sm bg-[#f5f5f5] text-[#555] text-xs font-mono uppercase tracking-widest">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-xs text-[#999999] text-right whitespace-nowrap">
                      {reg.checked_in_at ? new Date(reg.checked_in_at).toLocaleTimeString() : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
