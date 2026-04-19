'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ShieldAlert, RefreshCw, Save, Trash2, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface AdminManualOverrideProps {
  event: any
  departments: string[]
}

export function AdminManualOverride({ event, departments }: AdminManualOverrideProps) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(event.approval_status)
  const [dept, setDept] = useState(event.targeted_department || '')
  const [venue, setVenue] = useState(event.location || '')
  const supabase = createClient()
  const router = useRouter()

  const handleUpdate = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('events')
        .update({
          approval_status: status,
          targeted_department: dept || null,
          location: venue
        })
        .eq('id', event.id)

      if (error) throw error
      toast.success('Event overridden successfully')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you absolutely sure? This will delete all registrations, reports, and constraints for this event.')) return
    
    setLoading(true)
    try {
      const { error } = await supabase.from('events').delete().eq('id', event.id)
      if (error) throw error
      toast.success('Event purged from system')
      router.push('/admin/logs') // Or somewhere appropriate
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="bg-zinc-950 text-white rounded-[2.5rem] p-10 space-y-8 border-4 border-rose-600/30 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <ShieldAlert size={120} />
      </div>

      <div className="flex items-center gap-4 relative z-10">
        <div className="bg-rose-600 p-3 rounded-2xl animate-pulse">
          <ShieldAlert size={24} className="text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Administrator Manual Override</h2>
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">High-Level System Intervention Gated Access</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1 block">Approval Status Flow Override</label>
            <select 
              value={status} 
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold focus:border-rose-500 outline-none transition-all"
            >
              <option value="draft">DRAFT</option>
              <option value="pending_teacher">PENDING TEACHER</option>
              <option value="pending_hod">PENDING HOD</option>
              <option value="approved">APPROVED / LIVE</option>
              <option value="rejected">REJECTED</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1 block">Departmental Transfer</label>
            <select 
              value={dept} 
              onChange={(e) => setDept(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold focus:border-rose-500 outline-none transition-all"
            >
              <option value="">ALL DEPARTMENTS</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1 block">Manual Venue Assignment</label>
            <input 
              type="text" 
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold focus:border-rose-500 outline-none transition-all"
              placeholder="Assign Venue..."
            />
          </div>

          <div className="flex gap-4 pt-5">
            <button
              onClick={handleUpdate}
              disabled={loading}
              className="flex-1 bg-white text-black h-14 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <Save size={18} />
              Commit Override
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="w-14 h-14 bg-zinc-900 border border-zinc-800 text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-900/20 transition-all active:scale-95 disabled:opacity-50"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-zinc-800 flex items-center gap-3 relative z-10">
         <RefreshCw size={14} className="text-zinc-500 animate-spin-slow" />
         <p className="text-[10px] font-mono text-zinc-600 uppercase italic">Changes committed here bypass standard institutional validation protocols.</p>
      </div>
    </section>
  )
}
