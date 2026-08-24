'use client'

import React from 'react'

interface DataPoint {
  label: string
  value: number
}

interface ObservabilityChartProps {
  title: string
  data: DataPoint[]
  color?: string
  height?: number
  unit?: string
}

export function ObservabilityChart({
  title,
  data,
  color = '#3b82f6',
  height = 140,
  unit = ''
}: ObservabilityChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl">
        <h4 className="text-xs font-mono font-bold text-[var(--fg-muted)] mb-3">{title}</h4>
        <div className="h-28 flex items-center justify-center text-xs font-mono text-[var(--fg-muted)] bg-[var(--bg-subtle)] rounded-xl">
          No historical snapshot data available yet.
        </div>
      </div>
    )
  }

  const values = data.map((d) => d.value)
  const maxVal = Math.max(...values, 1)
  const minVal = Math.min(...values, 0)
  const range = maxVal - minVal || 1

  const points = data
    .map((d, i) => {
      const x = (i / Math.max(data.length - 1, 1)) * 100
      const y = 100 - ((d.value - minVal) / range) * 80 - 10
      return `${x},${y}`
    })
    .join(' ')

  const areaPoints = `0,100 ${points} 100,100`

  return (
    <div className="p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-mono font-bold text-[var(--fg-muted)] uppercase tracking-wider">{title}</h4>
        <span className="text-xs font-mono font-bold text-[var(--fg)]">
          Latest: {values[values.length - 1]} {unit}
        </span>
      </div>

      <div className="relative w-full overflow-hidden" style={{ height: `${height}px` }}>
        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`grad-${title.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <polygon points={areaPoints} fill={`url(#grad-${title.replace(/\s+/g, '-')})`} />

          {/* Polyline line */}
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--border)] text-[10px] font-mono text-[var(--fg-muted)]">
        <span>{data[0]?.label || ''}</span>
        <span>{data[data.length - 1]?.label || ''}</span>
      </div>
    </div>
  )
}
