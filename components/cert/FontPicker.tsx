'use client';

import * as React from 'react';
import { AVAILABLE_FONTS, injectFontPreview } from '@/lib/cert/fontLoader';

interface FontPickerProps {
  value: string;
  onChange: (font: string) => void;
}

export function FontPicker({ value, onChange }: FontPickerProps) {
  const [search, setSearch] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Load preview fonts when dropdown is opened
  React.useEffect(() => {
    if (isOpen) {
      AVAILABLE_FONTS.forEach(f => injectFontPreview(f));
    }
  }, [isOpen]);

  React.useEffect(() => {
    // Inject current font anyway so it renders properly in selection preview
    if (value) {
      injectFontPreview(value);
    }
  }, [value]);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredFonts = AVAILABLE_FONTS.filter(font =>
    font.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm hover:border-black dark:hover:border-zinc-400 text-left transition-all"
        style={{ fontFamily: value }}
      >
        <span>{value || 'Select Font'}</span>
        <span className="text-zinc-400 text-xs">▼</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-full max-h-60 overflow-y-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2 shadow-2xl z-50">
          <input
            type="text"
            placeholder="Search fonts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 mb-2 focus:outline-none focus:border-black bg-zinc-50 dark:bg-zinc-900"
          />
          <div className="space-y-1">
            {filteredFonts.map((font) => (
              <button
                key={font}
                type="button"
                onClick={() => {
                  onChange(font);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors ${
                  value === font ? 'bg-zinc-100 dark:bg-zinc-900 font-bold' : ''
                }`}
                style={{ fontFamily: font }}
              >
                {font}
              </button>
            ))}
            {filteredFonts.length === 0 && (
              <div className="text-center py-4 text-xs text-zinc-400">
                No fonts found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
