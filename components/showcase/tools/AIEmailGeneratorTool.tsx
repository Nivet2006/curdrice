'useContent'
'use client'

import React, { useState } from 'react'
import { Mail, Copy, Check, Sparkles, RefreshCw, Send } from 'lucide-react'
import { toast } from 'sonner'

const TEMPLATES: Record<string, { label: string; subject: string; body: (data: any) => string }> = {
  internship: {
    label: 'Internship Cold Email',
    subject: 'Application for Software Engineering Internship Opportunity - {studentName}',
    body: (data) => `Dear ${data.recipientName || 'Hiring Manager'},

I hope this email finds you well.

My name is ${data.studentName || 'Nived Kumar'}, and I am a Computer Science & Engineering student at Gopalan Skill Academy. I have been closely following ${data.companyName || 'your organization'} and admire your work in scalable web engineering and product innovation.

I am writing to express my strong interest in a Software Engineering / Full Stack Internship at ${data.companyName || 'your company'}. I have hands-on experience building web applications using React, Next.js, TypeScript, Node.js, and PostgreSQL. Recently, I built ${data.highlight || 'an automated credential verification platform processing 500+ daily transactions'}.

I would welcome the opportunity to discuss how my skills and passion for clean engineering could contribute to your team's goals.

Attached is my resume for your review. My GitHub profile is available at github.com/${data.github || 'nived'}.

Thank you for your time and consideration.

Warm regards,

${data.studentName || 'Nived Kumar'}
Computer Science & Engineering | Gopalan Skill Academy
Email: ${data.email || 'nived@gopalan.edu'}
LinkedIn: linkedin.com/in/${data.linkedin || 'nived'}`
  },
  referral: {
    label: 'Alumni Referral Request',
    subject: 'Request for Career Advice & Referral for {role} at {companyName}',
    body: (data) => `Dear ${data.recipientName || 'Alumni Senior'},

Hope you are doing well!

My name is ${data.studentName || 'Nived'}, currently pursuing my degree in Computer Science at Gopalan Skill Academy. As a fellow student from the academy, I came across your profile and admire your technical journey at ${data.companyName || 'Tech Corp'}.

I am currently preparing for ${data.role || 'Full Stack Developer'} opportunities and noticed an open position at ${data.companyName || 'Tech Corp'}. Given my background in ${data.highlight || 'TypeScript, React, Node.js, and cloud backend design'}, I believe I would be a great fit for the team.

Would you be open to a brief chat or considering referring my resume for this role? I would be immensely grateful for any guidance you could share.

Thank you so much for your time and support!

Best regards,

${data.studentName || 'Nived Kumar'}
Gopalan Skill Academy`
  },
  extension: {
    label: 'Assignment Extension Request',
    subject: 'Request for Extension on {assignmentName} - {studentName} ({usn})',
    body: (data) => `Respected ${data.recipientName || 'Professor'},

I am writing to formally request a short extension on the submission for ${data.assignmentName || 'Data Structures Assignment 3'}, which is currently due on ${data.dueDate || 'tomorrow'}.

${data.reason || 'Due to technical difficulties during server deployment and lab testing, I require a few additional hours to optimize and finalize the test cases.'}

I assure you that I am putting in full effort to complete the work with high quality. Would it be possible to extend my submission deadline to ${data.newDate || 'Friday, 5:00 PM'}?

Thank you very much for your understanding and consideration.

Sincerely,

${data.studentName || 'Nived Kumar'}
USN: ${data.usn || '1GD22CS001'}
Department of Computer Science & Engineering
Gopalan Skill Academy`
  }
}

export function AIEmailGeneratorTool() {
  const [selectedTemplate, setSelectedTemplate] = useState('internship')
  const [studentName, setStudentName] = useState('Nived Kumar')
  const [recipientName, setRecipientName] = useState('Hiring Manager')
  const [companyName, setCompanyName] = useState('Google / Tech Startup')
  const [highlight, setHighlight] = useState('Full-stack React & Next.js web application architecture')
  const [copied, setCopied] = useState(false)

  const activeTpl = TEMPLATES[selectedTemplate] || TEMPLATES.internship

  const formattedSubject = activeTpl.subject
    .replace('{studentName}', studentName || 'Student')
    .replace('{companyName}', companyName || 'Company')
    .replace('{role}', 'Software Engineer')

  const formattedBody = activeTpl.body({
    studentName,
    recipientName,
    companyName,
    highlight,
    email: 'nived@gopalan.edu'
  })

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${formattedSubject}\n\n${formattedBody}`)
    setCopied(true)
    toast.success('Email draft copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6 font-mono text-zinc-900 dark:text-white">
      {/* Banner */}
      <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500 text-black rounded-xl font-bold shrink-0">
            <Mail size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase font-mono">AI Professional Email &amp; Cold Outreach Generator</h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Generate high-impact email drafts for internships, alumni referrals, and academic requests.
            </p>
          </div>
        </div>
      </div>

      {/* Template Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {Object.entries(TEMPLATES).map(([key, tpl]) => (
          <button
            key={key}
            onClick={() => setSelectedTemplate(key)}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all shrink-0 ${
              selectedTemplate === key
                ? 'bg-amber-500 text-black shadow-md'
                : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
            }`}
          >
            {tpl.label}
          </button>
        ))}
      </div>

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-zinc-400">Your Full Name</label>
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono outline-none focus:border-amber-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-zinc-400">Recipient Name / Title</label>
          <input
            type="text"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono outline-none focus:border-amber-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-zinc-400">Company / Organization / Course</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono outline-none focus:border-amber-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-zinc-400">Key Project / Skill Highlight</label>
          <input
            type="text"
            value={highlight}
            onChange={(e) => setHighlight(e.target.value)}
            className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Generated Email Preview Box */}
      <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl text-white space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <span className="text-xs font-bold uppercase text-amber-400 flex items-center gap-1.5">
            <Sparkles size={14} /> Generated Professional Draft
          </span>
          <button
            onClick={handleCopy}
            className="px-3.5 py-1.5 bg-amber-500 text-black font-bold uppercase text-xs rounded-xl flex items-center gap-1.5 hover:bg-amber-400 transition-colors shadow"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy Draft'}
          </button>
        </div>

        <div className="space-y-2 text-xs font-mono">
          <p className="text-zinc-400 font-bold">Subject: <span className="text-white">{formattedSubject}</span></p>
          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl whitespace-pre-wrap leading-relaxed text-zinc-300">
            {formattedBody}
          </div>
        </div>
      </div>
    </div>
  )
}
