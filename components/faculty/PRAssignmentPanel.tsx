'use client'

import React, { useState, useEffect } from 'react'
import { assignPRToEvent, removePRFromEvent, getAssignedPRs, getAvailablePRs } from '@/lib/actions/faculty-actions'
import { UserPlus, X, Shield, Search, AlertTriangle, CheckCircle } from 'lucide-react'

type PRProfile = { id: string; full_name: string; usn: string; department: string }
type AssignedPR = { id: string; pr_id: string; assigned_at: string; profiles: PRProfile }

export function PRAssignmentPanel({ eventId }: { eventId: string }) {
  const [assigned, setAssigned] = useState<AssignedPR[]>([])
  const [available, setAvailable] = useState<PRProfile[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPicker, setShowPicker] = useState(false)

  const fetchData = async () => {
    const [assignedRes, availableRes] = await Promise.all([
      getAssignedPRs(eventId),
      getAvailablePRs()
    ])
    if (assignedRes.data) setAssigned(assignedRes.data as unknown as AssignedPR[])
    if (availableRes.data) setAvailable(availableRes.data as PRProfile[])
  }

  useEffect(() => { fetchData() }, [eventId])

  const handleAssign = async (prId: string) => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    const res = await assignPRToEvent(eventId, prId)
    if (res.error) {
      setError(res.error)
    } else {
      setSuccess('PR Officer assigned successfully')
      setShowPicker(false)
      setSearch('')
    }
    await fetchData()
    setLoading(false)
    setTimeout(() => { setSuccess(null); setError(null) }, 4000)
  }

  const handleRemove = async (prId: string) => {
    setLoading(true)
    setError(null)
    const res = await removePRFromEvent(eventId, prId)
    if (res.error) setError(res.error)
    await fetchData()
    setLoading(false)
  }

  const filteredAvailable = available.filter(pr => {
    const alreadyAssigned = assigned.some(a => a.pr_id === pr.id)
    const matchesSearch = pr.full_name.toLowerCase().includes(search.toLowerCase()) ||
                          pr.usn.toLowerCase().includes(search.toLowerCase())
    return !alreadyAssigned && matchesSearch
  })

  return (
    <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 text-white rounded-[2.5rem] p-8 shadow-2xl space-y-6 border border-zinc-800">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-2.5 rounded-xl">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <h3 className="font-black uppercase text-sm tracking-tighter">PR Assignment</h3>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Max 2 officers per event</p>
          </div>
        </div>
        <div className="bg-zinc-800 px-3 py-1 rounded-full border border-zinc-700">
          <span className="font-mono text-[10px] text-zinc-400">{assigned.length}/2 Slots</span>
        </div>
      </div>

      {/* Currently Assigned */}
      {assigned.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Assigned Officers</p>
          {assigned.map(a => {
            const profile = a.profiles as unknown as PRProfile
            return (
              <div key={a.id} className="flex items-center justify-between bg-zinc-800/50 p-4 rounded-2xl border border-zinc-700/50 group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-xs font-black">
                    {profile?.full_name?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{profile?.full_name || 'Unknown'}</p>
                    <p className="font-mono text-[10px] text-zinc-500">{profile?.usn} • {profile?.department}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(a.pr_id)}
                  disabled={loading}
                  className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 transition-all disabled:opacity-50"
                  title="Remove assignment"
                >
                  <X size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Button */}
      {assigned.length < 2 && !showPicker && (
        <button
          onClick={() => setShowPicker(true)}
          className="w-full py-4 border-2 border-dashed border-zinc-700 rounded-2xl flex items-center justify-center gap-3 text-zinc-500 hover:text-white hover:border-zinc-500 transition-all text-sm font-bold uppercase tracking-wider"
        >
          <UserPlus size={16} />
          Assign PR Officer
        </button>
      )}

      {/* Picker */}
      {showPicker && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 bg-zinc-800 p-3 rounded-xl border border-zinc-700">
            <Search size={14} className="text-zinc-500" />
            <input
              type="text"
              placeholder="Search by name or USN..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm font-mono text-white placeholder:text-zinc-600 w-full"
              autoFocus
            />
            <button onClick={() => { setShowPicker(false); setSearch('') }} className="text-zinc-600 hover:text-white">
              <X size={14} />
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
            {filteredAvailable.length > 0 ? filteredAvailable.map(pr => (
              <button
                key={pr.id}
                onClick={() => handleAssign(pr.id)}
                disabled={loading}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-800 transition-colors text-left disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                  {pr.full_name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold">{pr.full_name}</p>
                  <p className="text-[10px] font-mono text-zinc-500">{pr.usn} • {pr.department}</p>
                </div>
              </button>
            )) : (
              <p className="text-center text-zinc-600 text-xs font-mono py-6 italic">No available PR officers found</p>
            )}
          </div>
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
          <AlertTriangle size={14} className="text-rose-400 shrink-0" />
          <p className="text-xs text-rose-300 font-mono">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
          <CheckCircle size={14} className="text-emerald-400 shrink-0" />
          <p className="text-xs text-emerald-300 font-mono">{success}</p>
        </div>
      )}
    </div>
  )
}
