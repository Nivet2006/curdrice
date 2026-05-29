'use client';

import * as React from 'react';
import { CertField, CertRow } from '@/lib/cert/types';
import { generateSingleCertificate } from '@/lib/cert/certGenerator';

interface ManualEntryModeProps {
  fields: CertField[];
  templatePdfBytes: ArrayBuffer;
  onSaveToQueue: (row: CertRow) => void;
  onAddField: (label: string) => void;
  onExit: () => void;
}

export function ManualEntryMode({
  fields,
  templatePdfBytes,
  onSaveToQueue,
  onAddField,
  onExit
}: ManualEntryModeProps) {
  const [formData, setFormData] = React.useState<Record<string, string>>({});
  const [customLabel, setCustomLabel] = React.useState('');
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const updatePreview = async (currentData: Record<string, string>) => {
    try {
      const blob = await generateSingleCertificate({
        pdfBytes: templatePdfBytes,
        fields,
        rowData: currentData
      });
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    // Populate default fields structure
    const defaults = fields.reduce((acc, f) => ({ ...acc, [f.dataColumn || f.label]: '' }), {});
    setFormData(defaults);
    updatePreview(defaults);

    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [fields]);

  const handleChange = (key: string, val: string) => {
    const next = { ...formData, [key]: val };
    setFormData(next);
    updatePreview(next);
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      const blob = await generateSingleCertificate({
        pdfBytes: templatePdfBytes,
        fields,
        rowData: formData
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'certificate.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Could not render certificate.');
    } finally {
      setLoading(false);
    }
  };

  const handleQueue = () => {
    onSaveToQueue({
      id: `manual_${Date.now()}`,
      data: formData,
      status: 'pending',
      outputBlob: null,
      editedBlob: null
    });
    
    // Clear values
    const reset = fields.reduce((acc, f) => ({ ...acc, [f.dataColumn || f.label]: '' }), {});
    setFormData(reset);
    alert('Certificate added to the generation queue!');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div>
          <h3 className="font-black text-lg dark:text-white uppercase tracking-tight">Form Input Mode</h3>
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">Skip manual placements and build off labels</span>
        </div>
        <button
          type="button"
          onClick={onExit}
          className="px-3.5 py-2 border border-zinc-200 hover:border-black rounded-xl text-xs font-bold transition-all dark:border-zinc-800"
        >
          Exit Form Mode
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left: Input Form Controls */}
        <div className="space-y-6 bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 h-fit">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block border-b border-zinc-200 dark:border-zinc-800 pb-2 mb-2">
            Record Details
          </span>

          <div className="space-y-4">
            {fields.map((f) => {
              const key = f.dataColumn || f.label;
              return (
                <div key={f.id} className="space-y-1">
                  <label className="text-xs text-zinc-500 font-sans block">{f.label}</label>
                  <input
                    type="text"
                    value={formData[key] || ''}
                    onChange={(e) => handleChange(key, e.target.value)}
                    placeholder={`Enter ${f.label}`}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none"
                  />
                </div>
              );
            })}
          </div>

          {/* Add custom fields tool */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 space-y-2">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">Add New Dynamic Field</span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Field Label (e.g. Roll Number)"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (customLabel.trim()) {
                    onAddField(customLabel.trim());
                    setCustomLabel('');
                  }
                }}
                className="px-3 py-1.5 bg-[#0a0a0a] text-white dark:bg-white dark:text-black text-xs rounded-xl font-bold"
              >
                + Add
              </button>
            </div>
          </div>

          <div className="flex gap-4 border-t border-zinc-200 dark:border-zinc-800 pt-4">
            <button
              type="button"
              onClick={handleQueue}
              className="flex-1 py-2.5 border border-zinc-200 hover:border-black rounded-xl text-xs font-bold text-center"
            >
              📥 Save to queue
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={loading}
              className="flex-1 py-2.5 bg-black text-white dark:bg-white dark:text-black rounded-xl text-xs font-bold text-center hover:scale-102 transition-transform disabled:opacity-50"
            >
              {loading ? 'Generating...' : '🚀 Download Single'}
            </button>
          </div>
        </div>

        {/* Right: Live Preview Panel */}
        <div className="h-[450px] border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] overflow-hidden bg-zinc-100 dark:bg-zinc-950 flex flex-col p-4">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block mb-2">Real-time Preview</span>
          <div className="flex-1 rounded-2xl overflow-hidden bg-white relative">
            {previewUrl ? (
              <iframe
                src={`${previewUrl}#toolbar=0&navpanes=0`}
                className="w-full h-full border-0"
                title="Manual Form Preview"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-400">
                Type details to load preview...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
