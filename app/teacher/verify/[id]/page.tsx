import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { TeacherActionWrapper } from './TeacherActionWrapper'
import { EventRegistrationStats } from '@/components/admin/EventRegistrationStats'
import { ArrowLeft, User, ShieldAlert, CheckCircle2, Clock, MapPin } from 'lucide-react'
import Link from 'next/link'
import { EventStatusTracker } from '@/components/common/EventStatusTracker'
import { PRAssignmentPanel } from '@/components/faculty/PRAssignmentPanel'
import { EventThread } from '@/components/student/EventThread'
import { getEventThread } from '@/lib/actions/event-threads'

export default async function TeacherVerifyPage({ params }: { params: Promise<{ id: string }> }) {
   const supabase = await createClient()
   const { id } = await params

   const { data: event } = await supabase
      .from('events')
      .select('*, profiles!created_by(full_name, usn, department)')
      .eq('id', id)
      .single()

   if (!event) notFound()

   const { data: { user } } = await supabase.auth.getUser()
   const thread = event.discussion_enabled ? await getEventThread(id) : null

   return (
      <div className="max-w-[1400px] mx-auto space-y-12 pb-20 transition-colors">
         <div className="flex items-center justify-between">
            <Link href="/teacher/dashboard" className="flex items-center gap-2 text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white font-mono text-xs uppercase tracking-widest transition-all">
               <ArrowLeft size={14} />
               Verification Queue
            </Link>
            <div className="flex items-center gap-3">
               <ShieldAlert size={16} className="text-amber-500" />
               <span className="font-mono text-xs uppercase text-amber-600 font-bold">Faculty Review Tier</span>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left: Event Details (7/12) */}
            <div className="lg:col-span-7 space-y-10">
               <header className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                     <h1 className="text-5xl font-black tracking-tighter text-[#0a0a0a] dark:text-white leading-tight">{event.title}</h1>
                     <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-2 rounded-2xl w-fit self-start sm:self-center">
                        <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Event ID</span>
                        <span className="text-lg font-black font-mono text-[#0a0a0a] dark:text-white tracking-tighter italic">{event.id}</span>
                     </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-mono text-zinc-500 uppercase tracking-wider">
                     <div className="flex items-center gap-2 text-black dark:text-white font-bold">
                        <span className="w-2 h-2 rounded-full bg-black dark:bg-white"></span>
                        <span>{event.club_name}</span>
                     </div>
                     <span className="opacity-30">/</span>
                     <span>Prop: {(event.profiles as any)?.full_name}</span>
                     <span className="opacity-30">/</span>
                     <span className="text-black dark:text-white font-bold">{event.targeted_department || 'All Departments'}</span>
                  </div>
               </header>

               <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-10 space-y-8 shadow-sm transition-colors">
                  <div>
                     <h3 className="text-[10px] font-mono text-zinc-500 dark:text-zinc-600 uppercase tracking-[0.2em] mb-4">Executive Summary</h3>
                     <p className="text-zinc-800 dark:text-zinc-300 leading-relaxed text-lg font-medium whitespace-pre-wrap">{event.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-8 border-t border-zinc-100 dark:border-zinc-900 pt-8">
                     <div className="space-y-1">
                        <div className="flex items-center gap-2 text-zinc-400">
                           <MapPin size={14} />
                           <h3 className="text-[10px] font-mono uppercase tracking-[0.2em]">Logistics</h3>
                        </div>
                        <p className="font-bold text-black dark:text-white">{event.location}</p>
                        <p className="text-xs text-zinc-500">{new Date(event.event_date).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' })}</p>
                     </div>
                     <div className="space-y-1">
                        <div className="flex items-center gap-2 text-zinc-400">
                           <User size={14} />
                           <h3 className="text-[10px] font-mono uppercase tracking-[0.2em]">Capacity</h3>
                        </div>
                        <p className="font-bold text-black dark:text-white">{event.max_capacity || 'Unlimited'}</p>
                        <p className="text-xs text-zinc-500">Scheduled Attendee Limit</p>
                     </div>
                  </div>
               </div>

               <div className="bg-zinc-900 text-white rounded-[2.5rem] overflow-hidden aspect-[16/9] relative group border border-zinc-200 dark:border-zinc-800 shadow-2xl">
                  <img src={event.banner_url || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Poster" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-10 flex flex-col justify-end">
                     <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-zinc-400 mb-2">Visual Asset Preview</p>
                     <h4 className="text-xl font-bold">Publicity Banner</h4>
                  </div>
               </div>
            </div>

            {/* Right: Status & Terminal (5/12) */}
            <div className="lg:col-span-5 space-y-8">
               <EventStatusTracker status={event.approval_status} />

               {/* Decision Terminal or Stats */}
               <div className="lg:sticky lg:top-12 h-fit">
                  {event.approval_status === 'approved' ? (
                     <div className="space-y-6">
                        <div className="bg-black dark:bg-zinc-900 text-white p-6 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-xl">
                           <div className="flex items-center gap-3 mb-2">
                              <CheckCircle2 size={20} className="text-zinc-400" />
                              <h3 className="font-black uppercase text-sm tracking-widest">Event Approved</h3>
                           </div>
                           <p className="text-xs font-mono opacity-80 italic">This event is currently published and open for student registrations. Approval phase is closed.</p>
                        </div>
                        <PRAssignmentPanel eventId={event.id} />
                        <EventRegistrationStats eventId={event.id} />
                     </div>
                  ) : (
                     <TeacherActionWrapper eventId={event.id} />
                  )}
               </div>
            </div>
         </div>

         {/* Discussion Thread (Faculty participation) */}
         {event.discussion_enabled && thread && (
            <EventThread
               conversationId={thread.id}
               eventName={event.title}
               userId={user?.id || ''}
               memberCount={thread.member_count}
               threadMode={thread.thread_mode}
               userRole={thread.user_role}
            />
         )}
      </div>
   )
}

