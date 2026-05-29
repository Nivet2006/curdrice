'use client';

import * as React from 'react';

interface ColorPickerFieldProps {
  value: string;
  onChange: (color: string) => void;
}

const COLOR_PRESETS = [
  '#000000', // Pitch Black
  '#0a0a0a', // Dark Charcoal
  '#C5A880', // Royal Gold
  '#9E2A2B', // Imperial Red
  '#1F3A60', // Classic Blue
  '#2C5E3B', // Emerald Green
  '#6D3A74', // Amethyst Purple
  '#555555'  // Slate Muted
];

export function ColorPickerField({ value, onChange }: ColorPickerFieldProps) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative w-10 h-10 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex-shrink-0">
          <input
            type="color"
            value={value || '#000000'}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full scale-125 cursor-pointer border-0 p-0"
          />
        </div>
        <input
          type="text"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1 px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-black focus:outline-none focus:border-black uppercase"
        />
      </div>

      <div>
        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block mb-1.5">Presets</span>
        <div className="flex flex-wrap gap-2">
          {COLOR_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onChange(preset)}
              className={`w-6 h-6 rounded-full border border-black/10 dark:border-white/10 hover:scale-115 active:scale-95 transition-all ${
                value.toUpperCase() === preset.toUpperCase() ? 'ring-2 ring-black dark:ring-white scale-110' : ''
              }`}
              style={{ backgroundColor: preset }}
              title={preset}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
