'use client';

import * as React from 'react';
import { CertLog } from '@/lib/cert/types';

export function AdminLogs() {
  const [logs, setLogs] = React.useState<CertLog[]>([]);

  // Ingest logs from localStorage
  const loadLogs = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cert_generator_logs');
      if (stored) {
        try {
          setLogs(JSON.parse(stored));
        } catch (err) {
          console.error(err);
        }
      }
    }
  };

  React.useEffect(() => {
    loadLogs();
  }, []);

  const clearLogs = () => {
    if (confirm('Are you sure you want to clear all generation logs?')) {
      localStorage.removeItem('cert_generator_logs');
      setLogs([]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h3 className="font-black text-lg dark:text-white uppercase tracking-tight">System Generation Logs</h3>
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">Audit trail of certificate production runs</span>
        </div>
        {logs.length > 0 && (
          <button
            type="button"
            onClick={clearLogs}
            className="px-3.5 py-2 border border-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 rounded-xl text-xs font-bold transition-all"
          >
            Clear History Logs
          </button>
        )}
      </div>

      <div className="border border-zinc-200 dark:border-zinc-800 rounded-[2rem] overflow-hidden bg-white dark:bg-zinc-950">
        {logs.length > 0 ? (
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 font-bold uppercase tracking-wider text-[10px] font-mono text-zinc-400">
              <tr>
                <th className="p-4">Run Timestamp</th>
                <th className="p-4">Template Title</th>
                <th className="p-4 text-center">Batch Count</th>
                <th className="p-4 text-center">Format</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                  <td className="p-4 font-mono text-zinc-400">{log.date}</td>
                  <td className="p-4 font-bold dark:text-white">{log.templateName}</td>
                  <td className="p-4 text-center font-mono dark:text-zinc-300">{log.count} records</td>
                  <td className="p-4 text-center">
                    <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold font-mono">
                      {log.format}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-20 text-center text-zinc-400 dark:text-zinc-600 font-mono text-xs">
            No historical certificate runs logged yet.
          </div>
        )}
      </div>
    </div>
  );
}
