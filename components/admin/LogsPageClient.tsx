'use client'
import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { Monitor, Smartphone, Globe, Clock, Trash2, Download, Filter, X, Search, ChevronDown, ChevronUp, Fingerprint, AlertTriangle, Loader2, RefreshCw } from 'lucide-react'
import { drainLogs, clearByIP, clearByDateRange } from '../../app/admin/logs/actions'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'

// ── Types ──────────────────────────────────────────────────────
interface LogEntry {
  id: string
  created_at: string
  session_id: string
  user_id?: string
  user_email?: string
  user_name?: string
  user_role?: string
  ip_address: string
  user_agent: string
  action_type: string
  resource_path: string
  metadata: any
  duration_ms?: number
  status_code?: number
}

// ── Main Component ─────────────────────────────────────────────
export function LogsPageClient() {
  const supabaseBrowser = createClient()
  const searchParams = useSearchParams()

  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [groupBy, setGroupBy] = useState<'session' | 'ip' | 'user'>('session')
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)
  
  // States for the management modal
  const [showDrainModal, setShowDrainModal] = useState(false)
  const [drainMode, setDrainMode] = useState<'all' | 'ip' | 'daterange'>('all')
  const [drainIP, setDrainIP] = useState('')
  const [draining, setDraining] = useState(false)

  // Polling logic
  const POLL_INTERVAL = 10000 // 10 seconds
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const fetchLogs = useCallback(async (isAuto = false) => {
    if (!isAuto) setLoading(true)
    else setIsRefreshing(true)

    try {
      let query = supabaseBrowser
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000)

      const from = searchParams.get('from')
      const to = searchParams.get('to')
      const ip = searchParams.get('ip')
      const user = searchParams.get('user')
      const action = searchParams.get('action')

      if (from) query = query.gte('created_at', from)
      if (to) query = query.lte('created_at', to)
      if (ip) query = query.ilike('ip_address', `%${ip}%`)
      if (user) query = query.or(`user_email.ilike.%${user}%,user_name.ilike.%${user}%`)
      if (action && action !== 'ALL') query = query.eq('action_type', action)

      const { data, error: fetchError } = await query
      if (fetchError) throw fetchError

      setLogs(data || [])
      setLastUpdated(new Date())
      setError(null)
    } catch (err: any) {
      console.error('Fetch error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [searchParams, supabaseBrowser])

  useEffect(() => {
    fetchLogs()
    
    // Start polling
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => fetchLogs(true), POLL_INTERVAL)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [fetchLogs])

  // Stats calculation
  const stats = useMemo(() => ({
    total: logs.length,
    uniqueIPs: new Set(logs.map(l => l.ip_address)).size,
    uniqueSessions: new Set(logs.map(l => l.session_id)).size,
    mutations: logs.filter(l => l.action_type === 'MUTATION').length,
  }), [logs])

  // Group the filtered logs
  const groups = useMemo(() => {
    const map: Record<string, LogEntry[]> = {}
    logs.forEach(l => {
      const key = groupBy === 'session' ? l.session_id
        : groupBy === 'ip' ? l.ip_address
        : (l.user_email || 'anonymous')
      if (!map[key]) map[key] = []
      map[key].push(l)
    })
    return Object.entries(map)
      .map(([key, items]) => ({
        key,
        items: items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
        ip: items[0]?.ip_address,
        ua: items[0]?.user_agent,
        user: items[0]?.user_name || items[0]?.user_email,
        role: items[0]?.user_role,
        lastSeen: items[0]?.created_at,
        firstSeen: items[items.length - 1]?.created_at,
      }))
      .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())
  }, [logs, groupBy])

  async function handleDrain() {
    setDraining(true)
    try {
      if (drainMode === 'all') await drainLogs('all')
      else if (drainMode === 'ip') await clearByIP(drainIP)
      else if (drainMode === 'daterange') {
        const from = searchParams.get('from')
        const to = searchParams.get('to')
        await clearByDateRange(from || '', to || '')
      }
      fetchLogs() // Manual refresh after drain
    } finally {
      setDraining(false)
      setShowDrainModal(false)
    }
  }

  // Visual helper
  function parseUA(ua: string) {
    if (/Mobile|Android|iPhone|iPad/i.test(ua)) return { type: 'Mobile', icon: '📱' }
    if (/curl|python|node/i.test(ua)) return { type: 'Bot/API', icon: '🤖' }
    return { type: 'Desktop', icon: '💻' }
  }

  const actionColors: Record<string, string> = {
    NAVIGATION: 'bg-zinc-100 text-zinc-600 border-zinc-200',
    MUTATION: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    AUTH: 'bg-blue-100 text-blue-700 border-blue-300',
    ERROR: 'bg-red-100 text-red-700 border-red-300',
    DOWNLOAD: 'bg-purple-100 text-purple-700 border-purple-300',
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-black" />
        <p className="font-black uppercase tracking-widest text-zinc-400">Restoring Audit Sequences...</p>
      </div>
    )
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 pb-32 p-4 pt-10">

      {/* ── Header ── */}
      <header className="space-y-3 relative">
        <div className="flex items-center gap-2 text-[10px] font-mono font-black uppercase text-zinc-400 tracking-widest leading-none">
          <Fingerprint size={12} />
          Security & Audit — Real-time Forensic Stream
        </div>
        <h1 className="text-6xl font-black tracking-tighter leading-none uppercase">Intelligence Portal</h1>
        <div className="flex items-center gap-4 mt-2">
            <p className="font-mono text-xs text-zinc-400 uppercase tracking-tight">
            Behavioral forensics · Managed log store access
            </p>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border-2 border-black text-[10px] font-black uppercase transition-all ${isRefreshing ? 'bg-emerald-100' : 'bg-zinc-50'}`}>
                <div className={`w-2 h-2 rounded-full ${isRefreshing ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-500'}`} />
                {isRefreshing ? 'Synchronizing...' : `Last Sync: ${lastUpdated?.toLocaleTimeString()}`}
                <button 
                    onClick={() => fetchLogs(false)}
                    disabled={isRefreshing}
                    className="ml-2 pl-2 border-l-2 border-black/10 hover:text-emerald-600 transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                    <RefreshCw size={10} className={isRefreshing ? 'animate-spin' : ''} />
                    Sync Now
                </button>
            </div>
        </div>
      </header>

      {/* ── Stats Bar ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Live Events', value: stats.total },
          { label: 'Active Sessions', value: stats.uniqueSessions },
          { label: 'Unique Identifiers', value: stats.uniqueIPs },
          { label: 'System Mutations', value: stats.mutations },
        ].map(s => (
          <div key={s.label} className="bg-black text-white rounded-2xl p-6 border border-zinc-800">
            <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-400 mb-1">{s.label}</p>
            <p className="text-4xl font-black">{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Controls Row ── */}
      <FilterBar searchParams={searchParams} />

      {/* ── Group By + Export + Drain ── */}
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400">Categorization:</span>
          {(['session', 'ip', 'user'] as const).map(g => (
            <button key={g} onClick={() => setGroupBy(g)}
              className={`text-[10px] font-black uppercase px-5 py-2 rounded-xl border-2 transition-all active:scale-95 shadow-sm ${groupBy === g ? 'bg-black text-white border-black' : 'bg-white border-zinc-200 hover:border-black'}`}>
              {g}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {/* Export buttons */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1">
                <Download size={12} /> Data Extraction:
            </span>
            <button onClick={() => exportCSV(logs)}
              className="text-[10px] font-black uppercase px-4 py-2 rounded-xl border-2 border-zinc-200 bg-white hover:border-black transition-all active:scale-95">
              CSV
            </button>
            <button onClick={() => exportJSON(logs)}
              className="text-[10px] font-black uppercase px-4 py-2 rounded-xl border-2 border-zinc-200 bg-white hover:border-black transition-all active:scale-95">
              JSON
            </button>
          </div>

          <div className="w-[1px] h-6 bg-zinc-200" />

          {/* Drain button */}
          <button onClick={() => setShowDrainModal(true)}
            className="flex items-center gap-2 bg-rose-600 text-white text-[10px] font-black uppercase px-5 py-2.5 rounded-xl border-2 border-rose-700 hover:bg-rose-700 transition-all active:scale-95 shadow-md">
            <Trash2 size={14} /> Purge Audit Vault
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400 uppercase font-black bg-zinc-50 px-4 py-2 rounded-lg border border-zinc-100 inline-flex">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Mapping {logs.length} behavioral artifacts across {groups.length} identity sequences
      </div>

      {/* ── Session / IP / User Groups ── */}
      <div className="space-y-6">
        {groups.map(group => {
          const uaInfo = parseUA(group.ua || '')
          const isExpanded = expandedGroup === group.key
          const groupMutations = group.items.filter(i => i.action_type === 'MUTATION').length

          return (
            <div key={group.key}
              className={`group/box bg-white border-2 border-black rounded-[2.5rem] overflow-hidden transition-all duration-300 ${
                isExpanded ? 'bg-zinc-50' : 'hover:bg-zinc-50/30'
              }`}>

              {/* Group Header */}
              <button
                className={`w-full p-8 border-b-2 border-black flex flex-wrap items-center justify-between gap-6 text-left transition-colors ${isExpanded ? 'bg-zinc-50' : 'bg-white group-hover/box:bg-zinc-50/50'}`}
                onClick={() => setExpandedGroup(isExpanded ? null : group.key)}
              >
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-black text-white rounded-full flex items-center justify-center text-xl shadow-lg">
                    {uaInfo.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <h3 className="font-black text-2xl uppercase tracking-tight leading-none">
                        {group.user || 'Anonymous Trace'}
                      </h3>
                      {group.role && (
                        <span className="bg-black text-white text-[10px] font-mono px-3 py-1 rounded-lg uppercase font-black leading-none">{group.role}</span>
                      )}
                      {groupMutations > 0 && (
                        <span className="bg-emerald-100 text-emerald-700 border border-emerald-300 text-[10px] font-mono px-3 py-1 rounded-lg uppercase font-black leading-none flex items-center gap-1">
                            <Zap className="w-3 h-3" /> {groupMutations} Mutations
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 font-mono text-[10px] text-zinc-400 uppercase font-bold tracking-tight">
                      <span className="flex items-center gap-1.5"><Globe size={11} className="text-zinc-300" /> {group.ip}</span>
                      <span className="text-zinc-200">|</span>
                      <span>{uaInfo.type} Interface</span>
                      <span className="text-zinc-200">|</span>
                      <span className="text-zinc-500 font-mono">{groupBy === 'session' ? `SID: ${group.key.slice(0, 8)}...` : group.key}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-10">
                  <div className="text-right">
                    <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-1 font-black">Latest Sequence</p>
                    <p className="font-black text-base uppercase leading-none">{new Date(group.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-1 font-black">Artifact Count</p>
                    <p className="font-black text-3xl leading-none">{group.items.length}</p>
                  </div>
                  <div className={`p-2 rounded-full border-2 border-black transition-transform duration-300 ${isExpanded ? 'bg-black text-white rotate-180' : 'bg-white'}`}>
                      <ChevronDown size={20} />
                  </div>
                </div>
              </button>

              {/* Expanded Timeline */}
              {isExpanded && (
                <div className="p-10 bg-white">
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-mono font-black text-zinc-300 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                        <div className="h-[2px] w-6 bg-zinc-200" /> Forensic Sequence timeline
                    </h4>
                    {group.items.map((event, i) => (
                      <div key={event.id}
                        className="flex items-start justify-between py-4 px-6 border-2 border-transparent hover:border-zinc-100 hover:bg-zinc-50/50 rounded-2xl transition-all group/row">
                        <div className="flex items-start gap-6">
                          <div className="pt-1">
                              <div className="w-2 h-2 rounded-full bg-zinc-200 mt-1" />
                          </div>
                          <span className="font-mono text-[10px] text-zinc-400 font-black mt-0.5 min-w-[100px]">
                            {new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                          <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-lg border-2 whitespace-nowrap shadow-sm ${actionColors[event.action_type] || 'bg-zinc-100 border-zinc-200 text-zinc-500'}`}>
                            {event.action_type}
                          </span>
                          <div>
                            <span className="font-mono text-sm font-black text-black group-hover/row:translate-x-1 transition-transform block">
                                {event.resource_path}
                            </span>
                            {event.metadata && Object.keys(event.metadata).length > 0 && (
                                <div className="mt-2 text-[10px] font-mono text-zinc-400 bg-white border border-zinc-100 p-2 rounded-lg max-w-2xl overflow-hidden text-ellipsis italic">
                                    {JSON.stringify(event.metadata)}
                                </div>
                            )}
                          </div>
                        </div>
                        <div className="text-[10px] font-mono text-zinc-300 uppercase font-black">
                            {new Date(event.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {groups.length === 0 && (
          <div className="text-center py-40 bg-zinc-50 border-4 border-dashed border-zinc-200 rounded-[3rem]">
            <X size={48} className="mx-auto text-zinc-200 mb-6" />
            <p className="text-zinc-400 font-black text-xl uppercase tracking-widest">
              No behavioral artifacts detected
            </p>
            <p className="text-zinc-300 font-mono text-xs uppercase mt-2">
              Adjust filters to reveal matching forensic sequences
            </p>
          </div>
        )}
      </div>

      {/* ── Drain Modal ── */}
      {showDrainModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-in fade-in zoom-in duration-300">
          <div className="bg-white border-4 border-black rounded-[3rem] p-12 max-w-lg w-full">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center">
                  <AlertTriangle size={24} />
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tight">Vault Purge</h2>
            </div>

            <p className="text-zinc-500 font-medium text-sm mb-10 leading-relaxed">
                You are about to initiate a destructive sequence. Select the target vector for artifact deletion. This action bypasses standard recovery protocols.
            </p>

            <div className="space-y-4 mb-10">
              {(['all', 'ip', 'daterange'] as const).map(mode => (
                <label key={mode} className={`flex items-center gap-4 p-5 rounded-[1.5rem] border-2 cursor-pointer transition-all active:scale-95 ${drainMode === mode ? 'border-black bg-zinc-50 shadow-md' : 'border-zinc-100 hover:border-zinc-200'}`}>
                  <input type="radio" name="drain" value={mode} checked={drainMode === mode} onChange={() => setDrainMode(mode)} className="w-4 h-4 accent-black" />
                  <span className="font-black uppercase text-sm tracking-tight">
                    {mode === 'all' ? 'Universal Purge (Full Drain)' : mode === 'ip' ? 'Targeted IP scrubbing' : 'Temporal range scrub'}
                  </span>
                </label>
              ))}
            </div>

            {drainMode === 'ip' && (
              <div className="mb-8">
                <label className="text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 mb-2 block">Identity Vector (IP Address)</label>
                <input className="w-full border-2 border-black rounded-xl px-4 py-3 font-mono text-sm outline-none focus:ring-2 ring-zinc-200 transition-all"
                  placeholder="0.0.0.0" value={drainIP} onChange={e => setDrainIP(e.target.value)} />
              </div>
            )}

            <div className="bg-rose-50 border-2 border-rose-100 p-4 rounded-xl mb-8 flex items-start gap-3">
                <AlertTriangle className="text-rose-600 shrink-0 mt-0.5" size={16} />
                <p className="text-[10px] font-mono text-rose-600 uppercase font-black leading-normal">
                    Proceed with caution. All selected behavioral artifacts will be permanently scrubbed from the managed log store. IRREVOCABLE.
                </p>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setShowDrainModal(false)}
                className="flex-1 border-2 border-black rounded-2xl py-4 font-black uppercase text-sm hover:bg-zinc-50 transition-all active:scale-95">
                Abort
              </button>
              <button onClick={handleDrain} disabled={draining}
                className="flex-1 bg-rose-600 text-white border-2 border-rose-700 rounded-2xl py-4 font-black uppercase text-sm hover:bg-rose-700 transition-all disabled:opacity-50 active:scale-95 shadow-lg">
                {draining ? 'Scrubbing...' : 'Confirm Purge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FilterBar({ searchParams }: { searchParams: URLSearchParams }) {
    const [ip, setIp] = useState(searchParams.get('ip') || '')
    const [user, setUser] = useState(searchParams.get('user') || '')
    const [action, setAction] = useState(searchParams.get('action') || 'ALL')
    const [from, setFrom] = useState(searchParams.get('from') || '')
    const [to, setTo] = useState(searchParams.get('to') || '')

    const apply = () => {
        const params = new URLSearchParams()
        if (ip) params.set('ip', ip)
        if (user) params.set('user', user)
        if (action !== 'ALL') params.set('action', action)
        if (from) params.set('from', from)
        if (to) params.set('to', to)
        window.history.pushState({}, '', `?${params.toString()}`)
        window.dispatchEvent(new Event('popstate')) // Trigger searchParams hook update
    }

    const reset = () => {
        setIp(''); setUser(''); setAction('ALL'); setFrom(''); setTo('')
        window.history.pushState({}, '', `/admin/logs`)
        window.dispatchEvent(new Event('popstate'))
    }

    return (
        <div className="flex flex-wrap items-end gap-6 border-2 border-black rounded-[2.5rem] p-8 bg-zinc-50">
            <div className="flex-1 min-w-[200px]">
                <label className="text-[9px] font-mono font-black uppercase tracking-widest text-zinc-400 mb-2 block">IP Address</label>
                <div className="flex items-center border-2 border-black rounded-xl px-4 py-3 bg-white gap-3 focus-within:ring-2 ring-zinc-200 transition-all">
                    <Search size={14} className="text-zinc-400" />
                    <input className="flex-1 text-xs font-mono outline-none bg-transparent" placeholder="192.168.x.x" value={ip} onChange={e => setIp(e.target.value)} />
                </div>
            </div>
            <div className="flex-1 min-w-[200px]">
                <label className="text-[9px] font-mono font-black uppercase tracking-widest text-zinc-400 mb-2 block">User Identification</label>
                <div className="flex items-center border-2 border-black rounded-xl px-4 py-3 bg-white gap-3 focus-within:ring-2 ring-zinc-200 transition-all">
                    <Search size={14} className="text-zinc-400" />
                    <input className="flex-1 text-xs font-mono outline-none bg-transparent" placeholder="Email or Name" value={user} onChange={e => setUser(e.target.value)} />
                </div>
            </div>
            <div>
                <label className="text-[9px] font-mono font-black uppercase tracking-widest text-zinc-400 mb-2 block">Vector</label>
                <select className="border-2 border-black rounded-xl px-4 py-3 text-xs font-mono font-black bg-white outline-none cursor-pointer" value={action} onChange={e => setAction(e.target.value)}>
                    {['ALL', 'NAVIGATION', 'MUTATION', 'AUTH', 'ERROR', 'DOWNLOAD'].map(a => <option key={a}>{a}</option>)}
                </select>
            </div>
            <div>
                <label className="text-[9px] font-mono font-black uppercase tracking-widest text-zinc-400 mb-2 block">Timeline</label>
                <div className="flex items-center gap-2">
                    <input type="datetime-local" className="border-2 border-black rounded-xl px-4 py-3 text-[10px] font-mono bg-white outline-none" value={from} onChange={e => setFrom(e.target.value)} />
                    <span className="text-zinc-400">→</span>
                    <input type="datetime-local" className="border-2 border-black rounded-xl px-4 py-3 text-[10px] font-mono bg-white outline-none" value={to} onChange={e => setTo(e.target.value)} />
                </div>
            </div>
            <div className="flex gap-2">
                <button onClick={apply} className="bg-black text-white rounded-xl px-6 py-3 text-xs font-black uppercase active:scale-95 transition-all">Filter</button>
                <button onClick={reset} className="border-2 border-black rounded-xl px-4 py-3 text-xs font-black uppercase hover:bg-zinc-100 active:scale-95 transition-all"><X size={14}/></button>
            </div>
        </div>
    )
}

function exportCSV(logs: LogEntry[]) {
    const headers = ['id', 'created_at', 'session_id', 'user_email', 'user_name', 'user_role', 'ip_address', 'user_agent', 'action_type', 'resource_path', 'metadata']
    const rows = logs.map(l => headers.map(h => JSON.stringify((l as any)[h] ?? '')).join(','))
    const blob = new Blob([headers.join(',') + '\n' + rows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `curdrice-logs-${Date.now()}.csv`; a.click()
}

function exportJSON(logs: LogEntry[]) {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `curdrice-logs-${Date.now()}.json`; a.click()
}

function Zap(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 14.71 12 3.5v9.33h8l-8 11.17V14.71z" />
      </svg>
    )
}
