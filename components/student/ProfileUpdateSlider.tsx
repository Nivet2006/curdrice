'use client'

import React, { useState, useEffect } from 'react'
import {
  X, Send, CheckCircle, Clock, XCircle, AlertTriangle, Loader2, SlidersHorizontal, ArrowRight
} from 'lucide-react'
import { submitProfileUpdateRequest, getStudentUpdateRequests } from '@/lib/actions/profile-requests'
import type { ProfileUpdateRequest } from '@/lib/types'

interface ProfileUpdateSliderProps {
  currentProfile: {
    full_name: string
    usn: string
    department: string
    semester: number
    year: number
  }
}

const DEPARTMENTS = ['CSE', 'ECE', 'ME', 'CV', 'ISE', 'EEE']
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8]
const YEARS = [1, 2, 3, 4]

const FIELD_LABELS: Record<string, string> = {
  full_name: 'Full Name',
  usn: 'USN',
  department: 'Department',
  semester: 'Semester',
  year: 'Year',
}

export function ProfileUpdateSlider({ currentProfile }: ProfileUpdateSliderProps) {
  const [open, setOpen] = useState(false)
  const [selectedField, setSelectedField] = useState<string | null>(null)
  const [newValue, setNewValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [requests, setRequests] = useState<ProfileUpdateRequest[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function fetchRequests() {
    setLoading(true)
    const res = await getStudentUpdateRequests()
    if (res.data) setRequests(res.data as ProfileUpdateRequest[])
    setLoading(false)
  }

  useEffect(() => {
    if (open) fetchRequests()
  }, [open])

  function openField(field: string) {
    setSelectedField(field)
    // Pre-fill with current value
    const current = (currentProfile as any)[field]
    setNewValue(String(current ?? ''))
    setError(null)
    setSuccess(false)
  }

  async function handleSubmit() {
    if (!selectedField || !newValue.trim()) return
    setSubmitting(true)
    setError(null)

    const res = await submitProfileUpdateRequest(selectedField, newValue.trim())
    setSubmitting(false)

    if (res.error) {
      setError(res.error)
    } else {
      setSuccess(true)
      setSelectedField(null)
      setNewValue('')
      await fetchRequests()
      setTimeout(() => setSuccess(false), 4000)
    }
  }

  function getStatusIcon(status: string) {
    if (status === 'approved') return <CheckCircle size={13} className="text-green-500" />
    if (status === 'rejected') return <XCircle size={13} className="text-red-500" />
    return <Clock size={13} className="text-amber-500" />
  }

  function getStatusLabel(status: string) {
    if (status === 'approved') return 'Approved'
    if (status === 'rejected') return 'Rejected'
    return 'Pending'
  }

  const fields = [
    { key: 'full_name', label: 'Full Name', current: currentProfile.full_name, type: 'text' },
    { key: 'usn', label: 'USN', current: currentProfile.usn, type: 'text' },
    { key: 'department', label: 'Department', current: currentProfile.department, type: 'select' },
    { key: 'semester', label: 'Semester', current: `S${currentProfile.semester}`, type: 'select' },
    { key: 'year', label: 'Year', current: `Y${currentProfile.year}`, type: 'select' },
  ]

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-2xl text-xs font-mono font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors shadow-lg"
      >
        <SlidersHorizontal size={14} />
        Request Profile Update
      </button>

      {/* Slider Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setOpen(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Panel */}
          <div
            className="relative w-full max-w-md bg-white dark:bg-zinc-900 h-full overflow-y-auto shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
            style={{ animation: 'slideInRight 0.25s ease-out' }}
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900 z-10">
              <div>
                <h2 className="font-black text-xl uppercase tracking-tight text-zinc-900 dark:text-white">Profile Update</h2>
                <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 mt-0.5">
                  Changes require HOD approval
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <X size={18} className="text-zinc-400" />
              </button>
            </div>

            {/* Info Banner */}
            <div className="mx-6 mt-5 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-2">
              <AlertTriangle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs font-mono text-amber-700 dark:text-amber-400 leading-relaxed">
                Update requests are reviewed by your HOD before being applied. You will be notified of the decision.
              </p>
            </div>

            {/* Success */}
            {success && (
              <div className="mx-6 mt-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
                <CheckCircle size={14} className="text-green-500" />
                <p className="text-xs font-mono text-green-700">Request submitted! Awaiting HOD review.</p>
              </div>
            )}

            {/* Field List */}
            <div className="px-6 py-5 space-y-3 flex-1">
              <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 font-bold mb-2">Select a field to update</p>

              {fields.map(field => {
                const pendingRequest = requests.find(r => r.field === field.key && r.status === 'pending')

                return (
                  <button
                    key={field.key}
                    onClick={() => !pendingRequest && openField(field.key)}
                    disabled={!!pendingRequest}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
                      pendingRequest
                        ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 cursor-not-allowed opacity-70'
                        : selectedField === field.key
                          ? 'bg-black dark:bg-white border-black dark:border-white text-white dark:text-black'
                          : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-black dark:hover:border-white'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <p className={`font-mono text-[10px] uppercase tracking-widest font-bold ${
                        selectedField === field.key ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-400'
                      }`}>{field.label}</p>
                      <p className={`text-sm font-bold ${
                        selectedField === field.key ? 'text-white dark:text-black' : 'text-zinc-800 dark:text-zinc-200'
                      }`}>{field.current}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {pendingRequest ? (
                        <span className="px-2 py-1 text-[9px] font-mono uppercase tracking-wider bg-amber-500/10 text-amber-600 rounded-full font-bold flex items-center gap-1">
                          <Clock size={10} /> Pending
                        </span>
                      ) : (
                        <ArrowRight size={14} className={selectedField === field.key ? 'text-white dark:text-black' : 'text-zinc-300'} />
                      )}
                    </div>
                  </button>
                )
              })}

              {/* Edit Form (when field is selected) */}
              {selectedField && (
                <div className="mt-4 p-4 border border-zinc-200 dark:border-zinc-700 rounded-2xl bg-zinc-50 dark:bg-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
                      New {FIELD_LABELS[selectedField]}
                    </p>
                    <button onClick={() => setSelectedField(null)} className="text-zinc-400 hover:text-zinc-600">
                      <X size={13} />
                    </button>
                  </div>

                  {selectedField === 'full_name' && (
                    <input
                      type="text"
                      value={newValue}
                      onChange={e => setNewValue(e.target.value)}
                      placeholder="Enter new name"
                      className="w-full border border-zinc-200 dark:border-zinc-600 rounded-xl px-4 py-2.5 text-sm font-mono bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    />
                  )}

                  {selectedField === 'usn' && (
                    <input
                      type="text"
                      value={newValue}
                      onChange={e => setNewValue(e.target.value.toUpperCase())}
                      placeholder="Enter new USN"
                      className="w-full border border-zinc-200 dark:border-zinc-600 rounded-xl px-4 py-2.5 text-sm font-mono bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    />
                  )}

                  {selectedField === 'department' && (
                    <select
                      value={newValue}
                      onChange={e => setNewValue(e.target.value)}
                      className="w-full border border-zinc-200 dark:border-zinc-600 rounded-xl px-4 py-2.5 text-sm font-mono bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    >
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  )}

                  {selectedField === 'semester' && (
                    <select
                      value={newValue}
                      onChange={e => setNewValue(e.target.value)}
                      className="w-full border border-zinc-200 dark:border-zinc-600 rounded-xl px-4 py-2.5 text-sm font-mono bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    >
                      {SEMESTERS.map(s => <option key={s} value={String(s)}>Semester {s}</option>)}
                    </select>
                  )}

                  {selectedField === 'year' && (
                    <select
                      value={newValue}
                      onChange={e => setNewValue(e.target.value)}
                      className="w-full border border-zinc-200 dark:border-zinc-600 rounded-xl px-4 py-2.5 text-sm font-mono bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    >
                      {YEARS.map(y => <option key={y} value={String(y)}>Year {y}</option>)}
                    </select>
                  )}

                  {error && (
                    <p className="text-xs font-mono text-red-500">{error}</p>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !newValue.trim() || newValue === String((currentProfile as any)[selectedField])}
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl text-xs font-mono font-bold uppercase tracking-widest hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    Submit Request
                  </button>
                </div>
              )}

              {/* Request History */}
              {requests.length > 0 && (
                <div className="mt-6 space-y-3">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Request History</p>
                  {requests.map(req => (
                    <div key={req.id} className="p-3 border border-zinc-100 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase">
                          {FIELD_LABELS[req.field] || req.field}
                        </span>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(req.status)}
                          <span className={`text-[10px] font-mono uppercase tracking-wider font-bold ${
                            req.status === 'approved' ? 'text-green-600' :
                            req.status === 'rejected' ? 'text-red-500' : 'text-amber-500'
                          }`}>
                            {getStatusLabel(req.status)}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs font-mono text-zinc-500">
                        <span className="line-through">{req.current_value}</span>
                        <ArrowRight size={10} className="inline mx-1" />
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">{req.new_value}</span>
                      </p>
                      {req.feedback && (
                        <p className="text-[11px] text-zinc-400 italic mt-1">Feedback: {req.feedback}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  )
}
