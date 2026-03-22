import React from 'react'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { CalendarDays, MapPin, QrCode } from 'lucide-react'
import Link from 'next/link'
import type { Event } from '@/lib/types'
import { QRButton } from '@/components/student/QRButton'

type EventCardProps = {
  event: Event
  registeredCount?: number
  isRegistered?: boolean
  isEligible?: boolean
  hrefOverride?: string
  qrToken?: string
  studentName?: string
  usn?: string
}

export function EventCard({ event, registeredCount = 0, isRegistered = false, isEligible = true, hrefOverride, qrToken, studentName, usn }: EventCardProps) {
  return (
    <Link href={hrefOverride || `/student/events/${event.id}`} className={!isEligible ? 'pointer-events-none opacity-60 relative' : ''}>
      <Card className="overflow-hidden flex flex-col h-full bg-white relative">
        {isRegistered && (
          <div className="bg-black text-white text-xs font-mono px-4 py-2 w-full flex justify-between items-center tracking-widest uppercase relative z-20">
            <span>Registered ✓</span>
            {qrToken && studentName && usn && (
              <QRButton 
                token={qrToken}
                studentName={studentName}
                usn={usn}
                eventName={event.title}
                className="hover:text-gray-300 transition-colors flex items-center justify-center bg-transparent border-0 mt-0 py-0 px-0 h-auto w-auto rounded-none text-white block font-normal"
              >
                <div title="View Branded QR" className="p-0.5 cursor-pointer"><QrCode size={16} /></div>
              </QRButton>
            )}
          </div>
        )}
        {!isEligible && (
          <div className="absolute top-3 right-3 bg-[#999] text-white rounded-full text-xs font-mono px-3 py-1 z-10">
            Not eligible
          </div>
        )}
        
        <div className="relative aspect-[4/3] w-full bg-[#f5f5f5]">
          {event.banner_url ? (
             <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover grayscale" />
          ) : (
             <div className="w-full h-full flex items-center justify-center font-mono text-[#999] text-xs">NO BANNER</div>
          )}
          <Badge variant="status" className="absolute top-3 left-3 capitalize">{event.status}</Badge>
          <div className="absolute top-3 right-3 bg-white border border-[#e0e0e0] rounded-full text-xs font-mono px-2 py-0.5 text-[#0a0a0a]">
            {event.club_name}
          </div>
        </div>

        <div className="p-4 flex flex-col flex-1">
          <h3 className="text-base font-bold text-[#0a0a0a] line-clamp-2">{event.title}</h3>
          
          <div className="mt-3 space-y-2 flex-1">
            <div className="flex items-center gap-2 text-xs font-mono text-[#555555]">
              <CalendarDays size={14} />
              <span>{new Date(event.event_date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#555555]">
              <MapPin size={14} />
              <span className="truncate">{event.location || 'TBA'}</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#e0e0e0] flex justify-between items-center">
             <div className="flex -space-x-1.5">
               <div className="w-6 h-6 rounded-full bg-[#e0e0e0] border-2 border-white" />
               <div className="w-6 h-6 rounded-full bg-[#d0d0d0] border-2 border-white" />
               <div className="w-6 h-6 rounded-full bg-[#c0c0c0] border-2 border-white" />
             </div>
             <span className="text-xs font-mono text-[#555555]">
               {registeredCount} {event.max_capacity ? `/ ${event.max_capacity}` : ''} attending
             </span>
          </div>
        </div>
      </Card>
    </Link>
  )
}
