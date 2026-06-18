'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Users, User, Clock, CheckCircle, Download, MessageSquareHeart } from 'lucide-react'

interface Registration {
  id: string
  student_id: string
  registered_at: string
  checked_in: boolean
  profiles: {
    full_name: string
    usn: string
    department: string
  }
}

export function EventRegistrationStats({ eventId }: { eventId: string }) {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [feedbacks, setFeedbacks] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          id,
          student_id,
          registered_at,
          checked_in,
          profiles:student_id (
            full_name,
            usn,
            department
          )
        `)
        .eq('event_id', eventId)
        .order('registered_at', { ascending: false })

      const { data: fbData } = await supabase
        .from('feedbacks')
        .select('student_id')
        .eq('event_id', eventId)

      if (data) setRegistrations(data as any)
      if (fbData) setFeedbacks(fbData.map(f => f.student_id))
      setLoading(false)
    }

    fetchStats()

    // Realtime subscription for live updates
    const channel = supabase
      .channel(`live-registrations-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'registrations',
          filter: `event_id=eq.${eventId}`
        },
        () => {
          fetchStats()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId]) // supabase is a singleton — stable, safe to omit

  const exportList = () => {
    const csvContent = "Full Name,USN,Department,Status,Feedback Given\n" +
      registrations.map(r => `${r.profiles.full_name},${r.profiles.usn},${r.profiles.department},${r.checked_in ? 'Checked In' : 'Registered'},${feedbacks.includes(r.student_id) ? 'Yes' : 'No'}`).join("\n")

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `registrations-${eventId}.csv`
    a.click()
  }

  if (loading) {
    return <div className="p-8 bg-zinc-50 dark:bg-zinc-900/50 rounded-[2rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800 animate-pulse text-zinc-400 font-mono text-xs uppercase tracking-widest text-center">Crunching registration data...</div>
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Users size={16} className="text-zinc-400" />
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">Total</span>
          </div>
          <p className="text-3xl font-black">{registrations.length}</p>
          <p className="text-[10px] font-mono text-zinc-400 uppercase mt-1">Registered Students</p>
        </div>
        <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm transition-all hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black group transition-all">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle size={16} className="text-zinc-400 group-hover:text-inherit" />
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest group-hover:text-inherit">Live</span>
          </div>
          <p className="text-3xl font-black">
            {registrations.filter(r => r.checked_in).length}
          </p>
          <p className="text-[10px] font-mono text-zinc-400 uppercase mt-1 group-hover:text-inherit">Present Students</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 p-6 rounded-3xl shadow-sm transition-all hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-white group transition-all">
          <div className="flex items-center justify-between mb-2">
            <MessageSquareHeart size={16} className="text-emerald-500 group-hover:text-white" />
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-widest group-hover:text-white">Feedback</span>
          </div>
          <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300 group-hover:text-white">
            {feedbacks.length}
          </p>
          <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 uppercase mt-1 group-hover:text-emerald-100">Given Feedbacks</p>
        </div>
      </div>

      {/* Manifest List */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
            <Clock size={14} className="text-zinc-400" />
            Registration Manifest
          </h4>
          <button
            onClick={exportList}
            className="p-2 hover:bg-zinc-50 dark:hover:bg-white/5 rounded-full transition-colors text-zinc-400 hover:text-black dark:hover:text-white"
          >
            <Download size={16} />
          </button>
        </div>

        <div className="max-h-[400px] overflow-y-auto divide-y divide-zinc-50 dark:divide-zinc-800/50">
          {registrations.length > 0 ? (
            registrations.map(reg => (
              <div key={reg.id} className="p-4 flex items-center justify-between hover:bg-zinc-50/50 dark:hover:bg-white/5 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-all">
                    <User size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-tight">{reg.profiles.full_name}</p>
                    <p className="text-[10px] font-mono text-zinc-400">{reg.profiles.usn} · {reg.profiles.department}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {feedbacks.includes(reg.student_id) && (
                    <span className="text-[9px] font-black uppercase bg-emerald-500 text-white px-2 py-0.5 rounded-md flex items-center gap-1">
                      <MessageSquareHeart size={10} /> Feedback
                    </span>
                  )}
                  {reg.checked_in && (
                    <span className="text-[9px] font-black uppercase bg-[#0a0a0a] text-white px-2 py-0.5 rounded-md">Entered</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-zinc-400 font-mono text-xs uppercase tracking-widest italic">
              Manifest Empty
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
