'use client';

import * as React from 'react';
import { CertProject } from '@/lib/cert/types';
import { FontPicker } from './FontPicker';
import { ColorPickerField } from './ColorPickerField';

interface Step4StyleFontsProps {
  project: CertProject;
  onChangeProject: (updates: Partial<CertProject>) => void;
  headers: string[];
}

export function Step4StyleFonts({ project, onChangeProject, headers }: Step4StyleFontsProps) {
  // Token helper insertion
  const insertToken = (token: string) => {
    const nextPattern = `${project.fileNamePattern}{${token}}`;
    onChangeProject({ fileNamePattern: nextPattern });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto py-4">
      
      {/* Left: Global Styles Overrides */}
      <div className="space-y-6 bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
        <h3 className="text-sm font-bold uppercase tracking-tight dark:text-white border-b border-zinc-200 dark:border-zinc-800 pb-3">
          Global Override Settings
        </h3>

        <div className="space-y-1">
          <label className="text-xs text-zinc-400 font-sans">Global Font Family</label>
          <FontPicker
            value={project.globalFont || ''}
            onChange={(font) => onChangeProject({ globalFont: font || null })}
          />
          <span className="text-[10px] text-zinc-400 font-mono block mt-1">
            * Leaves untouched if set to blank (individual field fonts will apply).
          </span>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-zinc-400 font-sans">Global Font Color</label>
          <ColorPickerField
            value={project.globalColor || ''}
            onChange={(color) => onChangeProject({ globalColor: color || null })}
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs font-sans">
            <span>Global Font Size Multiplier</span>
            <span className="font-mono">{project.globalFontScale}x</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={2.0}
            step={0.1}
            value={project.globalFontScale}
            onChange={(e) => onChangeProject({ globalFontScale: parseFloat(e.target.value) || 1.0 })}
            className="w-full accent-black dark:accent-white"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-zinc-400 font-sans">Date Format Mapping</label>
          <select
            value={project.dateFormat}
            onChange={(e) => onChangeProject({ dateFormat: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none"
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 30/05/2026)</option>
            <option value="MM-DD-YYYY">MM-DD-YYYY (e.g. 05-30-2026)</option>
            <option value="DD Month YYYY">DD Month YYYY (e.g. 30 May 2026)</option>
            <option value="Month DD YYYY">Month DD YYYY (e.g. May 30 2026)</option>
          </select>
        </div>
      </div>

      {/* Right: Export Configurations */}
      <div className="space-y-6 bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
        <h3 className="text-sm font-bold uppercase tracking-tight dark:text-white border-b border-zinc-200 dark:border-zinc-800 pb-3">
          Export Configuration
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-zinc-400 font-sans">Output Format</label>
            <select
              value={project.exportFormat}
              onChange={(e) => onChangeProject({ exportFormat: e.target.value as any })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none"
            >
              <option value="pdf">PDF Documents</option>
              <option value="png">PNG Images</option>
              <option value="both">Both Formats</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-400 font-sans">PNG Resolution (DPI)</label>
            <select
              value={project.pngDpi}
              onChange={(e) => onChangeProject({ pngDpi: parseInt(e.target.value) as any })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none"
            >
              <option value="150">150 DPI (Fast)</option>
              <option value="300">300 DPI (Standard)</option>
              <option value="600">600 DPI (High Res)</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-zinc-400 font-sans">File Naming Pattern</label>
          <input
            type="text"
            value={project.fileNamePattern}
            onChange={(e) => onChangeProject({ fileNamePattern: e.target.value })}
            placeholder="{Name}_Certificate"
            className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:border-black"
          />
          {headers.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">Insert Token:</span>
              <div className="flex flex-wrap gap-1.5">
                {headers.map(h => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => insertToken(h)}
                    className="px-2 py-0.5 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[10px] hover:border-black transition-colors"
                  >
                    {`{${h}}`}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="p-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block mb-1">Live Filename Preview</span>
            <span className="text-xs font-bold font-sans dark:text-zinc-300 block truncate">
              {project.fileNamePattern.replace(/\{([^}]+)\}/g, 'JohnDoe')}.{project.exportFormat === 'png' ? 'png' : 'pdf'}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-zinc-400 font-sans">PDF Compression</label>
          <select
            value={project.pdfCompression}
            onChange={(e) => onChangeProject({ pdfCompression: e.target.value as any })}
            className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none"
          >
            <option value="none">None (Maximum Quality)</option>
            <option value="low">Low (Fast Output)</option>
            <option value="high">High (Compact Size)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
