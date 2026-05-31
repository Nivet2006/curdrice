'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Search, Filter, ArrowUpDown, ClipboardCheck, Eye, Clock,
  CheckCircle, XCircle, AlertTriangle, Calendar, Building, ChevronDown
} from 'lucide-react'

type Report = {
  id: string
  event_id: string
  status: string
  created_at?: string
  generated_at?: string
  updated_at: string
  decline_annotations: unknown[] | null
  declined_at: string | null
  events: {
    title: string
    club_name: string
    targeted_department: string | null
    event_date: string
    location: string | null
  } | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending_pr: { label: 'Pending Audit', color: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20', icon: <Clock size={10} /> },
  approved_pr: { label: 'Verified (Pending Push)', color: 'bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-500/20', icon: <Clock size={10} /> },
  pending_faculty: { label: 'Pending Faculty', color: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20', icon: <Clock size={10} /> },
  approved_faculty: { label: 'Faculty Endorsed (Pending Push)', color: 'bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-500/20', icon: <Clock size={10} /> },
  pending_hod: { label: 'Pending HOD', color: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20', icon: <Clock size={10} /> },
  completed: { label: 'Approved', color: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20', icon: <CheckCircle size={10} /> },
  approved: { label: 'Approved', color: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20', icon: <CheckCircle size={10} /> },
  declined_pr: { label: 'Declined by PR', color: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20', icon: <XCircle size={10} /> },
  rejected_pr: { label: 'Rejected by PR', color: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20', icon: <XCircle size={10} /> },
  rejected_faculty: { label: 'Rejected by Faculty', color: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20', icon: <XCircle size={10} /> },
  rejected_hod: { label: 'Rejected by HOD', color: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20', icon: <XCircle size={10} /> },
  draft: { label: 'Draft', color: 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700', icon: <AlertTriangle size={10} /> },
}

export function PRAuditQueueClient({ reports, iicReports = [] }: { reports: Report[]; iicReports?: any[] }) {
  const [activeTab, setActiveTab] = useState<'standard' | 'iic'>('standard')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [clubFilter, setClubFilter] = useState<string>('all')
  const [deptFilter, setDeptFilter] = useState<string>('all')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const activeReports = useMemo(() => {
    return activeTab === 'standard' ? reports : iicReports;
  }, [activeTab, reports, iicReports])

  // Derive unique clubs and departments
  const clubs = useMemo(() => {
    const set = new Set<string>()
    activeReports.forEach(r => { if (r.events?.club_name) set.add(r.events.club_name) })
    return Array.from(set).sort()
  }, [activeReports])

  const departments = useMemo(() => {
    const set = new Set<string>()
    activeReports.forEach(r => { if (r.events?.targeted_department) set.add(r.events.targeted_department) })
    return Array.from(set).sort()
  }, [activeReports])

  const filtered = useMemo(() => {
    let result = [...activeReports]

    // Search
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(r =>
        r.events?.title?.toLowerCase().includes(q) ||
        r.events?.club_name?.toLowerCase().includes(q) ||
        r.event_id?.toLowerCase().includes(q)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(r => r.status === statusFilter)
    }

    // Club filter
    if (clubFilter !== 'all') {
      result = result.filter(r => r.events?.club_name === clubFilter)
    }

    // Department filter
    if (deptFilter !== 'all') {
      result = result.filter(r => r.events?.targeted_department === deptFilter)
    }

    // Date range
    if (dateFrom) {
      result = result.filter(r => new Date(r.created_at || r.generated_at || '') >= new Date(dateFrom))
    }
    if (dateTo) {
      const endDate = new Date(dateTo)
      endDate.setHours(23, 59, 59, 999)
      result = result.filter(r => new Date(r.created_at || r.generated_at || '') <= endDate)
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.created_at || a.generated_at || '').getTime()
      const dateB = new Date(b.created_at || b.generated_at || '').getTime()
      const diff = dateB - dateA
      return sortOrder === 'newest' ? diff : -diff
    })

    return result
  }, [activeReports, search, statusFilter, clubFilter, deptFilter, sortOrder, dateFrom, dateTo])

  const pendingCount = activeReports.filter(r => r.status === 'pending_pr').length
  const completedCount = activeReports.filter(r => r.status === 'completed' || r.status === 'approved').length
  const declinedCount = activeReports.filter(r => r.status === 'declined_pr' || r.status === 'rejected_pr').length

  return (
    <div className="space-y-8">
      {/* Tab Navigation */}
      <div className="flex gap-6 border-b border-zinc-200 dark:border-zinc-800 pb-2 mb-4">
        <button
          onClick={() => { setActiveTab('standard'); setStatusFilter('all'); }}
          className={`pb-2 font-mono text-xs uppercase tracking-widest transition-all font-black ${
            activeTab === 'standard' ? 'border-b-2 border-black dark:border-white text-black dark:text-white' : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          Publicity Reports ({reports.length})
        </button>
        <button
          onClick={() => { setActiveTab('iic'); setStatusFilter('all'); }}
          className={`pb-2 font-mono text-xs uppercase tracking-widest transition-all font-black ${
            activeTab === 'iic' ? 'border-b-2 border-black dark:border-white text-black dark:text-white' : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          Official IIC Reports ({iicReports.length})
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button onClick={() => setStatusFilter('all')} className={`p-5 rounded-2xl border text-center transition-all ${statusFilter === 'all' ? 'bg-[#0a0a0a] dark:bg-white text-white dark:text-black border-[#0a0a0a] dark:border-white' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-[#0a0a0a] dark:hover:border-white'}`}>
          <p className="text-2xl font-black">{activeReports.length}</p>
          <p className="text-[9px] font-mono uppercase tracking-widest opacity-60">Total</p>
        </button>
        <button onClick={() => setStatusFilter('pending_pr')} className={`p-5 rounded-2xl border text-center transition-all ${statusFilter === 'pending_pr' ? 'bg-amber-500 text-white border-amber-500' : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 hover:border-amber-500'}`}>
          <p className="text-2xl font-black">{pendingCount}</p>
          <p className="text-[9px] font-mono uppercase tracking-widest opacity-60">Pending</p>
        </button>
        <button onClick={() => setStatusFilter('completed')} className={`p-5 rounded-2xl border text-center transition-all ${statusFilter === 'completed' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 hover:border-emerald-500'}`}>
          <p className="text-2xl font-black">{completedCount}</p>
          <p className="text-[9px] font-mono uppercase tracking-widest opacity-60">Approved</p>
        </button>
        <button onClick={() => setStatusFilter('declined_pr')} className={`p-5 rounded-2xl border text-center transition-all ${statusFilter === 'declined_pr' ? 'bg-rose-500 text-white border-rose-500' : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 hover:border-rose-500'}`}>
          <p className="text-2xl font-black">{declinedCount}</p>
          <p className="text-[9px] font-mono uppercase tracking-widest opacity-60">Declined</p>
        </button>
      </div>

      {/* Search + Filter Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-3 rounded-xl flex-1">
            <Search size={14} className="text-zinc-400" />
            <input
              type="text"
              placeholder="Search by event title, club, or event ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm font-mono text-[#0a0a0a] dark:text-white placeholder:text-zinc-400 w-full"
            />
          </div>

          {/* Sort Toggle */}
          <button
            onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
            className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 hover:border-[#0a0a0a] dark:hover:border-white transition-colors whitespace-nowrap"
          >
            <ArrowUpDown size={14} />
            {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
          </button>

          {/* Advanced Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-2 px-4 py-3 border rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
              showAdvanced
                ? 'bg-[#0a0a0a] dark:bg-white text-white dark:text-black border-[#0a0a0a] dark:border-white'
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-[#0a0a0a] dark:hover:border-white'
            }`}
          >
            <Filter size={14} />
            Filters
            <ChevronDown size={12} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Club */}
            <div className="space-y-1">
              <label className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                <Building size={10} /> Club
              </label>
              <select
                value={clubFilter}
                onChange={e => setClubFilter(e.target.value)}
                className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-[#0a0a0a] dark:text-white outline-none"
              >
                <option value="all">All Clubs</option>
                {clubs.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Department */}
            <div className="space-y-1">
              <label className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                <Building size={10} /> Department
              </label>
              <select
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
                className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-[#0a0a0a] dark:text-white outline-none"
              >
                <option value="all">All Departments</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {/* Date From */}
            <div className="space-y-1">
              <label className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                <Calendar size={10} /> From
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-[#0a0a0a] dark:text-white outline-none"
              />
            </div>

            {/* Date To */}
            <div className="space-y-1">
              <label className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                <Calendar size={10} /> To
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-[#0a0a0a] dark:text-white outline-none"
              />
            </div>

            {/* Clear All */}
            <button
              onClick={() => {
                setClubFilter('all')
                setDeptFilter('all')
                setDateFrom('')
                setDateTo('')
                setStatusFilter('all')
                setSearch('')
              }}
              className="col-span-full text-[10px] font-mono text-zinc-400 uppercase tracking-widest hover:text-black dark:hover:text-white transition-colors py-2"
            >
              ✕ Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Results Count */}
      <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
        Showing {filtered.length} of {reports.length} reports
      </p>

      {/* Reports List */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filtered.map(report => {
            const statusConf = STATUS_CONFIG[report.status] || STATUS_CONFIG.draft
            const isActionable = report.status === 'pending_pr'

            return (
              <div key={report.id} className={`group bg-white dark:bg-zinc-900/50 border rounded-[2rem] p-6 transition-all overflow-hidden relative ${
                isActionable
                  ? 'border-amber-200 dark:border-amber-500/20 hover:border-[#0a0a0a] dark:hover:border-white shadow-sm hover:shadow-xl'
                  : 'border-zinc-200 dark:border-zinc-800 hover:shadow-md'
              }`}>
                {isActionable && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                )}

                <div className="flex flex-col h-full justify-between gap-4">
                  <div className="space-y-3">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase tracking-widest border ${statusConf.color}`}>
                        {statusConf.icon}
                        {statusConf.label}
                      </span>
                      <span className="text-[9px] font-mono text-zinc-400">
                        {new Date(report.created_at || report.generated_at || '').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-black text-[#0a0a0a] dark:text-white uppercase tracking-tighter leading-tight">
                      {report.events?.title || 'Unknown Event'}
                    </h3>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-2 text-[9px] font-mono text-zinc-400 uppercase tracking-widest">
                      <span className="font-bold text-zinc-600 dark:text-zinc-300">{report.events?.club_name}</span>
                      {report.events?.targeted_department && (
                        <>
                          <span>•</span>
                          <span>{report.events.targeted_department}</span>
                        </>
                      )}
                      {report.events?.event_date && (
                        <>
                          <span>•</span>
                          <span>{new Date(report.events.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                        </>
                      )}
                    </div>

                    {/* Declined annotations indicator */}
                    {report.status === 'declined_pr' && report.decline_annotations && (report.decline_annotations as unknown[]).length > 0 && (
                      <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-3 py-2 rounded-xl">
                        <AlertTriangle size={12} className="text-rose-500" />
                        <span className="text-[10px] font-mono text-rose-600 dark:text-rose-400">
                          {(report.decline_annotations as unknown[]).length} annotation(s) sent to CC
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action */}
                  <div className="flex items-center justify-end pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <Link
                      href={activeTab === 'iic' ? `/pr/reports/iic/${report.id}` : `/pr/reports/${report.id}`}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all active:scale-95 shadow-lg ${
                        isActionable
                          ? 'bg-[#0a0a0a] dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {isActionable ? <ClipboardCheck size={14} /> : <Eye size={14} />}
                      {isActionable ? 'Begin Audit' : 'View Report'}
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="py-24 text-center bg-zinc-50/50 dark:bg-zinc-900/30 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[3rem]">
          <ClipboardCheck size={40} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-6" />
          <p className="text-zinc-600 dark:text-zinc-400 font-black text-xl uppercase tracking-widest">No Reports Found</p>
          <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-2">Adjust your filters or check back later.</p>
        </div>
      )}
    </div>
  )
}
