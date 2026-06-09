'use client';

import * as React from 'react';
import { CertProject, CertRow } from '@/lib/cert/types';
import { generateSingleCertificate } from '@/lib/cert/certGenerator';
import { downloadZipBundle, resolveFileName } from '@/lib/cert/zipExporter';
import { saveFilesToLocalDirectory, isFileSystemAccessSupported } from '@/lib/cert/fileSystemSaver';

interface Step5GenerateProps {
  project: CertProject;
  onChangeRows: (rows: CertRow[]) => void;
  onAdvanceToReview: () => void;
}

export function Step5Generate({
  project,
  onChangeRows,
  onAdvanceToReview
}: Step5GenerateProps) {
  const [isRunning, setIsRunning] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [logs, setLogs] = React.useState<string[]>([]);
  const [eta, setEta] = React.useState<number | null>(null);
  const [reviewMode, setReviewMode] = React.useState(false);

  // References to keep track of state across intervals/loops safely
  const runRef = React.useRef(false);
  const pauseRef = React.useRef(false);
  const indexRef = React.useRef(0);
  const rowsRef = React.useRef<CertRow[]>([]);

  React.useEffect(() => {
    rowsRef.current = project.rows;
  }, [project.rows]);

  const handlePause = () => {
    setLogs(prev => ['⏸ Pausing is disabled in batch pipeline mode.', ...prev]);
  };

  const handleCancel = () => {
    setLogs(prev => ['🛑 Cancellation is disabled during active API dispatch.', ...prev]);
  };

  // ZIP Download Trigger
  const triggerZipDownload = async () => {
    const activeRows = project.rows.filter(r => r.outputBlob !== null);
    if (activeRows.length === 0) return;

    const files = activeRows.map((r, i) => {
      const finalName = resolveFileName(project.fileNamePattern, r.data, i, 'pdf');
      return {
        name: finalName,
        blob: r.outputBlob!
      };
    });

    await downloadZipBundle(files, 'certificates.zip');
  };

  // Save to Folder Picker Trigger
  const triggerFileSystemSave = async () => {
    const activeRows = project.rows.filter(r => r.outputBlob !== null);
    if (activeRows.length === 0) return;

    const files = activeRows.map((r, i) => {
      const finalName = resolveFileName(project.fileNamePattern, r.data, i, 'pdf');
      return {
        name: finalName,
        blob: r.outputBlob!
      };
    });

    try {
      const saved = await saveFilesToLocalDirectory(files);
      alert(`Successfully saved ${saved} files to selected folder!`);
    } catch (err) {
      console.error(err);
      alert('Could not save files: directory permissions denied.');
    }
  };

  const [sendEmails, setSendEmails] = React.useState(false);
  const [downloadZip, setDownloadZip] = React.useState(true);

  const startGeneration = async () => {
    if (project.rows.length === 0) return;
    
    setIsRunning(true);
    setIsPaused(false);
    setLogs(['🚀 Starting certificate automation pipeline...']);
    
    const { runCertificatePipeline } = await import('@/lib/cert/pipeline');
    
    const res = await runCertificatePipeline({
      project,
      sendEmail: sendEmails,
      downloadZip: downloadZip,
      onProgress: (p) => {
        setCurrentIndex(p.processedCount);
        if (p.status === 'generating') {
          setLogs(prev => [`⚙️ Generated ${p.processedCount}/${p.totalCount}...`, ...prev]);
        } else if (p.status === 'packaging') {
          setLogs(prev => [`📦 Packaging ZIP bundle...`, ...prev]);
        } else if (p.status === 'sending') {
          setLogs(prev => [`✉️ Sending email to ${p.currentEmail || 'recipient'}...`, ...prev]);
        }
      }
    });

    setIsRunning(false);
    
    if (res.success) {
      setLogs(prev => [`🎉 Batch Completed successfully!`, ...prev]);
      
      if (typeof window !== 'undefined') {
        const storedLogs = JSON.parse(localStorage.getItem('cert_generator_logs') || '[]');
        const runLog = {
          id: `log_${Date.now()}`,
          date: new Date().toLocaleString(),
          facultyName: 'Faculty User',
          templateName: project.templateFile?.name || 'Manual Template',
          count: totalCount,
          format: project.exportFormat.toUpperCase()
        };
        localStorage.setItem('cert_generator_logs', JSON.stringify([runLog, ...storedLogs]));
      }

      if (reviewMode) {
        onAdvanceToReview();
      }
    } else {
      setLogs(prev => [`❌ Pipeline failed: ${res.error}`, ...prev]);
    }
  };

  const totalCount = project.rows.length;
  const progressPercent = totalCount > 0 ? Math.round((currentIndex / totalCount) * 100) : 0;
  const completedGeneration = currentIndex === totalCount && totalCount > 0 && !isRunning;

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-6">
      
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black tracking-tight text-[#0a0a0a] dark:text-white uppercase">Automated Certificate Generator</h2>
        <p className="text-sm text-zinc-500 max-w-md mx-auto">
          Execute rendering and generation logic for the entire queue fully client-side.
        </p>
      </div>

      {/* Settings Row */}
      <div className="flex flex-col space-y-4 border-t border-b border-zinc-200 dark:border-zinc-800 py-4 text-sm">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-bold block dark:text-white">Review each before saving</span>
            <span className="text-xs text-zinc-400">Feed items into the interactive filmstrip preview grid on complete.</span>
          </div>
          <button
            type="button"
            disabled={isRunning}
            onClick={() => setReviewMode(!reviewMode)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              reviewMode ? 'bg-[#0a0a0a] dark:bg-white' : 'bg-zinc-200 dark:bg-zinc-800'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-zinc-950 shadow ring-0 transition duration-200 ease-in-out ${
                reviewMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 pt-4">
          <div>
            <span className="font-bold block dark:text-white">Download ZIP bundle when finished</span>
            <span className="text-xs text-zinc-400">Export all generated PDF files compiled into a single ZIP archive.</span>
          </div>
          <input
            type="checkbox"
            checked={downloadZip}
            onChange={(e) => setDownloadZip(e.target.checked)}
            className="w-4 h-4 rounded border-zinc-300 text-black focus:ring-black"
          />
        </div>

        <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 pt-4">
          <div>
            <span className="font-bold block dark:text-white">Email certificates to attendees</span>
            <span className="text-xs text-zinc-400">Automatically dispatch certificates as PDF attachments to mapped student emails.</span>
          </div>
          <input
            type="checkbox"
            checked={sendEmails}
            onChange={(e) => setSendEmails(e.target.checked)}
            className="w-4 h-4 rounded border-zinc-300 text-black focus:ring-black"
          />
        </div>
      </div>

      {/* Main trigger view */}
      {!isRunning && !completedGeneration && currentIndex === 0 && (
        <button
          type="button"
          onClick={startGeneration}
          className="w-full py-4 bg-[#0a0a0a] text-white dark:bg-white dark:text-black font-black uppercase tracking-widest hover:scale-101 active:scale-99 transition-all rounded-3xl text-sm shadow-xl"
        >
          🚀 Run Automation Pipeline ({totalCount} items)
        </button>
      )}

      {/* Progress display view */}
      {(isRunning || currentIndex > 0) && (
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono tracking-widest text-zinc-400 uppercase">
              <span>Generating Queue</span>
              <span>{progressPercent}% ({currentIndex}/{totalCount})</span>
            </div>
            
            {/* Progress Bar Container */}
            <div className="w-full h-3 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
              <div
                style={{ width: `${progressPercent}%` }}
                className="h-full bg-black dark:bg-white transition-all duration-200 ease-out"
              />
            </div>
          </div>

          {/* Running Stats */}
          {isRunning && (
            <div className="grid grid-cols-2 gap-4 text-center font-mono text-xs">
              <div className="p-3 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <span className="text-zinc-400 uppercase block mb-1">Time Remaining</span>
                <span className="font-bold text-sm dark:text-white">
                  {eta !== null ? `${eta}s` : 'Calculating...'}
                </span>
              </div>
              <div className="p-3 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <span className="text-zinc-400 uppercase block mb-1">Status</span>
                <span className="font-bold text-sm text-green-500">
                  {isPaused ? 'PAUSED' : 'ACTIVE'}
                </span>
              </div>
            </div>
          )}

          {/* Control Triggers */}
          {isRunning && (
            <div className="flex gap-4">
              <button
                type="button"
                onClick={handlePause}
                className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-black font-bold text-xs transition-colors"
              >
                {isPaused ? '▶ Resume' : '⏸ Pause'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 py-2.5 rounded-xl border border-red-500 bg-red-50 dark:bg-red-950/20 text-red-600 font-bold text-xs hover:bg-red-100 transition-colors"
              >
                🛑 Cancel
              </button>
            </div>
          )}

          {/* Scrollable Progress Log Panel */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-4 max-h-48 overflow-y-auto bg-zinc-50 dark:bg-zinc-950/50 space-y-1.5 font-mono text-[10px] text-zinc-500">
            {logs.map((log, i) => (
              <div key={i} className="truncate">{log}</div>
            ))}
            {logs.length === 0 && (
              <div className="text-center py-10">Waiting for generation to trigger...</div>
            )}
          </div>

          {/* Success actions */}
          {completedGeneration && (
            <div className="space-y-4 border-t border-zinc-200 dark:border-zinc-800 pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={triggerZipDownload}
                  className="flex-1 py-3 bg-[#0a0a0a] text-white dark:bg-white dark:text-black rounded-2xl font-bold text-xs uppercase tracking-widest hover:scale-102 transition-transform shadow-lg"
                >
                  📦 Download as ZIP Bundle
                </button>
                
                {isFileSystemAccessSupported() && (
                  <button
                    type="button"
                    onClick={triggerFileSystemSave}
                    className="flex-1 py-3 border border-zinc-200 dark:border-zinc-800 hover:border-black rounded-2xl font-bold text-xs uppercase tracking-widest hover:scale-102 transition-transform"
                  >
                    📂 Save directly to folder
                  </button>
                )}
              </div>

              {reviewMode && (
                <button
                  type="button"
                  onClick={onAdvanceToReview}
                  className="w-full py-2.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-black text-xs font-bold rounded-xl transition-colors text-center block"
                >
                  ➡️ Advance to Interactive Review Panel
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
