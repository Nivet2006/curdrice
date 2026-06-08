'use client'

import React, { useState } from 'react'
import { EventCard } from '@/components/student/EventCard'
import type { Event } from '@/lib/types'

import type { Profile } from '@/lib/types'

export function DashboardEventTabs({ 
  initialEvents, 
  registrations, 
  profile 
}: { 
  initialEvents: Event[], 
  registrations: { event_id: string; qr_token: string; is_waitlisted?: boolean }[],
  profile: Profile | null
}) {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'ongoing' | 'completed'>('upcoming')

  const filteredEvents = initialEvents.filter(e => e.status === activeTab)

  return (
    <div>
      <div className="flex gap-6 mb-6 border-b border-[#e0e0e0]">
        <button 
          onClick={() => setActiveTab('upcoming')}
          className={`pb-3 border-b-2 font-mono text-sm transition-colors ${activeTab === 'upcoming' ? 'border-[#0a0a0a] font-bold text-[#0a0a0a]' : 'border-transparent text-[#555555] hover:text-[#0a0a0a]'}`}
        >
          Upcoming
        </button>
        <button 
          onClick={() => setActiveTab('ongoing')}
          className={`pb-3 border-b-2 font-mono text-sm transition-colors ${activeTab === 'ongoing' ? 'border-[#0a0a0a] font-bold text-[#0a0a0a]' : 'border-transparent text-[#555555] hover:text-[#0a0a0a]'}`}
        >
          Ongoing
        </button>
        <button 
          onClick={() => setActiveTab('completed')}
          className={`pb-3 border-b-2 font-mono text-sm transition-colors ${activeTab === 'completed' ? 'border-[#0a0a0a] font-bold text-[#0a0a0a]' : 'border-transparent text-[#555555] hover:text-[#0a0a0a]'}`}
        >
          Completed
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.length === 0 ? (
           <p className="col-span-full font-mono text-xs text-[#999999] p-8 border border-dashed border-[#e0e0e0] rounded-2xl text-center">No {activeTab} events.</p>
        ) : (
           filteredEvents.map((event) => {
             const reg = registrations?.find(r => r.event_id === event.id)
             return (
               <EventCard 
                 key={event.id} 
                 event={event} 
                 isRegistered={!!reg}
                 isWaitlisted={reg?.is_waitlisted}
                 qrToken={reg?.qr_token}
                 studentName={profile?.full_name}
                 usn={profile?.usn}
               />
             )
           })
        )}
      </div>
    </div>
  )
}
