'use client'

import React, { useState } from 'react'
import { Compass, CheckSquare, Square, Sparkles, BookOpen, Layers, ArrowRight } from 'lucide-react'

interface SkillItem {
  id: string
  name: string
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  resource: string
}

const ROADMAP_TRACKS: Record<string, { title: string; desc: string; skills: SkillItem[] }> = {
  fullstack: {
    title: 'Full Stack Web Engineering',
    desc: 'Master frontend interfaces, backend microservices, SQL/NoSQL databases, and cloud deployments.',
    skills: [
      { id: 'fs1', name: 'HTML5, CSS3, JavaScript (ES6+) & DOM', level: 'Beginner', resource: 'MDN Web Docs' },
      { id: 'fs2', name: 'React.js & Component State Management', level: 'Beginner', resource: 'react.dev' },
      { id: 'fs3', name: 'TypeScript & Type Safety Patterns', level: 'Intermediate', resource: 'typescriptlang.org' },
      { id: 'fs4', name: 'Next.js 14+ (App Router & Server Actions)', level: 'Intermediate', resource: 'nextjs.org' },
      { id: 'fs5', name: 'Node.js, Express & REST API Architecture', level: 'Intermediate', resource: 'nodejs.org' },
      { id: 'fs6', name: 'PostgreSQL, Supabase & Database Schema Design', level: 'Intermediate', resource: 'supabase.com' },
      { id: 'fs7', name: 'Docker Containerization & CI/CD Pipelines', level: 'Advanced', resource: 'docker.com' }
    ]
  },
  aiml: {
    title: 'AI & Machine Learning Specialist',
    desc: 'Build foundational knowledge in Python, data analysis, deep learning, and LLM fine-tuning.',
    skills: [
      { id: 'ai1', name: 'Python Programming, NumPy & Pandas', level: 'Beginner', resource: 'python.org' },
      { id: 'ai2', name: 'Linear Algebra, Probability & Statistics', level: 'Beginner', resource: 'Khan Academy' },
      { id: 'ai3', name: 'Supervised & Unsupervised Machine Learning (Scikit-Learn)', level: 'Intermediate', resource: 'scikit-learn.org' },
      { id: 'ai4', name: 'Neural Networks & Deep Learning (PyTorch / TensorFlow)', level: 'Intermediate', resource: 'pytorch.org' },
      { id: 'ai5', name: 'Natural Language Processing & Transformer Models', level: 'Advanced', resource: 'huggingface.co' },
      { id: 'ai6', name: 'LLM Fine-Tuning, RAG Architecture & Vector DBs', level: 'Advanced', resource: 'langchain.com' }
    ]
  },
  devops: {
    title: 'Cloud & DevOps Architecture',
    desc: 'Learn infrastructure automation, CI/CD pipelines, Kubernetes orchestration, and cloud security.',
    skills: [
      { id: 'do1', name: 'Linux Shell Scripting & Bash Automation', level: 'Beginner', resource: 'linux.org' },
      { id: 'do2', name: 'Git, GitHub Actions & CI/CD Pipelines', level: 'Beginner', resource: 'github.com/features/actions' },
      { id: 'do3', name: 'Docker & Containerization Standard', level: 'Intermediate', resource: 'docker.com' },
      { id: 'do4', name: 'Kubernetes Cluster Orchestration', level: 'Intermediate', resource: 'kubernetes.io' },
      { id: 'do5', name: 'Terraform Infrastructure as Code (IaC)', level: 'Advanced', resource: 'terraform.io' },
      { id: 'do6', name: 'AWS Cloud Architecture (EC2, S3, RDS, Lambda)', level: 'Advanced', resource: 'aws.amazon.com' }
    ]
  }
}

export function CareerRoadmapTool() {
  const [selectedTrack, setSelectedTrack] = useState('fullstack')
  const [completed, setCompleted] = useState<Record<string, boolean>>({
    fs1: true,
    fs2: true,
    fs3: true
  })

  const currentTrack = ROADMAP_TRACKS[selectedTrack]

  const toggleSkill = (id: string) => {
    setCompleted(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const trackSkills = currentTrack.skills
  const completedCount = trackSkills.filter(s => completed[s.id]).length
  const progressPercent = Math.round((completedCount / trackSkills.length) * 100)

  return (
    <div className="space-y-6 font-mono text-zinc-900 dark:text-white">
      {/* Header Banner */}
      <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500 text-black rounded-xl font-bold shrink-0">
            <Compass size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase font-mono">Interactive Career Roadmap &amp; Skill Gap Matrix</h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Track skill milestones and identify curriculum gaps to become job-ready for top tech firms.
            </p>
          </div>
        </div>
      </div>

      {/* Track Selector Buttons */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {Object.entries(ROADMAP_TRACKS).map(([key, track]) => (
          <button
            key={key}
            onClick={() => setSelectedTrack(key)}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all shrink-0 ${
              selectedTrack === key
                ? 'bg-amber-500 text-black shadow-md'
                : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
            }`}
          >
            {track.title}
          </button>
        ))}
      </div>

      {/* Progress Bar & Details */}
      <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl text-white space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="text-lg font-black uppercase font-mono">{currentTrack.title}</h4>
            <span className="text-xs font-mono font-bold uppercase bg-amber-500/20 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-full">
              {progressPercent}% Track Completed
            </span>
          </div>
          <p className="text-xs font-mono text-zinc-400 leading-relaxed">{currentTrack.desc}</p>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden border border-zinc-800">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Skill Checklist */}
        <div className="space-y-3 pt-2">
          <h5 className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Skill Milestones Checklist</h5>

          <div className="space-y-2">
            {trackSkills.map((skill) => {
              const isDone = Boolean(completed[skill.id])
              return (
                <div
                  key={skill.id}
                  onClick={() => toggleSkill(skill.id)}
                  className={`p-3.5 border rounded-2xl flex items-center justify-between gap-4 cursor-pointer transition-all ${
                    isDone
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isDone ? (
                      <CheckSquare size={18} className="text-emerald-400 shrink-0" />
                    ) : (
                      <Square size={18} className="text-zinc-600 shrink-0" />
                    )}
                    <span className={`text-xs font-mono ${isDone ? 'line-through text-zinc-400' : 'font-bold'}`}>
                      {skill.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono uppercase bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-md">
                      {skill.level}
                    </span>
                    <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                      <BookOpen size={10} /> {skill.resource}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
