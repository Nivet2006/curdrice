import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Monitor, Smartphone, Globe, Clock, User, Fingerprint } from 'lucide-react'
import Link from 'next/link'
import { AuditManagement } from '@/components/admin/AuditManagement'

function parseUA(ua: string) {
  if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) return { type: 'Mobile', icon: <Smartphone size={14} /> }
  return { type: 'Desktop', icon: <Monitor size={14} /> }
}

export default async function AdminLogsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const { data: logs } = await supabase
    .from('audit_logs')
    .select('*, profiles:user_id(full_name, usn)')
    .order('created_at', { ascending: false })
    .limit(500)

  // Grouping by session_id
  const sessions: Record<string, any[]> = {}
  logs?.forEach(log => {
     if (!sessions[log.session_id]) sessions[log.session_id] = []
     sessions[log.session_id].push(log)
  })

  const sessionList = Object.entries(sessions).map(([id, items]) => ({
     id,
     ip: items[0].ip_address,
     ua: items[0].user_agent,
     user: items[0].profiles,
     startTime: items[items.length - 1].created_at,
     lastSeen: items[0].created_at,
     events: items
  })).sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())

  return (
    <div className="max-w-[1400px] mx-auto space-y-12 pb-32">
       <header className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-mono font-black uppercase text-zinc-400 tracking-widest leading-none">
             <Fingerprint size={12} />
             Security & Audit Logs
          </div>
          <h1 className="text-6xl font-black tracking-tightest leading-[0.8] uppercase">Intelligence Portal</h1>
          <p className="font-mono text-xs text-zinc-500 uppercase tracking-tight">Real-time session tracking and behavioral forensics across the platform.</p>
       </header>

       <AuditManagement logs={logs || []} />

       <div className="grid grid-cols-1 gap-8">
          {sessionList.map(session => {
             const uaInfo = parseUA(session.ua);
             return (
                <div key={session.id} className="group bg-white border-2 border-black rounded-[2.5rem] overflow-hidden shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:translate-y-[-4px] hover:translate-x-[-4px] hover:shadow-[12px_12px_0px_rgba(0,0,0,1)] transition-all">
                   <div className="p-8 border-b-2 border-black bg-zinc-50 flex flex-wrap items-center justify-between gap-6">
                      <div className="flex items-center gap-6">
                         <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center">
                            {uaInfo.icon}
                         </div>
                         <div>
                            <div className="flex items-center gap-2">
                               <h3 className="font-black text-xl tracking-tight uppercase">{session.user?.full_name || 'Guest User'}</h3>
                               {session.user?.usn && <span className="bg-black text-white text-[10px] font-mono px-2 py-0.5 rounded-sm">{session.user.usn}</span>}
                            </div>
                            <div className="flex items-center gap-3 font-mono text-[10px] text-zinc-500 uppercase font-black">
                               <span className="flex items-center gap-1"><Globe size={10} /> {session.ip}</span>
                               <span>•</span>
                               <span>Session: {session.id.slice(0, 8)}</span>
                            </div>
                         </div>
                      </div>
                      <div className="flex items-center gap-8">
                         <div className="text-right">
                           <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-1">Last Interaction</p>
                           <p className="font-black text-sm uppercase">{new Date(session.lastSeen).toLocaleTimeString()}</p>
                         </div>
                         <div className="text-right">
                           <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-1">Device Type</p>
                           <p className="font-black text-sm uppercase">{uaInfo.type}</p>
                         </div>
                      </div>
                   </div>

                   <div className="p-8">
                      <div className="space-y-4">
                         <h4 className="text-[10px] font-mono font-black text-zinc-300 uppercase tracking-[0.3em] mb-4">Activity Timeline</h4>
                         <div className="space-y-2">
                            {session.events.slice(0, 10).map((event: any, i: number) => (
                               <div key={event.id} className="flex items-center justify-between py-3 border-b border-zinc-100 last:border-0 group/row hover:bg-zinc-50 transition-all rounded-xl px-4">
                                  <div className="flex items-center gap-4">
                                     <span className="font-mono text-[9px] text-zinc-300 font-bold">{new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                     <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-sm border ${
                                        event.action_type === 'NAVIGATION' ? 'bg-zinc-100 text-zinc-500 border-zinc-200' : 'bg-emerald-500 text-white border-emerald-600'
                                     }`}>
                                        {event.action_type}
                                     </span>
                                     <span className="font-mono text-xs font-bold text-black group-hover/row:translate-x-1 transition-transform">{event.resource_path}</span>
                                  </div>
                                  <div className="text-[10px] font-mono text-zinc-400 italic">
                                     {JSON.stringify(event.metadata)}
                                  </div>
                               </div>
                            ))}
                            {session.events.length > 10 && (
                               <p className="text-[10px] font-mono text-zinc-300 uppercase text-center pt-4 italic">+ {session.events.length - 10} more forensic artifacts in this sequence</p>
                            )}
                         </div>
                      </div>
                   </div>
                </div>
             )
          })}
       </div>
    </div>
  )
}
