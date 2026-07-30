'use client'

import React, { useState } from 'react'
import { FileText, Search, CheckCircle2, AlertTriangle, Sparkles, Copy, RefreshCw, Upload } from 'lucide-react'

const SAMPLE_RESUME = `Nived Kumar
Student Developer | Computer Science Department | Gopalan Skill Academy
Email: nived@gopalan.edu | GitHub: github.com/nived | LinkedIn: linkedin.com/in/nived

TECHNICAL SKILLS
Languages: TypeScript, JavaScript, Python, C++, HTML5, CSS3, SQL
Frameworks: React, Next.js, Node.js, Express, TailwindCSS, Redux Toolkit
Databases & Cloud: PostgreSQL, Supabase, MongoDB, Firebase, Docker, Vercel
Tools & Practices: Git, GitHub, REST APIs, Agile, CI/CD, Jest, Vitest

PROJECTS
Curdrice Platform | Next.js, Supabase, TypeScript, TailwindCSS
- Built full-stack student management and club event platform for Gopalan Skill Academy.
- Integrated automated certificate generation, QR code scanning, and live survey analytics.
- Reduced event check-in times by 65% through real-time attendance verification.

AutoCert Engine | Node.js, PDF-Lib, AWS S3
- Architected automated PDF certificate rendering pipeline processing 500+ credentials per minute.
- Implemented cryptographic signature verification and QR verification links.

EDUCATION
B.E. in Computer Science & Engineering | Gopalan Skill Academy
Expected Graduation: 2026 | Current CGPA: 8.75`

const SAMPLE_JOB_DESC = `Senior Full Stack Developer / Software Engineer
We are seeking a Full Stack Developer skilled in React, Next.js, TypeScript, Node.js, and PostgreSQL. 
Requirements:
- Strong knowledge of TypeScript, JavaScript ES6+, and RESTful APIs.
- Experience with modern frontend frameworks: React, Next.js, TailwindCSS.
- Backend proficiency with Node.js, Express, PostgreSQL / Supabase, and SQL queries.
- Cloud deployment experience with Docker, Vercel, AWS S3, and CI/CD pipelines.
- Unit testing experience using Jest or Vitest.
- Excellent problem-solving, Git version control, and Agile team collaboration skills.`

