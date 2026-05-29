'use client';

import * as React from 'react';
import { CertField } from '@/lib/cert/types';
import { FontPicker } from './FontPicker';
import { ColorPickerField } from './ColorPickerField';

interface FieldPropertyPanelProps {
  field: CertField;
  onUpdate: (fields: Partial<CertField>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function FieldPropertyPanel({
  field,
  onUpdate,
  onDuplicate,
  onDelete
}: FieldPropertyPanelProps) {
  // Preset handler
  const applyPreset = (presetName: string) => {
    switch (presetName) {
      case 'Elegant Script':
        onUpdate({
          fontFamily: 'Great Vibes',
          fontSize: 48,
          fontWeight: 400,
          fontStyle: 'italic',
          color: '#000000',
          letterSpacing: 0.02,
          textTransform: 'none'
        });
        break;
      case 'Bold Title':
        onUpdate({
          fontFamily: 'Cinzel',
          fontSize: 54,
          fontWeight: 700,
          fontStyle: 'normal',
          color: '#0a0a0a',
          letterSpacing: 0.08,
          textTransform: 'uppercase'
        });
        break;
      case 'Serif Formal':
        onUpdate({
          fontFamily: 'Playfair Display',
          fontSize: 28,
          fontWeight: 400,
          fontStyle: 'normal',
          color: '#555555',
          letterSpacing: 0.04,
          textTransform: 'none'
        });
        break;
      case 'Modern Clean':
        onUpdate({
          fontFamily: 'Poppins',
          fontSize: 22,
          fontWeight: 500,
          fontStyle: 'normal',
          color: '#0a0a0a',
          letterSpacing: 0.03,
          textTransform: 'none'
        });
        break;
      case 'Gold Emboss look':
        onUpdate({
          fontFamily: 'Cinzel',
          fontSize: 32,
          fontWeight: 600,
          fontStyle: 'normal',
          color: '#C5A880',
          letterSpacing: 0.15,
          textTransform: 'uppercase'
        });
        break;
      case 'Minimalist':
        onUpdate({
          fontFamily: 'Inter',
          fontSize: 14,
          fontWeight: 400,
          fontStyle: 'normal',
          color: '#555555',
          letterSpacing: 0.2,
          textTransform: 'uppercase'
        });
        break;
    }
  };

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div>
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">Active Element</span>
          <span className="font-sans font-bold text-sm dark:text-white truncate max-w-[150px] block">{field.label}</span>
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={onDuplicate}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white text-xs transition-all"
            title="Duplicate"
          >
            📋
          </button>
          <button
            type="button"
            onClick={() => onUpdate({ locked: !field.locked })}
            className={`p-1.5 rounded-lg border text-xs transition-all ${
              field.locked
                ? 'border-red-500 bg-red-50 dark:bg-red-950/20 text-red-600'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white'
            }`}
            title={field.locked ? 'Unlock' : 'Lock'}
          >
            {field.locked ? '🔒' : '🔓'}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-red-500 text-xs transition-all"
            title="Delete"
          >
            🗑
          </button>
        </div>
      </div>

      {/* Typography */}
      <div className="space-y-4">
        <h3 className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest">Typography</h3>
        
        <div className="space-y-1">
          <label className="text-xs text-zinc-400 font-sans">Font Family</label>
          <FontPicker
            value={field.fontFamily || 'Inter'}
            onChange={(font) => onUpdate({ fontFamily: font })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-zinc-400 font-sans">Font Size (px)</label>
            <input
              type="number"
              value={field.fontSize}
              min={8}
              max={120}
              onChange={(e) => onUpdate({ fontSize: Math.max(8, parseInt(e.target.value) || 12) })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:border-black"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-400 font-sans">Weight</label>
            <select
              value={field.fontWeight}
              onChange={(e) => onUpdate({ fontWeight: parseInt(e.target.value) || 400 })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:border-black"
            >
              <option value="100">Thin 100</option>
              <option value="300">Light 300</option>
              <option value="400">Regular 400</option>
              <option value="500">Medium 500</option>
              <option value="600">SemiBold 600</option>
              <option value="700">Bold 700</option>
              <option value="800">ExtraBold 800</option>
              <option value="900">Black 900</option>
            </select>
          </div>
        </div>

        {/* Styles Toggle Buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onUpdate({ fontStyle: field.fontStyle === 'italic' ? 'normal' : 'italic' })}
            className={`flex-1 py-1.5 rounded-lg border text-xs font-sans italic transition-all ${
              field.fontStyle === 'italic'
                ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-zinc-400'
            }`}
          >
            Italic
          </button>
          <button
            type="button"
            onClick={() => onUpdate({ underline: !field.underline })}
            className={`flex-1 py-1.5 rounded-lg border text-xs font-sans underline transition-all ${
              field.underline
                ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-zinc-400'
            }`}
          >
            Underline
          </button>
          <button
            type="button"
            onClick={() => onUpdate({ strikethrough: !field.strikethrough })}
            className={`flex-1 py-1.5 rounded-lg border text-xs font-sans line-through transition-all ${
              field.strikethrough
                ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-zinc-400'
            }`}
          >
            Strike
          </button>
        </div>

        {/* Transform */}
        <div className="space-y-1">
          <label className="text-xs text-zinc-400 font-sans">Transform</label>
          <div className="flex border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden text-xs">
            {['none', 'uppercase', 'lowercase', 'capitalize'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onUpdate({ textTransform: t as any })}
                className={`flex-1 py-2 capitalize transition-colors ${
                  field.textTransform === t
                    ? 'bg-black text-white dark:bg-white dark:text-black'
                    : 'bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Alignments */}
        <div className="space-y-1">
          <label className="text-xs text-zinc-400 font-sans">Alignment</label>
          <div className="flex border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden text-xs">
            {['left', 'center', 'right', 'justify'].map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => onUpdate({ textAlign: a as any })}
                className={`flex-1 py-2 capitalize transition-colors ${
                  field.textAlign === a
                    ? 'bg-black text-white dark:bg-white dark:text-black'
                    : 'bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Color & Presets */}
      <div className="space-y-4">
        <h3 className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest">Color & Presets</h3>
        <ColorPickerField
          value={field.color}
          onChange={(color) => onUpdate({ color })}
        />
      </div>

      {/* Preset quick style chips */}
      <div className="space-y-3">
        <h3 className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest">Preset Styles</h3>
        <div className="flex flex-wrap gap-1.5">
          {['Elegant Script', 'Bold Title', 'Serif Formal', 'Modern Clean', 'Gold Emboss look', 'Minimalist'].map(preset => (
            <button
              key={preset}
              type="button"
              onClick={() => applyPreset(preset)}
              className="px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[10px] font-medium hover:border-black transition-colors"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced sliders */}
      <div className="space-y-4 border-t border-zinc-200 dark:border-zinc-800 pt-4">
        <h3 className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest">Position & Size</h3>
        
        <div className="grid grid-cols-2 gap-3 font-mono text-xs">
          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">X (pt)</label>
            <input
              type="number"
              value={field.x}
              onChange={(e) => onUpdate({ x: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:border-black"
            />
          </div>
          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">Y (pt)</label>
            <input
              type="number"
              value={field.y}
              onChange={(e) => onUpdate({ y: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:border-black"
            />
          </div>
          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">Width (pt)</label>
            <input
              type="number"
              value={field.width}
              onChange={(e) => onUpdate({ width: Math.max(10, parseInt(e.target.value) || 100) })}
              className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:border-black"
            />
          </div>
          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">Height (pt)</label>
            <input
              type="number"
              value={field.height}
              onChange={(e) => onUpdate({ height: Math.max(10, parseInt(e.target.value) || 30) })}
              className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:border-black"
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Rotation</span>
            <span className="font-mono text-zinc-500">{field.rotation}°</span>
          </div>
          <input
            type="range"
            min={-180}
            max={180}
            value={field.rotation}
            onChange={(e) => onUpdate({ rotation: parseInt(e.target.value) || 0 })}
            className="w-full accent-black dark:accent-white"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Letter Spacing (em)</span>
            <span className="font-mono text-zinc-500">{field.letterSpacing}</span>
          </div>
          <input
            type="range"
            min={-0.1}
            max={0.5}
            step={0.01}
            value={field.letterSpacing}
            onChange={(e) => onUpdate({ letterSpacing: parseFloat(e.target.value) || 0 })}
            className="w-full accent-black dark:accent-white"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Opacity</span>
            <span className="font-mono text-zinc-500">{field.opacity}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={field.opacity}
            onChange={(e) => onUpdate({ opacity: parseInt(e.target.value) || 100 })}
            className="w-full accent-black dark:accent-white"
          />
        </div>
      </div>
    </div>
  );
}
