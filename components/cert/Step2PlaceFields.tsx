'use client';

import * as React from 'react';
import { CertField } from '@/lib/cert/types';
import { FieldBox } from './FieldBox';
import { FieldPropertyPanel } from './FieldPropertyPanel';
import { history } from '@/lib/cert/certStore';

interface Step2PlaceFieldsProps {
  fields: CertField[];
  onChange: (fields: CertField[]) => void;
  canvasDataUrl: string;
  pdfWidth: number; // in pt
  pdfHeight: number; // in pt
  selectedFieldId: string | null;
  onSelectField: (id: string | null) => void;
}

export function Step2PlaceFields({
  fields,
  onChange,
  canvasDataUrl,
  pdfWidth,
  pdfHeight,
  selectedFieldId,
  onSelectField
}: Step2PlaceFieldsProps) {
  const [zoom, setZoom] = React.useState(100);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = React.useState(false);
  const [isPanning, setIsPanning] = React.useState(false);
  const [panStart, setPanStart] = React.useState({ x: 0, y: 0 });

  const [showGrid, setShowGrid] = React.useState(false);
  const [snapToGrid, setSnapToGrid] = React.useState(false);
  const [showRulers, setShowRulers] = React.useState(false);
  const [showLabels, setShowLabels] = React.useState(true);

  const canvasContainerRef = React.useRef<HTMLDivElement>(null);

  // Deep clone dynamic changes to history stack
  const updateFields = (updatedFields: CertField[]) => {
    history.push(updatedFields);
    onChange(updatedFields);
  };

  // Keyboard undo/redo and spacebar listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(true);
        if (canvasContainerRef.current) {
          canvasContainerRef.current.style.cursor = 'grab';
        }
      }
      
      // Ctrl+Z Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        const res = history.undo(fields);
        if (res.hasChanged) {
          onChange(res.fields);
        }
      }

      // Ctrl+Y Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        const res = history.redo(fields);
        if (res.hasChanged) {
          onChange(res.fields);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
        if (canvasContainerRef.current) {
          canvasContainerRef.current.style.cursor = 'default';
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [fields]);

  // Pan listeners when space is pressed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isSpacePressed) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      if (canvasContainerRef.current) {
        canvasContainerRef.current.style.cursor = 'grabbing';
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && isSpacePressed) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      if (canvasContainerRef.current) {
        canvasContainerRef.current.style.cursor = 'grab';
      }
    }
  };

  // Add field helper
  const addField = (type: string) => {
    const defaultLabels: Record<string, string> = {
      name: 'Recipient Name',
      school: 'Institution/School',
      date: 'Issue Date',
      roll: 'Roll Number',
      grade: 'Grade/Score',
      course: 'Course Title',
      custom: 'Custom Field'
    };

    const newField: CertField = {
      id: `field_${Date.now()}`,
      label: defaultLabels[type] || 'Text Block',
      dataColumn: type === 'custom' ? null : defaultLabels[type],
      x: Math.round(pdfWidth / 2 - 100),
      y: Math.round(pdfHeight / 2 - 20),
      width: 200,
      height: 40,
      rotation: 0,
      fontFamily: 'Inter',
      fontSize: 20,
      fontWeight: 400,
      fontStyle: 'normal',
      underline: false,
      strikethrough: false,
      color: '#0a0a0a',
      opacity: 100,
      textAlign: 'center',
      verticalAlign: 'middle',
      letterSpacing: 0,
      lineHeight: 1.2,
      textTransform: 'none',
      textShadow: null,
      zIndex: fields.length + 1,
      locked: false,
      pageIndex: 0
    };

    updateFields([...fields, newField]);
    onSelectField(newField.id);
  };

  // Duplicate active field
  const duplicateSelectedField = () => {
    if (!selectedFieldId) return;
    const active = fields.find(f => f.id === selectedFieldId);
    if (!active) return;

    const copy: CertField = {
      ...JSON.parse(JSON.stringify(active)),
      id: `field_${Date.now()}`,
      x: Math.min(pdfWidth - active.width, active.x + 15),
      y: Math.min(pdfHeight - active.height, active.y + 15),
      zIndex: fields.length + 1
    };

    updateFields([...fields, copy]);
    onSelectField(copy.id);
  };

  // Delete active field
  const deleteSelectedField = () => {
    if (!selectedFieldId) return;
    updateFields(fields.filter(f => f.id !== selectedFieldId));
    onSelectField(null);
  };

  // Individual field modification
  const handleUpdateField = (id: string, updates: Partial<CertField>) => {
    let finalUpdates = { ...updates };
    
    // Grid snapping logic
    if (snapToGrid) {
      const snapSize = 10;
      if (updates.x !== undefined) finalUpdates.x = Math.round(updates.x / snapSize) * snapSize;
      if (updates.y !== undefined) finalUpdates.y = Math.round(updates.y / snapSize) * snapSize;
      if (updates.width !== undefined) finalUpdates.width = Math.round(updates.width / snapSize) * snapSize;
      if (updates.height !== undefined) finalUpdates.height = Math.round(updates.height / snapSize) * snapSize;
    }

    const nextFields = fields.map(f => {
      if (f.id === id) {
        return { ...f, ...finalUpdates };
      }
      return f;
    });
    
    // We only push updates on completion (like mouseUp) to prevent spamming undo/redo stacks.
    // So here we perform simple assignment without pushing state.
    onChange(nextFields);
  };

  const selectedField = fields.find(f => f.id === selectedFieldId);
  const scale = zoom / 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-full min-h-[500px]">
      
      {/* Property Editor Panel (Left Sidebar) */}
      <div className="lg:col-span-1 bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 h-fit min-h-[400px]">
        {selectedField ? (
          <FieldPropertyPanel
            field={selectedField}
            onUpdate={(updates) => handleUpdateField(selectedField.id, updates)}
            onDuplicate={duplicateSelectedField}
            onDelete={deleteSelectedField}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 text-lg mb-4">
              ✏️
            </div>
            <span className="font-bold text-sm block dark:text-white">Properties Panel</span>
            <span className="text-xs text-zinc-400 max-w-[200px] mt-2 block">
              Click any element on the right preview canvas to configure its styles.
            </span>
          </div>
        )}
      </div>

      {/* Editor Canvas Panel (Right Preview Panel) */}
      <div className="lg:col-span-3 flex flex-col space-y-4">
        
        {/* Canvas Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold">
          {/* Add Fields Drops */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mr-2">Overlay:</span>
            {['name', 'school', 'date', 'course', 'custom'].map(type => (
              <button
                key={type}
                type="button"
                onClick={() => addField(type)}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-zinc-400 transition-colors uppercase text-[10px]"
              >
                + {type}
              </button>
            ))}
          </div>

          {/* Alignment Snaps & Rulers */}
          <div className="flex items-center gap-2 border-l border-zinc-200 dark:border-zinc-800 pl-4">
            <button
              type="button"
              onClick={() => setShowGrid(!showGrid)}
              className={`p-1.5 rounded-lg border text-xs ${
                showGrid ? 'bg-black text-white dark:bg-white dark:text-black border-black' : 'border-zinc-200 dark:border-zinc-800'
              }`}
              title="Show grid lines"
            >
              🌐 Grid
            </button>
            <button
              type="button"
              onClick={() => setSnapToGrid(!snapToGrid)}
              className={`p-1.5 rounded-lg border text-xs ${
                snapToGrid ? 'bg-black text-white dark:bg-white dark:text-black border-black' : 'border-zinc-200 dark:border-zinc-800'
              }`}
              title="Snap to grid"
            >
              🧲 Snap
            </button>
            <button
              type="button"
              onClick={() => setZoom(Math.max(50, zoom - 10))}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-black text-xs"
            >
              ➖
            </button>
            <span className="font-mono text-xs text-zinc-400 px-1">{zoom}%</span>
            <button
              type="button"
              onClick={() => setZoom(Math.min(200, zoom + 10))}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-black text-xs"
            >
              ➕
            </button>
            <button
              type="button"
              onClick={() => { setZoom(100); setPan({ x: 0, y: 0 }); }}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-black text-xs"
            >
              Reset
            </button>
          </div>
        </div>

        {/* The Drag & Pan Canvas Area */}
        <div
          ref={canvasContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="relative flex-1 min-h-[500px] border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] bg-zinc-100 dark:bg-zinc-950/50 overflow-hidden flex items-center justify-center"
        >
          {isSpacePressed && (
            <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/80 text-white rounded-full text-[10px] font-mono uppercase tracking-wider z-50 pointer-events-none">
              Pan Mode Active (Hold Space & Drag to Move)
            </div>
          )}

          {/* Actual Scaled Document Area */}
          <div
            style={{
              width: `${pdfWidth * scale}px`,
              height: `${pdfHeight * scale}px`,
              transform: `translate(${pan.x}px, ${pan.y}px)`,
              transition: isPanning ? 'none' : 'transform 0.15s ease'
            }}
            className="relative bg-white shadow-2xl flex-shrink-0"
            onClick={() => onSelectField(null)}
          >
            {/* Template Page Background */}
            <img
              src={canvasDataUrl}
              alt="PDF template page"
              className="absolute inset-0 w-full h-full pointer-events-none object-fill"
            />

            {/* Snap Grid overlay */}
            {showGrid && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: 'radial-gradient(var(--grid-color) 1.2px, transparent 1.2px)',
                  backgroundSize: `${20 * scale}px ${20 * scale}px`
                }}
                className="absolute inset-0 pointer-events-none"
              />
            )}

            {/* Transparent Drag Box Layer Overlay */}
            <div className="absolute inset-0">
              {fields.map((field) => (
                <FieldBox
                  key={field.id}
                  field={field}
                  isSelected={field.id === selectedFieldId}
                  onSelect={() => onSelectField(field.id)}
                  onUpdate={(updates) => handleUpdateField(field.id, updates)}
                  onDelete={deleteSelectedField}
                  scale={scale}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
