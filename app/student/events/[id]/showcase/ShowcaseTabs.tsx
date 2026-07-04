'use client'

import React, { useState } from 'react'
import {
  Github,
  Video,
  ExternalLink,
  Presentation,
  Layout,
  Code2,
  FileText,
  User,
  X,
  Trophy,
  AlertCircle,
  ShieldAlert,
  GitCommit,
  GitBranch,
  BarChart4,
  Cpu,
  RefreshCw
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { scanSubmission } from '@/lib/actions/hackathon-eval-actions'
import { toast } from 'sonner'

interface Submission {
  id: string
  project_title: string
  project_description: string
  repo_url: string | null
  demo_url: string | null
  tech_stack: string | null
  slides_url: string | null
  design_url: string | null
  future_scope: string | null
  submitted_at: string
  git_scan_status: string
  git_commit_velocity: any
  git_work_distribution: any
  git_architecture: any
  git_readme_content: string | null
  git_security_warnings: any
  git_plagiarism_index: number
  team: {
    id: string
    team_name: string
    leader: {
      full_name: string
    } | null
  } | null
}

interface ScoreboardItem {
  submission_id: string
  team_id?: string
  team_name: string
  project_title: string
  average_score: number
  eval_count: number
}

interface ShowcaseTabsProps {
  eventId: string
  submissions: Submission[]
  scoreboard: ScoreboardItem[]
  showScoreboard: boolean
  isCreator: boolean
  cardClass: string
  cardStyle: React.CSSProperties
}

export function ShowcaseTabs({
  eventId,
  submissions: initialSubmissions,
  scoreboard,
  showScoreboard,
  isCreator,
  cardClass,
  cardStyle
}: ShowcaseTabsProps) {
  const [activeTab, setActiveTab] = useState<'submissions' | 'scoreboard'>('submissions')
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null)
  const [modalTab, setModalTab] = useState<'overview' | 'readme' | 'architecture' | 'git'>('overview')
  const [scanningId, setScanningId] = useState<string | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions)

  async function handleRefreshScan(subId: string) {
    setScanningId(subId)
    const res = await scanSubmission(subId)
    setScanningId(null)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('GitHub repository re-scanned successfully!')
      // Fetch updated submissions list
      const freshRes = await fetch(`/api/hackathon/submission?teamId=${selectedSub?.team?.id}`)
      if (freshRes.ok) {
        const data = await freshRes.json()
        if (data.submission) {
          setSelectedSub(data.submission)
          setSubmissions(prev => prev.map(s => s.id === subId ? { ...s, ...data.submission } : s))
        }
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab('submissions')}
          className={`px-6 py-3 font-mono text-sm uppercase font-bold tracking-wider border-b-2 transition-all ${
            activeTab === 'submissions'
              ? 'border-violet-500 text-violet-600 dark:text-violet-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
          }`}
        >
          📁 Submissions ({submissions.length})
        </button>
        <button
          onClick={() => setActiveTab('scoreboard')}
          className={`px-6 py-3 font-mono text-sm uppercase font-bold tracking-wider border-b-2 transition-all ${
            activeTab === 'scoreboard'
              ? 'border-violet-500 text-violet-600 dark:text-violet-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
          }`}
        >
          🏆 Live Standings
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'submissions' ? (
        submissions.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-white/50 dark:bg-zinc-900/10">
            <AlertCircle size={32} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-3" />
            <p className="font-mono text-sm text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-bold">No submissions yet</p>
            <p className="text-xs text-zinc-400 mt-1">Teams haven't submitted their projects yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {submissions.map(sub => {
              const techTags = sub.tech_stack ? sub.tech_stack.split(',').map(t => t.trim()) : []
              const warningsCount = Array.isArray(sub.git_security_warnings) ? sub.git_security_warnings.length : 0

              return (
                <div
                  key={sub.id}
                  onClick={() => {
                    setSelectedSub(sub)
                    setModalTab('overview')
                  }}
                  className={`${cardClass} hover:scale-[1.02] cursor-pointer transition-all flex flex-col justify-between`}
                  style={cardStyle}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-mono uppercase bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded">
                        {sub.team?.team_name || 'Unknown'}
                      </span>
                      {warningsCount > 0 && (
                        <span className="flex items-center gap-1 text-[9px] font-mono font-bold text-rose-600 dark:text-rose-450 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded">
                          <ShieldAlert size={10} /> {warningsCount} Leak{warningsCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-black tracking-tight text-zinc-900 dark:text-white line-clamp-1">
                      {sub.project_title}
                    </h3>

                    <p className="text-xs text-zinc-550 dark:text-zinc-400 line-clamp-3 leading-relaxed">
                      {sub.project_description}
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-900 space-y-3">
                    {techTags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {techTags.slice(0, 3).map((tag, i) => (
                          <span
                            key={i}
                            className="text-[9px] font-mono uppercase font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {techTags.length > 3 && (
                          <span className="text-[9px] font-mono uppercase font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                            +{techTags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                    <span className="block font-mono text-[9px] text-zinc-400 uppercase tracking-wider">
                      Leader: {sub.team?.leader?.full_name || 'Anonymous'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : (
        /* Scoreboard view */
        !showScoreboard && !isCreator ? (
          <div className="text-center py-16 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-white/50 dark:bg-zinc-900/10">
            <AlertCircle size={32} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-3" />
            <p className="font-mono text-sm text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-bold">Standings not published</p>
            <p className="text-xs text-zinc-400 mt-1">The scoreboard visibility is currently disabled by the coordinator.</p>
          </div>
        ) : scoreboard.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-white/50 dark:bg-zinc-900/10">
            <AlertCircle size={32} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-3" />
            <p className="font-mono text-sm text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-bold">Scoreboard is empty</p>
            <p className="text-xs text-zinc-400 mt-1">No evaluations have been recorded yet.</p>
          </div>
        ) : (
          <div className={`${cardClass} max-w-4xl mx-auto space-y-6`} style={cardStyle}>
            {/* Header info */}
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-900 pb-4">
              <h3 className="font-black uppercase tracking-wider text-sm flex items-center gap-2">
                <Trophy size={16} className="text-amber-500" />
                Live Standings
              </h3>
              {!showScoreboard && isCreator && (
                <span className="font-mono text-[9px] uppercase tracking-wider text-rose-500 font-bold border border-rose-500/20 px-2.5 py-0.5 rounded-full bg-rose-500/5">
                  Hidden from students
                </span>
              )}
            </div>

            {/* List */}
            <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
              {scoreboard.map((item, idx) => (
                <div
                  key={item.submission_id}
                  className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-black shrink-0 ${
                      idx === 0 ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' :
                      idx === 1 ? 'bg-zinc-300/20 text-zinc-600 dark:text-zinc-300' :
                      idx === 2 ? 'bg-amber-700/15 text-amber-800 dark:text-amber-500' :
                      'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                    }`}>
                      {idx + 1}
                    </span>
                    <div className="truncate">
                      <p className="font-bold text-sm text-zinc-900 dark:text-white truncate">{item.team_name}</p>
                      <p className="text-xs text-zinc-400 truncate">{item.project_title}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-black text-sm">{item.average_score} pts</span>
                    <p className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest mt-0.5">
                      {item.eval_count} {item.eval_count === 1 ? 'review' : 'reviews'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* Details Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-start px-6 md:px-8 pt-6 pb-4 border-b border-zinc-100 dark:border-zinc-900 shrink-0">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono uppercase bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 px-2.5 py-0.5 rounded">
                    Team: {selectedSub.team?.team_name || 'Unknown'}
                  </span>
                  {selectedSub.git_scan_status === 'completed' && (
                    <span className="text-[9px] font-mono uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                      <Cpu size={10} /> Git Intelligence Active
                    </span>
                  )}
                </div>
                <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-white mt-2 truncate">
                  {selectedSub.project_title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {selectedSub.repo_url && (
                  <button
                    onClick={() => handleRefreshScan(selectedSub.id)}
                    disabled={scanningId === selectedSub.id || selectedSub.git_scan_status === 'scanning'}
                    className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-450 dark:text-zinc-400 transition-all disabled:opacity-50"
                    title="Re-scan Repository"
                  >
                    <RefreshCw size={14} className={scanningId === selectedSub.id || selectedSub.git_scan_status === 'scanning' ? 'animate-spin' : ''} />
                  </button>
                )}
                <button
                  onClick={() => setSelectedSub(null)}
                  className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Sub-navigation inside details modal */}
            <div className="flex border-b border-zinc-100 dark:border-zinc-900 px-6 md:px-8 bg-zinc-50/50 dark:bg-zinc-900/30 shrink-0">
              {[
                { id: 'overview', label: 'Overview', icon: FileText },
                ...(selectedSub.git_readme_content ? [{ id: 'readme', label: 'README.md', icon: Github }] : []),
                ...(selectedSub.git_architecture ? [{ id: 'architecture', label: 'System Map', icon: GitBranch }] : []),
                ...(selectedSub.git_commit_velocity || selectedSub.git_work_distribution ? [{ id: 'git', label: 'Git Analytics', icon: BarChart4 }] : [])
              ].map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setModalTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-4 py-3 font-mono text-[10px] uppercase font-bold tracking-wider border-b-2 transition-all ${
                      modalTab === tab.id
                        ? 'border-violet-500 text-violet-600 dark:text-violet-400'
                        : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                    }`}
                  >
                    <Icon size={12} />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Modal Body */}
            <div className="px-6 md:px-8 py-6 overflow-y-auto flex-1 space-y-6">
              {modalTab === 'overview' && (
                <div className="space-y-6">
                  {/* Security warnings */}
                  {Array.isArray(selectedSub.git_security_warnings) && selectedSub.git_security_warnings.length > 0 && (
                    <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                      <ShieldAlert className="text-rose-500 shrink-0 mt-0.5" size={18} />
                      <div>
                        <p className="text-xs font-mono font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Security warnings</p>
                        <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1 leading-relaxed">
                          Hardcoded secret signatures (e.g. Supabase, database URIs) were detected in code repositories. Purge git history.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Plagiarism index */}
                  {selectedSub.git_plagiarism_index > 0.6 && (
                    <div className="flex items-center gap-2.5 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                      <AlertCircle className="text-amber-500 shrink-0" size={15} />
                      <span className="text-[11px] font-mono font-bold text-amber-700 dark:text-amber-400">
                        Plagiarism Warning: Project description similarity index is {Math.round(selectedSub.git_plagiarism_index * 100)}%
                      </span>
                    </div>
                  )}

                  {/* Tech Stack */}
                  {selectedSub.tech_stack && (
                    <div className="space-y-1.5">
                      <h4 className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-1">
                        <Code2 size={11} />
                        Tech Stack Used
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedSub.tech_stack.split(',').map((tech, i) => (
                          <span key={i} className="text-[10px] font-mono uppercase font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-300 px-2 py-0.5 rounded">
                            {tech.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <div className="space-y-1.5">
                    <h4 className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-1">
                      <FileText size={11} />
                      Description
                    </h4>
                    <p className="text-xs md:text-sm text-zinc-650 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                      {selectedSub.project_description}
                    </p>
                  </div>

                  {/* Future Scope */}
                  {selectedSub.future_scope && (
                    <div className="space-y-1.5">
                      <h4 className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-1">
                        <Presentation size={11} />
                        Future Scope / Next Steps
                      </h4>
                      <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">
                        {selectedSub.future_scope}
                      </p>
                    </div>
                  )}

                  {/* Links Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-900">
                    {selectedSub.repo_url && (
                      <a
                        href={selectedSub.repo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-xs font-mono font-bold hover:bg-zinc-800 dark:hover:bg-white transition-all group"
                      >
                        <Github size={14} />
                        Repository Link
                        <ExternalLink size={10} className="ml-auto opacity-60 group-hover:opacity-100" />
                      </a>
                    )}
                    {selectedSub.demo_url && (
                      <a
                        href={selectedSub.demo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-3 bg-violet-600 text-white rounded-xl text-xs font-mono font-bold hover:bg-violet-700 transition-all group"
                      >
                        <Video size={14} />
                        Demo Video
                        <ExternalLink size={10} className="ml-auto opacity-60 group-hover:opacity-100" />
                      </a>
                    )}
                    {selectedSub.slides_url && (
                      <a
                        href={selectedSub.slides_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-3 bg-amber-600 text-white rounded-xl text-xs font-mono font-bold hover:bg-amber-700 transition-all group"
                      >
                        <Presentation size={14} />
                        Slides / Presentation
                        <ExternalLink size={10} className="ml-auto opacity-60 group-hover:opacity-100" />
                      </a>
                    )}
                    {selectedSub.design_url && (
                      <a
                        href={selectedSub.design_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-3 bg-pink-600 text-white rounded-xl text-xs font-mono font-bold hover:bg-pink-700 transition-all group"
                      >
                        <Layout size={14} />
                        Figma / Design File
                        <ExternalLink size={10} className="ml-auto opacity-60 group-hover:opacity-100" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {modalTab === 'readme' && selectedSub.git_readme_content && (
                <div className="prose prose-sm dark:prose-invert max-w-none text-zinc-650 dark:text-zinc-300">
                  <ReactMarkdown>{selectedSub.git_readme_content}</ReactMarkdown>
                </div>
              )}

              {modalTab === 'architecture' && selectedSub.git_architecture && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-2">Mapped Architecture Stack</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {((selectedSub.git_architecture as any).techStack || []).map((node: any, idx: number) => (
                        <div key={idx} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl p-3 text-center">
                          <p className="text-xs font-bold text-zinc-900 dark:text-white">{node.name}</p>
                          <p className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest mt-0.5">{node.type}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-2">Mermaid Diagram Flow</h4>
                    <pre className="p-4 bg-zinc-900 text-zinc-200 rounded-xl font-mono text-[10px] overflow-x-auto">
                      {selectedSub.git_architecture.mermaidDiagram}
                    </pre>
                  </div>
                </div>
              )}

              {modalTab === 'git' && (
                <div className="space-y-6">
                  {/* Commits velocity */}
                  {Array.isArray(selectedSub.git_commit_velocity) && selectedSub.git_commit_velocity.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-3 flex items-center gap-1.5">
                        <GitCommit size={12} className="text-violet-500" />
                        Hackathon Commit Velocity
                      </h4>
                      <div className="space-y-2.5">
                        {selectedSub.git_commit_velocity.map((c: any, i: number) => (
                          <div key={i} className="flex items-center gap-3 text-xs font-mono">
                            <span className="w-32 text-zinc-400 truncate">
                              {new Date(c.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-violet-600 rounded-full"
                                style={{ width: `${Math.min((c.commits / 10) * 100, 100)}%` }}
                              />
                            </div>
                            <span className="w-16 text-right font-bold">{c.commits} commits</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Work distribution */}
                  {Array.isArray(selectedSub.git_work_distribution) && selectedSub.git_work_distribution.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-3 flex items-center gap-1.5">
                        <BarChart4 size={12} className="text-violet-500" />
                        Equity Work Distribution
                      </h4>
                      <div className="space-y-3">
                        {selectedSub.git_work_distribution.map((w: any, i: number) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl text-xs">
                            <div className="flex items-center gap-2">
                              <User size={13} className="text-zinc-400" />
                              <span className="font-bold text-zinc-800 dark:text-zinc-200">{w.author}</span>
                            </div>
                            <div className="flex items-center gap-4 font-mono">
                              <span className="text-zinc-400">{w.commitCount} commits</span>
                              <span className="font-black text-violet-600 dark:text-violet-400">{w.percentage}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center px-6 md:px-8 py-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-900 font-mono text-[9px] uppercase tracking-widest text-zinc-400 shrink-0">
              <span>Leader: {selectedSub.team?.leader?.full_name || 'Anonymous'}</span>
              <span>Submitted: {new Date(selectedSub.submitted_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
