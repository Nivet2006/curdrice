'use client';

import * as React from 'react';
import { CertField, CertProject, CertRow } from '@/lib/cert/types';
import { ManualEditor } from './ManualEditor';
import { downloadZipBundle, resolveFileName } from '@/lib/cert/zipExporter';

interface Step6ReviewProps {
  project: CertProject;
  onChangeRows: (rows: CertRow[]) => void;
}

export function Step6Review({ project, onChangeRows }: Step6ReviewProps) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [editingRow, setEditingRow] = React.useState<CertRow | null>(null);
  
  // Dynamic blob preview URL states
  const [activePreviewUrl, setActivePreviewUrl] = React.useState<string | null>(null);

  const activeRow = project.rows[activeIndex];

  // Refresh preview URL on index change
  React.useEffect(() => {
    if (activePreviewUrl) {
      URL.revokeObjectURL(activePreviewUrl);
      setActivePreviewUrl(null);
    }

    if (activeRow) {
      const activeBlob = activeRow.editedBlob || activeRow.outputBlob;
      if (activeBlob) {
        setActivePreviewUrl(URL.createObjectURL(activeBlob));
      }
    }

    return () => {
      if (activePreviewUrl) URL.revokeObjectURL(activePreviewUrl);
    };
  }, [activeIndex, project.rows]);

  // Arrow navigation triggers
  const handlePrev = () => {
    setActiveIndex(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setActiveIndex(prev => Math.min(project.rows.length - 1, prev + 1));
  };

  const markStatus = (status: CertRow['status']) => {
    const nextRows = project.rows.map((r, i) => {
      if (i === activeIndex) {
        return { ...r, status };
      }
      return r;
    });
    onChangeRows(nextRows);
    handleNext();
  };

  const handleEditorSave = (editedBlob: Blob, updatedData: Record<string, string>) => {
    const nextRows = project.rows.map((r, i) => {
      if (i === activeIndex) {
        return {
          ...r,
          editedBlob,
          data: updatedData,
          status: 'edited' as const
        };
      }
      return r;
    });
    onChangeRows(nextRows);
    setEditingRow(null);
  };

  // Bulk actions triggers
  const approveAllRemaining = () => {
    const nextRows = project.rows.map(r => {
      if (r.status === 'pending') {
        return { ...r, status: 'approved' as const };
      }
      return r;
    });
    onChangeRows(nextRows);
  };

  const downloadAll = async () => {
    const files = project.rows
      .filter(r => r.status !== 'deleted')
      .map((r, i) => {
        const activeBlob = r.editedBlob || r.outputBlob;
        const finalName = resolveFileName(project.fileNamePattern, r.data, i, 'pdf');
        return {
          name: finalName,
          blob: activeBlob!
        };
      })
      .filter(f => f.blob !== undefined && f.blob !== null);

    if (files.length === 0) return;
    await downloadZipBundle(files, 'certificates_reviewed.zip');
  };

  const downloadApproved = async () => {
    const files = project.rows
      .filter(r => r.status === 'approved' || r.status === 'edited')
      .map((r, i) => {
        const activeBlob = r.editedBlob || r.outputBlob;
        const finalName = resolveFileName(project.fileNamePattern, r.data, i, 'pdf');
        return {
          name: finalName,
          blob: activeBlob!
        };
      })
      .filter(f => f.blob !== undefined && f.blob !== null);

    if (files.length === 0) return;
    await downloadZipBundle(files, 'certificates_approved.zip');
  };

  // Render indicators count
  const approvedCount = project.rows.filter(r => r.status === 'approved').length;
  const editedCount = project.rows.filter(r => r.status === 'edited').length;
  const skippedCount = project.rows.filter(r => r.status === 'skipped').length;
  const pendingCount = project.rows.filter(r => r.status === 'pending').length;

  if (project.rows.length === 0) {
    return (
      <div className="text-center py-20 text-zinc-400">
        No generated rows to review. Please complete steps 1–5 first.
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 max-w-5xl mx-auto py-2">
      
      {/* Top Bulk Actions Panel */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-3xl text-xs font-bold">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 bg-green-500/10 text-green-600 rounded-lg">Approved: {approvedCount}</span>
          <span className="px-2.5 py-1 bg-yellow-500/10 text-yellow-600 rounded-lg">Edited: {editedCount}</span>
          <span className="px-2.5 py-1 bg-red-500/10 text-red-600 rounded-lg">Skipped: {skippedCount}</span>
          <span className="px-2.5 py-1 bg-zinc-500/10 text-zinc-400 rounded-lg">Pending: {pendingCount}</span>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={approveAllRemaining}
            disabled={pendingCount === 0}
            className="px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white rounded-xl disabled:opacity-50 transition-colors"
          >
            ✓ Approve Remaining
          </button>
          <button
            type="button"
            onClick={downloadApproved}
            className="px-3.5 py-2 bg-black text-white dark:bg-white dark:text-black hover:scale-102 rounded-xl transition-all"
          >
            📦 Download Approved ({approvedCount + editedCount})
          </button>
          <button
            type="button"
            onClick={downloadAll}
            className="px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 hover:border-black rounded-xl"
          >
            Download All
          </button>
        </div>
      </div>

      {/* Primary Preview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Large Viewer Section */}
        <div className="md:col-span-2 flex flex-col items-center justify-center space-y-4">
          <div className="w-full h-[400px] border border-zinc-200 dark:border-zinc-800 rounded-[2rem] overflow-hidden bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center relative shadow-lg">
            {activePreviewUrl ? (
              <iframe
                src={`${activePreviewUrl}#toolbar=0&navpanes=0`}
                className="w-full h-full border-0"
                title="Active Certificate Preview"
              />
            ) : (
              <div className="text-sm font-mono text-zinc-400">Loading certificate...</div>
            )}
          </div>

          {/* Nav arrows & control buttons */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handlePrev}
              disabled={activeIndex === 0}
              className="w-10 h-10 rounded-full border border-zinc-200 hover:border-black flex items-center justify-center text-sm disabled:opacity-30 dark:border-zinc-800"
            >
              ◀
            </button>
            <span className="font-mono text-xs text-zinc-500">
              Record {activeIndex + 1} of {project.rows.length}
            </span>
            <button
              type="button"
              onClick={handleNext}
              disabled={activeIndex === project.rows.length - 1}
              className="w-10 h-10 rounded-full border border-zinc-200 hover:border-black flex items-center justify-center text-sm disabled:opacity-30 dark:border-zinc-800"
            >
              ▶
            </button>
          </div>
        </div>

        {/* Status controls section */}
        {activeRow && (
          <div className="md:col-span-1 bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 h-fit space-y-4 flex flex-col">
            <div>
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">Active Item</span>
              <span className="font-sans font-bold text-sm dark:text-white truncate block">
                {activeRow.data['Name'] || activeRow.data['Recipient Name'] || Object.values(activeRow.data)[0]}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block mb-1">State:</span>
              <span className={`px-2.5 py-1 text-[10px] rounded-full uppercase tracking-wider font-mono font-bold inline-block ${
                activeRow.status === 'approved'
                  ? 'bg-green-500/10 text-green-500'
                  : activeRow.status === 'edited'
                  ? 'bg-yellow-500/10 text-yellow-500'
                  : activeRow.status === 'skipped'
                  ? 'bg-red-500/10 text-red-500'
                  : 'bg-zinc-500/10 text-zinc-400'
              }`}>
                {activeRow.status}
              </span>
            </div>

            <div className="space-y-2 border-t border-zinc-200 dark:border-zinc-800 pt-4 flex flex-col">
              <button
                type="button"
                onClick={() => markStatus('approved')}
                className="w-full py-2.5 bg-green-500 text-white font-bold rounded-xl text-xs uppercase tracking-widest hover:scale-102 transition-transform shadow-md"
              >
                ✓ Approve Row
              </button>
              <button
                type="button"
                onClick={() => setEditingRow(activeRow)}
                className="w-full py-2.5 border border-zinc-200 dark:border-zinc-800 hover:border-black rounded-xl text-xs font-bold"
              >
                ✏️ Edit Content
              </button>
              <button
                type="button"
                onClick={() => markStatus('skipped')}
                className="w-full py-2.5 border border-zinc-200 dark:border-zinc-800 hover:border-red-500 text-xs font-bold text-red-500"
              >
                ⏭ Skip Row
              </button>
              <button
                type="button"
                onClick={() => markStatus('deleted')}
                className="w-full py-2.5 border border-zinc-200 dark:border-zinc-800 hover:bg-red-50 text-xs font-bold text-zinc-400 hover:text-red-600"
              >
                🗑 Delete Row
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Horizontal Filmstrip Carousel */}
      <div className="w-full space-y-2">
        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">Queue filmstrip View</span>
        <div className="flex gap-3 overflow-x-auto pb-4 max-w-full">
          {project.rows.map((row, i) => (
            <button
              key={row.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`w-28 h-18 flex-shrink-0 rounded-xl border-2 flex flex-col justify-between p-2 text-left transition-all ${
                i === activeIndex
                  ? 'border-black dark:border-white ring-2 ring-black/10 dark:ring-white/10'
                  : 'border-zinc-200 dark:border-zinc-800 hover:border-black/50'
              }`}
            >
              <span className="text-[9px] font-bold block truncate dark:text-zinc-300">
                {row.data['Name'] || row.data['Recipient Name'] || Object.values(row.data)[0]}
              </span>
              <span className={`text-[8px] font-mono font-bold uppercase tracking-wider block self-end ${
                row.status === 'approved'
                  ? 'text-green-500'
                  : row.status === 'edited'
                  ? 'text-yellow-500'
                  : row.status === 'skipped'
                  ? 'text-red-500'
                  : 'text-zinc-400'
              }`}>
                {row.status}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Editor slide modal */}
      {editingRow && project.templatePdfBytes && (
        <ManualEditor
          row={editingRow}
          fields={project.fields}
          templatePdfBytes={project.templatePdfBytes}
          onClose={() => setEditingRow(null)}
          onSave={handleEditorSave}
        />
      )}
    </div>
  );
}
