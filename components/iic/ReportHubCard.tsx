'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Lock, CheckCircle2, Download, AlertCircle } from 'lucide-react';

export function ReportHubCard({ eventId }: { eventId: string }) {
  const [status, setStatus] = useState<{ total: number; submitted: number; isComplete: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<{ status: string; pdf_url: string | null } | null>(null);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch(`/api/reports/check-feedback-status?eventId=${eventId}`);
        if (res.ok) {
          const data = await res.json();
          setStatus(data);
        }
        
        // Also fetch if there is an existing report generated
        const reportRes = await fetch(`/api/reports/existing?eventId=${eventId}`);
        if (reportRes.ok) {
          const reportData = await reportRes.json();
          if (reportData.report) {
             setReportData(reportData.report);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchStatus();
  }, [eventId]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-10 mt-0 animate-pulse">
        <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800 rounded mb-4"></div>
        <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded"></div>
      </div>
    );
  }

  // Calculate progress safely
  const isComplete = status?.isComplete || false;
  const progressPercent = status?.total && status.total > 0 
    ? Math.min(100, Math.round((status.submitted / status.total) * 100)) 
    : 0;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 mt-0 shadow-sm relative overflow-hidden group transition-colors">
      <div className="absolute top-0 left-0 w-full h-1 bg-black dark:bg-white"></div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-black dark:text-white">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="font-bold text-xl tracking-tight text-[#0a0a0a] dark:text-white">IIC Activity Report</h2>
              <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mt-1">Official Ministry Format</p>
            </div>
          </div>
 
          <div className="space-y-2 max-w-md">
            <div className="flex items-center justify-between text-xs font-medium text-zinc-600 dark:text-zinc-400">
              <span>Feedback Status</span>
              <span className={isComplete ? "text-black dark:text-white font-bold" : ""}>
                {status?.submitted || 0} / {status?.total || 0} Students
              </span>
            </div>
            <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${isComplete ? 'bg-black dark:bg-white' : 'bg-zinc-400 dark:bg-zinc-500'}`}
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            {isComplete ? (
              <p className="text-xs text-black dark:text-white flex items-center gap-1.5 mt-2 font-medium">
                <CheckCircle2 size={14} className="text-emerald-500" /> All student feedback collected
              </p>
            ) : (
              <p className="text-xs text-zinc-500 flex items-center gap-1.5 mt-2">
                <AlertCircle size={14} /> Required for report generation
              </p>
            )}
          </div>
        </div>
 
        <div className="flex flex-col gap-3 min-w-[200px]">
          {isComplete || reportData ? (
            <Link 
              href={`/dashboard/events/${eventId}/report`}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#0a0a0a] text-white font-bold shadow-lg transition-all active:scale-[0.98] hover:opacity-90"
            >
              <FileText size={16} />
              {reportData ? 'Edit Report' : 'Generate Report'}
            </Link>
          ) : (
            <button 
              disabled
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed border border-zinc-200 dark:border-zinc-700 font-medium"
              title={`Report unlocks after all ${status?.total || 0} students submit feedback. ${((status?.total || 0) - (status?.submitted || 0))} pending.`}
            >
              <Lock size={16} />
              Generate Report
            </button>
          )}
 
          {reportData?.pdf_url && (
            <a 
              href={reportData.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-black dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-black dark:text-white font-bold transition-all"
            >
              <Download size={16} />
              Download PDF
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
