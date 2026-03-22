import { createClient } from '@/lib/supabase/server'
import { EventCard } from '@/components/student/EventCard'
import { Search } from 'lucide-react'
import type { Event } from '@/lib/types'

export default async function StudentEventsPage() {
  const supabase = createClient()
  
  const { data: allEvents } = await supabase
    .from('events')
    .select('*')
    .in('status', ['upcoming', 'ongoing'])
    .order('event_date', { ascending: true })

  const events = (allEvents as Event[]) || []

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-black text-[#0a0a0a]">Events</h1>
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-[10px] text-[#999999]" size={18} />
          <input 
            type="text" 
            placeholder="Search events..." 
            className="w-full rounded-full border border-[#d0d0d0] bg-white pl-12 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a0a0a] font-sans"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        <span className="font-mono text-xs px-4 py-1.5 rounded-full bg-black text-white cursor-pointer hover:bg-[#333]">All</span>
        <span className="font-mono text-xs px-4 py-1.5 rounded-full bg-white border border-[#e0e0e0] text-[#555] cursor-pointer hover:bg-[#f5f5f5]">Upcoming</span>
        <span className="font-mono text-xs px-4 py-1.5 rounded-full bg-white border border-[#e0e0e0] text-[#555] cursor-pointer hover:bg-[#f5f5f5]">Ongoing</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.length === 0 ? (
           <p className="col-span-full font-mono text-xs text-[#999999] p-8 border border-dashed border-[#e0e0e0] rounded-2xl text-center">No events found.</p>
        ) : (
           events.map((event) => (
             <EventCard key={event.id} event={event} />
           ))
        )}
      </div>
    </div>
  )
}
