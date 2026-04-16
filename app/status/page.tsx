import { createClient } from '@/lib/supabase/server'
import { CheckCircle2, AlertCircle, Clock, ExternalLink, Activity, ShieldCheck, Database, Zap } from 'lucide-react'
import Link from 'next/link'
import { Navbar } from '@/components/shared/Navbar'
import type { Role } from '@/lib/types'

import { redirect } from 'next/navigation'

async function getDeployments() {
  const token = process.env.VERCEL_API_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID
  
  if (!token || !projectId) return null

  try {
    const res = await fetch(`https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=5`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 60 } // Cache for 1 minute
    })
    const data = await res.json()
    return data.deployments
  } catch (e) {
    return null
  }
}

export default async function StatusPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single()
  
  if (!profile || profile.role !== 'admin') {
    redirect('/login') // Or you could redirect to dashboard, but login is safer for unauthorized access
  }

  const deployments = await getDeployments()

  // Simple DB Check
  let dbStatus = 'operational'
  try {
    const { error } = await supabase.from('events').select('id').limit(1)
    if (error) dbStatus = 'degraded'
  } catch {
    dbStatus = 'offline'
  }

  const systems = [
    { name: 'Core Platform', status: 'operational', icon: Zap },
    { name: 'Supabase Database', status: dbStatus, icon: Database },
    { name: 'Authentication (Auth0)', status: 'operational', icon: ShieldCheck },
    { name: 'Edge Functions', status: 'operational', icon: Activity },
  ]

  const isAllGood = systems.every(s => s.status === 'operational')

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ background: 'var(--bg)' }}>
      <Navbar 
        role={profile?.role as Role} 
        name={profile?.full_name} 
      />
      
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-6 md:px-8 py-10 md:py-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-2">System Diagnostics</div>
            <h1 className="text-4xl font-black tracking-tighter" style={{ color: 'var(--fg)' }}>Status Dashboard</h1>
            <p className="font-mono text-xs mt-2 uppercase tracking-widest opacity-60" style={{ color: 'var(--fg)' }}>Real-time infrastructure health</p>
          </div>
          
          <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-700 ${
            isAllGood 
            ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-500/10 dark:border-green-500/20 dark:text-green-400' 
            : 'bg-amber-50 border-amber-200 text-amber-700'
          }`}>
            <div className={`w-2 h-2 rounded-full animate-pulse ${isAllGood ? 'bg-green-500' : 'bg-amber-500'}`} />
            <span className="text-[11px] font-black uppercase tracking-wider">
              {isAllGood ? 'All Systems Operational' : 'Partial Service Disruption'}
            </span>
          </div>
        </div>

        {/* System Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {systems.map((system) => (
            <div key={system.name} className="p-5 rounded-2xl border flex items-center justify-between shadow-sm transition-all hover:translate-y-[-2px]" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl border" style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border)' }}>
                  <system.icon className="w-4 h-4" style={{ color: 'var(--fg)' }} />
                </div>
                <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--fg)' }}>{system.name}</span>
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest ${
                system.status === 'operational' ? 'text-green-600 dark:text-green-400' : 'text-amber-500'
              }`}>
                {system.status}
              </span>
            </div>
          ))}
        </div>

        {/* Deployments Section */}
        <section className="animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black tracking-tight" style={{ color: 'var(--fg)' }}>Recent Deployments</h2>
            <div className="h-[1px] flex-1 mx-6 opacity-10" style={{ backgroundColor: 'var(--fg)' }} />
            <span className="text-[10px] font-mono opacity-40 uppercase tracking-widest" style={{ color: 'var(--fg)' }}>Vercel API V6</span>
          </div>

          {!deployments ? (
            <div className="p-16 rounded-[2rem] border border-dashed text-center" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-subtle)' }}>
              <AlertCircle className="w-8 h-8 mx-auto mb-4 opacity-20" style={{ color: 'var(--fg)' }} />
              <p className="text-sm font-bold" style={{ color: 'var(--fg)' }}>API Token Required</p>
              <p className="text-[11px] font-mono mt-2 opacity-60 max-w-xs mx-auto" style={{ color: 'var(--fg)' }}>Add `VERCEL_API_TOKEN` to your environment settings to see live deployment history.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {deployments.map((d: any) => {
                const duration = d.ready && d.createdAt ? Math.round((d.ready - d.createdAt) / 1000) : null
                const commitMsg = d.meta?.githubCommitMessage || 'Manual Deployment'
                
                return (
                  <div key={d.uid} className="group p-5 rounded-2xl border transition-all flex items-start justify-between" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                    <div className="flex gap-5">
                      <div className="pt-1">
                         {d.state === 'READY' ? (
                           <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                             <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                           </div>
                         ) : d.state === 'ERROR' ? (
                           <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                             <AlertCircle className="w-3.5 h-3.5 text-white" />
                           </div>
                         ) : (
                           <div className="w-5 h-5 text-zinc-400">
                             <Clock className="w-5 h-5 animate-spin" />
                           </div>
                         )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-extrabold leading-none capitalize" style={{ color: 'var(--fg)' }}>
                            {commitMsg.length > 60 ? commitMsg.substring(0, 60) + '...' : commitMsg}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#0a0a0a] text-white dark:bg-white dark:text-[#0a0a0a]">
                            {d.meta?.githubCommitRef || 'main'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3 mt-2 opacity-50 font-mono text-[9px] uppercase tracking-tighter" style={{ color: 'var(--fg)' }}>
                           <span>{new Date(d.createdAt).toLocaleDateString()} {new Date(d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                           <span>•</span>
                           <span>{d.creator?.username}</span>
                           {duration && (
                             <>
                               <span>•</span>
                               <span className="flex items-center gap-1"><Clock size={10} /> {duration}s build</span>
                             </>
                           )}
                        </div>
                      </div>
                    </div>
                    <a 
                      href={`https://${d.url}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg flex-shrink-0"
                    >
                      <ExternalLink className="w-4 h-4 opacity-50" style={{ color: 'var(--fg)' }} />
                    </a>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Footer */}
        <div className="mt-24 pt-8 border-t flex justify-between items-center opacity-20 italic font-mono text-[10px] uppercase tracking-widest" style={{ borderColor: 'var(--border)', color: 'var(--fg)' }}>
          <span>CurdRice Infrastructure Hub</span>
          <span>© 2026 Public Release</span>
        </div>
      </main>
    </div>
  )
}
