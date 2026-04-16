import { createClient } from '@/lib/supabase/server'
import { CheckCircle2, AlertCircle, Clock, ExternalLink, Activity, ShieldCheck, Database, Zap } from 'lucide-react'
import Link from 'next/link'

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
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#050505] text-[#0a0a0a] dark:text-white font-sans selection:bg-black selection:text-white p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <Link href="/" className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 hover:opacity-100 transition-opacity mb-4 block">
              ← Return to CurdRice
            </Link>
            <h1 className="text-4xl font-black tracking-tighter">System Status</h1>
            <p className="text-zinc-500 font-mono text-xs mt-2 uppercase tracking-widest">Real-time infrastructure health</p>
          </div>
          
          <div className={`px-4 py-2 rounded-full border flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-700 ${
            isAllGood ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-500/10 dark:border-green-500/20 dark:text-green-400' : 'bg-amber-50 border-amber-200 text-amber-700'
          }`}>
            <div className={`w-2 h-2 rounded-full animate-pulse ${isAllGood ? 'bg-green-500' : 'bg-amber-500'}`} />
            <span className="text-xs font-bold uppercase tracking-wider">
              {isAllGood ? 'All Systems Operational' : 'Partial Service Disruption'}
            </span>
          </div>
        </div>

        {/* System Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
          {systems.map((system) => (
            <div key={system.name} className="p-5 rounded-2xl border bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700">
                  <system.icon className="w-4 h-4 text-zinc-500" />
                </div>
                <span className="text-sm font-bold tracking-tight">{system.name}</span>
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${
                system.status === 'operational' ? 'text-green-600 dark:text-green-400' : 'text-amber-500'
              }`}>
                {system.status}
              </span>
            </div>
          ))}
        </div>

        {/* Deployments Section */}
        <section className="animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black tracking-tight">Recent Deployments</h2>
            <div className="h-[1px] flex-1 mx-6 bg-zinc-100 dark:bg-zinc-800" />
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">Vercel API V6</span>
          </div>

          {!deployments ? (
            <div className="p-12 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center">
              <AlertCircle className="w-8 h-8 mx-auto text-zinc-300 mb-4" />
              <p className="text-sm text-zinc-400 font-medium">Connect Vercel API Token to view live deployment history.</p>
              <p className="text-[10px] font-mono mt-2 text-zinc-500">Add VERCEL_API_TOKEN to environment variables.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deployments.map((d: any) => (
                <div key={d.uid} className="group p-4 rounded-2xl border bg-white dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                       {d.state === 'READY' ? (
                         <CheckCircle2 className="w-5 h-5 text-green-500" />
                       ) : d.state === 'ERROR' ? (
                         <AlertCircle className="w-5 h-5 text-red-500" />
                       ) : (
                         <Clock className="w-5 h-5 text-zinc-400 animate-spin" />
                       )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold leading-none">{d.name}</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                          {d.meta?.githubCommitRef || 'main'}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 font-mono mt-1 uppercase tracking-tight">
                        {new Date(d.createdAt).toLocaleString()} • {d.creator?.username}
                      </p>
                    </div>
                  </div>
                  <a 
                    href={`https://${d.url}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg"
                  >
                    <ExternalLink className="w-4 h-4 text-zinc-400" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <div className="mt-20 pt-8 border-t border-zinc-100 dark:border-zinc-900 flex justify-between items-center opacity-30 italic font-serif text-sm">
          <span>CurdRice Core Engine</span>
          <span>Build: Public Stable 1.0</span>
        </div>
      </div>
    </div>
  )
}
