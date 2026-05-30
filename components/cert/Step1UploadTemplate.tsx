'use client';

import * as React from 'react';
import { renderPdfPageFromBytes } from '@/lib/cert/pdfRenderer';

interface Step1UploadTemplateProps {
  templateFile: File | null;
  onUpload: (file: File, pdfBytes: ArrayBuffer, pageCount: number, dimensions: { width: number; height: number; canvasDataUrl: string }) => void;
  manualMode: boolean;
  onToggleManualMode: (manual: boolean) => void;
}

export function Step1UploadTemplate({
  templateFile,
  onUpload,
  manualMode,
  onToggleManualMode
}: Step1UploadTemplateProps) {
  const [dragActive, setDragActive] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const processFile = async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      setError('Please upload a valid PDF file.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const bytes = await file.arrayBuffer();
      const bytesCopy = bytes.slice(0); // Synchronous explicit copy
      const result = await renderPdfPageFromBytes(bytesCopy, 1, 1.5);
      
      onUpload(file, bytes.slice(0), result.pageCount, {
        width: result.pdfWidth,
        height: result.pdfHeight,
        canvasDataUrl: result.dataUrl
      });
    } catch (err: unknown) {
      console.error('[PDF DEBUG] Full error:', err);
      console.error('[PDF DEBUG] Error name:', (err as Error)?.name);
      console.error('[PDF DEBUG] Error message:', (err as Error)?.message);
      console.error('[PDF DEBUG] Error stack:', (err as Error)?.stack);
      setError(`Could not render PDF: ${(err as Error)?.message ?? 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-8 max-w-xl mx-auto py-10">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black tracking-tight text-[#0a0a0a] dark:text-white uppercase">Upload PDF Template</h2>
        <p className="text-sm text-zinc-500 max-w-md mx-auto">
          Drag and drop your base certificate design. All placement coordinates and fields will overlay directly on this design.
        </p>
      </div>

      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-[2.5rem] p-12 text-center transition-all flex flex-col items-center justify-center min-h-[300px] cursor-pointer ${
          dragActive
            ? 'border-black dark:border-white bg-zinc-50 dark:bg-zinc-900/30'
            : templateFile
            ? 'border-green-500/50 bg-green-50/5 dark:bg-green-950/5'
            : 'border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-zinc-400'
        }`}
        onClick={() => document.getElementById('template-file-input')?.click()}
      >
        <input
          id="template-file-input"
          type="file"
          accept=".pdf"
          onChange={handleChange}
          className="hidden"
        />

        {loading ? (
          <div className="space-y-4">
            <div className="w-12 h-12 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-mono uppercase tracking-widest text-zinc-400">Processing PDF...</p>
          </div>
        ) : templateFile ? (
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto text-green-500">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-sans font-bold text-lg dark:text-white">{templateFile.name}</p>
              <p className="text-xs text-zinc-400 font-mono mt-1">
                {(templateFile.size / 1024 / 1024).toFixed(2)} MB • PDF Document
              </p>
            </div>
            <button
              type="button"
              className="px-4 py-2 rounded-xl text-xs font-bold border border-zinc-200 hover:border-black transition-all dark:border-zinc-800"
              onClick={(e) => {
                e.stopPropagation();
                document.getElementById('template-file-input')?.click();
              }}
            >
              Replace Template
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="font-sans font-bold text-base dark:text-white">
                Drag your certificate PDF template here, or <span className="underline">browse</span>
              </p>
              <p className="text-xs text-zinc-400 mt-1 font-mono">Accepts only PDF templates</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 px-4 py-2 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 text-xs font-mono border border-red-100 dark:border-red-900/50">
            {error}
          </div>
        )}
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 flex items-center justify-between">
        <div>
          <span className="font-bold text-sm block dark:text-white">Manual Entry Mode</span>
          <span className="text-xs text-zinc-400">Skip placement and load steps to generate one off certificates quickly.</span>
        </div>
        <button
          type="button"
          onClick={() => onToggleManualMode(!manualMode)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            manualMode ? 'bg-[#0a0a0a] dark:bg-white' : 'bg-zinc-200 dark:bg-zinc-800'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-zinc-950 shadow ring-0 transition duration-200 ease-in-out ${
              manualMode ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
