'use client'

import React, { useState, useEffect } from 'react'
import {
  Code2,
  Video,
  FileText,
  Github,
  CheckCircle2,
  Edit3,
  Upload,
  ExternalLink,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { submitProject } from '@/lib/actions/hackathon-eval-actions'
import { toast } from 'sonner'

interface ProjectSubmissionPortalProps {
  eventId: string
  teamId: string
  teamName: string
  isTeamMember: boolean
  submissionsEnabled?: boolean
  submissionConfig?: {
    title?: boolean
    description?: boolean
    repo_url?: boolean
    demo_url?: boolean
    slides_url?: boolean
    design_url?: boolean
    tech_stack?: boolean
    future_scope?: boolean
  }
}

interface Submission {
  project_title: string
  project_description: string
  repo_url: string | null
  demo_url: string | null
  tech_stack: string | null
  slides_url: string | null
  design_url: string | null
  future_scope: string | null
  submitted_at: string
}

export function ProjectSubmissionPortal({
  eventId,
  teamId,
  teamName,
  isTeamMember,
  submissionsEnabled = true,
  submissionConfig = { title: true, description: true, repo_url: true, demo_url: true, slides_url: false, design_url: false, tech_stack: false, future_scope: false }
}: ProjectSubmissionPortalProps) {
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [repoUrl, setRepoUrl] = useState('')
  const [demoUrl, setDemoUrl] = useState('')
  const [techStack, setTechStack] = useState('')
  const [slidesUrl, setSlidesUrl] = useState('')
  const [designUrl, setDesignUrl] = useState('')
  const [futureScope, setFutureScope] = useState('')

  useEffect(() => {
    fetchSubmission()
  }, [teamId])

  async function fetchSubmission() {
    setLoading(true)
    try {
      const res = await fetch(`/api/hackathon/submission?teamId=${teamId}`)
      if (res.ok) {
        const data = await res.json()
        if (data.submission) {
          setSubmission(data.submission)
          setTitle(data.submission.project_title)
          setDescription(data.submission.project_description)
          setRepoUrl(data.submission.repo_url || '')
          setDemoUrl(data.submission.demo_url || '')
          setTechStack(data.submission.tech_stack || '')
          setSlidesUrl(data.submission.slides_url || '')
          setDesignUrl(data.submission.design_url || '')
          setFutureScope(data.submission.future_scope || '')
        }
      }
    } catch {
      // No submission yet
    }
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!submissionsEnabled) return
    if (!title.trim() || !description.trim()) return

    setSubmitting(true)
    const res = await submitProject(
      eventId,
      teamId,
      title.trim(),
      description.trim(),
      repoUrl.trim(),
      demoUrl.trim(),
      techStack.trim(),
      slidesUrl.trim(),
      designUrl.trim(),
      futureScope.trim()
    )
    setSubmitting(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(submission ? 'Project updated successfully!' : 'Project submitted successfully!')
      setEditing(false)
      fetchSubmission()
    }
  }

  if (loading) {
    return (
      <div className="py-8 text-center animate-pulse">
        <Loader2 size={20} className="mx-auto text-zinc-300 animate-spin" />
        <p className="font-mono text-xs text-zinc-400 mt-2">Loading submission...</p>
      </div>
    )
  }

  const showForm = editing || !submission

  // Check which fields are collected
  const showRepoField = submissionConfig?.repo_url !== false
  const showDemoField = submissionConfig?.demo_url !== false
  const showSlidesField = submissionConfig?.slides_url === true
  const showDesignField = submissionConfig?.design_url === true
  const showTechField = submissionConfig?.tech_stack === true
  const showFutureField = submissionConfig?.future_scope === true

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-6 md:p-8 space-y-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-zinc-100 dark:border-zinc-800 pb-5">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter text-[#0a0a0a] dark:text-white flex items-center gap-2">
            <Code2 size={22} className="text-violet-500" />
            Project Submission
          </h2>
          <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest mt-1">
            Team: <span className="text-zinc-600 dark:text-zinc-300 font-bold">{teamName}</span>
          </p>
        </div>
        {submission && !editing && isTeamMember && submissionsEnabled && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl text-xs font-mono uppercase font-bold transition-all"
          >
            <Edit3 size={12} />
            Edit
          </button>
        )}
      </div>

      {/* Submitted view */}
      {submission && !editing ? (
        <div className="space-y-5">
          {submissionsEnabled ? (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                Submitted · {new Date(submission.submitted_at).toLocaleDateString()}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span className="text-xs font-mono font-bold text-rose-700 dark:text-rose-400">
                Submissions Closed · Project Submitted
              </span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-1">Project Title</p>
              <h3 className="text-xl font-black text-zinc-900 dark:text-white">{submission.project_title}</h3>
            </div>
            {showTechField && submission.tech_stack && (
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-1">Tech Stack Used</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {submission.tech_stack.split(',').map((tech, i) => (
                    <span key={i} className="text-[10px] font-mono uppercase font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-350 px-2 py-0.5 rounded">
                      {tech.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-1">Description</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">{submission.project_description}</p>
            </div>
            {showFutureField && submission.future_scope && (
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-1">Future Scope / Next Steps</p>
                <p className="text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">{submission.future_scope}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {showRepoField && (
              submission.repo_url ? (
                <a
                  href={submission.repo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-xs font-mono font-bold hover:bg-zinc-800 dark:hover:bg-white transition-all group"
                >
                  <Github size={14} />
                  Repository
                  <ExternalLink size={10} className="ml-auto opacity-60 group-hover:opacity-100" />
                </a>
              ) : (
                <div className="flex items-center gap-2 px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono text-zinc-400">
                  <Github size={14} />
                  No repo link provided
                </div>
              )
            )}
            {showDemoField && (
              submission.demo_url ? (
                <a
                  href={submission.demo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-3 bg-violet-600 text-white rounded-xl text-xs font-mono font-bold hover:bg-violet-700 transition-all group"
                >
                  <Video size={14} />
                  Demo / Presentation
                  <ExternalLink size={10} className="ml-auto opacity-60 group-hover:opacity-100" />
                </a>
              ) : (
                <div className="flex items-center gap-2 px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono text-zinc-400">
                  <Video size={14} />
                  No demo link provided
                </div>
              )
            )}
            {showSlidesField && submission.slides_url && (
              <a
                href={submission.slides_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-mono font-bold transition-all group"
              >
                <Video size={14} />
                Presentation Slides
                <ExternalLink size={10} className="ml-auto opacity-60 group-hover:opacity-100" />
              </a>
            )}
            {showDesignField && submission.design_url && (
              <a
                href={submission.design_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-mono font-bold transition-all group"
              >
                <ExternalLink size={14} />
                Figma / Design File
                <ExternalLink size={10} className="ml-auto opacity-60 group-hover:opacity-100" />
              </a>
            )}
          </div>
        </div>
      ) : !submissionsEnabled ? (
        /* Submissions closed view when no submission exists */
        <div className="py-8 text-center space-y-2">
          <AlertCircle size={24} className="mx-auto text-rose-500" />
          <p className="text-sm font-mono text-rose-600 dark:text-rose-450 font-bold uppercase tracking-wider">Project Submissions are Closed</p>
          <p className="text-xs text-zinc-450 dark:text-zinc-400">Your team did not submit a project before the deadline.</p>
        </div>
      ) : isTeamMember ? (
        /* Submission form */
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 flex items-center gap-1">
              <FileText size={10} />
              Project Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. EcoTrack — Carbon Footprint Monitor"
              required
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-all"
            />
          </div>

          {showTechField && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 flex items-center gap-1">
                <Code2 size={10} />
                Tech Stack Used (comma separated)
              </label>
              <input
                type="text"
                value={techStack}
                onChange={e => setTechStack(e.target.value)}
                placeholder="e.g. Next.js, TailwindCSS, Supabase, TypeScript"
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-all"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 flex items-center gap-1">
              <FileText size={10} />
              Project Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe your project: what it does, the tech stack used, the problem it solves..."
              required
              rows={5}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-all resize-none"
            />
          </div>

          {showFutureField && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 flex items-center gap-1">
                <FileText size={10} />
                Future Scope / Next Steps
              </label>
              <textarea
                value={futureScope}
                onChange={e => setFutureScope(e.target.value)}
                placeholder="Where do you see this project heading next? Any planned features?"
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-all resize-none"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {showRepoField && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 flex items-center gap-1">
                  <Github size={10} />
                  Repository URL
                </label>
                <input
                  type="url"
                  value={repoUrl}
                  onChange={e => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-all"
                />
              </div>
            )}
            {showDemoField && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 flex items-center gap-1">
                  <Video size={10} />
                  Demo / Video URL
                </label>
                <input
                  type="url"
                  value={demoUrl}
                  onChange={e => setDemoUrl(e.target.value)}
                  placeholder="https://youtube.com/... or https://..."
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-all"
                />
              </div>
            )}
            {showSlidesField && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 flex items-center gap-1">
                  <Video size={10} />
                  Presentation Slides URL
                </label>
                <input
                  type="url"
                  value={slidesUrl}
                  onChange={e => setSlidesUrl(e.target.value)}
                  placeholder="https://docs.google.com/presentation/..."
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-all"
                />
              </div>
            )}
            {showDesignField && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 flex items-center gap-1">
                  <ExternalLink size={10} />
                  Figma / Design File URL
                </label>
                <input
                  type="url"
                  value={designUrl}
                  onChange={e => setDesignUrl(e.target.value)}
                  placeholder="https://figma.com/file/..."
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-all"
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            {editing && (
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-5 py-2.5 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl text-xs font-mono uppercase font-bold transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={submitting || !title.trim() || !description.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <><Loader2 size={14} className="animate-spin" /> Submitting...</>
              ) : (
                <><Upload size={14} /> {submission ? 'Update Project' : 'Submit Project'}</>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* Not a member, show info */
        <div className="py-8 text-center space-y-2">
          <AlertCircle size={24} className="mx-auto text-zinc-300" />
          <p className="text-sm font-mono text-zinc-500">Only team members can submit or edit the project.</p>
        </div>
      )}
    </div>
  )
}
