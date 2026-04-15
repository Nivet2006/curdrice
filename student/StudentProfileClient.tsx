'use client'

import React, { useState } from 'react'
import { updateStudentProfile } from '@/lib/actions/events'
import { useRouter } from 'next/navigation'
import { User, Mail, Hash, BookOpen, Shield, Edit2, Lock, CheckCircle } from 'lucide-react'
import type { Profile } from '@/lib/types'

type Props = {
  profile: Profile
  email: string
  totalRegistrations: number
  totalAttended: number
}

export function StudentProfileClient({ profile, email, totalRegistrations, totalAttended }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    full_name: profile.full_name || '',
    username: profile.username || '',
    department: profile.department || 'CSE',
    semester: profile.semester || 1,
    year: profile.year || 1,
  })

  const initials = profile.full_name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  async function handleSave() {
    setSaving(true)
    setError(null)

    const res = await updateStudentProfile({
      ...form,
      semester: Number(form.semester),
      year: Number(form.year),
    })

    if (res.error) {
      setError(res.error)
      setSaving(false)
      return
    }

    setSuccess(true)
    setSaving(false)
    setEditing(false)
    router.refresh()
    setTimeout(() => setSuccess(false), 4000)
  }

  return (
    <div className="w-full max-w-2xl mx-auto pb-20">

      {/* Profile header */}
      <div className="flex items-center gap-5 mb-8">
        <div className="w-16 h-16 rounded-full bg-[#0a0a0a] flex items-center justify-center flex-shrink-0">
          <span className="font-mono font-bold text-white text-xl">{initials}</span>
        </div>
        <div>
          <h1 className="text-2xl font-black text-[#0a0a0a] leading-tight">
            {profile.username ? `@${profile.username}` : profile.full_name}
          </h1>
          <p className="font-mono text-sm text-[#555555]">{email}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Events Registered', value: totalRegistrations },
          { label: 'Events Attended', value: totalAttended },
          { label: 'Semester', value: `S${profile.semester}` },
        ].map(s => (
          <div key={s.label} className="bg-[#f5f5f5] rounded-xl p-4 text-center border border-[#e0e0e0]">
            <p className="text-2xl font-black text-[#0a0a0a]">{s.value}</p>
            <p className="font-mono text-[10px] text-[#999] uppercase tracking-wider mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Profile card */}
      <div className="border border-[#e0e0e0] rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-card)' }}>

        {/* Card header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e0e0e0]">
          <h2 className="font-bold text-[#0a0a0a]">Profile Details</h2>
          {profile.profile_edited ? (
            <div className="flex items-center gap-2 font-mono text-xs text-[#999]">
              <Lock size={13} />
              Locked — contact admin to edit
            </div>
          ) : !editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 font-mono text-xs text-[#555] hover:text-[#0a0a0a] transition-colors border border-[#e0e0e0] rounded-full px-3 py-1.5"
            >
              <Edit2 size={12} />
              Edit once
            </button>
          ) : null}
        </div>

        {/* Fields */}
        <div className="px-6 py-5 flex flex-col gap-5">

          {/* Username */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-[#999] uppercase tracking-wider flex items-center gap-1.5">
              <Hash size={11} /> Username
            </label>
            {editing ? (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-[#999]">@</span>
                <input
                  type="text"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '') }))}
                  placeholder="choose a username"
                  className="w-full border border-[#e0e0e0] rounded-xl pl-7 pr-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0a0a0a]"
                  style={{ background: 'var(--bg)' }}
                />
              </div>
            ) : (
              <p className="font-mono text-sm text-[#0a0a0a]">
                {profile.username ? `@${profile.username}` : <span className="text-[#999]">Not set</span>}
              </p>
            )}
          </div>

          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-[#999] uppercase tracking-wider flex items-center gap-1.5">
              <User size={11} /> Full Name
            </label>
            {editing ? (
              <input
                type="text"
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                className="w-full border border-[#e0e0e0] rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0a0a0a]"
                style={{ background: 'var(--bg)' }}
              />
            ) : (
              <p className="font-mono text-sm text-[#0a0a0a]">{profile.full_name}</p>
            )}
          </div>

          {/* Email — always readonly */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-[#999] uppercase tracking-wider flex items-center gap-1.5">
              <Mail size={11} /> Email
            </label>
            <p className="font-mono text-sm text-[#555]">{email}</p>
          </div>

          {/* USN — always readonly */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-[#999] uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen size={11} /> USN
            </label>
            <p className="font-mono text-sm text-[#0a0a0a]">{profile.usn}</p>
          </div>

          {/* Department + Sem + Year */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-[#999] uppercase tracking-wider">Dept</label>
              {editing ? (
                <select
                  value={form.department}
                  onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                  className="border border-[#e0e0e0] rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0a0a0a]"
                  style={{ background: 'var(--bg)' }}
                >
                  {['CSE','ECE','ME','CV','ISE','EEE'].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              ) : (
                <p className="font-mono text-sm text-[#0a0a0a]">{profile.department}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-[#999] uppercase tracking-wider">Sem</label>
              {editing ? (
                <select
                  value={form.semester}
                  onChange={e => setForm(f => ({ ...f, semester: Number(e.target.value) }))}
                  className="border border-[#e0e0e0] rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0a0a0a]"
                  style={{ background: 'var(--bg)' }}
                >
                  {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <p className="font-mono text-sm text-[#0a0a0a]">S{profile.semester}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-[#999] uppercase tracking-wider">Year</label>
              {editing ? (
                <select
                  value={form.year}
                  onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))}
                  className="border border-[#e0e0e0] rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0a0a0a]"
                  style={{ background: 'var(--bg)' }}
                >
                  {[1,2,3,4].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              ) : (
                <p className="font-mono text-sm text-[#0a0a0a]">Y{profile.year}</p>
              )}
            </div>
          </div>

          {/* Role badge */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-[#999] uppercase tracking-wider flex items-center gap-1.5">
              <Shield size={11} /> Role
            </label>
            <span className="inline-flex w-fit font-mono text-xs uppercase tracking-widest bg-[#f5f5f5] border border-[#e0e0e0] px-3 py-1.5 rounded-md text-[#0a0a0a]">
              {profile.role}
            </span>
          </div>
        </div>

        {/* Save / Cancel bar */}
        {editing && (
          <div className="px-6 py-4 border-t border-[#e0e0e0] flex items-center justify-between gap-3"
            style={{ background: 'var(--bg-subtle)' }}>
            <p className="font-mono text-xs text-[#eb4b4b] flex items-center gap-1.5">
              <Lock size={11} />
              This can only be done once. After saving you cannot edit again.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { setEditing(false); setError(null) }}
                className="px-4 py-2 text-sm font-mono border border-[#e0e0e0] rounded-xl hover:bg-[#f5f5f5] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 text-sm font-mono bg-[#0a0a0a] text-white rounded-xl hover:bg-[#333] transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save permanently'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 px-4 py-3 rounded-xl border border-[#eb4b4b] bg-[#ffeded] font-mono text-sm text-[#eb4b4b]">
          {error}
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="mt-4 px-4 py-3 rounded-xl border border-green-300 bg-green-50 font-mono text-sm text-green-700 flex items-center gap-2">
          <CheckCircle size={15} />
          Profile saved. This cannot be edited again — contact admin for future changes.
        </div>
      )}

      {/* One-time warning when not yet edited */}
      {!profile.profile_edited && !editing && (
        <div className="mt-6 px-4 py-3 rounded-xl border border-[#e0e0e0] font-mono text-xs text-[#999] flex items-start gap-2"
          style={{ background: 'var(--bg-subtle)' }}>
          <Lock size={12} className="mt-0.5 flex-shrink-0" />
          You have one chance to edit your profile details and set a username.
          After saving, only an admin can make changes.
        </div>
      )}
    </div>
  )
}
