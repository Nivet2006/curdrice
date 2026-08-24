'use client'

import React from 'react'
import { X, Search, ShieldAlert, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import type { QueryStatItem, QueryAnalysisResult } from '@/lib/types/observability'

interface QueryAnalysisModalProps {
  query: QueryStatItem | null
  onClose: () => void
}

export function QueryAnalysisModal({ query, onClose }: QueryAnalysisModalProps) {
  if (!query) return null

  const analyzeQuery = (item: QueryStatItem): QueryAnalysisResult => {
    const isHighCalls = item.calls > 5000
    const isHighMeanTime = item.mean_time_ms > 100
    const isHighMaxTime = item.max_time_ms > 1000
    const isHighRows = item.total_rows > 100000

    let potentialIssue = 'Low individual execution latency with normal invocation frequency.'
    let evidence = `Executes ${item.calls.toLocaleString()} times with mean time of ${item.mean_time_ms} ms and max time of ${item.max_time_ms} ms.`
    let possibleOptimization = 'No immediate SQL rewrite required.'
    let risk = 'Low risk.'
    let recommendation = 'Monitor call frequency over time to ensure it does not scale exponentially.'

    if (isHighCalls && !isHighMeanTime) {
      potentialIssue = 'High call frequency may be more relevant than individual execution latency.'
      evidence = `Query executed ${item.calls.toLocaleString()} times. Mean execution latency is fast (${item.mean_time_ms} ms), but cumulative total time is ${item.total_time_sec}s.`
      possibleOptimization = 'Batch multiple queries into a single query or cache frequent read results at application level.'
      risk = 'Low risk to rewrite client caller, low risk of data lock.'
      recommendation = 'Investigate caller loops or N+1 queries in Next.js backend/Edge Functions. Do NOT add unnecessary database indexes.'
    } else if (isHighMeanTime || isHighMaxTime) {
      potentialIssue = 'Query execution latency exceeds target threshold.'
      evidence = `Mean execution time is ${item.mean_time_ms} ms and max execution spike reached ${item.max_time_ms} ms across ${item.calls.toLocaleString()} calls.`
      possibleOptimization = 'Review execution plan using EXPLAIN ANALYZE on a staging environment and check if indexes cover filter predicates.'
      risk = 'Moderate risk: Adding new indexes increases table write overhead during inserts and updates.'
      recommendation = 'Run EXPLAIN ANALYZE manually in Supabase SQL Editor before creating any index.'
    } else if (isHighRows) {
      potentialIssue = 'High tuple fetch count.'
      evidence = `Query returned or scanned ${item.total_rows.toLocaleString()} total rows across ${item.calls.toLocaleString()} calls.`
      possibleOptimization = 'Ensure query uses pagination (LIMIT / OFFSET or cursor keys) and selects only needed columns.'
      risk = 'Low risk.'
      recommendation = 'Refactor query to fetch smaller result sets per request.'
    }

    return {
      queryId: item.query_id,
      queryText: item.query,
      potentialIssue,
      evidence,
      possibleOptimization,
      risk,
      recommendation
    }
  }

  const analysis = analyzeQuery(query)

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search size={18} className="text-[var(--fg)]" />
            <h3 className="text-sm font-bold font-mono text-[var(--fg)]">Diagnostic Query Analysis</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--bg-subtle)] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 font-sans text-xs">
          {/* Query text */}
          <div>
            <span className="font-mono text-[10px] uppercase font-bold text-[var(--fg-muted)] tracking-wider block mb-1.5">
              Normalized Query SQL
            </span>
            <pre className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)] font-mono text-[11px] text-[var(--fg)] overflow-x-auto whitespace-pre-wrap break-all">
              {query.query}
            </pre>
          </div>

          {/* Metrics summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-[11px]">
            <div className="p-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)]">
              <span className="text-[var(--fg-muted)] block text-[10px]">Total Calls</span>
              <strong className="text-[var(--fg)]">{query.calls.toLocaleString()}</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)]">
              <span className="text-[var(--fg-muted)] block text-[10px]">Total Time</span>
              <strong className="text-[var(--fg)]">{query.total_time_sec} s</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)]">
              <span className="text-[var(--fg-muted)] block text-[10px]">Mean Time</span>
              <strong className="text-[var(--fg)]">{query.mean_time_ms} ms</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)]">
              <span className="text-[var(--fg-muted)] block text-[10px]">Max Time</span>
              <strong className="text-[var(--fg)]">{query.max_time_ms} ms</strong>
            </div>
          </div>

          {/* Analysis breakdown */}
          <div className="space-y-3 pt-2">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 space-y-1">
              <div className="font-bold font-mono flex items-center gap-1.5 text-xs">
                <AlertCircle size={14} /> Potential Issue
              </div>
              <p className="text-[11px] text-[var(--fg)] font-sans">{analysis.potentialIssue}</p>
            </div>

            <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)] space-y-1">
              <div className="font-bold font-mono flex items-center gap-1.5 text-xs text-[var(--fg)]">
                <Info size={14} className="text-blue-500" /> Empirical Evidence
              </div>
              <p className="text-[11px] text-[var(--fg-muted)]">{analysis.evidence}</p>
            </div>

            <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)] space-y-1">
              <div className="font-bold font-mono flex items-center gap-1.5 text-xs text-[var(--fg)]">
                <CheckCircle2 size={14} className="text-emerald-500" /> Possible Optimization
              </div>
              <p className="text-[11px] text-[var(--fg-muted)]">{analysis.possibleOptimization}</p>
            </div>

            <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)] space-y-1">
              <div className="font-bold font-mono flex items-center gap-1.5 text-xs text-[var(--fg)]">
                <ShieldAlert size={14} className="text-rose-500" /> Risk Assessment
              </div>
              <p className="text-[11px] text-[var(--fg-muted)]">{analysis.risk}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--fg)] text-[var(--bg)] font-sans space-y-1 shadow-sm">
              <div className="font-bold font-mono text-xs uppercase tracking-wider">
                Recommendation
              </div>
              <p className="text-[11px]">{analysis.recommendation}</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[var(--border)] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)] hover:bg-[var(--border)] font-mono text-xs font-bold text-[var(--fg)] transition-colors"
          >
            Close Analysis
          </button>
        </div>
      </div>
    </div>
  )
}
