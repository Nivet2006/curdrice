'use client'

import React, { useState, useMemo } from 'react'
import {
  Users, Search, ChevronDown, X, Edit3, CheckCircle, AlertTriangle,
  GraduationCap, ArrowUpCircle, Save, Loader2
} from 'lucide-react'
import { bulkPromoteStudents, updateStudentByTeacher } from '@/lib/actions/teacher-students'
import type { Profile } from '@/lib/types'

interface ManageStudentsPanelProps {
  students: Profile[]
  dept: string
}

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8]
const YEARS = [1, 2, 3, 4]
const DEPARTMENTS = ['CSE', 'ECE', 'ME', 'CV', 'ISE', 'EEE']

export function ManageStudentsPanel({ students, dept }: ManageStudentsPanelProps) {
  const [selectedSemesters, setSelectedSemesters] = useState<number[]>([])
  const [selectedYears, setSelectedYears] = useState<number[]>([])
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [editStudent, setEditStudent] = useState<Profile | null>(null)
  const [editForm, setEditForm] = useState({
    full_name: '', usn: '', department: '', semester: 1, year: 1,
    has_backlog: false, year_back: false
  })
  const [showPromoteBar, setShowPromoteBar] = useState(false)
  const [promoteSem, setPromoteSem] = useState(1)
  const [promoteYear, setPromoteYear] = useState(1)
  const [actionLoading, setActionLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // Filtered students
  const filtered = useMemo(() => {
    return students.filter(s => {
      if (selectedSemesters.length > 0 && !selectedSemesters.includes(s.semester)) return false
      if (selectedYears.length > 0 && !selectedYears.includes(s.year)) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          s.full_name.toLowerCase().includes(q) ||
          s.usn.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [students, selectedSemesters, selectedYears, search])

  const allFilteredSelected = filtered.length > 0 && filtered.every(s => selectedIds.has(s.id))

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (allFilteredSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(s => s.id)))
    }
  }

  function toggleSem(s: number) {
    setSelectedSemesters(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  function toggleYear(y: number) {
    setSelectedYears(prev => prev.includes(y) ? prev.filter(x => x !== y) : [...prev, y])
  }

  function openEdit(student: Profile) {
    setEditStudent(student)
    setEditForm({
      full_name: student.full_name,
      usn: student.usn,
      department: student.department,
      semester: student.semester,
      year: student.year,
      has_backlog: student.has_backlog ?? false,
      year_back: student.year_back ?? false,
    })
  }

  async function handleEditSave() {
    if (!editStudent) return
    setActionLoading(true)
    setFeedback(null)
    const res = await updateStudentByTeacher(editStudent.id, editForm)
    setActionLoading(false)
    if (res.error) {
      setFeedback({ type: 'error', msg: res.error })
    } else {
      setFeedback({ type: 'success', msg: `Updated ${editForm.full_name} successfully.` })
      setEditStudent(null)
      setTimeout(() => setFeedback(null), 4000)
    }
  }

  async function handleBulkPromote() {
    if (selectedIds.size === 0) return
    setActionLoading(true)
    setFeedback(null)
    const res = await bulkPromoteStudents(Array.from(selectedIds), promoteSem, promoteYear)
    setActionLoading(false)
    if (res.error) {
      setFeedback({ type: 'error', msg: res.error })
    } else {
      setFeedback({ type: 'success', msg: `Promoted ${res.count} student(s) to Semester ${promoteSem}, Year ${promoteYear}.` })
      setSelectedIds(new Set())
      setShowPromoteBar(false)
      setTimeout(() => setFeedback(null), 4000)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Users size={20} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase tracking-tighter text-zinc-800 dark:text-zinc-200">
              Manage Students
            </h2>
            <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
              {dept} Department — {students.length} total
            </p>
          </div>
        </div>
        {selectedIds.size > 0 && (
          <button
            onClick={() => setShowPromoteBar(!showPromoteBar)}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-xs font-mono uppercase tracking-widest hover:bg-zinc-800 transition-colors"
          >
            <ArrowUpCircle size={14} />
            Promote ({selectedIds.size})
          </button>
        )}
      </div>

      {/* Bulk Promote Bar */}
      {showPromoteBar && selectedIds.size > 0 && (
        <div className="bg-zinc-900 text-white p-6 rounded-2xl space-y-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">
              Bulk Promote — {selectedIds.size} student(s) selected
            </p>
            <button onClick={() => setShowPromoteBar(false)} className="text-zinc-400 hover:text-white">
              <X size={16} />
            </button>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">Target Semester</label>
              <select
                value={promoteSem}
                onChange={e => setPromoteSem(Number(e.target.value))}
                className="block w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-white"
              >
                {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">Target Year</label>
              <select
                value={promoteYear}
                onChange={e => setPromoteYear(Number(e.target.value))}
                className="block w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-white"
              >
                {YEARS.map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
            <button
              onClick={handleBulkPromote}
              disabled={actionLoading}
              className="flex items-center gap-2 px-6 py-2 bg-white text-black rounded-xl text-xs font-mono font-bold uppercase tracking-widest hover:bg-zinc-200 disabled:opacity-50 transition-colors"
            >
              {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <GraduationCap size={14} />}
              Confirm Promotion
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by name or USN..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-zinc-900"
          />
        </div>

        {/* Semester chips */}
        <div className="space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Semester</p>
          <div className="flex flex-wrap gap-2">
            {SEMESTERS.map(s => (
              <button
                key={s}
                onClick={() => toggleSem(s)}
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold border transition-all ${
                  selectedSemesters.includes(s)
                    ? 'bg-black text-white border-black'
                    : 'bg-white dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-700 hover:border-black dark:hover:border-white'
                }`}
              >
                S{s}
              </button>
            ))}
            {selectedSemesters.length > 0 && (
              <button onClick={() => setSelectedSemesters([])} className="px-2 py-1 text-xs text-zinc-400 hover:text-black dark:hover:text-white font-mono">
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Year chips */}
        <div className="space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Year</p>
          <div className="flex flex-wrap gap-2">
            {YEARS.map(y => (
              <button
                key={y}
                onClick={() => toggleYear(y)}
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold border transition-all ${
                  selectedYears.includes(y)
                    ? 'bg-black text-white border-black'
                    : 'bg-white dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-700 hover:border-black dark:hover:border-white'
                }`}
              >
                Y{y}
              </button>
            ))}
            {selectedYears.length > 0 && (
              <button onClick={() => setSelectedYears([])} className="px-2 py-1 text-xs text-zinc-400 hover:text-black dark:hover:text-white font-mono">
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`px-4 py-3 rounded-xl font-mono text-sm flex items-center gap-2 ${
          feedback.type === 'success'
            ? 'border border-green-300 bg-green-50 text-green-700'
            : 'border border-red-300 bg-red-50 text-red-700'
        }`}>
          {feedback.type === 'success' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
          {feedback.msg}
        </div>
      )}

      {/* Student Table */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900">
        {/* Table header */}
        <div className="grid grid-cols-[40px_1fr_140px_60px_60px_100px_80px] gap-2 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 items-center">
          <input
            type="checkbox"
            checked={allFilteredSelected}
            onChange={toggleSelectAll}
            className="w-4 h-4 rounded accent-black cursor-pointer"
          />
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Student</span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 font-bold">USN</span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 font-bold text-center">Sem</span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 font-bold text-center">Year</span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 font-bold text-center">Status</span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 font-bold text-center">Action</span>
        </div>

        {/* Rows */}
        {filtered.length > 0 ? (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-[500px] overflow-y-auto">
            {filtered.map(student => (
              <div
                key={student.id}
                className={`grid grid-cols-[40px_1fr_140px_60px_60px_100px_80px] gap-2 px-4 py-3 items-center hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${
                  selectedIds.has(student.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(student.id)}
                  onChange={() => toggleSelect(student.id)}
                  className="w-4 h-4 rounded accent-black cursor-pointer"
                />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate">{student.full_name}</p>
                </div>
                <span className="font-mono text-xs text-zinc-500 truncate">{student.usn}</span>
                <span className="font-mono text-xs text-zinc-500 text-center">S{student.semester}</span>
                <span className="font-mono text-xs text-zinc-500 text-center">Y{student.year}</span>
                <div className="flex flex-col items-center gap-1">
                  {student.has_backlog && (
                    <span className="px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-full font-bold">
                      Backlog
                    </span>
                  )}
                  {student.year_back && (
                    <span className="px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider bg-red-500/10 text-red-600 border border-red-500/20 rounded-full font-bold">
                      Year Back
                    </span>
                  )}
                  {!student.has_backlog && !student.year_back && (
                    <span className="px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider bg-green-500/10 text-green-600 border border-green-500/20 rounded-full font-bold">
                      Active
                    </span>
                  )}
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={() => openEdit(student)}
                    className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-black dark:hover:border-white transition-colors"
                    title="Edit student"
                  >
                    <Edit3 size={13} className="text-zinc-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <Users size={32} className="mx-auto text-zinc-200 dark:text-zinc-700 mb-4" />
            <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">No students match filters</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="font-black text-lg uppercase tracking-tight text-zinc-900 dark:text-white">Edit Student</h3>
                <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">{editStudent.usn}</p>
              </div>
              <button onClick={() => setEditStudent(null)} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <X size={16} className="text-zinc-400" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Full Name</label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                  className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm font-mono bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                />
              </div>

              {/* USN */}
              <div className="space-y-1">
                <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 font-bold">USN</label>
                <input
                  type="text"
                  value={editForm.usn}
                  onChange={e => setEditForm(f => ({ ...f, usn: e.target.value.toUpperCase() }))}
                  className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm font-mono bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                />
              </div>

              {/* Department */}
              <div className="space-y-1">
                <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Department</label>
                <select
                  value={editForm.department}
                  onChange={e => setEditForm(f => ({ ...f, department: e.target.value }))}
                  className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm font-mono bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                >
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Semester + Year */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Semester</label>
                  <select
                    value={editForm.semester}
                    onChange={e => setEditForm(f => ({ ...f, semester: Number(e.target.value) }))}
                    className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm font-mono bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  >
                    {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Year</label>
                  <select
                    value={editForm.year}
                    onChange={e => setEditForm(f => ({ ...f, year: Number(e.target.value) }))}
                    className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm font-mono bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  >
                    {YEARS.map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
              </div>

              {/* Backlog flags */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.has_backlog}
                    onChange={e => setEditForm(f => ({ ...f, has_backlog: e.target.checked }))}
                    className="w-4 h-4 rounded accent-amber-500"
                  />
                  <span className="font-mono text-xs uppercase tracking-wider text-zinc-600 dark:text-zinc-400">Has Backlog</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.year_back}
                    onChange={e => setEditForm(f => ({ ...f, year_back: e.target.checked }))}
                    className="w-4 h-4 rounded accent-red-500"
                  />
                  <span className="font-mono text-xs uppercase tracking-wider text-zinc-600 dark:text-zinc-400">Year Back</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={() => setEditStudent(null)}
                className="px-4 py-2 text-sm font-mono border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={actionLoading}
                className="flex items-center gap-2 px-5 py-2 bg-black text-white text-sm font-mono rounded-xl hover:bg-zinc-800 disabled:opacity-50 transition-colors"
              >
                {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