export function ATSResumeCheckerTool() {
  const [resumeText, setResumeText] = useState(SAMPLE_RESUME)
  const [jobDesc, setJobDesc] = useState(SAMPLE_JOB_DESC)
  const [analyzing, setAnalyzing] = useState(false)
  const [results, setResults] = useState<any>(null)

  const handleAnalyze = () => {
    if (!resumeText.trim()) return
    setAnalyzing(true)

    setTimeout(() => {
      const resumeLower = resumeText.toLowerCase()
      const jobLower = jobDesc.toLowerCase()

      // Technical Keywords List
      const keywords = [
        'react', 'next.js', 'typescript', 'javascript', 'node.js', 'express',
        'postgresql', 'supabase', 'mongodb', 'sql', 'tailwind', 'css', 'html',
        'docker', 'aws', 'vercel', 'git', 'github', 'rest', 'api', 'ci/cd',
        'jest', 'vitest', 'agile', 'python', 'c++', 'redux', 'testing'
      ]

      const jobKeywords = keywords.filter(kw => jobLower.includes(kw))
      const targetKeywords = jobKeywords.length > 0 ? jobKeywords : keywords

      const matched = targetKeywords.filter(kw => resumeLower.includes(kw))
      const missing = targetKeywords.filter(kw => !resumeLower.includes(kw))

      const keywordScore = Math.round((matched.length / targetKeywords.length) * 100)

      // Section checks
      const hasEducation = resumeLower.includes('education') || resumeLower.includes('degree') || resumeLower.includes('b.e.')
      const hasExperience = resumeLower.includes('project') || resumeLower.includes('experience') || resumeLower.includes('work')
      const hasSkills = resumeLower.includes('skill') || resumeLower.includes('technolog')
      const hasContact = resumeLower.includes('@') || resumeLower.includes('email') || resumeLower.includes('github')

      let sectionScore = 0
      if (hasEducation) sectionScore += 25
      if (hasExperience) sectionScore += 25
      if (hasSkills) sectionScore += 25
      if (hasContact) sectionScore += 25

      const overallScore = Math.round((keywordScore * 0.7) + (sectionScore * 0.3))

      const recommendations: string[] = []
      if (missing.length > 0) {
        recommendations.push(`Include target keywords like: ${missing.slice(0, 5).join(', ')}.`)
      }
      if (!hasContact) {
        recommendations.push('Add clear contact information (Email, GitHub, LinkedIn).')
      }
      if (resumeText.split(/\s+/).length < 150) {
        recommendations.push('Your resume length appears short. Elaborate on project impact and metrics.')
      } else {
        recommendations.push('Great work! Your resume contains measurable project metrics.')
      }

      setResults({
        overallScore,
        keywordScore,
        sectionScore,
        matched,
        missing,
        hasEducation,
        hasExperience,
        hasSkills,
        hasContact,
        recommendations,
        wordCount: resumeText.split(/\s+/).length
      })
      setAnalyzing(false)
    }, 600)
  }

  return (
    <div className="space-y-6 font-mono text-zinc-900 dark:text-white">
      {/* Tool Intro Header */}
      <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500 text-black rounded-xl font-bold shrink-0">
            <FileText size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase font-mono">ATS Resume Optimizer &amp; Keyword Matcher</h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Analyze your resume against job specifications to boost ATS pass rates and interview callbacks.
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setResumeText(SAMPLE_RESUME)
            setJobDesc(SAMPLE_JOB_DESC)
            setResults(null)
          }}
          className="text-xs text-amber-600 dark:text-amber-400 font-bold uppercase hover:underline flex items-center gap-1 shrink-0"
        >
          <RefreshCw size={12} /> Reset Sample
        </button>
      </div>

      {/* Input Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Resume Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
            <span>Your Resume Content *</span>
            <span className="text-[10px] text-zinc-400">{resumeText.split(/\s+/).length} words</span>
          </label>
          <textarea
            rows={10}
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your plain text resume or project experience here..."
            className="w-full p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-mono outline-none focus:border-amber-500 transition-colors resize-none"
          />
        </div>

        {/* Right: Job Description Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
            <span>Target Job Description / Role *</span>
            <span className="text-[10px] text-zinc-400">{jobDesc.split(/\s+/).length} words</span>
          </label>
          <textarea
            rows={10}
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
            placeholder="Paste target job requirements or skills requested by recruiters..."
            className="w-full p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-mono outline-none focus:border-amber-500 transition-colors resize-none"
          />
        </div>
      </div>

      {/* Analyze Button */}
      <button
        onClick={handleAnalyze}
        disabled={analyzing || !resumeText.trim()}
        className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-widest text-xs rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
      >
        {analyzing ? (
          <>
            <RefreshCw size={16} className="animate-spin" /> Analyzing ATS Match Matrix...
          </>
        ) : (
          <>
            <Sparkles size={16} /> Run ATS Resume Scan
          </>
        )}
      </button>

      {/* Results View */}
      {results && (
        <div className="p-6 bg-zinc-900/90 border border-zinc-800 rounded-3xl space-y-6 text-white animate-in fade-in duration-300">
          {/* Score Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-center space-y-1">
              <span className="text-xs font-bold uppercase text-zinc-400">Overall ATS Score</span>
              <p className={`text-4xl font-black ${results.overallScore >= 75 ? 'text-emerald-400' : results.overallScore >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                {results.overallScore}%
              </p>
            </div>
            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-center space-y-1">
              <span className="text-xs font-bold uppercase text-zinc-400">Keyword Match Rate</span>
              <p className="text-3xl font-black text-amber-400">{results.keywordScore}%</p>
            </div>
            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-center space-y-1">
              <span className="text-xs font-bold uppercase text-zinc-400">Section Completeness</span>
              <p className="text-3xl font-black text-blue-400">{results.sectionScore}%</p>
            </div>
          </div>

          {/* Keywords Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-2xl space-y-3">
              <h5 className="text-xs font-bold uppercase text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={14} /> Matched Keywords ({results.matched.length})
              </h5>
              <div className="flex flex-wrap gap-2">
                {results.matched.map((kw: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg text-[11px] uppercase font-bold">
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-2xl space-y-3">
              <h5 className="text-xs font-bold uppercase text-amber-400 flex items-center gap-1.5">
                <AlertTriangle size={14} /> Missing Target Keywords ({results.missing.length})
              </h5>
              <div className="flex flex-wrap gap-2">
                {results.missing.map((kw: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-lg text-[11px] uppercase font-bold">
                    + {kw}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-2">
            <h5 className="text-xs font-bold uppercase text-amber-500">Actionable ATS Improvements</h5>
            <ul className="space-y-1.5 text-xs text-zinc-300">
              {results.recommendations.map((rec: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-500">›</span> {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
