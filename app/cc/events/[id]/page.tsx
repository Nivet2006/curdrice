import { createClient, getCachedAuthUser, getCachedUserProfile } from '@/lib/supabase/server'
import { ArrowLeft, Clock, XCircle, FileText, Send, Edit3, Heart, Trophy } from 'lucide-react'
import { EventRegistrationStats } from '@/components/admin/EventRegistrationStats'
import { parseCustomBackground } from '@/lib/custom-background'
import Link from 'next/link'
import { EventStatusTracker } from '@/components/common/EventStatusTracker'
import { redirect } from 'next/navigation'
import { submitEventForReview } from '@/lib/actions/cc-events'
import { AdminManualOverride } from '@/components/admin/AdminManualOverride'
import { FeedbackToggle } from '@/components/cc/FeedbackToggle'
import { DiscussionToggle } from '@/components/cc/DiscussionToggle'
import { ReportHubCard } from '@/components/iic/ReportHubCard'
import { EventPhotosGallery } from '@/components/cc/EventPhotosGallery'
import { EventThread } from '@/components/student/EventThread'
import { getEventThread } from '@/lib/actions/event-threads'
export default async function CCEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
   const supabase = await createClient()
   const { id } = await params
   const user = await getCachedAuthUser()
   const profile = user ? await getCachedUserProfile(user.id) : null

   // Fetch event and constraints in parallel to eliminate sequential database roundtrips
   const [eventRes, constraintsRes] = await Promise.all([
      supabase.from('events').select('id, title, description, club_name, location, event_date, registration_deadline, max_capacity, status, approval_status, rejection_data, feedback_config, feedback_open, targeted_department, banner_url, custom_background, is_public, discussion_enabled, thread_mode, created_by, created_at, event_type').eq('id', id).maybeSingle(),
      supabase.from('event_constraints').select('id, event_id, allowed_semesters, allowed_years, allowed_departments, created_at').eq('event_id', id).maybeSingle()
   ])

   const event = eventRes.data
   const constraints = constraintsRes.data

   const isAdmin = profile?.role === 'admin'
   const isTeacher = profile?.role === 'teacher'
   const isCreator = event?.created_by === user?.id
   const hasAccess = isAdmin || isTeacher || isCreator

   // Security check: if the event doesn't exist, or the user is not allowed to view it, deny access
   if (!event || !hasAccess) {
      return (
         <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <h2 className="text-2xl font-bold">Event not found or access denied.</h2>
            <Link href={isTeacher ? "/teacher/dashboard" : "/cc/dashboard"} className="text-sm font-mono text-zinc-500 hover:underline">← Back to Dashboard</Link>
         </div>
      )
   }

   let uniqueDepts: string[] = []
   if (isAdmin) {
      const { data: depts } = await supabase.from('profiles').select('department')
      uniqueDepts = Array.from(new Set(depts?.map(d => d.department).filter(Boolean))) as string[]
   }

   // Fetch thread info if discussion is enabled (passing prefetched user, role and thread mode to optimize speed)
   const thread = event.discussion_enabled ? await getEventThread(id, user, profile?.role, event.thread_mode) : null

   const bg = parseCustomBackground(event.custom_background, event.banner_url)

   return (
      <div className={`w-full min-h-screen relative transition-all ${bg.textClass}`}>
         {bg.customStyleBlock && <style dangerouslySetInnerHTML={{ __html: bg.customStyleBlock }} />}
         {bg.hasCustomBg && (
            <>
               <div 
                  style={bg.backdropStyle} 
                  className={`fixed inset-0 w-full h-full -z-10 pointer-events-none transition-all ${bg.backdropClass}`} 
               />
               {bg.backdropOverlayClass && (
                  <div 
                     style={bg.backdropOverlayStyle} 
                     className={`fixed inset-0 w-full h-full -z-10 pointer-events-none transition-all ${bg.backdropOverlayClass}`} 
                  />
               )}
               {bg.meshPatternStyle && (
                  <div 
                     style={bg.meshPatternStyle} 
                     className="fixed inset-0 w-full h-full -z-10 pointer-events-none opacity-80" 
                  />
               )}
            </>
         )}

         <div className="relative z-10 max-w-4xl mx-auto space-y-12 pb-20 transition-all">
            <header className="flex items-center justify-between">
               <Link href={isAdmin ? "/admin/logs" : "/cc/dashboard"} className={`flex items-center gap-2 font-mono text-xs uppercase tracking-widest transition-colors ${bg.linkClass}`}>
                  <ArrowLeft size={14} />
                  {isAdmin ? 'Back to Intel' : 'Back to Pipeline'}
               </Link>
               <div className="flex items-center gap-3">
                  <div className="flex gap-2 mr-4">
                     {event.event_type === 'hackathon' && (
                        <Link
                           href={`/cc/events/${id}/hackathon`}
                           className={`flex items-center gap-2 px-4 py-2 border rounded-full text-xs font-bold transition-all active:scale-95 ${
                             bg.hasCustomBg 
                               ? 'border-violet-400 text-violet-300 hover:bg-violet-400/10' 
                               : 'border-violet-500 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10'
                           }`}
                        >
                           <Trophy size={14} />
                           Hackathon Controls
                        </Link>
                     )}
                     <Link
                        href={`/cc/events/${id}/edit`}
                        className={`flex items-center gap-2 px-4 py-2 border rounded-full text-xs font-bold transition-all active:scale-95 ${
                          bg.hasCustomBg 
                            ? 'border-white text-white hover:bg-white/10' 
                            : 'border-black dark:border-white text-black dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900'
                        }`}
                     >
                        <Edit3 size={14} />
                        {event.approval_status === 'approved' ? 'Edit Details' : 'Edit Draft'}
                     </Link>
                     {event.approval_status === 'draft' && (
                        <form action={async () => {
                           'use server'
                           await submitEventForReview(id)
                           redirect('/cc/dashboard')
                        }}>
                           <button
                              type="submit"
                              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95 shadow-md ${
                                bg.hasCustomBg 
                                  ? 'bg-white text-black hover:bg-zinc-200' 
                                  : 'bg-black text-white dark:bg-white dark:text-black hover:bg-zinc-800'
                              }`}
                           >
                              <Send size={14} className={bg.hasCustomBg ? 'text-black' : 'dark:text-black'} />
                              Submit to Faculty
                           </button>
                        </form>
                     )}
                  </div>
                  <span className={`font-mono text-[9px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full border ${
                     event.approval_status === 'approved' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' :
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
               <div className="w-full max-h-[600px] flex justify-center items-center rounded-[2.5rem] overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-2xl relative group transition-all bg-black/[0.02] dark:bg-white/[0.02]">
                  <img src={event.banner_url} alt={event.title} className="max-h-[600px] w-auto max-w-full object-contain transition-transform duration-700 group-hover:scale-[1.02]" />
               </div>
            )}

            <div className="space-y-4">
               <h1 className={`text-5xl font-black tracking-tight uppercase ${bg.textClass}`}>{event.title}</h1>
               <div className={`flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-mono opacity-90 ${bg.textClass}`}>
                  <div className="flex items-center gap-2 font-bold">
                     <span className="w-2 h-2 rounded-full bg-current"></span>
                     <span>{event.club_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <Clock size={14} />
                     <span>{new Date(event.event_date).toLocaleDateString()} at {new Date(event.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex items-center gap-2 font-bold">
                     <FileText size={14} />
                     <span>{event.targeted_department || 'All Departments'}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                     <span className="text-[10px] font-mono opacity-60 uppercase tracking-widest">Auth Code:</span>
                     <span className="bg-black/10 dark:bg-white/10 px-3 py-1 rounded-lg font-black italic tracking-tighter">{event.id}</span>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="md:col-span-2 space-y-10">
                  <section className={`${bg.cardClass} !rounded-[2.5rem] !p-10 space-y-6`} style={bg.cardStyle}>
                     <h2 className="font-bold text-2xl tracking-tight flex items-center gap-3">
                        <FileText className="opacity-60" />
                        Detailed Pitch
                     </h2>
                     <p className="leading-relaxed whitespace-pre-wrap text-lg font-medium opacity-95">{event.description}</p>
                  </section>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                     <div className={`${bg.cardClass} space-y-3`} style={bg.cardStyle}>
                        <p className="text-[10px] font-mono opacity-70 uppercase tracking-widest">Eligibility & Constraints</p>
                        <div className="space-y-4">
                           <div>
                              <p className="text-xs opacity-60 mb-1">Semesters</p>
                              <div className="flex flex-wrap gap-1">
                                 {constraints?.allowed_semesters?.map((s: number) => <span key={s} className="bg-black/5 dark:bg-white/5 border border-current/10 px-2 py-0.5 rounded-md text-[10px] font-mono">{s}</span>) || <span className="text-xs italic opacity-70">All</span>}
                              </div>
                           </div>
                           <div>
                              <p className="text-xs opacity-60 mb-1">Years</p>
                              <div className="flex flex-wrap gap-1">
                                 {constraints?.allowed_years?.map((y: number) => <span key={y} className="bg-black/5 dark:bg-white/5 border border-current/10 px-2 py-0.5 rounded-md text-[10px] font-mono">{y}st</span>) || <span className="text-xs italic opacity-70">All</span>}
                              </div>
                           </div>
                        </div>
                     </div>
                     <div className={`${bg.cardClass} space-y-3`} style={bg.cardStyle}>
                        <p className="text-[10px] font-mono opacity-70 uppercase tracking-widest">Capacity & Logistics</p>
                        <div className="space-y-2">
                           <p className="text-2xl font-bold">{event.max_capacity || '∞'}</p>
                           <p className="text-xs opacity-75">Max Attendee Limit</p>
                           <div className="pt-2 border-t border-current/10 mt-2">
                              <p className="text-sm font-bold uppercase tracking-tighter">{event.location}</p>
                              <p className="text-[10px] opacity-65 uppercase tracking-widest">Venue</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Feedback Configuration (Survey) */}
                  <section className={`${bg.cardClass} !rounded-[2.5rem] !p-10 space-y-6`} style={bg.cardStyle}>
                     <div className="flex justify-between items-center">
                        <h2 className="font-bold text-2xl tracking-tight">Survey Design</h2>
                        <span className="font-mono text-[9px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full border border-current/10 bg-white/5">{event.feedback_config?.length || 0} QUESTIONS</span>
                     </div>
                     <div className="space-y-4">
                        {event.feedback_config?.map((q: any, i: number) => (
                           <div key={i} className="flex gap-4 p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-current/10 transition-colors">
                              <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-900 border border-current/10 flex items-center justify-center font-mono text-xs">{i + 1}</div>
                              <div className="flex-1">
                                 <div className="flex justify-between">
                                    <p className="font-bold">{q.label}</p>
                                    <span className="text-[9px] font-mono opacity-70 uppercase">{q.type.replace('_', ' ')}</span>
                                 </div>
                                 {q.options && q.options.length > 0 && (
                                    <p className="text-[10px] opacity-60 mt-1 uppercase tracking-widest">Options: {q.options.join(', ')}</p>
                                 )}
                              </div>
                           </div>
                        ))}
                     </div>
                  </section>

                  {(() => {
                     const rejectionData = Array.isArray(event.rejection_data)
                        ? event.rejection_data
                        : (typeof event.rejection_data === 'string'
                           ? (JSON.parse(event.rejection_data) || [])
                           : []);
                     if (!rejectionData || rejectionData.length === 0) return null;
                     return (
                        <section className="bg-rose-50/15 dark:bg-rose-950/20 border border-rose-500/20 rounded-3xl p-8 space-y-4">
                           <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                              <XCircle size={20} />
                              <h2 className="font-bold text-xl uppercase tracking-tight">Revision Required</h2>
                           </div>
                           <div className="space-y-4">
                              {rejectionData.map((item: any, i: number) => (
                                 <div key={i} className="bg-white/10 dark:bg-black/40 p-4 rounded-xl border border-rose-500/20">
                                    <p className="text-[10px] font-mono uppercase text-rose-500 mb-1">{item.field}</p>
                                    <p className="text-sm font-medium">{item.reason}</p>
                                 </div>
                              ))}
                           </div>
                        </section>
                     );
                  })()}

                  {/* Section 1 — Event Report Hub Card moved here */}
                  <ReportHubCard eventId={event.id} />

                  <section className={`${bg.cardClass} !rounded-[2.5rem] !p-10`} style={bg.cardStyle}>
                     <EventPhotosGallery eventId={event.id} />
                  </section>
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
                              <div className={`p-6 rounded-3xl border ${isRegistrationsClosed ? 'bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700' : 'bg-black text-white dark:bg-zinc-900 border-white/10'}`}>
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
                     <div className={`${bg.cardClass} space-y-4 shadow-xl`} style={bg.cardStyle}>
                        <h3 className="font-bold text-lg">Analytics Overview</h3>
                        <div className="space-y-1">
                           <p className="text-3xl font-black">--</p>
                           <p className="text-[10px] font-mono uppercase opacity-60">Total Registrations</p>
                        </div>
                        <p className="text-[10px] opacity-60 italic">Analytics will be available once the event is approved and published.</p>
                     </div>
                  )}
               </aside>
            </div>

            {/* Event Discussion Thread (CC participation) */}
            {event.discussion_enabled && thread && (
               <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className={bg.cardClass + " !p-0 overflow-hidden"} style={bg.cardStyle}>
                     <EventThread
                        conversationId={thread.id}
                        eventName={event.title}
                        userId={user?.id || ''}
                        memberCount={thread.member_count}
                        threadMode={thread.thread_mode}
                        userRole={thread.user_role}
                     />
                  </div>
               </section>
            )}
         </div>
      </div>
   )
}
