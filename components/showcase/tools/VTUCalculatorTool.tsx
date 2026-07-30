'use client'

import React, { useState } from 'react'
import { GraduationCap, Plus, Trash2, Calculator, Award, HelpCircle } from 'lucide-react'

interface Subject {
  id: string
  name: string
  credits: number
  gradePoint: number
}

const GRADE_OPTIONS = [
  { grade: 'O (Outstanding)', point: 10, range: '90-100%' },
  { grade: 'S (Excellent)', point: 9, range: '80-89%' },
  { grade: 'A (Very Good)', point: 8, range: '70-79%' },
  { grade: 'B (Good)', point: 7, range: '60-69%' },
  { grade: 'C (Above Average)', point: 6, range: '50-59%' },
  { grade: 'D (Average)', point: 5, range: '40-49%' },
  { grade: 'F (Fail)', point: 0, range: '<40%' }
]

export function VTUCalculatorTool() {
  const [subjects, setSubjects] = useState<Subject[]>([
    { id: '1', name: 'Data Structures & Algorithms', credits: 4, gradePoint: 9 },
    { id: '2', name: 'Database Management Systems', credits: 4, gradePoint: 8 },
    { id: '3', name: 'Operating Systems', credits: 3, gradePoint: 9 },
    { id: '4', name: 'Software Engineering', credits: 3, gradePoint: 10 },
    { id: '5', name: 'DBMS Laboratory', credits: 2, gradePoint: 10 },
    { id: '6', name: 'DSA Laboratory', credits: 2, gradePoint: 9 }
  ])

  const addSubject = () => {
    const newSub: Subject = {
      id: Date.now().toString(),
      name: `Subject ${subjects.length + 1}`,
      credits: 3,
      gradePoint: 8
    }
    setSubjects([...subjects, newSub])
  }

  const removeSubject = (id: string) => {
    setSubjects(subjects.filter(s => s.id !== id))
  }

  const updateSubject = (id: string, field: keyof Subject, value: any) => {
    setSubjects(subjects.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  // Calculations
  const totalCredits = subjects.reduce((sum, s) => sum + Number(s.credits), 0)
  const totalPoints = subjects.reduce((sum, s) => sum + (Number(s.credits) * Number(s.gradePoint)), 0)
  const sgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00'
  const percentage = totalCredits > 0 ? (Math.max(0, (Number(sgpa) - 0.75) * 10)).toFixed(1) : '0.0'

  return (
    <div className="space-y-6 font-mono text-zinc-900 dark:text-white">
      {/* Header Banner */}
      <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500 text-black rounded-xl font-bold shrink-0">
            <GraduationCap size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase font-mono">VTU SGPA, CGPA &amp; Percentage Calculator</h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Calculate semester SGPA, cumulative CGPA, and official VTU percentage using standard CBCS grading.
            </p>
          </div>
        </div>
      </div>

      {/* Output Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-center space-y-1 text-white">
          <span className="text-xs font-bold uppercase text-zinc-400">Calculated SGPA</span>
          <p className="text-4xl font-black text-amber-400">{sgpa}</p>
        </div>

        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-center space-y-1 text-white">
          <span className="text-xs font-bold uppercase text-zinc-400">Equivalent Percentage</span>
          <p className="text-4xl font-black text-emerald-400">{percentage}%</p>
        </div>

        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-center space-y-1 text-white">
          <span className="text-xs font-bold uppercase text-zinc-400">Total Credits</span>
          <p className="text-4xl font-black text-blue-400">{totalCredits}</p>
        </div>
      </div>

      {/* Subjects Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400">Semester Course List</h4>
          <button
            onClick={addSubject}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase rounded-xl flex items-center gap-1 shadow-sm transition-transform active:scale-95"
          >
            <Plus size={14} /> Add Course
          </button>
        </div>

        <div className="space-y-3">
          {subjects.map((sub) => (
            <div
              key={sub.id}
              className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
            >
              {/* Course Title */}
              <input
                type="text"
                value={sub.name}
                onChange={(e) => updateSubject(sub.id, 'name', e.target.value)}
                placeholder="Course Name..."
                className="sm:col-span-5 p-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono outline-none focus:border-amber-500"
              />

              {/* Credits Input */}
              <div className="sm:col-span-3 flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-zinc-400">Credits:</span>
                <select
                  value={sub.credits}
                  onChange={(e) => updateSubject(sub.id, 'credits', Number(e.target.value))}
                  className="w-full p-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono outline-none focus:border-amber-500"
                >
                  <option value={4}>4 Credits</option>
                  <option value={3}>3 Credits</option>
                  <option value={2}>2 Credits</option>
                  <option value={1}>1 Credit</option>
                </select>
              </div>

              {/* Grade Input */}
              <div className="sm:col-span-3 flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-zinc-400">Grade:</span>
                <select
                  value={sub.gradePoint}
                  onChange={(e) => updateSubject(sub.id, 'gradePoint', Number(e.target.value))}
                  className="w-full p-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono outline-none focus:border-amber-500"
                >
                  {GRADE_OPTIONS.map((g) => (
                    <option key={g.point} value={g.point}>
                      {g.grade} ({g.point} pts)
                    </option>
                  ))}
                </select>
              </div>

              {/* Remove */}
              <div className="sm:col-span-1 flex justify-end">
                <button
                  onClick={() => removeSubject(sub.id)}
                  disabled={subjects.length <= 1}
                  className="p-2 text-zinc-400 hover:text-rose-500 disabled:opacity-30"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Formula Note */}
      <div className="p-4 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-[11px] text-zinc-500 dark:text-zinc-400 space-y-1">
        <p className="font-bold uppercase text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
          <HelpCircle size={13} /> VTU Official Conversion Formula:
        </p>
        <p>• SGPA = Σ (Course Credit × Grade Point) / Σ Course Credits</p>
        <p>• Equivalent Percentage = (CGPA - 0.75) × 10</p>
      </div>
    </div>
  )
}
