import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Clock, XCircle, FileText, Send, Edit3, Heart } from 'lucide-react'
import { EventRegistrationStats } from '@/components/admin/EventRegistrationStats'
import Link from 'next/link'
import { EventStatusTracker } from '@/components/common/EventStatusTracker'
import { redirect } from 'next/navigation'
import { submitEventForReview } from '@/lib/actions/cc-events'
import { AdminManualOverride } from '@/components/admin/AdminManualOverride'
import { FeedbackToggle } from '@/components/cc/FeedbackToggle'
import { DiscussionToggle } from '@/components/cc/DiscussionToggle'
import { ReportHubCard } from '@/components/iic/ReportHubCard'
import { EventThread } from '@/components/student/EventThread'
import { getEventThread } from '@/lib/actions/event-threads'
export default async function CCEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
   const supabase = await createClient()
   const { id } = await params
   const { data: { user } } = await supabase.auth.getUser()

   // Get user role for permissions
   const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id || '').single()
   const isAdmin = profile?.role === 'admin'

   // If admin, we don't filter by created_by
   let query = supabase.from('events').select('id, title, description, club_name, location, event_date, registration_deadline, max_capacity, status, approval_status, rejection_data, feedback_config, feedback_open, targeted_department, banner_url, is_public, discussion_enabled, thread_mode, created_by, created_at').eq('id', id)
   if (!isAdmin) {
      query = query.eq('created_by', user?.id || '')
   }

   const { data: event } = await query.single()

   if (!event) {
      return (
         <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <h2 className="text-2xl font-bold">Event not found or access denied.</h2>
            <Link href="/cc/dashboard" className="text-sm font-mono text-zinc-500 hover:underline">← Back to Dashboard</Link>
         </div>
      )
   }

   const { data: constraints } = await supabase
      .from('event_constraints')
      .select('id, event_id, allowed_semesters, allowed_years, allowed_departments, created_at')
      .eq('event_id', id)
      .maybeSingle()

   let uniqueDepts: string[] = []
   if (isAdmin) {
      const { data: depts } = await supabase.from('profiles').select('department')
      uniqueDepts = Array.from(new Set(depts?.map(d => d.department).filter(Boolean))) as string[]
   }

   // Fetch thread info if discussion is enabled
   const thread = event.discussion_enabled ? await getEventThread(id) : null

   return (
      <div className="max-w-4xl mx-auto space-y-12 pb-20 transition-colors">
         <header className="flex items-center justify-between">
            <Link href={isAdmin ? "/admin/logs" : "/cc/dashboard"} className="flex items-center gap-2 text-zinc-700 dark:text-zinc-400 hover:text-black dark:hover:text-white font-mono text-xs uppercase tracking-widest transition-colors">
               <ArrowLeft size={14} />
               {isAdmin ? 'Back to Intel' : 'Back to Pipeline'}
            </Link>
            <div className="flex items-center gap-3">
               {(event.approval_status === 'draft' || (event.rejection_data && event.rejection_data.length > 0)) && (
                  <div className="flex gap-2 mr-4">
                     <Link
                        href={`/cc/events/${id}/edit`}
                        className="flex items-center gap-2 px-4 py-2 border border-black dark:border-white rounded-full text-xs font-bold hover:bg-zinc-50 transition-all active:scale-95"
                     >
                        <Edit3 size={14} />
                        Edit Draft
                     </Link>
                     {event.approval_status === 'draft' && (
                        <form action={async () => {
                           'use server'
                           await submitEventForReview(id)
                           redirect('/cc/dashboard')
                        }}>
                           <button
                              type="submit"
                              className="flex items-center gap-2 px-4 py-2 bg-black text-white dark:bg-white dark:!text-black rounded-full text-xs font-bold hover:bg-zinc-800 transition-all active:scale-95 shadow-md"
                           >
                              <Send size={14} className="dark:!text-black" />
                              Submit to Faculty
                           </button>
                        </form>
                     )}
                  </div>
               )}
               <span className={`font-mono text-[9px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full border ${event.approval_status === 'approved' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' :
                  event.approval_status === 'rejected' ? 'bg-rose-500/10 text-rose-600 border-rose-500/30' :
                     'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
                  }`}>
                  {event.approval_status.replace(/_/g, ' ').toUpperCase()}
               </span>
            </div>
         </header>

         {/* ADMIN OVERRIDE SECTION */}
         {isAdmin && (
            <AdminManualOverride event={event} departments={uniqueDepts} />
         )}

         {/* Visual Branding / Poster */}
         {event.banner_url && (
            <div className="w-full aspect-[21/9] rounded-[2.5rem] overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-2xl relative group transition-all">
               <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-10">
                  <div className="space-y-2">
                     <p className="text-xs font-mono text-white/70 uppercase tracking-widest">Visual Identity</p>
                     <h2 className="text-white text-3xl font-black">{event.title}</h2>
                  </div>
               </div>
            </div>
         )}

         <div className="space-y-4">
            {!event.banner_url && <h1 className="text-5xl font-black tracking-tight text-[#0a0a0a] dark:text-white">{event.title}</h1>}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-mono text-zinc-600 dark:text-zinc-500">
               <div className="flex items-center gap-2 text-[#0a0a0a] dark:text-white">
                  <span className="w-2 h-2 rounded-full bg-black dark:bg-white"></span>
                  <span>{event.club_name}</span>
               </div>
               <div className="flex items-center gap-2">
                  <Clock size={14} />
                  <span>{new Date(event.event_date).toLocaleDateString()} at {new Date(event.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
               </div>
               <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                  <FileText size={14} />
                  <span>{event.targeted_department || 'All Departments'}</span>
               </div>
               <div className="flex items-center gap-2 ml-auto">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">Auth Code:</span>
                  <span className="bg-zinc-100 dark:bg-zinc-900 px-3 py-1 rounded-lg text-black dark:text-white font-black italic tracking-tighter">{event.id}</span>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-10">
               <section className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-10 space-y-6 shadow-sm transition-colors">
                  <h2 className="font-bold text-2xl tracking-tight text-[#0a0a0a] dark:text-white flex items-center gap-3">
                     <FileText className="text-zinc-400" />
                     Detailed Pitch
                  </h2>
                  <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap text-lg font-medium">{event.description}</p>
               </section>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-3 transition-colors shadow-sm">
                     <p className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">Eligibility & Constraints</p>
                     <div className="space-y-4">
                        <div>
                           <p className="text-xs text-zinc-500 mb-1">Semesters</p>
                           <div className="flex flex-wrap gap-1">
                              {constraints?.allowed_semesters?.map((s: number) => <span key={s} className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 rounded-md text-[10px] font-mono text-zinc-800 dark:text-zinc-200">{s}</span>) || <span className="text-xs italic text-zinc-500">All</span>}
                           </div>
                        </div>
                        <div>
                           <p className="text-xs text-zinc-500 mb-1">Years</p>
                           <div className="flex flex-wrap gap-1">
                              {constraints?.allowed_years?.map((y: number) => <span key={y} className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 rounded-md text-[10px] font-mono text-zinc-800 dark:text-zinc-200">{y}st</span>) || <span className="text-xs italic text-zinc-500">All</span>}
                           </div>
                        </div>
                     </div>
                  </div>
                  <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-3 transition-colors shadow-sm">
                     <p className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">Capacity & Logistics</p>
                     <div className="space-y-2">
                        <p className="text-2xl font-bold text-[#0a0a0a] dark:text-white">{event.max_capacity || '∞'}</p>
                        <p className="text-xs text-zinc-500">Max Attendee Limit</p>
                        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 mt-2">
                           <p className="text-sm font-bold text-[#0a0a0a] dark:text-white uppercase tracking-tighter">{event.location}</p>
                           <p className="text-[10px] text-zinc-600 dark:text-zinc-500 uppercase tracking-widest">Venue</p>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Feedback Configuration (Survey) */}
               <section className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-10 space-y-6 shadow-sm transition-colors">
                  <div className="flex justify-between items-center">
                     <h2 className="font-bold text-2xl tracking-tight text-[#0a0a0a] dark:text-white">Survey Design</h2>
                     <span className="font-mono text-[9px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full border bg-zinc-500/10 text-zinc-500 border-zinc-500/20">{event.feedback_config?.length || 0} QUESTIONS</span>
                  </div>
                  <div className="space-y-4">
                     {event.feedback_config?.map((q: any, i: number) => (
                        <div key={i} className="flex gap-4 p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 transition-colors">
                           <div className="w-8 h-8 rounded-full bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 flex items-center justify-center font-mono text-xs text-[#0a0a0a] dark:text-white">{i + 1}</div>
                           <div className="flex-1">
                              <div className="flex justify-between">
                                 <p className="font-bold text-zinc-800 dark:text-zinc-200">{q.label}</p>
                                 <span className="text-[9px] font-mono text-zinc-500 dark:text-zinc-400 uppercase">{q.type.replace('_', ' ')}</span>
                              </div>
                              {q.options && q.options.length > 0 && (
                                 <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest">Options: {q.options.join(', ')}</p>
                              )}
                           </div>
                        </div>
                     ))}
                  </div>
               </section>

               {event.rejection_data && event.rejection_data.length > 0 && (
                  <section className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 rounded-3xl p-8 space-y-4">
                     <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                        <XCircle size={20} />
                        <h2 className="font-bold text-xl uppercase tracking-tight">Revision Required</h2>
                     </div>
                     <div className="space-y-4">
                        {event.rejection_data.map((item: any, i: number) => (
                           <div key={i} className="bg-white dark:bg-black/40 p-4 rounded-xl border border-rose-100 dark:border-rose-900/30">
                              <p className="text-[10px] font-mono uppercase text-rose-600 dark:text-rose-400 mb-1">{item.field}</p>
                              <p className="text-sm font-medium text-rose-900 dark:text-rose-200">{item.reason}</p>
                           </div>
                        ))}
                     </div>
                  </section>
               )}

               {/* Section 1 — Event Report Hub Card moved here */}
               <ReportHubCard eventId={event.id} />
            </div>

            <aside className="space-y-6">
               <EventStatusTracker status={event.approval_status} />

               {event.approval_status === 'approved' ? (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                     <FeedbackToggle eventId={event.id} initialStatus={event.feedback_open} />
                     <DiscussionToggle eventId={event.id} initialStatus={event.discussion_enabled || false} initialMode={event.thread_mode || 'open'} />
                     {(() => {
                        const isRegistrationsClosed = new Date() > new Date(event.registration_deadline);
                        return (
                           <div className={`p-6 rounded-3xl border ${isRegistrationsClosed ? 'bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700' : 'bg-[#0a0a0a] dark:bg-zinc-900 border-emerald-500/30'}`}>
                              <div className={`flex items-center gap-2 mb-2 ${isRegistrationsClosed ? 'text-zinc-500' : 'text-emerald-400'}`}>
                                 {isRegistrationsClosed ? <XCircle size={16} /> : <Heart size={16} fill="currentColor" />}
                                 <span className="text-[10px] font-mono font-black uppercase tracking-widest">
                                    {isRegistrationsClosed ? 'Registrations Closed' : 'Public Interest'}
                                 </span>
                              </div>
                              <p className={`text-sm font-medium ${isRegistrationsClosed ? 'text-zinc-600 dark:text-zinc-400' : 'text-white'}`}>
                                 {isRegistrationsClosed ? 'The registration window has concluded. You can now focus on event execution and feedback collection.' : 'Your event is currently attracting registrations.'}
                              </p>
                           </div>
                        );
                     })()}
                     <EventRegistrationStats eventId={event.id} />
                  </div>
               ) : (
                  <div className="bg-white dark:bg-black text-[#0a0a0a] dark:text-white border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-4 shadow-xl transition-colors">
                     <h3 className="font-bold text-lg">Analytics Overview</h3>
                     <div className="space-y-1">
                        <p className="text-3xl font-black">--</p>
                        <p className="text-[10px] font-mono uppercase text-zinc-600 dark:text-zinc-500">Total Registrations</p>
                     </div>
                     <p className="text-[10px] text-zinc-500 dark:text-zinc-500 italic">Analytics will be available once the event is approved and published.</p>
                  </div>
               )}
            </aside>
         </div>

         {/* Event Discussion Thread (CC participation) */}
         {event.discussion_enabled && thread && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <EventThread
                  conversationId={thread.id}
                  eventName={event.title}
                  userId={user?.id || ''}
                  memberCount={thread.member_count}
                  threadMode={thread.thread_mode}
                  userRole={thread.user_role}
               />
            </section>
         )}

      </div>
   )
}
