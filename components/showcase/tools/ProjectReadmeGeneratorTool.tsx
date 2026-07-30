'use client'

import React, { useState } from 'react'
import { FileCode, Copy, Check, Sparkles, Terminal } from 'lucide-react'
import { toast } from 'sonner'

export function ProjectReadmeGeneratorTool() {
  const [projectName, setProjectName] = useState('Curdrice Platform')
  const [tagline, setTagline] = useState('High-performance student utility hub and club management platform')
  const [techStack, setTechStack] = useState('Next.js 14, TypeScript, Supabase, TailwindCSS, Framer Motion')
  const [features, setFeatures] = useState('Real-Time Attendance Verification, ATS Resume Checker, VTU SGPA Calculator, Certificate Generation Pipeline')
  const [copied, setCopied] = useState(false)

  const readmeMarkdown = `# 🚀 ${projectName}

> ${tagline}

![License](https://img.shields.io/badge/License-MIT-blue.svg) ![Next.js](https://img.shields.io/badge/Next.js-14-black.svg) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)

---

## ⚡ Overview
**${projectName}** is engineered by students at **Gopalan Skill Academy** to deliver seamless student utilities, academic tools, and event infrastructure.

## ✨ Key Features
${features.split(',').map(f => `- **${f.trim()}**`).join('\n')}

## 🛠️ Technology Stack
- **Framework**: ${techStack}
- **Database & Auth**: PostgreSQL / Supabase
- **Styling**: Vanilla CSS / TailwindCSS
- **Deployment**: Vercel Cloud Platform

## 📦 Installation & Setup

\`\`\`bash
# 1. Clone the repository
git clone https://github.com/nived/${projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.git

# 2. Navigate to project directory
cd ${projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}

# 3. Install dependencies
npm install

# 4. Start local development server
npm run dev
\`\`\`

---

## 📄 License
Distributed under the MIT License. See \`LICENSE\` for more details.

*Built with ❤️ at Gopalan Skill Academy.*`

  const handleCopy = () => {
    navigator.clipboard.writeText(readmeMarkdown)
    setCopied(true)
    toast.success('README.md markdown copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6 font-mono text-zinc-900 dark:text-white">
      {/* Banner */}
      <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500 text-black rounded-xl font-bold shrink-0">
            <FileCode size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase font-mono">GitHub Project README.md Markdown Generator</h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Generate production-ready GitHub documentation, architecture badges, and setup guides.
            </p>
          </div>
        </div>
      </div>

      {/* Form Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-zinc-400">Project Name</label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono outline-none focus:border-amber-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-zinc-400">Short Tagline / Pitch</label>
          <input
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono outline-none focus:border-amber-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-zinc-400">Tech Stack (Comma Separated)</label>
          <input
            type="text"
            value={techStack}
            onChange={(e) => setTechStack(e.target.value)}
            className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono outline-none focus:border-amber-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-zinc-400">Key Features (Comma Separated)</label>
          <input
            type="text"
            value={features}
            onChange={(e) => setFeatures(e.target.value)}
            className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Output Code Block */}
      <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl text-white space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <span className="text-xs font-bold uppercase text-amber-400 flex items-center gap-1.5">
            <Terminal size={14} /> Generated README.md Markdown
          </span>
          <button
            onClick={handleCopy}
            className="px-3.5 py-1.5 bg-amber-500 text-black font-bold uppercase text-xs rounded-xl flex items-center gap-1.5 hover:bg-amber-400 transition-colors shadow"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy README.md'}
          </button>
        </div>

        <pre className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-xs font-mono overflow-x-auto text-zinc-300 leading-relaxed whitespace-pre-wrap">
          {readmeMarkdown}
        </pre>
      </div>
    </div>
  )
}
