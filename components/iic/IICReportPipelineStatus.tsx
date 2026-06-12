'use client'

import React from 'react'
import { Check, X, AlertCircle, Clock } from 'lucide-react'

type Step = {
  id: string
  label: string
  status: 'completed' | 'active' | 'upcoming' | 'rejected'
  description?: string
}

type IICReportPipelineStatusProps = {
  status: string
  rejectedTo?: string | null
}

export function IICReportPipelineStatus({ status, rejectedTo }: IICReportPipelineStatusProps) {
  // Determine states for each of the 4 pipeline steps:
  // 1. Draft (CC)
  // 2. PR Audit
  // 3. Faculty Review
  // 4. HOD

  const steps: Step[] = [
    {
      id: 'draft',
      label: 'Draft Submitted',
      status: 'upcoming',
    },
    {
      id: 'pr_audit',
      label: 'PR Audit',
      status: 'upcoming',
    },
    {
      id: 'faculty_review',
      label: 'Faculty Review',
      status: 'upcoming',
    },
    {
      id: 'hod_auth',
      label: 'HOD',
      status: 'upcoming',
    },
  ]

  // Step 1: Draft Submitted
  if (status === 'draft' || status === 'generated') {
    steps[0].status = 'active'
    steps[0].description = 'CC drafting report'
  } else if (status === 'rejected_pr' || (status === 'rejected_faculty' && rejectedTo === 'cc')) {
    steps[0].status = 'rejected'
    steps[0].description = 'Needs CC revision'
  } else {
    steps[0].status = 'completed'
  }

  // Step 2: PR Audit
  if (steps[0].status === 'completed') {
    if (status === 'pending_pr') {
      steps[1].status = 'active'
      steps[1].description = 'Pending PR verification'
    } else if (status === 'approved_pr') {
      steps[1].status = 'active'
      steps[1].description = 'PR approved (waiting push)'
    } else if (status === 'rejected_faculty' && rejectedTo === 'pr') {
      steps[1].status = 'rejected'
      steps[1].description = 'Needs PR revision'
    } else if (status === 'pending_faculty' || status === 'approved_faculty' || status === 'pending_hod' || status === 'approved') {
      steps[1].status = 'completed'
    }
  }

  // Step 3: Faculty Review
  if (steps[1].status === 'completed') {
    if (status === 'pending_faculty') {
      steps[2].status = 'active'
      steps[2].description = 'Pending faculty endorsement'
    } else if (status === 'approved_faculty') {
      steps[2].status = 'active'
      steps[2].description = 'Faculty endorsed (waiting push)'
    } else if (status === 'rejected_hod') {
      // HOD rejection goes back to faculty/HOD review queue
      steps[2].status = 'rejected'
      steps[2].description = 'Needs faculty review'
    } else if (status === 'pending_hod' || status === 'approved') {
      steps[2].status = 'completed'
    }
  }

  // Step 4: HOD
  if (steps[2].status === 'completed') {
    if (status === 'pending_hod') {
      steps[3].status = 'active'
      steps[3].description = 'Pending HOD approval'
    } else if (status === 'approved') {
      steps[3].status = 'completed'
      steps[3].description = 'Report is fully authorized'
    }
  }

  return (
    <div className="w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 transition-all">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-3">
          <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-500">Live Pipeline Status</h4>
          <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-500/20">
            <Clock size={10} /> Active Tracking
          </span>
        </div>

        {/* Stepper Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-2 pt-2">
          {steps.map((step, idx) => {
            const isLast = idx === steps.length - 1

            return (
              <div key={step.id} className="flex flex-col md:flex-row items-start md:items-center relative group">
                <div className="flex items-center gap-3 md:flex-col md:items-center md:text-center md:gap-2 flex-1">
                  {/* Indicator Icon */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                      step.status === 'completed'
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : step.status === 'active'
                        ? 'bg-white dark:bg-zinc-950 border-black dark:border-white text-black dark:text-white shadow-md animate-pulse'
                        : step.status === 'rejected'
                        ? 'bg-rose-500 border-rose-500 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 text-zinc-400'
                    }`}
                  >
                    {step.status === 'completed' ? (
                      <Check size={16} strokeWidth={3} className="text-white" />
                    ) : step.status === 'rejected' ? (
                      <X size={16} strokeWidth={3} className="text-white" />
                    ) : step.status === 'active' ? (
                      <Clock size={14} className="text-black dark:text-white" />
                    ) : (
                      <span className="text-[10px] font-bold font-mono">{idx + 1}</span>
                    )}
                  </div>

                  {/* Text details */}
                  <div className="text-left md:text-center space-y-0.5">
                    <p
                      className={`text-xs font-bold uppercase tracking-tight ${
                        step.status === 'completed'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : step.status === 'active'
                          ? 'text-black dark:text-white'
                          : step.status === 'rejected'
                          ? 'text-rose-500 font-black'
                          : 'text-zinc-400 dark:text-zinc-500'
                      }`}
                    >
                      {step.label}
                    </p>
                    {step.description && (
                      <p className="text-[9px] font-mono text-zinc-500 dark:text-zinc-400 leading-none">
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Connector Line for Desktop */}
                {!isLast && (
                  <div className="hidden md:block absolute top-4 left-[calc(50%+1.5rem)] right-[-calc(50%-1.5rem)] h-0.5 bg-zinc-200 dark:bg-zinc-800 -z-10">
                    <div
                      className={`h-full transition-all duration-500 ${
                        step.status === 'completed' ? 'bg-emerald-500 w-full' : 'w-0'
                      }`}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
