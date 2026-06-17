'use client'

import React, { useState, useEffect } from 'react'
import { assignJudge, removeJudge, getAssignedJudges, getAvailableTeachers } from '@/lib/actions/hackathon-eval-actions'
import { UserPlus, X, Gavel, Search, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'

type TeacherProfile = { id: string; full_name: string; usn: string; department: string }
type AssignedJudge = { id: string; judge_id: string; judge: TeacherProfile }

export function JudgeAssignmentPanel({ eventId }: { eventId: string }) {
  const [assigned, setAssigned] = useState<AssignedJudge[]>([])
  const [available, setAvailable] = useState<TeacherProfile[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPicker, setShowPicker] = useState(false)
  const [assigningId, setAssigningId] = useState<string | null>(null)

  const fetchData = async () => {
    const [assignedRes, availableRes] = await Promise.all([
      getAssignedJudges(eventId),
      getAvailableTeachers()
    ])
    if (assignedRes.data) setAssigned(assignedRes.data as unknown as AssignedJudge[])
    if (availableRes.data) setAvailable(availableRes.data as TeacherProfile[])
  }

  useEffect(() => {
    fetchData()
  }, [eventId])

  const handleAssign = async (teacherId: string) => {
    setAssigningId(teacherId)
    setError(null)
    setSuccess(null)
    const res = await assignJudge(eventId, teacherId)
    setAssigningId(null)
    if (res.error) {
      setError(res.error)
    } else {
      setSuccess('Judge assigned successfully')
      setShowPicker(false)
      setSearch('')
    }
    await fetchData()
    setTimeout(() => { setSuccess(null); setError(null) }, 4000)
  }

  const handleRemove = async (judgeId: string) => {
    setLoading(true)
    setError(null)
    const res = await removeJudge(eventId, judgeId)
    if (res.error) setError(res.error)
    await fetchData()
    setLoading(false)
  }

  const filteredAvailable = available.filter(teacher => {
    const alreadyAssigned = assigned.some(a => a.judge_id === teacher.id)
    const matchesSearch = teacher.full_name.toLowerCase().includes(search.toLowerCase())
    return !alreadyAssigned && matchesSearch
  })

  return (
    <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 text-white rounded-[2.5rem] p-8 shadow-2xl space-y-6 border border-zinc-800">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-2.5 rounded-xl">
            <Gavel size={18} className="text-white" />
          </div>
          <div>
            <h3 className="font-black uppercase text-sm tracking-tighter">Judge Assignment</h3>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Select teachers as judges</p>
          </div>
        </div>
        <div className="bg-zinc-800 px-3 py-1 rounded-full border border-zinc-700">
          <span className="font-mono text-[10px] text-zinc-400">{assigned.length} Judges</span>
        </div>
      </div>

      {/* Currently Assigned */}
      {assigned.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Assigned Judges</p>
          {assigned.map(a => {
            const profile = a.judge as unknown as TeacherProfile
            return (
              <div key={a.id} className="flex items-center justify-between bg-zinc-800/50 p-4 rounded-2xl border border-zinc-700/50 group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-xs font-black">
                    {profile?.full_name?.charAt(0) || 'J'}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{profile?.full_name || 'Unknown'}</p>
                    <p className="font-mono text-[10px] text-zinc-500">{profile?.department}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(a.judge_id)}
                  disabled={loading}
                  className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 transition-all disabled:opacity-50"
                  title="Remove judge"
                >
                  <X size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Button */}
      {!showPicker && (
        <button
          onClick={() => setShowPicker(true)}
          className="w-full py-4 border-2 border-dashed border-zinc-700 rounded-2xl flex items-center justify-center gap-3 text-zinc-500 hover:text-white hover:border-zinc-500 transition-all text-sm font-bold uppercase tracking-wider"
        >
          <UserPlus size={16} />
          Assign Hackathon Judge
        </button>
      )}

      {/* Picker */}
      {showPicker && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 bg-zinc-800 p-3 rounded-xl border border-zinc-700">
            <Search size={14} className="text-zinc-500" />
            <input
              type="text"
              placeholder="Search teachers..."
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
            {filteredAvailable.length > 0 ? filteredAvailable.map(teacher => (
              <button
                key={teacher.id}
                onClick={() => handleAssign(teacher.id)}
                disabled={assigningId === teacher.id}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-800 transition-colors text-left disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                  {teacher.full_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{teacher.full_name}</p>
                  <p className="text-[10px] font-mono text-zinc-500">{teacher.department}</p>
                </div>
                {assigningId === teacher.id && <Loader2 size={12} className="animate-spin text-white" />}
              </button>
            )) : (
              <p className="text-center text-zinc-600 text-xs font-mono py-6 italic">No available teachers found</p>
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
