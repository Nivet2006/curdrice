'use client';

import * as React from 'react';
import { CertField, CertRow } from '@/lib/cert/types';
import { generateSingleCertificate } from '@/lib/cert/certGenerator';

interface ManualEditorProps {
  row: CertRow;
  fields: CertField[];
  templatePdfBytes: ArrayBuffer;
  onSave: (editedBlob: Blob, updatedRowData: Record<string, string>) => void;
  onClose: () => void;
}

export function ManualEditor({
  row,
  fields,
  templatePdfBytes,
  onSave,
  onClose
}: ManualEditorProps) {
  const [editedData, setEditedData] = React.useState<Record<string, string>>({ ...row.data });
  const [loading, setLoading] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  // Generate preview of changes locally
  const updatePreview = async (currentData: Record<string, string>) => {
    try {
      const blob = await generateSingleCertificate({
        pdfBytes: templatePdfBytes,
        fields,
        rowData: currentData
      });
      
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error('Failed to update editor preview:', err);
    }
  };

  React.useEffect(() => {
    updatePreview(editedData);
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, []);

  const handleChange = (key: string, val: string) => {
    const next = { ...editedData, [key]: val };
    setEditedData(next);
    updatePreview(next);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const finalBlob = await generateSingleCertificate({
        pdfBytes: templatePdfBytes,
        fields,
        rowData: editedData
      });
      onSave(finalBlob, editedData);
    } catch (err) {
      console.error(err);
      alert('Failed to save manual changes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      {/* Overlay background */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Editor slide panel container */}
      <div className="relative w-full max-w-3xl h-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col z-10">
        
        {/* Header toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h3 className="font-black text-lg dark:text-white uppercase tracking-tight">Manual Field Editor</h3>
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">Overwrite specific field attributes</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-800 hover:border-black flex items-center justify-center text-sm"
          >
            ✕
          </button>
        </div>

        {/* Content split screen */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2">
          
          {/* Left panel: editable fields inputs form */}
          <div className="p-6 overflow-y-auto space-y-4 border-r border-zinc-200 dark:border-zinc-800">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">Editable Record Fields</span>
            
            {fields.map((f) => {
              const key = f.dataColumn || f.label;
              return (
                <div key={f.id} className="space-y-1">
                  <label className="text-xs text-zinc-500 font-sans block">{f.label}</label>
                  <input
                    type="text"
                    value={editedData[key] || ''}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 focus:outline-none focus:border-black"
                  />
                </div>
              );
            })}
          </div>

          {/* Right panel: real time iframe preview */}
          <div className="p-6 bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-between">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block mb-3">Live Certificate Preview</span>
            
            <div className="flex-1 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white relative">
              {previewUrl ? (
                <iframe
                  src={`${previewUrl}#toolbar=0&navpanes=0`}
                  className="w-full h-full border-0"
                  title="Editor Preview"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-400">
                  Rendering preview...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex gap-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-black text-xs font-bold transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-2.5 bg-black text-white dark:bg-white dark:text-black rounded-xl text-xs font-bold hover:scale-102 transition-transform disabled:opacity-50"
          >
            {loading ? 'Saving Overwrite...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
