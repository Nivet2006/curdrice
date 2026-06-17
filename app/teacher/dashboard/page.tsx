import React from 'react'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ShieldAlert, CheckCircle, ArrowRight, User, Award, FileText, PlusCircle, FileDown } from 'lucide-react'
import { ManageStudentsPanel } from '@/components/faculty/ManageStudentsPanel'
import { VenueAvailabilityManager } from '@/components/faculty/VenueAvailabilityManager'
import { ClubManager } from '@/components/faculty/ClubManager'
import type { Profile } from '@/lib/types'
export const dynamic = 'force-dynamic'

export default async function TeacherDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get Teacher profile
  const { data: profile } = await supabase.from('profiles').select('full_name, department').eq('id', user?.id || '').single()
  const dept = profile?.department || 'General'
  const facultyName = profile?.full_name?.split(' ')[0] || 'Faculty'

  const hour = new Date().getHours()
  let greeting = 'Good Morning'
  if (hour >= 12 && hour < 17) greeting = 'Good Afternoon'
  if (hour >= 17) greeting = 'Good Evening'
  const personalizedGreeting = `${greeting}, ${facultyName}`

  // Events pending teacher verification (scoped to department)
  const { data: pendingEvents } = await supabase
    .from('events')
    .select('id, title, description, club_name, location, event_date, registration_deadline, max_capacity, status, approval_status, rejection_data, feedback_config, feedback_open, targeted_department, banner_url, is_public, discussion_enabled, thread_mode, created_by, created_at, profiles!created_by(role)')
    .eq('approval_status', 'pending_teacher')
    .eq('targeted_department', dept)
    .order('created_at', { ascending: true })

  // Teacher's own event drafts
  const { data: ownDrafts } = await supabase
    .from('events')
    .select('id, title, description, club_name, location, event_date, created_at')
    .eq('created_by', user?.id || '')
    .eq('approval_status', 'draft')
    .order('created_at', { ascending: false })

  // Post-Event IIC Reports pending teacher verification (assigned to teacher or matching department)
  const { data: allPendingReports } = await supabase
    .from('iic_event_reports')
    .select('*, events(title, club_name, event_date, location, assigned_faculty_id, event_category)')
    .in('status', ['pending_faculty', 'approved_faculty'])
    .order('generated_at', { ascending: true })

  const pendingIICReports = allPendingReports?.filter(r => 
    r.department === dept || (r.events as any)?.assigned_faculty_id === user?.id
  ) || []

  // PR Approved Post-Event Reports (status = 'completed')
  const { data: completedReports } = await supabase
    .from('reports')
    .select('*, events(title, club_name, targeted_department)')
    .eq('status', 'completed')
    .order('updated_at', { ascending: false })

  const standardReports = completedReports?.filter(r => (r.events as any)?.targeted_department === dept) || []

  // Fetch IIC reports that are approved or pending HOD approval (status in ['pending_hod', 'approved_faculty', 'approved'])
  const { data: allApprovedIICReports } = await supabase
    .from('iic_event_reports')
    .select('*, events(title, club_name, event_date, location, assigned_faculty_id, event_category)')
    .in('status', ['pending_hod', 'approved_faculty', 'approved'])
    .order('generated_at', { ascending: false })

  const approvedDeptIICReports = allApprovedIICReports?.filter(r => 
    r.department === dept || (r.events as any)?.assigned_faculty_id === user?.id
  ) || []

  // Combine standard completed reports and IIC reports that are approved or pushed by faculty
  const deptReports = [
    ...standardReports.map(r => ({
      id: r.id,
      status: r.status,
      updated_at: r.updated_at,
      events: r.events,
      content: r.content,
      isIIC: false,
      eventId: r.event_id
    })),
    ...(approvedDeptIICReports || []).map(r => ({
      id: r.id,
      status: r.status,
      updated_at: r.generated_at,
      events: {
        title: r.activity_name,
        club_name: (r.events as any)?.club_name || 'IIC Committee',
        targeted_department: r.department
      },
      content: { summary: r.summary },
      isIIC: true,
      eventId: r.event_id
    }))
  ].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

  // Events already approved or forwarded to HOD (scoped to department or created by teacher)
  const { data: allApprovedEvents } = await supabase
    .from('events')
    .select('id, title, description, club_name, location, event_date, registration_deadline, max_capacity, status, approval_status, rejection_data, feedback_config, feedback_open, targeted_department, banner_url, is_public, discussion_enabled, thread_mode, created_by, created_at, event_category, profiles!created_by(role)')
    .in('approval_status', ['pending_hod', 'approved'])
    .order('event_date', { ascending: false })

  const approvedEvents = allApprovedEvents?.filter(e => 
    e.targeted_department === dept || e.created_by === user?.id
  ) || []

  // Fetch all students in department for Manage Students section
  const { data: allStudents } = await supabase
    .from('profiles')
    .select('id, full_name, usn, department, semester, year, role, created_at, has_backlog, year_back, username')
    .eq('role', 'student')
    .eq('department', dept)
    .order('full_name')

  return (
    <div className="space-y-16 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0a0a0a] flex items-center justify-center shadow-lg">
              <User size={20} className="text-white" />
            </div>
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-zinc-500 font-bold">Faculty Overview</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-[#0a0a0a] dark:text-white leading-none uppercase">{personalizedGreeting}</h1>
          <p className="max-w-md text-zinc-500 font-medium italic text-lg leading-relaxed border-l-4 border-black dark:border-white pl-4">
            "Ensuring club activities align with institutional standards and student safety."
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Link href="/teacher/events/create" className="flex items-center gap-3 px-6 py-4 bg-amber-500 text-white hover:bg-amber-600 rounded-3xl transition-all font-bold text-sm shadow-lg group">
            <PlusCircle size={20} className="group-hover:rotate-90 transition-transform" />
            <span>CREATE EVENT</span>
          </Link>
          <Link href="/dashboard/cert" className="flex items-center gap-3 px-6 py-4 bg-[#0a0a0a] text-white hover:bg-zinc-800 rounded-3xl transition-all font-bold text-sm shadow-lg group">
            <Award size={20} className="group-hover:animate-bounce text-white" />
            <span className="text-white">CERTIFICATE GENERATOR</span>
          </Link>
        </div>
      </div>

      <div className="space-y-20">
        {/* Verification Queue */}
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <ShieldAlert size={20} className="text-amber-600" />
            </div>
            <h2 className="text-lg font-black uppercase tracking-tighter text-zinc-800 dark:text-zinc-200">Pending Actions ({pendingEvents?.length || 0})</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pendingEvents && pendingEvents.length > 0 ? (
              pendingEvents.map(event => (
                <div key={event.id} className="group bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-8 hover:shadow-2xl hover:border-[#0a0a0a] dark:hover:border-white transition-all cursor-pointer relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black text-[#0a0a0a] dark:text-white leading-tight group-hover:underline transition-all uppercase tracking-tighter">{event.title}</h3>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest">{event.club_name}</p>
                        {(Array.isArray(event.profiles) ? event.profiles[0] : event.profiles)?.role === 'teacher' ? (
                          <span className="px-2 py-0.5 text-[8px] font-mono font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-md border border-blue-200 dark:border-blue-800/30">TEACHER</span>
                        ) : (
                          <span className="px-2 py-0.5 text-[8px] font-mono font-bold uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-md border border-purple-200 dark:border-purple-800/30">STUDENT</span>
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/teacher/verify/${event.id}`}
                      className="bg-[#0a0a0a] text-white w-12 h-12 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl"
                    >
                      <ArrowRight size={20} />
                    </Link>
                  </div>
                  <div className="space-y-4">
                    <p className="text-sm text-zinc-500 font-medium leading-relaxed line-clamp-3 italic">
                      {event.description}
                    </p>
                    <div className="pt-4 border-t border-zinc-100 flex items-center gap-4 text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                      <span>{new Date(event.created_at).toLocaleDateString()}</span>
                      <span className="w-1 h-1 rounded-full bg-zinc-200"></span>
                      <span>{event.location}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-24 text-center bg-zinc-50/50 dark:bg-zinc-900/30 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[3rem]">
                <CheckCircle size={40} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-6" />
                <p className="text-zinc-600 dark:text-zinc-400 font-black text-xl uppercase tracking-widest">Queue Clear</p>
                <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-2">No pending proposals awaiting your verification.</p>
              </div>
            )}
          </div>
        </div>

        {/* Saved Drafts */}
        {ownDrafts && ownDrafts.length > 0 && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-zinc-500/10 rounded-lg">
                <FileText size={20} className="text-zinc-600 dark:text-zinc-400" />
              </div>
              <h2 className="text-lg font-black uppercase tracking-tighter text-zinc-800 dark:text-zinc-200">Saved Drafts ({ownDrafts.length})</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {ownDrafts.map(draft => (
                <div key={draft.id} className="group bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-8 hover:shadow-2xl hover:border-black dark:hover:border-white transition-all cursor-pointer relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-zinc-400"></div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black text-[#0a0a0a] dark:text-white leading-tight group-hover:underline transition-all uppercase tracking-tighter">{draft.title}</h3>
                      <p className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest">{draft.club_name}</p>
                    </div>
                    <Link
                      href={`/teacher/events/${draft.id}/edit`}
                      className="bg-[#0a0a0a] text-white w-12 h-12 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl"
                    >
                      <ArrowRight size={20} />
                    </Link>
                  </div>
                  <div className="space-y-4">
                    <p className="text-sm text-zinc-500 font-medium leading-relaxed line-clamp-3 italic">
                      {draft.description || 'No description provided.'}
                    </p>
                    <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/50 flex items-center gap-4 text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                      <span>Saved: {new Date(draft.created_at).toLocaleDateString()}</span>
                      <span className="w-1 h-1 rounded-full bg-zinc-200"></span>
                      <span>{draft.location || 'No location set'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* IIC Post-Event Reports Queue */}
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <FileText size={20} className="text-emerald-600" />
            </div>
            <h2 className="text-lg font-black uppercase tracking-tighter text-zinc-800 dark:text-zinc-200"> post event report audit ({pendingIICReports?.length || 0})</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pendingIICReports && pendingIICReports.length > 0 ? (
              pendingIICReports.map(report => (
                <div key={report.id} className="group bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-8 hover:shadow-2xl hover:border-emerald-500 dark:hover:border-emerald-500 transition-all cursor-pointer relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black text-[#0a0a0a] dark:text-white leading-tight group-hover:underline transition-all uppercase tracking-tighter">{report.activity_name}</h3>
                      <p className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest">{report.events?.club_name || 'IIC Committee'}</p>
                    </div>
                    <Link
                      href={`/teacher/reports/iic/${report.id}`}
                      className="bg-[#0a0a0a] text-white w-12 h-12 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl"
                    >
                      <ArrowRight size={20} />
                    </Link>
                  </div>
                  <div className="space-y-4">
                    <p className="text-sm text-zinc-500 font-medium leading-relaxed line-clamp-3 italic">
                      {report.summary}
                    </p>
                    <div className="pt-4 border-t border-zinc-100 flex items-center gap-4 text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                      <span>{report.level} Level</span>
                      <span className="w-1 h-1 rounded-full bg-zinc-200"></span>
                      <span>Quarter: {report.quarter}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-16 text-center bg-zinc-50/50 dark:bg-zinc-900/30 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[3rem]">
                <CheckCircle size={32} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-4" />
                <p className="text-zinc-600 dark:text-zinc-400 font-black text-md uppercase tracking-widest">Queue Clear</p>
                <p className="text-zinc-400 dark:text-zinc-500 text-xs mt-2">No IIC post-event reports awaiting your verification.</p>
              </div>
            )}
          </div>
        </div>

        {/* APPROVED REPORTS Queue/Archive */}
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <FileText size={20} className="text-indigo-600" />
            </div>
            <h2 className="text-lg font-black uppercase tracking-tighter text-zinc-800 dark:text-zinc-200">APPROVED REPORTS ({deptReports.length})</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {deptReports.length > 0 ? (
              deptReports.map(report => (
                <div key={report.id} className="group bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-8 hover:shadow-2xl hover:border-indigo-500 dark:hover:border-indigo-500 transition-all relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black text-[#0a0a0a] dark:text-white leading-tight uppercase tracking-tighter">{(report.events as any)?.title || 'Untitled Event'}</h3>
                      <p className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest">{(report.events as any)?.club_name || 'Club'}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-sm text-zinc-500 font-medium leading-relaxed line-clamp-3 italic">
                      {(report.content as any)?.summary || 'No summary available.'}
                    </p>
                    <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/50 flex items-center gap-4 text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {report.isIIC 
                          ? (report.status === 'approved' ? 'HOD APPROVED' : 'FACULTY APPROVED') 
                          : 'PR APPROVED'}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-zinc-200"></span>
                      <span>{new Date(report.updated_at).toLocaleDateString()}</span>
                    </div>

                    {/* Download options */}
                    <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800/50 flex gap-3 mt-4">
                      {report.isIIC ? (
                        <>
                          <a
                            href={`/api/reports/${report.id}/download`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-1.5 py-3 px-3 border border-zinc-300 dark:border-zinc-700 hover:border-black dark:hover:border-white rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider text-[#0a0a0a] dark:text-white transition-colors"
                          >
                            <FileDown size={12} />
                            Report PDF
                          </a>
                          <a
                            href={`/api/reports/${report.id}/download-docx`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-1.5 py-3 px-3 border border-zinc-300 dark:border-zinc-700 hover:border-black dark:hover:border-white rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider text-[#0a0a0a] dark:text-white transition-colors"
                          >
                            <FileText size={12} />
                            Report Word
                          </a>
                        </>
                      ) : (
                        <Link
                          href={`/teacher/reports/${report.id}`}
                          className="flex-1 flex items-center justify-center gap-1.5 py-3 px-3 border border-zinc-300 dark:border-zinc-700 hover:border-black dark:hover:border-white rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider text-[#0a0a0a] dark:text-white transition-colors"
                        >
                          <FileText size={12} />
                          View Report
                        </Link>
                      )}
                      <Link
                        href={`/cc/events/${report.eventId}`}
                        className="flex-1 flex items-center justify-center gap-1.5 py-3 px-3 bg-black hover:bg-zinc-800 text-white rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all"
                      >
                        <FileDown size={12} />
                        Event Bundle
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-16 text-center bg-zinc-50/50 dark:bg-zinc-900/30 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[3rem]">
                <CheckCircle size={32} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-4" />
                <p className="text-zinc-600 dark:text-zinc-400 font-black text-md uppercase tracking-widest">No Reports</p>
                <p className="text-zinc-400 dark:text-zinc-500 text-xs mt-2">No approved post-event reports for your department.</p>
              </div>
            )}
          </div>
        </div>

        {/* Venue Availability Feeds */}
        <VenueAvailabilityManager />

        {/* Club Member & Role Management */}
        <ClubManager />

        {/* Manage Students Section */}
        <ManageStudentsPanel
          students={(allStudents || []) as Profile[]}
          dept={dept}
        />

        {/* Verified & Approved Events */}
        <div className="space-y-8 pb-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
              <CheckCircle size={20} className="text-black dark:text-white" />
            </div>
            <h2 className="text-lg font-black uppercase tracking-tighter text-zinc-800 dark:text-zinc-200">Verified &amp; Live Events</h2>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-sm">
            {approvedEvents && approvedEvents.length > 0 ? (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {approvedEvents.map(event => (
                  <div key={event.id} className="bg-white dark:bg-zinc-900 p-8 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                    <div className="space-y-1">
                      <h4 className="text-xl font-black text-[#0a0a0a] dark:text-white uppercase tracking-tighter group-hover:underline transition-all">{event.title}</h4>
                      <div className="flex items-center gap-3 font-mono text-[10px] uppercase text-zinc-500 tracking-widest">
                        <span className="text-zinc-400 font-bold">{event.club_name}</span>
                        <span>•</span>
                        <span>Event: {new Date(event.event_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {(Array.isArray(event.profiles) ? event.profiles[0] : event.profiles)?.role === 'teacher' ? (
                        <div className="px-4 py-1.5 rounded-full font-mono text-[9px] uppercase tracking-widest font-bold border bg-blue-500/10 text-blue-600 border-blue-500/20">
                          TEACHER
                        </div>
                      ) : (
                        <div className="px-4 py-1.5 rounded-full font-mono text-[9px] uppercase tracking-widest font-bold border bg-purple-500/10 text-purple-600 border-purple-500/20">
                          STUDENT
                        </div>
                      )}
                      <div className={`px-4 py-1.5 rounded-full font-mono text-[9px] uppercase tracking-widest font-bold border ${event.approval_status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
                        }`}>
                        {event.approval_status === 'approved' ? 'PUBLISHED' : 'HOD PENDING'}
                      </div>
                      <Link href={`/teacher/verify/${event.id}`} className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-[#0a0a0a] dark:hover:border-white transition-colors">
                        <ArrowRight size={16} className="dark:text-zinc-400" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-20 text-center bg-zinc-50/50 dark:bg-zinc-900/30">
                <p className="text-zinc-400 dark:text-zinc-500 font-mono text-xs uppercase tracking-widest italic">No historical data found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
