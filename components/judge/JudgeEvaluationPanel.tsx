'use client'

import React, { useState, useEffect } from 'react'
import {
  Star,
  ChevronRight,
  Github,
  Video,
  ExternalLink,
  CheckCircle2,
  Loader2,
  Send,
  ArrowLeft,
  Users,
  Trophy,
  AlertCircle,
  ShieldAlert
} from 'lucide-react'
import { submitEvaluation } from '@/lib/actions/hackathon-eval-actions'
import { toast } from 'sonner'

interface Submission {
  id: string
  project_title: string
  project_description: string
  repo_url: string | null
  demo_url: string | null
  submitted_at: string
  git_scan_status?: string
  git_commit_velocity?: any
  git_work_distribution?: any
  git_plagiarism_index?: number
  git_security_warnings?: any
  team: {
    team_name: string
    leader: { full_name: string; usn: string }
  }
  myEvaluation?: {
    score_innovation: number
    score_technical: number
    score_design: number
    score_presentation: number
    feedback: string
  } | null
}

interface ScoreCriteria {
  key: 'innovation' | 'technical' | 'design' | 'presentation'
  label: string
  description: string
  color: string
}

const CRITERIA: ScoreCriteria[] = [
  { key: 'innovation', label: 'Innovation', description: 'Originality, creativity, and novelty of the idea', color: 'violet' },
  { key: 'technical', label: 'Technical Depth', description: 'Code quality, architecture, and implementation complexity', color: 'blue' },
  { key: 'design', label: 'Design & UX', description: 'User experience, interface polish, and visual clarity', color: 'emerald' },
  { key: 'presentation', label: 'Presentation', description: 'Clarity, confidence, and demo quality', color: 'amber' },
]

const colorMap: Record<string, string> = {
  violet: 'accent-violet-600',
  blue: 'accent-blue-600',
  emerald: 'accent-emerald-600',
  amber: 'accent-amber-500',
}

const bgColorMap: Record<string, string> = {
  violet: 'bg-violet-600',
  blue: 'bg-blue-600',
  emerald: 'bg-emerald-600',
  amber: 'bg-amber-500',
}

interface Props {
  submissions: Submission[]
  eventTitle: string
  eventId: string
}

