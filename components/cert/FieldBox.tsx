'use client';

import * as React from 'react';
import { CertField } from '@/lib/cert/types';

interface FieldBoxProps {
  field: CertField;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (fields: Partial<CertField>) => void;
  onUpdateEnd?: () => void;
  onDelete: () => void;
  scale: number; // For canvas zoom factor
}

export function FieldBox({
  field,
  isSelected,
  onSelect,
  onUpdate,
  onUpdateEnd,
  onDelete,
  scale
}: FieldBoxProps) {
  const boxRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const [boxStart, setBoxStart] = React.useState({ x: 0, y: 0 });

  const [isResizing, setIsResizing] = React.useState(false);
  const [resizeHandle, setResizeHandle] = React.useState<string | null>(null);
  const [sizeStart, setSizeStart] = React.useState({ width: 0, height: 0 });

  // Handle drag selection and move start
  const handleMouseDown = (e: React.MouseEvent) => {
    if (field.locked) return;
    
    // Ignore trigger if clicking handles or close button
    const target = e.target as HTMLElement;
    if (target.closest('.resize-handle') || target.closest('.delete-btn')) {
      return;
    }

    e.preventDefault();
    onSelect();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setBoxStart({ x: field.x, y: field.y });
  };

  // Handle resizing start
  const handleResizeStart = (e: React.MouseEvent, handle: string) => {
    if (field.locked) return;
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setResizeHandle(handle);
    setDragStart({ x: e.clientX, y: e.clientY });
    setBoxStart({ x: field.x, y: field.y });
    setSizeStart({ width: field.width, height: field.height });
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const dx = (e.clientX - dragStart.x) / scale;
        const dy = (e.clientY - dragStart.y) / scale;
        
        onUpdate({
          x: Math.max(0, Math.round(boxStart.x + dx)),
          y: Math.max(0, Math.round(boxStart.y + dy))
        });
      } else if (isResizing && resizeHandle) {
        const dx = (e.clientX - dragStart.x) / scale;
        const dy = (e.clientY - dragStart.y) / scale;

        let newWidth = sizeStart.width;
        let newHeight = sizeStart.height;
        let newX = field.x;
        let newY = field.y;

        if (resizeHandle.includes('e')) {
          newWidth = Math.max(20, Math.round(sizeStart.width + dx));
        }
        if (resizeHandle.includes('s')) {
          newHeight = Math.max(15, Math.round(sizeStart.height + dy));
        }
        if (resizeHandle.includes('w')) {
          const possibleWidth = sizeStart.width - dx;
          if (possibleWidth > 20) {
            newWidth = Math.round(possibleWidth);
            newX = Math.round(boxStart.x + dx);
          }
        }
        if (resizeHandle.includes('n')) {
          const possibleHeight = sizeStart.height - dy;
          if (possibleHeight > 15) {
            newHeight = Math.round(possibleHeight);
            newY = Math.round(boxStart.y + dy);
          }
        }

        onUpdate({
          width: newWidth,
          height: newHeight,
          x: newX,
          y: newY
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeHandle(null);
      if (onUpdateEnd) {
        onUpdateEnd();
      }
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, boxStart, sizeStart, resizeHandle, scale]);

  // Apply custom typography and formatting styles
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${field.x * scale}px`,
    top: `${field.y * scale}px`,
    width: `${field.width * scale}px`,
    height: `${field.height * scale}px`,
    fontFamily: field.fontFamily || 'Inter',
    fontSize: `${field.fontSize * scale}px`,
    fontWeight: field.fontWeight,
    fontStyle: field.fontStyle,
    textDecoration: `${field.underline ? 'underline' : ''} ${field.strikethrough ? 'line-through' : ''}`.trim(),
    color: field.color,
    opacity: field.opacity / 100,
    textAlign: field.textAlign,
    letterSpacing: `${field.letterSpacing}em`,
    lineHeight: field.lineHeight,
    transform: `rotate(${field.rotation}deg)`,
    zIndex: field.zIndex,
    cursor: field.locked ? 'not-allowed' : 'move'
  };

  return (
    <div
      ref={boxRef}
      style={style}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={`group absolute select-none flex flex-col justify-center border ${
        isSelected
          ? 'border-black dark:border-white ring-2 ring-black/10 dark:ring-white/10'
          : 'border-dashed border-zinc-400 dark:border-zinc-700 hover:border-black dark:hover:border-zinc-300'
      } transition-shadow duration-150`}
    >
      {/* Label Chip */}
      <span className="absolute -top-5 left-0 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider bg-black dark:bg-white text-white dark:text-black rounded-md pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        {field.label}
      </span>

      {/* Close button */}
      {isSelected && !field.locked && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="delete-btn absolute -top-5.5 -right-5.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center hover:scale-110 active:scale-90 shadow-lg"
          title="Delete field"
        >
          ✕
        </button>
      )}

      {/* Preview Text */}
      <div className="w-full h-full overflow-hidden flex items-center px-1">
        <span className="w-full block truncate">
          {field.dataColumn ? `[${field.dataColumn}]` : field.label}
        </span>
      </div>

      {/* Resize Handles */}
      {isSelected && !field.locked && (
        <>
          {/* Edges */}
          <div onMouseDown={(e) => handleResizeStart(e, 'n')} className="resize-handle absolute top-0 left-0 w-full h-1 cursor-ns-resize" />
          <div onMouseDown={(e) => handleResizeStart(e, 's')} className="resize-handle absolute bottom-0 left-0 w-full h-1 cursor-ns-resize" />
          <div onMouseDown={(e) => handleResizeStart(e, 'w')} className="resize-handle absolute top-0 left-0 w-1 h-full cursor-ew-resize" />
          <div onMouseDown={(e) => handleResizeStart(e, 'e')} className="resize-handle absolute top-0 right-0 w-1 h-full cursor-ew-resize" />

          {/* Corners */}
          <div onMouseDown={(e) => handleResizeStart(e, 'nw')} className="resize-handle absolute -top-1 -left-1 w-2.5 h-2.5 bg-black dark:bg-white border border-white dark:border-black cursor-nwse-resize rounded-full" />
          <div onMouseDown={(e) => handleResizeStart(e, 'ne')} className="resize-handle absolute -top-1 -right-1 w-2.5 h-2.5 bg-black dark:bg-white border border-white dark:border-black cursor-nesw-resize rounded-full" />
          <div onMouseDown={(e) => handleResizeStart(e, 'sw')} className="resize-handle absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-black dark:bg-white border border-white dark:border-black cursor-nesw-resize rounded-full" />
          <div onMouseDown={(e) => handleResizeStart(e, 'se')} className="resize-handle absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-black dark:bg-white border border-white dark:border-black cursor-nwse-resize rounded-full" />
        </>
      )}
    </div>
  );
}
