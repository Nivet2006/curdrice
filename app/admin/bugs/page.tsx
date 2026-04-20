'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { Download, Save, FileText, Camera, Printer, Trash2 } from 'lucide-react'
import { toPng } from 'html-to-image'

type Report = {
  id: string
  created_at: string
  user_email: string
  page_url: string
  description: string
  click_trail: string[]
  js_errors: string[]
  status: string
  admin_note: string | null
  access_id_used: string | null
}

type AccessId = {
  id: string
  created_at: string
  name: string
  access_id: string
  password: string
  is_active: boolean
}

const STATUSES = ['open', 'in_progress', 'resolved', 'wont_fix']
const STATUS_COLORS: Record<string, string> = {
  open: '#a1a1aa', in_progress: '#f97316', resolved: '#22c55e', wont_fix: '#ef4444',
}

export default function AdminBugsPage() {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<'reports' | 'access'>('reports')
  
  // Reports state
  const [reports, setReports] = useState<Report[]>([])
  const [selected, setSelected] = useState<Report | null>(null)
  const [note, setNote] = useState('')

  // Access ID state
  const [accessIds, setAccessIds] = useState<AccessId[]>([])
  const [newName, setNewName] = useState('')
  const [newId, setNewId] = useState('')
  const [newPass, setNewPass] = useState('')
  const [creating, setCreating] = useState(false)
  const [savingNote, setSavingNote] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editId, setEditId] = useState('')
  const [showShareCard, setShowShareCard] = useState(false)

  useEffect(() => {
    // Fetch reports
    supabase
      .from('bug_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setReports(data as Report[]) })

    // Fetch access IDs
    supabase
      .from('bug_access_ids')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => { 
        if (error) {
          console.error('Error fetching access IDs:', error)
          toast.error('Failed to load access keys')
        }
        if (data) setAccessIds(data as AccessId[]) 
      })

    const reportChannel = supabase
      .channel('admin-bugs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bug_reports' }, (payload) => {
        if (payload.eventType === 'INSERT') setReports(p => [payload.new as Report, ...p])
        if (payload.eventType === 'UPDATE') setReports(p => p.map(r => r.id === payload.new.id ? payload.new as Report : r))
        if (payload.eventType === 'DELETE') setReports(p => p.filter(r => r.id !== payload.old.id))
      })
      .subscribe()

    const accessChannel = supabase
      .channel('admin-access-ids')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bug_access_ids' }, (payload) => {
        if (payload.eventType === 'INSERT') setAccessIds(p => [payload.new as AccessId, ...p])
        if (payload.eventType === 'UPDATE') setAccessIds(p => p.map(a => a.id === payload.new.id ? payload.new as AccessId : a))
        if (payload.eventType === 'DELETE') setAccessIds(p => p.filter(a => a.id !== payload.old.id))
      })
      .subscribe()

    return () => { 
      supabase.removeChannel(reportChannel)
      supabase.removeChannel(accessChannel)
    }
  }, [supabase])

  const refreshAccessIds = async () => {
    const { data } = await supabase.from('bug_access_ids').select('*').order('created_at', { ascending: false })
    if (data) setAccessIds(data as AccessId[])
  }

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('bug_reports').update({
      status,
      admin_note: note || null,
      resolved_at: status === 'resolved' ? new Date().toISOString() : null,
    }).eq('id', id)

    if (error) {
      toast.error('Error updating status')
      return
    }
    toast.success('Status updated')
    setSelected(null)
    setNote('')
  }

  const saveNote = async () => {
    if (!selected) return
    setSavingNote(true)
    const { error } = await supabase.from('bug_reports').update({
      admin_note: note || null,
    }).eq('id', selected.id)

    if (error) {
      toast.error('Error saving note')
    } else {
      toast.success('Note saved')
    }
    setSavingNote(false)
  }

  const exportToExcel = (data: Report[], filename = 'Bug_Reports_Export') => {
    const rows = data.map(r => ({
      ID: r.id,
      Date: new Date(r.created_at).toLocaleString(),
      Reporter: r.user_email,
      URL: r.page_url,
      Description: r.description,
      Status: r.status,
      Admin_Note: r.admin_note || '',
      Access_ID: r.access_id_used || '',
      Click_Trail: (r.click_trail || []).join(' | '),
      JS_Errors: (r.js_errors || []).join(' | ')
    }))

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Bugs')
    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`)
    toast.success('Excel exported')
  }

  const deleteReport = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bug report? This action cannot be undone.')) return
    
    const { error } = await supabase.from('bug_reports').delete().eq('id', id)
    if (error) {
      toast.error('Error deleting report')
      return
    }
    toast.success('Report deleted')
    setSelected(null)
  }

  const createAccessId = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName || !newId || !newPass) return
    setCreating(true)

    const { error } = await supabase.from('bug_access_ids').insert({
      name: newName,
      access_id: newId,
      password: newPass
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Access Key Generated')
      setNewName('')
      setNewId('')
      setNewPass('')
    }
    setCreating(false)
  }

  const toggleResetPassword = async (accessId: string, currentStatus: boolean) => {
    const { error } = await supabase.from('bug_access_ids').update({ force_password_reset: !currentStatus }).eq('access_id', accessId)
    if (error) {
      toast.error('Failed to update reset status')
    } else {
      toast.success(currentStatus ? 'Reset cancelled' : 'Reset triggered')
    }
  }

  const saveEdit = async (originalAccessId: string) => {
    if (!editName.trim() || !editId.trim()) return
    const { error } = await supabase.from('bug_access_ids').update({ 
      name: editName.trim(),
      access_id: editId.trim().toUpperCase()
    }).eq('access_id', originalAccessId)

    if (error) {
      toast.error(error.message || 'Failed to update')
    } else {
      toast.success('Access Key updated')
      setEditingId(null)
    }
  }

  const deleteAccessId = async (accessId: string) => {
    const { error } = await supabase.from('bug_access_ids').delete().eq('access_id', accessId)
    if (error) {
      toast.error('Failed to delete')
    } else {
      toast.success('Deleted')
    }
  }

  const downloadCardAsPng = async () => {
    const node = document.getElementById('team-share-card-content');
    if (!node) return;
    
    setCreating(true)
    try {
      const dataUrl = await toPng(node, { 
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: '#0f0f0f',
      });
      const link = document.createElement('a');
      link.download = `Team_Credentials_Security_Protocol.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Premium PNG Generated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PNG');
    }
    setCreating(false)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen" style={{ color: 'var(--fg)' }}>
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase flex items-center gap-3" style={{ color: 'var(--fg)' }}>
            <span>🐛</span> Bug Central
          </h1>
          <p className="font-mono text-[10px] mt-1 uppercase tracking-[0.2em]" style={{ color: 'var(--fg-faint)' }}>Administrative Debugging Suite</p>
        </div>
        
        <div className="flex items-center gap-3">
          {activeTab === 'reports' && reports.length > 0 && (
            <button 
              onClick={() => exportToExcel(reports, 'All_Bug_Reports')}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg border text-[10px] font-black hover:bg-[var(--bg-hover)] transition-all"
              style={{ borderColor: 'var(--border)', color: 'var(--fg-muted)' }}
            >
              <Download size={12} />
              EXPORT ALL
            </button>
          )}
          <div className="flex items-center gap-3">
            {activeTab === 'access' && accessIds.length > 0 && (
              <button 
                onClick={() => setShowShareCard(true)}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg border text-[10px] font-black hover:bg-[var(--bg-hover)] transition-all"
                style={{ borderColor: 'var(--border)', color: 'var(--fg-muted)' }}
              >
                <FileText size={12} />
                SHARE CARD
              </button>
            )}
            <button 
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-1.5 rounded-md text-[10px] font-black transition-all ${activeTab === 'reports' ? 'bg-[var(--fg)] text-[var(--bg)] shadow-md' : 'hover:bg-[var(--bg-hover)]'}`}
              style={activeTab !== 'reports' ? { color: 'var(--fg-muted)' } : {}}
            >REPORTS</button>
            <button 
              onClick={() => setActiveTab('access')}
              className={`px-4 py-1.5 rounded-md text-[10px] font-black transition-all ${activeTab === 'access' ? 'bg-[var(--fg)] text-[var(--bg)] shadow-md' : 'hover:bg-[var(--bg-hover)]'}`}
              style={activeTab !== 'access' ? { color: 'var(--fg-muted)' } : {}}
            >ACCESS KEYS</button>
          </div>
        </div>
      </header>

      {activeTab === 'reports' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start animate-in fade-in slide-in-from-bottom-2 duration-500">
          {/* List */}
          <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2 scrollbar-hide">
            {reports.length === 0 && (
              <div className="text-center p-20 border border-dashed border-zinc-800 rounded-2xl text-zinc-600">
                No reports found.
              </div>
            )}
            {reports.map(r => (
              <div key={r.id}
                onClick={() => { setSelected(r); setNote(r.admin_note || '') }}
                className={`cursor-pointer rounded-xl border p-5 transition-all duration-200 ${
                  selected?.id === r.id 
                  ? 'bg-[var(--bg-hover)] border-[var(--fg)] shadow-[0_4px_20px_rgba(255,255,255,0.05)] ring-1 ring-[var(--fg)]' 
                  : 'bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border-[var(--border)]'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono opacity-60 uppercase tracking-wider" style={{ color: 'var(--fg-muted)' }}>{r.user_email}</span>
                    {r.access_id_used && <span className="text-[9px] font-mono mt-0.5" style={{ color: 'var(--fg)' }}>ID: {r.access_id_used}</span>}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border" 
                    style={{ color: STATUS_COLORS[r.status], borderColor: STATUS_COLORS[r.status] + '44', background: STATUS_COLORS[r.status] + '11' }}>
                    {r.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm font-medium line-clamp-2 leading-relaxed" style={{ color: 'var(--fg)' }}>{r.description}</p>
                <div className="flex items-center gap-3 mt-4">
                  <p className="text-[10px] font-mono truncate max-w-[200px]" style={{ color: 'var(--fg-faint)' }}>{r.page_url}</p>
                  <span className="text-[10px] font-mono ml-auto" style={{ color: 'var(--fg-faint)' }}>{new Date(r.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Detail pane */}
          <div className="sticky top-6">
            {selected ? (
              <div className="rounded-2xl border shadow-2xl p-8 space-y-6 backdrop-blur-xl" 
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold uppercase tracking-tight" style={{ color: 'var(--fg)' }}>Report Detail</h2>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => window.print()}
                      className="text-[10px] font-black uppercase text-zinc-500 hover:text-[var(--fg)] transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200"
                    >
                      <FileText size={12} />
                      PDF
                    </button>
                    <button 
                      onClick={() => exportToExcel([selected], `Bug_Report_${selected.id.split('-')[0]}`)}
                      className="text-[10px] font-black uppercase text-zinc-500 hover:text-[var(--fg)] transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200"
                    >
                      <Download size={12} />
                      Excel
                    </button>
                    <button 
                      onClick={() => deleteReport(selected.id)}
                      className="text-[10px] font-black uppercase text-red-500 hover:text-red-400 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/5"
                    >
                      Delete
                    </button>
                    <button onClick={() => setSelected(null)} style={{ color: 'var(--fg-faint)' }} className="hover:text-[var(--fg)] transition text-lg ml-2">✕</button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Current Status</p>
                    <div className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border text-center"
                      style={{ 
                        color: STATUS_COLORS[selected.status], 
                        borderColor: STATUS_COLORS[selected.status] + '44', 
                        background: STATUS_COLORS[selected.status] + '11' 
                      }}>
                      {selected.status.replace('_', ' ')}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Reporter</p>
                    <p className="text-[11px] font-mono p-2 rounded-lg border truncate" style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--fg)' }}>{selected.user_email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Access ID Used</p>
                    <p className="text-[11px] font-mono p-2 rounded-lg border truncate" style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--fg)' }}>{selected.access_id_used || 'N/A'}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Path</p>
                  <p className="text-[11px] font-mono break-all p-2 rounded-lg border" style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--fg)' }}>{selected.page_url}</p>
                </div>

                {selected.click_trail?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-2">
                      <span className="w-1 h-1 bg-zinc-500 rounded-full"></span> Click Trail (Last 10)
                    </p>
                    <ul className="text-[10px] font-mono space-y-1.5 max-h-32 overflow-y-auto bg-zinc-50 dark:bg-black/30 p-3 rounded-lg border border-zinc-200 dark:border-white/5 scrollbar-hide">
                      {selected.click_trail.map((c, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-zinc-400 dark:text-zinc-700">{selected.click_trail.length - i}.</span>
                          <span className="text-zinc-800 dark:text-zinc-400">↳ {c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selected.js_errors?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] text-red-500 font-black uppercase tracking-widest flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> JS Errors
                    </p>
                    <ul className="text-[10px] font-mono text-red-400 space-y-1.5 max-h-32 overflow-y-auto bg-red-500/5 p-3 rounded-lg border border-red-500/10 scrollbar-hide">
                      {selected.js_errors.map((e, i) => <li key={i} className="flex gap-2">⚠ {e}</li>)}
                    </ul>
                  </div>
                )}

                <div className="flex justify-between items-center text-[9px] font-mono opacity-40 uppercase tracking-widest border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                  <span>Reported at: {new Date(selected.created_at).toLocaleString()}</span>
                  <span>ID: {selected.id.split('-')[0]}</span>
                </div>

                <div className="space-y-2 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                  <div className="relative">
                    <textarea
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      onBlur={saveNote}
                      placeholder="Internal developer notes..."
                      rows={3}
                      className="w-full border rounded-xl p-4 text-sm outline-none focus:border-[var(--fg)] transition resize-none"
                      style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--fg)' }}
                    />
                    <button 
                      onClick={saveNote}
                      disabled={savingNote}
                      className="absolute bottom-3 right-3 text-[9px] font-bold uppercase flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--fg)] text-[var(--bg)] opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ opacity: savingNote ? 1 : undefined }}
                    >
                      <Save size={10} />
                      {savingNote ? 'SAVING...' : 'SAVE'}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {STATUSES.map(s => {
                      const isSelected = selected.status === s
                      return (
                        <button key={s} onClick={() => updateStatus(selected.id, s)}
                          className={`px-4 py-2.5 rounded-lg text-[9px] font-black uppercase transition-all duration-200 border bg-${isSelected ? 'white' : 'transparent'}-override`}
                          style={{ 
                            background: isSelected ? '#ffffff' : 'transparent', 
                            color: isSelected ? '#000000' : 'var(--fg)', 
                            borderColor: isSelected ? '#ffffff' : 'var(--border)',
                            boxShadow: isSelected ? '0 0 20px rgba(0,0,0,0.1)' : 'none'
                          }}>
                          {s.replace('_', ' ')}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center rounded-2xl border border-dashed text-center p-8"
                style={{ borderColor: 'var(--border)', background: 'var(--bg-subtle)' }}>
                <span className="text-4xl mb-4 opacity-20">🔍</span>
                <p className="text-sm font-medium" style={{ color: 'var(--fg-muted)' }}>Select a report to view metadata,<br/>click logs, and track errors.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-in fade-in slide-in-from-bottom-2 duration-500">
          {/* Form */}
          <div className="lg:col-span-1 border rounded-2xl p-6 space-y-4 shadow-sm" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--fg)' }}>Create Access Key</h2>
            <form onSubmit={createAccessId} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase mb-1 block" style={{ color: 'var(--fg-faint)' }}>Full Name</label>
                <input 
                  type="text" required value={newName} onChange={e => setNewName(e.target.value)}
                  className="w-full border rounded-xl p-3 text-sm focus:border-[var(--fg)] outline-none transition"
                  style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--fg)' }}
                  placeholder="e.g. Nived G"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase mb-1 block" style={{ color: 'var(--fg-faint)' }}>Access ID</label>
                <input 
                  type="text" required value={newId} onChange={e => setNewId(e.target.value)}
                  className="w-full border rounded-xl p-3 text-sm focus:border-[var(--fg)] outline-none transition"
                  style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--fg)' }}
                  placeholder="e.g. DEV-NIVED"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase mb-1 block" style={{ color: 'var(--fg-faint)' }}>Password</label>
                <input 
                  type="password" required value={newPass} onChange={e => setNewPass(e.target.value)}
                  className="w-full border rounded-xl p-3 text-sm focus:border-[var(--fg)] outline-none transition"
                  style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--fg)' }}
                  placeholder="••••••••"
                />
              </div>
              <button 
                type="submit" disabled={creating}
                className="w-full py-4 font-black text-[10px] uppercase rounded-xl hover:brightness-110 active:scale-[0.98] transition disabled:opacity-50 shadow-lg"
                style={{ background: 'var(--fg)', color: 'var(--bg)' }}
              >
                {creating ? 'Creating...' : 'Generate Access Key'}
              </button>
            </form>
          </div>

          {/* List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>Active Access Keys</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accessIds.length === 0 && <p style={{ color: 'var(--fg-faint)' }} className="text-sm italic">No access keys created yet.</p>}
              {accessIds.map(a => (
                <div key={a.id} className="group border rounded-xl p-4 flex flex-col justify-between shadow-sm" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                  <div>
                    <div className="flex justify-between items-start">
                      {editingId === a.access_id ? (
                        <div className="flex flex-col gap-2 w-full">
                          <input 
                            value={editName} onChange={e => setEditName(e.target.value)} placeholder="Name"
                            className="bg-[var(--bg-subtle)] border border-[var(--border)] rounded px-2 py-1.5 text-xs w-full outline-none focus:border-[var(--fg)] font-bold"
                          />
                          <input 
                            value={editId} onChange={e => setEditId(e.target.value.toUpperCase())} placeholder="Access ID"
                            className="bg-[var(--bg-subtle)] border border-[var(--border)] rounded px-2 py-1.5 text-xs w-full outline-none focus:border-[var(--fg)] font-mono"
                          />
                          <div className="flex gap-3 mt-1">
                            <button onClick={() => saveEdit(a.access_id)} className="text-[10px] font-black text-green-500 uppercase">Save Changes</button>
                            <button onClick={() => setEditingId(null)} className="text-[10px] font-black text-zinc-500 uppercase">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col w-full">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-bold uppercase text-xs tracking-wider" style={{ color: 'var(--fg)' }}>{a.name}</h3>
                            <button 
                              onClick={() => { setEditingId(a.access_id); setEditName(a.name); setEditId(a.access_id) }} 
                              className="text-[9px] font-black text-zinc-400 hover:text-[var(--fg)] transition-all uppercase px-2 py-1 rounded-md border border-transparent hover:border-[var(--border)]"
                            >Edit</button>
                          </div>
                          <div className="flex justify-between items-end mt-1">
                            <p className="text-xs font-mono" style={{ color: 'var(--fg)' }}>{a.access_id}</p>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-black border ${(a as any).force_password_reset ? 'bg-amber-500 text-white border-amber-500' : a.is_active ? 'bg-[var(--fg)] text-[var(--bg)] border-[var(--fg)]' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                              {(a as any).force_password_reset ? 'RESET PENDING' : a.is_active ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] mt-2" style={{ color: 'var(--fg-muted)' }}>Password: <span className="select-all" style={{ color: 'var(--fg-faint)' }}>{a.password}</span></p>
                  </div>
                  <div className="mt-4 flex gap-3 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
                    <button 
                      onClick={() => toggleResetPassword(a.access_id, (a as any).force_password_reset)}
                      className={`text-[9px] font-black uppercase transition-colors ${(a as any).force_password_reset ? 'text-amber-500' : 'text-zinc-500 hover:text-amber-600'}`}
                    >
                      {(a as any).force_password_reset ? 'Cancel Reset' : 'Reset Password'}
                    </button>
                    <button 
                      onClick={() => deleteAccessId(a.access_id)}
                      className="text-[9px] font-black text-red-500 hover:text-red-400 transition ml-auto uppercase"
                    >Delete Key</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Aesthetic Print Layout (Only visible when printing) ── */}
      {selected && (
        <div id="bug-report-print" className="hidden print:block p-12 bg-white text-black font-sans min-h-screen">
          <header className="flex justify-between items-start border-b-2 border-black pb-8 mb-10">
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tighter">Bug Report</h1>
              <p className="font-mono text-xs uppercase tracking-widest mt-1 opacity-60">ID: {selected.id}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-black uppercase">{new Date(selected.created_at).toLocaleDateString()}</p>
              <p className="text-[10px] font-mono opacity-50 uppercase tracking-widest">Club-Eve Debug Suite</p>
            </div>
          </header>

          <section className="grid grid-cols-2 gap-12 mb-12">
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">Status</p>
                <p className="text-lg font-black uppercase" style={{ color: STATUS_COLORS[selected.status] }}>{selected.status.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">Reporter</p>
                <p className="text-sm font-medium">{selected.user_email}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">Platform Path</p>
                <p className="text-xs font-mono break-all bg-zinc-50 p-3 rounded-lg border border-zinc-100">{selected.page_url}</p>
              </div>
            </div>
            
            <div className="border-l border-zinc-100 pl-12">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-2">Description</p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{selected.description}</p>
            </div>
          </section>

          {selected.admin_note && (
            <section className="mt-12 p-8 bg-zinc-50 rounded-2xl border border-zinc-200 min-h-[400px]" style={{ breakBefore: 'page' }}>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-4">Internal Developer Notes</p>
              <p className="text-sm italic text-zinc-700 leading-relaxed whitespace-pre-wrap">{selected.admin_note}</p>
              
              <div className="mt-20 pt-10 border-t border-zinc-200">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-2">Administrative Verification</p>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  This report has been reviewed and verified by the administrative team. All internal notes are strictly for developmental reference and should be handled in accordance with the project's security protocols.
                </p>
                <div className="mt-12 flex gap-12">
                  <div className="border-b border-black w-32 h-8"></div>
                  <div className="border-b border-black w-32 h-8"></div>
                </div>
                <div className="flex gap-12 mt-2 text-[8px] font-mono opacity-40 uppercase">
                  <span className="w-32">Officer Signature</span>
                  <span className="w-32">Date of Audit</span>
                </div>
              </div>
            </section>
          )}

          {selected.click_trail?.length > 0 && (
            <section className="mb-12">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-black rounded-full"></span> Click Logs (Ascending)
              </p>
              <div className="grid grid-cols-1 gap-2">
                {selected.click_trail.map((c, i) => (
                  <div key={i} className="flex gap-4 items-center text-[10px] font-mono p-2 border-b border-zinc-50">
                    <span className="opacity-30">{i + 1}</span>
                    <span>{c}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {selected.js_errors?.length > 0 && (
            <section className="mb-12">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span> Runtime Exceptions
              </p>
              <div className="space-y-2">
                {selected.js_errors.map((e, i) => (
                  <p key={i} className="text-xs font-mono text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">⚠ {e}</p>
                ))}
              </div>
            </section>
          )}

          <footer className="mt-auto pt-20 border-t border-zinc-100 flex justify-between items-end opacity-40">
            <div>
              <p className="text-[8px] font-mono tracking-widest uppercase mb-1">Authenticated via {selected.access_id_used || 'system-admin'}</p>
              <p className="text-[8px] font-mono tracking-widest uppercase">Generated on {new Date().toLocaleString()}</p>
            </div>
            <p className="text-[10px] font-black uppercase tracking-tighter">Club-Eve // 2026</p>
          </footer>
        </div>
      )}
      {/* ── Aesthetic Share Card Modal ── */}
      {showShareCard && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md print:hidden">
          <div className="flex flex-col items-center gap-6 max-w-lg w-full">
            <div className="bg-[#0f0f0f] border border-white/10 rounded-[32px] w-full shadow-2xl p-10 relative overflow-hidden" id="team-share-card-content">
              <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-500/10 blur-[100px] rounded-full -mr-20 -mt-20 pointer-events-none"></div>
              
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <h1 className="text-2xl font-black uppercase text-white tracking-tighter">Team Credentials</h1>
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">Bug Reporter Suite // 2026</p>
                </div>
              </div>

              <div className="mt-12 space-y-4 relative z-10">
                {accessIds
                  .filter(a => !a.name.toLowerCase().includes('nived') && !a.access_id.toLowerCase().includes('nived'))
                  .map(a => (
                    <div key={a.id} className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 flex justify-between items-center group transition-all">
                      <div>
                        <p className="text-[9px] font-black uppercase text-zinc-500 mb-1 tracking-widest">Authorized Member</p>
                        <h3 className="text-sm font-bold text-white uppercase">{a.name}</h3>
                        <p className="text-[11px] font-mono text-zinc-400 mt-1">{a.access_id}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black uppercase text-zinc-600 mb-1 tracking-widest">Passkey</p>
                        <p className="text-xs font-mono text-white tracking-[0.2em]">{a.password}</p>
                      </div>
                    </div>
                  ))}
              </div>

              <div className="mt-12 pt-8 border-t border-white/10 flex justify-between items-end relative z-10">
                <div>
                  <p className="text-[9px] font-black uppercase text-zinc-600 leading-tight">Project Custodian</p>
                  <p className="text-[10px] text-zinc-400 mt-1 italic">Authorized deployment access only.</p>
                </div>
                <div className="text-right opacity-20">
                    <p className="text-[8px] font-mono uppercase text-white">SECURE AUTH</p>
                </div>
              </div>
            </div>

            {/* Controls outside the capture area */}
            <div className="flex gap-4 w-full">
              <button 
                onClick={downloadCardAsPng}
                disabled={creating}
                className="flex-1 bg-white text-black px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-200 transition shadow-xl active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {creating ? 'GENERATING...' : <><Camera size={16} /> DOWNLOAD PNG</>}
              </button>
              <button 
                onClick={() => window.print()}
                className="bg-zinc-800 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-700 transition shadow-xl active:scale-95 flex items-center justify-center gap-3"
              >
                <Printer size={16} /> PRINT PDF
              </button>
              <button 
                onClick={() => setShowShareCard(false)}
                className="bg-red-500/10 text-red-500 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-500/20 transition shadow-xl active:scale-95 flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      <div id="team-share-card-print" className="hidden print:flex flex-col absolute inset-0 bg-white h-screen w-screen p-10 overflow-hidden" style={{ pageBreakAfter: 'always' }}>
         <div className="border-[4px] border-black p-10 rounded-[30px] w-full max-w-2xl mx-auto my-auto flex flex-col justify-between h-full max-h-[90vh]">
            <div>
              <h1 className="text-5xl font-black uppercase tracking-tighter mb-2 text-black">Access Protocol</h1>
              <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-zinc-400 mb-12 border-b pb-6">Debug Infrastructure Authentication</p>
              
              <div className="space-y-8">
                {accessIds
                  .filter(a => !a.name.toLowerCase().includes('nived') && !a.access_id.toLowerCase().includes('nived'))
                  .map(a => (
                    <div key={a.id} className="flex justify-between items-end border-b border-zinc-100 pb-6">
                      <div>
                        <p className="text-base font-black uppercase text-black">{a.name}</p>
                        <p className="text-[11px] font-mono opacity-40 mt-0.5 text-black">{a.access_id}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-bold uppercase opacity-30 mb-1 tracking-widest text-black">Passkey</p>
                        <p className="text-xl font-black font-mono tracking-widest text-black">{a.password}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="mt-auto flex justify-between items-end pt-10">
              <div className="opacity-20 text-[8px] font-mono leading-relaxed text-black">
                GENERATED VIA ADMIN PORTAL<br/>
                TIMESTAMP: {new Date().toLocaleString().toUpperCase()}<br/>
                AUTHENTICATION CODE: {Math.random().toString(36).substring(7).toUpperCase()}
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-black uppercase text-black mb-1">Authenticated</p>
                 <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white text-xl font-black">
                   C
                 </div>
              </div>
            </div>
         </div>
      </div>
    </div>
  )
}