export function JudgeEvaluationPanel({ submissions, eventTitle, eventId }: Props) {
  const [selected, setSelected] = useState<Submission | null>(null)
  const [scores, setScores] = useState({ innovation: 10, technical: 10, design: 10, presentation: 10 })
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [evaluatedIds, setEvaluatedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Pre-populate evaluated set from initial data
    const already = submissions
      .filter(s => s.myEvaluation)
      .map(s => s.id)
    setEvaluatedIds(new Set(already))
  }, [submissions])

  function selectSubmission(sub: Submission) {
    setSelected(sub)
    if (sub.myEvaluation) {
      setScores({
        innovation: sub.myEvaluation.score_innovation,
        technical: sub.myEvaluation.score_technical,
        design: sub.myEvaluation.score_design,
        presentation: sub.myEvaluation.score_presentation,
      })
      setFeedback(sub.myEvaluation.feedback || '')
    } else {
      setScores({ innovation: 10, technical: 10, design: 10, presentation: 10 })
      setFeedback('')
    }
  }

  async function handleSubmitEvaluation() {
    if (!selected) return
    setSubmitting(true)
    const res = await submitEvaluation(selected.id, scores, feedback)
    setSubmitting(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Evaluation submitted!')
      setEvaluatedIds(prev => new Set([...prev, selected.id]))
      setSelected(null)
    }
  }

  const totalScore = scores.innovation + scores.technical + scores.design + scores.presentation

  if (submissions.length === 0) {
    return (
      <div className="py-20 text-center border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-[2rem]">
        <AlertCircle size={32} className="mx-auto text-zinc-200 dark:text-zinc-700 mb-3" />
        <p className="font-mono text-sm text-zinc-400 uppercase tracking-widest">No submissions yet</p>
        <p className="text-xs text-zinc-400 mt-1">Teams haven't submitted their projects for this hackathon.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Submission List */}
      <div className={`${selected ? 'lg:col-span-2' : 'lg:col-span-5'} space-y-3`}>
        <div className="flex items-center gap-2 mb-4">
          <Users size={16} className="text-zinc-500" />
          <h3 className="font-bold text-sm uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
            Submissions <span className="text-zinc-400">({submissions.length})</span>
          </h3>
          <span className="ml-auto font-mono text-xs text-zinc-400">
            {evaluatedIds.size} / {submissions.length} evaluated
          </span>
        </div>

        <div className="space-y-2">
          {submissions.map(sub => {
            const isEvaluated = evaluatedIds.has(sub.id)
            const isSelected = selected?.id === sub.id

            return (
              <button
                key={sub.id}
                onClick={() => selectSubmission(sub)}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-4 group ${
                  isSelected
                    ? 'border-violet-500/50 bg-violet-50 dark:bg-violet-500/5'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm'
                }`}
              >
                {/* Status icon */}
                <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${
                  isEvaluated
                    ? 'bg-emerald-100 dark:bg-emerald-500/20'
                    : 'bg-zinc-100 dark:bg-zinc-800'
                }`}>
                  {isEvaluated
                    ? <CheckCircle2 size={16} className="text-emerald-600" />
                    : <Star size={16} className="text-zinc-400" />
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                    {sub.project_title}
                  </p>
                  <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest truncate">
                    {sub.team?.team_name}
                  </p>
                </div>

                {isEvaluated && (
                  <span className="shrink-0 text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                    Done
                  </span>
                )}
                <ChevronRight size={14} className={`shrink-0 transition-transform ${isSelected ? 'rotate-90 text-violet-500' : 'text-zinc-300 group-hover:text-zinc-500'}`} />
              </button>
            )
          })}
        </div>
      </div>

      {/* Evaluation Panel */}
      {selected && (
        <div className="lg:col-span-3 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => setSelected(null)}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all text-zinc-400"
            >
              <ArrowLeft size={16} />
            </button>
            <h3 className="font-black text-sm uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
              Evaluate Project
            </h3>
          </div>

          {/* Project info card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3">
            <div>
              <h4 className="font-black text-lg text-zinc-900 dark:text-white">{selected.project_title}</h4>
              <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mt-0.5">
                by {selected.team?.team_name} · Leader: {selected.team?.leader?.full_name}
              </p>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-4">
              {selected.project_description}
            </p>
            <div className="flex gap-2">
              {selected.repo_url && (
                <a href={selected.repo_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-[10px] font-mono font-bold hover:opacity-90 transition-all">
                  <Github size={11} /> Repo <ExternalLink size={9} />
                </a>
              )}
              {selected.demo_url && (
                <a href={selected.demo_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white rounded-lg text-[10px] font-mono font-bold hover:bg-violet-700 transition-all">
                  <Video size={11} /> Demo <ExternalLink size={9} />
                </a>
              )}
            </div>
          </div>

          {/* GitHub Intelligence Panel */}
          {selected.repo_url && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3.5">
              <h4 className="font-bold text-xs uppercase tracking-widest text-zinc-500">GitHub Intelligence</h4>
              
              {/* Scan status */}
              {selected.git_scan_status === 'scanning' && (
                <p className="text-xs font-mono text-zinc-400">Scanning repository in progress...</p>
              )}
              {selected.git_scan_status === 'failed' && (
                <p className="text-xs font-mono text-rose-500">Scan failed (repository might be private or invalid).</p>
              )}
              
              {selected.git_scan_status === 'completed' && (
                <div className="space-y-3">
                  {/* Plagiarism Alert */}
                  {selected.git_plagiarism_index !== undefined && selected.git_plagiarism_index > 0.6 && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl flex items-center gap-2">
                      <AlertCircle className="text-amber-600 shrink-0" size={14} />
                      <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 font-bold">
                        Plagiarism Warning: Similarity index is {Math.round(selected.git_plagiarism_index * 100)}%
                      </span>
                    </div>
                  )}

                  {/* Security Warnings */}
                  {Array.isArray(selected.git_security_warnings) && selected.git_security_warnings.length > 0 && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl flex items-center gap-2">
                      <ShieldAlert className="text-rose-600 shrink-0" size={14} />
                      <span className="text-[10px] font-mono text-rose-700 dark:text-rose-455 font-bold">
                        Security warning: {selected.git_security_warnings.length} leaked secrets detected in code.
                      </span>
                    </div>
                  )}

                  {/* Commit count */}
                  {Array.isArray(selected.git_commit_velocity) && (
                    <div className="text-xs font-mono text-zinc-550 dark:text-zinc-450">
                      Total Commits: <span className="font-black text-zinc-900 dark:text-white">
                        {selected.git_commit_velocity.reduce((acc: number, curr: any) => acc + (curr.commits || 0), 0)}
                      </span> during hackathon.
                    </div>
                  )}

                  {/* Work distribution breakdown */}
                  {Array.isArray(selected.git_work_distribution) && selected.git_work_distribution.length > 0 && (
                    <div className="space-y-1.5 pt-1 border-t border-zinc-100 dark:border-zinc-850">
                      <p className="text-[9px] font-mono uppercase tracking-widest text-zinc-400">Equity Breakdown</p>
                      <div className="grid grid-cols-2 gap-2">
                        {selected.git_work_distribution.map((w: any, idx: number) => (
                          <div key={idx} className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-2 text-[10px] font-mono">
                            <p className="font-bold truncate text-zinc-850 dark:text-zinc-300">{w.author}</p>
                            <p className="text-[9px] text-violet-600 dark:text-violet-400 font-black mt-0.5">{w.percentage}% code</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Scoring sliders */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-widest text-zinc-500">Scoring</h4>
              <div className="text-right">
                <span className="text-2xl font-black text-zinc-900 dark:text-white">{totalScore}</span>
                <span className="text-xs text-zinc-400 ml-1">/ 80</span>
              </div>
            </div>

            <div className="space-y-5">
              {CRITERIA.map(criterion => (
                <div key={criterion.key} className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <div>
                      <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{criterion.label}</p>
                      <p className="text-[9px] font-mono text-zinc-400 mt-0.5">{criterion.description}</p>
                    </div>
                    <span className={`text-lg font-black text-${criterion.color}-600 dark:text-${criterion.color}-400`}>
                      {scores[criterion.key]}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="range"
                      min={0}
                      max={20}
                      step={1}
                      value={scores[criterion.key]}
                      onChange={e => setScores(prev => ({ ...prev, [criterion.key]: Number(e.target.value) }))}
                      className={`w-full h-2 rounded-full appearance-none bg-zinc-100 dark:bg-zinc-800 cursor-pointer ${colorMap[criterion.color]}`}
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-[8px] font-mono text-zinc-400">0</span>
                      <span className="text-[8px] font-mono text-zinc-400">10</span>
                      <span className="text-[8px] font-mono text-zinc-400">20</span>
                    </div>
                  </div>
                  {/* Score bar */}
                  <div className="w-full h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${bgColorMap[criterion.color]}`}
                      style={{ width: `${(scores[criterion.key] / 20) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feedback */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              Judge Feedback <span className="text-zinc-400">(optional)</span>
            </label>
            <textarea
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder="Provide constructive feedback for the team..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all resize-none"
            />
          </div>

          <button
            onClick={handleSubmitEvaluation}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-mono font-bold uppercase tracking-wider transition-all disabled:opacity-50"
          >
            {submitting ? (
              <><Loader2 size={14} className="animate-spin" /> Submitting...</>
            ) : (
              <><Send size={14} /> Submit Evaluation</>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
