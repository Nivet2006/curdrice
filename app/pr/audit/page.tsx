import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { ClipboardCheck } from 'lucide-react'
import { PRAuditQueueClient } from './PRAuditQueueClient'

export default async function PRAuditPage() {
  const supabase = await createClient()

  // Fetch all reports with event details for the audit queue
  const { data: reports } = await supabase
    .from('reports')
    .select('*, events(title, club_name, targeted_department, event_date, location)')
    .order('created_at', { ascending: false })

  // Fetch all pending IIC reports
  const { data: iicReports } = await supabase
    .from('iic_event_reports')
    .select('*, events(title, club_name, targeted_department, event_date, location)')
    .in('status', ['pending_pr', 'approved_pr'])
    .order('generated_at', { ascending: false })

  return (
    <div className="space-y-12 pb-20">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0a0a0a] dark:bg-white flex items-center justify-center shadow-lg">
            <ClipboardCheck size={20} className="text-white dark:text-black" />
          </div>
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-zinc-500 font-bold">Report Pipeline</span>
        </div>
        <h1 className="text-5xl font-black tracking-tighter text-[#0a0a0a] dark:text-white leading-none uppercase">Audit Queue</h1>
        <p className="text-zinc-500 font-medium italic max-w-lg">
          Review, approve, or decline post-event reports. Any PR officer can audit reports.
        </p>
      </div>

      {/* Client-side filterable queue */}
      <PRAuditQueueClient reports={reports || []} iicReports={iicReports || []} />
    </div>
  )
}
