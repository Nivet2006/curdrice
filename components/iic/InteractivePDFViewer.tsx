'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as pdfjs from 'pdfjs-dist'
import { 
  PenTool, MessageSquare, Trash2, ZoomIn, ZoomOut, Check, ArrowLeft, ArrowRight, Loader2, Highlighter,
  Square, Circle, ArrowUpRight, Palette
} from 'lucide-react'

// Configure pdfjs worker using a compatible version matching package.json
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.5.136/pdf.worker.min.mjs`

export type PDFStroke = {
  type: 'stroke'
  tool: 'pen' | 'highlighter'
  points: { x: number; y: number }[]
  color: string
  width: number
}

export type PDFShape = {
  type: 'shape'
  shapeType: 'rectangle' | 'circle' | 'arrow'
  startX: number
  startY: number
  endX: number
  endY: number
  color: string
  width: number
}

export type PDFPin = {
  type: 'pin'
  x: number
  y: number
  text: string
  number: number
}

export type PDFPageAnnotations = {
  pageNumber: number
  strokes: PDFStroke[]
  shapes: PDFShape[]
  pins: PDFPin[]
}

type InteractivePDFViewerProps = {
  reportId: string
  readOnly?: boolean
  initialAnnotations?: PDFPageAnnotations[]
  onChange?: (annotations: PDFPageAnnotations[]) => void
}

const COLORS = [
  { value: '#ef4444', name: 'Red' },
  { value: '#3b82f6', name: 'Blue' },
  { value: '#22c55e', name: 'Green' },
  { value: '#eab308', name: 'Yellow' }
]

const WIDTHS = [
  { value: 2, name: 'Thin' },
  { value: 4, name: 'Medium' },
  { value: 8, name: 'Thick' }
]

export function InteractivePDFViewer({
  reportId,
  readOnly = false,
  initialAnnotations = [],
  onChange
}: InteractivePDFViewerProps) {
  const [pdf, setPdf] = useState<any>(null)
  const [numPages, setNumPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [loading, setLoading] = useState(true)
  const [scale, setScale] = useState(1.2)
  const [tool, setTool] = useState<'pan' | 'pen' | 'highlighter' | 'pin' | 'rectangle' | 'circle' | 'arrow'>('pan')
  const [activePinComment, setActivePinComment] = useState<{ x: number; y: number } | null>(null)
  const [pinText, setPinText] = useState('')
  
  // Custom tool properties
  const [selectedColor, setSelectedColor] = useState('#ef4444')
  const [lineWidth, setLineWidth] = useState(2)

  // State to hold annotations for all pages
  const [allPageAnnotations, setAllPageAnnotations] = useState<PDFPageAnnotations[]>(initialAnnotations)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const isDrawingRef = useRef(false)
  
  // Freehand stroke points
  const currentStrokeRef = useRef<{ x: number; y: number }[]>([])
  
  // Shape start/end positioning
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const currentPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  // Load PDF
  useEffect(() => {
    async function loadPdf() {
      try {
        setLoading(true)
        const loadingTask = pdfjs.getDocument(`/api/reports/${reportId}/download`)
        const pdfDoc = await loadingTask.promise
        setPdf(pdfDoc)
        setNumPages(pdfDoc.numPages)
        setLoading(false)
      } catch (err) {
        console.error('Error loading PDF:', err)
        setLoading(false)
      }
    }
    loadPdf()
  }, [reportId])

  // Render current page
  useEffect(() => {
    if (!pdf) return

    let renderTask: any = null

    async function renderPage() {
      try {
        const page = await pdf.getPage(currentPage)
        const viewport = page.getViewport({ scale })

        const canvas = canvasRef.current
        const overlay = overlayCanvasRef.current
        if (!canvas || !overlay) return

        const context = canvas.getContext('2d')
        if (!context) return

        canvas.height = viewport.height
        canvas.width = viewport.width
        overlay.height = viewport.height
        overlay.width = viewport.width

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        }

        renderTask = page.render(renderContext)
        await renderTask.promise

        // Render current annotations on overlay canvas
        drawOverlayAnnotations()
      } catch (err) {
        console.error('Error rendering page:', err)
      }
    }

    renderPage()

    return () => {
      if (renderTask) {
        renderTask.cancel()
      }
    }
  }, [pdf, currentPage, scale, allPageAnnotations])

  // Helper to get active page annotations
  const getPageAnnotations = (pageNum: number): PDFPageAnnotations => {
    const pageAnn = allPageAnnotations.find(a => a.pageNumber === pageNum)
    return pageAnn || { pageNumber: pageNum, strokes: [], shapes: [], pins: [] }
  }

  // Update annotations state and call onChange
  const updatePageAnnotations = (pageNum: number, updater: (current: PDFPageAnnotations) => PDFPageAnnotations) => {
    setAllPageAnnotations(prev => {
      const idx = prev.findIndex(a => a.pageNumber === pageNum)
      let nextList = [...prev]

      const currentAnn = idx >= 0 ? prev[idx] : { pageNumber: pageNum, strokes: [], shapes: [], pins: [] }
      const updatedAnn = updater(currentAnn)

      if (idx >= 0) {
        nextList[idx] = updatedAnn
      } else {
        nextList.push(updatedAnn)
      }

      if (onChange) {
        onChange(nextList)
      }
      return nextList
    })
  }

  // Draw arrow utility
  const drawArrow = (ctx: CanvasRenderingContext2D, startX: number, startY: number, endX: number, endY: number, color: string, width: number) => {
    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.moveTo(startX, startY)
    ctx.lineTo(endX, endY)
    ctx.stroke()
    
    // Draw arrow head
    const angle = Math.atan2(endY - startY, endX - startX)
    ctx.beginPath()
    ctx.moveTo(endX, endY)
    ctx.lineTo(endX - 12 * Math.cos(angle - Math.PI / 6), endY - 12 * Math.sin(angle - Math.PI / 6))
    ctx.lineTo(endX - 12 * Math.cos(angle + Math.PI / 6), endY - 12 * Math.sin(angle + Math.PI / 6))
    ctx.closePath()
    ctx.fillStyle = color
    ctx.fill()
  }

  // Draw overlay annotations
  const drawOverlayAnnotations = () => {
    const overlay = overlayCanvasRef.current
    if (!overlay) return
    const ctx = overlay.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, overlay.width, overlay.height)

    const pageAnn = getPageAnnotations(currentPage)

    // Render strokes
    pageAnn.strokes.forEach(stroke => {
      if (stroke.points.length < 2) return
      ctx.beginPath()
      ctx.strokeStyle = stroke.color
      ctx.lineWidth = stroke.width
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      if (stroke.tool === 'highlighter') {
        ctx.globalAlpha = 0.4
      } else {
        ctx.globalAlpha = 1.0
      }

      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
      }
      ctx.stroke()
    })

    // Reset alpha
    ctx.globalAlpha = 1.0

    // Render shapes (Rectangle, Circle, Arrow)
    const shapes = pageAnn.shapes || []
    shapes.forEach(shape => {
      ctx.strokeStyle = shape.color
      ctx.lineWidth = shape.width
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      if (shape.shapeType === 'rectangle') {
        ctx.strokeRect(shape.startX, shape.startY, shape.endX - shape.startX, shape.endY - shape.startY)
      } else if (shape.shapeType === 'circle') {
        const radiusX = Math.abs(shape.endX - shape.startX) / 2
        const radiusY = Math.abs(shape.endY - shape.startY) / 2
        const centerX = shape.startX + (shape.endX - shape.startX) / 2
        const centerY = shape.startY + (shape.endY - shape.startY) / 2
        ctx.beginPath()
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI)
        ctx.stroke()
      } else if (shape.shapeType === 'arrow') {
        drawArrow(ctx, shape.startX, shape.startY, shape.endX, shape.endY, shape.color, shape.width)
      }
    })

    // Render pins
    pageAnn.pins.forEach(pin => {
      // Draw pin circle
      ctx.beginPath()
      ctx.arc(pin.x, pin.y, 14, 0, 2 * Math.PI)
      ctx.fillStyle = '#ef4444' // red
      ctx.fill()
      ctx.lineWidth = 2
      ctx.strokeStyle = '#ffffff'
      ctx.stroke()

      // Draw number
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 12px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(String(pin.number), pin.x, pin.y)
    })
  }

  // Drawing event handlers
  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = overlayCanvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (readOnly) return
    const { x, y } = getCoordinates(e)

    if (tool === 'pin') {
      setActivePinComment({ x, y })
      return
    }

    if (tool === 'pen' || tool === 'highlighter') {
      isDrawingRef.current = true
      currentStrokeRef.current = [{ x, y }]

      // Pre-draw starting dot on canvas for immediate response
      const overlay = overlayCanvasRef.current
      if (overlay) {
        const ctx = overlay.getContext('2d')
        if (ctx) {
          ctx.beginPath()
          ctx.arc(x, y, tool === 'highlighter' ? 10 : lineWidth, 0, 2 * Math.PI)
          ctx.fillStyle = tool === 'highlighter' ? 'rgba(234, 179, 8, 0.4)' : selectedColor
          ctx.fill()
        }
      }
    } else if (['rectangle', 'circle', 'arrow'].includes(tool)) {
      isDrawingRef.current = true
      startPosRef.current = { x, y }
      currentPosRef.current = { x, y }
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || readOnly) return
    const { x, y } = getCoordinates(e)

    if (tool === 'pen' || tool === 'highlighter') {
      currentStrokeRef.current.push({ x, y })

      // Redraw whole overlay including the current stroke in progress
      drawOverlayAnnotations()

      // Draw active stroke path
      const overlay = overlayCanvasRef.current
      if (!overlay) return
      const ctx = overlay.getContext('2d')
      if (!ctx) return

      ctx.beginPath()
      ctx.strokeStyle = tool === 'highlighter' ? '#eab308' : selectedColor
      ctx.lineWidth = tool === 'highlighter' ? 20 : lineWidth
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.globalAlpha = tool === 'highlighter' ? 0.4 : 1.0

      const pts = currentStrokeRef.current
      ctx.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y)
      }
      ctx.stroke()
      ctx.globalAlpha = 1.0
    } else if (['rectangle', 'circle', 'arrow'].includes(tool)) {
      currentPosRef.current = { x, y }

      // Redraw overlay
      drawOverlayAnnotations()

      // Draw active shape preview
      const overlay = overlayCanvasRef.current
      if (!overlay) return
      const ctx = overlay.getContext('2d')
      if (!ctx) return

      ctx.strokeStyle = selectedColor
      ctx.lineWidth = lineWidth
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      const start = startPosRef.current
      if (tool === 'rectangle') {
        ctx.strokeRect(start.x, start.y, x - start.x, y - start.y)
      } else if (tool === 'circle') {
        const radiusX = Math.abs(x - start.x) / 2
        const radiusY = Math.abs(y - start.y) / 2
        const centerX = start.x + (x - start.x) / 2
        const centerY = start.y + (y - start.y) / 2
        ctx.beginPath()
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI)
        ctx.stroke()
      } else if (tool === 'arrow') {
        drawArrow(ctx, start.x, start.y, x, y, selectedColor, lineWidth)
      }
    }
  }

  const handlePointerUp = () => {
    if (!isDrawingRef.current || readOnly) return
    isDrawingRef.current = false

    if (tool === 'pen' || tool === 'highlighter') {
      if (currentStrokeRef.current.length > 1) {
        const newStroke: PDFStroke = {
          type: 'stroke',
          tool: tool as 'pen' | 'highlighter',
          points: currentStrokeRef.current,
          color: tool === 'highlighter' ? '#eab308' : selectedColor,
          width: tool === 'highlighter' ? 20 : lineWidth
        }

        updatePageAnnotations(currentPage, current => ({
          ...current,
          strokes: [...current.strokes, newStroke]
        }))
      }
      currentStrokeRef.current = []
    } else if (['rectangle', 'circle', 'arrow'].includes(tool)) {
      const start = startPosRef.current
      const end = currentPosRef.current

      // Avoid creating empty/tiny shapes on double clicks
      if (Math.abs(end.x - start.x) > 3 || Math.abs(end.y - start.y) > 3) {
        const newShape: PDFShape = {
          type: 'shape',
          shapeType: tool as 'rectangle' | 'circle' | 'arrow',
          startX: start.x,
          startY: start.y,
          endX: end.x,
          endY: end.y,
          color: selectedColor,
          width: lineWidth
        }

        updatePageAnnotations(currentPage, current => ({
          ...current,
          shapes: [...(current.shapes || []), newShape]
        }))
      }
    }
  }

  const handleAddPin = () => {
    if (!activePinComment || !pinText.trim()) return

    const pageAnn = getPageAnnotations(currentPage)
    const nextNumber = pageAnn.pins.length + 1

    const newPin: PDFPin = {
      type: 'pin',
      x: activePinComment.x,
      y: activePinComment.y,
      text: pinText.trim(),
      number: nextNumber
    }

    updatePageAnnotations(currentPage, current => ({
      ...current,
      pins: [...current.pins, newPin]
    }))

    setPinText('')
    setActivePinComment(null)
  }

  const handleClearAnnotations = () => {
    if (window.confirm('Clear all annotations on this page?')) {
      updatePageAnnotations(currentPage, current => ({
        ...current,
        strokes: [],
        shapes: [],
        pins: []
      }))
    }
  }

  const activePageAnn = getPageAnnotations(currentPage)

  return (
    <div className="flex flex-col h-[750px] bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900 border-b border-zinc-800 p-4">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage <= 1 || loading}
            className="p-2 text-zinc-400 hover:text-white disabled:opacity-30 rounded-xl bg-zinc-800 border border-zinc-700 hover:border-zinc-500 transition-all"
          >
            <ArrowLeft size={14} />
          </button>
          <span className="text-xs font-mono font-bold text-zinc-300">
            Page {currentPage} of {numPages || '...'}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, numPages))}
            disabled={currentPage >= numPages || loading}
            className="p-2 text-zinc-400 hover:text-white disabled:opacity-30 rounded-xl bg-zinc-800 border border-zinc-700 hover:border-zinc-500 transition-all"
          >
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale(prev => Math.max(prev - 0.2, 0.6))}
            disabled={loading}
            className="p-2 text-zinc-400 hover:text-white rounded-xl bg-zinc-800 border border-zinc-700 hover:border-zinc-500 transition-all"
          >
            <ZoomOut size={14} />
          </button>
          <span className="text-xs font-mono text-zinc-400">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale(prev => Math.min(prev + 0.2, 2.0))}
            disabled={loading}
            className="p-2 text-zinc-400 hover:text-white rounded-xl bg-zinc-800 border border-zinc-700 hover:border-zinc-500 transition-all"
          >
            <ZoomIn size={14} />
          </button>
        </div>

        {/* Toolbar drawing tools */}
        {!readOnly && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Color & Size Pickers */}
            <div className="flex items-center gap-1.5 bg-zinc-950/80 border border-zinc-800 px-2 py-1.5 rounded-xl">
              <Palette size={12} className="text-zinc-500" />
              <div className="flex gap-1">
                {COLORS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => setSelectedColor(c.value)}
                    className="w-3.5 h-3.5 rounded-full border border-white/20 transition-all"
                    style={{
                      backgroundColor: c.value,
                      boxShadow: selectedColor === c.value ? `0 0 8px ${c.value}` : 'none',
                      transform: selectedColor === c.value ? 'scale(1.2)' : 'scale(1)'
                    }}
                    title={c.name}
                  />
                ))}
              </div>
              <div className="h-4 w-px bg-zinc-800 mx-1" />
              <select
                value={lineWidth}
                onChange={e => setLineWidth(Number(e.target.value))}
                className="bg-transparent border-none text-[10px] font-mono text-zinc-400 outline-none cursor-pointer"
              >
                {WIDTHS.map(w => (
                  <option key={w.value} value={w.value} className="bg-zinc-900 text-white">{w.name}</option>
                ))}
              </select>
            </div>

            {/* Shape & Annotation tools */}
            <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 p-1 rounded-xl">
              <button
                onClick={() => setTool('pan')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all ${
                  tool === 'pan' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Pan
              </button>
              <button
                onClick={() => setTool('pen')}
                className={`p-1.5 rounded-lg transition-all flex items-center gap-1 text-[10px] font-mono font-bold ${
                  tool === 'pen' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                }`}
                title="Pen"
              >
                <PenTool size={12} />
              </button>
              <button
                onClick={() => setTool('highlighter')}
                className={`p-1.5 rounded-lg transition-all flex items-center gap-1 text-[10px] font-mono font-bold ${
                  tool === 'highlighter' ? 'bg-zinc-800 text-yellow-400' : 'text-zinc-400 hover:text-white'
                }`}
                title="Highlight"
              >
                <Highlighter size={12} />
              </button>
              <button
                onClick={() => setTool('rectangle')}
                className={`p-1.5 rounded-lg transition-all flex items-center gap-1 text-[10px] font-mono font-bold ${
                  tool === 'rectangle' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                }`}
                title="Rectangle"
              >
                <Square size={12} />
              </button>
              <button
                onClick={() => setTool('circle')}
                className={`p-1.5 rounded-lg transition-all flex items-center gap-1 text-[10px] font-mono font-bold ${
                  tool === 'circle' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                }`}
                title="Circle"
              >
                <Circle size={12} />
              </button>
              <button
                onClick={() => setTool('arrow')}
                className={`p-1.5 rounded-lg transition-all flex items-center gap-1 text-[10px] font-mono font-bold ${
                  tool === 'arrow' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                }`}
                title="Arrow"
              >
                <ArrowUpRight size={12} />
              </button>
              <button
                onClick={() => setTool('pin')}
                className={`p-1.5 rounded-lg transition-all flex items-center gap-1 text-[10px] font-mono font-bold ${
                  tool === 'pin' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                }`}
                title="Pin"
              >
                <MessageSquare size={12} />
              </button>
              <div className="h-4 w-px bg-zinc-800 mx-1" />
              <button
                onClick={handleClearAnnotations}
                className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors"
                title="Clear Page"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Canvas Scroll Area */}
      <div className="flex-1 overflow-auto relative p-4 flex justify-center items-start" ref={containerRef}>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-zinc-500 font-mono text-xs">
            <Loader2 className="animate-spin text-white mb-2" size={24} />
            Rendering Report PDF...
          </div>
        ) : (
          <div className="relative shadow-2xl border border-zinc-800 rounded-lg overflow-hidden select-none bg-white">
            <canvas ref={canvasRef} className="block" />
            <canvas
              ref={overlayCanvasRef}
              className={`absolute top-0 left-0 block ${
                tool === 'pan' || readOnly ? 'pointer-events-none' : 'cursor-crosshair pointer-events-auto'
              }`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            />

            {/* Comment Popover when pinning */}
            {activePinComment && (
              <div
                className="absolute bg-zinc-900 border border-zinc-800 p-4 rounded-2xl shadow-2xl z-50 w-72 text-white"
                style={{
                  top: activePinComment.y + 16,
                  left: Math.min(activePinComment.x, (overlayCanvasRef.current?.width || 300) - 290)
                }}
              >
                <p className="text-[10px] font-mono text-blue-400 uppercase tracking-widest font-bold mb-2">Drop Pin Comment</p>
                <textarea
                  value={pinText}
                  onChange={e => setPinText(e.target.value)}
                  placeholder="Type annotation description..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white outline-none focus:ring-1 focus:ring-zinc-700 h-20 resize-none font-mono mb-3"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => { setActivePinComment(null); setPinText('') }}
                    className="px-3 py-1.5 text-[10px] font-mono text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddPin}
                    disabled={!pinText.trim()}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold uppercase disabled:opacity-30"
                  >
                    <Check size={10} /> Place
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pins / comments sidebar/drawer at the bottom of the viewer */}
      {activePageAnn.pins.length > 0 && (
        <div className="bg-zinc-900 border-t border-zinc-800 p-4 max-h-[160px] overflow-y-auto">
          <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mb-2">Page Comments Pin Index</p>
          <div className="space-y-2">
            {activePageAnn.pins.map((pin, i) => (
              <div key={i} className="flex items-start gap-3 bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl">
                <span className="flex-shrink-0 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                  {pin.number}
                </span>
                <p className="text-xs text-zinc-300 font-mono leading-relaxed">{pin.text}</p>
                {!readOnly && (
                  <button
                    onClick={() => {
                      updatePageAnnotations(currentPage, current => ({
                        ...current,
                        pins: current.pins.filter(p => p.number !== pin.number)
                      }))
                    }}
                    className="ml-auto p-1 text-zinc-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
