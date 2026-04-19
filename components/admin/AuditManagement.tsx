'use client'

import React, { useState } from 'react'
import { Trash2, Download, Filter, Calendar, Zap, AlertTriangle } from 'lucide-react'
import { clearAllLogs, clearLogsByRange, clearLogsByIP } from '@/lib/actions/audit-mgmt'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

interface AuditManagementProps {
  logs: any[]
}

export function AuditManagement({ logs }: AuditManagementProps) {
  const [loading, setLoading] = useState(false)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [ipAddress, setIpAddress] = useState('')

  const handleClearAll = async () => {
    if (!confirm('Are you absolutely sure? This will permanently erase ALL audit data.')) return
    setLoading(true)
    const res = await clearAllLogs()
    if (res.success) toast.success('Audit vault drained successfully')
    else toast.error(res.error)
    setLoading(false)
  }

  const handleClearRange = async () => {
    if (!startTime || !endTime) return toast.error('Set date range first')
    setLoading(true)
    const res = await clearLogsByRange(new Date(startTime).toISOString(), new Date(endTime).toISOString())
    if (res.success) toast.success('Temporal range purged')
    setLoading(false)
  }

  const handleClearIP = async () => {
    if (!ipAddress) return toast.error('Enter IP address')
    setLoading(true)
    const res = await clearLogsByIP(ipAddress)
    if (res.success) toast.success(`Evidence from ${ipAddress} deleted`)
    setLoading(false)
  }

  const exportLogs = (format: 'xlsx' | 'json' | 'csv') => {
    const data = logs.map(l => ({
      Timestamp: new Date(l.created_at).toLocaleString(),
      Action: l.action_type,
      Path: l.resource_path,
      User: l.profiles?.full_name || 'Guest',
      USN: l.profiles?.usn || 'N/A',
      IP: l.ip_address,
      Session: l.session_id,
      Metadata: JSON.stringify(l.metadata),
      UA: l.user_agent
    }))

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `audit_export_${Date.now()}.json`; a.click()
    } else if (format === 'csv') {
      const worksheet = XLSX.utils.json_to_sheet(data)
      const csv = XLSX.utils.sheet_to_csv(worksheet)
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `audit_export_${Date.now()}.csv`; a.click()
    } else {
      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Audit Logs")
      XLSX.writeFile(workbook, `audit_export_${Date.now()}.xlsx`)
    }
    toast.success(`Logs exported as ${format.toUpperCase()}`)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
       {/* Export Section */}
       <div className="bg-black text-white rounded-[2.5rem] p-8 space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
               <Download size={24} className="text-emerald-400" />
               Extract Data
            </h3>
            <p className="text-[10px] font-mono text-zinc-500 uppercase mt-2 leading-relaxed">
               Export raw behavioral data for external analysis or compliance reporting.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3">
             <button onClick={() => exportLogs('xlsx')} className="w-full py-4 bg-zinc-900 border border-zinc-700 rounded-2xl font-bold hover:bg-zinc-800 transition-all active:scale-95 flex items-center justify-center gap-2">
                EXCEL (.xlsx)
             </button>
             <div className="grid grid-cols-2 gap-3">
                <button onClick={() => exportLogs('csv')} className="py-4 bg-zinc-900 border border-zinc-700 rounded-2xl font-bold hover:bg-zinc-800 transition-all text-xs">CSV</button>
                <button onClick={() => exportLogs('json')} className="py-4 bg-zinc-900 border border-zinc-700 rounded-2xl font-bold hover:bg-zinc-800 transition-all text-xs">JSON</button>
             </div>
          </div>
       </div>

       {/* Cleanup Section */}
       <div className="lg:col-span-2 bg-white border-4 border-black rounded-[2.5rem] p-8 space-y-8 shadow-[12px_12px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between border-b-2 border-zinc-50 pb-6">
             <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3 text-rose-600">
                <Zap size={24} />
                Management Terminal
             </h3>
             <button 
                onClick={handleClearAll}
                disabled={loading}
                className="px-6 py-2 bg-rose-600 text-white font-black rounded-full text-[10px] uppercase tracking-widest hover:bg-rose-700 transition-all flex items-center gap-2"
             >
                <AlertTriangle size={14} />
                Full Drain
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             <div className="space-y-4">
                <p className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                   <Calendar size={12} />
                   Temporal Purge
                </p>
                <div className="grid grid-cols-2 gap-2">
                   <input type="datetime-local" className="bg-zinc-50 border border-zinc-200 rounded-xl p-2 text-[10px] font-mono outline-none focus:border-black" value={startTime} onChange={e => setStartTime(e.target.value)} />
                   <input type="datetime-local" className="bg-zinc-50 border border-zinc-200 rounded-xl p-2 text-[10px] font-mono outline-none focus:border-black" value={endTime} onChange={e => setEndTime(e.target.value)} />
                </div>
                <button onClick={handleClearRange} disabled={loading} className="w-full py-3 border-2 border-black rounded-2xl font-black text-[10px] uppercase hover:bg-zinc-50 transition-all">Execute Range Clear</button>
             </div>

             <div className="space-y-4">
                <p className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                   <Filter size={12} />
                   Identity Scrubbing
                </p>
                <input 
                  type="text" 
                  placeholder="TARGET IP ADDRESS" 
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2 text-[10px] font-mono outline-none focus:border-black"
                  value={ipAddress}
                  onChange={e => setIpAddress(e.target.value)}
                />
                <button onClick={handleClearIP} disabled={loading} className="w-full py-3 border-2 border-black rounded-2xl font-black text-[10px] uppercase hover:bg-zinc-50 transition-all">Purge Evidence by IP</button>
             </div>
          </div>
       </div>
    </div>
  )
}
