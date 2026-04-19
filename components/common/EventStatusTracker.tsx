'use client'

import React from 'react'
import { Check, Clock, ShieldAlert } from 'lucide-react'

export type EventApprovalStatus = 'draft' | 'pending_teacher' | 'pending_hod' | 'approved' | 'rejected'

interface EventStatusTrackerProps {
  status: EventApprovalStatus
}

export function EventStatusTracker({ status }: EventStatusTrackerProps) {
  const steps = [
    {
      id: 'draft',
      label: 'Draft Submitted',
      isCompleted: status !== 'draft',
      isActive: false, // Once submitted, it's done
    },
    {
      id: 'teacher',
      label: 'Faculty Review',
      isCompleted: ['pending_hod', 'approved'].includes(status),
      isActive: status === 'pending_teacher',
    },
    {
      id: 'hod',
      label: 'HOD Authorization',
      isCompleted: status === 'approved',
      isActive: status === 'pending_hod',
    },
    {
      id: 'published',
      label: 'Event Published',
      isCompleted: status === 'approved',
      isActive: false,
    }
  ]

  return (
    <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 space-y-8 shadow-sm transition-colors">
      <h3 className="font-bold text-lg text-[#0a0a0a] dark:text-white flex items-center gap-2">
        <Clock size={18} className="text-zinc-400" />
        Pipeline Status
      </h3>
      <div className="space-y-6">
        {steps.map((step, idx) => (
          <div 
            key={step.id} 
            className={`flex items-center gap-4 transition-all duration-300 ${
              step.isCompleted || step.isActive ? 'opacity-100' : 'opacity-30'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
              step.isCompleted ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 
              step.isActive ? 'border-amber-500 animate-pulse bg-amber-500/10' : 'border-zinc-200 dark:border-zinc-800'
            }`}>
              {step.isCompleted ? (
                <Check size={16} strokeWidth={4} className="text-white" />
              ) : step.isActive ? (
                <Clock size={14} className="text-amber-600 dark:text-amber-500" />
              ) : (
                <div className="w-1 h-1 rounded-full bg-zinc-300" />
              )}
            </div>
            <div>
              <p className={`text-[10px] font-mono font-bold uppercase tracking-widest ${
                step.isActive ? 'text-amber-600 dark:text-amber-500' : 'text-zinc-600 dark:text-zinc-400'
              }`}>
                {step.label}
              </p>
              {step.isActive && (
                <p className="text-[10px] text-zinc-400 mt-0.5 italic">Action Required</p>
              )}
              {status === 'rejected' && step.isActive && (
                 <div className="mt-2 flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold text-[9px] uppercase font-mono">
                    <ShieldAlert size={10} />
                    Revision Requested
                 </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
