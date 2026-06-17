import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { TeacherActionWrapper } from './TeacherActionWrapper'
import { EventRegistrationStats } from '@/components/admin/EventRegistrationStats'
import { ArrowLeft, ShieldAlert, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { EventStatusTracker } from '@/components/common/EventStatusTracker'
import { PRAssignmentPanel } from '@/components/faculty/PRAssignmentPanel'
import { EventThread } from '@/components/student/EventThread'
import { getEventThread } from '@/lib/actions/event-threads'
import { EditableVerifyDetails } from '@/components/teacher/EditableVerifyDetails'
import { JudgeAssignmentPanel } from '@/components/faculty/JudgeAssignmentPanel'
import { HackathonConfigPanel } from '@/components/student/HackathonConfigPanel'
import { parseCustomBackground } from '@/lib/custom-background'

export default async function TeacherVerifyPage({ params }: { params: Promise<{ id: string }> }) {
   const supabase = await createClient()
   const { id } = await params

   const { data: event } = await supabase
      .from('events')
      .select('*, profiles!created_by(full_name, usn, department, role), event_constraints(*)')
      .eq('id', id)
      .single()

   if (!event) notFound()

   const constraints = Array.isArray((event as any).event_constraints)
      ? (event as any).event_constraints[0]
      : (event as any).event_constraints

   const { data: { user } } = await supabase.auth.getUser()
   const thread = event.discussion_enabled ? await getEventThread(id) : null
   const isCreator = event.created_by === user?.id
   const bg = parseCustomBackground(event.custom_background, event.banner_url)

   return (
      <div className="max-w-[1400px] mx-auto space-y-6 pb-12 transition-colors">
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

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Editable Event Details (7/12) */}
            <div className="lg:col-span-7 space-y-6">
               <EditableVerifyDetails event={event} constraints={constraints} />
            </div>

            {/* Right: Status & Terminal (5/12) */}
            <div className="lg:col-span-5 space-y-4">
               <EventStatusTracker 
                  status={event.approval_status} 
                  creatorRole={(Array.isArray(event.profiles) ? event.profiles[0] : event.profiles)?.role}
               />

               {event.event_type === 'hackathon' && (
                  <HackathonConfigPanel
                     eventId={id}
                     initialCriteria={event.hackathon_criteria as any}
                     initialShowCriteria={event.show_evaluation_criteria ?? true}
                     initialShowScoreboard={event.show_scoreboard ?? false}
                     cardClass={bg.cardClass}
                     cardStyle={bg.cardStyle}
                  />
               )}

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
                        {event.event_type === 'hackathon' && (
                           <JudgeAssignmentPanel eventId={event.id} />
                        )}
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

